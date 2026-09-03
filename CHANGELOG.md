# Changelog

Notable changes to the Hyperdelivery factory line. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Add your entry under `Unreleased` as part of the change, not afterwards - see the
Definition of Done in [AGENTS.md](AGENTS.md).

## [Unreleased]

### Added

- `infra/stacks/storage_stack.py`: DynamoDB table and a dedicated, versioned, CDK-managed
  S3 documents bucket now live in their own stack, injected into
  `OrchestrationStack`/`ConsoleApiStack` as cross-stack references. Read access for the
  AgentCore Runtime execution role is granted via an S3 bucket policy (not an IAM identity
  policy - `AWSPowerUserAccess` excludes `iam:*`), scoped to the `documents/` and `fsds/`
  prefixes (Distill's inputs and its historical-FSD reference lookups, respectively).
- `infra/stacks/naming.py`: single source of truth for the AWS region (`us-east-1`) and
  env-suffixed resource naming (`resource_name(env, resource)`), driven by CDK context
  (`-c env=`, default `dev`).
- `gsi2-all-projects-by-updated` GSI on the projects table - `list_projects` is now a
  single-partition Query instead of a full table Scan.
- Artifact versioning: `save_artifact` writes an immutable `ARTIFACT_VERSION#<agent>#v<NNNN>`
  history item alongside the latest `ARTIFACT#<agent>` alias. New
  `ProjectRepository.list_artifact_versions`.
- Review can hand its own blocker/major findings off to GitHub Copilot's coding agent
  (`assign_copilot_to_issue`, validated by `validate_copilot_assignments`), only when
  explicitly asked - same GitHub connector as Blueprint's, now living on Review instead
  of a dedicated Handoff agent. Assignments render in the console UI's `ReviewView` as
  a "Copilot assignments" section with an assigned/failed badge and a clickable link to
  the actual GitHub issue. See docs/decisions.md.
- Blueprint's GitHub connector (`tools/github.py`, `mcp_clients/github.py`, gated on
  `GITHUB_PAT`): repo scaffolding and one issue per unit of work, via GitHub's official
  remote MCP server (`api.githubcopilot.com`) - no local binary/Docker to run. Curated
  tool allow-list deliberately excludes merge/delete - see docs/decisions.md.
- `GET /projects` (list every project, most recently updated first) and
  `ProjectRepository.list_projects()`, backing a new `/portfolio` route in the console UI -
  a dashboard of every project's station, progress and last-updated time, reachable from a
  new icon in the top bar.
- `AGENTS.md` as the single source of truth for repository conventions, with
  `.github/copilot-instructions.md` and path-scoped `.github/instructions/*` pointing at it.
- Semantic search over historical FSDs: `providers/storage/embeddings.py` (Bedrock Titan
  Text Embeddings V2), a new `s3_find_similar_reference_documents` tool ranking FSDs by
  similarity to a plain-language query against a precomputed index, and
  `scripts/build_fsd_index.py` (`make build-fsd-index`) to build/refresh that index. See
  docs/decisions.md.

### Changed

- `src/config/agents/distill.yaml`: Scout now always calls `s3_list_reference_documents`
  before writing a new `StructuredSpec`, and skims any plausibly related historical FSD -
  previously this only happened when a request explicitly asked to reference a past FSD.
  It now also prefers `s3_find_similar_reference_documents` for this, falling back to
  `s3_list_reference_documents` only if the semantic index is empty/stale.
- `sync-docs` skill: a documentation review that runs as a step of every change.
- `scripts/precheck.sh` - one red/green gate for format, lint, types, tests, infra, secret
  scanning and spelling. CI runs the same script, so local and CI cannot drift.
- `make check`, `make check-fix`, `make format`, `make typecheck`, `make coverage`,
  `make hooks`.
- `ProjectRepository.save_artifact` looks up the latest existing version with a single
  reverse-order, `Limit=1` Query instead of reading every version item and taking the max -
  an O(1) targeted read instead of O(n) in the number of existing versions.
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
- `core.domain.project.CompletenessScore` (moved from `core.domain.spec`) is now a field
  on `Blueprint`, `ReviewReport` and `DemoPackage` too, not just `StructuredSpec` - every
  station can report `gaps` when its required upstream input (approved spec content, a
  Jira reference, a description of the build) was not actually given, instead of
  fabricating a plausible-looking artifact. `tools.blueprint.score_blueprint_completeness`,
  `tools.review.score_review_completeness` and `tools.showroom.score_showroom_completeness`
  are the deterministic scorers each agent calls before finalizing, mirroring
  `tools.distill.score_completeness`. `_has_open_gaps` (`api/routers/projects.py`) already
  read this field generically, so Blueprint/Review/Showroom now hold at their own chat
  instead of showing the next sign-off gate whenever they are blocked.
- `tools.distill.validate_structured_spec`: Distill's referential-integrity check (the
  other three agents already each had one), catching a duplicate requirement/gate
  criterion id, a rule referencing an unknown gate criterion, or an evidence link
  referencing an unknown requirement - Distill now calls it before `score_completeness`
  the same way Blueprint/Review/Showroom call their own `validate_*` tool first.
- Distill's system prompt now covers the case where the prompt already gives discrete,
  itemized requirements directly instead of narrative FSD prose to extract them from -
  it uses each requirement's own stated text as its evidence rather than fabricating a
  citation to a source document that was never given.
- Tool-call streaming: `agent_runtime.factory`'s SSE stream now emits
  `{"tool_call": {"id", "name", "status", "result"}}` events (`status` is `"running"`
  when a call starts and `"done"` with its decoded result when it finishes, keyed by
  tool use id so a retried call gets its own pair) instead of a one-line "Using X..."
  text chunk announced once per tool name. `advance_project_stream` and
  `LocalAgentClient.stream` forward these through unchanged. Console UI: each streaming
  turn shows its tool calls live - greyed out with a spinner while running, then a
  minimized row a reader can expand to see the raw result, so the chat reply itself
  stays uncluttered.
- `snowflake_query` tool for Distill (`tools/snowflake.py`, `providers/storage/snowflake.py`):
  when a prompt references Snowflake data instead of raw FSD text, Distill asks Snowflake's
  own hosted Cortex Agent (`/api/v2/cortex/agent:run`, `code_toolset_all`) a plain-language
  question and mines the returned text for requirements. This repo carries no SQL-building,
  result-polling or table-discovery logic of its own - the Cortex Agent decides what to run
  and returns the answer as text. Configured via `SNOWFLAKE_ACCOUNT` and `SNOWFLAKE_PAT`
  (PAT auth); `SNOWFLAKE_DATABASE`/`SNOWFLAKE_SCHEMA` are optional scoping hints, not
  requirements - left unset, the agent explores the whole account on its own. See
  `docs/decisions.md` for why this replaced an earlier hand-built SQL REST API tool.

### Changed

- Every AWS resource (state machine, DynamoDB, S3, both Lambdas, the console API) now
  lives in a single region, `us-east-1` - the prior `ap-southeast-2` orchestration /
  `us-east-1` Bedrock split is gone. `Settings.orchestration_region` is removed;
  `aws_region` covers every AWS call. See docs/decisions.md.
- Console UI: approving a gate now fires the next station's agent automatically
  (`useProjectsStore.decide`), instead of leaving the project sitting at the new station
  until someone happened to type into its composer - matches what the state machine does
  on its own once deployed (`docs/console-redesign.md`: "when a decision commits, the
  line visibly advances and the next agent takes the station").
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

- Rejecting a gate ("Send back") recorded the comment in the audit trail but never
  actually sent the project back to the agent - `record_decision` left `station` set to
  the gate itself instead of the agent under review, so the reviewer's reason never
  reached the LLM. Added `prior_station()` and wired the console's auto-advance to fire
  on rejection too, feeding the comment back as the agent's next prompt.
- `advance_project`/`advance_project_stream` (the local-dev orchestration bypass) never
  handed a station's predecessor artifact to the next agent - only a short instruction
  like "Blueprint may begin.", so Blueprint/Review/Showroom always opened with no spec to
  work from and correctly reported themselves blocked. `_build_prompt` now prepends each
  station's named predecessor artifacts (e.g. Blueprint gets Distill's `StructuredSpec`,
  Review gets both). The real state machine handoff (ADVA-3015) still needs the same fix.
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
- `tools.distill.score_completeness` returned `{"score": 0.0, "gaps": []}` when no
  requirements or gate criteria were extracted at all - an empty `gaps` list reads as "no
  open gaps" to `_has_open_gaps`, so a blank/unreadable FSD advanced straight past G1
  instead of holding at Distill's chat. It now returns an explicit gap in that case.
- Tool-call streaming never reached "done": `agent_runtime.factory` read a
  `"tool_result"` key off `agent.stream_async()`'s events, but Strands' `ToolResultEvent`
  opts out of that stream entirely (`is_callback_event` is `False`) - it is never yielded
  there, only observable via the hooks system. Console UI showed every tool call stuck
  in its greyed-out "running" state forever. Now registers
  `agent.hooks.add_callback(AfterToolCallEvent, ...)` once per agent and drains the
  results it captures into the SSE stream instead.
- Live testing surfaced two Snowflake bugs from an incorrect assumed event schema and an
  undersized timeout: `providers.storage.snowflake.run_agent` parsed the Cortex Agent's
  SSE body as `{"delta": {"type": ...}}` per `data:` line, but the real framing is
  separate `event: <type>` / `data: {...}` line pairs (fixed by tracking the preceding
  `event:` line and only parsing `response.text` payloads), and a literal `data: [DONE]`
  sentinel isn't JSON at all and crashed `json.loads`. Separately,
  `orchestration.local_agent_client.LocalAgentClient`'s hardcoded `timeout=120` (proxying
  a local dev agent's `/invocations` call) was shorter than
  `providers.storage.snowflake`'s own 120s httpx timeout plus FastAPI/Strands overhead -
  a real single-table Cortex Agent query took ~117s end-to-end and tripped the local
  proxy's read timeout before the response could arrive. Both timeouts raised: the
  Snowflake provider's to 240s, the local proxy's to 300s.
