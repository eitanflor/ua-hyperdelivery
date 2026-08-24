from strands import Agent

from config.loader import load_agent_config
from providers.agents.strands_factory import build_agent


def test_load_agent_config_reads_declarative_yaml():
    config = load_agent_config()

    assert config.name == "hyperdelivery-agent"
    assert config.model_id
    assert config.system_prompt


def test_build_agent_constructs_a_strands_agent():
    config = load_agent_config()

    agent = build_agent(config, region_name="us-east-1")

    assert isinstance(agent, Agent)
