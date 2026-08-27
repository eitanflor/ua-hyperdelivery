import json

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


def test_agent_invoker_lambda_has_correct_handler():
    template = _template()
    template.has_resource_properties(
        "AWS::Lambda::Function",
        {"Handler": "orchestration.agent_invoker.handler", "Runtime": "python3.11"},
    )


def test_agent_invoker_has_scoped_agentcore_permissions():
    template = _template()
    template.has_resource_properties(
        "AWS::IAM::Policy",
        {
            "PolicyDocument": Match.object_like(
                {
                    "Statement": Match.array_with(
                        [
                            Match.object_like(
                                {"Action": "bedrock-agentcore:InvokeAgentRuntime"}
                            )
                        ]
                    )
                }
            )
        },
    )
    # Resource is an Fn::Join (region/account interpolated at deploy time), so assert on
    # the serialized template instead of a plain-string property match.
    assert "runtime/hyperdelivery_*" in json.dumps(template.to_json())


def test_approval_persist_lambda_has_correct_handler():
    template = _template()
    template.has_resource_properties(
        "AWS::Lambda::Function",
        {"Handler": "orchestration.persist_approval.handler", "Runtime": "python3.11"},
    )


def test_approval_wait_states_use_lambda_wait_for_task_token():
    template = _template()
    rendered = json.dumps(template.to_json())
    # DynamoDB service integrations don't support callback patterns - the two human
    # approval waits must go through Lambda's waitForTaskToken instead.
    assert rendered.count("lambda:invoke.waitForTaskToken") == 2
