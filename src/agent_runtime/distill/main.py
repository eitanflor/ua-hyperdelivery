"""Distill's AgentCore Runtime entrypoint. Confluence and S3 tools attach when configured."""

from typing import Any

from agent_runtime.factory import create_app
from config.settings import get_settings
from core.constants import AgentName
from core.domain.spec import StructuredSpec
from tools.atlassian import confluence_mcp_client, jira_read_mcp_client
from tools.distill import (
    ask_clarifying_questions,
    detect_fsd_template,
    extract_field_rules,
    score_completeness,
    score_template_coverage,
    submit_structured_spec,
    validate_rule_correlations,
    validate_structured_spec,
)
from tools.distill_ingestion import get_local_document_text
from tools.documents import (
    s3_document_tool,
    s3_reference_list_tool,
    s3_similarity_search_tool,
)
from tools.planning import track_plan
from tools.snowflake import snowflake_tools

_tools: list[Any] = [
    track_plan,
    detect_fsd_template,
    score_template_coverage,
    extract_field_rules,
    validate_structured_spec,
    validate_rule_correlations,
    score_completeness,
    get_local_document_text,
    submit_structured_spec,
    ask_clarifying_questions,
]
if (_confluence := confluence_mcp_client()) is not None:
    _tools.append(_confluence)
if (_jira := jira_read_mcp_client()) is not None:
    _tools.append(_jira)
if (_s3_doc := s3_document_tool()) is not None:
    _tools.append(_s3_doc)
if (_s3_list := s3_reference_list_tool()) is not None:
    _tools.append(_s3_list)
if (_s3_similar := s3_similarity_search_tool()) is not None:
    _tools.append(_s3_similar)
_tools.extend(snowflake_tools())

app = create_app(AgentName.DISTILL, StructuredSpec, tools=_tools, force_structured_output=False)

if __name__ == "__main__":
    app.run(port=get_settings().port)
