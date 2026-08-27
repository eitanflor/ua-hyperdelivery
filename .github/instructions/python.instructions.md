---
applyTo: "src/**/*.py"
---

# Application code

Conventions in full: [AGENTS.md](../../AGENTS.md).

- Absolute imports from the `src/` root (`from core.domain.project import Project`).
  Relative imports are banned by lint.
- Dependencies point inwards. `core/` imports nothing else in `src/`. `api/`,
  `agent_runtime/` and `orchestration/` are entrypoints - nothing imports them.
- Keep the layers apart: a generic client with no policy in `providers/` or
  `mcp_clients/`; the per-agent least-privilege wrapper in `tools/`.
- Every parameter and return annotated; `pyright` strict must stay clean.
- Google-convention docstrings on public modules, classes and functions.
- Assign exception messages to a variable before raising.
- `logging` with `%s` placeholders, never `print`, never f-strings in log calls. Artifact
  contents go at `DEBUG`.
- No literal agent names, station names or DynamoDB key prefixes - use
  `core.constants.AgentName`, `core.domain.project.Station`,
  `infrastructure.repositories.keys`.
- Secrets come from `Settings` or the boto3 credential chain. Never a literal.
- Every class that touches AWS takes an optional client parameter so tests can inject a
  double. Keep that seam when you add one.
- A `@tool` docstring is the prompt the model reads. Write it for the model: say when to
  call it and what it guarantees.
- A tool that needs configuration returns `None` when it is absent, so the agent degrades
  rather than crashing.
