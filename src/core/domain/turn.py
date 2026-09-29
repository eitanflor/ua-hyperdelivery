"""What one agent turn did: the record kept so the trace outlives the browser that watched it."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

# A DynamoDB item is capped at 400 KB and a turn shares the table with everything else, so
# what is kept is what a reader needs to check the work, not a copy of every fetched file.
MAX_RESULT_CHARS = 1500
MAX_TEXT_CHARS = 20_000
MAX_MESSAGE_CHARS = 8_000
MAX_TOOL_CALLS = 60

_LARGE_RESULT_NOTE = "(a large result - not kept)"


class ToolCallRecord(BaseModel):
    """One tool call in a turn, with its result cut down to what a reader can use."""

    id: str
    name: str
    status: str
    input: dict[str, Any] | None = None
    result: Any = None


class Turn(BaseModel):
    """One agent's turn on a project: what it said, what it called, what it cost."""

    project_id: str
    agent: str
    started_at: datetime
    # What the person sent to start the turn, when the console said so - the other half of the
    # conversation, which the agent's own record does not contain.
    message: str | None = None
    duration_ms: int | None = None
    text: str = ""
    tool_calls: list[ToolCallRecord] = Field(default_factory=list)
    usage: dict[str, int] | None = None
    # Set when the turn ended in a failure, so a run that produced nothing is still visible.
    error: str | None = None


def clip_result(result: object) -> object:
    """`result` cut to `MAX_RESULT_CHARS`; an oversized structured result becomes a note."""
    if isinstance(result, str):
        if len(result) <= MAX_RESULT_CHARS:
            return result
        return f"{result[:MAX_RESULT_CHARS]}\u2026 (truncated)"
    if result is None:
        return None
    try:
        size = len(repr(result))
    except RecursionError:
        return _LARGE_RESULT_NOTE
    return result if size <= MAX_RESULT_CHARS else _LARGE_RESULT_NOTE


class TurnRecorder:
    """Builds a `Turn` from the events an agent streams, without touching storage.

    Feed it every event in order; it keeps only what a `Turn` holds. Text streamed on
    either side of a tool call has no separator on the wire, so the first chunk after a
    call starts a new paragraph - the same rule the console applies while streaming.
    """

    def __init__(
        self, project_id: str, agent: str, started_at: datetime, message: str | None = None
    ) -> None:
        """Start recording a turn of `agent` on `project_id` that began at `started_at`."""
        self._project_id = project_id
        self._agent = agent
        self._started_at = started_at
        self._message = message[:MAX_MESSAGE_CHARS] if message else None
        self._text = ""
        self._calls: dict[str, ToolCallRecord] = {}
        self._usage: dict[str, int] | None = None
        self._after_tool_call = False

    def feed(self, event: dict[str, Any]) -> None:
        """Take one streamed event: a text chunk, a tool call update, or the token usage."""
        chunk = event.get("chunk")
        if isinstance(chunk, str) and chunk:
            joiner = (
                "\n\n"
                if self._after_tool_call and self._text and not self._text.endswith("\n")
                else ""
            )
            self._after_tool_call = False
            self._text += joiner + chunk
            return
        call = event.get("tool_call")
        if isinstance(call, dict):
            self._record_call(call)
            return
        usage = event.get("usage")
        if isinstance(usage, dict):
            self._usage = {str(k): int(v) for k, v in usage.items() if isinstance(v, int)}

    def _record_call(self, call: dict[str, Any]) -> None:
        call_id = call.get("id")
        name = call.get("name")
        if not isinstance(call_id, str) or not isinstance(name, str):
            return
        status = str(call.get("status", "running"))
        if status == "running":
            self._after_tool_call = True
        known = self._calls.get(call_id)
        if known is None and len(self._calls) >= MAX_TOOL_CALLS:
            return
        previous_input = known.input if known else None
        input_ = call.get("input")
        self._calls[call_id] = ToolCallRecord(
            id=call_id,
            name=name,
            status=status,
            input=input_ if isinstance(input_, dict) else previous_input,
            result=clip_result(call.get("result"))
            if "result" in call
            else (known.result if known else None),
        )

    def finish(self, finished_at: datetime, error: str | None = None) -> Turn:
        """The turn as recorded. A call that never reported a result is marked interrupted."""
        calls = [
            call.model_copy(update={"status": "interrupted"}) if call.status == "running" else call
            for call in self._calls.values()
        ]
        elapsed = int((finished_at - self._started_at).total_seconds() * 1000)
        return Turn(
            project_id=self._project_id,
            agent=self._agent,
            started_at=self._started_at,
            message=self._message,
            duration_ms=max(0, elapsed),
            text=self._text[:MAX_TEXT_CHARS],
            tool_calls=calls,
            usage=self._usage,
            error=error,
        )
