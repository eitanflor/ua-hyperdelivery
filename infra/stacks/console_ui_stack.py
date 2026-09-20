"""Console UI hosting: S3 (private) + CloudFront, no custom domain.

Static Vite build output only - `ui/console`'s own `.env`/build step bakes in
`VITE_API_BASE_URL`/`VITE_ENTRA_*` (see that package's `.env.example`), so this stack
just needs somewhere secure and cheap to serve the already-built `dist/` from.

Deliberately no ACM cert/Route53 alias: CloudFront's own `*.cloudfront.net` domain gets
free HTTPS with zero extra resources, and a Route53 hosted zone is the only real
recurring cost the custom-domain version would add. Add one later if a memorable/branded
URL is actually needed (e.g. a `prod` launch) - see docs/decisions.md.
"""

from pathlib import Path
from typing import Any

from aws_cdk import CfnOutput, RemovalPolicy, Stack
from aws_cdk import aws_cloudfront as cloudfront
from aws_cdk import aws_cloudfront_origins as origins
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_s3_deployment as s3_deployment
from constructs import Construct

from stacks.naming import resource_name

_DIST_DIR = Path(__file__).resolve().parents[2] / "ui" / "console" / "dist"


class ConsoleUiStack(Stack):
    """An S3-origin CloudFront distribution serving the console's static build."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        env_name: str,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        """Provision UI hosting for one environment.

        Rebuildable from source on every deploy (`vite build` -> this stack uploads
        `dist/`), unlike the project table/documents bucket in StorageStack - DESTROY
        here carries no real data-loss risk, so there's no reason to RETAIN it.
        """
        super().__init__(scope, construct_id, **kwargs)

        self.bucket = s3.Bucket(
            self,
            "ConsoleUiBucket",
            bucket_name=resource_name(env_name, "console-ui"),
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        # SPA routing (react-router) - a deep link or a refresh on a client-side route
        # has no matching S3 key, so both 403 (no public bucket policy - OAC-only access
        # reads as "forbidden", not "missing") and 404 fall through to index.html.
        self.distribution = cloudfront.Distribution(
            self,
            "ConsoleUiDistribution",
            default_root_object="index.html",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin.with_origin_access_control(self.bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            ),
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=403, response_http_status=200, response_page_path="/index.html"
                ),
                cloudfront.ErrorResponse(
                    http_status=404, response_http_status=200, response_page_path="/index.html"
                ),
            ],
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
        )

        s3_deployment.BucketDeployment(
            self,
            "ConsoleUiDeployment",
            sources=[s3_deployment.Source.asset(str(_DIST_DIR))],
            destination_bucket=self.bucket,
            distribution=self.distribution,
            distribution_paths=["/*"],
        )

        CfnOutput(self, "ConsoleUiUrl", value=f"https://{self.distribution.domain_name}")
