"""Stateful data plane: the projects table and the documents bucket, for one environment.

Owned separately from OrchestrationStack/ConsoleApiStack (compute) because these two
resources outlive any redeploy of either - both carry RemovalPolicy.RETAIN. Downstream
stacks take them as constructor params (a real CDK cross-stack reference) instead of
re-deriving the name string themselves, so there is exactly one place a name can drift -
see docs/decisions.md, "S3 + DynamoDB: scalable single-environment-aware design".
"""

import os
from typing import Any

from aws_cdk import RemovalPolicy, Stack
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_iam as iam
from aws_cdk import aws_s3 as s3
from constructs import Construct

from stacks.naming import resource_name

# Prefix convention inside the documents bucket - the S3 analogue of keys.py's sk
# prefixes. Only "documents/" is used today (Distill's input FSDs); "demo-packages/" is
# reserved for Showroom's future binary assets (see docs/decisions.md, Phase 4 scope).
DOCUMENTS_PREFIX = "documents/"
# Historical FSDs Distill's reference-document tooling reads - see
# tools/documents.py's REFERENCE_PREFIX, the source of truth for this value.
REFERENCE_PREFIX = "fsds/"


class StorageStack(Stack):
    """DynamoDB projects table + the documents S3 bucket, for one environment."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        env_name: str,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        """Provision the data plane. `env_name` (e.g. "dev"/"prod") suffixes every name."""
        super().__init__(scope, construct_id, **kwargs)
        self.env_name = env_name

        # Single-table design (pk=PROJECT#<id>, sk=STATE/DECISION/ARTIFACT variants):
        # see infrastructure/repositories/keys.py, the source of truth for every sk shape.
        self.project_table = dynamodb.Table(
            self,
            "ProjectTable",
            table_name=resource_name(env_name, "projects"),
            partition_key=dynamodb.Attribute(name="pk", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="sk", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN,
        )
        # "Who owes a decision" - projects pending approval at a given station.
        self.project_table.add_global_secondary_index(
            index_name="gsi1-pending-by-station",
            partition_key=dynamodb.Attribute(name="gsi1pk", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="gsi1sk", type=dynamodb.AttributeType.STRING),
        )
        # Every project, most-recently-updated first - replaces the full table Scan
        # ProjectRepository.list_projects used to do. A single constant gsi2pk is fine at
        # this app's scale (an internal delivery line, not a public multi-tenant
        # service); revisit with a sharded key if the project count ever makes this
        # partition a throughput hot spot.
        self.project_table.add_global_secondary_index(
            index_name="gsi2-all-projects-by-updated",
            partition_key=dynamodb.Attribute(name="gsi2pk", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="gsi2sk", type=dynamodb.AttributeType.STRING),
        )

        # Replaces the borrowed external `edma-ai-test` bucket - dedicated and
        # CDK-managed, so its lifecycle and permissions live with the rest of this app.
        self.documents_bucket = s3.Bucket(
            self,
            "DocumentsBucket",
            bucket_name=resource_name(env_name, f"documents-{self.account}"),
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
        )

        # AgentCore Runtime execution roles are created outside CDK (see
        # scripts/deploy_agent.sh's AGENTCORE_ROLE_ARN) and PowerUserAccess cannot attach
        # a policy to an existing role at all (no iam:*, see docs/decisions.md,
        # "AWSPowerUserAccess has zero IAM write access"). A bucket (resource) policy
        # naming the role as principal is s3:PutBucketPolicy, not an iam:* call, so it
        # grants read access without needing IAM write access at all.
        agentcore_role_arn = os.environ.get("AGENTCORE_ROLE_ARN")
        if agentcore_role_arn:
            self.documents_bucket.add_to_resource_policy(
                iam.PolicyStatement(
                    sid="AllowAgentCoreReadDocuments",
                    principals=[iam.ArnPrincipal(agentcore_role_arn)],
                    actions=["s3:GetObject"],
                    resources=[
                        self.documents_bucket.arn_for_objects(f"{DOCUMENTS_PREFIX}*"),
                        self.documents_bucket.arn_for_objects(f"{REFERENCE_PREFIX}*"),
                    ],
                )
            )
