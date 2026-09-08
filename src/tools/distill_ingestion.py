"""Distill ingestion tools for local files."""

from pathlib import Path

from strands import tool

from config.settings import get_settings
from infrastructure.observability.logging import project_id_var
from providers.documents.local import parse_local_document
from providers.storage.s3 import NormalizedMarkdownArtifact, put_normalized_markdown


def _archive_markdown(source_type: str, source_id: str, markdown: str) -> None:
    settings = get_settings()
    project_id = project_id_var.get()
    if settings.s3_bucket and settings.s3_region and project_id:
        put_normalized_markdown(
            settings.s3_bucket,
            NormalizedMarkdownArtifact(project_id, source_type, source_id, markdown),
            settings.s3_region,
        )


@tool
def get_local_document_text(file_path: str) -> str:
    """Normalize a local document to Markdown and return its structured content.

    Writes ``<source-stem>.normalized.md`` beside the source. Preserves document pages,
    headings, lists, tables, slides, notes, and sheets where the source format exposes
    them. Supports .txt, .md, .pdf, .docx, .pptx, .xlsx, .png, .jpg and .jpeg.
    """
    markdown = parse_local_document(file_path)
    _archive_markdown("local", Path(file_path).name, markdown)
    return markdown
