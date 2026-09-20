import pytest

from core.domain.context import GlobalContext
from tools import context


class _StubSettings:
    def __init__(self) -> None:
        self.projects_table = "table"
        self.aws_region = "us-east-1"


class _StubRepository:
    def __init__(self, value: GlobalContext) -> None:
        self._value = value

    def get_context(self) -> GlobalContext:
        return self._value


def test_get_context_returns_empty_string_when_none_recorded(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(context, "get_settings", lambda: _StubSettings())

    def fake_repository(table_name: str, region: str) -> _StubRepository:
        return _StubRepository(GlobalContext())

    monkeypatch.setattr(context, "ContextRepository", fake_repository)

    assert context.get_context() == ""


def test_get_context_returns_the_standing_context(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(context, "get_settings", lambda: _StubSettings())

    def fake_repository(table_name: str, region: str) -> _StubRepository:
        return _StubRepository(GlobalContext(context="Repo: org/repo."))

    monkeypatch.setattr(context, "ContextRepository", fake_repository)

    assert context.get_context() == "Repo: org/repo."
