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
def score_showroom_completeness(
    requirement_ids: list[str], talk_track_requirement_ids: list[str]
) -> dict[str, Any]:
    """Deterministically score how much of the spec your talk track actually narrates.

    Returns the fraction of requirements that have a narration section, and a gap naming
    each one that does not. Returns 0.0 with a gap naming what to ask for if no
    requirement ids were found in the input at all - meaning no spec that cleared Review
    was actually given. Call this with the requirement ids you found and the ones your
    talk track covers before finalizing the `completeness` field - do not estimate the
    score yourself.
    """
    if not requirement_ids:
        gaps = ["no spec that cleared Review was provided - ask for it before assembling a demo"]
        return {"score": 0.0, "gaps": gaps}
    known = set(requirement_ids)
    missing = sorted(known - set(talk_track_requirement_ids))
    gaps = [f"requirement {rid} has no talk track narration" for rid in missing]
    return {"score": round((len(known) - len(missing)) / len(known), 2), "gaps": gaps}
