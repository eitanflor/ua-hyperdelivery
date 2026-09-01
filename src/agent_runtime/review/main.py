"""Review's AgentCore Runtime entrypoint. Takes its input entirely from the prompt."""

from agent_runtime.factory import create_app
from config.settings import get_settings
from core.constants import AgentName
from core.domain.review import ReviewReport
from tools.review import score_review_completeness, validate_review_report

app = create_app(
    AgentName.REVIEW, ReviewReport, tools=[validate_review_report, score_review_completeness]
)

if __name__ == "__main__":
    app.run(port=get_settings().port)
