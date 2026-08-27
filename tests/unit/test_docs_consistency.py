"""Guards against documentation and wiring drift.

These assertions exist because the alternative is a convention nobody notices breaking:
a new setting that never reaches `.env.example`, or an agent YAML with no runtime behind
it. Failing here is cheaper than finding out at deploy time.
"""

import re
from pathlib import Path

import pytest

from config.loader import AGENTS_CONFIG_DIR, load_agent_config
from config.settings import Settings
from core.constants import AgentName

_REPO_ROOT = Path(__file__).resolve().parents[2]
_ENV_EXAMPLE = _REPO_ROOT / ".env.example"
_AGENT_RUNTIME_DIR = _REPO_ROOT / "src" / "agent_runtime"


def _documented_env_vars() -> set[str]:
    """Every KEY in .env.example, whether commented out (optional) or not."""
    pattern = re.compile(r"^\s*#?\s*([A-Z][A-Z0-9_]*)\s*=")
    return {
        match.group(1)
        for line in _ENV_EXAMPLE.read_text().splitlines()
        if (match := pattern.match(line))
    }


def test_env_example_documents_every_setting() -> None:
    expected = {name.upper() for name in Settings.model_fields}

    assert expected <= _documented_env_vars(), (
        "settings missing from .env.example: "
        f"{sorted(expected - _documented_env_vars())}. Add them, with a comment saying "
        "when they are needed."
    )


def test_env_example_has_no_settings_that_no_longer_exist() -> None:
    # AWS_PROFILE and friends are consumed by the Makefile/AWS CLI, not by Settings.
    makefile_and_cli_vars = {"AWS_PROFILE", "AGENTCORE_ROLE_ARN"}
    known = {name.upper() for name in Settings.model_fields} | makefile_and_cli_vars

    assert _documented_env_vars() <= known, (
        f"stale entries in .env.example: {sorted(_documented_env_vars() - known)}"
    )


@pytest.mark.parametrize("agent", list(AgentName))
def test_every_agent_has_config_and_a_runtime_entrypoint(agent: AgentName) -> None:
    assert (AGENTS_CONFIG_DIR / f"{agent.value}.yaml").is_file()
    assert (_AGENT_RUNTIME_DIR / agent.value / "main.py").is_file()
    assert load_agent_config(agent).name == f"{agent.value}-agent"


def test_agent_name_enum_covers_every_config_file() -> None:
    on_disk = {path.stem for path in AGENTS_CONFIG_DIR.glob("*.yaml")}

    assert on_disk == {agent.value for agent in AgentName}
