import json
import re
from pathlib import Path

from core.constants import TURN_STOPPED, StreamEvent, ToolStatus

_PROTOCOL_TS = Path(__file__).parents[2] / "ui" / "console" / "src" / "api" / "protocol.ts"


def _ts_list(name: str) -> list[str]:
    source = _PROTOCOL_TS.read_text()
    match = re.search(rf"export const {name} = \[(.*?)\] as const;", source, re.DOTALL)
    assert match, f"{name} not found in protocol.ts"
    return re.findall(r'"([^"]+)"', match.group(1))


def test_stream_events_serialize_as_their_wire_names() -> None:
    event = {StreamEvent.TOOL_CALL: {"status": ToolStatus.FAILED}}

    assert json.dumps(event) == '{"tool_call": {"status": "failed"}}'


def test_the_console_protocol_lists_every_stream_event() -> None:
    assert _ts_list("STREAM_EVENTS") == [event.value for event in StreamEvent]


def test_the_console_protocol_lists_every_tool_status() -> None:
    assert _ts_list("TOOL_STATUSES") == [status.value for status in ToolStatus]


def test_the_console_protocol_names_the_stopped_marker() -> None:
    assert f'TURN_STOPPED = "{TURN_STOPPED}"' in _PROTOCOL_TS.read_text()
