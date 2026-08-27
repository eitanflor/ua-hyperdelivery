from typing import Any

import pytest

from tools import documents


class _StubSettings:
    def __init__(
        self, bucket: str | None = "my-bucket", region: str | None = "ap-southeast-2"
    ) -> None:
        self.s3_bucket = bucket
        self.s3_region = region


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
    assert calls["args"] == ("my-bucket", "fsd.txt", "ap-southeast-2")
