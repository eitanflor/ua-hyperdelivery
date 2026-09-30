"""What a model's tokens cost, so a turn can report dollars beside its token counts."""

from collections.abc import Mapping

from pydantic import BaseModel

_PER_MILLION = 1_000_000
_COST_DECIMALS = 6


class ModelPrice(BaseModel):
    """USD per million tokens. Cache reads and writes are billed apart from plain input."""

    input_per_mtok: float
    output_per_mtok: float
    cache_read_per_mtok: float
    cache_write_per_mtok: float


def cost_usd(price: ModelPrice, usage: Mapping[str, int]) -> float:
    """Dollar cost of one turn's `usage` (the counts `_usage_payload` builds) at `price`.

    `input_tokens` is the uncached input only, so the four buckets never overlap and simply add.
    """
    total = (
        usage.get("input_tokens", 0) * price.input_per_mtok
        + usage.get("output_tokens", 0) * price.output_per_mtok
        + usage.get("cache_read_tokens", 0) * price.cache_read_per_mtok
        + usage.get("cache_write_tokens", 0) * price.cache_write_per_mtok
    )
    return round(total / _PER_MILLION, _COST_DECIMALS)
