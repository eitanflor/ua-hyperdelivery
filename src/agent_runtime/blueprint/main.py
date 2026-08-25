from agent_runtime.factory import create_app
from config.settings import get_settings
from core.domain.blueprint import Blueprint
from tools.atlassian import jira_mcp_client
from tools.blueprint import validate_units_of_work

_tools: list = [validate_units_of_work]
if (_jira := jira_mcp_client()) is not None:
    _tools.append(_jira)

app = create_app("blueprint", Blueprint, tools=_tools)

if __name__ == "__main__":
    app.run(port=get_settings().port)
