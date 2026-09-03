import aws_cdk as cdk
import pytest
from aws_cdk.assertions import Match, Template

from stacks.storage_stack import StorageStack


def _template() -> Template:
    app = cdk.App()
    stack = StorageStack(app, "TestStack", "test", env=cdk.Environment(region="us-east-1"))
    return Template.from_stack(stack)


def test_project_table_has_pk_sk_and_both_gsis() -> None:
    template = _template()
    template.has_resource_properties(
        "AWS::DynamoDB::Table",
        {
            "TableName": "hyperdelivery-test-projects",
            "KeySchema": [
                {"AttributeName": "pk", "KeyType": "HASH"},
                {"AttributeName": "sk", "KeyType": "RANGE"},
            ],
            "GlobalSecondaryIndexes": Match.array_with(
                [
                    Match.object_like({"IndexName": "gsi1-pending-by-station"}),
                    Match.object_like({"IndexName": "gsi2-all-projects-by-updated"}),
                ]
            ),
        },
    )


def test_documents_bucket_blocks_public_access_and_is_versioned() -> None:
    template = _template()
    template.has_resource_properties(
        "AWS::S3::Bucket",
        {
            "VersioningConfiguration": {"Status": "Enabled"},
            "PublicAccessBlockConfiguration": Match.object_like(
                {
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True,
                }
            ),
        },
    )


def test_no_bucket_policy_without_an_agentcore_role_arn(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("AGENTCORE_ROLE_ARN", raising=False)
    template = _template()
    template.resource_count_is("AWS::S3::BucketPolicy", 0)


def test_bucket_policy_grants_the_agentcore_role_scoped_read(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AGENTCORE_ROLE_ARN", "arn:aws:iam::123456789012:role/hyperdelivery-agent")
    template = _template()
    template.has_resource_properties(
        "AWS::S3::BucketPolicy",
        {
            "PolicyDocument": Match.object_like(
                {
                    "Statement": Match.array_with(
                        [
                            Match.object_like(
                                {
                                    "Action": "s3:GetObject",
                                    "Principal": {
                                        "AWS": "arn:aws:iam::123456789012:role/hyperdelivery-agent"
                                    },
                                }
                            )
                        ]
                    )
                }
            )
        },
    )
