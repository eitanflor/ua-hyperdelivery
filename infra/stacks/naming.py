"""Single place resource names/region are derived from - stacks must not inline either.

Everything lives in one region now (see docs/decisions.md, "Consolidate all AWS
resources into us-east-1") - the prior Bedrock (us-east-1) / orchestration
(ap-southeast-2) split is gone.
"""

REGION = "us-east-1"


def resource_name(env_name: str, resource: str) -> str:
    """Env-suffixed physical resource name: "projects" in "dev" -> "hyperdelivery-dev-projects".

    Every stack must build table/bucket/function names through this helper so an
    environment can never partially drift onto another environment's resource.
    """
    return f"hyperdelivery-{env_name}-{resource}"
