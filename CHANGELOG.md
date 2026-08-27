# Changelog

Notable changes to the Hyperdelivery factory line. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Add your entry under `Unreleased` as part of the change, not afterwards - see the
Definition of Done in [AGENTS.md](AGENTS.md).

## [Unreleased]

### Added

- `AGENTS.md` as the single source of truth for repository conventions, with
  `.github/copilot-instructions.md` and path-scoped `.github/instructions/*` pointing at it.
- `sync-docs` skill: a documentation review that runs as a step of every change.
- `scripts/precheck.sh` - one red/green gate for format, lint, types, tests, infra, secret
  scanning and spelling. CI runs the same script, so local and CI cannot drift.
- `make check`, `make check-fix`, `make format`, `make typecheck`, `make coverage`,
  `make hooks`.
- `cspell.json` spelling gate, whose `flagWords` list also enforces US English by failing
  British spellings with the American form as the suggested fix.
- Pre-commit hooks: ruff, ruff-format, gitleaks, cspell, and the standard file hygiene set.
- `pyright` in strict mode, and `pytest-cov` with coverage reported in CI.
- Tests for `agent_runtime.factory` (previously untested despite backing all four agents),
  `Settings`, and the observability setup.
- `tests/unit/test_docs_consistency.py` - fails the build when `.env.example` drifts from
  `Settings`, or when an agent lacks a config file or a runtime entrypoint.
- `tests/conftest.py` and `tests/fakes.py`: shared typed test doubles and an autouse
  fixture that clears the `get_settings` cache between tests.
- `core/constants.py` (`AgentName`) and `infrastructure/repositories/keys.py` (single-table
  key layout), replacing literals duplicated across modules.
- `CONTRIBUTING.md`, `SECURITY.md`, this changelog, `.editorconfig` and shared VS Code
  settings.

### Changed

- Ruff expanded from five rule families to the full set, including docstring and annotation
  enforcement, with `ruff format` now checked in CI.
- Every module, class and public function in `src/`, `ui/` and `infra/stacks/` now carries a
  Google-convention docstring.
- Injected AWS clients are typed with `boto3-stubs` instead of `Any`.
- `Station` order is derived from the enum rather than a parallel list that could disagree
  with it.
- Agent YAML is validated with `model_validate` instead of keyword unpacking.
- CI: least-privilege `permissions`, concurrency cancellation, infra tests included,
  a markdown coverage table rendered into the job summary, and `coverage.xml` uploaded as
  an artifact.
- `.env.example` now documents every `Settings` field, including the Phase 2 orchestration
  variables that were missing.
- `README.md` status and structure sections corrected - they still described the repository
  as having no control plane after Step Functions, the console API and the SDK had shipped.

### Fixed

- Settings leaked between tests through the `get_settings` `lru_cache`.
- `starlette` 1.6 deprecates `httpx` in its test client; added the `httpx2` dev dependency
  it expects.
