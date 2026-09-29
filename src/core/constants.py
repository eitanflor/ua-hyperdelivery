"""Names shared across the line: agent identities used by config, runtime and tooling."""

from enum import StrEnum


class AgentName(StrEnum):
    """The four stations on the Hyperdelivery line, one Bedrock AgentCore runtime each.

    The value is the contract: it is the `config/agents/{value}.yaml` stem, the
    `agent_runtime/{value}/main.py` package, and the `hyperdelivery-{value}` ECR repo.
    """

    DISTILL = "distill"
    BLUEPRINT = "blueprint"
    REVIEW = "review"
    SHOWROOM = "showroom"


class Environment(StrEnum):
    """Where the console API is running - drives which orchestration path it wires up.

    Matches `infra/app.py`'s CDK `-c env=` context values (`dev` is its default; `prod`
    isn't deployed yet). `LOCAL` is the only value with no CDK stack behind it at all -
    a developer's own machine, talking to agents' `make dev-<agent>` HTTP servers.
    """

    LOCAL = "local"
    DEV = "dev"
    PROD = "prod"


class StreamEvent(StrEnum):
    """The keys of the events one agent turn streams, agent runtime to console.

    An event is a dict keyed by these members, usually one key (`{StreamEvent.CHUNK: "text"}`),
    but `ERROR` is sent with `CODE`, and the API's closing `DONE` with the project. Each value
    is the wire name, mirrored in `ui/console/src/api/protocol.ts`, so change the two
    together. `DONE` is only ever sent onward (the invoker's broadcast, the API's closing
    event), never by an agent. A turn ends in exactly one of `RESULT` or `ERROR`, or - a
    voluntary-draft agent that chose not to draft - in neither.
    """

    CHUNK = "chunk"
    DRAFT = "draft"
    TOOL_CALL = "tool_call"
    THINKING = "thinking"
    USAGE = "usage"
    RESULT = "result"
    ERROR = "error"
    # rides beside ERROR: a `core.errors.TurnErrorCode` saying why the turn failed
    CODE = "code"
    DONE = "done"


class ToolStatus(StrEnum):
    """Where a `tool_call` event's call has got to.

    `FAILED` is a call that came back with an error (its result is the reason);
    `INTERRUPTED` is one the turn ended without a result for. Both stop the console's spinner.
    """

    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"
    INTERRUPTED = "interrupted"


# Recorded as a turn's `error` when the person stopped it or the connection dropped, so a
# stopped turn reads differently from a failed one.
TURN_STOPPED = "stopped"
