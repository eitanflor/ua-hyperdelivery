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
- `ui/console/`: a React + Vite + TypeScript console UI - the real client for the console
  API. Landing-page chatbox that names a new project via Claude Haiku
  (`orchestration/project_namer.py`); sidebar with search, inline rename, delete; a
  pipeline stepper showing D/B/R/S progress with an amber pulse while a gate decision is
  pending; live SSE-streamed agent turns (tool-use chunks, not just the final result);
  gate-decision approval; a global error toast.
- Entra ID (Azure AD) SSO, gating every `/projects/*` route: `api/auth.py` validates the
  bearer ID token's signature/audience/issuer against Entra's JWKS
  (`entra_tenant_id`/`entra_client_id` `Settings` fields); the console UI signs in via
  MSAL (`@azure/msal-browser`/`@azure/msal-react`) against the same app registration and
  attaches the token to every request, including the `/advance/stream` SSE POST.
- `truststore` dependency: `api/auth.py`'s JWKS fetch now verifies against the OS trust
  store, so token validation works behind TLS-inspecting corporate networks where certifi
  does not carry the intercepting root CA.
- `PATCH /projects/{id}` (rename) and `DELETE /projects/{id}` (delete, cascading to
  artifacts and decision history) endpoints, plus `ProjectRepository.rename_project`/
  `delete_project`.
- `POST /projects/{id}/advance/stream`: SSE variant of `advance_project` that streams
  the agent's output as it's produced (`orchestration/local_agent_client.py`'s `stream`,
  `agent_runtime/factory.py`'s `agent_invocation` as an async generator) instead of
  blocking until the whole turn finishes.
- Sixteen vendored third-party skills under `.github/skills/`: six frontend design skills
  from `leonxlnx/taste-skill`, all nine product-design skills from `jamiemill/layers-skills`,
  and the prose half of `pbakaus/impeccable`. Provenance, upstream commits, licenses and
  the modifications made are recorded in `.github/skills/THIRD_PARTY_NOTICES.md`.

### Changed

- `ui/console/` rebuilt against the audit in
  [docs/console-redesign.md](docs/console-redesign.md):
  - **Theming**: a semantic token layer (surface / fg / line / accent / status / agent)
    replaces the eight raw brand colors, with light as the default and dark as an authored
    sibling palette. Resolves the `body`-is-dark / `App`-is-light conflict that caused most
    contrast failures. Both themes verified in-browser at 0 failures against WCAG AA.
  - **Type**: self-hosted Geist + Geist Mono replace the render-blocking Google Fonts
    `<link>` to Inter. Fixed rem scale, 12px floor (was 9px).
  - **Shell**: the delivery line is now the primary navigation object in a persistent top
    bar, the signed-in user moved to the top right with a theme switcher, projects are
    grouped by **Needs you** / Active / Done, and `⌘K` opens a command palette. Panels
    collapse, and the reading column holds its measure on a 13" laptop.
  - **Gates**: the gate shows the criteria being signed against and the open gaps, takes
    the signer from the Entra ID token instead of a free-text field, requires a reason when
    sending work back, and keeps every decision undoable for 12 seconds. A cleared gate is
    now the strongest element in the thread rather than the quietest.
  - **Artifacts**: typed renderers per agent - spec, plan, findings sorted by severity with
    coverage, and demo package - replacing one generic field walk for all four.
  - **Agents**: each of the four has an authored face and identity hue, and every turn is
    stamped with the agent that produced it. The conversation stays continuous.
  - **The crew**: the agents are now named for the job a person holds rather than for what
    the code does - `distill` is **Scout** (hands over a scouting report), `blueprint` is
    **Coach** (a call sheet), `review` is **Ref** (a grade sheet), `showroom` is **Host**
    (a run of show). The station is the place and the agent is the person working it, so
    the line reads Combine, Gate 1, Playbook, Gate 2, Film Room, Gameday, and a finished
    project is "off the line". Display layer only: the wire ids, `Station`, `AgentName` and
    the API contract are unchanged.
  - **Visual signature**: station numbering (`ST 01`) in mono, the Under Armour italic
    uppercase lockup on station and gate names, and a single hazard stripe on the gate
    header. Agent eyes blink only while that agent is working.
  - **Accessibility**: `prefers-reduced-motion` honored, `aria-live` on the streamed reply,
    `role="alert"` on errors, a single `:focus-visible` treatment, real `<label>`s on every
    input, `aria-current` on the selected project, and `window.confirm` replaced with a
    focus-trapped dialog.
  - **Resilience**: errors now diagnose, explain and offer recovery instead of surfacing raw
    API strings; runs can be stopped mid-stream and retried; streamed tokens are batched
    rather than rewriting the conversation map per token.
  - **Routing**: `/projects/:id` deep links replace in-memory selection, so a project
    awaiting a decision can be linked to the person who has to sign it.
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
- `README.md`/`docs/architecture.md` corrected again - they described the console as a
  future front end after `ui/console/` had already shipped, and didn't mention the new
  Entra ID auth layer at all.
- Console UI sidebar: merged the separate "needs a decision" section into the single
  project list as a gate badge (G1/G2), decluttered the double-signaling between badge
  color and a colored left border, and gave the selected row a distinct neutral
  indicator instead of relying on a faint background tint alone.
- `cspell.json` now excludes each vendored skill folder - `layers-skills` is written in
  British English and would otherwise fail the `flagWords` gate. The exclusions name each
  folder rather than `.github/skills/**`, so `log-decision` and `sync-docs` stay checked.

### Fixed

- Settings leaked between tests through the `get_settings` `lru_cache`.
- `starlette` 1.6 deprecates `httpx` in its test client; added the `httpx2` dev dependency
  it expects.
- `advance_project_stream`'s exception handling only wrapped the agent-stream loop, not
  the subsequent artifact-save/station-advance calls - an exception there (e.g. an
  expired AWS session) crashed the SSE generator uncaught after the response had already
  started streaming, so the client saw a raw connection failure instead of a clean
  `{"error": ...}` event.
- Console UI chat turns were matched by object reference (`t === streamingTurn`) for
  streaming-placeholder replacement and retry cleanup; `appendChunk` replaces the turn
  with a new object on every chunk, so reference equality broke the moment one chunk had
  arrived before an error, leaving a permanently "stuck" partial bubble. `ChatTurn` now
  carries a stable `id`, used for both cleanup and React's list keys (was array index).
