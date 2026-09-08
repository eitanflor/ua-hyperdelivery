from dataclasses import dataclass
from pathlib import Path

import pytest

from providers.storage.s3 import NormalizedMarkdownArtifact
from tools import distill_ingestion


@dataclass
class _Settings:
    s3_bucket: str | None = None
    s3_region: str | None = None


def test_get_local_document_text_delegates_to_provider(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_parse_local_document(path: str) -> str:
        return f"parsed::{path}"

    monkeypatch.setattr(
        distill_ingestion,
        "parse_local_document",
        fake_parse_local_document,
    )

    assert distill_ingestion.get_local_document_text("/workspace/input.txt") == (
        "parsed::/workspace/input.txt"
    )


def test_local_document_archives_markdown_under_current_project(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    monkeypatch.setattr(
        distill_ingestion,
        "get_settings",
        lambda: _Settings(s3_bucket="b", s3_region="r"),
    )

    def fake_parse_local_document(_path: str) -> str:
        return "# FSD\n"

    archived: list[tuple[str, NormalizedMarkdownArtifact, str]] = []

    def fake_put_normalized_markdown(
        bucket: str, artifact: NormalizedMarkdownArtifact, region: str
    ) -> str:
        archived.append((bucket, artifact, region))
        return "key"

    monkeypatch.setattr(distill_ingestion, "parse_local_document", fake_parse_local_document)
    monkeypatch.setattr(distill_ingestion, "put_normalized_markdown", fake_put_normalized_markdown)
    token = distill_ingestion.project_id_var.set("project-123")
    try:
        result = distill_ingestion.get_local_document_text(str(tmp_path / "input.docx"))
    finally:
        distill_ingestion.project_id_var.reset(token)

    assert result == "# FSD\n"
    bucket, artifact, region = archived[0]
    assert bucket == "b"
    assert region == "r"
    assert artifact.project_id == "project-123"
    assert artifact.source_type == "local"
    assert artifact.source_id == "input.docx"
