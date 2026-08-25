from strands import tool


@tool
def validate_talk_track_coverage(
    requirement_ids: list[str], talk_track_requirement_ids: list[str]
) -> dict:
    """Deterministically check that the demo's talk track has a narration section for
    every FSD requirement id, flagging any that are missing. Call this with the ids you
    drafted before finalizing the demo package - do not eyeball it."""
    missing = sorted(set(requirement_ids) - set(talk_track_requirement_ids))
    return {"valid": not missing, "missing_requirement_ids": missing}
