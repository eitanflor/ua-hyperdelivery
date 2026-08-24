from tools.distill import score_completeness


def test_score_completeness_scores_full_coverage_as_one():
    result = score_completeness(
        requirement_ids=["R1", "R2"],
        evidence_requirement_ids=["R1", "R2"],
        criteria_ids=["C1"],
        rule_criteria_ids=["C1"],
    )

    assert result == {"score": 1.0, "gaps": []}


def test_score_completeness_flags_missing_evidence_and_rules():
    result = score_completeness(
        requirement_ids=["R1", "R2"],
        evidence_requirement_ids=["R1"],
        criteria_ids=["C1"],
        rule_criteria_ids=[],
    )

    assert result["score"] == 0.33
    assert "requirement R2 has no linked evidence" in result["gaps"]
    assert "gate criterion C1 has no machine-readable rule" in result["gaps"]


def test_score_completeness_handles_empty_spec():
    result = score_completeness(
        requirement_ids=[], evidence_requirement_ids=[], criteria_ids=[], rule_criteria_ids=[]
    )

    assert result == {"score": 0.0, "gaps": []}
