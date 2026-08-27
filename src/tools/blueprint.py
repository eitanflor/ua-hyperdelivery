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
