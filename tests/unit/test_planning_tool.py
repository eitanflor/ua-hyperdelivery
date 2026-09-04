"""The plan tool every station calls first, so a long turn does not drift."""

from tools.planning import track_plan


def test_accepts_a_plan_with_one_step_in_progress() -> None:
    result = track_plan(
        steps={"read the FSD": "done", "extract requirements": "in_progress", "score it": "pending"}
    )

    assert result["valid"] is True
    assert result["issues"] == []
    assert result["current_step"] == "extract requirements"
    assert result["remaining_steps"] == ["score it"]


def test_flags_a_single_step_plan_as_not_a_plan() -> None:
    result = track_plan(steps={"do the work": "in_progress"})

    assert result["valid"] is False
    assert any("at least 2 steps" in issue for issue in result["issues"])


def test_flags_working_on_more_than_one_step_at_once() -> None:
    result = track_plan(steps={"extract": "in_progress", "score": "in_progress"})

    assert result["valid"] is False
    assert any("work one step at a time" in issue for issue in result["issues"])


def test_flags_an_unknown_status() -> None:
    result = track_plan(steps={"extract": "started", "score": "pending"})

    assert result["valid"] is False
    assert any("invalid status 'started'" in issue for issue in result["issues"])


def test_reports_no_current_step_once_everything_is_done() -> None:
    result = track_plan(steps={"extract": "done", "score": "done"})

    assert result["valid"] is True
    assert result["current_step"] is None
    assert result["remaining_steps"] == []
