import pytest

from agent_runtime import factory
from config.loader import load_agent_config, load_model_price
from core.constants import AgentName
from core.domain.pricing import ModelPrice, cost_usd

_PRICE = ModelPrice(
    input_per_mtok=2.0,
    output_per_mtok=10.0,
    cache_read_per_mtok=0.2,
    cache_write_per_mtok=2.5,
)

_stamped = factory._stamped  # pyright: ignore[reportPrivateUsage]  # the helper under test


def test_cost_adds_the_four_billed_buckets_at_their_own_rates() -> None:
    usage = {
        "input_tokens": 1_000,
        "output_tokens": 500,
        "cache_read_tokens": 10_000,
        "cache_write_tokens": 2_000,
        "total_tokens": 13_500,
    }

    # 1000*2 + 500*10 + 10000*0.2 + 2000*2.5 = 14,000 micro-dollars
    assert cost_usd(_PRICE, usage) == 0.014


def test_a_turn_with_no_counts_costs_nothing() -> None:
    assert cost_usd(_PRICE, {}) == 0.0


def test_a_usage_event_gains_its_model_and_a_cost_when_the_model_has_a_price() -> None:
    event = {"usage": {"input_tokens": 1_000, "output_tokens": 500, "total_tokens": 1_500}}

    stamped = _stamped(event, "m", _PRICE)

    assert stamped == {
        "usage": {
            "input_tokens": 1_000,
            "output_tokens": 500,
            "total_tokens": 1_500,
            "model_id": "m",
            "cost_usd": 0.007,
        }
    }


def test_an_unpriced_model_still_names_itself_but_gets_no_cost_rather_than_zero() -> None:
    event = {"usage": {"input_tokens": 1_000, "total_tokens": 1_000}}

    stamped = _stamped(event, "m", None)

    assert stamped == {"usage": {"input_tokens": 1_000, "total_tokens": 1_000, "model_id": "m"}}


def test_events_that_are_not_usage_pass_through_untouched() -> None:
    event = {"result": {"value": "ok"}}

    assert _stamped(event, "m", _PRICE) == event


def test_an_unknown_model_has_no_price() -> None:
    assert load_model_price("no.such.model") is None


@pytest.mark.parametrize("agent_name", list(AgentName))
def test_every_agent_runs_on_a_model_with_a_price(agent_name: AgentName) -> None:
    # moving an agent to a new model without pricing it would silently drop its cost from the UI
    assert load_model_price(load_agent_config(agent_name).model_id) is not None
