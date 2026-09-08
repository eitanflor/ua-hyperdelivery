"""Generic S3 fetch+parse - not specific to any one agent.

Callers supply bucket/region; reusable by any Strands agent project that needs to turn
an object key into text. The per-agent least-privilege wrapper lives in tools/documents.py.
"""

import io
import re
from dataclasses import dataclass
from functools import lru_cache
from hashlib import sha256
from typing import TYPE_CHECKING

import boto3
from pypdf import PdfReader

if TYPE_CHECKING:  # boto3-stubs is a dev-only dependency
    from mypy_boto3_s3.client import S3Client


@dataclass(frozen=True)
class NormalizedMarkdownArtifact:
    """One normalized Distill input stored within its owning project."""

    project_id: str
    source_type: str
    source_id: str
    markdown: str


@lru_cache
def _default_client(region: str) -> "S3Client":
    """One client per region, reused across calls instead of rebuilt on every request."""
    return boto3.client("s3", region_name=region)


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
    client = s3_client or _default_client(region)
    body = client.get_object(Bucket=bucket, Key=key)["Body"].read()
    return parse_document(key, body)


def put_normalized_markdown(
    bucket: str,
    artifact: NormalizedMarkdownArtifact,
    region: str,
    s3_client: "S3Client | None" = None,
) -> str:
    """Store immutable Markdown under its project and return the generated key."""

    def safe_segment(value: str) -> str:
        return re.sub(r"[^A-Za-z0-9._/-]+", "-", value).strip("-/")

    body = artifact.markdown.encode("utf-8")
    digest = sha256(body).hexdigest()
    key = (
        f"projects/{safe_segment(artifact.project_id)}/normalized/distill/"
        f"{safe_segment(artifact.source_type)}/{safe_segment(artifact.source_id)}/{digest}.md"
    )
    client = s3_client or _default_client(region)
    client.put_object(
        Bucket=bucket,
        Key=key,
        Body=body,
        ContentType="text/markdown; charset=utf-8",
        Metadata={
            "content-sha256": digest,
            "project-id": artifact.project_id,
            "source-type": artifact.source_type,
        },
        ServerSideEncryption="AES256",
    )
    return key


def list_document_keys(
    bucket: str, prefix: str, region: str, s3_client: "S3Client | None" = None
) -> list[str]:
    """Return every object key under `prefix`, sorted.

    Paginated so callers don't have to think about `ContinuationToken`. Pass
    `s3_client` to inject a fake/stub client in tests.
    """
    client = s3_client or _default_client(region)
    keys: list[str] = []
    for page in client.get_paginator("list_objects_v2").paginate(Bucket=bucket, Prefix=prefix):
        keys.extend(key for obj in page.get("Contents", []) if (key := obj.get("Key")))
    return sorted(keys)
