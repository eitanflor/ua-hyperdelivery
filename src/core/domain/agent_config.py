"""The declarative contract every agent's YAML file is validated against."""

from pydantic import BaseModel


class AgentConfig(BaseModel):
    """One agent's definition, loaded from `config/agents/{name}.yaml`."""

    name: str
    model_id: str
    system_prompt: str
    # Output is generated serially - measured at ~85 tokens/second - so this is a time
    # budget as much as a size one. Raising it to 32768 once added ~49s to a Distill turn
    # for little gain on a light prompt, so the default stayed conservative - but a turn
    # grounded in real Snowflake/S3 lookups can still truncate mid-artifact at 8192
    # (MaxTokensReachedException), so distill.yaml now overrides it too, same as blueprint.
    max_tokens: int = 8192
    # Sent only when set: Bedrock rejects the parameter outright on newer Anthropic models
    # ("`temperature` is deprecated for this model"), so it cannot be defaulted here.
    temperature: float | None = None
