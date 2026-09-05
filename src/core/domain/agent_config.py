"""The declarative contract every agent's YAML file is validated against."""

from pydantic import BaseModel


class AgentConfig(BaseModel):
    """One agent's definition, loaded from `config/agents/{name}.yaml`."""

    name: str
    model_id: str
    system_prompt: str
    # Output is generated serially - measured at ~85 tokens/second - so this is a time
    # budget as much as a size one. Raising it to 32768 let Distill grow from 11.5k to
    # 16.2k output tokens on the same prompt and added 49s to the turn, which is why the
    # default is back where it was. Blueprint overrides it in its YAML: reading eighteen
    # files genuinely does produce an artifact that 8192 truncates mid-tool-use.
    max_tokens: int = 8192
    # Sent only when set: Bedrock rejects the parameter outright on newer Anthropic models
    # ("`temperature` is deprecated for this model"), so it cannot be defaulted here.
    temperature: float | None = None
