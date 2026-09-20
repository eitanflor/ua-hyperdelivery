"""Runs the target repo's own preview script locally, for a demo on this machine.

Not `providers/` (no third-party SDK) and not `tools/` (no agent calls this): it shells
out to whatever preview mechanism the target repo already has, on the one machine
running both the console API and that checkout. This is a laptop-demo convenience, not
the hosted "preview per pull request" `docs/hyperdelivery-plan.md`'s Phase 3 describes -
single checkout, single preview process, no multi-project isolation.
"""

import logging
import shlex
import socket
import subprocess
import threading
import time
from collections.abc import Callable
from typing import NamedTuple, Protocol

logger = logging.getLogger(__name__)

_PULL_TIMEOUT_SECONDS = 30.0
_STOP_TIMEOUT_SECONDS = 30.0
# Generous: the target repo's preview script syncs dependencies before it opens a port,
# and a cold `uv sync`/`npm install` can take longer than the servers themselves do to boot.
_HEALTH_TIMEOUT_SECONDS = 90.0
_HEALTH_POLL_SECONDS = 0.5
_PREVIEW_LOCK = threading.Lock()


class _CompletedProcess(Protocol):
    """The subset of `subprocess.CompletedProcess` this module actually reads."""

    returncode: int
    stdout: str
    stderr: str


_Runner = Callable[..., _CompletedProcess]
_Popen = Callable[..., object]
_PortCheck = Callable[[int], bool]


class PullResult(NamedTuple):
    """Whether the checkout's default branch fast-forwarded cleanly."""

    ok: bool
    message: str


class PreviewTarget(NamedTuple):
    """Where the checkout lives, how to preview it, and which ports it should open."""

    path: str
    command: str
    backend_port: int
    frontend_port: int


def pull_default_branch(path: str, run: _Runner = subprocess.run) -> PullResult:
    """Fast-forward `path` to its remote - never force, never touch a dirty tree.

    `--ff-only` is the whole safety story: a checkout with local changes or a diverged
    history fails instead of silently discarding something a human was working on.
    """
    try:
        result = run(
            ["git", "-C", path, "pull", "--ff-only"],
            capture_output=True,
            text=True,
            timeout=_PULL_TIMEOUT_SECONDS,
        )
    except (OSError, subprocess.SubprocessError) as exc:
        return PullResult(ok=False, message=str(exc))
    if result.returncode != 0:
        return PullResult(ok=False, message=result.stderr.strip() or result.stdout.strip())
    return PullResult(ok=True, message=result.stdout.strip() or "already up to date")


def _port_open(port: int) -> bool:
    deadline = time.monotonic() + _HEALTH_TIMEOUT_SECONDS
    while time.monotonic() < deadline:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            if sock.connect_ex(("localhost", port)) == 0:
                return True
        time.sleep(_HEALTH_POLL_SECONDS)
    return False


def _port_listening(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        return sock.connect_ex(("localhost", port)) == 0


def start_preview(
    target: PreviewTarget,
    popen: _Popen = subprocess.Popen,
    port_open: _PortCheck = _port_open,
    port_listening: _PortCheck = _port_listening,
) -> bool:
    """Start the target repo's preview script, detached, and wait for its ports to open.

    Fire-and-forget: the script itself never exits (it blocks on `wait` for its child dev
    servers), so this only starts it and polls whether something is listening - it keeps
    no handle to stop it later. `stop_preview` re-invokes the script's own `stop` mode,
    which is what actually knows how to free the ports.
    """
    with _PREVIEW_LOCK:
        if port_listening(target.backend_port) and port_listening(target.frontend_port):
            return True
        try:
            popen(
                shlex.split(target.command),
                cwd=target.path,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True,
            )
        except OSError:
            logger.warning("could not start preview command %r in %s", target.command, target.path)
            return False
        return port_open(target.backend_port) and port_open(target.frontend_port)


def stop_preview(path: str, command: str, run: _Runner = subprocess.run) -> None:
    """Ask the target repo's own script to free its ports - safe even if nothing is running."""
    try:
        run(
            [*shlex.split(command), "stop"],
            cwd=path,
            capture_output=True,
            text=True,
            timeout=_STOP_TIMEOUT_SECONDS,
        )
    except (OSError, subprocess.SubprocessError):
        logger.warning("could not stop preview command %r in %s", command, path)
