from agent_runtime.factory import create_app
from config.settings import get_settings
from core.domain.blueprint import Blueprint
from tools.blueprint import validate_units_of_work

app = create_app("blueprint", Blueprint, tools=[validate_units_of_work])

if __name__ == "__main__":
    app.run(port=get_settings().port)
