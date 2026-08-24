import logging

from bedrock_agentcore.runtime import BedrockAgentCoreApp

from config.loader import load_agent_config
from config.settings import get_settings
from infrastructure.observability.logging import configure_logging, session_id_var
from providers.agents.strands_factory import build_agent

settings = get_settings()
configure_logging(settings.log_level)

agent = build_agent(load_agent_config(), region_name=settings.aws_region)
app = BedrockAgentCoreApp()
logger = logging.getLogger(__name__)


@app.entrypoint
def agent_invocation(payload: dict, context) -> dict:
    """AgentCore Runtime HTTP contract: JSON payload/context in, JSON-serializable dict out."""
    session_id_var.set(getattr(context, "session_id", "-"))
    prompt = payload.get("prompt", "")
    if not isinstance(prompt, str) or not prompt.strip():
        return {"error": "'prompt' must be a non-empty string"}
    try:
        result = agent(prompt)
    except Exception:
        logger.exception("agent invocation failed")
        return {"error": "agent invocation failed"}
    return {"result": result.message}


if __name__ == "__main__":
    app.run()
