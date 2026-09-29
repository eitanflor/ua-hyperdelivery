"""Generic S3 fetch+parse - not specific to any one agent.

Callers supply bucket/region; reusable by any Strands agent project that needs to turn
an object key into text. The per-agent least-privilege wrapper lives in tools/documents.py.
"""

import re
from dataclasses import dataclass
from datetime import datetime
from functools import lru_cache
from hashlib import sha256
from typing import TYPE_CHECKING
from uuid import uuid4

import boto3

from providers.documents.parsing import parse_document_bytes

if TYPE_CHECKING:  # boto3-stubs is a dev-only dependency
    from mypy_boto3_s3.client import S3Client


@dataclass(frozen=True)
class NormalizedMarkdownArtifact:
    """One normalized Distill input stored within its owning project."""

    project_id: str
    source_type: str
    source_id: str
    markdown: str


@dataclass(frozen=True)
class UploadedDocument:
    """A browser-uploaded document's raw bytes, staged for `put_uploaded_document`."""

    project_id: str
    filename: str
    data: bytes


@dataclass(frozen=True)
class StoredDocument:
    """A browser-uploaded document as it sits in S3, listed back without its bytes."""

    key: str
    filename: str
    size: int
    uploaded_at: datetime | None


# the random prefix `put_uploaded_document` adds so two uploads of one name cannot collide
_COLLISION_PREFIX = re.compile(r"^[0-9a-f]{32}-")


@lru_cache
def _default_client(region: str) -> "S3Client":
    """One client per region, reused across calls instead of rebuilt on every request."""
    return boto3.client("s3", region_name=region)


def parse_document(key: str, body: bytes) -> str:
    """Decode a fetched object's bytes into text based on its key's extension."""
    return parse_document_bytes(key, body)


def get_document_text(
    bucket: str, key: str, region: str, s3_client: "S3Client | None" = None
) -> str:
    """Fetch an object from S3 and return its normalized text content.

    Supports the same formats as `providers.documents.parsing.SUPPORTED_EXTENSIONS`.
    Pass `s3_client` to inject a fake/stub client in tests.
    """
    client = s3_client or _default_client(region)
    body = client.get_object(Bucket=bucket, Key=key)["Body"].read()
    return parse_document(key, body)


def _safe_segment(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9._/-]+", "-", value).strip("-/")


def _safe_filename(value: str) -> str:
    """Strip path separators from a user-supplied filename before it goes into a key.

    Unlike `_safe_segment` (trusted ids that are allowed to contain `/`), a filename
    comes straight from the browser - `/` or `..` in it must not turn into extra key
    segments under `uploads/`.
    """
    return re.sub(r"[^A-Za-z0-9._-]+", "-", value).strip("-._")


def put_normalized_markdown(
    bucket: str,
    artifact: NormalizedMarkdownArtifact,
    region: str,
    s3_client: "S3Client | None" = None,
) -> str:
    """Store immutable Markdown under its project and return the generated key."""
    body = artifact.markdown.encode("utf-8")
    digest = sha256(body).hexdigest()
    key = (
        f"projects/{_safe_segment(artifact.project_id)}/normalized/distill/"
        f"{_safe_segment(artifact.source_type)}/{_safe_segment(artifact.source_id)}/{digest}.md"
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


def put_uploaded_document(
    bucket: str, document: UploadedDocument, region: str, s3_client: "S3Client | None" = None
) -> str:
    """Store a browser-uploaded document's raw bytes under its project and return the key.

    Kept separate from `put_normalized_markdown`: this is the original file (whatever
    Distill's `s3_get_document_text` will later fetch and parse), not its extracted text.
    A random prefix on the filename avoids collisions between two uploads of the same name.
    """
    client = s3_client or _default_client(region)
    key = f"{uploads_prefix(document.project_id)}{uuid4().hex}-{_safe_filename(document.filename)}"
    client.put_object(Bucket=bucket, Key=key, Body=document.data, ServerSideEncryption="AES256")
    return key


def uploads_prefix(project_id: str) -> str:
    """The S3 prefix every browser upload for one project is stored under."""
    return f"projects/{_safe_segment(project_id)}/uploads/"


def list_uploaded_documents(
    bucket: str, project_id: str, region: str, s3_client: "S3Client | None" = None
) -> list[StoredDocument]:
    """Return every document uploaded to a project, oldest first, under its original name."""
    client = s3_client or _default_client(region)
    documents: list[StoredDocument] = []
    pages = client.get_paginator("list_objects_v2").paginate(
        Bucket=bucket, Prefix=uploads_prefix(project_id)
    )
    for page in pages:
        for obj in page.get("Contents", []):
            key = obj.get("Key")
            if not key:
                continue
            name = key.rsplit("/", maxsplit=1)[-1]
            documents.append(
                StoredDocument(
                    key=key,
                    filename=_COLLISION_PREFIX.sub("", name),
                    size=obj.get("Size", 0),
                    uploaded_at=obj.get("LastModified"),
                )
            )
    return sorted(
        documents, key=lambda d: d.uploaded_at.timestamp() if d.uploaded_at else float("inf")
    )


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
