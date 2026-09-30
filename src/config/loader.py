"""Loads the declarative per-agent YAML definitions into validated config objects."""

from pathlib import Path
from typing import Any

import yaml

from core.domain.agent_config import AgentConfig
from core.domain.pricing import ModelPrice

AGENTS_CONFIG_DIR = Path(__file__).parent / "agents"
MODEL_PRICING_PATH = Path(__file__).parent / "model_pricing.yaml"


def load_agent_config(name: str, config_dir: Path = AGENTS_CONFIG_DIR) -> AgentConfig:
    """Read config/agents/{name}.yaml into an AgentConfig - keeps agent definitions declarative."""
    path = config_dir / f"{name}.yaml"
    data: dict[str, Any] = yaml.safe_load(path.read_text()) or {}
    return AgentConfig.model_validate(data["agent"])


def load_model_price(model_id: str, path: Path = MODEL_PRICING_PATH) -> ModelPrice | None:
    """Rates for `model_id`, or `None` when it has none - a cost is left out, never guessed."""
    table: dict[str, Any] = yaml.safe_load(path.read_text()) or {}
    entry = table.get(model_id)
    return ModelPrice.model_validate(entry) if entry else None
