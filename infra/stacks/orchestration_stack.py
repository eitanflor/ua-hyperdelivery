"""Phase 2 orchestration infra: project state machine, Lambda tasks, notifications.

See docs/decisions.md, "2026-08-27 - Step Functions + DynamoDB for Phase 2 orchestration"
and "S3 + DynamoDB: scalable single-environment-aware design" (the project table itself
moved to StorageStack, injected here). Approval waits persist the Step Functions task
token onto the project's DynamoDB item via a `waitForTaskToken` DynamoUpdateItem, which
the console API resumes from (`send_task_success`/`send_task_failure`) once a human
decides.
"""

from pathlib import Path
from typing import Any

from aws_cdk import Duration, Stack
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_events as events
from aws_cdk import aws_events_targets as targets
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_sns as sns
from aws_cdk import aws_stepfunctions as sfn
from aws_cdk import aws_stepfunctions_tasks as tasks
from constructs import Construct

from stacks.naming import REGION

_SRC_DIR = Path(__file__).resolve().parents[2] / "src"
_RUNTIME_PREFIX = "hyperdelivery_"  # matches scripts/deploy_agent.sh's runtime_name


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
                "AGENTCORE_REGION": REGION,
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
                    f"arn:aws:bedrock-agentcore:{REGION}:{self.account}:runtime/{_RUNTIME_PREFIX}*"
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
                "PROJECTS_TABLE": self.project_table.table_name,
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
