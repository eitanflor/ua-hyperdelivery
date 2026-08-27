"""Typed seam for the `boto3` module so injected AWS clients aren't bare `Any`."""

from typing import Any, Protocol


class BotoClientFactory(Protocol):
    """The slice of the `boto3` module surface the orchestration Lambda tasks use.

    Injecting the factory rather than each client keeps one seam per task. boto3 hands
    back a differently-shaped object per service and the `bedrock-agentcore` services
    have no stubs published yet, so the return type stays open here; call sites for
    services that do have stubs annotate the client they hold.
    """

    def client(self, service_name: str, region_name: str | None = ...) -> Any:  # noqa: ANN401
        """Return a low-level service client, e.g. `sns` or `stepfunctions`."""
        ...

    def resource(self, service_name: str, region_name: str | None = ...) -> Any:  # noqa: ANN401
        """Return a high-level service resource, e.g. `dynamodb`."""
        ...
