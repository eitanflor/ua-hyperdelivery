"""Distill's least-privilege wrapper around the generic S3 document fetcher."""

from typing import Any

from strands import tool
from strands.tools.decorator import DecoratedFunctionTool

from config.settings import get_settings
from providers.storage.embeddings import cosine_similarity, embed_text, load_index
from providers.storage.s3 import get_document_text, list_document_keys

# Historical FSDs uploaded for reference, one folder per subject-matter category -
# see the `fsds/<category>/<ticket-id>-<slug>.pdf` key convention.
REFERENCE_PREFIX = "fsds/"
# The precomputed embedding index scripts/build_fsd_index.py writes back to S3 - kept
# under REFERENCE_PREFIX so it's covered by the same bucket policy grant, but its "_"
# prefix excludes it from list/category results below (it isn't itself a reference doc).
INDEX_KEY = f"{REFERENCE_PREFIX}_index.json"
# "fsds/<category>/<file>" split by "/" - at least this many segments to have a category.
_MIN_SEGMENTS_WITH_CATEGORY = 3


@tool
def s3_get_document_text(key: str) -> str:
    """Fetch and parse a document (.txt/.md/.pdf) from the configured S3 bucket by key.

    Call this for any S3 key you are given or find, whether it is the document to work
    from or one you turned up while looking for related material.
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


@tool
def s3_list_reference_documents(category: str | None = None) -> dict[str, Any]:
    """List historical FSDs available for reference.

    Returns `documents` (S3 keys, narrowed to `category` if given) and
    `available_categories` (every category that actually exists) in the same response,
    so an unrecognized or guessed `category` still tells you the real vocabulary instead
    of silently returning nothing. Call `s3_get_document_text` with a returned key to
    read one. Reading a past FSD is free and unobserved, so do it whenever it might
    inform the work rather than waiting to be asked - just never cite one as evidence for
    the FSD currently being distilled.
    """
    settings = get_settings()
    if not (settings.s3_bucket and settings.s3_region):
        msg = "S3_BUCKET and S3_REGION must be configured to use s3_list_reference_documents"
        raise ValueError(msg)
    all_keys = [
        key
        for key in list_document_keys(settings.s3_bucket, REFERENCE_PREFIX, settings.s3_region)
        if not key.rsplit("/", 1)[-1].startswith("_")
    ]
    available_categories = sorted(
        {
            parts[1]
            for key in all_keys
            if len(parts := key.split("/")) >= _MIN_SEGMENTS_WITH_CATEGORY
        }
    )
    prefix = f"{REFERENCE_PREFIX}{category}/" if category else REFERENCE_PREFIX
    documents = [key for key in all_keys if key.startswith(prefix)]
    return {"documents": documents, "available_categories": available_categories}


def s3_reference_list_tool() -> DecoratedFunctionTool[..., dict[str, Any]] | None:
    """Return the tool only when a bucket is configured, else None."""
    settings = get_settings()
    if not (settings.s3_bucket and settings.s3_region):
        return None
    return s3_list_reference_documents


@tool
def s3_find_similar_reference_documents(query: str, top_k: int = 3) -> dict[str, Any]:
    """Return the historical FSDs whose content is most semantically similar to `query`.

    `query` should describe the feature currently being distilled, in your own words -
    not a category name. Reads a precomputed embedding index built by
    scripts/build_fsd_index.py; an empty `matches` list most often means that index is
    stale or hasn't been built yet, not that no reference documents exist - fall back to
    `s3_list_reference_documents` in that case. Call `s3_get_document_text` with a
    returned key to read one.
    """
    settings = get_settings()
    if not (settings.s3_bucket and settings.s3_region):
        msg = (
            "S3_BUCKET and S3_REGION must be configured to use s3_find_similar_reference_documents"
        )
        raise ValueError(msg)
    index = load_index(settings.s3_bucket, INDEX_KEY, settings.s3_region)
    if not index:
        return {"matches": []}
    query_embedding = embed_text(query, settings.aws_region)
    ranked = sorted(
        index.items(),
        key=lambda item: cosine_similarity(query_embedding, item[1]),
        reverse=True,
    )
    return {"matches": [key for key, _ in ranked[:top_k]]}


def s3_similarity_search_tool() -> DecoratedFunctionTool[..., dict[str, Any]] | None:
    """Return the tool only when a bucket is configured, else None."""
    settings = get_settings()
    if not (settings.s3_bucket and settings.s3_region):
        return None
    return s3_find_similar_reference_documents
