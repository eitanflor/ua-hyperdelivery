import aws_cdk as cdk
from aws_cdk.assertions import Match, Template

from stacks.console_api_stack import ConsoleApiStack


def _template() -> Template:
    app = cdk.App()
    stack = ConsoleApiStack(app, "TestStack", env=cdk.Environment(region="ap-southeast-2"))
    return Template.from_stack(stack)


def test_lambda_function_uses_mangum_handler():
    template = _template()
    template.has_resource_properties(
        "AWS::Lambda::Function",
        {
            "Handler": "api.lambda_handler.handler",
            "Runtime": "python3.11",
        },
    )


def test_lambda_has_dynamodb_permissions_scoped_to_project_table():
    template = _template()
    template.has_resource_properties(
        "AWS::IAM::Policy",
        {
            "PolicyDocument": Match.object_like(
                {
                    "Statement": Match.array_with(
                        [
                            Match.object_like(
                                {
                                    "Action": Match.array_with(["dynamodb:GetItem"]),
                                }
                            )
                        ]
                    )
                }
            )
        },
    )


def test_http_api_created_with_lambda_default_integration():
    template = _template()
    template.resource_count_is("AWS::ApiGatewayV2::Api", 1)
    template.has_resource_properties(
        "AWS::ApiGatewayV2::Integration",
        {"IntegrationType": "AWS_PROXY"},
    )
