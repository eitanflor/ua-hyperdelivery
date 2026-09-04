"""How a blueprint's units of work map onto pull requests.

A unit of work is a review unit, not a shipping unit. Two units that edit the same file
cannot be built in parallel by a coding agent - GitHub's Copilot agent branches from a
single ref per session, so both branch from the same base, both rewrite the file, and
whichever merges first makes the other unreadable. That is not hypothetical: it produced
four mutually-incompatible pull requests against one schema change.

So the shipping unit is a *delivery group*: the units that touch overlapping files,
collapsed into one branch and one pull request. Groups that merely depend on each other
stay separate and chain by base ref instead, since a coding agent can start from a
predecessor's branch.
"""

from collections.abc import Sequence

from pydantic import BaseModel

from core.domain.blueprint import UnitOfWork


class DeliveryGroup(BaseModel):
    """One branch, one pull request, and the units of work it delivers together."""

    id: str
    unit_ids: list[str]
    #: Groups whose branch this one must start from, already ordered before it.
    depends_on: list[str] = []
    #: Every file any unit in the group touches - what makes the grouping auditable.
    files: list[str] = []


def plan_delivery(units: Sequence[UnitOfWork]) -> list[DeliveryGroup]:
    """Group units into the pull requests that can actually be built independently.

    Units are merged when they touch a common file, and again when the resulting groups
    turn out to depend on each other in a cycle - mutually dependent work has to ship
    together whatever the file map says. The result is ordered so a group always follows
    the groups it depends on, which is the order they can be handed to a coding agent.

    Args:
        units: The blueprint's units of work, in the order it drafted them.

    Returns:
        One group per pull request, in dependency order. Empty when there are no units.
    """
    if not units:
        return []

    parent = _union_by_shared_file(units)
    edges = _group_edges(units, parent)
    _merge_cycles(parent, edges)

    order = _topological_order(units, parent, _group_edges(units, parent))
    numbering = {root: f"D{index}" for index, root in enumerate(order, start=1)}
    members: dict[str, list[UnitOfWork]] = {root: [] for root in order}
    for unit in units:
        members[_find(parent, unit.id)].append(unit)

    groups: list[DeliveryGroup] = []
    for root in order:
        group_units = members[root]
        upstream = {
            _find(parent, dep)
            for unit in group_units
            for dep in unit.depends_on
            if dep in parent and _find(parent, dep) != root
        }
        groups.append(
            DeliveryGroup(
                id=numbering[root],
                unit_ids=[u.id for u in group_units],
                depends_on=[numbering[r] for r in order if r in upstream],
                files=sorted({f.path for u in group_units for f in u.files}),
            )
        )
    return groups


def _find(parent: dict[str, str], node: str) -> str:
    while parent[node] != node:
        parent[node] = parent[parent[node]]
        node = parent[node]
    return node


def _union(parent: dict[str, str], left: str, right: str) -> None:
    left_root, right_root = _find(parent, left), _find(parent, right)
    if left_root != right_root:
        parent[right_root] = left_root


def _union_by_shared_file(units: Sequence[UnitOfWork]) -> dict[str, str]:
    """Merge every pair of units that writes to the same path."""
    parent = {unit.id: unit.id for unit in units}
    first_writer: dict[str, str] = {}
    for unit in units:
        for touchpoint in unit.files:
            other = first_writer.setdefault(touchpoint.path, unit.id)
            _union(parent, other, unit.id)
    return parent


def _group_edges(units: Sequence[UnitOfWork], parent: dict[str, str]) -> dict[str, set[str]]:
    """Dependency edges lifted from units onto their groups, self-edges dropped."""
    edges: dict[str, set[str]] = {_find(parent, unit.id): set() for unit in units}
    for unit in units:
        source = _find(parent, unit.id)
        for dep in unit.depends_on:
            if dep not in parent:
                continue
            target = _find(parent, dep)
            if target != source:
                edges[source].add(target)
    return edges


def _merge_cycles(parent: dict[str, str], edges: dict[str, set[str]]) -> None:
    """Collapse each cycle of groups into one, so what remains can be ordered.

    Units are validated as a DAG before this point, but collapsing them by shared file
    can still put two groups on either side of each other's dependencies. Those groups
    cannot be built one before the other, so they become one pull request.
    """
    index: dict[str, int] = {}
    low: dict[str, int] = {}
    on_stack: set[str] = set()
    stack: list[str] = []
    counter = 0

    for start in list(edges):
        if start in index:
            continue
        # explicit stack rather than recursion: a deep chain of units should not be able
        # to overflow the gate
        work: list[tuple[str, list[str]]] = [(start, sorted(edges[start]))]
        index[start] = low[start] = counter
        counter += 1
        stack.append(start)
        on_stack.add(start)
        while work:
            node, pending = work[-1]
            if pending:
                child = pending.pop()
                if child not in index:
                    index[child] = low[child] = counter
                    counter += 1
                    stack.append(child)
                    on_stack.add(child)
                    work.append((child, sorted(edges[child])))
                elif child in on_stack:
                    low[node] = min(low[node], index[child])
                continue
            work.pop()
            if work:
                low[work[-1][0]] = min(low[work[-1][0]], low[node])
            if low[node] == index[node]:
                component: list[str] = []
                while True:
                    member = stack.pop()
                    on_stack.discard(member)
                    component.append(member)
                    if member == node:
                        break
                for member in component[1:]:
                    _union(parent, component[0], member)


def _topological_order(
    units: Sequence[UnitOfWork], parent: dict[str, str], edges: dict[str, set[str]]
) -> list[str]:
    """Group roots, dependencies first, ties broken by the blueprint's own ordering."""
    position = {_find(parent, u.id): i for i, u in reversed(list(enumerate(units)))}
    order: list[str] = []
    emitted: set[str] = set()
    for start in sorted(edges, key=lambda root: position[root]):
        if start in emitted:
            continue
        emitted.add(start)
        work = [(start, sorted(edges[start], key=lambda root: position[root], reverse=True))]
        while work:
            node, pending = work[-1]
            if pending:
                child = pending.pop()
                if child not in emitted:
                    emitted.add(child)
                    work.append(
                        (child, sorted(edges[child], key=lambda root: position[root], reverse=True))
                    )
                continue
            work.pop()
            order.append(node)
    return order
