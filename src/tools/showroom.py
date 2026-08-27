"""Showroom's deterministic validator: checks the talk track covers every requirement."""

from typing import Any

from strands import tool


@tool
def validate_talk_track_coverage(
    requirement_ids: list[str], talk_track_requirement_ids: list[str]
) -> dict[str, Any]:
    """Deterministically check the demo's talk track against the FSD requirements.

    Flags any requirement id that has no narration section. Call this with the ids you
    drafted before finalizing the demo package - do not eyeball it.
    """
    missing = sorted(set(requirement_ids) - set(talk_track_requirement_ids))
    return {"valid": not missing, "missing_requirement_ids": missing}
