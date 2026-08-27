"""Turns declarative agent config into a live Strands agent."""

from typing import Any

from strands import Agent
from strands.models import BedrockModel

from core.domain.agent_config import AgentConfig


def build_agent(config: AgentConfig, region_name: str, tools: list[Any] | None = None) -> Agent:
    """Construct a Strands Agent from declarative config.

    Add memory/gateway wiring here as real integrations are onboarded, not speculatively.
    """
    model = BedrockModel(
        model_id=config.model_id, region_name=region_name, max_tokens=config.max_tokens
    )
    return Agent(model=model, system_prompt=config.system_prompt, tools=tools or [])
