"""Scans a workspace directory for its required environment variables and build/test tooling."""

from pathlib import Path

from core.domain.workspace import DiscoveredEnvironment, DiscoveredEnvVar

_ENV_EXAMPLE_FILENAME = ".env.example"
_NODE_LOCKFILES = {
    "pnpm-lock.yaml": "pnpm",
    "package-lock.json": "npm",
    "yarn.lock": "yarn",
}
# Substrings that mark an env var as secret-shaped rather than plain configuration -
# checked against the uppercased name (e.g. DATABASE_URL, API_KEY; not PORT).
_SECRET_MARKERS = (
    "KEY",
    "SECRET",
    "TOKEN",
    "PASSWORD",
    "PWD",
    "CREDENTIAL",
    "URL",
    "DSN",
    "PRIVATE",
)


class EnvironmentScanner:
    """Reads `.env.example`, `Dockerfile` and package manifests to describe how to run a repo."""

    def __init__(self, path: Path) -> None:
        """`path` is the repo root to scan; it is read, never modified."""
        self._path = path

    def scan(self) -> DiscoveredEnvironment:
        """Returns the discovered required vars and build/test tooling for this workspace."""
        has_tests = False
        test_commands: list[str] = []
        build_commands: list[str] = []

        if (self._path / "pyproject.toml").exists():
            build_commands.append("uv sync")
            if (self._path / "tests").exists():
                has_tests = True
                test_commands.append("pytest")

        if (self._path / "package.json").exists():
            package_manager = "npm"
            for lockfile, manager in _NODE_LOCKFILES.items():
                if (self._path / lockfile).exists():
                    package_manager = manager
                    break
            has_tests = True
            test_commands.append(f"{package_manager} test")
            build_commands.append(f"{package_manager} build")

        return DiscoveredEnvironment(
            required_vars=self._scan_env_example(),
            has_docker=(self._path / "Dockerfile").exists(),
            has_tests=has_tests,
            test_commands=test_commands,
            build_commands=build_commands,
        )

    def _scan_env_example(self) -> list[DiscoveredEnvVar]:
        env_file = self._path / _ENV_EXAMPLE_FILENAME
        if not env_file.exists():
            return []

        variables: list[DiscoveredEnvVar] = []
        for raw_line in env_file.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            name, _, value = line.partition("=")
            name = name.strip()
            value = value.strip()
            variables.append(
                DiscoveredEnvVar(
                    name=name,
                    default_value=value or None,
                    is_secret=any(marker in name.upper() for marker in _SECRET_MARKERS),
                    source_file=_ENV_EXAMPLE_FILENAME,
                )
            )
        return variables
