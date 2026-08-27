from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# resolve relative to the repo root, not cwd - `make dev-*` runs with cwd=src/
_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
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
    # Phase 2 orchestration resources live in ap-southeast-2, separate from aws_region
    # (Bedrock/AgentCore Runtime, us-east-1) - see docs/decisions.md.
    projects_table: str = "hyperdelivery-projects"
    orchestration_region: str = "ap-southeast-2"
    # None until the state machine is deployed (blocked on IAM) - console API falls back
    # to DynamoDB-only writes with no execution to start/resume.
    state_machine_arn: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
