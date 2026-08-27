# AGENTS.md

Working agreement for this repository, for humans and coding agents alike. This is the
single source of truth; `.github/copilot-instructions.md` and `.github/instructions/*`
point here rather than restating it.

Hyperdelivery is the factory line, not the cars. Everything here exists to move a project
from intake to a demonstrable deliverable through four gated stations, with a human
approving each handoff. Code that makes a station faster is in scope. Code that quietly
removes a human decision is not.

## The one rule that catches people out

**Every change ends with a documentation review.** Not "if you remember" - it is the last
step of the Definition of Done below. This repo has already drifted once: the README
claimed there was no control plane months after Step Functions, the console API and the
SDK all shipped. Stale docs are worse than absent ones, because people trust them.

## Getting green

```bash
uv sync --all-groups
cp .env.example .env
make hooks        # install pre-commit hooks, once
make check        # the gate: format, lint, types, tests, infra, secrets, spelling
make check-fix    # same, but auto-fixes the mechanical failures first
```

`make check` runs [scripts/precheck.sh](scripts/precheck.sh), which is exactly what CI
runs. If it is green locally it is green in CI. Do not add a check to CI without adding it
to that script.

Behind a TLS-inspecting corporate proxy, `uv` needs `UV_SYSTEM_CERTS=1` - see
[CONTRIBUTING.md](CONTRIBUTING.md).

## Layout, and why it is shaped this way

```
src/
├── agent_runtime/    # one composition root per agent + the shared factory
├── core/             # framework-free: domain models, shared names. Depends on nothing.
├── config/           # declarative agent YAML + environment settings
├── providers/        # adapters onto third-party SDKs, no per-agent policy
├── mcp_clients/      # generic MCP client builders, no per-agent policy
├── tools/            # per-agent @tool functions: the least-privilege policy layer
├── infrastructure/   # AWS adapters: persistence, messaging, observability
├── orchestration/    # Step Functions Lambda tasks
├── api/              # console API (FastAPI), the human surface
└── sdk/python/       # client for the console API - the UI and CLI use this, not raw HTTP
```

Dependencies point inwards: `core` imports nothing from the rest, everything may import
`core`. `api`, `agent_runtime` and `orchestration` are entrypoints - nothing imports them.

**The provider/tool split is the important one.** A generic client that knows how to talk
to a system lives in `providers/` or `mcp_clients/` and carries no policy. The per-agent
wrapper that decides *what this agent is allowed to do with it* lives in `tools/`. That is
why Distill gets read-only Confluence and Blueprint gets Jira issue-lifecycle from the same
builder. Do not collapse these two layers.

**Imports are absolute from the `src/` root** (`from core.domain.project import Project`),
because `src/` is on the path via `pythonpath`, not installed as a package. Relative
imports are banned by lint. This also means `ui/` cannot import from `src/` - `streamlit
run` does not put `src/` on the path - so the Streamlit harness deliberately duplicates a
small amount of config. If that duplication grows, that is the signal to make `src/` a real
installable package.

## Conventions

**Types.** Every parameter and return annotated. `pyright` runs in strict mode and must be
clean. Where a third-party library's own stubs are the problem, the relaxation goes in
`pyproject.toml` with a comment naming the specific upstream cause - not a scattering of
`# type: ignore`.

**Docstrings.** Google convention, enforced by ruff's `D` rules. Say why something exists
or what a caller needs to know. Do not restate the signature.

**Comments.** One line, and only for what the code cannot say itself: a constraint, a
non-obvious tradeoff, a link to the decision. Never narrate the next line.

**Errors.** Assign the message to a variable before raising (ruff `EM`). Catch specific
exceptions. The one broad `except Exception` lives in `agent_runtime/factory.py` and is
deliberate: a model call can fail in unbounded ways and must not take the HTTP server down.

**Logging, never `print`.** `logging.getLogger(...)` with `%s` placeholders, not f-strings.
Artifact contents go at `DEBUG` - specs and blueprints can be large and are not always safe
to emit at `INFO`.

**Secrets.** Environment variables via `Settings`, or the boto3 default credential chain.
Never a literal. Never a token in a log line.

**Names.** Agent names come from `core.constants.AgentName`, station names from
`core.domain.project.Station`, DynamoDB keys from `infrastructure.repositories.keys`. If
you find yourself typing `"distill"` or `"PROJECT#"` as a literal, use the constant.

**Prose.** US English. `cspell.json` enforces it: every entry in its `flagWords` list fails
the gate with the American form as the suggested fix. New domain terms go in its `words`
list - if a real word is missing, add it there rather than rewording around it.

## How to make common changes

**Add an agent.** Add the value to `AgentName`; add `src/config/agents/<name>.yaml`; add
`src/agent_runtime/<name>/main.py` calling `create_app(AgentName.X, <OutputModel>, tools=[...])`;
add the output model under `core/domain/`. `tests/unit/test_docs_consistency.py` will fail
until the config and the entrypoint both exist, which is the point.

**Add a tool.** Generic client in `providers/` or `mcp_clients/`. Per-agent `@tool` wrapper
in `tools/`, returning `None` when its configuration is absent so the agent degrades
instead of crashing. The docstring is the prompt the model reads - write it for the model.

**Add a setting.** Field on `Settings`, and the matching entry in `.env.example` with a
comment saying when it is needed. The docs-drift test enforces the pair.

**Change the DynamoDB schema.** `infrastructure/repositories/keys.py` and
`infra/stacks/orchestration_stack.py` both own it. Change them together.

## Testing

Unit tests, no network, no real AWS. Inject a double at the seam - every AWS-touching class
takes an optional client parameter for exactly this. Shared doubles live in
[tests/fakes.py](tests/fakes.py); add to those rather than writing a fifth fake table.

Test names are the documentation, so `D` rules are off in `tests/` - but annotations are
not. Assert on behavior, not on how many times a mock was called.

`tests/conftest.py` clears the `get_settings` cache around every test. Do not remove it:
without it the first test to read settings pins them for the whole session.

Coverage is reported and currently sits around 90%. The CI floor is deliberately low (10%)
so it is a ratchet, not a target to game - raise it as the suite matures. `make coverage`
opens a browsable line-by-line report; `coverage.xml` exists for tooling, not for reading.

## Definition of Done

1. `make check` is green.
2. New behavior has a test that fails without the change.
3. Public functions, classes and modules have docstrings.
4. No new literal that belongs in a constant, and no new secret anywhere.
5. **Documentation review** - walk this list and update whatever the change invalidated:
   - `README.md` - especially the "Status" section and the `src/` tree
   - `docs/architecture.md` - if a component, integration or data flow moved
   - `.env.example` - if `Settings` gained or lost a field
   - `AGENTS.md` (this file) - if a convention or workflow changed
   - `CHANGELOG.md` - under `Unreleased`
   - `docs/decisions.md` - if you chose between real alternatives, log it with the
     [`log-decision`](.github/skills/log-decision/SKILL.md) skill
6. If you *considered* an alternative and rejected it, that is a decision. Log it. A repo
   that records why is one people can change safely.

## What not to do

- Do not add a dependency without saying why in the PR and logging it as a decision.
- Do not weaken a lint rule or a pyright setting to make your change pass. Fix the code, or
  narrow the exception to the line and explain it.
- Do not add `# noqa` or `# pyright: ignore` without a reason on the same line.
- Do not build speculative infrastructure. `providers/agents/strands_factory.py` has no
  memory or gateway wiring because no use case has needed it yet. Keep it that way until
  one does.
- Do not remove or bypass a human approval gate. The gates are the product.
