"""Console API infra: Lambda (FastAPI via Mangum) fronted by an HTTP API.

See docs/decisions.md, "2026-08-27 - Console backend as a standalone FastAPI service,
not another AgentCore Runtime". Deliberately separate from OrchestrationStack: different
lifecycle, and its own least-privilege execution role (scoped to the project table only,
never Bedrock) rather than reusing the AgentCore runtime role.

The Lambda's code asset is a plain zip of src/ today - no dependency bundling step yet
(fastapi/mangum/etc. would need a Docker-bundled PythonFunction or a dependencies layer
before this is actually deployable). Left as a TODO since deploy is blocked on IAM access
regardless - swap in real bundling without changing the surrounding shape.
"""

from pathlib import Path
from typing import Any

from aws_cdk import CfnOutput, Duration, Stack
from aws_cdk import aws_apigatewayv2 as apigwv2
from aws_cdk import aws_apigatewayv2_integrations as apigwv2_integrations
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_lambda as lambda_
from constructs import Construct

_SRC_DIR = Path(__file__).resolve().parents[2] / "src"


class ConsoleApiStack(Stack):
    """The console API Lambda and the HTTP API in front of it."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs: Any) -> None:  # noqa: ANN401
        """Provision the console API for one environment."""
        super().__init__(scope, construct_id, **kwargs)

        # Imported, not owned here - the table is managed by OrchestrationStack (or, today,
        # the manually-created table pending `cdk import`). Avoids a premature cross-stack
        # dependency before that reconciliation happens.
        project_table = dynamodb.Table.from_table_name(
            self, "ProjectTable", "hyperdelivery-projects"
        )

        # TODO(ADVA-3015): replace with a Docker-bundled PythonFunction (or a dependencies
        # layer) once IAM access allows a real deploy - this asset has no third-party
        # packages installed (fastapi/mangum/etc.) yet.
        self.function = lambda_.Function(
            self,
            "ConsoleApiFunction",
            function_name="hyperdelivery-console-api",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="api.lambda_handler.handler",
            code=lambda_.Code.from_asset(
                str(_SRC_DIR),
                exclude=["agent_runtime", "providers", "tools", "mcp_clients", "__pycache__"],
            ),
            timeout=Duration.seconds(29),  # API Gateway's own proxy timeout ceiling
            memory_size=512,
            environment={
                "PROJECTS_TABLE": project_table.table_name,
                "ORCHESTRATION_REGION": self.region,
                "LOG_LEVEL": "INFO",
            },
        )
        project_table.grant_read_write_data(self.function)

        self.http_api = apigwv2.HttpApi(
            self,
            "ConsoleHttpApi",
            api_name="hyperdelivery-console-api",
            default_integration=apigwv2_integrations.HttpLambdaIntegration(
                "ConsoleApiIntegration", handler=self.function
            ),
        )

        CfnOutput(self, "ConsoleApiUrl", value=self.http_api.api_endpoint)
