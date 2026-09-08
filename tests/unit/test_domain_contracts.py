from core.domain.blueprint import Blueprint, UnitOfWork
from core.domain.project import CompletenessScore
from core.domain.review import Finding, RequirementCoverage, ReviewReport
from core.domain.showroom import DemoDataSeed, DemoPackage, TalkTrackSection
from core.domain.spec import Requirement, StructuredSpec


def test_structured_spec_defaults_completeness_score() -> None:
    # score/gaps are always recomputed server-side (core.validation.spec.evaluate_spec),
    # so a model that omits this on a trivial turn shouldn't force a retry round trip.
    spec = StructuredSpec(
        title="t",
        requirements=[],
        gate_criteria=[],
        rules=[],
        rule_correlations=[],
        evidence=[],
        acceptance_criteria=[],
        business_value=[],
        intents=[],
    )

    assert spec.completeness == CompletenessScore(score=0.0)


def test_structured_spec_accepts_minimal_valid_payload() -> None:
    spec = StructuredSpec(
        title="t",
        requirements=[],
        gate_criteria=[],
        rules=[],
        rule_correlations=[],
        evidence=[],
        acceptance_criteria=[],
        business_value=[],
        intents=[],
        completeness=CompletenessScore(score=0.5, gaps=["missing acceptance criteria"]),
    )

    assert spec.completeness.score == 0.5


def test_structured_spec_tracks_missing_required_sections() -> None:
    spec = StructuredSpec(
        title="t",
        requirements=[],
        gate_criteria=[],
        rules=[],
        rule_correlations=[],
        evidence=[],
        completeness=CompletenessScore(score=0.0, gaps=[]),
    )

    assert "functional_requirements" in spec.missing_required_sections
    assert "acceptance_criteria" not in spec.missing_required_sections
    assert "constraints" not in spec.missing_required_sections


def test_structured_spec_accepts_all_required_sections_without_section_gaps() -> None:
    spec = StructuredSpec(
        title="t",
        objective="Ship a feature",
        scope="Backend only",
        actors=["Developer"],
        requirements=[Requirement(id="R1", description="Do the thing")],
        business_rules=[],
        data_requirements=[],
        data_connectors=[],
        snowflake_connectors=[],
        workflows=[],
        non_functional_requirements=[],
        open_questions=[],
        gate_criteria=[],
        rules=[],
        rule_correlations=[],
        evidence=[],
        completeness=CompletenessScore(score=1.0, gaps=[]),
    )

    assert spec.missing_required_sections == []


def test_blueprint_accepts_units_of_work_with_dependencies() -> None:
    blueprint = Blueprint(
        title="t",
        architecture_summary="s",
        units_of_work=[
            UnitOfWork(id="u1", title="first", description="d"),
            UnitOfWork(id="u2", title="second", description="d", depends_on=["u1"]),
        ],
        completeness=CompletenessScore(score=1.0, gaps=[]),
    )

    assert blueprint.units_of_work[1].depends_on == ["u1"]


def test_blueprint_defaults_completeness_score() -> None:
    blueprint = Blueprint(title="t", architecture_summary="s", units_of_work=[])

    assert blueprint.completeness == CompletenessScore(score=0.0)


def test_review_report_accepts_finding_without_requirement_id() -> None:
    report = ReviewReport(
        title="t",
        findings=[Finding(id="f1", severity="minor", description="d")],
        coverage=[RequirementCoverage(requirement_id="r1", met=True)],
        completeness=CompletenessScore(score=1.0, gaps=[]),
    )

    assert report.findings[0].requirement_id is None


def test_review_report_defaults_completeness_score() -> None:
    report = ReviewReport(title="t", findings=[], coverage=[])

    assert report.completeness == CompletenessScore(score=0.0)


def test_demo_package_accepts_talk_track_and_demo_data() -> None:
    package = DemoPackage(
        title="t",
        summary="s",
        demo_data=[DemoDataSeed(entity="User", description="a sample user")],
        talk_track=[TalkTrackSection(requirement_id="r1", narration="n")],
        completeness=CompletenessScore(score=1.0, gaps=[]),
    )

    assert package.talk_track[0].requirement_id == "r1"


def test_demo_package_defaults_completeness_score() -> None:
    package = DemoPackage(title="t", summary="s", demo_data=[], talk_track=[])

    assert package.completeness == CompletenessScore(score=0.0)
