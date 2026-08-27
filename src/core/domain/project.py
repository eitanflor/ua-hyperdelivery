from datetime import UTC, datetime
from enum import StrEnum

from pydantic import BaseModel

# Station order for the Distill -> Blueprint -> Review -> Showroom line. Mirrors the
# state machine definition in infra/stacks/orchestration_stack.py.
_LINE = [
    "distill",
    "blueprint_approval",
    "blueprint",
    "review_approval",
    "review",
    "showroom",
    "done",
]


class Station(StrEnum):
    DISTILL = "distill"
    BLUEPRINT_APPROVAL = "blueprint_approval"
    BLUEPRINT = "blueprint"
    REVIEW_APPROVAL = "review_approval"
    REVIEW = "review"
    SHOWROOM = "showroom"
    DONE = "done"


APPROVAL_STATIONS = {Station.BLUEPRINT_APPROVAL, Station.REVIEW_APPROVAL}


def next_station(current: Station) -> Station:
    idx = _LINE.index(current.value)
    return Station(_LINE[idx + 1]) if idx + 1 < len(_LINE) else current


class Project(BaseModel):
    """Current-state projection of a project's position on the line. Persisted as the
    'STATE' record in the single-table DynamoDB schema (see docs/decisions.md)."""

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


def utcnow() -> datetime:
    return datetime.now(UTC)
