"""Phase 2 orchestration infra: project state machine, Lambda tasks, notifications.

See docs/decisions.md, "2026-08-27 - Step Functions + DynamoDB for Phase 2 orchestration"
and "S3 + DynamoDB: scalable single-environment-aware design" (the project table itself
moved to StorageStack, injected here). Approval waits persist the Step Functions task
token onto the project's DynamoDB item via a `waitForTaskToken` DynamoUpdateItem, which
the console API resumes from (`send_task_success`/`send_task_failure`) once a human
decides.

Both Lambdas' code assets are Docker-bundled (ADVA-3015) via `stacks.lambda_bundling`,
shared with `ConsoleApiStack` - `agent_invoker` imports `ProjectRepository`, which pulls
in `core.domain.project`'s pydantic models, so it needs real third-party deps installed,
not just the bare `src/` tree.
"""

from pathlib import Path
from typing import Any

from aws_cdk import CfnOutput, Duration, RemovalPolicy, Stack
from aws_cdk import aws_apigatewayv2 as apigwv2
from aws_cdk import aws_apigatewayv2_integrations as apigwv2_integrations
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_events as events
from aws_cdk import aws_events_targets as targets
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_sns as sns
from aws_cdk import aws_stepfunctions as sfn
from aws_cdk import aws_stepfunctions_tasks as tasks
from constructs import Construct

from stacks import lambda_bundling
from stacks.naming import REGION

_SRC_DIR = Path(__file__).resolve().parents[2] / "src"
_RUNTIME_PREFIX = "hyperdelivery_"  # matches scripts/deploy_agent.sh's runtime_name
# Must match infrastructure.repositories.connections_repository.CONNECTION_ID_INDEX
# exactly - not shared code, the CDK app and src/ are separate Python projects (see
# AGENTS.md).
_WS_CONNECTIONS_CONNECTION_INDEX = "ws-connections-by-connection"


class OrchestrationStack(Stack):
    """The project line: state machine, Lambda tasks and notifications."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        project_table: dynamodb.ITable,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        """Provision the orchestration plane for one environment.

        `project_table` is owned by StorageStack, not created here - see that module's
        docstring for why the two are split.
        """
        super().__init__(scope, construct_id, **kwargs)
        self.project_table = project_table

        lambda_bundling.export_lambda_requirements()

        self.notifications_topic = sns.Topic(
            self,
            "DecisionNotificationsTopic",
            topic_name="hyperdelivery-decision-notifications",
        )

        # Docker-bundled (ADVA-3015, fixed): imports `ProjectRepository` -> pydantic
        # domain models, so it needs real third-party deps, not just boto3.
        self.agent_invoker = lambda_.Function(
            self,
            "AgentInvokerFunction",
            function_name="hyperdelivery-agent-invoker",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="orchestration.agent_invoker.handler",
            code=lambda_.Code.from_asset(
                str(_SRC_DIR),
                exclude=[
                    "api",
                    "agent_runtime",
                    "providers",
                    "tools",
                    "mcp_clients",
                    "__pycache__",
                ],
                bundling=lambda_bundling.bundling_options(),
            ),
            timeout=Duration.minutes(5),
            memory_size=256,
            environment={
                "AGENTCORE_REGION": REGION,
                "AGENT_RUNTIME_PREFIX": _RUNTIME_PREFIX,
                "PROJECTS_TABLE": self.project_table.table_name,
            },
        )
        # ListAgentRuntimes has no resource-level filtering; InvokeAgentRuntime is scoped to
        # this project's runtimes only. The IAM action lives under the `bedrock-agentcore`
        # namespace even though the CLI/SDK group the control-plane call under
        # `bedrock-agentcore-control` - verified live: `bedrock-agentcore-control:*` denied
        # it, `bedrock-agentcore:ListAgentRuntimes` is what the service actually checks.
        self.agent_invoker.add_to_role_policy(
            iam.PolicyStatement(actions=["bedrock-agentcore:ListAgentRuntimes"], resources=["*"])
        )
        self.agent_invoker.add_to_role_policy(
            iam.PolicyStatement(
                actions=["bedrock-agentcore:InvokeAgentRuntime"],
                resources=[
                    f"arn:aws:bedrock-agentcore:{REGION}:{self.account}:runtime/{_RUNTIME_PREFIX}*"
                ],
            )
        )
        # Artifact versioning reads the latest version before writing the next one.
        self.project_table.grant_read_write_data(self.agent_invoker)

        # Project-first keys allow strongly consistent reads before the first broadcast.
        # The V2 logical ID replaces the prior key schema without an in-place GSI swap.
        self.connections_table = dynamodb.Table(
            self,
            "WebSocketConnectionsTableV2",
            partition_key=dynamodb.Attribute(name="project_id", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="connection_id", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            time_to_live_attribute="expires_at",
            removal_policy=RemovalPolicy.DESTROY,
        )
        self.connections_table.add_global_secondary_index(
            index_name=_WS_CONNECTIONS_CONNECTION_INDEX,
            partition_key=dynamodb.Attribute(
                name="connection_id", type=dynamodb.AttributeType.STRING
            ),
        )

        ws_connect_fn = lambda_.Function(
            self,
            "WebSocketConnectFunction",
            function_name="hyperdelivery-ws-connect",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="orchestration.ws_connect.handler",
            code=lambda_.Code.from_asset(
                str(_SRC_DIR),
                exclude=[
                    "api",
                    "agent_runtime",
                    "providers",
                    "tools",
                    "mcp_clients",
                    "__pycache__",
                ],
                bundling=lambda_bundling.bundling_options(),
            ),
            timeout=Duration.seconds(10),
            memory_size=128,
            environment={"CONNECTIONS_TABLE": self.connections_table.table_name},
        )
        self.connections_table.grant_write_data(ws_connect_fn)

        ws_disconnect_fn = lambda_.Function(
            self,
            "WebSocketDisconnectFunction",
            function_name="hyperdelivery-ws-disconnect",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="orchestration.ws_disconnect.handler",
            code=lambda_.Code.from_asset(
                str(_SRC_DIR),
                exclude=[
                    "api",
                    "agent_runtime",
                    "providers",
                    "tools",
                    "mcp_clients",
                    "__pycache__",
                ],
                bundling=lambda_bundling.bundling_options(),
            ),
            timeout=Duration.seconds(10),
            memory_size=128,
            environment={"CONNECTIONS_TABLE": self.connections_table.table_name},
        )
        # Disconnect resolves the project through the connection-id GSI before deleting.
        self.connections_table.grant_read_write_data(ws_disconnect_fn)

        self.websocket_api = apigwv2.WebSocketApi(
            self,
            "ConsoleWebSocketApi",
            api_name="hyperdelivery-console-ws",
            connect_route_options=apigwv2.WebSocketRouteOptions(
                integration=apigwv2_integrations.WebSocketLambdaIntegration(
                    "ConnectIntegration", ws_connect_fn
                )
            ),
            disconnect_route_options=apigwv2.WebSocketRouteOptions(
                integration=apigwv2_integrations.WebSocketLambdaIntegration(
                    "DisconnectIntegration", ws_disconnect_fn
                )
            ),
        )
        self.websocket_stage = apigwv2.WebSocketStage(
            self,
            "ConsoleWebSocketStage",
            web_socket_api=self.websocket_api,
            stage_name="live",
            auto_deploy=True,
        )
        CfnOutput(self, "ConsoleWebSocketUrl", value=self.websocket_stage.url)

        # The invoker reads watchers and removes connections that return HTTP 410.
        self.connections_table.grant_read_write_data(self.agent_invoker)
        self.agent_invoker.add_to_role_policy(
            iam.PolicyStatement(
                actions=["execute-api:ManageConnections"],
                resources=[
                    (
                        f"arn:aws:execute-api:{REGION}:{self.account}:"
                        f"{self.websocket_api.api_id}/{self.websocket_stage.stage_name}/POST/@connections/*"
                    )
                ],
            )
        )
        self.agent_invoker.add_environment("CONNECTIONS_TABLE", self.connections_table.table_name)
        self.agent_invoker.add_environment("WEBSOCKET_ENDPOINT", self.websocket_stage.callback_url)

        # Docker-bundled (ADVA-3015, fixed) via the same shared recipe as agent_invoker -
        # this one didn't strictly need it (no pydantic import), but keeping both Lambdas
        # on the same asset-building path avoids one silently drifting from the other.
        self.approval_persist = lambda_.Function(
            self,
            "ApprovalPersistFunction",
            function_name="hyperdelivery-approval-persist",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="orchestration.persist_approval.handler",
            code=lambda_.Code.from_asset(
                str(_SRC_DIR),
                exclude=[
                    "api",
                    "agent_runtime",
                    "providers",
                    "tools",
                    "mcp_clients",
                    "__pycache__",
                ],
                bundling=lambda_bundling.bundling_options(),
            ),
            timeout=Duration.seconds(10),
            memory_size=128,
            environment={
                "PROJECTS_TABLE": self.project_table.table_name,
                "NOTIFICATIONS_TOPIC_ARN": self.notifications_topic.topic_arn,
            },
        )
        self.project_table.grant_write_data(self.approval_persist)
        self.notifications_topic.grant_publish(self.approval_persist)

        # Same wait-and-resume shape as approval_persist, but for Distill's elicitation
        # loop (config/agents/distill.yaml prefers ask_clarifying_questions over drafting
        # a placeholder spec) rather than a gate decision - see docs/decisions.md.
        self.question_persist = lambda_.Function(
            self,
            "QuestionPersistFunction",
            function_name="hyperdelivery-question-persist",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="orchestration.persist_question.handler",
            code=lambda_.Code.from_asset(
                str(_SRC_DIR),
                exclude=[
                    "api",
                    "agent_runtime",
                    "providers",
                    "tools",
                    "mcp_clients",
                    "__pycache__",
                ],
                bundling=lambda_bundling.bundling_options(),
            ),
            timeout=Duration.seconds(10),
            memory_size=128,
            environment={
                "PROJECTS_TABLE": self.project_table.table_name,
                "NOTIFICATIONS_TOPIC_ARN": self.notifications_topic.topic_arn,
            },
        )
        self.project_table.grant_write_data(self.question_persist)
        self.notifications_topic.grant_publish(self.question_persist)

        self.state_machine = sfn.StateMachine(
            self,
            "ProjectStateMachine",
            state_machine_name="hyperdelivery-project-line",
            state_machine_type=sfn.StateMachineType.STANDARD,
            definition_body=sfn.DefinitionBody.from_chainable(self._build_definition()),
        )

        # "Who owes a decision" notifications are published directly by approval_persist
        # (it runs at exactly the moment a wait begins) - Step Functions' own EventBridge
        # integration only emits execution-level events (start/success/failure), never
        # per-state entry, so it can't drive that. This rule covers the execution-level
        # signal instead (e.g. alerting on a failed/aborted run).
        events.Rule(
            self,
            "ExecutionStatusRule",
            event_pattern=events.EventPattern(
                source=["aws.states"],
                detail_type=["Step Functions Execution Status Change"],
                detail={"stateMachineArn": [self.state_machine.state_machine_arn]},
            ),
            targets=[targets.SnsTopic(self.notifications_topic)],
        )

    def _build_definition(self) -> sfn.IChainable:
        distill = self._agent_task("Distill", "distill")
        blueprint = self._agent_task("Blueprint", "blueprint", predecessors=["distill"])
        review = self._agent_task("Review", "review", predecessors=["distill", "blueprint"])
        showroom = self._agent_task(
            "Showroom", "showroom", predecessors=["distill", "blueprint", "review"]
        )

        wait_blueprint_approval = self._approval_wait(
            "WaitForBlueprintApproval", "blueprint_approval"
        )
        wait_review_approval = self._approval_wait("WaitForReviewApproval", "review_approval")
        wait_showroom_approval = self._approval_wait("WaitForShowroomApproval", "showroom_approval")

        # A rejection fails the execution outright - no retry/resubmit loop yet (not asked
        # for by the plan; Showroom->Blueprint iteration is separate, later scope).
        rejected = sfn.Fail(self, "Rejected", cause="Approval rejected", error="Rejected")
        wait_blueprint_approval.add_catch(rejected, errors=["States.ALL"])
        wait_review_approval.add_catch(rejected, errors=["States.ALL"])
        wait_showroom_approval.add_catch(rejected, errors=["States.ALL"])

        # Closes the loop with core.domain.project.Station.DONE - Showroom finishing is not
        # itself a DynamoDB write, so nothing else would ever advance the station past
        # SHOWROOM otherwise.
        mark_done = tasks.DynamoUpdateItem(
            self,
            "MarkDone",
            table=self.project_table,
            key={
                "pk": tasks.DynamoAttributeValue.from_string(
                    sfn.JsonPath.format("PROJECT#{}", sfn.JsonPath.string_at("$.project_id"))
                ),
                "sk": tasks.DynamoAttributeValue.from_string("STATE"),
            },
            update_expression="SET station = :station REMOVE gsi1pk, gsi1sk",
            expression_attribute_values={
                ":station": tasks.DynamoAttributeValue.from_string("done"),
            },
            result_path="$.done",
        )

        after_distill_drafts = (
            wait_blueprint_approval.next(blueprint)
            .next(wait_review_approval)
            .next(review)
            .next(wait_showroom_approval)
            .next(showroom)
            .next(mark_done)
        )

        # Distill prefers ask_clarifying_questions over drafting a placeholder spec
        # (config/agents/distill.yaml) - agent_invoker.py surfaces that as
        # `$.distill_result.status != "drafted"` instead of failing the execution. Loop
        # back to Distill once a human answers, rather than treating it as terminal.
        wait_for_distill_answer = self._elicitation_wait("WaitForDistillAnswer")
        distill_drafted = sfn.Choice(self, "DistillDrafted?")
        distill_drafted.when(
            sfn.Condition.string_equals("$.distill_result.status", "drafted"),
            after_distill_drafts,
        ).otherwise(wait_for_distill_answer.next(distill))

        return distill.next(distill_drafted)

    def _agent_task(
        self, id_: str, agent: str, predecessors: list[str] | None = None
    ) -> tasks.LambdaInvoke:
        """One station's Lambda task, grounded in the project's brief and its predecessors.

        `$.message` is the project's own brief (`CreateProjectRequest.message`, threaded
        through by `StateMachineClient.start_execution`); each name in `predecessors`
        pulls that station's already-threaded `$.<name>_result` (via `result_path` below)
        into the prompt too - the same grounding `api.routers.projects._build_prompt`
        builds for the local-dev path, done here via Step Functions JSONPath instead of a
        DynamoDB refetch (see docs/decisions.md, "placeholder prompts").
        """
        format_string = "{}"
        format_args = [sfn.JsonPath.string_at("$.message")]
        for predecessor in predecessors or []:
            format_string += f"\n\n# {predecessor}'s output\n{{}}"
            format_args.append(
                sfn.JsonPath.json_to_string(
                    sfn.JsonPath.object_at(f"$.{predecessor}_result.result")
                )
            )
        return tasks.LambdaInvoke(
            self,
            id_,
            lambda_function=self.agent_invoker,
            payload=sfn.TaskInput.from_object(
                {
                    "agent": agent,
                    "project_id": sfn.JsonPath.string_at("$.project_id"),
                    "prompt": sfn.JsonPath.format(format_string, *format_args),
                }
            ),
            payload_response_only=True,
            result_path=f"$.{agent}_result",
        )

    def _elicitation_wait(self, id_: str) -> tasks.LambdaInvoke:
        """Pause the execution on a task token while Distill waits for an answer.

        Same shape as `_approval_wait`, but resumed by `POST /projects/{id}/answer`
        (api.routers.projects.answer_question) rather than a gate decision - its
        send_task_success output becomes the next `$.message` directly.
        """
        return tasks.LambdaInvoke(
            self,
            id_,
            lambda_function=self.question_persist,
            integration_pattern=sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
            payload=sfn.TaskInput.from_object(
                {
                    "project_id": sfn.JsonPath.string_at("$.project_id"),
                    "distill_result": sfn.JsonPath.object_at("$.distill_result"),
                    "message": sfn.JsonPath.string_at("$.message"),
                    "task_token": sfn.JsonPath.task_token,
                }
            ),
            result_path="$.message",
        )

    def _approval_wait(self, id_: str, station: str) -> tasks.LambdaInvoke:
        """Pause the execution on a task token while a human decides.

        Persists the task token and the gsi1 pending-lookup attributes onto the project's
        STATE item first, so `list_pending` picks the project up immediately. Resumed by
        the console API via send_task_success/send_task_failure - see
        api/routers/projects.py:submit_decision.
        """
        return tasks.LambdaInvoke(
            self,
            id_,
            lambda_function=self.approval_persist,
            integration_pattern=sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
            payload=sfn.TaskInput.from_object(
                {
                    "project_id": sfn.JsonPath.string_at("$.project_id"),
                    "station": station,
                    "task_token": sfn.JsonPath.task_token,
                }
            ),
            result_path="$.approval",
        )
