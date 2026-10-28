"""Render the UA-DLC enterprise plan into the standalone site's plan page.

``docs/ua-dlc/enterprise-plan.md`` stays the source of truth: it reads well on GitHub, with
mermaid and markdown-table fallbacks for every rich visual. This script turns it into one
light-only HTML page with pandoc and swaps each visual marker for its interactive fragment
from ``docs/ua-dlc/site/plan/visuals/``:

- ``<!-- plan-visual: NAME -->`` ... ``<!-- /plan-visual -->`` replaces everything between the
  markers (a mermaid block or a table) with ``visuals/NAME.html``;
- ``<!-- plan-visual: NAME -->`` with no close marker replaces the one mermaid block right
  after it.

A missing fragment keeps the fallback and logs a warning. Mermaid blocks that remain render in
the browser from the pinned mermaid ESM build. Needs ``pandoc`` on the PATH.

Usage:
    uv run python scripts/build_ua_dlc_plan.py [--out PATH] [--concepts-href HREF]
        [--home-href HREF] [--repo-ref REF]

The site build uses the defaults, and points the plan's own links to the claude.ai canvas and
plan page at the local canvas and this page instead. The claude.ai copy passes ``--out`` and
the claude.ai canvas URL as ``--concepts-href`` and keeps those links as written.
"""

from __future__ import annotations

import argparse
import html
import logging
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import quote

logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parent.parent
PLAN_DIR = REPO_ROOT / "docs" / "ua-dlc"
DEFAULT_SOURCE = PLAN_DIR / "enterprise-plan.md"
DEFAULT_VISUALS = PLAN_DIR / "site" / "plan" / "visuals"
DEFAULT_OUT = PLAN_DIR / "site" / "plan" / "index.html"
# index.html rather than the folder, so the links also land on a page when opened from a file.
DEFAULT_CONCEPTS_HREF = "../concepts/index.html"
DEFAULT_HOME_HREF = "../index.html"
# Companion documents open on GitHub: relative .md links do not resolve on a served page.
GITHUB_REPO = "https://github.com/underarmour/ua-hyperdelivery"
DEFAULT_REPO_REF = "dev"
# The claude.ai copies the plan links to; the site build points these at its own pages.
CLAUDE_CANVAS_URL = "https://claude.ai/artifact/BUcEKzAz1CXa27EY398sAF"
CLAUDE_PLAN_URL = "https://claude.ai/artifact/FTURRJS2HcSGEDT7QQYowh"
# Canvas links whose text names one board open on that board (the viewer reads #<Board>).
_CANVAS_BOARD_LINKS = {
    "how hyperdelivery is built": "PlatformArchitecture",
    "how work moves": "Lifecycle",
}
_PLAN_ANCHOR = "#phase-2-final-mvp"
MERMAID_ESM = "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs"

_MERMAID_CODE = re.compile(r'<pre class="mermaid"><code>(.*?)</code></pre>', re.DOTALL)
_HREF = re.compile(r'href="([^"]+)"')
_ANCHOR = re.compile(r"<a ([^>]*)>(.*?)</a>", re.DOTALL)
_EXTERNAL_ANCHOR = re.compile(r'<a (href="https?://)')
_OPEN_MARKER = re.compile(r"(?:<p>)?<!--\s*plan-visual:\s*([a-z0-9-]+)\s*-->(?:</p>)?")
_CLOSE_MARKER = re.compile(r"(?:<p>)?<!--\s*/plan-visual\s*-->(?:</p>)?")
_NEXT_MERMAID = re.compile(r'\s*(<pre class="mermaid">.*?</pre>)', re.DOTALL)
_HEADING = re.compile(r'<h([12]) id="([^"]+)">(.*?)</h\1>', re.DOTALL)
_TAG = re.compile(r"<[^>]+>")
_STYLE_BLOCK = re.compile(r"(<style\b[^>]*>)(.*?)(</style>)", re.DOTALL | re.IGNORECASE)
_DARK_MEDIA = re.compile(r"@media[^{;]*prefers-color-scheme\s*:\s*dark[^{]*\{", re.IGNORECASE)
_LIGHT_MEDIA = re.compile(r"@media[^{;]*prefers-color-scheme\s*:\s*light[^{]*\{", re.IGNORECASE)
_DARK_SELECTOR = re.compile(r"""data-theme\s*=\s*["']?dark""", re.IGNORECASE)
_COLOR_SCHEME = re.compile(r"color-scheme\s*:\s*[^;}\"']*dark[^;}\"']*", re.IGNORECASE)
_DRAFT = re.compile(r"\bDraft v\d+\b")


@dataclass(frozen=True)
class PageLinks:
    """Where the page's masthead points.

    Attributes:
        concepts: The concept canvas, relative for the site build or a claude.ai URL.
        home: The site landing page, or None when the page stands alone.
        repo: The GitHub URL that companion-document links resolve against.
    """

    concepts: str
    home: str | None
    repo: str

    @property
    def local(self) -> bool:
        """Whether this is the site build, whose canvas link is relative."""
        return not self.concepts.startswith(("http://", "https://"))


def run_pandoc(source: Path) -> str:
    """Convert the plan's GitHub-flavored markdown to an HTML5 fragment.

    Raises:
        SystemExit: pandoc is missing or the conversion failed.
    """
    pandoc = shutil.which("pandoc")
    if pandoc is None:
        msg = "pandoc is required to build the plan page (brew install pandoc)"
        raise SystemExit(msg)
    argv = [pandoc, "-f", "gfm", "-t", "html5", "--wrap=none", str(source)]
    try:
        result = subprocess.run(  # noqa: S603 - fixed argv: pandoc from PATH and a repo file, no shell
            argv, check=True, capture_output=True, text=True
        )
    except subprocess.CalledProcessError as exc:
        msg = f"pandoc failed on {source}: {exc.stderr.strip()}"
        raise SystemExit(msg) from exc
    return result.stdout


def unwrap_mermaid(body: str) -> str:
    """Unwrap pandoc's ``<pre class="mermaid"><code>`` blocks into the form mermaid reads.

    The diagram text stays HTML-escaped, so labels such as ``<br/>`` survive as text.
    """
    return _MERMAID_CODE.sub(lambda m: f'<pre class="mermaid">{m.group(1)}</pre>', body)


def github_base(ref: str) -> str:
    """Return the GitHub URL that relative links in the plan resolve against, at ``ref``."""
    return f"{GITHUB_REPO}/blob/{quote(ref, safe='/')}/docs/ua-dlc/"


def link_companions(body: str, base: str) -> str:
    """Point relative links at the repository on GitHub and open external links in a new tab."""

    def rewrite(match: re.Match[str]) -> str:
        href = match.group(1)
        if href.startswith(("http://", "https://", "#", "mailto:")):
            return match.group(0)
        return f'href="{base}{href}"'

    body = _HREF.sub(rewrite, body)
    return _EXTERNAL_ANCHOR.sub(r'<a target="_blank" rel="noopener" \1', body)


def link_site_copies(body: str, concepts: str) -> str:
    """Point the plan's links to the claude.ai canvas and plan page at the site's own pages.

    Runs after :func:`link_companions`, so the new relative links are not sent to GitHub, and
    drops the new-tab attributes those links had as external ones.
    """

    def rewrite(match: re.Match[str]) -> str:
        attrs, text = match.group(1), match.group(2)
        href = _HREF.search(attrs)
        if href is None:
            return match.group(0)
        if href.group(1) == CLAUDE_PLAN_URL:
            target = _PLAN_ANCHOR
        elif href.group(1) == CLAUDE_CANVAS_URL:
            label = _TAG.sub("", text).strip("\"'\u201c\u201d ").lower()
            board = _CANVAS_BOARD_LINKS.get(label)
            target = f"{concepts}#{board}" if board else concepts
        else:
            return match.group(0)
        return f'<a href="{html.escape(target)}">{text}</a>'

    return _ANCHOR.sub(rewrite, body)


def wrap_tables(body: str) -> str:
    """Give every table its own horizontal scroll box."""
    return body.replace("<table>", '<div class="table"><table>').replace(
        "</table>", "</table></div>"
    )


def _block_end(css: str, open_brace: int) -> int:
    """Return the index just past the brace that closes the block opened at ``open_brace``."""
    depth = 0
    for index in range(open_brace, len(css)):
        char = css[index]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return index + 1
    return len(css)


def _drop_dark_rules(css: str) -> str:
    """Remove rules whose selector targets ``data-theme="dark"``, inside at-rule blocks too."""
    out: list[str] = []
    pos = 0
    while True:
        brace = css.find("{", pos)
        if brace == -1:
            out.append(css[pos:])
            break
        selector_start = max(css.rfind("}", 0, brace), css.rfind(";", 0, brace), pos - 1) + 1
        selector = css[selector_start:brace]
        end = _block_end(css, brace)
        if selector.lstrip().startswith(("@media", "@supports", "@layer", "@container")):
            out.append(css[pos : brace + 1] + _drop_dark_rules(css[brace + 1 : end - 1]) + "}")
        elif _DARK_SELECTOR.search(selector) and not selector.lstrip().startswith("@"):
            out.append(css[pos:selector_start])
        else:
            out.append(css[pos:end])
        pos = end
    return "".join(out)


def strip_dark_css(css: str) -> str:
    """Make a stylesheet light-only.

    Drops ``prefers-color-scheme: dark`` media blocks and ``[data-theme="dark"]`` rules,
    unwraps ``prefers-color-scheme: light`` blocks, and pins ``color-scheme`` to light.
    """
    while match := _DARK_MEDIA.search(css):
        css = css[: match.start()] + css[_block_end(css, match.end() - 1) :]
    while match := _LIGHT_MEDIA.search(css):
        end = _block_end(css, match.end() - 1)
        css = css[: match.start()] + css[match.end() : end - 1] + css[end:]
    css = _drop_dark_rules(css)
    return _COLOR_SCHEME.sub("color-scheme: light", css)


def light_only(fragment: str) -> str:
    """Apply :func:`strip_dark_css` to every ``<style>`` block in an HTML fragment."""
    return _STYLE_BLOCK.sub(
        lambda m: m.group(1) + strip_dark_css(m.group(2)) + m.group(3), fragment
    )


def apply_visuals(body: str, visuals_dir: Path) -> tuple[str, list[str]]:
    """Replace each plan-visual marker and its fallback with the matching visual fragment.

    Returns:
        The page body and the names of the visuals that were inserted.
    """
    out: list[str] = []
    used: list[str] = []
    pos = 0
    while marker := _OPEN_MARKER.search(body, pos):
        out.append(body[pos : marker.start()])
        name = marker.group(1)
        following = _OPEN_MARKER.search(body, marker.end())
        close = _CLOSE_MARKER.search(body, marker.end())
        if close and (following is None or close.start() < following.start()):
            fallback = body[marker.end() : close.start()]
            pos = close.end()
        elif mermaid := _NEXT_MERMAID.match(body, marker.end()):
            fallback = mermaid.group(1)
            pos = mermaid.end()
        else:
            fallback = ""
            pos = marker.end()
        snippet = visuals_dir / f"{name}.html"
        if snippet.is_file():
            out.append(light_only(snippet.read_text(encoding="utf-8")))
            used.append(name)
        else:
            logger.warning("%s is missing; kept the fallback for plan-visual %s", snippet, name)
            out.append(fallback)
    out.append(body[pos:])
    result = "".join(out)
    if _CLOSE_MARKER.search(result):
        logger.warning("Removed a <!-- /plan-visual --> marker with no opening marker")
        result = _CLOSE_MARKER.sub("", result)
    return result, used


def build_toc(body: str) -> list[str]:
    """List the plan's h1 and h2 headings as contents entries."""
    return [
        f'<li class="l{level}"><a href="#{ident}">{_TAG.sub("", text)}</a></li>'
        for level, ident, text in _HEADING.findall(body)
    ]


_UA_PATH = (
    "M154.6 68.5C153.7 69.2 152.7 69.9 151.5 70.8C143.5 76.5 131.9 80.3 116.8 80.3H116.3H115.8"
    "C100.7 80.3 89.1 76.4 81.1 70.8C79.8 69.9 78.8 69.2 78 68.5C78.9 67.9 79.9 67.1 81.1 66.2"
    "C89.1 60.5 100.7 56.7 115.8 56.7H116.3H116.8C131.9 56.7 143.5 60.6 151.5 66.2C152.7 67.1 "
    "153.7 67.8 154.6 68.5ZM232.5 21.8C232.5 21.8 225.6 16.6 203.9 8.6C184.8 1.6 170.4 0 170.4 0"
    "L170.5 41.1C170.5 46.8 168.8 52.1 164.5 58.1C148.4 52 133 48 116.3 48C99.5 48 84.2 52 68 "
    "58.1C63.7 52.1 62 46.9 62 41.1V0C62 0 47.6 1.6 28.5 8.6C6.9 16.6 0 21.8 0 21.8C0.9 40.5 "
    "17.2 57 43 68.5C17.2 79.9 0.9 96.5 0 115.2C0 115.2 6.9 120.4 28.6 128.4C47.7 135.4 62.1 137 "
    "62.1 137L62 95.8C62 90.1 63.7 84.8 68 78.8C84.2 84.9 99.5 88.8 116.2 88.8C132.9 88.8 148.3 "
    "84.8 164.5 78.8C168.8 84.8 170.5 90 170.5 95.8L170.4 136.9C170.4 136.9 184.8 135.3 203.9 "
    "128.3C225.6 120.3 232.5 115.1 232.5 115.1C231.6 96.4 215.3 79.8 189.5 68.4C215.3 57 231.6 "
    "40.5 232.5 21.8Z"
)
_UA_MARK = (
    '<svg class="ua" width="34" height="20" viewBox="0 0 232.5 137" role="img" '
    f'aria-label="Under Armour"><path d="{_UA_PATH}" fill="currentColor"></path></svg>'
)
_FAVICON = "data:image/svg+xml," + quote(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='-10 -58 252.5 252.5'>"
    f"<path fill='#1d1d1d' d='{_UA_PATH}'/></svg>",
    safe=" '/=:.,-",
)

_STYLE = """
:root {
  color-scheme: light;
  --bg: #ffffff; --surface: #f9f9f9; --ink: #1d1d1d; --muted: #5f5f5f; --line: #e6e6e6;
  --control: #8a8a8a; --decision: #dc0019; --tint: #fff4e0; --rule: #8a5a00;
  --display: 'Archivo', 'Helvetica Neue', Arial, sans-serif;
  --body: 'Archivo', 'Helvetica Neue', Arial, sans-serif;
  --mono: 'Geist Mono', ui-monospace, Menlo, monospace;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--bg); color: var(--ink); font-family: var(--body);
  font-size: 16px; line-height: 1.6; -webkit-font-smoothing: antialiased;
  font-variant-numeric: tabular-nums; }
a { color: var(--ink); text-decoration-color: var(--control); text-underline-offset: 3px; }
a:hover { text-decoration-color: var(--ink); }
a:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
.masthead { border-bottom: 1px solid var(--line); padding: 14px 32px; }
.masthead-in { max-width: 1180px; margin: 0 auto; display: flex; flex-wrap: wrap;
  align-items: center; gap: 10px 18px; }
.mark { display: inline-flex; align-items: center; gap: 12px; font-family: var(--display);
  font-weight: 700; font-size: 16px; line-height: 20px; color: var(--ink); text-decoration: none; }
.mark .ua { flex: none; }
.mark .hair { width: 1px; height: 20px; background: currentColor; opacity: .35; flex: none; }
.status { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--muted); border: 1px solid var(--line); border-radius: 3px; padding: 3px 7px; }
.spacer { flex: 1 1 auto; }
.canvas-link { font-size: 14px; font-weight: 600; background: var(--ink); color: var(--bg);
  border-radius: 999px; padding: 7px 16px; text-decoration: none; }
.canvas-link:hover { background: #444444; }
.wrap { max-width: 1180px; margin: 0 auto; display: flex; gap: 48px; padding: 40px 32px 80px; }
nav.toc { flex: 0 0 240px; font-size: 14px; }
nav.toc .sticky { position: sticky; top: 24px; max-height: calc(100vh - 48px); overflow-y: auto; }
nav.toc h2 { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--muted); margin: 0 0 10px; }
nav.toc ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column;
  gap: 6px; border-left: 2px solid var(--line); }
nav.toc li { padding-left: 12px; }
nav.toc li.l1 { font-weight: 700; margin-top: 8px; }
nav.toc a { text-decoration: none; color: var(--muted); }
nav.toc a:hover { color: var(--ink); }
article { flex: 1 1 auto; min-width: 0; max-width: 820px; }
article h1 { font-family: var(--display); font-weight: 800; font-size: 40px; line-height: 1.1;
  letter-spacing: -0.01em; margin: 56px 0 12px; text-wrap: balance; }
article > h1:first-child { margin-top: 0; }
article h2 { font-family: var(--display); font-weight: 700; font-size: 24px; line-height: 1.25;
  margin: 48px 0 12px; padding-top: 18px; border-top: 2px solid var(--ink); text-wrap: balance; }
article h3 { font-weight: 700; font-size: 18px; margin: 32px 0 8px; }
article p, article li { max-width: 72ch; }
article ul, article ol { padding-left: 22px; }
article li + li { margin-top: 4px; }
article strong { font-weight: 700; }
article hr { border: 0; border-top: 1px solid var(--line); margin: 48px 0; }
article code { font-family: var(--mono); font-size: 0.86em; background: var(--surface);
  border: 1px solid var(--line); border-radius: 3px; padding: 1px 5px; }
.table { overflow-x: auto; margin: 16px 0 24px; border-top: 1px solid var(--ink); }
table { border-collapse: collapse; width: 100%; font-size: 14px; line-height: 1.45; }
th { text-align: left; font-size: 12px; font-weight: 700; letter-spacing: 0.04em;
  color: var(--muted); padding: 9px 12px 9px 0; border-bottom: 1px solid var(--line);
  vertical-align: bottom; }
td { padding: 10px 12px 10px 0; border-bottom: 1px solid var(--line); vertical-align: top; }
pre.mermaid { background: var(--surface); border: 1px solid var(--line); border-radius: 8px;
  padding: 16px; overflow-x: auto; text-align: center; }
.note { background: var(--tint); border-left: 2px solid var(--rule); padding: 10px 14px;
  font-size: 14px; margin: 0 0 32px; }
@media (max-width: 960px) { nav.toc { display: none; } }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
"""

_SOURCE_NOTE = (
    '<p class="note">Rendered from <code>docs/ua-dlc/enterprise-plan.md</code> in the '
    "repository, which stays the source of truth. Values in [brackets] are filled in before the "
    "meeting. Links to companion documents open the repository.</p>"
)

_MERMAID_SCRIPT = f"""<script type="module">
import mermaid from "{MERMAID_ESM}";
mermaid.initialize({{ startOnLoad: true, theme: "neutral", securityLevel: "strict",
  fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif" }});
</script>
"""


def render_page(body: str, toc: list[str], links: PageLinks, *, status: str, mermaid: bool) -> str:
    """Wrap the plan body in the page shell: masthead, contents rail and light-only styles."""
    lockup = f'{_UA_MARK}<span class="hair" aria-hidden="true"></span>HyperDelivery'
    if links.home:
        mark = f'<a class="mark" href="{html.escape(links.home)}">{lockup}</a>'
    else:
        mark = f'<span class="mark">{lockup}</span>'
    concepts = html.escape(links.concepts)
    target = "" if links.local else ' target="_blank" rel="noopener"'
    script = _MERMAID_SCRIPT if mermaid else ""
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="claude:viewport-fit-sides" content="cover">
<title>HyperDelivery Plan</title>
<link rel="icon" href="{_FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&amp;family=Geist+Mono:wght@400;500&amp;display=swap">
<style>{_STYLE}</style>
</head>
<body>
<header class="masthead"><div class="masthead-in">
  {mark}
  <span class="status">{html.escape(status)}</span>
  <span class="spacer"></span>
  <a class="canvas-link" href="{concepts}"{target}>Open the Concept Canvas</a>
</div></header>
<div class="wrap">
  <nav class="toc" aria-label="Contents"><div class="sticky"><h2>Contents</h2>
    <ul>{"".join(toc)}</ul></div></nav>
  <article>
    {_SOURCE_NOTE}
    {body}
  </article>
</div>
{script}</body>
</html>
"""


def build(source: Path, visuals_dir: Path, links: PageLinks) -> str:
    """Build the full plan page from the markdown source and the visual fragments.

    Raises:
        SystemExit: an opening plan-visual marker was left in the page.
    """
    markdown = source.read_text(encoding="utf-8")
    draft = _DRAFT.search(markdown)
    status = f"{draft.group(0) if draft else 'Draft'} for leadership review"

    body = link_companions(unwrap_mermaid(run_pandoc(source)), links.repo)
    if links.local:
        body = link_site_copies(body, links.concepts)
    body = wrap_tables(body)
    toc = build_toc(body)
    body, used = apply_visuals(body, visuals_dir)
    if _OPEN_MARKER.search(body):
        msg = "a plan-visual marker was left in the page"
        raise SystemExit(msg)
    logger.info("Inserted %d visuals: %s", len(used), ", ".join(used) or "none")
    page = render_page(body, toc, links, status=status, mermaid='<pre class="mermaid">' in body)
    if re.search(r"prefers-color-scheme\s*:\s*dark", page, re.IGNORECASE):
        logger.warning("A visual still mentions prefers-color-scheme: dark outside a stylesheet")
    return page


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Read the command line."""
    parser = argparse.ArgumentParser(description="Render the UA-DLC plan page for the site.")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="page to write")
    parser.add_argument(
        "--concepts-href",
        default=DEFAULT_CONCEPTS_HREF,
        help="where 'Open the Concept Canvas' points (default: %(default)s)",
    )
    parser.add_argument(
        "--home-href",
        default=None,
        help=f"where the masthead lockup points; defaults to {DEFAULT_HOME_HREF} when "
        "--concepts-href is relative, and to no link when it is a URL",
    )
    parser.add_argument(
        "--repo-ref",
        default=DEFAULT_REPO_REF,
        help="branch or tag that companion-document links open on GitHub (default: %(default)s)",
    )
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE, help="plan markdown")
    parser.add_argument(
        "--visuals", type=Path, default=DEFAULT_VISUALS, help="folder of visual fragments"
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Build the plan page and write it to ``--out``."""
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    args = parse_args(argv)
    concepts: str = args.concepts_href
    home: str | None = args.home_href
    if home is None and not concepts.startswith(("http://", "https://")):
        home = DEFAULT_HOME_HREF
    links = PageLinks(concepts=concepts, home=home or None, repo=github_base(args.repo_ref))
    page = build(args.source, args.visuals, links)
    out: Path = args.out
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page, encoding="utf-8")
    logger.info("Wrote %s (%s bytes)", out, f"{len(page):,}")


if __name__ == "__main__":
    main(sys.argv[1:])
