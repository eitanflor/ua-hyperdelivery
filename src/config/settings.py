"""Environment-backed settings, shared by the agents, the console API and the Lambdas."""

from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

# resolve relative to the repo root, not cwd - `make dev-*` runs with cwd=src/
_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    """Every environment variable this codebase reads, with its default.

    Keep in lockstep with `.env.example` - `tests/unit/test_docs_consistency.py` fails
    the build if a field here isn't documented there.
    """

    # extra="ignore": .env is shared with the Makefile (e.g. AWS_PROFILE, PORT) for vars
    # that aren't declared as fields below.
    model_config = SettingsConfigDict(env_file=_ENV_FILE, extra="ignore")

    environment: str = "local"
    log_level: str = "INFO"
    aws_region: str = "us-east-1"
    port: int = 8080
    atlassian_base_url: str | None = None
    atlassian_email: str | None = None
    atlassian_api_token: str | None = None
    s3_bucket: str | None = None
    s3_region: str | None = None
    # Distill's Snowflake data tool (`snowflake_query`): SNOWFLAKE_ACCOUNT/SNOWFLAKE_PAT
    # gate whether the tool attaches at all. Warehouse/role aren't configured here - the
    # Cortex Agent resolves those from the PAT's own Snowflake user context.
    # SNOWFLAKE_DATABASE/SNOWFLAKE_SCHEMA are optional scoping hints, not a requirement -
    # unset, the agent explores the whole account on its own.
    snowflake_account: str | None = None
    snowflake_pat: SecretStr | None = None
    snowflake_database: str | None = None
    snowflake_schema: str | None = None
    # Phase 2 orchestration resources live in ap-southeast-2, separate from aws_region
    # (Bedrock/AgentCore Runtime, us-east-1) - see docs/decisions.md.
    projects_table: str = "hyperdelivery-projects"
    orchestration_region: str = "ap-southeast-2"
    # None until the state machine is deployed (blocked on IAM) - console API falls back
    # to DynamoDB-only writes with no execution to start/resume.
    state_machine_arn: str | None = None
    # Comma-separated origins allowed to call the console API - the Vite dev server by
    # default (ui/console), so the console UI can hit this API cross-origin in local dev.
    cors_origins: str = "http://localhost:5173"
    # Entra ID (Azure AD) app registration backing the console UI's MSAL sign-in; required
    # to validate the bearer ID token (see api/auth.py). Same tenant/app registration as
    # the frontend's VITE_ENTRA_TENANT_ID/VITE_ENTRA_CLIENT_ID.
    entra_tenant_id: str | None = None
    entra_client_id: str | None = None


@lru_cache
def get_settings() -> Settings:
    """Return the process-wide settings, read from the environment once.

    Cached, so tests that manipulate the environment must call `get_settings.cache_clear()`
    - `tests/conftest.py` does this automatically.
    """
    return Settings()
