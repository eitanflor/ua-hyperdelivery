from tools.review import validate_review_report


def test_validate_review_report_accepts_full_coverage_and_valid_severities():
    result = validate_review_report(
        requirement_ids=["r1", "r2"],
        finding_requirement_ids=["r1"],
        finding_severities=["blocker"],
        coverage_requirement_ids=["r1", "r2"],
    )

    assert result == {"valid": True, "issues": []}


def test_validate_review_report_flags_unknown_requirement_and_bad_severity():
    result = validate_review_report(
        requirement_ids=["r1"],
        finding_requirement_ids=["missing"],
        finding_severities=["catastrophic"],
        coverage_requirement_ids=["r1"],
    )

    assert result["valid"] is False
    assert "finding references unknown requirement missing" in result["issues"]
    assert "finding has invalid severity 'catastrophic'" in result["issues"]


def test_validate_review_report_flags_missing_and_extra_coverage():
    result = validate_review_report(
        requirement_ids=["r1", "r2"],
        finding_requirement_ids=[],
        finding_severities=[],
        coverage_requirement_ids=["r1", "r3"],
    )

    assert result["valid"] is False
    assert "requirement r2 missing from coverage view" in result["issues"]
    assert "coverage view references unknown requirement r3" in result["issues"]
