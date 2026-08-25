from typing import Literal

from pydantic import BaseModel


class Finding(BaseModel):
    id: str
    severity: Literal["blocker", "major", "minor"]
    description: str
    requirement_id: str | None = None
    unit_id: str | None = None


class RequirementCoverage(BaseModel):
    requirement_id: str
    met: bool


class ReviewReport(BaseModel):
    """G3 output contract: a gap report and coverage view against the FSD and Blueprint."""

    title: str
    findings: list[Finding]
    coverage: list[RequirementCoverage]
