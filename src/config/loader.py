"""Loads the declarative per-agent YAML definitions into validated config objects."""

from pathlib import Path
from typing import Any

import yaml

from core.domain.agent_config import AgentConfig

AGENTS_CONFIG_DIR = Path(__file__).parent / "agents"


def load_agent_config(name: str, config_dir: Path = AGENTS_CONFIG_DIR) -> AgentConfig:
    """Read config/agents/{name}.yaml into an AgentConfig - keeps agent definitions declarative."""
    path = config_dir / f"{name}.yaml"
    data: dict[str, Any] = yaml.safe_load(path.read_text()) or {}
    return AgentConfig.model_validate(data["agent"])
