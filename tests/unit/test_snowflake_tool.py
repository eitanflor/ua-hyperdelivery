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


def test_snowflake_query_asks_the_agent_scoped_to_the_configured_schema(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(snowflake, "get_settings", lambda: _StubSettings())
    calls: dict[str, Any] = {}

    def fake_run_agent(creds: Any, question: str, system_instructions: str) -> str:
        calls["args"] = (creds, question, system_instructions)
        return "MATERIAL_CODE, SUPPLIER_NAME\nHF-01, Acme"

    monkeypatch.setattr(snowflake, "run_agent", fake_run_agent)

    result = snowflake.snowflake_query("list materials from the MATERIAL_IMAGES table")

    assert result == "MATERIAL_CODE, SUPPLIER_NAME\nHF-01, Acme"
    _, question, system_instructions = calls["args"]
    assert question == "list materials from the MATERIAL_IMAGES table"
    assert "DB" in system_instructions
    assert "SCH" in system_instructions


def test_snowflake_query_explores_unscoped_without_database_or_schema(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        snowflake,
        "get_settings",
        lambda: _StubSettings(snowflake_database=None, snowflake_schema=None),
    )
    calls: dict[str, Any] = {}

    def fake_run_agent(creds: Any, question: str, system_instructions: str) -> str:
        calls["system_instructions"] = system_instructions
        return "ok"

    monkeypatch.setattr(snowflake, "run_agent", fake_run_agent)

    snowflake.snowflake_query("list materials")

    assert "Only look in database" not in calls["system_instructions"]


def test_snowflake_query_requires_account_and_pat(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(snowflake, "get_settings", lambda: _StubSettings(snowflake_account=None))

    with pytest.raises(ValueError, match="SNOWFLAKE_ACCOUNT"):
        snowflake.snowflake_query("list materials")
