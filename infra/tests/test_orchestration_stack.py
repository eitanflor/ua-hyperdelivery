import aws_cdk as cdk
from aws_cdk.assertions import Match, Template

from stacks.orchestration_stack import OrchestrationStack


def _template() -> Template:
    app = cdk.App()
    stack = OrchestrationStack(app, "TestStack", env=cdk.Environment(region="ap-southeast-2"))
    return Template.from_stack(stack)


def test_project_table_has_pk_sk_and_gsi():
    template = _template()
    template.has_resource_properties(
        "AWS::DynamoDB::Table",
        {
            "KeySchema": [
                {"AttributeName": "pk", "KeyType": "HASH"},
                {"AttributeName": "sk", "KeyType": "RANGE"},
            ],
            "GlobalSecondaryIndexes": Match.array_with(
                [Match.object_like({"IndexName": "gsi1-pending-by-station"})]
            ),
        },
    )


def test_state_machine_is_standard_type():
    template = _template()
    template.has_resource_properties(
        "AWS::StepFunctions::StateMachine",
        {"StateMachineType": "STANDARD"},
    )


def test_state_entered_rule_targets_notifications_topic():
    template = _template()
    template.resource_count_is("AWS::Events::Rule", 1)
    template.resource_count_is("AWS::SNS::Topic", 1)
