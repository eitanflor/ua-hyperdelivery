import logging
from typing import Any, TypeVar

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from pydantic import BaseModel

from config.loader import load_agent_config
from config.settings import get_settings
from infrastructure.observability.logging import configure_logging, session_id_var
from infrastructure.observability.tracing import configure_tracing
from providers.agents.strands_factory import build_agent

OutputT = TypeVar("OutputT", bound=BaseModel)


def create_app(
    agent_name: str, output_model: type[OutputT], tools: list[Any] | None = None
) -> BedrockAgentCoreApp:
    """Wires a declaratively-configured Strands agent into the AgentCore Runtime HTTP
    contract, validating its reply against `output_model` instead of returning free text."""
    settings = get_settings()
    configure_logging(settings.log_level)
    configure_tracing()

    agent = build_agent(load_agent_config(agent_name), region_name=settings.aws_region, tools=tools)
    app = BedrockAgentCoreApp()
    logger = logging.getLogger(agent_name)

    @app.entrypoint
    def agent_invocation(payload: dict, context) -> dict:
        """AgentCore Runtime HTTP contract: JSON payload/context in, JSON-serializable dict out."""
        session_id_var.set(getattr(context, "session_id", "-"))
        prompt = payload.get("prompt", "")
        if not isinstance(prompt, str) or not prompt.strip():
            return {"error": "'prompt' must be a non-empty string"}
        logger.info("invocation started")
        try:
            # non-deprecated path: runs the full tool-use loop, then formats the result
            result = agent(prompt, structured_output_model=output_model)
        except Exception:
            logger.exception("agent invocation failed")
            return {"error": "agent invocation failed"}
        if result.structured_output is None:
            logger.error("agent did not produce structured output")
            return {"error": "agent did not produce structured output"}
        # DEBUG, not INFO - the result can contain full FSD/spec content (set
        # LOG_LEVEL=DEBUG in .env to see it).
        logger.debug("result: %s", result.structured_output.model_dump())
        logger.info("invocation succeeded")
        return {"result": result.structured_output.model_dump()}

    return app
