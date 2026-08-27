from tools.showroom import validate_talk_track_coverage


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
