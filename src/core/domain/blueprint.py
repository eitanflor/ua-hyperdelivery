"""G2 artifact: the implementation plan Blueprint derives from an approved spec."""

from pydantic import BaseModel

from core.domain.project import CompletenessScore


class UnitOfWork(BaseModel):
    """One task sized for a single coding-agent run, with its upstream dependencies."""

    id: str
    title: str
    description: str
    depends_on: list[str] = []


class Blueprint(BaseModel):
    """G2 output contract: an approved spec turned into an implementation plan."""

    title: str
    architecture_summary: str
    units_of_work: list[UnitOfWork]
    completeness: CompletenessScore
