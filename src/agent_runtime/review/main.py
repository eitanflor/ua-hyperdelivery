from agent_runtime.factory import create_app
from config.settings import get_settings
from core.domain.review import ReviewReport
from tools.review import validate_review_report

app = create_app("review", ReviewReport, tools=[validate_review_report])

if __name__ == "__main__":
    app.run(port=get_settings().port)
