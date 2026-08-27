"""Showroom's AgentCore Runtime entrypoint. Takes its input entirely from the prompt."""

from agent_runtime.factory import create_app
from config.settings import get_settings
from core.constants import AgentName
from core.domain.showroom import DemoPackage
from tools.showroom import validate_talk_track_coverage

app = create_app(AgentName.SHOWROOM, DemoPackage, tools=[validate_talk_track_coverage])

if __name__ == "__main__":
    app.run(port=get_settings().port)
