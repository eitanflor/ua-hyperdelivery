from agent_runtime.factory import create_app
from config.settings import get_settings
from core.domain.showroom import DemoPackage
from tools.showroom import validate_talk_track_coverage

app = create_app("showroom", DemoPackage, tools=[validate_talk_track_coverage])

if __name__ == "__main__":
    app.run(port=get_settings().port)
