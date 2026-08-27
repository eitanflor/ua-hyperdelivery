"""The declarative contract every agent's YAML file is validated against."""

from pydantic import BaseModel


class AgentConfig(BaseModel):
    """One agent's definition, loaded from `config/agents/{name}.yaml`."""

    name: str
    model_id: str
    system_prompt: str
    # StructuredSpec/units-of-work output can be large (many requirements/criteria/rules) -
    # the Bedrock/Strands default is too low for that, so every agent overrides it.
    max_tokens: int = 8192
