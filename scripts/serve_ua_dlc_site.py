"""Serve the UA-DLC site (docs/ua-dlc/site) on this machine, without the canvas runtime's noise.

Each concept board is a template that the vendored canvas runtime renders only after the
browser has parsed it as live HTML, so every bound image (``<img src="{{logos.teams}}">``) is
requested once with its raw ``{{...}}`` placeholder before the runtime fills it in. Python's
plain ``http.server`` answers each of those with a 404 and logs it. This server answers only
those unresolved placeholders, with an empty transparent image and no log line; a real missing
file still gets a 404 and is logged.

Usage:
    uv run python scripts/serve_ua_dlc_site.py [--port 8766]
"""

from __future__ import annotations

import argparse
import functools
import http.server
import logging
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit

SITE_ROOT = Path(__file__).resolve().parent.parent / "docs" / "ua-dlc" / "site"
DEFAULT_PORT = 8766
# The site is a draft: listen on this machine only.
_BIND = "127.0.0.1"
_PLACEHOLDER = re.compile(r"\{\{[^{}]*\}\}")
# Browsers ask every page for this; the site's pages carry their own icon.
_FAVICON = "/favicon.ico"
# A 1x1 transparent GIF, so a board's <img onError> handler does not fire on the placeholder.
_BLANK_GIF = bytes.fromhex(
    "47494638396101000100800000000000ffffff21f90401000000002c00000000010001000002024401003b"
)

logger = logging.getLogger(__name__)


def is_unresolved_placeholder(request_path: str) -> bool:
    """Return whether a request is a board's ``{{...}}`` binding, fetched before it rendered."""
    path = unquote(urlsplit(request_path).path)
    return _PLACEHOLDER.search(path) is not None


def is_quiet(request_path: str) -> bool:
    """Return whether a request is answered without a log line: a placeholder or the favicon."""
    return is_unresolved_placeholder(request_path) or urlsplit(request_path).path == _FAVICON


class SiteRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Serves the site's files and answers unresolved template placeholders quietly."""

    def do_GET(self) -> None:
        """Serve a file, or a blank image for a placeholder, or nothing for the favicon."""
        if is_quiet(self.path):
            self._send_quiet(include_body=True)
            return
        super().do_GET()

    def do_HEAD(self) -> None:
        """Answer HEAD the same way as GET, without a body."""
        if is_quiet(self.path):
            self._send_quiet(include_body=False)
            return
        super().do_HEAD()

    def log_request(self, code: int | str = "-", size: int | str = "-") -> None:
        """Log every request except the quiet ones."""
        if is_quiet(self.path):
            return
        super().log_request(code, size)

    def _send_quiet(self, *, include_body: bool) -> None:
        if not is_unresolved_placeholder(self.path):
            self.send_response(http.HTTPStatus.NO_CONTENT)
            self.end_headers()
            return
        self.send_response(http.HTTPStatus.OK)
        self.send_header("Content-Type", "image/gif")
        self.send_header("Content-Length", str(len(_BLANK_GIF)))
        self.send_header("Cache-Control", "public, max-age=3600")
        self.end_headers()
        if include_body:
            self.wfile.write(_BLANK_GIF)


def main() -> None:
    """Serve the site until interrupted."""
    parser = argparse.ArgumentParser(description="Serve the UA-DLC site on this machine.")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="port to listen on")
    args = parser.parse_args()
    port: int = args.port

    logging.basicConfig(level=logging.INFO, format="%(message)s")
    handler = functools.partial(SiteRequestHandler, directory=str(SITE_ROOT))
    with http.server.ThreadingHTTPServer((_BIND, port), handler) as server:
        logger.info("Plan:            http://localhost:%d/plan/", port)
        logger.info("Concept canvas:  http://localhost:%d/concepts/", port)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            logger.info("Stopped.")


if __name__ == "__main__":
    main()
