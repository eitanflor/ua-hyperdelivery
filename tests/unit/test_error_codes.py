import re
from pathlib import Path

from api.errors import CATALOG, ApiError
from core.errors import ErrorCode, TurnErrorCode

_ERROR_CODES_TS = Path(__file__).parents[2] / "ui" / "console" / "src" / "api" / "errorCodes.ts"


def _ts_list(name: str) -> list[str]:
    source = _ERROR_CODES_TS.read_text()
    match = re.search(rf"export const {name} = \[(.*?)\] as const;", source, re.DOTALL)
    assert match, f"{name} not found in errorCodes.ts"
    return re.findall(r'"([^"]+)"', match.group(1))


def test_every_error_code_has_a_status_and_message() -> None:
    assert set(CATALOG) == set(ErrorCode)


def test_an_error_code_takes_its_status_from_the_catalog() -> None:
    error = ApiError(ErrorCode.PROJECT_NOT_FOUND)

    assert (error.status_code, error.detail, error.code) == (
        404,
        "project not found",
        ErrorCode.PROJECT_NOT_FOUND,
    )


def test_a_detail_adds_specifics_without_changing_the_status_or_code() -> None:
    error = ApiError(ErrorCode.NOT_AT_AGENT_STATION, "project is not at an agent station (at done)")

    assert (error.status_code, error.code) == (409, ErrorCode.NOT_AT_AGENT_STATION)
    assert error.detail == "project is not at an agent station (at done)"


def test_the_console_lists_every_error_code() -> None:
    assert _ts_list("ERROR_CODES") == [code.value for code in ErrorCode]


def test_the_console_lists_every_turn_error_code() -> None:
    assert _ts_list("TURN_ERROR_CODES") == [code.value for code in TurnErrorCode]
