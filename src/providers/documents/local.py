"""Local document parsing helpers, reusable by any agent tool.

Reads a local path into bytes and delegates format-specific parsing to
`providers.documents.parsing`, which S3 document access shares.
"""

from __future__ import annotations

from pathlib import Path

from providers.documents.parsing import parse_document_bytes


def parse_local_document(path: str | Path) -> str:
    """Create and return normalized Markdown for a supported local file path.

    The sidecar is written as ``<source-stem>.normalized.md`` beside the source. Supported
    extensions: .txt, .md, .pdf, .docx, .pptx, .xlsx, .png, .jpg, .jpeg.
    """
    file_path = Path(path).expanduser().resolve()
    if not file_path.is_file():
        msg = f"Local file does not exist: {file_path}"
        raise ValueError(msg)

    body = parse_document_bytes(file_path.name, file_path.read_bytes())
    markdown = f"# Source: {file_path.name}\n"
    if body:
        markdown += f"\n{body}\n"
    artifact_path = file_path.with_name(f"{file_path.stem}.normalized.md")
    artifact_path.write_text(markdown, encoding="utf-8")
    return markdown
