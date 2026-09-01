"""Blueprint's deterministic validator: checks the units-of-work dependency DAG."""

from typing import Any

from strands import tool


@tool
def validate_units_of_work(
    unit_ids: list[str], dependencies: dict[str, list[str]]
) -> dict[str, Any]:
    """Deterministically validate a Blueprint draft's units of work.

    Flags any `depends_on` id that isn't a known unit and any dependency cycle. Call this
    with the ids and dependency map you drafted before finalizing the blueprint - do not
    eyeball it.
    """
    unit_id_set = set(unit_ids)
    issues = [
        f"unit {unit_id} depends on unknown unit {dep}"
        for unit_id, deps in dependencies.items()
        for dep in deps
        if dep not in unit_id_set
    ]

    visiting: set[str] = set()
    visited: set[str] = set()

    def has_cycle(node: str) -> bool:
        if node in visiting:
            return True
        if node in visited:
            return False
        visiting.add(node)
        if any(dep in unit_id_set and has_cycle(dep) for dep in dependencies.get(node, [])):
            return True
        visiting.discard(node)
        visited.add(node)
        return False

    issues += [
        f"unit {unit_id} is part of a dependency cycle"
        for unit_id in unit_ids
        if has_cycle(unit_id)
    ]

    return {"valid": not issues, "issues": issues}


@tool
def score_blueprint_completeness(
    requirement_ids: list[str], covered_requirement_ids: list[str]
) -> dict[str, Any]:
    """Deterministically score a Blueprint draft against the spec it was built from.

    Returns 0.0 with a gap naming what to ask for if no requirement ids were found at
    all - meaning no approved spec content or Jira reference was actually given. Call
    this with the requirement ids you found in the input and the ones your units of
    work address before finalizing the `completeness` field - do not estimate the
    score yourself.
    """
    if not requirement_ids:
        gaps = [
            (
                "no approved spec or Jira reference was provided - ask for the spec's "
                "requirements, or a Jira issue key to pull them from, before drafting"
            )
        ]
        return {"score": 0.0, "gaps": gaps}
    missing = sorted(set(requirement_ids) - set(covered_requirement_ids))
    gaps = [f"requirement {r} has no unit of work addressing it" for r in missing]
    score = round((len(requirement_ids) - len(missing)) / len(requirement_ids), 2)
    return {"score": score, "gaps": gaps}
