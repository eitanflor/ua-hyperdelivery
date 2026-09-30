from datetime import UTC, datetime, timedelta

from core.domain.turn import MAX_MESSAGE_CHARS, MAX_RESULT_CHARS, MAX_TOOL_CALLS, TurnRecorder

START = datetime(2026, 9, 29, 12, 0, tzinfo=UTC)


def _recorder() -> TurnRecorder:
    return TurnRecorder("p1", "distill", START)


def test_a_turn_keeps_the_message_that_started_it() -> None:
    turn = TurnRecorder("p1", "distill", START, "a weekly returns report").finish(START)

    assert turn.message == "a weekly returns report"


def test_a_turn_without_a_message_records_none_rather_than_an_empty_string() -> None:
    assert TurnRecorder("p1", "distill", START, "").finish(START).message is None
    assert _recorder().finish(START).message is None


def test_an_oversized_message_is_cut_to_the_limit() -> None:
    turn = TurnRecorder("p1", "distill", START, "x" * (MAX_MESSAGE_CHARS + 500)).finish(START)

    assert turn.message is not None
    assert len(turn.message) == MAX_MESSAGE_CHARS


def test_a_turn_keeps_the_model_that_ran_it_beside_its_counts() -> None:
    recorder = _recorder()
    recorder.feed({"usage": {"input_tokens": 5, "model_id": "global.anthropic.claude-sonnet-5"}})

    turn = recorder.finish(START + timedelta(seconds=1))

    assert turn.usage == {"input_tokens": 5, "model_id": "global.anthropic.claude-sonnet-5"}


def test_a_turn_keeps_a_fractional_cost_beside_its_integer_token_counts() -> None:
    recorder = _recorder()
    recorder.feed({"usage": {"input_tokens": 5, "output_tokens": 7, "cost_usd": 0.0123}})

    turn = recorder.finish(START + timedelta(seconds=1))

    assert turn.usage == {"input_tokens": 5, "output_tokens": 7, "cost_usd": 0.0123}
    assert turn.usage is not None
    assert isinstance(turn.usage["input_tokens"], int)


def test_a_turn_keeps_its_text_calls_usage_and_duration() -> None:
    recorder = _recorder()
    recorder.feed({"chunk": "Reading"})
    recorder.feed({"tool_call": {"id": "t1", "name": "s3_get_document_text", "status": "running"}})
    recorder.feed(
        {
            "tool_call": {
                "id": "t1",
                "name": "s3_get_document_text",
                "status": "done",
                "input": {"key": "a.docx"},
                "result": "text",
            }
        }
    )
    recorder.feed({"usage": {"input_tokens": 5, "output_tokens": 7}})

    turn = recorder.finish(START + timedelta(seconds=12))

    assert turn.text == "Reading"
    assert turn.duration_ms == 12_000
    assert turn.usage == {"input_tokens": 5, "output_tokens": 7}
    [call] = turn.tool_calls
    assert (call.name, call.status, call.input, call.result) == (
        "s3_get_document_text",
        "done",
        {"key": "a.docx"},
        "text",
    )


def test_an_update_to_a_call_replaces_it_rather_than_adding_a_second_row() -> None:
    recorder = _recorder()
    recorder.feed({"tool_call": {"id": "t1", "name": "snowflake_query", "status": "running"}})
    recorder.feed(
        {
            "tool_call": {
                "id": "t1",
                "name": "snowflake_query",
                "status": "failed",
                "result": "denied",
            }
        }
    )

    [call] = recorder.finish(START).tool_calls

    assert (call.status, call.result) == ("failed", "denied")


def test_text_either_side_of_a_tool_call_starts_a_new_paragraph() -> None:
    # the wire has no separator, so "...from you:" ran straight into "I checked..."
    recorder = _recorder()
    recorder.feed({"chunk": "I need a few basics from you:"})
    recorder.feed({"tool_call": {"id": "t1", "name": "search_code", "status": "running"}})
    recorder.feed({"chunk": "I checked the library."})

    assert recorder.finish(START).text == "I need a few basics from you:\n\nI checked the library."


def test_a_call_that_never_reported_a_result_is_marked_interrupted() -> None:
    recorder = _recorder()
    recorder.feed(
        {"tool_call": {"id": "t1", "name": "create_pull_request_with_copilot", "status": "running"}}
    )

    [call] = recorder.finish(START).tool_calls

    assert call.status == "interrupted"


def test_a_long_result_is_clipped_and_a_large_structured_one_is_replaced() -> None:
    recorder = _recorder()
    recorder.feed(
        {
            "tool_call": {
                "id": "a",
                "name": "get_file_contents",
                "status": "done",
                "result": "x" * 5000,
            }
        }
    )
    recorder.feed(
        {
            "tool_call": {
                "id": "b",
                "name": "snowflake_query",
                "status": "done",
                "result": {"rows": "y" * 5000},
            }
        }
    )
    recorder.feed(
        {
            "tool_call": {
                "id": "c",
                "name": "score_completeness",
                "status": "done",
                "result": {"score": 1},
            }
        }
    )

    text_call, big_call, small_call = recorder.finish(START).tool_calls

    assert len(text_call.result) < MAX_RESULT_CHARS + 20
    assert text_call.result.endswith("(truncated)")
    assert big_call.result == "(a large result - not kept)"
    assert small_call.result == {"score": 1}


def test_calls_past_the_cap_are_dropped_not_stored() -> None:
    recorder = _recorder()
    for i in range(MAX_TOOL_CALLS + 5):
        recorder.feed({"tool_call": {"id": str(i), "name": "search_code", "status": "done"}})

    assert len(recorder.finish(START).tool_calls) == MAX_TOOL_CALLS


def test_a_failed_turn_keeps_what_it_did_and_says_why() -> None:
    recorder = _recorder()
    recorder.feed({"chunk": "Partway"})

    turn = recorder.finish(START + timedelta(seconds=3), error="agent invocation failed")

    assert (turn.text, turn.error) == ("Partway", "agent invocation failed")


def test_a_failed_turn_keeps_the_code_its_error_event_carried() -> None:
    recorder = _recorder()
    recorder.feed({"error": "agent invocation timed out", "code": "agent_timeout"})

    turn = recorder.finish(START, error="agent invocation timed out")

    assert turn.error_code == "agent_timeout"


def test_a_code_passed_at_the_end_wins_over_the_one_the_agent_sent() -> None:
    recorder = _recorder()
    recorder.feed({"error": "boom", "code": "agent_failed"})

    turn = recorder.finish(START, error="could not save", error_code="turn_failed")

    assert turn.error_code == "turn_failed"


def test_a_turn_that_did_not_fail_has_no_error_code() -> None:
    assert _recorder().finish(START).error_code is None
