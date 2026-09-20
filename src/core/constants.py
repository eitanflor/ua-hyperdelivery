"""Names shared across the line: agent identities used by config, runtime and tooling."""

from enum import StrEnum


class AgentName(StrEnum):
    """The four stations on the Hyperdelivery line, one Bedrock AgentCore runtime each.

    The value is the contract: it is the `config/agents/{value}.yaml` stem, the
    `agent_runtime/{value}/main.py` package, and the `hyperdelivery-{value}` ECR repo.
    """

    DISTILL = "distill"
    BLUEPRINT = "blueprint"
    REVIEW = "review"
    SHOWROOM = "showroom"


class Environment(StrEnum):
    """Where the console API is running - drives which orchestration path it wires up.

    Matches `infra/app.py`'s CDK `-c env=` context values (`dev` is its default; `prod`
    isn't deployed yet). `LOCAL` is the only value with no CDK stack behind it at all -
    a developer's own machine, talking to agents' `make dev-<agent>` HTTP servers.
    """

    LOCAL = "local"
    DEV = "dev"
    PROD = "prod"
