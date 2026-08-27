"""Tests for settings loading and the observability setup the agents install at boot."""

import logging

import pytest
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider

from config.settings import Settings, get_settings
from infrastructure.observability.logging import (
    SessionIdFilter,
    configure_logging,
    session_id_var,
)
from infrastructure.observability.tracing import configure_tracing


def test_settings_are_cached_per_process() -> None:
    assert get_settings() is get_settings()


def test_settings_read_from_the_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LOG_LEVEL", "DEBUG")
    monkeypatch.setenv("PROJECTS_TABLE", "some-other-table")

    settings = Settings()

    assert settings.log_level == "DEBUG"
    assert settings.projects_table == "some-other-table"


def test_settings_ignore_unrelated_env_vars(monkeypatch: pytest.MonkeyPatch) -> None:
    # .env is shared with the Makefile, so it carries vars that aren't Settings fields.
    monkeypatch.setenv("AWS_PROFILE", "some-profile")

    assert Settings().environment == "local"


def test_configure_logging_installs_a_single_session_aware_handler() -> None:
    configure_logging("DEBUG")
    configure_logging("INFO")

    root = logging.getLogger()

    assert len(root.handlers) == 1
    assert root.level == logging.INFO
    assert any(isinstance(f, SessionIdFilter) for f in root.handlers[0].filters)


def test_session_id_filter_stamps_the_current_session() -> None:
    session_id_var.set("session-xyz")
    record = logging.LogRecord("n", logging.INFO, "p", 1, "msg", None, None)

    assert SessionIdFilter().filter(record) is True
    assert getattr(record, "session_id") == "session-xyz"  # noqa: B009  # attached dynamically


def test_configure_tracing_registers_a_real_provider_once() -> None:
    configure_tracing()
    provider = trace.get_tracer_provider()

    configure_tracing()

    assert isinstance(provider, TracerProvider)
    assert trace.get_tracer_provider() is provider
