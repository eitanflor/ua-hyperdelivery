from typing import Any

import pytest

from providers.storage.s3 import NormalizedMarkdownArtifact
from tools import documents


class _StubSettings:
    def __init__(self, bucket: str | None = "my-bucket", region: str | None = "us-east-1") -> None:
        self.s3_bucket = bucket
        self.s3_region = region
        self.aws_region = "us-east-1"


def test_s3_document_tool_returns_none_when_not_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(documents, "get_settings", lambda: _StubSettings(bucket=None))

    assert documents.s3_document_tool() is None


def test_s3_document_tool_returns_tool_when_configured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(documents, "get_settings", lambda: _StubSettings())

    assert documents.s3_document_tool() is documents.s3_get_document_text


def test_s3_get_document_text_uses_configured_bucket_and_region(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(documents, "get_settings", lambda: _StubSettings())
    calls: dict[str, Any] = {}

    def fake_get_document_text(bucket: str, key: str, region: str) -> str:
        calls["args"] = (bucket, key, region)
        return "parsed text"

    monkeypatch.setattr(documents, "get_document_text", fake_get_document_text)

    assert documents.s3_get_document_text("fsd.txt") == "parsed text"
    assert calls["args"] == ("my-bucket", "fsd.txt", "us-east-1")


def test_s3_get_document_text_archives_under_current_project(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(documents, "get_settings", lambda: _StubSettings())

    def fake_get_document_text(_bucket: str, _key: str, _region: str) -> str:
        return "# FSD\n"

    archived: list[tuple[str, NormalizedMarkdownArtifact, str]] = []

    def fake_put_normalized_markdown(
        bucket: str, artifact: NormalizedMarkdownArtifact, region: str
    ) -> None:
        archived.append((bucket, artifact, region))

    monkeypatch.setattr(documents, "get_document_text", fake_get_document_text)
    monkeypatch.setattr(
        documents,
        "put_normalized_markdown",
        fake_put_normalized_markdown,
    )
    token = documents.project_id_var.set("project-123")
    try:
        assert documents.s3_get_document_text("documents/input.md") == "# FSD\n"
    finally:
        documents.project_id_var.reset(token)

    bucket, artifact, region = archived[0]
    assert bucket == "my-bucket"
    assert region == "us-east-1"
    assert artifact.project_id == "project-123"
    assert artifact.source_type == "s3"
    assert artifact.source_id == "documents/input.md"


def test_s3_reference_list_tool_returns_none_when_not_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(documents, "get_settings", lambda: _StubSettings(bucket=None))

    assert documents.s3_reference_list_tool() is None


def test_s3_reference_list_tool_returns_tool_when_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(documents, "get_settings", lambda: _StubSettings())

    assert documents.s3_reference_list_tool() is documents.s3_list_reference_documents


def test_s3_list_reference_documents_lists_all_and_reports_categories(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(documents, "get_settings", lambda: _StubSettings())
    calls: dict[str, Any] = {}
    all_keys = [
        "fsds/inventory/a.pdf",
        "fsds/logistics-shipping/b.pdf",
        "fsds/logistics-shipping/c.pdf",
    ]

    def fake_list_document_keys(bucket: str, prefix: str, region: str) -> list[str]:
        calls["args"] = (bucket, prefix, region)
        return all_keys

    monkeypatch.setattr(documents, "list_document_keys", fake_list_document_keys)

    result = documents.s3_list_reference_documents()

    assert calls["args"] == ("my-bucket", "fsds/", "us-east-1")
    assert result == {
        "documents": all_keys,
        "available_categories": ["inventory", "logistics-shipping"],
    }


def test_s3_list_reference_documents_narrows_to_category_but_still_reports_all_categories(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(documents, "get_settings", lambda: _StubSettings())
    all_keys = ["fsds/inventory/a.pdf", "fsds/logistics-shipping/b.pdf"]

    def fake_list_document_keys(bucket: str, prefix: str, region: str) -> list[str]:
        return all_keys

    monkeypatch.setattr(documents, "list_document_keys", fake_list_document_keys)

    result = documents.s3_list_reference_documents(category="inventory")

    assert result == {
        "documents": ["fsds/inventory/a.pdf"],
        "available_categories": ["inventory", "logistics-shipping"],
    }


def test_s3_list_reference_documents_unknown_category_returns_empty_but_lists_real_ones(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(documents, "get_settings", lambda: _StubSettings())
    all_keys = ["fsds/inventory/a.pdf", "fsds/logistics-shipping/b.pdf"]

    def fake_list_document_keys(bucket: str, prefix: str, region: str) -> list[str]:
        return all_keys

    monkeypatch.setattr(documents, "list_document_keys", fake_list_document_keys)

    result = documents.s3_list_reference_documents(category="logistics")

    assert result == {
        "documents": [],
        "available_categories": ["inventory", "logistics-shipping"],
    }


def test_s3_list_reference_documents_excludes_the_embedding_index(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(documents, "get_settings", lambda: _StubSettings())
    all_keys = ["fsds/_index.json", "fsds/inventory/a.pdf"]

    def fake_list_document_keys(bucket: str, prefix: str, region: str) -> list[str]:
        return all_keys

    monkeypatch.setattr(documents, "list_document_keys", fake_list_document_keys)

    result = documents.s3_list_reference_documents()

    assert result == {"documents": ["fsds/inventory/a.pdf"], "available_categories": ["inventory"]}


def test_s3_similarity_search_tool_returns_none_when_not_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(documents, "get_settings", lambda: _StubSettings(bucket=None))

    assert documents.s3_similarity_search_tool() is None


def test_s3_similarity_search_tool_returns_tool_when_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(documents, "get_settings", lambda: _StubSettings())

    assert documents.s3_similarity_search_tool() is documents.s3_find_similar_reference_documents


def test_s3_find_similar_reference_documents_returns_empty_matches_when_index_missing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(documents, "get_settings", lambda: _StubSettings())

    def fake_load_index(bucket: str, key: str, region: str) -> dict[str, list[float]]:
        return {}

    monkeypatch.setattr(documents, "load_index", fake_load_index)

    assert documents.s3_find_similar_reference_documents("a new feature") == {"matches": []}


def test_s3_find_similar_reference_documents_ranks_by_similarity(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(documents, "get_settings", lambda: _StubSettings())
    index = {
        "fsds/inventory/close-match.pdf": [1.0, 0.0],
        "fsds/inventory/far-match.pdf": [0.0, 1.0],
    }

    def fake_load_index(bucket: str, key: str, region: str) -> dict[str, list[float]]:
        return index

    def fake_embed_text(text: str, region: str) -> list[float]:
        return [1.0, 0.0]

    monkeypatch.setattr(documents, "load_index", fake_load_index)
    monkeypatch.setattr(documents, "embed_text", fake_embed_text)

    result = documents.s3_find_similar_reference_documents("a new feature", top_k=1)

    assert result == {"matches": ["fsds/inventory/close-match.pdf"]}


def test_s3_find_similar_reference_documents_raises_when_not_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(documents, "get_settings", lambda: _StubSettings(bucket=None))

    with pytest.raises(ValueError, match="S3_BUCKET"):
        documents.s3_find_similar_reference_documents("a new feature")
