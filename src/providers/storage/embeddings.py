"""Generic Bedrock Titan Text Embeddings client and index I/O - not agent-specific.

Callers supply bucket/region; reusable by any agent that needs a semantic-search vector
for a chunk of text, or to read/write a precomputed similarity index. The per-agent
least-privilege wrapper lives in tools/documents.py.
"""

import json
from functools import lru_cache
from typing import TYPE_CHECKING

import boto3

if TYPE_CHECKING:  # boto3-stubs is a dev-only dependency
    from mypy_boto3_bedrock_runtime.client import BedrockRuntimeClient
    from mypy_boto3_s3.client import S3Client

# Titan Text Embeddings V2 - errors (rather than truncating) past 8192 input tokens.
DEFAULT_EMBEDDING_MODEL_ID = "amazon.titan-embed-text-v2:0"
# ~3 chars/token is a safe (conservative) average for English prose, keeping well under
# the 8192-token limit above even for token-dense text.
_MAX_INPUT_CHARS = 20000


@lru_cache
def _default_bedrock_client(region: str) -> "BedrockRuntimeClient":
    """One client per region, reused across calls instead of rebuilt on every request."""
    return boto3.client("bedrock-runtime", region_name=region)


@lru_cache
def _default_s3_client(region: str) -> "S3Client":
    """One client per region, reused across calls instead of rebuilt on every request."""
    return boto3.client("s3", region_name=region)


def embed_text(
    text: str,
    region: str,
    model_id: str = DEFAULT_EMBEDDING_MODEL_ID,
    bedrock_client: "BedrockRuntimeClient | None" = None,
) -> list[float]:
    """Return a Titan embedding vector for `text`, truncated to fit the model's input limit.

    Pass `bedrock_client` to inject a fake/stub client in tests.
    """
    client = bedrock_client or _default_bedrock_client(region)
    response = client.invoke_model(
        modelId=model_id, body=json.dumps({"inputText": text[:_MAX_INPUT_CHARS]})
    )
    payload: dict[str, list[float]] = json.loads(response["body"].read())
    return payload["embedding"]


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Return the cosine similarity between two equal-length vectors, in [-1, 1]."""
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(y * y for y in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def load_index(
    bucket: str, key: str, region: str, s3_client: "S3Client | None" = None
) -> dict[str, list[float]]:
    """Read a precomputed `{document key: embedding}` index.

    Returns `{}` if the index hasn't been built yet (scripts/build_fsd_index.py) rather
    than raising - an empty index means "no semantic search yet", not "no documents".
    """
    client = s3_client or _default_s3_client(region)
    try:
        body = client.get_object(Bucket=bucket, Key=key)["Body"].read()
    except client.exceptions.NoSuchKey:
        return {}
    index: dict[str, list[float]] = json.loads(body)
    return index


def save_index(
    bucket: str,
    key: str,
    region: str,
    index: dict[str, list[float]],
    s3_client: "S3Client | None" = None,
) -> None:
    """Write a `{document key: embedding}` index as JSON. Used by scripts/build_fsd_index.py."""
    client = s3_client or _default_s3_client(region)
    client.put_object(
        Bucket=bucket,
        Key=key,
        Body=json.dumps(index).encode("utf-8"),
        ContentType="application/json",
    )
