from providers.storage import s3


class _StubBody:
    def __init__(self, data: bytes):
        self._data = data

    def read(self) -> bytes:
        return self._data


class _StubS3Client:
    def __init__(self, data: bytes):
        self._data = data
        self.calls: list[tuple[str, str]] = []

    def get_object(self, Bucket: str, Key: str):
        self.calls.append((Bucket, Key))
        return {"Body": _StubBody(self._data)}


def test_parse_document_decodes_txt_as_utf8():
    assert s3.parse_document("fsd.txt", b"hello world") == "hello world"


def test_parse_document_decodes_md_as_utf8():
    assert s3.parse_document("fsd.md", "# título".encode()) == "# título"


def test_parse_document_extracts_pdf_text():
    from pypdf import PdfWriter

    writer = PdfWriter()
    writer.add_blank_page(width=72, height=72)
    buf = __import__("io").BytesIO()
    writer.write(buf)

    # a blank page has no extractable text, but this proves the pdf branch runs cleanly
    assert s3.parse_document("fsd.pdf", buf.getvalue()) == ""


def test_get_document_text_uses_injected_client_and_bucket():
    client = _StubS3Client(b"raw fsd text")

    result = s3.get_document_text("my-bucket", "fsd.txt", "ap-southeast-2", s3_client=client)

    assert result == "raw fsd text"
    assert client.calls == [("my-bucket", "fsd.txt")]
