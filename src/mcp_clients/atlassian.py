import re

from mcp import StdioServerParameters, stdio_client
from strands.tools.mcp import MCPClient

# Generic `mcp-atlassian` (stdio) client builders - not specific to any one agent. Callers
# supply credentials and an allowed-tools filter; reusable by any Strands agent project.


def confluence_env(base_url: str, email: str, api_token: str) -> dict[str, str]:
    return {
        "CONFLUENCE_URL": f"{base_url.rstrip('/')}/wiki",
        "CONFLUENCE_USERNAME": email,
        "CONFLUENCE_API_TOKEN": api_token,
        # trust the OS CA store so `uvx` can fetch the server through TLS-inspecting proxies
        "UV_SYSTEM_CERTS": "1",
    }


def jira_env(base_url: str, email: str, api_token: str) -> dict[str, str]:
    return {
        "JIRA_URL": base_url.rstrip("/"),
        "JIRA_USERNAME": email,
        "JIRA_API_TOKEN": api_token,
        "UV_SYSTEM_CERTS": "1",
    }


def confluence_client(
    base_url: str, email: str, api_token: str, allowed_tools: list[str | re.Pattern[str]]
) -> MCPClient:
    params = StdioServerParameters(
        command="uvx", args=["mcp-atlassian"], env=confluence_env(base_url, email, api_token)
    )
    return MCPClient(lambda: stdio_client(params), tool_filters={"allowed": allowed_tools})


def jira_client(
    base_url: str, email: str, api_token: str, allowed_tools: list[str | re.Pattern[str]]
) -> MCPClient:
    params = StdioServerParameters(
        command="uvx", args=["mcp-atlassian"], env=jira_env(base_url, email, api_token)
    )
    return MCPClient(lambda: stdio_client(params), tool_filters={"allowed": allowed_tools})
