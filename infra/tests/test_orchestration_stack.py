import json

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template

from stacks.orchestration_stack import OrchestrationStack
from stacks.storage_stack import StorageStack


def _template() -> Template:
    app = cdk.App()
    env = cdk.Environment(region="us-east-1")
    storage = StorageStack(app, "TestStorageStack", "test", env=env)
    stack = OrchestrationStack(app, "TestStack", project_table=storage.project_table, env=env)
    return Template.from_stack(stack)


def test_state_machine_is_standard_type() -> None:
    template = _template()
    template.has_resource_properties(
        "AWS::StepFunctions::StateMachine",
        {"StateMachineType": "STANDARD"},
    )


def test_state_entered_rule_targets_notifications_topic() -> None:
    template = _template()
    template.resource_count_is("AWS::Events::Rule", 1)
    template.resource_count_is("AWS::SNS::Topic", 1)


def test_agent_invoker_lambda_has_correct_handler() -> None:
    template = _template()
    template.has_resource_properties(
        "AWS::Lambda::Function",
        {"Handler": "orchestration.agent_invoker.handler", "Runtime": "python3.11"},
    )


def test_agent_invoker_has_scoped_agentcore_permissions() -> None:
    template = _template()
    template.has_resource_properties(
        "AWS::IAM::Policy",
        {
            "PolicyDocument": Match.object_like(
                {
                    "Statement": Match.array_with(
                        [Match.object_like({"Action": "bedrock-agentcore:InvokeAgentRuntime"})]
                    )
                }
            )
        },
    )
    # Resource is an Fn::Join (region/account interpolated at deploy time), so assert on
    # the serialized template instead of a plain-string property match.
    assert "runtime/hyperdelivery_*" in json.dumps(template.to_json())


def test_approval_persist_lambda_has_correct_handler() -> None:
    template = _template()
    template.has_resource_properties(
        "AWS::Lambda::Function",
        {"Handler": "orchestration.persist_approval.handler", "Runtime": "python3.11"},
    )


def test_agent_invoker_can_persist_artifacts_to_the_project_table() -> None:
    template = _template()
    template.has_resource_properties(
        "AWS::Lambda::Function",
        {
            "Handler": "orchestration.agent_invoker.handler",
            "Environment": {"Variables": Match.object_like({"PROJECTS_TABLE": Match.any_value()})},
        },
    )
    template.has_resource_properties(
        "AWS::IAM::Policy",
        {
            "PolicyDocument": Match.object_like(
                {
                    "Statement": Match.array_with(
                        [Match.object_like({"Action": Match.array_with(["dynamodb:PutItem"])})]
                    )
                }
            )
        },
    )


def test_approval_persist_can_publish_notifications() -> None:
    template = _template()
    template.has_resource_properties(
        "AWS::IAM::Policy",
        {
            "PolicyDocument": Match.object_like(
                {"Statement": Match.array_with([Match.object_like({"Action": "sns:Publish"})])}
            )
        },
    )


def test_approval_wait_states_use_lambda_wait_for_task_token() -> None:
    definition = _state_machine_definition(_template())
    # DynamoDB service integrations don't support callback patterns - the three human
    # approval waits, plus Distill's elicitation wait (same wait-for-task-token shape,
    # for "Distill needs an answer" instead of a gate decision), all go through Lambda's
    # waitForTaskToken instead.
    assert definition.count("lambda:invoke.waitForTaskToken") == 4


def test_review_is_followed_by_a_human_gate_before_showroom() -> None:
    # Review hands blocker findings to a coding agent and opens pull requests, so a person
    # signs that off before the demo is built - see docs/decisions.md.
    definition = _state_machine_definition(_template())
    assert '"Review":{"Next":"WaitForShowroomApproval"' in definition
    assert '"WaitForShowroomApproval":{"Next":"Showroom"' in definition


def _state_machine_definition(template: Template) -> str:
    sm = next(iter(template.find_resources("AWS::StepFunctions::StateMachine").values()))
    parts = sm["Properties"]["DefinitionString"]["Fn::Join"][1]
    return "".join(p for p in parts if isinstance(p, str))


def test_showroom_is_followed_by_a_terminal_dynamodb_update_to_done() -> None:
    definition = _state_machine_definition(_template())
    assert '"Showroom":{"Next":"MarkDone"' in definition
    assert '":station":{"S":"done"}' in definition
