"""Distill's least-privilege wrapper around the generic S3 document fetcher."""

from strands import tool
from strands.tools.decorator import DecoratedFunctionTool

from config.settings import get_settings
from providers.storage.s3 import get_document_text


@tool
def s3_get_document_text(key: str) -> str:
    """Fetch and parse a document (.txt/.md/.pdf) from the configured S3 bucket by key.

    Use this when the prompt gives an S3 key instead of raw FSD text.
    """
    settings = get_settings()
    if not (settings.s3_bucket and settings.s3_region):
        msg = "S3_BUCKET and S3_REGION must be configured to use s3_get_document_text"
        raise ValueError(msg)
    return get_document_text(settings.s3_bucket, key, settings.s3_region)


def s3_document_tool() -> DecoratedFunctionTool[..., str] | None:
    """Return the tool only when a bucket is configured, else None.

    The LLM only ever supplies a key, never a bucket, so this is the only bucket it
    can reach.
    """
    settings = get_settings()
    if not (settings.s3_bucket and settings.s3_region):
        return None
    return s3_get_document_text
