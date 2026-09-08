"""Logging setup that stamps every record with the invoking AgentCore session id."""

import contextvars
import logging
import sys

session_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("session_id", default="-")
project_id_var: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "project_id", default=None
)


class SessionIdFilter(logging.Filter):
    """Copies the current session id onto each record so the formatter can print it."""

    def filter(self, record: logging.LogRecord) -> bool:
        """Always keeps the record; the return value is the filter contract, not a decision."""
        record.session_id = session_id_var.get()
        return True


def configure_logging(level: str = "INFO") -> None:
    """Install a single session-id-aware stdout handler, replacing any existing ones."""
    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(SessionIdFilter())
    handler.setFormatter(
        logging.Formatter("%(asctime)s %(levelname)s [%(session_id)s] %(name)s: %(message)s")
    )
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level)
