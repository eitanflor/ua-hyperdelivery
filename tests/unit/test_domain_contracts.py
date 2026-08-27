import pytest
from pydantic import ValidationError

from core.domain.blueprint import Blueprint, UnitOfWork
from core.domain.review import Finding, RequirementCoverage, ReviewReport
from core.domain.showroom import DemoDataSeed, DemoPackage, TalkTrackSection
from core.domain.spec import CompletenessScore, StructuredSpec


def test_structured_spec_requires_completeness_score() -> None:
    with pytest.raises(ValidationError):
        StructuredSpec(  # pyright: ignore[reportCallIssue]  # omission is the assertion
            title="t",
            requirements=[],
            gate_criteria=[],
            rules=[],
            evidence=[],
        )


def test_structured_spec_accepts_minimal_valid_payload() -> None:
    spec = StructuredSpec(
        title="t",
        requirements=[],
        gate_criteria=[],
        rules=[],
        evidence=[],
        completeness=CompletenessScore(score=0.5, gaps=["missing acceptance criteria"]),
    )

    assert spec.completeness.score == 0.5


def test_blueprint_accepts_units_of_work_with_dependencies() -> None:
    blueprint = Blueprint(
        title="t",
        architecture_summary="s",
        units_of_work=[
            UnitOfWork(id="u1", title="first", description="d"),
            UnitOfWork(id="u2", title="second", description="d", depends_on=["u1"]),
        ],
    )

    assert blueprint.units_of_work[1].depends_on == ["u1"]


def test_review_report_accepts_finding_without_requirement_id() -> None:
    report = ReviewReport(
        title="t",
        findings=[Finding(id="f1", severity="minor", description="d")],
        coverage=[RequirementCoverage(requirement_id="r1", met=True)],
    )

    assert report.findings[0].requirement_id is None


def test_demo_package_accepts_talk_track_and_demo_data() -> None:
    package = DemoPackage(
        title="t",
        summary="s",
        demo_data=[DemoDataSeed(entity="User", description="a sample user")],
        talk_track=[TalkTrackSection(requirement_id="r1", narration="n")],
    )

    assert package.talk_track[0].requirement_id == "r1"
