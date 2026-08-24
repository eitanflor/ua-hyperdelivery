from strands import Agent
from strands.models import BedrockModel

from core.domain.agent_config import AgentConfig


def build_agent(config: AgentConfig, region_name: str) -> Agent:
    """Constructs a Strands Agent from declarative config - add tools/memory here as
    real integrations are onboarded, not speculatively."""
    model = BedrockModel(model_id=config.model_id, region_name=region_name)
    return Agent(model=model, system_prompt=config.system_prompt)
