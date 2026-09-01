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


@tool
def score_showroom_completeness(requirement_ids: list[str]) -> dict[str, Any]:
    """Deterministically flag whether Showroom actually had a cleared spec to demo.

    Returns 0.0 with a gap naming what to ask for if no requirement ids were found in
    the input at all - meaning no spec that cleared Review was actually given.
    Otherwise returns 1.0, since `validate_talk_track_coverage` already enforces full
    narration coverage of whatever ids were found. Call this with the requirement ids
    you found before finalizing the `completeness` field - do not estimate the score
    yourself.
    """
    if not requirement_ids:
        gaps = ["no spec that cleared Review was provided - ask for it before assembling a demo"]
        return {"score": 0.0, "gaps": gaps}
    return {"score": 1.0, "gaps": []}
