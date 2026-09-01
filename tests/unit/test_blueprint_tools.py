from tools.blueprint import score_blueprint_completeness, validate_units_of_work


def test_validate_units_of_work_accepts_valid_dag() -> None:
    result = validate_units_of_work(unit_ids=["u1", "u2"], dependencies={"u1": [], "u2": ["u1"]})

    assert result == {"valid": True, "issues": []}


def test_validate_units_of_work_flags_unknown_dependency() -> None:
    result = validate_units_of_work(unit_ids=["u1"], dependencies={"u1": ["missing"]})

    assert result["valid"] is False
    assert "unit u1 depends on unknown unit missing" in result["issues"]


def test_validate_units_of_work_flags_cycle() -> None:
    result = validate_units_of_work(
        unit_ids=["u1", "u2"], dependencies={"u1": ["u2"], "u2": ["u1"]}
    )

    assert result["valid"] is False
    assert any("dependency cycle" in issue for issue in result["issues"])


def test_score_blueprint_completeness_flags_no_upstream_input() -> None:
    result = score_blueprint_completeness(requirement_ids=[], covered_requirement_ids=[])

    assert result["score"] == 0.0
    assert any("no approved spec" in gap for gap in result["gaps"])


def test_score_blueprint_completeness_flags_uncovered_requirement() -> None:
    result = score_blueprint_completeness(
        requirement_ids=["R1", "R2"], covered_requirement_ids=["R1"]
    )

    assert result["score"] == 0.5
    assert "requirement R2 has no unit of work addressing it" in result["gaps"]


def test_score_blueprint_completeness_scores_full_coverage_as_one() -> None:
    result = score_blueprint_completeness(
        requirement_ids=["R1", "R2"], covered_requirement_ids=["R1", "R2"]
    )

    assert result == {"score": 1.0, "gaps": []}
