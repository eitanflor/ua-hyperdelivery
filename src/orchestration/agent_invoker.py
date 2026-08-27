"""Step Functions Task glue: invokes one AgentCore Runtime agent and returns its result.

Bridges two regions by design (see docs/decisions.md): the state machine lives in
ap-southeast-2, but AgentCore Runtime only exists in us-east-1. Resolves the runtime ARN
by name on every call (via the control plane) rather than hardcoding it, since the actual
`hyperdelivery_<agent>` runtimes don't exist yet (blocked on IAM) and their ARNs aren't
known at CDK synth time.
"""

import json
import logging
from typing import Any

import boto3

logger = logging.getLogger("agent_invoker")

_RUNTIME_SESSION_ID_MIN_LEN = 33  # AgentCore Runtime constraint


class AgentInvoker:
    def __init__(self, region: str, runtime_prefix: str, clients: Any = None):
        self._region = region
        self._runtime_prefix = runtime_prefix
        self._control = (clients or boto3).client("bedrock-agentcore-control", region_name=region)
        self._data = (clients or boto3).client("bedrock-agentcore", region_name=region)

    def _resolve_runtime_arn(self, agent: str) -> str:
        runtime_name = f"{self._runtime_prefix}{agent}"
        resp = self._control.list_agent_runtimes()
        for runtime in resp.get("agentRuntimes", []):
            if runtime.get("agentRuntimeName") == runtime_name:
                return runtime["agentRuntimeArn"]
        raise ValueError(f"no AgentCore runtime found named {runtime_name!r}")

    def invoke(self, agent: str, project_id: str, prompt: str) -> dict:
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
            raise RuntimeError(f"{agent} agent invocation failed: {result['error']}")
        return result["result"]


def handler(event: dict, context: Any) -> dict:
    """Step Functions LambdaInvoke entrypoint. `event` is the Task state's payload:
    {"agent": "distill", "project_id": "...", "prompt": "..."}."""
    import os

    invoker = AgentInvoker(
        region=os.environ["AGENTCORE_REGION"],
        runtime_prefix=os.environ["AGENT_RUNTIME_PREFIX"],
    )
    logger.info("invoking agent %s for project %s", event["agent"], event["project_id"])
    return invoker.invoke(event["agent"], event["project_id"], event["prompt"])
