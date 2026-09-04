from tools.review import (
    score_review_completeness,
    validate_copilot_assignments,
    validate_review_report,
)


def test_validate_review_report_accepts_full_coverage_and_valid_severities() -> None:
    result = validate_review_report(
        requirement_ids=["r1", "r2"],
        finding_requirement_ids=["r1"],
        finding_severities=["blocker"],
        coverage_requirement_ids=["r1", "r2"],
    )

    assert result == {"valid": True, "issues": []}


def test_validate_review_report_flags_unknown_requirement_and_bad_severity() -> None:
    result = validate_review_report(
        requirement_ids=["r1"],
        finding_requirement_ids=["missing"],
        finding_severities=["catastrophic"],
        coverage_requirement_ids=["r1"],
    )

    assert result["valid"] is False
    assert "finding references unknown requirement missing" in result["issues"]
    assert "finding has invalid severity 'catastrophic'" in result["issues"]


def test_validate_review_report_flags_missing_and_extra_coverage() -> None:
    result = validate_review_report(
        requirement_ids=["r1", "r2"],
        finding_requirement_ids=[],
        finding_severities=[],
        coverage_requirement_ids=["r1", "r3"],
    )

    assert result["valid"] is False
    assert "requirement r2 missing from coverage view" in result["issues"]
    assert "coverage view references unknown requirement r3" in result["issues"]


def test_score_review_completeness_flags_no_upstream_input() -> None:
    result = score_review_completeness(requirement_ids=[], coverage_requirement_ids=[])

    assert result["score"] == 0.0
    assert any(
        "no approved spec or Blueprint reached this station" in gap for gap in result["gaps"]
    )


def test_score_review_completeness_tells_a_missing_build_apart_from_a_missing_spec() -> None:
    # A greenfield project that has only been planned is the normal case here, not a
    # broken line - one message for both hides which of the two actually happened.
    result = score_review_completeness(
        requirement_ids=["r1"], coverage_requirement_ids=["r1"], build_reference=""
    )

    assert result["score"] == 1.0
    assert any("nothing was given to check them against" in gap for gap in result["gaps"])
    assert not any("reached this station" in gap for gap in result["gaps"])


def test_score_review_completeness_scores_partial_coverage() -> None:
    result = score_review_completeness(
        requirement_ids=["r1", "r2"],
        coverage_requirement_ids=["r1"],
        build_reference="underarmour/promo-tier-validator#12",
    )

    assert result["score"] == 0.5
    assert (
        "requirement r2 has no coverage entry saying whether the build meets it" in result["gaps"]
    )


def test_score_review_completeness_scores_full_coverage_as_one() -> None:
    result = score_review_completeness(
        requirement_ids=["r1"],
        coverage_requirement_ids=["r1"],
        build_reference="underarmour/promo-tier-validator#12",
    )

    assert result == {"score": 1.0, "gaps": []}


def test_validate_copilot_assignments_accepts_full_coverage_of_blocker_and_major_findings() -> None:
    result = validate_copilot_assignments(
        finding_ids=["f1", "f2", "f3"],
        finding_severities=["blocker", "major", "minor"],
        assignment_finding_ids=["f1", "f2"],
    )

    assert result == {"valid": True, "issues": []}


def test_validate_copilot_assignments_flags_unassigned_blocker_and_major_findings() -> None:
    result = validate_copilot_assignments(
        finding_ids=["f1", "f2", "f3"],
        finding_severities=["blocker", "major", "minor"],
        assignment_finding_ids=[],
    )

    assert result["valid"] is False
    assert "blocker/major finding f1 has no assignment" in result["issues"]
    assert "blocker/major finding f2 has no assignment" in result["issues"]


def test_validate_copilot_assignments_flags_unknown_and_non_assignable_assignments() -> None:
    result = validate_copilot_assignments(
        finding_ids=["f1", "f2"],
        finding_severities=["blocker", "minor"],
        assignment_finding_ids=["missing", "f2"],
    )

    assert result["valid"] is False
    assert "assignment references unknown finding missing" in result["issues"]
    assert "assignment references non-assignable finding f2" in result["issues"]
    assert "blocker/major finding f1 has no assignment" in result["issues"]


def test_validate_copilot_assignments_flags_duplicate_assignments_instead_of_passing() -> None:
    result = validate_copilot_assignments(
        finding_ids=["f1"],
        finding_severities=["blocker"],
        assignment_finding_ids=["f1", "f1"],
    )

    assert result["valid"] is False
    assert "blocker/major finding f1 has 2 assignments, expected exactly one" in result["issues"]


def test_validate_copilot_assignments_reports_mismatched_lengths_instead_of_raising() -> None:
    result = validate_copilot_assignments(
        finding_ids=["f1", "f2"],
        finding_severities=["blocker"],
        assignment_finding_ids=["f1"],
    )

    assert result["valid"] is False
    assert len(result["issues"]) == 1
    assert "finding_ids has 2 entries but finding_severities has 1" in result["issues"][0]
