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
