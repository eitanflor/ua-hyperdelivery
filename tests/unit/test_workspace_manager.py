"""Unit tests for environment scanner and workspace manager."""

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from core.domain.workspace import DiscoveredEnvironment
from infrastructure.workspace.manager import WorkspaceManager
from infrastructure.workspace.scanner import EnvironmentScanner


@pytest.fixture
def temp_workspace(tmp_path: Path) -> Path:
    """Fixture providing a mock workspace directory with example files."""
    ws = tmp_path / "test_repo"
    ws.mkdir()

    # .env.example with secret and non-secret vars
    env_file = ws / ".env.example"
    env_content = (
        "DATABASE_URL=postgresql://localhost:5432/db\nAPI_KEY=\nPORT=8080\n# COMMENTED_VAR=123\n"
    )
    env_file.write_text(env_content, encoding="utf-8")

    # Dockerfile
    (ws / "Dockerfile").write_text("FROM python:3.11", encoding="utf-8")

    # pyproject.toml & tests directory
    (ws / "pyproject.toml").write_text("[project]\nname = 'demo'", encoding="utf-8")
    (ws / "tests").mkdir()

    return ws


def test_scanner_discovers_env_vars_and_secrets(temp_workspace: Path) -> None:
    scanner = EnvironmentScanner(temp_workspace)
    env = scanner.scan()

    assert env.has_docker is True
    assert env.has_tests is True
    assert "pytest" in env.test_commands
    assert "uv sync" in env.build_commands

    var_names = {v.name for v in env.required_vars}
    assert var_names == {"DATABASE_URL", "API_KEY", "PORT"}

    db_var = next(v for v in env.required_vars if v.name == "DATABASE_URL")
    assert db_var.is_secret is True
    assert db_var.default_value == "postgresql://localhost:5432/db"

    api_var = next(v for v in env.required_vars if v.name == "API_KEY")
    assert api_var.is_secret is True
    assert api_var.default_value is None

    port_var = next(v for v in env.required_vars if v.name == "PORT")
    assert port_var.is_secret is False
    assert port_var.default_value == "8080"


def test_scanner_detects_node_framework(tmp_path: Path) -> None:
    ws = tmp_path / "node_repo"
    ws.mkdir()
    (ws / "package.json").write_text('{"name": "app"}', encoding="utf-8")
    (ws / "pnpm-lock.yaml").write_text("", encoding="utf-8")

    scanner = EnvironmentScanner(ws)
    env = scanner.scan()

    assert env.has_tests is True
    assert "pnpm test" in env.test_commands
    assert "pnpm build" in env.build_commands


def test_workspace_manager_missing_secrets(temp_workspace: Path) -> None:
    wm = WorkspaceManager(base_dir=temp_workspace.parent)
    profile = wm.prepare_workspace(temp_workspace)

    missing = wm.get_missing_secrets(profile, provided_secrets={"API_KEY": "secret123"})
    missing_names = [v.name for v in missing]

    assert "DATABASE_URL" in missing_names
    assert "API_KEY" not in missing_names


def test_workspace_manager_get_execution_environment(temp_workspace: Path) -> None:
    wm = WorkspaceManager(base_dir=temp_workspace.parent)
    profile = wm.prepare_workspace(temp_workspace)

    exec_env = wm.get_execution_environment(
        profile, secrets={"DATABASE_URL": "postgres://prod:5432/db", "API_KEY": "key123"}
    )

    assert exec_env["DATABASE_URL"] == "postgres://prod:5432/db"
    assert exec_env["API_KEY"] == "key123"
    assert exec_env["PORT"] == "8080"


@patch("subprocess.run")
def test_workspace_manager_create_workspace_success(mock_run: MagicMock, tmp_path: Path) -> None:
    mock_run.return_value = MagicMock(returncode=0, stderr="")
    base_dir = tmp_path / "workspaces"

    wm = WorkspaceManager(base_dir=base_dir)

    # Pre-create directory so scanner doesn't fail on missing clone dir
    with patch.object(EnvironmentScanner, "scan") as mock_scan:
        mock_scan.return_value = DiscoveredEnvironment()
        profile = wm.create_workspace("https://github.com/org/repo.git", workspace_id="ws1")

    assert profile.workspace_id == "ws1"
    assert profile.repo_url == "https://github.com/org/repo.git"
    mock_run.assert_called_once()
