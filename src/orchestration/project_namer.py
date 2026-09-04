"""Generates a short, human-friendly project name from a user's first message.

Uses a fast/cheap model (Claude Haiku) instead of Distill's Sonnet - naming is a trivial
task and doesn't need a heavyweight model or tool access. Used by the console UI's
landing-page chatbox, which creates a project directly from a message with no name typed
in.
"""

import logging
import threading

from strands import Agent
from strands.models import BedrockModel

logger = logging.getLogger(__name__)

_MODEL_ID = "global.anthropic.claude-haiku-4-5-20251001-v1:0"
_SYSTEM_PROMPT = (
    "You name software projects. Given a short description of what someone wants to "
    "build, reply with ONLY a concise project name (2-5 words, Title Case, no "
    "punctuation, no quotes, no explanation)."
)
_MAX_NAME_LENGTH = 60


class ProjectNamer:
    """Names a project from its first message via Claude Haiku, falling back on failure."""

    def __init__(self, region_name: str) -> None:
        """`region_name` is the Bedrock region (see Settings.aws_region), not DynamoDB's."""
        self._region_name = region_name
        self._agent: Agent | None = None
        # Naming runs in FastAPI's background-task threadpool, so two project creations
        # can land here at once. Strands serializes per Agent instance and raises
        # ConcurrencyException on the second - which the fallback below would swallow,
        # silently downgrading one project to a heuristic name.
        self._lock = threading.Lock()

    def _get_agent(self) -> Agent:
        """Built once and reused.

        Rebuilding per call re-pays boto3/credential-chain resolution on every naming
        request, which otherwise dominates the call's latency. Callers must hold
        `self._lock`: this both builds and hands out one shared, stateful instance.
        """
        if self._agent is None:
            model = BedrockModel(model_id=_MODEL_ID, region_name=self._region_name, max_tokens=30)
            # callback_handler=None: this is a one-off structured-ish text call, not an
            # interactive session - the default handler otherwise prints every token to
            # stdout, which would spam the console API's own server logs.
            self._agent = Agent(model=model, system_prompt=_SYSTEM_PROMPT, callback_handler=None)
        return self._agent

    def generate(self, message: str) -> str:
        """Best-effort naming.

        Falls back to a heuristic (not an exception) on any model/network failure, since
        a project should never fail to create just because naming it nicely didn't work.
        """
        try:
            with self._lock:
                agent = self._get_agent()
                # Strands keeps history on the instance, and this one outlives every
                # project the process names - see the same reset in agent_runtime.factory.
                agent.messages = []
                name = str(agent(message)).strip().strip("\"'").strip()
            if name:
                return name[:_MAX_NAME_LENGTH]
        except Exception:
            logger.exception("project naming failed, falling back to a heuristic name")
        return heuristic_name(message)


def heuristic_name(message: str) -> str:
    """The first few words of the message, used as an instant provisional name.

    Public so the API router can use it as the project's initial name before the (slower)
    model call finishes in the background - see `api.routers.projects.create_project`.
    """
    name = " ".join(message.strip().split()[:6]) or "Untitled Project"
    return name[:_MAX_NAME_LENGTH]
