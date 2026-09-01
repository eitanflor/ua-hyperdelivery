from tools.showroom import score_showroom_completeness, validate_talk_track_coverage


def test_validate_talk_track_coverage_accepts_full_coverage() -> None:
    result = validate_talk_track_coverage(
        requirement_ids=["r1", "r2"], talk_track_requirement_ids=["r1", "r2"]
    )

    assert result == {"valid": True, "missing_requirement_ids": []}


def test_validate_talk_track_coverage_flags_missing_requirement() -> None:
    result = validate_talk_track_coverage(
        requirement_ids=["r1", "r2"], talk_track_requirement_ids=["r1"]
    )

    assert result == {"valid": False, "missing_requirement_ids": ["r2"]}


def test_score_showroom_completeness_flags_no_upstream_input() -> None:
    result = score_showroom_completeness(requirement_ids=[])

    assert result["score"] == 0.0
    assert any("no spec that cleared Review" in gap for gap in result["gaps"])


def test_score_showroom_completeness_scores_present_input_as_one() -> None:
    result = score_showroom_completeness(requirement_ids=["r1"])

    assert result == {"score": 1.0, "gaps": []}
