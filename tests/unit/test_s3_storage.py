import io
from typing import TYPE_CHECKING, Any, cast

from pypdf import PdfWriter

from providers.storage import s3

if TYPE_CHECKING:
    from mypy_boto3_s3.client import S3Client


class _StubBody:
    def __init__(self, data: bytes) -> None:
        self._data = data

    def read(self) -> bytes:
        return self._data


class _StubS3Client:
    def __init__(self, data: bytes) -> None:
        self._data = data
        self.calls: list[tuple[str, str]] = []
        self.put_calls: list[dict[str, Any]] = []

    def get_object(self, Bucket: str, Key: str) -> dict[str, Any]:
        self.calls.append((Bucket, Key))
        return {"Body": _StubBody(self._data)}

    def put_object(self, **kwargs: Any) -> None:
        self.put_calls.append(kwargs)


def test_parse_document_decodes_txt_as_utf8() -> None:
    assert s3.parse_document("fsd.txt", b"hello world") == "hello world"


def test_parse_document_decodes_md_as_utf8() -> None:
    assert s3.parse_document("fsd.md", "# título".encode()) == "# título"


def test_parse_document_extracts_pdf_text() -> None:
    writer = PdfWriter()
    writer.add_blank_page(width=72, height=72)
    buf = io.BytesIO()
    writer.write(buf)

    # a blank page has no extractable text, but this proves the pdf branch runs cleanly
    assert s3.parse_document("fsd.pdf", buf.getvalue()) == ""


def test_get_document_text_uses_injected_client_and_bucket() -> None:
    client = _StubS3Client(b"raw fsd text")

    result = s3.get_document_text(
        "my-bucket", "fsd.txt", "us-east-1", s3_client=cast("S3Client", client)
    )

    assert result == "raw fsd text"
    assert client.calls == [("my-bucket", "fsd.txt")]


def test_put_normalized_markdown_uses_project_prefix_and_markdown_metadata() -> None:
    client = _StubS3Client(b"")

    key = s3.put_normalized_markdown(
        "my-bucket",
        s3.NormalizedMarkdownArtifact("project-123", "local", "input.docx", "# FSD\n"),
        "us-east-1",
        s3_client=cast("S3Client", client),
    )

    assert key.startswith("projects/project-123/normalized/distill/local/input.docx/")
    assert key.endswith(".md")
    call = client.put_calls[0]
    assert call["Bucket"] == "my-bucket"
    assert call["Key"] == key
    assert call["ContentType"] == "text/markdown; charset=utf-8"
    assert call["ServerSideEncryption"] == "AES256"
    assert call["Metadata"]["project-id"] == "project-123"
    assert call["Metadata"]["source-type"] == "local"


class _StubPaginator:
    def __init__(self, pages: list[dict[str, Any]]) -> None:
        self._pages = pages

    def paginate(self, Bucket: str, Prefix: str) -> list[dict[str, Any]]:
        return self._pages


class _StubPaginatedS3Client:
    def __init__(self, pages: list[dict[str, Any]]) -> None:
        self._pages = pages
        self.paginator_name: str | None = None

    def get_paginator(self, name: str) -> _StubPaginator:
        self.paginator_name = name
        return _StubPaginator(self._pages)


def test_list_document_keys_paginates_and_sorts() -> None:
    client = _StubPaginatedS3Client(
        [
            {"Contents": [{"Key": "fsds/inventory/b.pdf"}]},
            {"Contents": [{"Key": "fsds/inventory/a.pdf"}]},
        ]
    )

    result = s3.list_document_keys(
        "my-bucket", "fsds/inventory/", "us-east-1", s3_client=cast("S3Client", client)
    )

    assert result == ["fsds/inventory/a.pdf", "fsds/inventory/b.pdf"]
    assert client.paginator_name == "list_objects_v2"


def test_list_document_keys_handles_empty_page() -> None:
    client = _StubPaginatedS3Client([{}])

    result = s3.list_document_keys(
        "my-bucket", "fsds/none/", "us-east-1", s3_client=cast("S3Client", client)
    )

    assert result == []
