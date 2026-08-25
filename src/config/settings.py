from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# resolve relative to the repo root, not cwd - `make dev-*` runs with cwd=src/
_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ENV_FILE, env_prefix="HYPERDELIVERY_")

    environment: str = "local"
    log_level: str = "INFO"
    aws_region: str = "us-east-1"
    port: int = 8080
    atlassian_base_url: str | None = None
    atlassian_email: str | None = None
    atlassian_api_token: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
