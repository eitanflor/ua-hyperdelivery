import contextvars
import logging
import sys

session_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("session_id", default="-")


class SessionIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.session_id = session_id_var.get()
        return True


def configure_logging(level: str = "INFO") -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(SessionIdFilter())
    handler.setFormatter(
        logging.Formatter("%(asctime)s %(levelname)s [%(session_id)s] %(name)s: %(message)s")
    )
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level)
