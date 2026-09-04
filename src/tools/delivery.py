"""Shared delivery-planning tool: which units of work ship as one pull request."""

from typing import Any

from strands import tool

from core.delivery import plan_delivery as _plan_delivery
from core.domain.blueprint import UnitOfWork


@tool
def plan_delivery(units: list[dict[str, Any]]) -> dict[str, Any]:
    """Work out which units of work have to ship together, and in what order.

    Call this before filing issues or handing anything to a coding agent, with every
    unit of work in the blueprint. Each entry needs `id`, `depends_on` and `files` (a
    list of `{path, change, purpose}`); anything else on the unit is ignored.

    Two units that write the same file cannot be built in parallel - a coding agent
    starts each session from one branch, so both would branch from the same base and
    overwrite each other. This returns them already grouped: one group is one branch,
    one pull request, and the issues it closes. Groups listed in `depends_on` must be
    built first, and a dependent group's agent session starts from its predecessor's
    branch rather than the default branch.

    Returns `groups` in build order, or `issues` if the units could not be read.
    """
    try:
        parsed = [UnitOfWork.model_validate(unit) for unit in units]
    except ValueError as error:
        message = f"units of work could not be read: {error}"
        return {"groups": [], "issues": [message]}

    groups = _plan_delivery(parsed)
    return {
        "groups": [group.model_dump() for group in groups],
        "issues": [],
        "pull_requests": len(groups),
    }
