from pydantic import BaseModel


class AgentConfig(BaseModel):
    name: str
    model_id: str
    system_prompt: str
    # StructuredSpec/units-of-work output can be large (many requirements/criteria/rules) -
    # the Bedrock/Strands default is too low for that, so every agent overrides it.
    max_tokens: int = 8192
