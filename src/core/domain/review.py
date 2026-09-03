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


class CopilotAssignment(BaseModel):
    """One blocker/major finding's resolution: the GitHub issue it was filed/found under."""

    finding_id: str
    issue_number: int
    issue_url: str | None = None
    created_new_issue: bool
    assigned: bool
    note: str | None = None


class ReviewReport(BaseModel):
    """G3 output contract: a gap report and coverage view against the FSD and Blueprint."""

    title: str
    findings: list[Finding]
    coverage: list[RequirementCoverage]
    completeness: CompletenessScore
    # Only present when Review was explicitly asked to hand blocker/major findings off
    # to GitHub Copilot's coding agent - empty otherwise, never invented.
    assignments: list[CopilotAssignment] = []
