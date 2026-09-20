"""Where a project sits on the line, and the audit trail of how it got there."""

from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel


class Station(StrEnum):
    """The Distill -> Blueprint -> Review -> Showroom line, in order.

    Declaration order *is* the line order - `next_station` walks it. Mirrors the state
    machine definition in infra/stacks/orchestration_stack.py; keep both in sync.
    """

    DISTILL = "distill"
    BLUEPRINT_APPROVAL = "blueprint_approval"
    BLUEPRINT = "blueprint"
    REVIEW_APPROVAL = "review_approval"
    REVIEW = "review"
    SHOWROOM_APPROVAL = "showroom_approval"
    SHOWROOM = "showroom"
    DONE = "done"


# Each is named for the station it unlocks, not the one it signs off: BLUEPRINT_APPROVAL
# clears Distill's spec so Blueprint may start, and SHOWROOM_APPROVAL clears Review's
# grade sheet - including any work it handed to a coding agent - so Showroom may start.
APPROVAL_STATIONS = {
    Station.BLUEPRINT_APPROVAL,
    Station.REVIEW_APPROVAL,
    Station.SHOWROOM_APPROVAL,
}
AGENT_STATIONS = {Station.DISTILL, Station.BLUEPRINT, Station.REVIEW, Station.SHOWROOM}

_LINE = list(Station)


def next_station(current: Station) -> Station:
    """Return the station after `current`, or `current` itself at the end of the line."""
    idx = _LINE.index(current)
    return _LINE[idx + 1] if idx + 1 < len(_LINE) else current


def prior_station(current: Station) -> Station:
    """Return the station before `current`, or `current` itself at the start of the line.

    Used when a gate is rejected: the project goes back to the agent whose artifact was
    under review, not the gate itself, so that agent gets another turn with the reason.
    """
    idx = _LINE.index(current)
    return _LINE[idx - 1] if idx > 0 else current


class OpenQuestion(BaseModel):
    """One thing an agent needs from a human before it can go further.

    Written for the person who asked for the work, not for the next engineer: `options`
    are concrete answers drawn from the domain, and an empty list means free text is the
    only sensible reply. This is how a station elicits rather than guesses - see the
    Distill Agent in docs/hyperdelivery-plan.md.
    """

    id: str
    question: str
    options: list[str] = []
    multi_select: bool = False


class CompletenessScore(BaseModel):
    """How ready one station's draft artifact is, plus what is still missing.

    Shared by every agent station's output contract (not just Distill's) so the API can
    hold a project at its current station - instead of showing the next gate - whenever
    `gaps` is non-empty. See `api.routers.projects._has_open_gaps`.

    `score` and `gaps` are computed from the stored artifact and overwrite whatever the
    agent claimed (see core.validation); `questions` are the agent's own, since what is
    worth asking a human is a judgment no validator can make.
    """

    score: float
    gaps: list[str] = []
    questions: list[OpenQuestion] = []


class Project(BaseModel):
    """Current-state projection of a project's position on the line.

    Persisted as the 'STATE' record in the single-table DynamoDB schema (see
    docs/decisions.md).
    """

    id: str
    name: str
    station: Station
    task_token: str | None = None  # set while paused at a waitForTaskToken approval
    # Set while Distill is paused on `ask_clarifying_questions` instead of drafting - see
    # orchestration.persist_question. `{"status": "questions"|"chat", ..., "prior_message"}`.
    pending_question: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime


class Decision(BaseModel):
    """Audit record of one approval/rejection at a station handoff."""

    project_id: str
    station: Station
    approved: bool
    signer: str
    comment: str | None = None
    decided_at: datetime


class Artifact(BaseModel):
    """One agent's output (FSD/TDD/gap report/demo package), keyed by the agent that produced it.

    Persisted twice per save: sk='ARTIFACT#<agent>' (latest, what the console reads by
    default) and sk='ARTIFACT_VERSION#<agent>#v<NNNN>' (immutable history) - see
    docs/decisions.md.
    """

    project_id: str
    agent: str
    content: dict[str, Any]
    version: int = 1
    created_at: datetime


def utcnow() -> datetime:
    """Timezone-aware UTC now - the only clock this codebase reads."""
    return datetime.now(UTC)
