from dataclasses import dataclass, field
from typing import Any

import pytest

from tools import snowflake


class _StubSecret:
    def __init__(self, value: str) -> None:
        self._value = value

    def get_secret_value(self) -> str:
        return self._value


@dataclass
class _StubSettings:
    snowflake_account: str | None = "acct"
    snowflake_pat: _StubSecret | None = field(default_factory=lambda: _StubSecret("secret"))
    snowflake_database: str | None = "DB"
    snowflake_schema: str | None = "SCH"


def test_snowflake_tools_returns_empty_list_when_not_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(snowflake, "get_settings", lambda: _StubSettings(snowflake_account=None))

    assert snowflake.snowflake_tools() == []


def test_snowflake_tools_returns_the_tool_when_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(snowflake, "get_settings", lambda: _StubSettings())

    assert snowflake.snowflake_tools() == [snowflake.snowflake_query]


def test_snowflake_tools_returns_the_tool_without_database_or_schema_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        snowflake,
        "get_settings",
        lambda: _StubSettings(snowflake_database=None, snowflake_schema=None),
    )

    assert snowflake.snowflake_tools() == [snowflake.snowflake_query]


async def test_snowflake_query_streams_the_agent_scoped_to_the_configured_schema(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(snowflake, "get_settings", lambda: _StubSettings())
    calls: dict[str, Any] = {}

    async def fake_stream_agent(creds: Any, question: str, system_instructions: str) -> Any:
        calls["args"] = (creds, question, system_instructions)
        yield "MATERIAL_CODE, SUPPLIER_NAME\n"
        yield "HF-01, Acme"

    monkeypatch.setattr(snowflake, "stream_agent", fake_stream_agent)

    results = [
        result
        async for result in snowflake.snowflake_query(
            "list materials from the MATERIAL_IMAGES table"
        )
    ]

    assert results == [
        "MATERIAL_CODE, SUPPLIER_NAME\n",
        "MATERIAL_CODE, SUPPLIER_NAME\nHF-01, Acme",
    ]
    _, question, system_instructions = calls["args"]
    assert question == "list materials from the MATERIAL_IMAGES table"
    assert "DB" in system_instructions
    assert "SCH" in system_instructions


async def test_snowflake_query_explores_unscoped_without_database_or_schema(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        snowflake,
        "get_settings",
        lambda: _StubSettings(snowflake_database=None, snowflake_schema=None),
    )
    calls: dict[str, Any] = {}

    async def fake_stream_agent(creds: Any, question: str, system_instructions: str) -> Any:
        calls["system_instructions"] = system_instructions
        yield "ok"

    monkeypatch.setattr(snowflake, "stream_agent", fake_stream_agent)

    _ = [result async for result in snowflake.snowflake_query("list materials")]

    assert "Only look in database" not in calls["system_instructions"]


async def test_snowflake_query_yields_an_empty_final_result_when_cortex_returns_no_text(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(snowflake, "get_settings", lambda: _StubSettings())

    async def fake_stream_agent(creds: Any, question: str, system_instructions: str) -> Any:
        if False:
            yield ""

    monkeypatch.setattr(snowflake, "stream_agent", fake_stream_agent)

    results = [result async for result in snowflake.snowflake_query("list materials")]

    assert results == [""]


async def test_snowflake_query_requires_account_and_pat(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(snowflake, "get_settings", lambda: _StubSettings(snowflake_account=None))

    with pytest.raises(ValueError, match="SNOWFLAKE_ACCOUNT"):
        _ = [result async for result in snowflake.snowflake_query("list materials")]
