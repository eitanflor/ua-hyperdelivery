"""Review's AgentCore Runtime entrypoint. The GitHub tool attaches when configured."""

from typing import Any

from agent_runtime.factory import create_app
from config.settings import get_settings
from core.constants import AgentName
from core.domain.review import ReviewReport
from tools.github import review_github_mcp_client
from tools.review import (
    score_review_completeness,
    validate_copilot_assignments,
    validate_review_report,
)

_tools: list[Any] = [
    validate_review_report,
    score_review_completeness,
    validate_copilot_assignments,
]
if (_github := review_github_mcp_client()) is not None:
    _tools.append(_github)

app = create_app(AgentName.REVIEW, ReviewReport, tools=_tools)

if __name__ == "__main__":
    app.run(port=get_settings().port)
