"""Distill's AgentCore Runtime entrypoint. Confluence and S3 tools attach when configured."""

from typing import Any

from agent_runtime.factory import create_app
from config.settings import get_settings
from core.constants import AgentName
from core.domain.spec import StructuredSpec
from tools.atlassian import confluence_mcp_client, jira_read_mcp_client
from tools.distill import score_completeness
from tools.distill_ingestion import get_local_document_text, github_get_readme
from tools.documents import s3_document_tool
from tools.snowflake import snowflake_tools

_tools: list[Any] = [score_completeness, get_local_document_text, github_get_readme]
if (_confluence := confluence_mcp_client()) is not None:
    _tools.append(_confluence)
if (_jira := jira_read_mcp_client()) is not None:
    _tools.append(_jira)
if (_s3_doc := s3_document_tool()) is not None:
    _tools.append(_s3_doc)
_tools.extend(snowflake_tools())

app = create_app(AgentName.DISTILL, StructuredSpec, tools=_tools)

if __name__ == "__main__":
    app.run(port=get_settings().port)
