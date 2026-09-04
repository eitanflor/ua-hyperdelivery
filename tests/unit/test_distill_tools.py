from tools.distill import score_completeness, validate_rule_correlations, validate_structured_spec


def test_score_completeness_scores_full_coverage_as_one() -> None:
    result = score_completeness(
        requirement_ids=["R1", "R2"],
        criteria_ids=["C1"],
        rule_criteria_ids=["C1"],
        requirement_coverage={
            "evidence_requirement_ids": ["R1", "R2"],
            "acceptance_criterion_requirement_ids": ["R1", "R2"],
            "business_value_requirement_ids": ["R1", "R2"],
            "intent_requirement_ids": ["R1", "R2"],
        },
    )

    assert result == {"score": 1.0, "gaps": []}


def test_score_completeness_ignores_a_repeated_id_rather_than_scoring_it_twice() -> None:
    # coverage is set-based, so a duplicate only in the denominator would report this
    # fully-covered spec as incomplete - and disagree with the gate that overrules it
    result = score_completeness(
        requirement_ids=["R1", "R1"],
        criteria_ids=["C1", "C1"],
        rule_criteria_ids=["C1"],
        requirement_coverage={
            "evidence_requirement_ids": ["R1"],
            "acceptance_criterion_requirement_ids": ["R1"],
            "business_value_requirement_ids": ["R1"],
            "intent_requirement_ids": ["R1"],
        },
    )

    assert result == {"score": 1.0, "gaps": []}


def test_score_completeness_flags_missing_evidence_and_rules() -> None:
    result = score_completeness(
        requirement_ids=["R1", "R2"],
        criteria_ids=["C1"],
        rule_criteria_ids=[],
        requirement_coverage={
            "evidence_requirement_ids": ["R1"],
            "acceptance_criterion_requirement_ids": ["R1", "R2"],
            "business_value_requirement_ids": ["R1", "R2"],
            "intent_requirement_ids": ["R1", "R2"],
        },
    )

    assert result["score"] == 0.78
    assert "requirement R2 has no linked evidence" in result["gaps"]
    assert "gate criterion C1 has no machine-readable rule" in result["gaps"]


def test_score_completeness_flags_missing_business_context() -> None:
    result = score_completeness(
        requirement_ids=["R1"],
        criteria_ids=[],
        rule_criteria_ids=[],
        requirement_coverage={
            "evidence_requirement_ids": ["R1"],
            "acceptance_criterion_requirement_ids": [],
            "business_value_requirement_ids": [],
            "intent_requirement_ids": [],
        },
    )

    assert "requirement R1 has no acceptance criterion" in result["gaps"]
    assert "requirement R1 has no business value (use case/ROI)" in result["gaps"]
    assert "requirement R1 has no intent classification" in result["gaps"]


def test_score_completeness_handles_empty_spec() -> None:
    result = score_completeness(
        requirement_ids=[],
        criteria_ids=[],
        rule_criteria_ids=[],
        requirement_coverage={},
    )

    assert result["score"] == 0.0
    assert any("no requirements or gate criteria were extracted" in gap for gap in result["gaps"])


def test_validate_structured_spec_accepts_consistent_ids() -> None:
    result = validate_structured_spec(
        requirement_ids=["R1", "R2"],
        gate_criteria_ids=["C1"],
        rule_ids=["RU1"],
        rule_criteria_ids=["C1"],
        requirement_coverage={
            "evidence_requirement_ids": ["R1"],
            "acceptance_criterion_requirement_ids": ["R1", "R2"],
            "business_value_requirement_ids": ["R1", "R2"],
            "intent_requirement_ids": ["R1", "R2"],
        },
    )

    assert result == {"valid": True, "issues": []}


def test_validate_structured_spec_flags_duplicate_ids() -> None:
    result = validate_structured_spec(
        requirement_ids=["R1", "R1"],
        gate_criteria_ids=["C1", "C1"],
        rule_ids=["RU1", "RU1"],
        rule_criteria_ids=[],
        requirement_coverage={},
    )

    assert result["valid"] is False
    assert "duplicate requirement id R1" in result["issues"]
    assert "duplicate gate criterion id C1" in result["issues"]
    assert "duplicate rule id RU1" in result["issues"]


def test_validate_structured_spec_flags_dangling_references() -> None:
    result = validate_structured_spec(
        requirement_ids=["R1"],
        gate_criteria_ids=["C1"],
        rule_ids=["RU1"],
        rule_criteria_ids=["missing"],
        requirement_coverage={
            "evidence_requirement_ids": ["missing"],
            "acceptance_criterion_requirement_ids": ["missing"],
            "business_value_requirement_ids": ["missing"],
            "intent_requirement_ids": ["missing"],
        },
    )

    assert result["valid"] is False
    assert "rule references unknown gate criterion missing" in result["issues"]
    assert "evidence references unknown requirement missing" in result["issues"]
    assert "acceptance criterion references unknown requirement missing" in result["issues"]
    assert "business value references unknown requirement missing" in result["issues"]
    assert "intent classification references unknown requirement missing" in result["issues"]
    assert "requirement R1 has no intent classification" in result["issues"]


def test_validate_rule_correlations_accepts_known_rule_ids() -> None:
    result = validate_rule_correlations(
        rule_ids=["RU1", "RU2"], rule_correlation_rule_ids=[["RU1", "RU2"]]
    )

    assert result == {"valid": True, "issues": []}


def test_validate_rule_correlations_flags_unknown_rule_id() -> None:
    result = validate_rule_correlations(
        rule_ids=["RU1"], rule_correlation_rule_ids=[["RU1", "missing"]]
    )

    assert result["valid"] is False
    assert "rule correlation references unknown rule missing" in result["issues"]
