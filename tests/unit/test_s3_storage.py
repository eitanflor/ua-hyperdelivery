import io
from typing import TYPE_CHECKING, Any, cast

import pytest
from docx import Document as DocxDocument
from openpyxl import Workbook
from pptx import Presentation
from pptx.util import Emu
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


def test_parse_document_extracts_docx_text() -> None:
    doc = DocxDocument()
    doc.add_paragraph("hello from docx")
    buf = io.BytesIO()
    doc.save(buf)

    assert s3.parse_document("fsd.docx", buf.getvalue()) == "hello from docx"


def test_parse_document_extracts_pptx_text() -> None:
    presentation = Presentation()
    slide = presentation.slides.add_slide(presentation.slide_layouts[6])
    box = slide.shapes.add_textbox(Emu(0), Emu(0), Emu(100), Emu(100))
    box.text_frame.text = "hello from pptx"
    buf = io.BytesIO()
    presentation.save(buf)

    assert s3.parse_document("fsd.pptx", buf.getvalue()) == "## Slide 1\n\nhello from pptx"


def test_parse_document_extracts_xlsx_text() -> None:
    workbook = Workbook()
    sheet = workbook.active
    assert sheet is not None
    sheet.append(["col"])
    sheet.append(["value"])
    buf = io.BytesIO()
    workbook.save(buf)

    assert "| col |" in s3.parse_document("fsd.xlsx", buf.getvalue())


def test_parse_document_rejects_an_unsupported_extension() -> None:
    with pytest.raises(ValueError, match=r"fsd\.zip"):
        s3.parse_document("fsd.zip", b"whatever")


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


def test_put_uploaded_document_uses_project_prefix_and_keeps_the_filename() -> None:
    client = _StubS3Client(b"")

    key = s3.put_uploaded_document(
        "my-bucket",
        s3.UploadedDocument("project-123", "FSD notes.pptx", b"raw bytes"),
        "us-east-1",
        s3_client=cast("S3Client", client),
    )

    assert key.startswith("projects/project-123/uploads/")
    assert key.endswith("-FSD-notes.pptx")
    call = client.put_calls[0]
    assert call["Bucket"] == "my-bucket"
    assert call["Key"] == key
    assert call["Body"] == b"raw bytes"
    assert call["ServerSideEncryption"] == "AES256"


def test_put_uploaded_document_keys_are_unique_across_calls() -> None:
    client = _StubS3Client(b"")

    first = s3.put_uploaded_document(
        "my-bucket",
        s3.UploadedDocument("project-123", "same.pdf", b"a"),
        "us-east-1",
        s3_client=cast("S3Client", client),
    )
    second = s3.put_uploaded_document(
        "my-bucket",
        s3.UploadedDocument("project-123", "same.pdf", b"b"),
        "us-east-1",
        s3_client=cast("S3Client", client),
    )

    assert first != second


def test_put_uploaded_document_strips_path_separators_from_the_filename() -> None:
    client = _StubS3Client(b"")

    key = s3.put_uploaded_document(
        "my-bucket",
        s3.UploadedDocument("project-123", "../../etc/passwd", b"raw bytes"),
        "us-east-1",
        s3_client=cast("S3Client", client),
    )

    # a crafted filename must not add extra "/" segments beneath uploads/ - the key has
    # exactly one segment (the uuid-prefixed, slash-free filename) after that prefix
    prefix = "projects/project-123/uploads/"
    assert key.startswith(prefix)
    assert "/" not in key.removeprefix(prefix)


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
