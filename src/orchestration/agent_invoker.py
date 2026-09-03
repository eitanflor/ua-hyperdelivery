"""Step Functions Task glue: invokes one AgentCore Runtime agent and returns its result.

Resolves the runtime ARN by name on every call (via the control plane) rather than
hardcoding it, since the actual `hyperdelivery_<agent>` runtimes don't exist yet (blocked
on IAM) and their ARNs aren't known at CDK synth time.
"""

import json
import logging
import os
from typing import Any, cast

import boto3

from infrastructure.aws import BotoClientFactory
from infrastructure.repositories.project_repository import ProjectRepository

logger = logging.getLogger("agent_invoker")

_RUNTIME_SESSION_ID_MIN_LEN = 33  # AgentCore Runtime constraint


class AgentInvoker:
    """Invokes one AgentCore Runtime agent by name and unwraps its structured result."""

    def __init__(
        self, region: str, runtime_prefix: str, clients: BotoClientFactory | None = None
    ) -> None:
        """Pass `clients` to inject a fake boto3 module instead of reaching real AWS."""
        self._region = region
        self._runtime_prefix = runtime_prefix
        # boto3's stubs are a big overload set rather than a plain signature, so it needs
        # a cast to satisfy the protocol it does implement at runtime.
        factory = clients if clients is not None else cast(BotoClientFactory, boto3)
        self._control = factory.client("bedrock-agentcore-control", region_name=region)
        self._data = factory.client("bedrock-agentcore", region_name=region)

    def _resolve_runtime_arn(self, agent: str) -> str:
        runtime_name = f"{self._runtime_prefix}{agent}"
        resp = self._control.list_agent_runtimes()
        for runtime in resp.get("agentRuntimes", []):
            if runtime.get("agentRuntimeName") == runtime_name:
                return runtime["agentRuntimeArn"]
        msg = f"no AgentCore runtime found named {runtime_name!r}"
        raise ValueError(msg)

    def invoke(self, agent: str, project_id: str, prompt: str) -> dict[str, Any]:
        """Run `agent` against `prompt` and return its validated `result` payload."""
        runtime_arn = self._resolve_runtime_arn(agent)
        session_id = project_id.ljust(_RUNTIME_SESSION_ID_MIN_LEN, "0")

        response = self._data.invoke_agent_runtime(
            agentRuntimeArn=runtime_arn,
            runtimeSessionId=session_id,
            contentType="application/json",
            payload=json.dumps({"prompt": prompt}),
        )
        body = response["response"].read()
        result = json.loads(body)
        if "error" in result:
            msg = f"{agent} agent invocation failed: {result['error']}"
            raise RuntimeError(msg)
        return result["result"]


def handler(event: dict[str, Any], _context: object) -> dict[str, Any]:
    """Step Functions LambdaInvoke entrypoint.

    `event` is the Task state's payload:
    `{"agent": "distill", "project_id": "...", "prompt": "..."}`.
    """
    invoker = AgentInvoker(
        region=os.environ["AGENTCORE_REGION"],
        runtime_prefix=os.environ["AGENT_RUNTIME_PREFIX"],
    )
    logger.info("invoking agent %s for project %s", event["agent"], event["project_id"])
    result = invoker.invoke(event["agent"], event["project_id"], event["prompt"])

    # Persist so the console API can serve it back (GET /projects/{id}/artifacts) -
    # otherwise the result only ever lives transiently in the execution's own JSON path.
    repo = ProjectRepository(
        table_name=os.environ["PROJECTS_TABLE"], region=os.environ["AWS_REGION"]
    )
    repo.save_artifact(event["project_id"], event["agent"], result)
    return result
