"""Saving a finished agent turn without letting a failed save fail the turn."""

import logging
from typing import Any

from botocore.exceptions import BotoCoreError, ClientError

from core.domain.project import utcnow
from core.domain.turn import TurnRecorder
from infrastructure.repositories.project_repository import ProjectRepository

logger = logging.getLogger(__name__)


def record_message(repo: ProjectRepository, project_id: str, agent: str, message: str) -> None:
    """Keep a message the person sent whose agent turn is recorded elsewhere.

    A deployed run is driven by Step Functions, so the console API only sees what the person
    sent (a first message, an answer) and the invoker only sees the agent's side. This writes
    the first half as a turn with no output, and drops a failed save like `TurnLog` does.
    """
    try:
        repo.save_turn(TurnRecorder(project_id, agent, utcnow(), message).finish(utcnow()))
    except (BotoCoreError, ClientError, ValueError):
        logger.exception("could not record the message")


class TurnLog:
    """Watches one turn's events and saves the turn once, whichever way it ends.

    The trace is a record of the work, not part of it: if it cannot be saved the turn still
    stands, so a storage failure is logged and dropped rather than raised into a run that has
    already produced its result. Saving is idempotent, so a caller can save on the way out of
    every branch - finished, failed, stopped - and the first one wins.
    """

    def __init__(
        self, repo: ProjectRepository, project_id: str, agent: str, message: str | None = None
    ) -> None:
        """Start watching a turn of `agent` on `project_id` that begins now."""
        self._repo = repo
        self._recorder = TurnRecorder(project_id, agent, utcnow(), message)
        self._saved = False

    def feed(self, event: dict[str, Any]) -> None:
        """Take one streamed event."""
        self._recorder.feed(event)

    def save(self, error: str | None = None, error_code: str | None = None) -> None:
        """Save the turn as it stands, with `error` if it ended in one; the first call wins."""
        if self._saved:
            return
        self._saved = True
        try:
            self._repo.save_turn(self._recorder.finish(utcnow(), error, error_code))
        except (BotoCoreError, ClientError, ValueError):
            logger.exception("could not record the turn")
