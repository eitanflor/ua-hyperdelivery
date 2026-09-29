"""Step Functions Task glue: invokes one AgentCore Runtime agent and returns its result.

Resolves the runtime ARN by name on every call (via the control plane) rather than
hardcoding it, since the actual `hyperdelivery_<agent>` runtimes don't exist yet (blocked
on IAM) and their ARNs aren't known at CDK synth time.
"""

import json
import logging
import os
from collections.abc import Callable
from typing import Any, cast

import boto3
from botocore.exceptions import ClientError

from core.prompting import prepend_context
from core.validation import evaluate_artifact
from infrastructure.aws import BotoClientFactory
from infrastructure.repositories.connections_repository import ConnectionsRepository
from infrastructure.repositories.context_repository import ContextRepository
from infrastructure.repositories.project_repository import ProjectRepository
from orchestration.turn_log import TurnLog

logger = logging.getLogger("agent_invoker")

_RUNTIME_SESSION_ID_MIN_LEN = 33  # AgentCore Runtime constraint
_GONE_STATUS_CODE = 410

BroadcastFn = Callable[[dict[str, Any]], None]


def _score_result(
    repo: ProjectRepository, project_id: str, agent: str, result: dict[str, Any]
) -> dict[str, Any]:
    """Replace self-reported completeness using the project's persisted artifacts."""
    predecessors = {
        artifact.agent: artifact.content for artifact in repo.list_artifacts(project_id)
    }
    return {
        **result,
        "completeness": evaluate_artifact(agent, result, predecessors).model_dump(),
    }


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

    def invoke(
        self,
        agent: str,
        project_id: str,
        prompt: str,
        broadcast: BroadcastFn | None = None,
        on_event: Callable[[dict[str, Any]], None] | None = None,
    ) -> dict[str, Any]:
        """Run `agent` against `prompt` and return one of three outcomes.

        AgentCore Runtime's `/invocations` contract is always SSE (`create_app`'s
        entrypoint is a streaming async generator, forced or voluntary alike) - never a
        single JSON blob - so the body is parsed the same way `LocalAgentClient.stream`
        parses it, not decoded as one document.

        `broadcast`, if given, is called with each parsed SSE event (`chunk`/`draft`/
        `tool_call`/`error`) as it arrives, then once more with `{"done": True}` after the
        loop ends - the console UI's WebSocket connection turns these into the same live
        "working" bubble a local run streams, see docs/decisions.md. A turn with no
        watching connection (no `broadcast`, or one that no-ops because nobody is
        watching) behaves identically to before this existed - broadcasting is a pure
        side effect, it never changes what this returns to the state machine.

        `on_event`, if given, sees every parsed event the same way `broadcast` does - the
        handler uses it to record the turn (see `orchestration.turn_log`).

        A forced-structured-output agent (Blueprint/Review/Showroom) always ends in
        `{"status": "drafted", "result": {...}}`. Distill (voluntary draft) can instead
        end a turn by calling `ask_clarifying_questions` - config/agents/distill.yaml
        deliberately prefers that tool over drafting a placeholder spec - which this
        returns as `{"status": "questions", "questions": [...]}`, or, rarer still, with
        no tool call at all (a bare greeting) as `{"status": "chat", "message": "..."}`.
        The caller (the state machine's Choice state) branches on `status` rather than
        this raising, since "Distill wants to ask something first" is a normal outcome,
        not a failure - see docs/decisions.md, "Distill's elicitation wait".
        """
        runtime_arn = self._resolve_runtime_arn(agent)
        session_id = project_id.ljust(_RUNTIME_SESSION_ID_MIN_LEN, "0")

        response = self._data.invoke_agent_runtime(
            agentRuntimeArn=runtime_arn,
            runtimeSessionId=session_id,
            contentType="application/json",
            payload=json.dumps({"prompt": prompt, "project_id": project_id}),
        )
        result: dict[str, Any] | None = None
        questions: list[dict[str, Any]] | None = None
        chat_text = ""
        for raw_line in response["response"].iter_lines():
            line = raw_line.decode("utf-8")
            if not line.startswith("data: "):
                continue
            event = json.loads(line[len("data: ") :])
            if on_event is not None:
                on_event(event)
            if "error" in event:
                if broadcast is not None:
                    broadcast(event)
                msg = f"{agent} agent invocation failed: {event['error']}"
                raise RuntimeError(msg)
            if isinstance(event.get("chunk"), str):
                chat_text += event["chunk"]
            tool_call = event.get("tool_call")
            if (
                isinstance(tool_call, dict)
                and tool_call.get("name") == "ask_clarifying_questions"
                and tool_call.get("status") == "done"
                and isinstance(tool_call.get("result"), dict)
            ):
                questions = tool_call["result"].get("questions")
            if "result" in event:
                result = event["result"]
            elif broadcast is not None:
                # the final `result` event carries the whole drafted artifact, which the
                # console UI already fetches separately via GET /artifacts once `done`
                # arrives - broadcasting it too would just be a second, larger copy.
                broadcast(event)
        if broadcast is not None:
            broadcast({"done": True})
        if result is not None:
            return {"status": "drafted", "result": result}
        if questions:
            return {"status": "questions", "questions": questions}
        return {"status": "chat", "message": chat_text.strip() or "(no reply this turn)"}


def _broadcaster(project_id: str) -> BroadcastFn | None:
    """Build a broadcaster bound to the project's connections at invocation start."""
    endpoint = os.environ.get("WEBSOCKET_ENDPOINT")
    if not endpoint:
        return None
    connections_repo = ConnectionsRepository(
        table_name=os.environ["CONNECTIONS_TABLE"], region=os.environ["AWS_REGION"]
    )
    connection_ids = connections_repo.connections_for_project(project_id)
    if not connection_ids:
        return None
    management = boto3.client("apigatewaymanagementapi", endpoint_url=endpoint)

    def broadcast(event: dict[str, Any]) -> None:
        data = json.dumps(event).encode("utf-8")
        for connection_id in list(connection_ids):
            try:
                management.post_to_connection(ConnectionId=connection_id, Data=data)
            except ClientError as err:
                status = err.response.get("ResponseMetadata", {}).get("HTTPStatusCode")
                if status == _GONE_STATUS_CODE:
                    connections_repo.disconnect(connection_id)
                    connection_ids.remove(connection_id)
                else:
                    logger.warning("failed to post to connection %s: %s", connection_id, err)

    return broadcast


def handler(event: dict[str, Any], _context: object) -> dict[str, Any]:
    """Step Functions LambdaInvoke entrypoint.

    `event` is the Task state's payload:
    `{"agent": "distill", "project_id": "...", "prompt": "..."}`.
    """
    project_id = event["project_id"]
    agent = event["agent"]
    region = os.environ["AWS_REGION"]
    repo = ProjectRepository(table_name=os.environ["PROJECTS_TABLE"], region=region)
    context = ContextRepository(
        table_name=os.environ["PROJECTS_TABLE"], region=region
    ).get_context()
    prompt = prepend_context(event["prompt"], context.context)
    invoker = AgentInvoker(
        region=os.environ["AGENTCORE_REGION"],
        runtime_prefix=os.environ["AGENT_RUNTIME_PREFIX"],
    )
    logger.info("invoking agent %s for project %s", agent, project_id)
    turn_log = TurnLog(repo, project_id, agent)
    try:
        outcome = invoker.invoke(
            agent,
            project_id,
            prompt,
            broadcast=_broadcaster(project_id),
            on_event=turn_log.feed,
        )
    except Exception as exc:
        # re-raised untouched: this only makes sure a failed turn still leaves a record
        turn_log.save(str(exc))
        raise
    turn_log.save()
    if outcome["status"] != "drafted":
        logger.info("agent %s ended the turn with status %s", agent, outcome["status"])
        return outcome

    # Persist results for the console API; Step Functions output is transient.
    result = _score_result(repo, project_id, agent, outcome["result"])
    outcome["result"] = result
    repo.save_artifact(project_id, agent, result)
    return outcome
