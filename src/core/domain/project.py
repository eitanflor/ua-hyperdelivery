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
    SHOWROOM = "showroom"
    DONE = "done"


APPROVAL_STATIONS = {Station.BLUEPRINT_APPROVAL, Station.REVIEW_APPROVAL}
AGENT_STATIONS = {Station.DISTILL, Station.BLUEPRINT, Station.REVIEW, Station.SHOWROOM}

_LINE = list(Station)


def next_station(current: Station) -> Station:
    """Return the station after `current`, or `current` itself at the end of the line."""
    idx = _LINE.index(current)
    return _LINE[idx + 1] if idx + 1 < len(_LINE) else current


class CompletenessScore(BaseModel):
    """How ready one station's draft artifact is, plus what is still missing.

    Shared by every agent station's output contract (not just Distill's) so the API can
    hold a project at its current station - instead of showing the next gate - whenever
    `gaps` is non-empty. See `api.routers.projects._has_open_gaps`.
    """

    score: float
    gaps: list[str] = []


class Project(BaseModel):
    """Current-state projection of a project's position on the line.

    Persisted as the 'STATE' record in the single-table DynamoDB schema (see
    docs/decisions.md).
    """

    id: str
    name: str
    station: Station
    task_token: str | None = None  # set while paused at a waitForTaskToken approval
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

    Persisted as sk='ARTIFACT#<agent>' - one per agent per project, latest
    invocation wins (overwritten, not versioned - see docs/decisions.md).
    """

    project_id: str
    agent: str
    content: dict[str, Any]
    created_at: datetime


def utcnow() -> datetime:
    """Timezone-aware UTC now - the only clock this codebase reads."""
    return datetime.now(UTC)
