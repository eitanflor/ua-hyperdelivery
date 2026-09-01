from tools.distill import score_completeness, validate_structured_spec


def test_score_completeness_scores_full_coverage_as_one() -> None:
    result = score_completeness(
        requirement_ids=["R1", "R2"],
        evidence_requirement_ids=["R1", "R2"],
        criteria_ids=["C1"],
        rule_criteria_ids=["C1"],
    )

    assert result == {"score": 1.0, "gaps": []}


def test_score_completeness_flags_missing_evidence_and_rules() -> None:
    result = score_completeness(
        requirement_ids=["R1", "R2"],
        evidence_requirement_ids=["R1"],
        criteria_ids=["C1"],
        rule_criteria_ids=[],
    )

    assert result["score"] == 0.33
    assert "requirement R2 has no linked evidence" in result["gaps"]
    assert "gate criterion C1 has no machine-readable rule" in result["gaps"]


def test_score_completeness_handles_empty_spec() -> None:
    result = score_completeness(
        requirement_ids=[], evidence_requirement_ids=[], criteria_ids=[], rule_criteria_ids=[]
    )

    assert result["score"] == 0.0
    assert any("no requirements or gate criteria were extracted" in gap for gap in result["gaps"])


def test_validate_structured_spec_accepts_consistent_ids() -> None:
    result = validate_structured_spec(
        requirement_ids=["R1", "R2"],
        gate_criteria_ids=["C1"],
        rule_criteria_ids=["C1"],
        evidence_requirement_ids=["R1"],
    )

    assert result == {"valid": True, "issues": []}


def test_validate_structured_spec_flags_duplicate_ids() -> None:
    result = validate_structured_spec(
        requirement_ids=["R1", "R1"],
        gate_criteria_ids=["C1", "C1"],
        rule_criteria_ids=[],
        evidence_requirement_ids=[],
    )

    assert result["valid"] is False
    assert "duplicate requirement id R1" in result["issues"]
    assert "duplicate gate criterion id C1" in result["issues"]


def test_validate_structured_spec_flags_dangling_references() -> None:
    result = validate_structured_spec(
        requirement_ids=["R1"],
        gate_criteria_ids=["C1"],
        rule_criteria_ids=["missing"],
        evidence_requirement_ids=["missing"],
    )

    assert result["valid"] is False
    assert "rule references unknown gate criterion missing" in result["issues"]
    assert "evidence references unknown requirement missing" in result["issues"]
