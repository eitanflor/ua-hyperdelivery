"""Console API infra: Lambda (FastAPI via Mangum) fronted by an HTTP API.

See docs/decisions.md, "2026-08-27 - Console backend as a standalone FastAPI service,
not another AgentCore Runtime". Deliberately separate from OrchestrationStack: different
lifecycle, and its own least-privilege execution role (scoped to the project table only,
never Bedrock) rather than reusing the AgentCore runtime role.

The Lambda's code asset is Docker-bundled (ADVA-3015) via `stacks.lambda_bundling`, shared
with `OrchestrationStack`'s Lambdas.
"""

from pathlib import Path
from typing import Any

from aws_cdk import CfnOutput, Duration, Stack
from aws_cdk import aws_apigatewayv2 as apigwv2
from aws_cdk import aws_apigatewayv2_integrations as apigwv2_integrations
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_stepfunctions as sfn
from constructs import Construct

from stacks import lambda_bundling
from stacks.naming import resource_name

_SRC_DIR = Path(__file__).resolve().parents[2] / "src"


class ConsoleApiStack(Stack):
    """The console API Lambda and the HTTP API in front of it."""

    def __init__(  # noqa: PLR0913, PLR0917 - one typed cross-stack ref per upstream stack, inherent to CDK's constructor-injection pattern
        self,
        scope: Construct,
        construct_id: str,
        env_name: str,
        project_table: dynamodb.ITable,
        connections_table: dynamodb.ITable,
        state_machine: sfn.IStateMachine,
        console_ui_url: str,
        entra_tenant_id: str,
        entra_client_id: str,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        """Provision the console API for one environment.

        Infrastructure dependencies are explicit cross-stack references. Entra values
        come from the deployment environment, not the frontend's local `.env` file.
        """
        super().__init__(scope, construct_id, **kwargs)

        lambda_bundling.export_lambda_requirements()

        # The API imports providers except for the agent-only Strands adapter.
        self.function = lambda_.Function(
            self,
            "ConsoleApiFunction",
            function_name=resource_name(env_name, "console-api"),
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="api.lambda_handler.handler",
            code=lambda_.Code.from_asset(
                str(_SRC_DIR),
                exclude=[
                    "agent_runtime",
                    "providers/agents",
                    "tools",
                    "mcp_clients",
                    "__pycache__",
                ],
                bundling=lambda_bundling.bundling_options(),
            ),
            timeout=Duration.seconds(29),  # API Gateway's own proxy timeout ceiling
            memory_size=512,
            environment={
                "PROJECTS_TABLE": project_table.table_name,
                "CONNECTIONS_TABLE": connections_table.table_name,
                "STATE_MACHINE_ARN": state_machine.state_machine_arn,
                # Environment selects local or Step Functions orchestration.
                "ENVIRONMENT": env_name,
                "CORS_ORIGINS": f"{console_ui_url},http://localhost:5173",
                "ENTRA_TENANT_ID": entra_tenant_id,
                "ENTRA_CLIENT_ID": entra_client_id,
                # AWS_REGION is a Lambda-reserved env var (set automatically by the
                # runtime) - Settings.aws_region reads it without this stack setting it.
                "LOG_LEVEL": "INFO",
            },
        )
        project_table.grant_read_write_data(self.function)
        connections_table.grant_read_write_data(self.function)
        state_machine.grant_start_execution(self.function)
        state_machine.grant_task_response(self.function)

        self.http_api = apigwv2.HttpApi(
            self,
            "ConsoleHttpApi",
            api_name=resource_name(env_name, "console-api"),
            default_integration=apigwv2_integrations.HttpLambdaIntegration(
                "ConsoleApiIntegration", handler=self.function
            ),
        )

        CfnOutput(self, "ConsoleApiUrl", value=self.http_api.api_endpoint)
