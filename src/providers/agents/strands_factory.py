"""Turns declarative agent config into a live Strands agent."""

from typing import Any

from strands import Agent
from strands.models import BedrockModel
from strands.models.model import CacheConfig

from core.domain.agent_config import AgentConfig

# Every invocation starts from an empty message list (see agent_runtime.factory), so the
# system prompt and the whole tool schema are re-sent every turn - and a station is
# invoked repeatedly within one project (redraft after a gap, answers to its questions,
# a look at a finished build). "auto" resolves to Anthropic caching for Claude model ids
# and to no caching otherwise, so pointing an agent at another model degrades rather than
# breaks. TTL is left at Bedrock's default: the longer window costs more per cache write,
# which is the wrong trade when many runs are one-shot.
_CACHE = CacheConfig(strategy="auto")


def build_agent(config: AgentConfig, region_name: str, tools: list[Any] | None = None) -> Agent:
    """Construct a Strands Agent from declarative config.

    Add memory/gateway wiring here as real integrations are onboarded, not speculatively.
    """
    # Passing temperature at all is a ValidationException on models that deprecated it,
    # so an unset config must omit the argument rather than send a default.
    model = (
        BedrockModel(
            model_id=config.model_id,
            region_name=region_name,
            max_tokens=config.max_tokens,
            cache_config=_CACHE,
            cache_tools="default",
        )
        if config.temperature is None
        else BedrockModel(
            model_id=config.model_id,
            region_name=region_name,
            max_tokens=config.max_tokens,
            temperature=config.temperature,
            cache_config=_CACHE,
            cache_tools="default",
        )
    )
    return Agent(model=model, system_prompt=config.system_prompt, tools=tools or [])
