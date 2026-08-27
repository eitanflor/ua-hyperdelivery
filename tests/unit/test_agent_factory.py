import pytest
from strands import Agent

from config.loader import load_agent_config
from core.constants import AgentName
from providers.agents.strands_factory import build_agent


@pytest.mark.parametrize("agent_name", list(AgentName))
def test_load_agent_config_reads_declarative_yaml(agent_name: AgentName) -> None:
    config = load_agent_config(agent_name)

    assert config.name == f"{agent_name.value}-agent"
    assert config.model_id
    assert config.system_prompt


@pytest.mark.parametrize("agent_name", list(AgentName))
def test_build_agent_constructs_a_strands_agent(agent_name: AgentName) -> None:
    config = load_agent_config(agent_name)

    agent = build_agent(config, region_name="us-east-1")

    assert isinstance(agent, Agent)
