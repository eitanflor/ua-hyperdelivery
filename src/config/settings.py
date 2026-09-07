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
    # Blueprint's/Review's GitHub tools: gates whether create_repository/issue_write/
    # assign_copilot_to_issue attach at all. Reaches GitHub's official remote MCP server
    # (api.githubcopilot.com), not a locally-run process - see tools/github.py,
    # docs/decisions.md.
    github_pat: SecretStr | None = None
    # Phase 2 orchestration resources. Table name is env-suffixed by
    # infra/stacks/storage_stack.py (see docs/decisions.md); default here matches the
    # dev environment's table. Same region as aws_region now - the prior
    # ap-southeast-2 split is gone, see docs/decisions.md, 'Consolidate all AWS
    # resources into us-east-1'.
    projects_table: str = "hyperdelivery-dev-projects"
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
    # Local demo preview only - the console API and this checkout must be the same
    # machine (see infrastructure/local_preview.py, docs/decisions.md). Unset means no
    # preview automation: merging still succeeds, there is just no checkout to run a
    # script in. Not the hosted "preview per pull request" docs/hyperdelivery-plan.md's
    # Phase 3 describes - that is unbuilt.
    preview_checkout_path: str | None = None
    preview_command: str = "./scripts/preview.sh"
    preview_backend_port: int = 8000
    preview_frontend_port: int = 5183


@lru_cache
def get_settings() -> Settings:
    """Return the process-wide settings, read from the environment once.

    Cached, so tests that manipulate the environment must call `get_settings.cache_clear()`
    - `tests/conftest.py` does this automatically.
    """
    return Settings()
