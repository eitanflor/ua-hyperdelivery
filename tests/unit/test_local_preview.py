"""Local preview automation: pull, start, and stop the target repo's own preview script.

Every subprocess/socket call is injected here (`run`, `popen`, `port_open`) - no real
process is ever launched and no real socket is ever opened by this suite.
"""

from typing import Any

from infrastructure.local_preview import (
    PreviewTarget,
    pull_default_branch,
    start_preview,
    stop_preview,
)


class _FakeCompletedProcess:
    def __init__(self, returncode: int = 0, stdout: str = "", stderr: str = "") -> None:
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr


def test_pull_default_branch_reports_success() -> None:
    def run(*_args: Any, **_kwargs: Any) -> _FakeCompletedProcess:
        return _FakeCompletedProcess(stdout="Already up to date.")

    result = pull_default_branch("/some/checkout", run=run)

    assert result.ok is True
    assert result.message == "Already up to date."


def test_pull_default_branch_reports_a_diverged_checkout_honestly() -> None:
    def run(*_args: Any, **_kwargs: Any) -> _FakeCompletedProcess:
        return _FakeCompletedProcess(returncode=1, stderr="fatal: Not possible to fast-forward")

    result = pull_default_branch("/some/checkout", run=run)

    assert result.ok is False
    assert "fast-forward" in result.message


def test_pull_default_branch_reports_an_unreachable_git() -> None:
    def run(*_args: Any, **_kwargs: Any) -> _FakeCompletedProcess:
        raise OSError("git not found")

    result = pull_default_branch("/some/checkout", run=run)

    assert result.ok is False
    assert "git not found" in result.message


def test_start_preview_reports_healthy_once_ports_open() -> None:
    launched: list[tuple[Any, ...]] = []

    def popen(*args: Any, **kwargs: Any) -> object:
        launched.append((args, kwargs))
        return object()

    healthy = start_preview(
        PreviewTarget("/some/checkout", "./scripts/preview.sh", 8000, 5183),
        popen=popen,
        port_open=lambda _port: True,
        port_listening=lambda _port: False,
    )

    assert healthy is True
    assert launched  # the command was actually invoked


def test_start_preview_reports_unhealthy_when_ports_never_open() -> None:
    healthy = start_preview(
        PreviewTarget("/some/checkout", "./scripts/preview.sh", 8000, 5183),
        popen=lambda *_a, **_k: object(),
        port_open=lambda _port: False,
        port_listening=lambda _port: False,
    )

    assert healthy is False


def test_start_preview_survives_a_command_that_cannot_launch() -> None:
    def popen(*_args: Any, **_kwargs: Any) -> object:
        raise OSError("no such file or directory")

    healthy = start_preview(
        PreviewTarget("/some/checkout", "./scripts/preview.sh", 8000, 5183),
        popen=popen,
        port_open=lambda _port: True,
        port_listening=lambda _port: False,
    )

    assert healthy is False


def test_start_preview_does_not_launch_when_both_ports_are_already_open() -> None:
    launched: list[tuple[Any, ...]] = []

    def popen(*args: Any, **kwargs: Any) -> object:
        launched.append((args, kwargs))
        return object()

    healthy = start_preview(
        PreviewTarget("/some/checkout", "./scripts/preview.sh", 8000, 5183),
        popen=popen,
        port_open=lambda _port: True,
        port_listening=lambda _port: True,
    )

    assert healthy is True
    assert launched == []


def test_stop_preview_calls_the_scripts_own_stop_mode() -> None:
    calls: list[tuple[Any, ...]] = []

    def run(*args: Any, **kwargs: Any) -> _FakeCompletedProcess:
        calls.append((args, kwargs))
        return _FakeCompletedProcess()

    stop_preview("/some/checkout", "./scripts/preview.sh", run=run)

    assert calls[0][0][0][-1] == "stop"


def test_stop_preview_survives_an_unreachable_script() -> None:
    def run(*_args: Any, **_kwargs: Any) -> _FakeCompletedProcess:
        raise OSError("no such file or directory")

    stop_preview("/some/checkout", "./scripts/preview.sh", run=run)  # must not raise
