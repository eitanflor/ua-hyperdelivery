"""Builds/refreshes the FSD embedding index (fsds/_index.json) for semantic search.

Run manually whenever documents are added/removed under fsds/ - the AgentCore Runtime
execution role is granted read-only access to this bucket (see
infra/stacks/storage_stack.py), so the running agent cannot write this index itself.
Uses the caller's own AWS credentials, same as scripts/deploy_agent.sh.

Usage: PYTHONPATH=src uv run python scripts/build_fsd_index.py
"""

import logging

import boto3

from config.settings import get_settings
from providers.storage.embeddings import embed_text, save_index
from providers.storage.s3 import get_document_text, list_document_keys
from tools.documents import INDEX_KEY, REFERENCE_PREFIX

logger = logging.getLogger(__name__)


def main() -> None:
    """Embed every reference FSD and write the index back to S3."""
    logging.basicConfig(level=logging.INFO)
    settings = get_settings()
    if not (settings.s3_bucket and settings.s3_region):
        msg = "S3_BUCKET and S3_REGION must be configured to build the FSD index"
        raise SystemExit(msg)

    s3_client = boto3.client("s3", region_name=settings.s3_region)
    keys = [
        key
        for key in list_document_keys(
            settings.s3_bucket, REFERENCE_PREFIX, settings.s3_region, s3_client=s3_client
        )
        if not key.rsplit("/", 1)[-1].startswith("_")
    ]

    index: dict[str, list[float]] = {}
    for key in keys:
        logger.info("Embedding %s", key)
        text = get_document_text(settings.s3_bucket, key, settings.s3_region, s3_client=s3_client)
        index[key] = embed_text(text, settings.aws_region)

    save_index(settings.s3_bucket, INDEX_KEY, settings.s3_region, index, s3_client=s3_client)
    logger.info("Wrote %d embeddings to s3://%s/%s", len(index), settings.s3_bucket, INDEX_KEY)


if __name__ == "__main__":
    main()
