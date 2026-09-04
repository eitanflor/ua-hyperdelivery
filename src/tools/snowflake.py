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

    Call this whenever the input *names* a Snowflake object - a table, view or schema -
    not only when Snowflake is the input instead of a document. An FSD saying "pull the
    tier definitions from the PROMO_TIER table" is a reason to go look: confirming the
    object exists and learning its real columns grounds the spec and the data model that
    follows it, and finding that it does not exist is a gap worth raising before anyone
    plans against it.

    Ask for what you need in plain language ("does PROMO_TIER exist, and what are its
    columns?"), not for whole tables of rows. This is read-only.
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
