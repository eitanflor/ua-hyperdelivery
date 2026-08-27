"""Phase 2 orchestration infra: project state machine, state projection, notifications.

See docs/decisions.md, "2026-08-27 - Step Functions + DynamoDB for Phase 2 orchestration".
The state machine's Task states are Pass placeholders until the per-agent invocation
Lambdas exist - swap them in without changing the surrounding shape (they mark where
`waitForTaskToken` human-approval waits attach too).
"""

from aws_cdk import RemovalPolicy, Stack
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_events as events
from aws_cdk import aws_events_targets as targets
from aws_cdk import aws_sns as sns
from aws_cdk import aws_stepfunctions as sfn
from constructs import Construct


class OrchestrationStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
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

        self.state_machine = sfn.StateMachine(
            self,
            "ProjectStateMachine",
            state_machine_name="hyperdelivery-project-line",
            state_machine_type=sfn.StateMachineType.STANDARD,
            definition_body=sfn.DefinitionBody.from_chainable(self._build_definition()),
        )

        events.Rule(
            self,
            "StateEnteredRule",
            event_pattern=events.EventPattern(
                source=["aws.states"],
                detail_type=["Step Functions Execution Status Change"],
                detail={"stateMachineArn": [self.state_machine.state_machine_arn]},
            ),
            targets=[targets.SnsTopic(self.notifications_topic)],
        )

    def _build_definition(self) -> sfn.IChainable:
        distill = sfn.Pass(self, "Distill")
        wait_blueprint_approval = sfn.Pass(self, "WaitForBlueprintApproval")
        blueprint = sfn.Pass(self, "Blueprint")
        wait_review_approval = sfn.Pass(self, "WaitForReviewApproval")
        review = sfn.Pass(self, "Review")
        showroom = sfn.Pass(self, "Showroom")

        return (
            distill.next(wait_blueprint_approval)
            .next(blueprint)
            .next(wait_review_approval)
            .next(review)
            .next(showroom)
        )
