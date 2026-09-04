"""Dependency-graph checks shared by Blueprint's in-loop tool and its artifact gate."""

from collections.abc import Mapping, Sequence


def dependency_issues(
    unit_ids: Sequence[str], dependencies: Mapping[str, Sequence[str]]
) -> list[str]:
    """Flag `depends_on` ids that aren't known units, and every unit on a dependency cycle.

    Args:
        unit_ids: Every unit of work id in the blueprint.
        dependencies: Unit id to the ids it depends on. Ids absent from `unit_ids` are
            reported rather than traversed.

    Returns:
        One human-readable issue per problem found, empty when the graph is a valid DAG.
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
    return issues


def duplicate_id_issues(noun: str, ids: Sequence[str]) -> list[str]:
    """Flag every id that appears more than once, once per extra occurrence."""
    seen: set[str] = set()
    issues: list[str] = []
    for value in ids:
        if value in seen:
            issues.append(f"duplicate {noun} id {value}")
        seen.add(value)
    return issues
