"""Distill's least-privilege wrapper around Snowflake's Cortex Coding Agent.

Delegates table discovery and data fetching to Snowflake's own hosted agent instead of
hand-built SQL - the agent decides what to run and to reading data only.
SNOWFLAKE_DATABASE/SNOWFLAKE_SCHEMA are optional scoping hints, not a requirement: set
them to narrow the agent to one schema (faster, safer); leave them unset and it explores
the whole account on its own, which is the point of using the Cortex Agent at all.
"""

from typing import Any

from strands import tool

from config.settings import get_settings
from providers.storage.snowflake import SnowflakeCredentials, run_agent

_BASE_INSTRUCTIONS = (
    "You are a read-only data-discovery assistant for Snowflake. When asked a question, "
    "find the relevant tables and return the raw data that answers it as plain text, one "
    "row per line - do not summarize or omit rows, and never modify data (no "
    "INSERT/UPDATE/DELETE/DDL)."
)
_SCOPE_INSTRUCTIONS = " Only look in database {database}, schema {schema}."


def _system_instructions(database: str | None, schema: str | None) -> str:
    if database and schema:
        return _BASE_INSTRUCTIONS + _SCOPE_INSTRUCTIONS.format(database=database, schema=schema)
    return _BASE_INSTRUCTIONS


@tool
def snowflake_query(question: str) -> str:
    """Ask Snowflake's Cortex Coding Agent to find and return Snowflake data.

    Use this when the prompt references Snowflake data instead of raw FSD text - e.g.
    "the MATERIAL_IMAGES table" or "materials with a spandex percentage over 5". Mine
    the returned text for requirements the same way you would a raw document's prose.
    """
    settings = get_settings()
    pat = settings.snowflake_pat.get_secret_value() if settings.snowflake_pat else ""
    if not (settings.snowflake_account and pat):
        msg = "SNOWFLAKE_ACCOUNT and SNOWFLAKE_PAT must be configured to use snowflake_query"
        raise ValueError(msg)

    creds = SnowflakeCredentials(account=settings.snowflake_account, pat=pat)
    system_instructions = _system_instructions(
        settings.snowflake_database, settings.snowflake_schema
    )
    return run_agent(creds, question, system_instructions)


def snowflake_tools() -> list[Any]:
    """Return Distill's Snowflake tool when configured, else an empty list.

    The LLM only ever supplies a plain-language question - never credentials - so this
    is the only account it can reach. SNOWFLAKE_DATABASE/SNOWFLAKE_SCHEMA are optional
    scoping hints and don't gate whether the tool attaches at all.
    """
    settings = get_settings()
    if not (settings.snowflake_account and settings.snowflake_pat):
        return []
    return [snowflake_query]
