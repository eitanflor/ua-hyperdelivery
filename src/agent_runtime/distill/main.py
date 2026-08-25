from agent_runtime.factory import create_app
from config.settings import get_settings
from core.domain.spec import StructuredSpec
from tools.atlassian import confluence_mcp_client
from tools.distill import score_completeness

_tools: list = [score_completeness]
if (_confluence := confluence_mcp_client()) is not None:
    _tools.append(_confluence)

app = create_app("distill", StructuredSpec, tools=_tools)

if __name__ == "__main__":
    app.run(port=get_settings().port)
