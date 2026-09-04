from typing import cast

import pytest
from strands import Agent
from strands.models import BedrockModel

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


@pytest.mark.parametrize("agent_name", list(AgentName))
def test_build_agent_omits_temperature_unless_the_config_sets_it(agent_name: AgentName) -> None:
    # Bedrock 400s on models that deprecated the parameter, so sending a default is not
    # harmless - every invocation fails with a ValidationException.
    config = load_agent_config(agent_name)

    model = build_agent(config, region_name="us-east-1").model

    assert cast(BedrockModel, model).get_config().get("temperature") is None


def test_build_agent_passes_temperature_through_when_set() -> None:
    config = load_agent_config(AgentName.DISTILL)
    config.temperature = 0.2

    model = build_agent(config, region_name="us-east-1").model

    assert cast(BedrockModel, model).get_config().get("temperature") == pytest.approx(0.2)


@pytest.mark.parametrize("agent_name", list(AgentName))
def test_build_agent_caches_the_system_prompt_and_tools(agent_name: AgentName) -> None:
    # every invocation re-sends both in full (agent_runtime.factory clears the message
    # list), so losing this quietly doubles the token bill for a redraft
    config = load_agent_config(agent_name)

    model = build_agent(config, region_name="us-east-1").model

    cache_config = cast(BedrockModel, model).get_config().get("cache_config")
    assert cache_config is not None
    assert cache_config.strategy == "auto"
    assert cast(BedrockModel, model).get_config().get("cache_tools") == "default"


def test_caching_turns_itself_off_for_a_model_that_does_not_support_it() -> None:
    config = load_agent_config(AgentName.DISTILL)
    config.model_id = "amazon.nova-pro-v1:0"

    model = cast(BedrockModel, build_agent(config, region_name="us-east-1").model)

    # "auto" is a request to cache where caching exists, not an assertion that it does
    assert model._cache_strategy is None  # pyright: ignore[reportPrivateUsage]  # no public accessor


def test_caching_is_on_for_the_anthropic_models_the_agents_actually_use() -> None:
    config = load_agent_config(AgentName.DISTILL)

    model = cast(BedrockModel, build_agent(config, region_name="us-east-1").model)

    assert model._cache_strategy == "anthropic"  # pyright: ignore[reportPrivateUsage]  # no public accessor
