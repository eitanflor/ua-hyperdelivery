from pydantic import BaseModel


class AgentConfig(BaseModel):
    name: str
    model_id: str
    system_prompt: str
