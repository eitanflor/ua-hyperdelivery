"""Generic S3 fetch+parse - not specific to any one agent.

Callers supply bucket/region; reusable by any Strands agent project that needs to turn
an object key into text. The per-agent least-privilege wrapper lives in tools/documents.py.
"""

import io
from typing import TYPE_CHECKING

import boto3
from pypdf import PdfReader

if TYPE_CHECKING:  # boto3-stubs is a dev-only dependency
    from mypy_boto3_s3.client import S3Client


def parse_document(key: str, body: bytes) -> str:
    """Decode a fetched object's bytes into text based on its key's extension."""
    key_lc = key.lower()
    if key_lc.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(body))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    if key_lc.endswith((".txt", ".md")):
        try:
            return body.decode("utf-8")
        except UnicodeDecodeError as e:
            msg = f"Unsupported encoding for {key}; expected UTF-8"
            raise ValueError(msg) from e
    msg = f"Unsupported document type for {key}; expected .txt, .md, or .pdf"
    raise ValueError(msg)


def get_document_text(
    bucket: str, key: str, region: str, s3_client: "S3Client | None" = None
) -> str:
    """Fetch an object from S3 and return its text content.

    .txt/.md are decoded as-is and .pdf is extracted via pypdf. Pass `s3_client` to
    inject a fake/stub client in tests.
    """
    client = s3_client or boto3.client("s3", region_name=region)
    body = client.get_object(Bucket=bucket, Key=key)["Body"].read()
    return parse_document(key, body)
