"""Prepares and inspects execution workspaces: cloned repos and their discovered environment."""

import logging
import shutil
import subprocess
import uuid
from pathlib import Path

from core.domain.workspace import DiscoveredEnvVar, WorkspaceProfile
from infrastructure.workspace.scanner import EnvironmentScanner

logger = logging.getLogger(__name__)

_CLONE_TIMEOUT_SECONDS = 300
# git accepts `ext::<command>` and argument-injection URLs (a leading "-") that can run
# arbitrary commands - only plain remote-fetch schemes are allowed here.
_ALLOWED_REPO_URL_PREFIXES = ("https://", "http://", "git@")
_GIT_EXECUTABLE = shutil.which("git") or "git"


class WorkspaceManager:
    """Owns the lifecycle of a cloned repo workspace: create, scan, and resolve secrets for it."""

    def __init__(self, base_dir: Path) -> None:
        """`base_dir` is the parent directory new workspace clones are created under."""
        self._base_dir = base_dir

    def prepare_workspace(self, path: Path, *, repo_url: str = "") -> WorkspaceProfile:
        """Builds a `WorkspaceProfile` for an already-existing, already-cloned workspace."""
        environment = EnvironmentScanner(path).scan()
        return WorkspaceProfile(
            workspace_id=path.name,
            repo_url=repo_url,
            clone_path=str(path),
            environment=environment,
        )

    def create_workspace(
        self, repo_url: str, *, workspace_id: str | None = None
    ) -> WorkspaceProfile:
        """Clones `repo_url` into a fresh workspace directory and scans its environment."""
        if not repo_url.startswith(_ALLOWED_REPO_URL_PREFIXES):
            message = f"Unsupported or unsafe repo URL: {repo_url!r}"
            raise ValueError(message)

        workspace_id = workspace_id or uuid.uuid4().hex
        clone_path = self._base_dir / workspace_id
        clone_path.mkdir(parents=True, exist_ok=True)

        result = subprocess.run(  # noqa: S603 - fixed argv, repo_url scheme validated above
            [_GIT_EXECUTABLE, "clone", "--", repo_url, str(clone_path)],
            capture_output=True,
            text=True,
            timeout=_CLONE_TIMEOUT_SECONDS,
            check=False,
        )
        if result.returncode != 0:
            message = f"git clone failed for {repo_url!r}: {result.stderr}"
            raise RuntimeError(message)

        return self.prepare_workspace(clone_path, repo_url=repo_url)

    def get_missing_secrets(
        self, profile: WorkspaceProfile, *, provided_secrets: dict[str, str]
    ) -> list[DiscoveredEnvVar]:
        """Returns the secret-shaped vars this workspace needs that aren't in `provided_secrets`."""
        return [
            var
            for var in profile.environment.required_vars
            if var.is_secret and var.name not in provided_secrets
        ]

    def get_execution_environment(
        self, profile: WorkspaceProfile, *, secrets: dict[str, str]
    ) -> dict[str, str]:
        """Resolves the full env var map to inject when running commands in this workspace."""
        resolved: dict[str, str] = {}
        for var in profile.environment.required_vars:
            if var.name in secrets:
                resolved[var.name] = secrets[var.name]
            elif var.default_value is not None:
                resolved[var.name] = var.default_value
        return resolved
