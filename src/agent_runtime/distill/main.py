from agent_runtime.factory import create_app
from config.settings import get_settings
from core.domain.spec import StructuredSpec
from tools.distill import score_completeness

app = create_app("distill", StructuredSpec, tools=[score_completeness])

if __name__ == "__main__":
    app.run(port=get_settings().port)
