import io

import boto3

# Generic S3 fetch+parse - not specific to any one agent. Callers supply bucket/region;
# reusable by any Strands agent project that needs to turn an object key into text.


def parse_document(key: str, body: bytes) -> str:
    """Decode a fetched object's bytes into text based on its key's extension."""
    if key.lower().endswith(".pdf"):
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(body))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    return body.decode("utf-8")


def get_document_text(bucket: str, key: str, region: str, s3_client=None) -> str:
    """Fetch an object from S3 and return its text content (.txt/.md decoded as-is,
    .pdf extracted via pypdf). Pass `s3_client` to inject a fake/stub client in tests."""
    client = s3_client or boto3.client("s3", region_name=region)
    body = client.get_object(Bucket=bucket, Key=key)["Body"].read()
    return parse_document(key, body)
