"""The one tool every station shares: state the plan before doing the work.

Deliberately stateless - each call takes the whole plan, the same shape as the artifact
validators. An agent invocation is a clean slate (see agent_runtime.factory), so there is
no prior plan to carry forward, and a module-level store would leak one project's plan
into the next project's run on the shared agent instance.
"""

from typing import Any

from strands import tool

_VALID_STATUSES = ("pending", "in_progress", "done")
_MIN_STEPS = 2


@tool
def track_plan(steps: dict[str, str]) -> dict[str, Any]:
    """State your plan for this turn, then mark steps done as you finish them.

    Call this once before you act, with a mapping of each step's short title to its
    status - one of "pending", "in_progress" or "done" - in the order you intend to do
    them. Keep it to about five steps: this is the shape of the turn, not a checklist of
    every call you will make.

    After that, call it again only when a step has actually finished, in the same
    response as your next real tool call. Every call restates the whole plan, and every
    restatement is output you have to write - so re-declaring a plan you have not acted
    on yet costs the run real time and tells nobody anything new.

    Keep exactly one step "in_progress" at a time, and give a real plan - a single step
    is not one. This is what stops a long turn drifting away from what it set out to do,
    and it is shown to the human watching the run.

    Returns `valid: false` with `issues` if the plan is malformed; fix it and call again.
    """
    issues = [
        f"step {title!r} has invalid status {status!r} - use one of {', '.join(_VALID_STATUSES)}"
        for title, status in steps.items()
        if status not in _VALID_STATUSES
    ]
    if len(steps) < _MIN_STEPS:
        issues.append(
            f"a plan needs at least {_MIN_STEPS} steps - break the work down before starting it"
        )
    in_progress = [title for title, status in steps.items() if status == "in_progress"]
    if len(in_progress) > 1:
        issues.append(
            f"{len(in_progress)} steps are in_progress ({', '.join(in_progress)}) - "
            "work one step at a time"
        )
    remaining = [title for title, status in steps.items() if status == "pending"]
    return {
        "valid": not issues,
        "issues": issues,
        # echoed back because the console renders the plan from the tool result - the
        # call's input never reaches it
        "steps": steps,
        "current_step": in_progress[0] if in_progress else None,
        "remaining_steps": remaining,
    }
