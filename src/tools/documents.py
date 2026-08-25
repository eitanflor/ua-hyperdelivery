from typing import Any

from strands import tool

from config.settings import get_settings
from providers.storage.s3 import get_document_text


@tool
def s3_get_document_text(key: str) -> str:
    """Fetch and parse a document (.txt/.md/.pdf) from the configured S3 bucket by key.
    Use this when the prompt gives an S3 key instead of raw FSD text."""
    settings = get_settings()
    if not (settings.s3_bucket and settings.s3_region):
        raise ValueError("S3_BUCKET and S3_REGION must be configured to use s3_get_document_text")
    return get_document_text(settings.s3_bucket, key, settings.s3_region)


def s3_document_tool() -> Any | None:
    """Returns None when S3_BUCKET/S3_REGION are not configured - the LLM
    only ever supplies a key, never a bucket, so this is the only bucket it can reach."""
    settings = get_settings()
    if not (settings.s3_bucket and settings.s3_region):
        return None
    return s3_get_document_text
