"""G3 artifact: what Review found when it checked the build against spec and design."""

from typing import Literal

from pydantic import BaseModel, Field

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
    #: Set instead of a fresh `assign_copilot_to_issue` call when the issue already had an
    #: open pull request - Copilot was asked to keep iterating on that PR via an
    #: `@copilot`-mentioning comment rather than starting a second, colliding session.
    pull_request_number: int | None = None


class BuildPullRequest(BaseModel):
    """One delivery group handed to a coding agent, and where to watch it.

    Recorded so the console can link straight to the work and poll its checks without a
    second model call - see api.routers.builds.
    """

    group_id: str
    number: int
    url: str
    unit_ids: list[str] = []
    issue_numbers: list[int] = []


class ReviewReport(BaseModel):
    """G3 output contract: a gap report and coverage view against the FSD and Blueprint."""

    title: str
    findings: list[Finding]
    coverage: list[RequirementCoverage]
    # Defaulted, not required: score and gaps are always recomputed server-side from the
    # stored artifact (see core.validation.review.evaluate_review).
    completeness: CompletenessScore = Field(default_factory=lambda: CompletenessScore(score=0.0))
    # Populated automatically for every blocker/major finding when GitHub tools and a
    # repository reference are available - empty otherwise, never invented.
    assignments: list[CopilotAssignment] = []
    # One entry per delivery group handed to a coding agent this turn (see core.delivery).
    builds: list[BuildPullRequest] = []
    #: "owner/repo" the builds live in, so the console can poll them.
    repository: str | None = None
