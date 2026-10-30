"""Export the Variant B screens as self-contained HTML for Figma's HTML import.

Figma's importer (the Figma MCP ``html_to_figma`` tool) fetches nothing external, and it drops
two things these screens rely on: inset box-shadow rings and SVG paint inherited from the
``<svg>`` root. This script serves the site, lets headless Chrome run
``variant-b/figma-prep.js`` on each screen (the ``?figma`` switch rewrites both into forms the
importer keeps), and writes the prepared DOM with its stylesheet and images inlined. POST each
file to the importer's submit URL with ``Content-Type: text/html`` and selector ``.app``.

Usage:
    uv run python scripts/export_variant_b_for_figma.py [home.html ...] [--out DIR]
"""

from __future__ import annotations

import argparse
import base64
import contextlib
import functools
import http.server
import logging
import os
import re
import shutil
import subprocess
import tempfile
import threading
from collections.abc import Generator
from pathlib import Path

SITE_ROOT = Path(__file__).resolve().parent.parent / "docs" / "ua-dlc" / "site"
VARIANT_DIR = SITE_ROOT / "variant-b"
SCREENS = (
    "home.html",
    "inbox.html",
    "projects.html",
    "new-project.html",
    "project.html",
    "approval.html",
    "handoff.html",
)
_MIME = {
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}
_REMOTE_LINK = re.compile(r'<link rel="(?:preconnect|stylesheet)" href="https://[^"]*"[^>]*>\s*')
_STYLESHEET = re.compile(r'<link rel="stylesheet" href="([^"]+\.css)">')
_PREP_SCRIPT = re.compile(r'<script src="figma-prep\.js"></script>\s*')
_SRC = re.compile(r'\bsrc="([^"]+)"')
# figma-prep.js sets this on <html> once it has rewritten the page.
_READY = 'data-figma-ready="1"'
_MAC_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

logger = logging.getLogger(__name__)


def inline_document(html: str, page_dir: Path) -> str:
    """Return a page with its local stylesheets and images inlined and remote links removed.

    Raises:
        FileNotFoundError: A local ``src`` points at a missing file or a type the importer
            cannot take, which would otherwise import as a blank box.
    """
    html = _REMOTE_LINK.sub("", html)
    html = _PREP_SCRIPT.sub("", html)
    html = _STYLESHEET.sub(
        lambda m: f"<style>\n{(page_dir / m.group(1)).read_text()}\n</style>", html
    )

    def embed(match: re.Match[str]) -> str:
        ref = match.group(1)
        if ref.startswith(("data:", "http:", "https:")):
            return match.group(0)
        path = (page_dir / ref).resolve()
        mime = _MIME.get(path.suffix.lower())
        if mime is None or not path.is_file():
            msg = f"cannot inline {ref!r} from {page_dir}"
            raise FileNotFoundError(msg)
        return f'src="data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"'

    return _SRC.sub(embed, html)


def find_chrome() -> str:
    """Return a Chrome or Chromium binary: ``$CHROME``, then PATH, then the macOS app."""
    candidates = [os.environ.get("CHROME")]
    candidates += [shutil.which(name) for name in ("google-chrome", "chromium", "chromium-browser")]
    candidates.append(_MAC_CHROME)
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return candidate
    msg = "Chrome not found; set CHROME to its binary"
    raise FileNotFoundError(msg)


def prepared_dom(chrome: str, url: str) -> str:
    """Load a screen with ``?figma`` at the design width and return the rewritten DOM."""
    result = subprocess.run(  # noqa: S603 - fixed argv: a local Chrome binary and a loopback URL
        [
            chrome,
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",  # cspell:disable-line - a Chrome flag
            "--window-size=1440,1400",
            "--virtual-time-budget=4000",
            "--dump-dom",
            f"{url}?figma",
        ],
        capture_output=True,
        text=True,
        check=True,
        timeout=60,
    )
    if _READY not in result.stdout:
        msg = f"figma-prep.js did not finish on {url}"
        raise RuntimeError(msg)
    return result.stdout


class _QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:  # noqa: A002 - stdlib signature
        """Keep the export's output to the files it writes."""


@contextlib.contextmanager
def serve_site() -> Generator[str]:
    """Serve the site on a free loopback port for the length of the block; yield its base URL."""
    handler = functools.partial(_QuietHandler, directory=str(SITE_ROOT))
    with http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            yield f"http://127.0.0.1:{server.server_address[1]}"
        finally:
            server.shutdown()


def main() -> None:
    """Write one self-contained file per screen and log where each landed."""
    parser = argparse.ArgumentParser(description="Export Variant B screens for Figma's import.")
    parser.add_argument("screens", nargs="*", default=list(SCREENS), help="screen file names")
    parser.add_argument(
        "--out",
        type=Path,
        default=Path(tempfile.gettempdir()) / "variant-b-figma",
        help="output directory",
    )
    args = parser.parse_args()
    screens: list[str] = args.screens
    out: Path = args.out

    logging.basicConfig(level=logging.INFO, format="%(message)s")
    out.mkdir(parents=True, exist_ok=True)
    chrome = find_chrome()
    with serve_site() as base:
        for screen in screens:
            dom = prepared_dom(chrome, f"{base}/variant-b/{screen}")
            target = out / screen
            target.write_text(inline_document(dom, VARIANT_DIR))
            logger.info("%s  %d KB", target, target.stat().st_size // 1024)


if __name__ == "__main__":
    main()
