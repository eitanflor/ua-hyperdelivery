"""G3 artifact: what Review found when it checked the build against spec and design."""

from typing import Literal

from pydantic import BaseModel

from core.domain.project import CompletenessScore


class Finding(BaseModel):
    """One gap, mistake or standards deviation, traced back to what it violates."""

    id: str
    severity: Literal["blocker", "major", "minor"]
    description: str
    requirement_id: str | None = None
    unit_id: str | None = None


class RequirementCoverage(BaseModel):
    """Whether one requirement is actually met by the built deliverable."""

    requirement_id: str
    met: bool


class ReviewReport(BaseModel):
    """G3 output contract: a gap report and coverage view against the FSD and Blueprint."""

    title: str
    findings: list[Finding]
    coverage: list[RequirementCoverage]
    completeness: CompletenessScore
