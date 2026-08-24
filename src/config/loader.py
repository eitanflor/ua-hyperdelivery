from pathlib import Path

import yaml

from core.domain.agent_config import AgentConfig

AGENTS_CONFIG_DIR = Path(__file__).parent / "agents"


def load_agent_config(name: str, config_dir: Path = AGENTS_CONFIG_DIR) -> AgentConfig:
    """Read config/agents/{name}.yaml into an AgentConfig - keeps agent definitions declarative."""
    path = config_dir / f"{name}.yaml"
    data = yaml.safe_load(path.read_text()) or {}
    return AgentConfig(**data["agent"])
