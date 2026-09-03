from typing import TYPE_CHECKING, Any, cast

from providers.storage import embeddings

if TYPE_CHECKING:
    from mypy_boto3_bedrock_runtime.client import BedrockRuntimeClient
    from mypy_boto3_s3.client import S3Client


class _StubBody:
    def __init__(self, data: bytes) -> None:
        self._data = data

    def read(self) -> bytes:
        return self._data


class _StubBedrockClient:
    def __init__(self, embedding: list[float]) -> None:
        self._embedding = embedding
        self.calls: list[tuple[str, str]] = []

    def invoke_model(self, modelId: str, body: str) -> dict[str, Any]:
        self.calls.append((modelId, body))
        return {"body": _StubBody(f'{{"embedding": {self._embedding}}}'.encode())}


def test_embed_text_returns_vector_from_response_body() -> None:
    client = _StubBedrockClient([0.1, 0.2, 0.3])

    result = embeddings.embed_text(
        "some FSD text", "us-east-1", bedrock_client=cast("BedrockRuntimeClient", client)
    )

    assert result == [0.1, 0.2, 0.3]
    model_id, body = client.calls[0]
    assert model_id == embeddings.DEFAULT_EMBEDDING_MODEL_ID
    assert "some FSD text" in body


def test_cosine_similarity_identical_vectors_is_one() -> None:
    assert embeddings.cosine_similarity([1.0, 0.0], [1.0, 0.0]) == 1.0


def test_cosine_similarity_orthogonal_vectors_is_zero() -> None:
    assert embeddings.cosine_similarity([1.0, 0.0], [0.0, 1.0]) == 0.0


def test_cosine_similarity_zero_vector_is_zero_not_a_division_error() -> None:
    assert embeddings.cosine_similarity([0.0, 0.0], [1.0, 1.0]) == 0.0


class _NoSuchKeyError(Exception):
    pass


class _StubExceptions:
    NoSuchKey = _NoSuchKeyError


class _StubS3Client:
    def __init__(self, body: bytes | None) -> None:
        self._body = body
        self.exceptions = _StubExceptions()
        self.put_calls: list[dict[str, Any]] = []

    def get_object(self, Bucket: str, Key: str) -> dict[str, Any]:
        if self._body is None:
            raise self.exceptions.NoSuchKey
        return {"Body": _StubBody(self._body)}

    def put_object(self, **kwargs: Any) -> None:
        self.put_calls.append(kwargs)


def test_load_index_returns_empty_dict_when_not_built_yet() -> None:
    client = _StubS3Client(body=None)

    result = embeddings.load_index(
        "my-bucket", "fsds/_index.json", "us-east-1", s3_client=cast("S3Client", client)
    )

    assert result == {}


def test_load_index_parses_existing_json() -> None:
    client = _StubS3Client(body=b'{"fsds/a.pdf": [0.1, 0.2]}')

    result = embeddings.load_index(
        "my-bucket", "fsds/_index.json", "us-east-1", s3_client=cast("S3Client", client)
    )

    assert result == {"fsds/a.pdf": [0.1, 0.2]}


def test_save_index_writes_json_to_the_given_key() -> None:
    client = _StubS3Client(body=None)

    embeddings.save_index(
        "my-bucket",
        "fsds/_index.json",
        "us-east-1",
        {"fsds/a.pdf": [0.1, 0.2]},
        s3_client=cast("S3Client", client),
    )

    assert client.put_calls == [
        {
            "Bucket": "my-bucket",
            "Key": "fsds/_index.json",
            "Body": b'{"fsds/a.pdf": [0.1, 0.2]}',
            "ContentType": "application/json",
        }
    ]
