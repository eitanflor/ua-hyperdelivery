"""Domain models for workspace execution environments and secret discovery."""

from pydantic import BaseModel, Field


class DiscoveredEnvVar(BaseModel):
    """One environment variable discovered in project configuration or templates."""

    name: str
    default_value: str | None = None
    is_secret: bool = False
    description: str | None = None
    source_file: str


class DiscoveredEnvironment(BaseModel):
    """Execution environment capabilities and requirements discovered in a repo."""

    required_vars: list[DiscoveredEnvVar] = Field(default_factory=list)
    has_docker: bool = False
    has_tests: bool = False
    test_commands: list[str] = Field(default_factory=list)
    build_commands: list[str] = Field(default_factory=list)


class WorkspaceProfile(BaseModel):
    """Runtime representation of a cloned workspace and its execution context."""

    workspace_id: str
    repo_url: str
    clone_path: str
    environment: DiscoveredEnvironment
    secrets: dict[str, str] = Field(default_factory=dict)


class ValidationSummary(BaseModel):
    """Summary of verification checks (build, test, runtime) performed on a workspace."""

    build_passed: bool = True
    tests_passed: bool = True
    runtime_passed: bool = True
    summary: str
    modified_files: list[str] = Field(default_factory=list)
    output_log: str = ""
