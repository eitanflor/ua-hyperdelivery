from tools import documents


class _StubSettings:
    def __init__(self, bucket="my-bucket", region="ap-southeast-2"):
        self.s3_bucket = bucket
        self.s3_region = region


def test_s3_document_tool_returns_none_when_not_configured(monkeypatch):
    monkeypatch.setattr(documents, "get_settings", lambda: _StubSettings(bucket=None))

    assert documents.s3_document_tool() is None


def test_s3_document_tool_returns_tool_when_configured(monkeypatch):
    monkeypatch.setattr(documents, "get_settings", lambda: _StubSettings())

    assert documents.s3_document_tool() is documents.s3_get_document_text


def test_s3_get_document_text_uses_configured_bucket_and_region(monkeypatch):
    monkeypatch.setattr(documents, "get_settings", lambda: _StubSettings())
    calls = {}

    def fake_get_document_text(bucket, key, region):
        calls["args"] = (bucket, key, region)
        return "parsed text"

    monkeypatch.setattr(documents, "get_document_text", fake_get_document_text)

    assert documents.s3_get_document_text("fsd.txt") == "parsed text"
    assert calls["args"] == ("my-bucket", "fsd.txt", "ap-southeast-2")
