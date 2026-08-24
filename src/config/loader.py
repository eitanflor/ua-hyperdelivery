from pathlib import Path

import yaml

from core.domain.agent_config import AgentConfig

DEFAULT_AGENT_CONFIG_PATH = Path(__file__).parent / "agent.yaml"


def load_agent_config(path: Path = DEFAULT_AGENT_CONFIG_PATH) -> AgentConfig:
    """Read config/agent.yaml into an AgentConfig - keeps the agent definition declarative."""
    data = yaml.safe_load(path.read_text()) or {}
    return AgentConfig(**data["agent"])
