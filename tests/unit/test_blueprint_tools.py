from tools.blueprint import validate_units_of_work


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
