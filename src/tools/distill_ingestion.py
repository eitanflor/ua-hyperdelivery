"""Distill ingestion tools for local files and GitHub READMEs."""

from strands import tool

from config.settings import get_settings
from providers.documents.local import parse_local_document
from providers.github.readme import fetch_readme, verify_tls_setting


@tool
def get_local_document_text(file_path: str) -> str:
    """Normalize a local document to Markdown and return its structured content.

    Writes ``<source-stem>.normalized.md`` beside the source. Preserves document pages,
    headings, lists, tables, slides, notes, and sheets where the source format exposes
    them. Supports .txt, .md, .pdf, .docx, .pptx, .xlsx, .png, .jpg and .jpeg.
    """
    return parse_local_document(file_path)


@tool
def github_get_readme(owner_repo: str) -> str:
    """Fetch README text for a GitHub repository as owner/repo."""
    settings = get_settings()
    verify_tls = verify_tls_setting(
        verify_flag=settings.github_verify_tls,
        ca_bundle=settings.github_ca_bundle,
        fallback_ca_bundle=settings.requests_ca_bundle,
    )
    return fetch_readme(
        owner_repo,
        token=settings.github_token,
        verify_tls=verify_tls,
    )
