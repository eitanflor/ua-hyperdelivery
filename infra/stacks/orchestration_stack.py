"""Phase 2 orchestration infra: project state machine, state projection, notifications.

See docs/decisions.md, "2026-08-27 - Step Functions + DynamoDB for Phase 2 orchestration".
Agent Task states invoke `src/orchestration/agent_invoker.py` (a Lambda that resolves and
calls the AgentCore Runtime for that agent, cross-region into us-east-1). Approval waits
persist the Step Functions task token onto the project's DynamoDB item via a
`waitForTaskToken` DynamoUpdateItem, which the console API resumes from
(`send_task_success`/`send_task_failure`) once a human decides.
"""

from pathlib import Path
from typing import Any

from aws_cdk import Duration, RemovalPolicy, Stack
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_events as events
from aws_cdk import aws_events_targets as targets
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_sns as sns
from aws_cdk import aws_stepfunctions as sfn
from aws_cdk import aws_stepfunctions_tasks as tasks
from constructs import Construct

_SRC_DIR = Path(__file__).resolve().parents[2] / "src"
_AGENTCORE_REGION = "us-east-1"  # Bedrock/AgentCore Runtime lives here, not ap-southeast-2
_RUNTIME_PREFIX = "hyperdelivery_"  # matches scripts/deploy_agent.sh's runtime_name


class OrchestrationStack(Stack):
    """The project line: state machine, projects table, Lambda tasks and notifications."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs: Any) -> None:  # noqa: ANN401
        """Provision the orchestration plane for one environment."""
        super().__init__(scope, construct_id, **kwargs)

        # Single-table design: pk=project id, sk=record type ("STATE" or "DECISION#<iso-ts>"),
        # so a project's current state and its full audit trail share one partition query.
        self.project_table = dynamodb.Table(
            self,
            "ProjectTable",
            table_name="hyperdelivery-projects",
            partition_key=dynamodb.Attribute(name="pk", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="sk", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN,
        )
        # Lists projects with a pending approval at a given station ("who owes a decision").
        self.project_table.add_global_secondary_index(
            index_name="gsi1-pending-by-station",
            partition_key=dynamodb.Attribute(name="gsi1pk", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="gsi1sk", type=dynamodb.AttributeType.STRING),
        )

        self.notifications_topic = sns.Topic(
            self,
            "DecisionNotificationsTopic",
            topic_name="hyperdelivery-decision-notifications",
        )

        # TODO(ADVA-3015): plain unbundled code asset, same as ConsoleApiStack - no
        # third-party deps (boto3 aside, which the Lambda runtime provides) installed yet.
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
            ),
            timeout=Duration.minutes(5),
            memory_size=256,
            environment={
                "AGENTCORE_REGION": _AGENTCORE_REGION,
                "AGENT_RUNTIME_PREFIX": _RUNTIME_PREFIX,
                "PROJECTS_TABLE": self.project_table.table_name,
            },
        )
        # ListAgentRuntimes has no resource-level filtering; InvokeAgentRuntime is scoped to
        # this project's runtimes only.
        self.agent_invoker.add_to_role_policy(
            iam.PolicyStatement(
                actions=["bedrock-agentcore-control:ListAgentRuntimes"], resources=["*"]
            )
        )
        self.agent_invoker.add_to_role_policy(
            iam.PolicyStatement(
                actions=["bedrock-agentcore:InvokeAgentRuntime"],
                resources=[
                    (
                        f"arn:aws:bedrock-agentcore:{_AGENTCORE_REGION}:{self.account}:"
                        f"runtime/{_RUNTIME_PREFIX}*"
                    )
                ],
            )
        )
        # Persists each agent's result as an artifact (sk=ARTIFACT#<agent>) for the
        # console API to serve back - see ProjectRepository.save_artifact.
        self.project_table.grant_write_data(self.agent_invoker)

        # TODO(ADVA-3015): same unbundled-asset caveat as agent_invoker/ConsoleApiStack.
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
            ),
            timeout=Duration.seconds(10),
            memory_size=128,
            environment={
                "PROJECTS_TABLE": "hyperdelivery-projects",
                "NOTIFICATIONS_TOPIC_ARN": self.notifications_topic.topic_arn,
            },
        )
        self.project_table.grant_write_data(self.approval_persist)
        self.notifications_topic.grant_publish(self.approval_persist)

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
        blueprint = self._agent_task("Blueprint", "blueprint")
        review = self._agent_task("Review", "review")
        showroom = self._agent_task("Showroom", "showroom")

        wait_blueprint_approval = self._approval_wait(
            "WaitForBlueprintApproval", "blueprint_approval"
        )
        wait_review_approval = self._approval_wait("WaitForReviewApproval", "review_approval")

        # A rejection fails the execution outright - no retry/resubmit loop yet (not asked
        # for by the plan; Showroom->Blueprint iteration is separate, later scope).
        rejected = sfn.Fail(self, "Rejected", cause="Approval rejected", error="Rejected")
        wait_blueprint_approval.add_catch(rejected, errors=["States.ALL"])
        wait_review_approval.add_catch(rejected, errors=["States.ALL"])

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

        return (
            distill.next(wait_blueprint_approval)
            .next(blueprint)
            .next(wait_review_approval)
            .next(review)
            .next(showroom)
            .next(mark_done)
        )

    def _agent_task(self, id_: str, agent: str) -> tasks.LambdaInvoke:
        return tasks.LambdaInvoke(
            self,
            id_,
            lambda_function=self.agent_invoker,
            payload=sfn.TaskInput.from_object(
                {
                    "agent": agent,
                    "project_id": sfn.JsonPath.string_at("$.project_id"),
                    # TODO(ADVA-3015): real artifact-grounded prompts (FSD/TDD content,
                    # retrieval, etc.) are Phase 3 scope - this is a placeholder.
                    "prompt": sfn.JsonPath.format(
                        "Project {}", sfn.JsonPath.string_at("$.project_id")
                    ),
                }
            ),
            payload_response_only=True,
            result_path=f"$.{agent}_result",
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
