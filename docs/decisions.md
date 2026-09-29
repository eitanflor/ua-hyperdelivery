# Architecture & Tradeoff Decisions

Append-only log. One entry per decision, most recent first. Entries below dated 2026-08-26
were backfilled during that session from earlier work in the repo history - the date marks
when they were logged, not necessarily when the underlying change originally landed.

Template for new entries:

```markdown
## YYYY-MM-DD - <short title>
- **Status**: Accepted | Superseded by <link>
- **Context**: what problem/constraint forced a choice
- **Decision**: what was chosen
- **Alternatives considered**: what else was on the table, and why they lost
- **Consequences**: what this makes easier/harder, what to revisit and when
```

---

## 2026-09-29 - API errors carry a stable code beside the unchanged message
- **Status**: Accepted
- **Context**: The API raised 48 `HTTPException`s with free-text `detail`, so a client could only
  branch on the HTTP status. A 409 meant both "someone moved this project on" and "GITHUB_PAT is
  not configured", and the console showed the first message for both. `project not found` was
  typed 14 times.
- **Decision**: Every failure is `ApiError(ErrorCode.X)`. `core.errors.ErrorCode` names the
  reason; `api/errors.py` holds a catalog of each code's status and default message, so one code
  can never answer with two statuses, and one handler writes `{"detail", "code"}`. `detail` keeps
  its old meaning, so a client that ignores `code` behaves as before. The console mirrors the
  list in `api/errorCodes.ts` (drift test) and words each code in `lib/errors.ts`, falling back to
  the status for anything without one. The routers declare `ErrorResponse` in OpenAPI.
- **Alternatives considered**: `detail: {code, message}` - breaks every reader of `detail`, the
  console's parser and the tests. Codes in a response header - invisible to a browser reading the
  body, and nothing else needs it. One exception class per error - about 27 classes for what is a
  table lookup.
- **Consequences**: A new failure is one enum value, one catalog line, one mirrored string and
  the console's wording; forgetting a piece fails a test. Agent failures follow the same idea
  with their own `TurnErrorCode` (a timeout, an output limit, a run that produced nothing,
  a save that failed after the agent finished): it rides beside `error` on the stream event,
  is kept on the turn record as `error_code`, and the console words it (older records and a
  stopped turn have none). The Python SDK raises `HyperdeliveryError`, still an
  `httpx.HTTPStatusError`, carrying `code`. They are a separate enum because they are not
  HTTP responses and have no status.

---

## 2026-09-29 - Shared constants have one owner, single-use ones stay private
- **Status**: Accepted
- **Context**: The stream protocol (event keys, tool statuses, the stopped marker) existed only
  as string literals repeated across six backend files and the console, so adding the `failed`
  status meant hand-editing each. The GitHub REST clients each defined the same API root,
  timeout and error threshold, and the review severities were defined in three places.
- **Decision**: `core.constants` gains `StreamEvent`, `ToolStatus` and `TURN_STOPPED`, used
  wherever an event is built or read; the console mirrors them in `api/protocol.ts` and a test
  fails if the two lists differ. GitHub's shared values live in `providers/github/http.py`, and
  severities in `core.domain.review`. AGENTS.md states the rule: two or more users means a
  shared home, one user means a private constant beside it.
- **Alternatives considered**: One global constants file - it becomes a dumping ground and
  separates every timeout from the code it tunes. Generating the console's list from the Python
  enum - a build step for eight strings; a drift test costs less. Merging the per-gate
  "no spec" messages - they look alike but say different things for each gate, so they are not
  duplicates.
- **Consequences**: Adding an event or status is one edit plus the mirrored list, and the test
  catches a missed side. Snowflake keeps its own 400 threshold, since it shares nothing else
  with the GitHub clients. Error codes for the API's failures are a separate, contract-changing
  step.

## 2026-09-29 - Agent turns are recorded server-side, not in the browser
- **Status**: Accepted
- **Context**: The console kept a turn's tool calls only in the browser that watched it, and
  `localStorage` is small (about 5 MB), per browser and readable by any script on the origin.
  So the trace, the sources and any failed or writing call vanished on reload and were never
  visible to an approver on another machine - the people who most need to check the work.
- **Decision**: The API records one `TURN#<start time>#<agent>` item per finished turn under
  the project's partition (agent, text, tool calls, usage, duration, and the error if it
  failed or was stopped), from both the local stream and the deployed invoker, and serves them
  at `GET /projects/{id}/turns`. Tool results are clipped to 1,500 characters and a turn to 60
  calls. A failed save is logged and dropped, never raised into the run. The console loads the
  record and no longer stores any of the trace in `localStorage`.
- **Update 2026-09-30**: The record also carries the person's message, so the whole
  conversation, not only the trace, is server-side. A deployed create or answer, which has no
  streamed reply to hang the message on, is recorded as a message-only turn. The console
  rebuilds the thread from the records (`conversationFromRecords`) and persists only the
  recent-projects list and detail level; the conversation, signatures and the
  quota-eviction fallback for `localStorage` are gone, and the persisted-state version was
  bumped so old copies are ignored. Turns from before this change have no message.
- **Update 2026-09-30 (freshness and ordering)**: A turn is saved only after what it produced,
  so a failed save shows on the record instead of beside a "successful" turn. The two paths
  differ in what that covers. The local stream saves the artifact and advances the station
  first, then the turn. The deployed invoker saves the artifact, then the turn, and returns;
  the station is advanced afterwards by the next Step Functions state, so a failure there is
  not on the turn record. A deployed run that
  finishes while nobody in the tab is waiting on it (a gate released the next agent) is picked
  up from the project socket's `done`/`error` event, not by polling: the console re-reads the
  project, documents, decisions and turns at 1.5s, 5s and 12s after it, because `done` is sent
  before those are saved. That is zero requests while nothing runs, and the retries are
  bounded per run. Rejected: polling while a deployed project sits at an agent station - it
  costs requests per open tab for as long as a run might happen, and still lags. A `settled`
  event sent after the whole state machine step would replace the retries, and is the cleaner
  follow-up if the delays prove visible.
- **Alternatives considered**: Keeping and extending `localStorage` - still per browser and
  capped, and it was the problem. Storing full results - a DynamoDB item is capped at 400 KB
  and a fetched file or query result would eat it. A separate table or S3 - the projects table
  is already single-table and a new sort-key prefix needs no table or index change, so more
  infrastructure bought nothing.
- **Consequences**: No infrastructure change, and `delete_project` already removes turns with
  everything else under the partition. A turn is only as good as what fits after clipping, so a
  large result reads as "not kept". Older browsers and older APIs fall back to what they have.
  Revisit if a project's turns approach the partition's size, or if approvers need the full
  results rather than a clipped copy.

## 2026-09-28 - Illustrations are optional drop-ins with designed fallbacks

- **Status**: Accepted
- **Context**: Phase 6 of `docs/design/roadmap.md` calls for about fifteen illustrations in
  two themes, which will be generated in outside tools (Higgsfield, Recraft, Midjourney) on
  their own schedule. The console should not wait for them, and adding one should not need
  an engineer.
- **Decision**: Every illustration is a named slot (`<Artwork id="..." />`) with a fallback
  drawn in code: the isometric line, the ASCII head, a halftone portrait, or nothing for
  small empty-state spots. `lib/artwork.ts` finds files named `<id>.<light|dark>.<ext>` in
  `ui/console/src/assets/illustrations/` with Vite's `import.meta.glob` at build time, so
  dropping a file in replaces the fallback, and a missing file costs nothing.
- **Alternatives considered**: *Probe `/public` at runtime* (try to load the image, fall
  back on error) - rejected: every slot costs a request and a flash of the fallback, even
  when no artwork exists, and missing-file 404s pile up in the console. *A manifest file
  listing the delivered assets* - rejected: one more thing to keep in step with the folder,
  and forgetting it silently hides a delivered file. *Wait for the artwork before building
  the surfaces* - rejected: blocks Phase 6 on outside tools and leaves the placeholders in
  place indefinitely.
- **Consequences**: A new file needs a dev-server restart or a rebuild to be picked up. The
  fallbacks are real designs, not placeholders, so the app is finished without the artwork.
  The id list in `lib/artwork.ts` and the table in `docs/design/asset-prompts.md` have to
  change together.

---

## 2026-09-28 - React Flow and dagre for the console's canvases

- **Status**: Accepted
- **Context**: Phase 5 of `docs/design/roadmap.md` makes the architecture and build order
  explorable. The existing diagram was hand-laid-out SVG with a hard cap of 12 components
  and no pan, zoom, selection or keyboard path (UX-13).
- **Decision**: Add `@xyflow/react` (React Flow 12, MIT) for pan, zoom, minimap, selection
  and custom nodes, and `@dagrejs/dagre` (MIT) for layered left-to-right layout. Both load
  in a lazy chunk (about 80 kB gzipped) only when a Design tab opens. The static SVG diagram
  and its layout helper are removed rather than kept for the inline view.
- **Alternatives considered**: `elkjs` - better edge routing and ports, but about 1.4 MB
  and asynchronous; blueprint-sized graphs do not need it, and dagre lays them out in a
  frame on the main thread. Extending the hand-rolled SVG - pan, zoom, minimap and keyboard
  navigation are exactly what React Flow already does well. Keeping the static diagram
  beside the canvas (as the canvas pattern suggested) - two renderers for one picture, and
  printing goes through the document export, not the diagram.
- **Consequences**: Nodes are ordinary React components on our tokens, so the canvas
  follows theme and detail level. Revisit ELK if a real blueprint's layout reads poorly or
  graphs grow past ~200 nodes. Canvas SVG/PNG export is not built; it would need an
  image-export dependency.

## 2026-09-28 - The signer comes from the token, and decisions are readable

- **Status**: Accepted
- **Context**: `POST /projects/{id}/decisions` recorded whatever `signer` string the body
  carried, so any signed-in caller could sign as anyone - on the one record the gates exist to
  produce. Decisions were also write-only, so a gate cleared in another browser showed
  "Signed before this session" (UX-14 in `docs/design/ux-audit-2026-09.md`).
- **Decision**: The endpoint records the authenticated caller - the token's email, or its
  object id when there is no email. `DecisionRequest` drops `signer`; one sent by an older
  client is ignored, not rejected. `GET /projects/{id}/decisions` returns the trail oldest
  first, and the console reads it for checkpoints and an Activity list.
- **Alternatives considered**: Keeping `signer` and rejecting a mismatch with the token -
  every client would have to know which claim the server compares, for no gain over
  ignoring it. Keeping `signer` on the SDK as a deprecated no-op parameter - a parameter that
  does nothing misleads the caller. Recording the object id always - stable, but unreadable
  in the trail; the email is what an auditor recognizes.
- **Consequences**: `HyperdeliveryClient.submit_decision` loses its `signer` parameter. A
  renamed user's old decisions keep the old email. Per-gate approvers (roadmap Phase 3) can
  now check against the same identity.

## 2026-09-28 - Sign-off stays a button until the usability test

- **Status**: Accepted
- **Context**: The roadmap's Phase 3 names hold-to-sign or slide-to-sign for the gate, and
  says to choose after a usability test. That test has not run, and nobody was available to
  choose.
- **Decision**: Keep the approve button. Build the rest of the gate card around it - what you
  are approving, criteria, what is missing, what happens next, the filling undo bar.
- **Alternatives considered**: Hold to sign - the simpler keyboard path (hold Space or
  Enter), but adding friction on a guess. Slide to sign - more ceremony, harder on touchpads
  and needing an arrow-key path. Either could be undone later, but only after people had
  learned it.
- **Consequences**: The deliberateness still comes from the criteria checklist and the
  twelve-second undo. Revisit after the moderated test in the Phase 3 exit criteria.

## 2026-09-28 - A Settings page for per-person preferences

- **Status**: Accepted
- **Context**: The Simple/Detailed switch sat in the header and a "Your role" list sat in the
  account menu. Feedback: the role does not belong in the dropdown, and per-user settings -
  including, later, tokens - need a page of their own, with the detail level exposed there.
- **Decision**: `/settings` holds detail level, theme and role, reached from the account menu
  and `⌘K`. The header switch and the dropdown role list are gone; theme is also still in
  the account menu. Everything on the page is stored in the browser and changes only what
  the person sees.
- **Alternatives considered**: Adding token fields now - nothing on the backend accepts a
  per-user token yet, and AGENTS.md rules out speculative wiring. The Phase 4 plan of
  settings inside the side panel - the feedback asked for a page.
- **Consequences**: A per-user token needs a server-side home before it can appear here; this
  page is browser-local by design, and a secret must not be kept in `localStorage`.

## 2026-09-28 - The workspace side panel is always there, and opens on Progress

- **Status**: Accepted
- **Context**: Feedback: too much empty space in the chat area and a poor split between the
  working area and the chat. The side panel stayed closed until a document existed, then
  took half the screen, and the chat column widened to fill whatever was left.
- **Decision**: On screens 1024px and wider the panel is open by default at a steady width
  (`clamp(22rem, 34vw, 38rem)`), and its first tab, Progress, shows every stage, what is
  happening now and what happens next. The chat keeps one 48rem measure whether or not the
  panel is open. `/start` becomes two columns, so it fits a laptop screen without scrolling.
- **Alternatives considered**: Keeping the half-screen panel - it only existed because a
  fixed-width panel that opened late left idle space beside the chat, and a panel that is
  always open fills that space. Letting the chat widen to fill - lines past about 75
  characters are harder to read, which is why the column had a measure in the first place.
- **Consequences**: Below 1024px the panel starts closed. Escape no longer closes it, because
  it is no longer a transient overlay. Phase 4's artifact-panel work starts from this layout.

## 2026-09-28 - Home at `/`, and a per-browser role that only shapes the view

- **Status**: Accepted
- **Context**: The console opened on a project-intake form for everyone, including people who
  came to approve or answer something, and "Needs you" counted every gate for every viewer
  (UX-05, UX-06 in `docs/design/ux-audit-2026-09.md`).
- **Decision**: `/` is Home: tiles for waiting for approval, questions waiting, in flight and
  recently shipped, ordered by a role picked on first visit. Intake moves to `/start`. The
  role (requester, approver, subject expert, analyst, developer, leadership) is stored in
  the browser (`usePreferences`), sets the default detail level, and grants nothing.
- **Alternatives considered**: Keeping the intake form at `/` and Home only for returning
  users - two front doors for one app, and a first visit from a gate link would still land on
  intake. Storing the role on the server - it would need a user-profile model and an endpoint
  for something that changes only the order of tiles. Inferring the role from Entra groups -
  no group mapping exists, and a wrong guess is worse than one question.
- **Consequences**: The role must be asked again in each browser. When gates get assigned
  approvers (roadmap Phase 3), "Waiting for approval" becomes personal and the role can move
  server-side if something starts to depend on it.

## 2026-09-28 - Simple by default, and agent colors that never match a status

- **Status**: Accepted
- **Context**: The console opened in the developer view, labeled "Developer / PM"; its PM
  view went silent while agents worked yet still showed raw JSON and token counts. Ref's and
  Host's identity colors were exactly the warning and success colors (UX-01-03, UX-11 in
  `docs/design/ux-audit-2026-09.md`).
- **Decision**: Rename the switch to Simple / Detailed and default to Simple. Keep the stored
  values (`pm`, `developer`) so existing choices survive. Simple narrates runs as grouped
  plain steps and hides JSON and tokens; Detailed is unchanged. Move Ref to violet
  (`#6b3fa0` / `#b995f0`) and Host to magenta (`#a3287f` / `#f07ac8`).
- **Alternatives considered**: Renaming the stored values to `simple` / `detailed` with a
  persist migration - cleaner code, but churn across six files for no user-visible gain.
  Copper for Host - it sat 16-20 degrees of hue from danger and warning, so it would still
  read as a status; magenta is 31 degrees from UA red and at least 51 from the rest.
- **Consequences**: New users see the outcome first; developers switch once and keep it.
  Defaulting from a role waits for Phase 1's first-run question. Illustration briefs use the
  new hues.

## 2026-09-28 - Graft in VS Code through native hooks and a payload adapter

- **Status**: Accepted
- **Context**: graft 0.20 wires Claude Code (skill, MCP, hooks) and Cursor, but for
  Copilot it writes only the instructions file. In VS Code the agent never saw the graft MCP
  tools, and edits never marked the graph stale, so `graft check` failed after every session.
- **Decision**: Commit `.vscode/mcp.json` for the MCP server and a native VS Code hook file,
  `.github/hooks/graft.json` (SessionStart, PostToolUse, Stop), that calls
  `.github/hooks/graft-vscode.cjs`. The adapter renames VS Code's `filePath` to graft's
  `file_path` and hands the payload to the existing `.claude/helpers/graft-hooks.cjs`.
  Cursor's generated `hooks.json` is git-ignored because it holds absolute paths.
- **Alternatives considered**: Turning on `chat.useClaudeHooks` to reuse
  `.claude/settings.json` - VS Code ignores matchers in that mode, so every Claude hook would
  fire on every tool call, and edits would still not be recognized. Instructions only -
  leaves the graph stale and the MCP tools unused.
- **Consequences**: Copilot sessions get the same orientation, blast-radius context and
  end-of-turn refresh as Claude Code. The adapter depends on graft's Claude hook payload;
  drop it when graft ships Copilot hooks, and re-run the checks in CONTRIBUTING.md after a
  graft upgrade.

## 2026-09-28 - Plain stage names around a named crew

- **Status**: Accepted. Supersedes 2026-08-28 "Splitting station from crew: staff titles for
  the agents"; the crew names and faces carry over.
- **Context**: The adoption audit for non-technical users (`docs/design/ux-audit-2026-09.md`,
  UX-04) found the console stacking factory, sports-staff and sports-venue metaphors on top of
  engineering terms, so a gate header needed three translations before it said what was being
  approved. The only glossary was the landing page, which also said there were two gates.
- **Decision**: Option A in `docs/design/vocabulary.md`. Keep Scout, Coach, Ref and Host and
  add plain job titles (requirements analyst, build planner, quality reviewer, demo producer).
  Stages become Requirements, Plan, Build check, Demo and Shipped; outputs become requirements
  brief, build plan, quality report and demo script; gates are named as actions ("Gate 2 ·
  Approve the plan") and gate copy says approve rather than sign, keeping "Signed by" in the
  record. Numbers drop the factory "ST" prefix. Still display-only in `pipeline.ts`.
- **Alternatives considered**: Fully plain names with no characters - loses the persona that
  makes the crew likable. UA's garment journey as stage names (Brief, Pattern, Fit, Launch) -
  on-brand, but "Pattern" and "Fit" still need explaining outside merchandising. Keeping the
  sports names with subtitles - smallest change, but the reader still decodes two names for
  every thing. Full comparison in `docs/design/vocabulary.md`.
- **Consequences**: A gate reads as the decision it is, and the crew no longer needs a
  glossary. The venue names are gone, which also retires the "Ref in the Film Room" seam the
  superseded entry flagged. The rest of the one-noun-per-concept pass ("artifact",
  "station", "units of work" in remaining copy) is still Phase 0 work in
  `docs/design/roadmap.md`.

## 2026-09-28 - Outside design sources may be used in implementation, under porting rules

- **Status**: Accepted
- **Context**: The console redesign for non-technical users draws on Kobra, React Bits,
  Beautiful UI and `@xyflow/react` with a layout engine. Their licenses differ (paid, MIT +
  Commons Clause, MIT, EPL-2.0 for `elkjs`), and each brings its own icons and colors.
- **Decision**: All of them may be used for implementation, not just inspiration, and may be
  modified or extended - provided every ported piece passes the porting rules in
  `docs/design/principles.md`: Phosphor icons only, semantic tokens only, the 12px floor, a
  reduced-motion branch, license notices kept, Kobra paid components bought before install.
  Each package still gets its own entry here when it is actually added.
- **Alternatives considered**: Inspiration only, rebuilding everything in-house - offered and
  not chosen; it keeps the dependency list shorter but re-solves problems these libraries
  already handle well (lifecycle status marks, hold-to-confirm, agent task rows).
- **Consequences**: A faster route to the working-state and approval patterns. No package is
  added by this entry. The `elkjs` license must be checked before the canvas phase (with
  `dagre` as the MIT fallback), and a Kobra purchase is a procurement step before any paid
  component lands.

## 2026-09-28 - The UI/UX library lives in `docs/design/`

- **Status**: Accepted
- **Context**: A new adoption-focused audit, the research behind it (component libraries,
  a catalog of interface details, diagram rules), and a roadmap needed a durable home that
  later work can extend. The previous audit is a single dated file,
  `docs/console-redesign.md`.
- **Decision**: `docs/design/` holds an index, the audit, personas, principles, vocabulary,
  roadmap and asset briefs, with `patterns/` for cross-cutting designs and `references/` for
  one file per external source (license, catalog, what we take). `docs/console-redesign.md`
  stays where it is as the historical record, with a note where it has gone stale.
- **Alternatives considered**: A top-level `references/ui-ux/` - all prose in this repo lives
  under `docs/`, and a top-level folder reads as code or data. `docs/references/ui-ux/` -
  the library holds more than references (audit, principles, roadmap), so the name would
  mislabel most of it. Extending `docs/console-redesign.md` - it is a dated record and
  already long.
- **Consequences**: One place to look for design context. `docs/design/README.md` defines
  how to add a reference and asks for a quarterly review; the roadmap requires the audit to
  be updated as each phase closes findings, which is the guard against drift.

## 2026-09-18 - Keep AWS infrastructure checks out of the fast local gate

- **Status**: Accepted
- **Context**: CDK infrastructure validation makes the default local gate too slow for
  frequent application-code feedback.
- **Decision**: `make check` skips the infrastructure gate, `make check-full` includes it,
  and CI always runs it.
- **Alternatives considered**: Keeping exact local/CI parity was rejected because it made
  routine checks unnecessarily slow.
- **Consequences**: Application checks complete faster; infrastructure changes require
  `make check-full`, while CI remains the backstop for every change.

## 2026-09-18 - Request-scoped agents and native async tool streaming

- **Status**: Accepted
- **Context**: Strands agents carry mutable request state and reject overlapping calls;
  synchronous Snowflake requests also hid intermediate Cortex output.
- **Decision**: Build one agent and hook set per invocation. Implement `snowflake_query`
  as an async-generator tool and map native Strands tool progress onto the existing
  `tool_call` stream.
- **Alternatives considered**: A shared-agent lock would serialize users; a custom event
  queue would duplicate Strands' streaming support.
- **Consequences**: Concurrent requests are isolated and Snowflake progress uses the
  existing local SSE and deployed WebSocket contracts.

## 2026-09-18 - AgentCore reads context through a DynamoDB resource policy

- **Status**: Accepted
- **Context**: The deployment identity cannot modify AgentCore's external execution role.
- **Decision**: When `AGENTCORE_ROLE_ARN` is configured, the storage stack adds a table
  resource policy granting that role only `dynamodb:GetItem`.
- **Alternatives considered**: Identity-policy changes are unavailable; broader table
  access is unnecessary.
- **Consequences**: Storage and runtime deployments must use the same role ARN. New table
  operations require explicit grants.

## 2026-09-18 - Authenticated WebSocket streaming for deployed turns

- **Status**: Accepted
- **Context**: Deployed turns need progressive events, but browser WebSockets cannot send
  the console API's bearer header and a turn can start before its watcher is registered.
- **Decision**: Use API Gateway WebSockets with one-time, 60-second project tickets. Keep
  one buffered connection per visible project, await registration before creating or
  answering a turn, and broadcast AgentCore SSE events to the invocation's initial
  watcher set. Poll DynamoDB when streaming is unavailable or interrupted.
- **Alternatives considered**: Faster polling loses progressive output; bearer tokens in
  URLs or subprotocols expose long-lived credentials; AppSync adds unnecessary surface.
- **Consequences**: The console gains live deployed updates and replay-resistant
  subscriptions. Connections are pruned on HTTP 410 or after a two-hour TTL.

## 2026-09-17 - Hosted console configuration comes from deployment inputs

- **Status**: Accepted
- **Context**: The deployed API needs the hosted UI origin and Entra identifiers at synth
  time; a frontend development file is not a deployment contract.
- **Decision**: Pass the CloudFront URL and Entra tenant/client IDs into
  `ConsoleApiStack` from `infra/app.py` process environment.
- **Alternatives considered**: Reading `ui/console/.env` would couple deployment to a
  gitignored local-development file.
- **Consequences**: CDK deployment requires both Entra values and configures CORS for the
  hosted and local console origins.

---

## 2026-09-17 - AgentCore runtimes share one scoped execution role

- **Status**: Accepted
- **Context**: The existing role policy already covers every `hyperdelivery_*` runtime.
- **Decision**: Deploy all four station runtimes with the same externally managed role.
- **Alternatives considered**: Per-agent roles add IAM objects without narrowing the
  existing runtime-scoped policy.
- **Consequences**: All stations run through AgentCore in `dev`; tool permissions remain
  constrained by each station's configured tool set.

---

## 2026-09-17 - Distill uses a task-token elicitation loop

- **Status**: Accepted
- **Context**: Distill may need human answers before it can produce a valid specification.
- **Decision**: Reuse the approval gates' `WAIT_FOR_TASK_TOKEN` pattern. Persist the
  pending question and prior message, accept answers through `/projects/{id}/answer`, and
  loop until Distill returns a draft.
- **Alternatives considered**: Forcing an immediate draft removes a human decision;
  moving deployed chat outside Step Functions splits orchestration ownership.
- **Consequences**: Deployed Distill supports multiple question rounds. The loop has no
  fixed round limit and relies on the conversation converging.

---

## 2026-09-17 - Console UI hosted on S3 + CloudFront, no custom domain

- **Status**: Accepted
- **Context**: The Vite SPA needs an HTTPS origin for Entra redirect URIs.
- **Decision**: Host the build in a private S3 bucket behind CloudFront Origin Access
  Control, using the distribution domain and SPA error rewrites.
- **Alternatives considered**: A custom domain adds Route53 and ACM with no current need;
  direct S3 website hosting does not provide HTTPS.
- **Consequences**: UI assets are replaceable and use destroy-on-removal. The CloudFront
  URL must be registered manually as an Entra SPA redirect URI.

---

## 2026-09-17 - `ENVIRONMENT` is authoritative for local vs. real orchestration, not `STATE_MACHINE_ARN`'s presence

- **Status**: Accepted
- **Context**: `api/main.py` decided whether to wire up the real Step Functions path or
  fall back to `LocalAgentClient` purely on whether `STATE_MACHINE_ARN` happened to be
  set - an implicit, easy-to-miss control flow. `Settings.environment` already existed
  (`local`/`dev`/`prod`, matching `infra/app.py`'s CDK `-c env=` context) but was dead:
  read nowhere. A misconfigured `dev`/`prod` deploy with a missing ARN would have
  silently fallen back to the local-only path rather than failing loudly.
- **Decision**: Added `core.constants.Environment` (`StrEnum`: `LOCAL`/`DEV`/`PROD`),
  typed `Settings.environment` as it. `api/main.py` now branches on
  `settings.environment` explicitly: `LOCAL` always uses `LocalAgentClient` (even if an
  ARN happens to be set); `DEV`/`PROD` always require `STATE_MACHINE_ARN` and raise
  `RuntimeError` at startup if it's missing, rather than silently falling back.
- **Alternatives considered**: Leaving the ARN-presence check as the only signal -
  rejected, since it makes `ENVIRONMENT` a documented-but-unused field and hides a real
  misconfiguration (missing ARN in a real deploy) behind a working-looking local path
  instead of a startup failure.
- **Consequences**: Any new environment-gated behavior in the console API should branch
  on `settings.environment`/`core.constants.Environment`, not a secondary signal's mere
  presence. `prod` remains unused by any deployed CDK stack today - `infra/app.py` still
  only deploys `dev`.


- **Status**: Accepted
- **Context**: `ConsoleApiFunction` shipped with `lambda_.Code.from_asset(str(_SRC_DIR),
  exclude=[...])` and no dependency bundling at all (a known gap from
  `.github/instructions/infra.instructions.md`, ADVA-3015) - every invocation failed with
  `No module named 'mangum'`. Fixing it needed a way to install the real project
  dependencies into the deployed asset without hand-maintaining a second dependency list
  next to the root `pyproject.toml`/`uv.lock`.
- **Decision**: `console_api_stack.py` now runs `uv export --frozen --no-dev --no-hashes`
  at synth time to turn `uv.lock` into a pip-compatible `requirements-lambda.txt`, then
  uses `aws_cdk.BundlingOptions` with the `public.ecr.aws/sam/build-python3.11` image to
  `pip install --only-binary=:all: --platform manylinux2014_x86_64 --python-version 3.11
  --implementation cp --abi cp311 -r requirements-lambda.txt -t /asset-output`. The
  explicit `--platform`/`--python-version`/`--implementation`/`--abi` flags pin the
  installed wheels to Lambda's default x86_64 runtime regardless of the host machine's own
  architecture - without them, building on an Apple Silicon dev machine installs arm64
  wheels (e.g. `pydantic_core`) that fail to import at runtime, since Docker on Apple
  Silicon runs the (multi-arch) build image natively as arm64. `--only-binary=:all:` also
  avoids sdist builds entirely, which the corporate TLS-inspecting proxy has been observed
  to corrupt mid-download for large packages (`pillow`'s sdist failed a pip hash check
  twice in a row); the exported requirements file additionally rewrites `pillow==<pinned>`
  to `pillow<12.3` since no manylinux wheel exists yet for 12.3.0. `providers/agents` (not
  all of `providers/`) is the only excluded subpackage now, since `api/routers/projects.py`
  imports `providers.documents`/`providers.github`/`providers.storage` directly and the
  original blanket `providers` exclude would have 500'd the upload/PR-merge endpoints.
- **Alternatives considered**: `aws_lambda_python_alpha.PythonFunction` handles the
  install-and-bundle step itself, but it's an alpha-versioned CDK module and the repo's IaC
  layer is already provisional (may move to Terraform) - adding an alpha dependency on top
  of that felt like the wrong kind of cleverness to have to port later. A separate Lambda
  layer for dependencies was rejected for the same reason `infra.instructions.md` already
  avoids CDK-specific cleverness: no immediate size problem (154MB unzipped, well under the
  250MB limit) to justify the extra moving part.
- **Consequences**: Every CDK test that calls `Template.from_stack()` on `ConsoleApiStack`
  now triggers a full Docker bundling run (~85s for the whole `infra/tests/` suite,
  confirmed empirically) - acceptable for now, but worth revisiting (e.g. a
  bundling-skip flag for unit tests) if the suite's runtime becomes a real friction point.
  If the Lambda's dependency footprint grows past a comfortable margin under 250MB, split
  `pyproject.toml`'s single dependency list into an "api" extras group so the bundled
  requirements aren't also carrying agent-only packages (strands-agents, pytesseract,
  python-docx/pptx) the console API never imports.

## 2026-09-14 - `requests` moved from `dev` dependency group to `[project.dependencies]`

- **Status**: Accepted
- **Context**: `orchestration/local_agent_client.py` imports `requests` and is production
  code - `api/main.py` imports `LocalAgentClient` unconditionally and instantiates it at
  app startup. `requests` was only declared in the root `pyproject.toml`'s `dev`
  dependency group (added there for test/local-dev use), so `uv export --no-dev` never
  included it, and the newly-bundled console API Lambda failed with `No module named
  'requests'` even after the mangum/platform bundling fixes above.
- **Decision**: Moved `requests>=2.32` into `[project.dependencies]`; left
  `types-requests` in `dev` since it's stub-only.
- **Alternatives considered**: Making `LocalAgentClient`'s import lazy/optional (only
  needed until real AgentCore runtimes are deployed for every station) was considered, but
  it's genuinely used in the current request path (`routers/projects.py`'s
  `advance_project`/stream endpoints), not a dev-only fallback - the dependency
  classification was simply wrong, not the import structure.
- **Consequences**: Once every station has a real AgentCore runtime and
  `LocalAgentClient` is retired, `requests` should be re-evaluated for removal entirely
  (not just moved back to `dev`).


- **Status**: Accepted
- **Context**: The 2026-09-09 Developer/PM toggle only gated the tool-call trace, raw
  agent text, and the inspector's raw-JSON tab - the structured content view itself
  (`SpecView`/`BlueprintView`/`DemoView` in `ui/console/src/components/inspector/views.tsx`)
  rendered identically in both modes. Several sections in that structured view are still
  implementation detail a PM doesn't need to read to judge the outcome: Scout's
  machine-readable gate rules and their correlations are how G1 scores automatically, not
  something a PM signs off on by reading; Coach's components/data model/integration
  points are the build's internal shape, with "Units of work" being the PR-sized slices a
  developer tracks; Host's talk track and seed data are demo-delivery mechanics, not the
  outcome itself.
- **Decision**: `SpecView`, `BlueprintView` and `DemoView` now take the same `viewMode`
  already threaded through `Inspector.tsx`'s `ContentBody`, and gate one `<Section>` each
  behind `viewMode === "developer"`: Scout's "Machine-readable rules" and "Rule
  correlations"; Coach's "Components", "Data model", "Integration points" and "Units of
  work"; Host's "Talk track" and "Seed data". `ReviewView` (Ref) is untouched - its
  findings/assignments are the PM-relevant outcome for that station, not detail to hide.
- **Alternatives considered**: gating whole stations' content behind PM mode instead of
  per-section - rejected, since e.g. Coach's own architecture summary and Scout's
  requirements list are exactly what a PM does want to read; only the sections that are
  either machine bookkeeping or build-mechanics detail are gated.
- **Consequences**: adding a new section to any of these three views means deciding its
  PM-visibility explicitly, same caveat as the original toggle - nothing enforces this
  beyond code review.

## 2026-09-12 - Global standing context, inlined short and fetched on demand long

- **Status**: Accepted (revised 2026-09 to be global rather than per-project - see
  addendum below)
- **Context**: There was no way to record standing facts - an existing repo, a
  database, a design system, a coding convention - anywhere the agents would read them;
  a collaborator had to retype them into chat every session. Separately, inlining
  arbitrarily long free text into every station's every prompt turn (including retries)
  would burn a slice of every agent's context budget on text most turns never need.
- **Decision**: A single global `GlobalContext` item (`core/domain/context.py`, stored at
  `pk=GLOBAL, sk=CONTEXT` in the same DynamoDB table via `ContextRepository`) holds one
  system-wide standing note - `context: str`, `updated_by`, `updated_at`, stamped from
  the caller's validated Entra ID identity, never a client-supplied name - exposed via
  `GET`/`PATCH /context`. Both local and deployed invocations use
  `core.prompting.context_section` to prepend it. The field is deliberately unstructured free text rather than a
  rigid schema - a repo, a database, a design system and a convention don't share a shape
  worth forcing. `context_section` inlines context outright when it's
  short (<=500 chars); past that it shows only a preview plus a pointer to call
  `get_context`, a new `@tool` (`tools/context.py`) that fetches the full text from
  DynamoDB directly, mirroring `s3_get_document_text`'s on-demand-fetch shape for
  documents. Registered in every station's tool list (distill, blueprint, review,
  showroom) since context can matter at any station. The console exposes it as its own
  global route (`/context`, linked from a top bar icon button, always visible) rather
  than folding it into the artifact inspector, since it isn't a station's output.
- **Alternatives considered**: Per-user, per-session, or per-project context - all
  rejected: it is meant to read the same for everyone across every project, like a
  system prompt, not scoped to any one unit of work. A structured schema (repo URL
  field, database field, etc.) - rejected because the set of things worth recording
  varies too much to fix in advance; free text degrades gracefully as that set grows.
  Always inlining the full context on every turn - rejected once context could run to a
  full page: correct but wasteful, especially across retries within one station.
- **Consequences**: A short context note (the common case) needs no extra round trip -
  it's just there. A long one costs one extra tool call the first time an agent actually
  needs it, and nothing when it doesn't. The 500-character inline threshold is a starting
  guess, not a measured number - revisit it if agents are found needlessly fetching short
  notes or missing content from a preview that should have been longer.
- **Addendum (global, not per-project)**: The original decision scoped context to a
  single `Project`. Before any multi-collaborator/multi-session work landed, it became
  clear the note being recorded (repo, database, design system, conventions) rarely
  varies per project - it is closer to a system prompt than project state. `Project`'s
  `context`/`context_updated_by`/`context_updated_at` fields, `ProjectRepository.set_context`
  and `PATCH /projects/{id}/context` were removed in favor of the single global item and
  `/context` route described above; `get_project_context` was renamed `get_context`
  accordingly. Revisit if per-project overrides turn out to be needed after all.


- **Status**: Accepted
- **Context**: `Station.next_station(SHOWROOM)` is `DONE` - unlike Distill/Blueprint/Review,
  whose next station is a human approval gate, Showroom has no checkpoint of its own
  between "the deterministic score says gap-free" and "the project is marked shipped".
  Both local-dev endpoints (`/advance`, `/advance/stream`) and the production Step
  Functions definition (`orchestration_stack.py`'s `mark_done` state, chained
  unconditionally after `showroom`) advance the instant `_is_incomplete`/the agent task
  returns, with no human confirmation that the run of show is actually ready to demo.
- **Decision**: `_advances(agent, result)` in `api/routers/projects.py` now always
  returns `False` for Showroom regardless of its own completeness - the station holds,
  and the composer stays live for as many turns as it takes. A new `_finish_if_requested`
  check runs before invoking the agent at all: if the current station is Showroom and the
  user's literal message (case/whitespace-insensitive) is "project completed", it calls
  `repo.advance_after_artifact` directly, skipping the agent entirely, and 409s if
  Showroom hasn't produced a gap-free artifact yet. This is local-dev-only for now - the
  CDK state machine's `mark_done` still chains unconditionally after `showroom`; bringing
  it in line needs a Step Functions Choice/wait-for-token state, tracked separately since
  it's a bigger infra change than this session's scope.
- **Alternatives considered**: A "Ship it" button next to the composer - rejected for
  consistency with the rest of the console's convention (chat-driven, not button-driven)
  and because a typed phrase needs no new UI at all, only a backend check.
- **Consequences**: The demo can now run Showroom for multiple turns (re-recording a talk
  track, asking Host to adjust the narration) without a stray complete draft silently
  shipping the project. Production Step Functions still auto-ships after Showroom's one
  task - a real (non-local-dev) run does not yet get this same checkpoint.

## 2026-09-10 - The console now calls `/preview` itself once a project is done

- **Status**: Accepted
- **Context**: `POST /projects/{id}/preview` and the merge/G3-triggered `_auto_preview`
  background task already existed on the backend, but nothing in `ui/console` ever
  called either - a demo that finished a full run showed no hyperlink anywhere, and the
  background task is fire-and-forget with no result surfaced even when it succeeds.
  `PREVIEW_CHECKOUT_PATH` is already a hardcoded, single-machine, single-checkout
  convenience (see the 2026-09-09 entry below); the missing piece was purely on the
  frontend.
- **Decision**: Added `startPreview`/`stopPreview` to the API client and a
  `previewByProject` store slice with a `startPreview` action, mirroring `loadBuilds`'s
  best-effort (non-`guarded`) pattern - a failure (no checkout configured, or the
  checkout's own script errors) is a normal outcome, not a toast. `Thread.tsx` calls it
  once a project reaches `done`, and the "Off the line" banner renders the returned
  `backend_url`/`frontend_url` as clickable links when `running` is true.
- **Alternatives considered**: A manual "Start preview" button - rejected for the demo
  use case: the whole point is a human doesn't have to click anything after signing G3.
- **Consequences**: Calls `/preview` again on every `done` project view/remount (cheap
  and idempotent - the backend just checks if the ports are already open). If this ever
  needs to run against something other than one hardcoded local checkout, this is the
  place a real "preview per project" model replaces the hardcoding.

---

- **Status**: Accepted
- **Context**: The 8192 default (2026-08-26 entry above) was already a deliberate
  revert for Distill specifically - raising it to 32768 once added ~49s to a turn for
  little gain on a light prompt. A real e2e run grounded in Snowflake/S3 lookups (a
  29s `snowflake_query`, two S3 tool calls, then an 87.2s final model call) still hit
  `MaxTokensReachedException` mid-artifact - the heavier grounding this agent now does
  routinely produces artifacts the 8192 default can't fit, not just the occasional
  large document.
- **Decision**: `config/agents/distill.yaml` now sets `max_tokens: 32768`, same as
  `blueprint.yaml`, accepting the added latency in exchange for fewer truncated turns.
- **Alternatives considered**: Rely on the console's existing Retry action (it already
  surfaces `MaxTokensReachedException` as a distinct, retryable error) - rejected as the
  steady-state fix, since a retry restarts from a clean `agent.messages = []` rather than
  resuming, so a genuinely large artifact would keep truncating on every attempt.
- **Consequences**: Every Distill turn now costs more wall-clock time on the model call,
  matching Blueprint's existing tradeoff. Revisit if 32768 also proves insufficient, or
  if the added latency turns out to matter more than the truncation rate in practice.

---

## 2026-09-09 - Tests never read the real `.env` file

- **Status**: Accepted
- **Context**: wiring up the laptop-demo preview (`PREVIEW_CHECKOUT_PATH` in the real,
  gitignored `.env`) made `test_g3_approval_proceeds_normally_with_no_builds_recorded`
  spawn a real `./scripts/preview.sh` subprocess and fail on an not reaped-process
  `ResourceWarning` - that test never mocked `get_settings`, so it silently picked up
  whatever the developer running the suite happened to have configured locally. AGENTS.md
  already requires "no network, no real AWS" for the suite; a `Settings` field that reads
  an optional local convenience value out of a real file on disk is a hole in that
  guarantee for every future field, not just this one.
- **Decision**: `tests/conftest.py`'s autouse `_reset_settings_cache` fixture now also
  monkeypatches `Settings.model_config["env_file"]` to `None` for the duration of every
  test, so `Settings()` only ever sees explicit `os.environ`/`monkeypatch.setenv` values,
  never the repo's `.env`. Blanking the file alone wasn't sufficient though - pydantic
  settings reads real OS environment variables too, and those take precedence over the
  file, so the fixture also does `monkeypatch.delenv("PREVIEW_CHECKOUT_PATH", raising=False)`
  to strip the one variable known to have real side effects (spawning a subprocess) if a
  developer's shell has it exported (e.g. via `make dev-all`'s `include .env; export`).
  Tests that need a specific value still set it themselves (`monkeypatch.setenv` or a
  `SimpleNamespace` override of `get_settings`), same as before.
- **Alternatives considered**: patching the one failing test to stub
  `preview_checkout_path=None` like its neighbors - fixes this symptom but leaves every
  other untouched field exposed to the same class of flake for the next developer who
  sets a local-only value in their own `.env`.
- **Consequences**: any test that genuinely wants the real `.env.example` defaults would
  need to load them explicitly now - none currently do. Revisit if a test legitimately
  needs to exercise real `.env` parsing (e.g. a docs-consistency check), by scoping the
  override to that one test instead of removing the fixture-wide guard.



- **Status**: Accepted
- **Context**: asked for a role toggle that shows "only relevant stuff" to a PM while
  Developer keeps showing everything. The thread already synthesizes a plain-English
  reply for every turn (`composeReply` in `lib/formatArtifact.ts`) alongside the agent's
  raw streamed text and its full tool-call trace, and the inspector already offers a
  literal `JSON.stringify` "JSON" tab next to the structured content/design views - none
  of that is summarization work waiting to be built, it's existing detail that Developer
  mode already shows in full.
- **Decision**: added `viewMode: "developer" | "pm"` to `useProjectsStore` (global,
  persisted, default `"developer"` - a display preference, not project state) with a
  toggle in `TopBar`. PM mode hides the tool-call trace and the raw agent `text` in
  `Turns.tsx` (keeping only `composeReply`'s summary and the artifact card) and hides the
  inspector's raw-JSON tab (`Inspector.tsx`), falling back to the `content` tab if it was
  active when the mode flips. Nothing else changes: the structured artifact views
  (`views.tsx`), the architecture diagram, and the gate/approval UI are identical in both
  modes.
- **Alternatives considered**: a second parallel render tree per artifact type keyed off
  role, so every future field addition would need an explicit PM-visibility decision -
  rejected as ongoing maintenance cost with no current need; "Detailed/Summary" naming to
  stay inside the app's sports-factory vocabulary (Scout/Coach/Ref/Host) - rejected for
  this control specifically, since it's a meta/settings toggle about how the operator
  reads the console rather than part of the delivery metaphor, so plain "Developer/PM"
  reads clearer here.
- **Consequences**: adding a new kind of debug-only detail (another trace type, another
  raw-dump view) means remembering to gate it on `viewMode` too - nothing enforces that
  today beyond code review. If PM users end up wanting to drill into the trace
  occasionally, add a per-turn "Show details" disclosure rather than a global mode flip.

## 2026-09-09 - MCQ picks lift into the composer instead of a second send button

- **Status**: Accepted
- **Context**: `QuestionPrompt` (the station's open-questions card above the composer)
  owned its own picked-answers state and its own "Send N answers" button, separate from
  the composer's send. A pick and any typed free text therefore went out as two separate
  turns, and it was ambiguous which box - the question card's pills or the composer's
  textarea - a given answer belonged in.
- **Decision**: `QuestionPrompt` became a fully controlled/presentational component
  (`picked`, `onToggle` props, no internal state, no button). `Composer` now owns
  `pickedAnswers`/`answeredIds`, composes the MCQ answer text via the existing
  `composeAnswers` helper, and folds it into the same `send()`/`submit()` path already
  used for typed text and attachments - one send button, one turn, whatever combination
  of pick/text/attachment it carries. Rollback on a failed turn (already in place for
  text and attachments) was extended to also restore picks.
- **Alternatives considered**: Keeping two send affordance but disabling the composer's
  while questions are open - rejected, since it doesn't resolve the real complaint (an
  answer picked in one place and typed text in another still can't travel as one turn),
  and it does not compose with a free-text-only question the composer already had to
  handle.
- **Consequences**: Any future "answer" needs a place for its state in `Composer`, not
  in the smaller components under it - makes `Composer` more central but that trade
  keeps one send button, one turn, and one place to reason about a failed-send rollback.

---

## 2026-09-09 - Document upload is a browser-to-S3 endpoint, not a browser-picked local path

- **Status**: Accepted
- **Context**: Distill's `get_local_document_text` (2026-09-04) only reads a path off the
  disk the agent process runs on - true in local dev, where console-api and the agent
  share a machine, but a browser `<input type="file">` never exposes a picked file's
  absolute disk path (removed from the File API everywhere except Electron), so the
  console had no way to let a person attach a PDF/PPT/DOCX from the browser. Separately,
  `providers/storage/s3.py`'s `parse_document` only handled `.txt/.md/.pdf`, while the
  local-file parser already handled `.docx/.pptx/.xlsx/.png/.jpg/.jpeg` too.
- **Decision**: Moved the format-specific extraction out of `providers/documents/local.py`
  into a new byte-based `providers/documents/parsing.py` (`parse_document_bytes`), shared
  by both the local-file path and `providers/storage/s3.py`'s `parse_document` - S3 now
  parses every format the local tool does. Added `POST /projects/{id}/documents`
  (multipart upload, `UploadFile`), which stores the raw bytes via a new
  `put_uploaded_document`/`UploadedDocument` in the existing documents bucket under
  `projects/<id>/uploads/<uuid>-<filename>` and returns the key. The console's Composer
  got an attach button that uploads on selection and cites `"Attached: ... (S3 key: ...)"`
  in the next chat turn - Distill's prompt already calls `s3_get_document_text` on any S3
  key it's given, so no agent-side prompt change was needed. Added `python-multipart` as
  an explicit dependency (FastAPI's `File`/`UploadFile` need it for multipart parsing;
  it was previously only a transitive dependency via `mcp`/`streamlit`).
- **Alternatives considered**: Wiring the picker straight to `get_local_document_text` -
  rejected, it's not implementable (no browser API exposes the absolute path). A separate
  parse-on-upload endpoint that returns extracted Markdown immediately - rejected to keep
  parsing where it already lives, as a tool call the agent makes on its own turn, matching
  the existing S3/local split rather than adding a third code path for turning bytes into
  text.
- **Consequences**: `providers/documents/local.py` is now a thin wrapper (path -> bytes ->
  shared parser -> sidecar write); any new document format only needs to be taught once.
  Uploaded originals accumulate under `uploads/` with no lifecycle rule yet - revisit if
  the documents bucket needs a retention/cleanup policy. The landing page's "what are we
  building" box got the same attach button, but a picked file there is only held in
  memory as a pending chip - there's no project (and so no S3 prefix) to upload it to
  until `send()` creates one. `createProjectFromMessage` now takes an optional `File[]`,
  uploads them right after `api.createProject` returns and before the first Distill turn
  is sent, and composes the message with `lib/attachments.withAttachments` (extracted
  from `Composer.tsx` so both call sites share it). An upload failure here sets the same
  `error` the landing page already checks before navigating, so a bad attachment blocks
  the first turn rather than silently dropping it - same as any other `createProject`
  failure.

## 2026-09-08 - Findings against an already-open pull request get an `@copilot` PR comment, not a fresh issue assignment

- **Status**: Accepted.
- **Context**: Review resolves every blocker/major finding to a GitHub issue and calls
  `assign_copilot_to_issue` on it, unconditionally - including for a `unit_id` whose
  issue already has an open pull request from an earlier turn. GitHub's own coding agent
  treats a fresh assignment as a new session from the issue's current base branch, which
  is exactly the "two coding-agent sessions editing the same file" collision this file's
  system prompt already warns against elsewhere (it has cost four unusable pull requests
  once). GitHub's documented alternative - an `@copilot`-mentioning comment on the pull
  request itself - keeps Copilot iterating on the same branch instead.
- **Decision**: Before calling `assign_copilot_to_issue`, Review now checks
  (`list_pull_requests`) whether the finding's issue already has an open pull request. If
  so, it calls `add_issue_comment` on the PR's own number (pull requests and issues share
  GitHub's numbering, so the same tool posts to either) with a comment starting
  `@copilot` describing the finding, and records the assignment's new
  `pull_request_number` field instead of reassigning the issue. `assign_copilot_to_issue`
  is only called when no open pull request covers the issue yet. No new GitHub MCP tool
  was needed - `add_issue_comment` was already in Review's allow-list for recording the
  issue-to-PR trail.
- **Alternatives considered**: Leaving the unconditional reassignment as-is and relying on
  `plan_delivery`'s "check whether one already exists" guard - rejected, that guard only
  covers building each delivery group once per turn, not a later turn's fresh findings
  against a group whose pull request is still open. Adding a dedicated
  `pull_request_review_write`-style tool - rejected, GitHub's issue-comment endpoint
  already accepts a PR number, so no new tool or connector was needed.
- **Consequences**: A G3 re-review that finds the same delivery group still wanting no
  longer risks a second, colliding pull request - it lands as a comment Copilot picks up
  on the branch already open. `CopilotAssignment.pull_request_number` is optional and
  defaults to `None`, so existing stored `ReviewReport` artifacts and their `assigned`/
  `issue_number` semantics are unchanged.

---

## 2026-09-08 - `merge_pull_request` always uses GitHub's `merge-async` endpoint

- **Status**: Accepted.
- **Context**: Once the `truststore` fix below let `merge.py` actually reach GitHub, a
  live G3 approval failed closed with a different, genuine GitHub API error for two
  stacked builds (PR #22 opened against PR #21's branch): "Merging stacked PRs via this
  endpoint is not supported. Use the asynchronous merge endpoint instead." GitHub's own
  REST docs confirm the synchronous `PUT .../pulls/{n}/merge` refuses any pull request
  whose base is another open PR's branch, full stop - there is no request body or retry
  that changes that verdict. The dedicated `PUT .../pulls/{n}/merge-async` endpoint is,
  in GitHub's own words, "the required method for merging stacked PRs, but also supports
  unstacked PRs", returning a job that is either settled immediately (200) or run in the
  background (202/409, poll `GET .../merge-async/{uuid}` for the result).
- **Decision**: `merge_pull_request`/`_merge` now always call `merge-async`, never the
  synchronous endpoint, for every pull request - not just ones detected as stacked. A
  `pending`/`enqueued` response is polled (one second apart, twenty attempts) until
  GitHub reports `merged` or `failed`; the public `MergeResult` contract (`merged`,
  `sha`, `message`) is unchanged, only `_merge`'s internals and the `_Client` protocol
  (which gained a `get` method to support polling) changed.
- **Alternatives considered**: Detecting a stacked PR first (e.g. checking whether
  `base.ref` is another open PR's head) and only then switching endpoints was rejected -
  it duplicates a check GitHub already does for free, and `merge_action: default` on
  `merge-async` already "selects the most appropriate option" for both stacked and
  unstacked PRs, so there is no unstacked case the async endpoint handles worse. Polling
  indefinitely was rejected in favor of a bounded budget (twenty seconds) that reports a
  clear "merge is still pending on GitHub" rather than hanging the request forever.
- **Consequences**: A merge that settles in the background now takes up to ~20s longer in
  the worst case (most complete on the first poll or immediately); if GitHub's background
  merges start taking longer than that in practice, raise `_MERGE_POLL_ATTEMPTS` rather
  than removing the ceiling.

## 2026-09-08 - `providers/github/merge.py` and `pull_requests.py` use `truststore`, not certifi

- **Status**: Accepted.
- **Context**: A live G3 approval failed closed with "could not merge every build: PR
  #21: could not reach GitHub; PR #22: could not reach GitHub" for both builds, every
  single time - initially mistaken for a transient network blip (see the retry entry
  below, added first and still worth keeping), but a direct repro with the same `httpx`
  client the server uses returned the real error every time: `ConnectError [SSL:
  CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer
  certificate`. This network's TLS-inspecting proxy re-signs GitHub's certificate with a
  root only the OS trust store knows - `curl` and every other GitHub call in this repo
  (`api/auth.py`, `mcp_clients/github.py`, `providers/github/files.py`,
  `providers/storage/snowflake.py`) already account for this with `truststore`; these two
  modules were the two GitHub clients that never got that treatment.
- **Decision**: Both modules now build their `httpx.Client` with
  `verify=truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)`, matching the existing pattern
  exactly. Confirmed fixed by direct repro before and after.
- **Alternatives considered**: None genuinely - this is copying an established, already-
  decided pattern (see `truststore` entries in this log) to two modules that were missed
  when it was introduced, not a new choice.
- **Consequences**: Every GitHub call in this repo now goes through the OS trust store.
  If a new GitHub (or other external HTTPS) client is added and hits
  `CERTIFICATE_VERIFY_FAILED: unable to get local issuer certificate`, copy this pattern
  before reaching for anything else - see CONTRIBUTING.md.

## 2026-09-08 - Retry transient GitHub transport failures inside `merge.py`, not at the API layer

- **Status**: Accepted.
- **Context**: A live G3 approval failed closed with "could not merge every build: PR
  #21: could not reach GitHub; PR #22: could not reach GitHub" for both builds in the same
  request, while GitHub itself was reachable moments later - `httpx.HTTPError` (a dropped
  connection through this network's TLS-inspecting proxy), not GitHub declining the merge.
  `submit_decision` never records the decision when a merge fails, so no false approval
  landed, but the human still had to notice and re-sign by hand.
- **Decision**: Every GitHub call inside `providers/github/merge.py` (`_get`,
  `_post_ready_mutation`, `_update_branch`, `_merge`) now retries up to twice more, a fifth
  of a second apart, before its existing `except httpx.HTTPError` fallback runs. A real
  4xx/5xx from GitHub is untouched by this - callers still check `response.status_code`
  themselves and see it on the first attempt.
- **Alternatives considered**: Retrying the whole `_merge_all_builds_or_fail` request at
  the API layer (`api/routers/projects.py`) was rejected - it would re-attempt builds that
  already merged successfully, not just the ones that hit a transport error. Exponential
  backoff was rejected as unwarranted complexity for a proxy blip that clears in well
  under a second; a small fixed number of quick retries was enough to fix the reported
  failure without adding a real delay to the common, successful case.
- **Consequences**: A merge now takes up to ~0.6s longer only when the network drops a
  connection mid-call, not otherwise. If this keeps recurring rather than clearing in two
  extra attempts, that points to a persistent proxy/network problem worth investigating
  directly, not more retries.

## 2026-09-07 - A Copilot-authored draft PR is taken out of draft before merging, not merged around

- **Status**: Accepted.
- **Context**: Approving at the G3 gate calls `resolve_and_merge` on every build Review
  recorded (see the "Merging is a human-triggered console action" entry below), but a
  live G3 approval failed closed on a build whose code was actually correct: GitHub's
  Copilot coding agent opens every pull request as a draft and does not reliably flip it
  to "ready for review" itself, and GitHub refuses to merge a draft regardless of CI
  status or human approval - `merge_pull_request` surfaced that refusal as GitHub's own
  405 message, correctly, but with no path forward short of a human leaving the console
  to click "Ready for review" on GitHub by hand. REST's "Update a pull request" endpoint
  has no `draft` field to flip (confirmed against GitHub's own REST reference: the body
  only accepts `title`/`body`/`state`/`base`/`maintainer_can_modify` - `draft` is
  create-only there); only GraphQL's `markPullRequestReadyForReview` mutation can, and it
  needs the PR's GraphQL node id rather than its number, hence an extra read first.
- **Decision**: Added `mark_ready_for_review` to `providers/github/merge.py` (GET the PR
  for its `node_id` and draft flag, then POST the GraphQL mutation if it is still a
  draft) and call it first inside `resolve_and_merge`, before `update_branch`. Treated as
  the same category as `update_branch`: mechanical follow-through on a decision a human
  already made, not a new judgment call - the G3 sign-off itself *is* the "this is ready"
  judgment, Copilot's own draft flag is just stale bookkeeping underneath it. Best-effort
  like `update_branch`: a PR that fails to convert (declined, unreadable, no node id)
  falls through to the merge attempt unchanged, which then reports GitHub's genuine
  verdict - never a merge claimed to succeed when GitHub actually still declined it.
- **Alternatives considered**: A separate "convert to ready" button in the console, split
  from merge - rejected as a second click for something the human has already decided by
  signing the gate, and the G3 screen has no separate control surface for a single build
  today. Requiring Copilot's own PR body/description to self-report readiness - rejected,
  nothing in the coding agent's output reliably signals it, and inferring it from CI
  status would conflate "draft" with "checks passing" (F2/F3 in a live Review report
  showed these are independent: CI can be entirely not run on a draft PR whose diff is
  already correct).
- **Consequences**: A G3 approval can now succeed on a build Copilot left in draft,
  provided the code is otherwise mergeable - closing the gap a live demo hit. Adds one
  more GitHub call (a GET) to every merge attempt, harmless given the existing 10s
  timeout and this path only running on an explicit human action. If GitHub ever adds
  `draft` to the REST update-a-pull-request body, this can drop the GraphQL call.

---

## 2026-09-07 - BedrockModel's own 120s read timeout undercut the heartbeat mechanism built to tolerate it

- **Status**: Accepted.
- **Context**: A live Blueprint invocation crashed outright: `model call took 123.2s` then
  `urllib3.exceptions.ReadTimeoutError` -> `EventLoopException`, ending the whole agent
  invocation, not just one tool call. `strands.models.bedrock.BedrockModel` builds its own
  `botocore.config.Config` with `read_timeout=DEFAULT_READ_TIMEOUT` (120s) whenever the
  caller doesn't pass `boto_client_config` - `providers/agents/strands_factory.py` wasn't
  passing one, so every agent (Blueprint, Review, Distill, Showroom) inherited that 120s
  cap. `agent_runtime/factory.py` already has `_with_heartbeat`, built specifically so "a
  slow prefill and a hung turn look identical from outside" doesn't matter - the console
  is meant to tolerate a long silent model call. Botocore's own read timeout undercut that
  design by killing the connection before the model ever got to respond, at a layer the
  heartbeat mechanism has no visibility into or control over.
- **Decision**: `strands_factory.py` now passes `boto_client_config=BotocoreConfig(
  connect_timeout=10, read_timeout=None)` to every `BedrockModel`. Confirmed against the
  installed botocore (1.43.78) that `read_timeout=None` really does disable it
  (`httpsession.py` builds `urllib3.util.Timeout(connect=connect_timeout, read=None)` from
  a config-supplied tuple, not a silent fallback to a default - that fallback path only
  fires when the whole `timeout` argument is `None`, which a tuple never is). Same
  reasoning as the GitHub MCP transport fix above: let the mechanism that's actually meant
  to decide how long to wait (here, the heartbeat/console layer) be the only one that does,
  instead of an implicit SDK default nobody chose. `connect_timeout` stays bounded so a
  real failure to reach Bedrock still fails fast.
- **Alternatives considered**: Raising `read_timeout` to a large finite number (e.g. 300s)
  instead of `None` - rejected for the same reason as the httpx case: it would need to be
  kept in sync with whatever the console/heartbeat layer's own tolerance is, which is
  exactly the duplicated-source-of-truth this avoids. Retrying the turn on a timeout -
  rejected: Strands' own event loop can't resume a partially-streamed model response, so a
  retry would redo the whole turn's tool calls, not just the one that stalled.
- **Consequences**: A genuinely slow model call (large context, extended thinking, a
  Bedrock-side hiccup) now surfaces to the console as a longer wait via the existing
  heartbeat/"thinking" events instead of a hard crash. Nothing now caps how long a single
  model call can run except the console's own request lifecycle - if a truly hung call
  (not just slow) needs its own ceiling later, it belongs at that layer, not silently
  reintroduced here.

## 2026-09-07 - The GitHub MCP transport had its own 5s timeout underneath BoundedMCPClient

- **Status**: Accepted.
- **Context**: The prompt-level fix below (treat a hand-off timeout as inconclusive) and
  the `_SLOW_GITHUB_TOOLS` timeout tuning were built on the assumption that
  `BoundedMCPClient`'s per-tool timeout (60s default, 90s for the hand-off tools) was the
  only thing governing how long a GitHub MCP call waits. A manual, isolated call to
  `assign_copilot_to_issue` (bypassing the agent loop, timed directly) proved that wrong:
  it died in 5.1s with `httpx.ReadTimeout` -> `RuntimeError: Connection to the MCP server
  was closed` - a hard kill of the whole MCP session, not a graceful single-tool failure.
  `mcp_clients/github.py`'s `_truststore_http_client` built its `httpx.AsyncClient` with
  no `timeout=` argument, so it silently inherited httpx's own default
  (`httpx.Timeout(timeout=5.0)` - confirmed directly against the installed httpx 0.28.1).
  That 5s transport-level timeout fired long before `BoundedMCPClient`'s tool-level
  timeout ever got a chance to - which is why raising `_SLOW_GITHUB_TOOLS` from 45s to
  90s to (previously) 240s never actually changed anything: the connection was already
  gone before any of those numbers were reached. This is specific to GitHub's client -
  `mcp_clients/atlassian.py` uses `stdio_client` (a local subprocess), not httpx, so it
  was never exposed to this.
- **Decision**: `_truststore_http_client` now passes an explicit `httpx.Timeout(connect=
  10.0, read=None, write=10.0, pool=10.0)`. `read=None` hands the actual cutoff back to
  `BoundedMCPClient`'s per-tool timeout, which is what the codebase already claims is the
  single source of truth for how long to wait - this change only makes that true.
  Connect/write/pool stay bounded at 10s so a genuine network failure (proxy down, DNS
  failure) still fails fast instead of hanging. Verified live: the same manual call that
  died at 5.1s before this change completed at 10.5s after it, with Copilot's PR already
  linked in the response.
- **Alternatives considered**: Setting `read` to a large finite number (e.g. 120s) instead
  of `None` - rejected as needing to be kept in sync with whatever `_SLOW_GITHUB_TOOLS`'s
  largest value is, which is exactly the kind of duplicated-source-of-truth this change is
  trying to remove. Raising `_SLOW_GITHUB_TOOLS` further - already tried twice in the prior
  entry below and confirmed above to be irrelevant, since the transport was the actual
  limiting factor the whole time.
- **Consequences**: The prior entry's prompt-level fix (timeout is inconclusive, verify
  with `issue_read`/`list_pull_requests`) and the 90s `_SLOW_GITHUB_TOOLS` value are still
  correct and still needed as a backstop for genuinely slow responses - this fix removes a
  much more common failure (any response over 5s, which is nearly all of them for the
  hand-off tools) that was masquerading as the same symptom. Worth checking whether other
  httpx-based MCP or HTTP clients in this repo (if any are added later) get an explicit
  timeout rather than inheriting httpx's default silently.

## 2026-09-19 - A timed-out Copilot hand-off is a poll target, not a retry trigger

- **Status**: Accepted.
- **Context**: `create_pull_request_with_copilot` and `assign_copilot_to_issue` are
  third-party GitHub MCP server tools whose own latency we do not control - they can take
  well over the 240s per-tool timeout that was configured for them at the time
  (`mcp_clients/github.py`'s `_SLOW_GITHUB_TOOLS`). Raising that number again does not fix
  the class of problem: a synchronous tool call inside one model turn cannot be made to
  reliably finish inside any fixed budget when the server it calls has open-ended latency,
  and the prompt was previously treating a timeout on either tool as a real failure -
  recording `assigned: false` or skipping a group's `builds` entry - even though the
  request can still have succeeded on GitHub's side after our client gave up waiting on
  the response (confirmed live: the console showed a hand-off tool call still "running"
  well after Copilot had already opened the pull request on GitHub).
- **Decision**: `review.yaml`'s system prompt now tells the model a timeout/connection
  error from either tool is inconclusive, not a failure: before recording an assignment as
  failed or a group as undelivered, it must check with `issue_read`/`list_pull_requests` -
  the same read-only tools it already uses to detect a pull request a *prior* turn opened
  - and only act on what that check finds. This mirrors the "kick off, then poll
  separately" shape `providers/github/pull_requests.py` already uses for build status,
  applied to the hand-off itself instead of only to what happens after it.
- **Alternatives considered**: Raising the per-tool timeout further - rejected, treats the
  symptom and still fails whenever GitHub's own latency exceeds whatever number is chosen.
  MCP "task-augmented execution" (`strands.tools.mcp.mcp_tasks`, an experimental
  2025-11-25 MCP spec feature that turns a slow call into create-task/poll/fetch-result) -
  rejected for now: it requires the GitHub MCP server to declare support for it, which is
  outside our control and unverified, so building on it would be speculative
  infrastructure until we know the server actually offers it. A dedicated fire-and-forget
  wrapper that never waits on these tools at all - rejected, an MCP tool call cannot return
  control to the model without some tool result, so the model has to wait on *something*;
  the fix is in what it does when that wait fails, not in avoiding the wait.
- **Consequences**: A slow hand-off no longer forces the model to falsely report a failed
  assignment or a missing pull request that actually exists - it costs one extra cheap read
  call instead. Once a timeout stopped being treated as a failure, there was no reason left
  to keep the console waiting up to 240s for one - `_SLOW_GITHUB_TOOLS` was cut to 90s in
  the same change, so a slow hand-off now costs one shorter wait plus a cheap read instead
  of a multi-minute spinner. If the GitHub MCP server later adds MCP Tasks support, revisit whether
  `BoundedMCPClient` should opt into task-augmented execution for these two tools instead
  of relying on the prompt-level check.

## 2026-09-07 - A merge can start a local preview automatically, single-machine only

- **Status**: Accepted.
- **Context**: `merge_build`'s response told a human to "pull the repo locally, then run
  `make preview`" - the same "PM shouldn't have to touch git/a terminal" problem the merge
  decision above already solved for the merge itself, just one step further down the same
  path. Building the real thing this implies - a hosted preview per pull request - is
  already planned and explicitly out of scope for now (`docs/hyperdelivery-plan.md`'s
  Phase 3 "Environments"); that is multi-project, needs real infrastructure, and nothing
  today needs it yet.
- **Decision**: Added `infrastructure/local_preview.py` - `pull_default_branch` (`git pull
  --ff-only`, so a dirty or diverged checkout fails loudly instead of losing local work),
  `start_preview` (launches the target repo's own preview command detached, then polls its
  two ports), `stop_preview` (re-invokes that same command's own `stop` mode). New optional
  settings (`PREVIEW_CHECKOUT_PATH` and friends) gate all of it off by default. Both merge
  paths (`merge_build`, the G3 auto-merge in `submit_decision`) fire this as a
  `BackgroundTasks` call after a successful merge; `POST /projects/{id}/preview` and
  `.../preview/stop` let a human trigger or stop it by hand instead.
- **Alternatives considered**: Building the real hosted-preview-per-PR feature now -
  rejected, out of scope and no current need; explicitly not what this change is. Making
  the auto-trigger synchronous with the merge response - rejected, since a slow or hung
  preview script would then make the merge itself look like it failed, and a human clicking
  merge does not need to wait on a demo server before seeing that the merge succeeded.
- **Consequences**: Single checkout, single preview process, one machine running both the
  console API and that checkout - no multi-project isolation, and a second project's merge
  will just overwrite the first project's preview. Fine for the one-demo-at-a-time reality
  today; revisit if two people ever need simultaneous previews.

---

## 2026-09-07 - Merging is a human-triggered console action, and a G3 approval merges everything for the human

- **Status**: Accepted.
- **Context**: No agent tool can call `merge_pull_request` (`tools/github.py`, AGENTS.md's
  "do not remove or bypass a human approval gate"), so merging a build Review opened had
  no path at all - the PM had to leave the console and use `git`/GitHub's UI by hand. That
  is a reasonable ask of a PM who approves a G1/G2 spec, but not of one asked to update a
  branch or read a conflict marker; "merging is a human decision" should mean the human
  decides *whether*, not that they personally run the mechanics.
- **Decision**: Added `providers/github/merge.py`, a write-path REST client kept out of
  every agent's toolset by construction (no `@tool` anywhere imports it), with two calls:
  `update_branch` (PUT .../update-branch - purely mechanical, no textual judgment) and
  `merge_pull_request`, composed as `resolve_and_merge`. Exposed two ways: a human can
  explicitly trigger one build's merge (`POST /projects/{id}/builds/{number}/merge`), and
  approving at the G3 gate (`SHOWROOM_APPROVAL`) now calls `resolve_and_merge` on every
  build `ReviewReport.builds` recorded before the approval is allowed to complete. If any
  build has a real, unresolved conflict, the whole approval fails closed (502, GitHub's own
  message, decision never recorded, task token never released) rather than recording an
  approval the demo can't actually show.
- **Alternatives considered**: Auto-handing a real conflict to Copilot the same way Review
  hands off a blocker finding (`assign_copilot_to_issue`) - rejected for now. That tool's
  argument schema is defined by GitHub's remote MCP server and discovered dynamically; the
  only way to use it without a guess is a real agent turn, and triggering a full agent
  invocation automatically from a merge failure (real model cost/latency, no human asking)
  is a bigger architectural step than this change needed. A genuine conflict still fails
  with GitHub's own message today; revisit this once there's a case that actually hits it.
- **Consequences**: Common case (branch behind, no textual conflict) needs zero PM git
  skill, at either trigger point. A real conflict still blocks the G3 gate and needs a
  human (or a follow-up Review turn) to look at the code - this change does not and should
  not pretend otherwise.

---

## 2026-09-07 - Batch file reads as a direct REST tool, not an MCP addition

- **Status**: Accepted.
- **Context**: Blueprint's brownfield impact analysis and Review's PR-grounding both read
  several files per turn via the GitHub MCP server's single-file `get_file_contents`.
  Strands does run every tool the model requests within a single turn concurrently by
  default (`ConcurrentToolExecutor`, see `strands/agent/agent.py` and
  `strands/tools/executors/concurrent.py`) and sends all of their results back in one
  follow-up call - an earlier version of this entry claimed otherwise and was wrong.
  The real cost is that this concurrency only fires when the model itself packs multiple
  `toolUse` blocks into one response; it has no way to know up front how many files a task
  needs, so it typically requests them one file at a time, and each single-file request is
  its own sequential model round trip regardless of the executor. N files still cost close
  to N Bedrock round trips in practice, just not for the reason first written down here.
- **Decision**: Add `get_file_contents_batch` (`tools/github.py`), backed by a new direct
  GitHub REST client (`providers/github/files.py`) that fetches every requested path
  concurrently via a thread pool and returns them all in one tool response. Shared by
  Blueprint and Review - both already hold equivalent single-file read access, so this
  grants nothing new, only a cheaper way to exercise it. Both agents' prompts now prefer
  it once more than one path is known.
- **Alternatives considered**: Asking the GitHub MCP server for a batch tool - not ours to
  add, and none of its exposed tools support it today. Parallelizing tool execution inside
  Strands itself - out of scope, would mean forking/patching a third-party library the repo
  doesn't own. Leaving it as repeated single-file calls and accepting the latency - rejected
  because the fix was cheap and the cost was real and measured, not theoretical.
- **Consequences**: One more code path that talks to GitHub outside the MCP server, so a
  GitHub outage or rate limit now has two places to show up in logs, not one. A missing or
  unreadable file returns an error per-path instead of failing the whole batch, matching
  the MCP tool's per-call failure granularity. Revisit if GitHub's MCP server ever ships
  its own batch read - this tool should be retired in favor of it rather than kept forever.

---

## 2026-09-05 - Review's hand-off gets the gate its own comments already claimed

- **Status**: Accepted.
- **Context**: Review files GitHub issues, assigns them to Copilot's coding agent and
  opens pull requests - all automatically, "not gated on being asked". Two places said
  that was safe because a human signed it off afterwards: `review.yaml` ("the human
  sign-off gate at G3 still reviews every assignment made this way") and `tools/github.py`
  ("the G3 human sign-off gate (`Station.REVIEW_APPROVAL`)"). Neither was true. The
  `Station` enum had exactly two approval stations, and `REVIEW_APPROVAL` runs *before*
  `REVIEW` - it cannot review assignments that do not exist yet. Every approval station is
  named for the station it unlocks, not the one it signs off, and that offset is what let
  the mistake read as correct. So the one station that takes irreversible action outside
  the conversation was the only one with no gate after it.
- **Decision**: Add `Station.SHOWROOM_APPROVAL` between `REVIEW` and `SHOWROOM` - Gate 3,
  the grade sheet sign-off - following the existing naming convention, plus a
  `WaitForShowroomApproval` task in the state machine and a third gate in the console.
- **Alternatives considered**: Correcting the comments to admit there is no gate - honest,
  but leaves an agent opening pull requests with no human between it and the demo, which
  AGENTS.md forbids outright. Removing Review's automatic hand-off instead and requiring it
  to be asked - rejected because the automatic behavior is deliberate and logged, and
  because "ask before acting" is exactly the permission-flavoured gating AGENTS.md warns
  causes silent skipping. Renaming the approval stations to say what they sign off rather
  than what they unlock - a bigger, more disruptive rename that fixes the confusion but not
  the missing gate.
- **Consequences**: Every station that writes outside the conversation now has a human
  after it. The line is eight stations, not seven, and anything that hard-codes the count
  or the gate list has to change with it - `Station`, `APPROVAL_STATIONS`, the state
  machine, `PIPELINE`/`STATION_META`, the rail, the store, and the needs-you count. A
  project mid-flight when this deploys sits at a station that still exists, so no
  migration is needed, but an execution already past `REVIEW` will not pause at the new
  gate.

---

## 2026-09-05 - Agent prose renders through react-markdown, one renderer for every state

- **Status**: Accepted. Supersedes the hand-rolled renderer in `ui/console/src/lib/markdown.tsx`.
- **Context**: The console rendered agent prose with ~70 lines of hand-written parsing that
  knew about bold, inline code, `- ` bullets and (latterly) headings. It was fine until the
  reasoning narrative stopped being hidden behind a disclosure and became the message body:
  `## What I did` shipped as literal text, ordered lists rendered as plain paragraphs, and
  the next thing needed was links - Review hands off pull requests, so clickable URLs in
  prose are a matter of time. Links, tables and fenced code are exactly the constructs
  where a hand-rolled parser is subtly wrong.
- **Decision**: `react-markdown` + `remark-gfm`, with a `components` map binding every
  element to this console's tokens and type scale. One renderer for the streaming buffer
  and the finished turn alike.
- **Alternatives considered**: Keeping the hand-rolled parser and adding `<ol>` - cheap now,
  but each new construct is another special case, and the parser silently mis-renders what
  it does not know. `marked`/`markdown-it` - smaller, but they emit HTML strings, so
  rendering model-generated text would mean `dangerouslySetInnerHTML` plus DOMPurify;
  react-markdown builds React elements and cannot inject HTML at all. A split renderer -
  simple parser while streaming, library once settled - rejected because the thread was
  deliberately arranged so a finished turn does not re-lay-out relative to the streaming
  one, and two renderers reintroduce exactly that, permanently, in two code paths.
- **Consequences**: Links, ordered lists, tables, fenced code and nested lists render
  correctly without further work, and the `components` map is the single place the design
  system meets agent output. The bundle grew 250.7 -> 298.5 kB gzipped; it was already past
  the 500 kB raw warning, so the answer to that is code-splitting the console, not
  declining the dependency. Mid-stream, an unclosed code fence renders as a code block
  until its closer arrives - accepted, and the same behavior every streaming chat UI has.
  `img` is mapped to nothing on purpose: a station has no business pulling remote images
  into the thread.

---

## 2026-09-05 - MCP tool calls are bounded by subclassing the client, not by waiting

- **Status**: Accepted.
- **Context**: A Blueprint turn that fanned out to eighteen concurrent `get_file_contents`
  calls stopped dead and never produced an artifact. Nothing in the stack bounded it:
  Strands builds every `MCPAgentTool` with `timeout=None`, opens its `ClientSession`
  without a read timeout, and `mcp.shared.session` then calls `anyio.fail_after(None)` -
  an unanswered request waits forever. Tool calls in a turn execute concurrently
  (`ConcurrentToolExecutor`, no cap), so one straggler blocks the turn. Worse, `agent` is a
  single instance shared by every invocation the container handles and Strands raises
  `ConcurrencyException` on a second concurrent call - so one dropped response takes the
  station down for *every* project until a restart. `MCPClient` exposes no timeout knob.
- **Decision**: `mcp_clients/bounded.py` subclasses `MCPClient` and stamps a 60s timeout
  onto each `MCPAgentTool` as `list_tools_sync` hands them over; both the GitHub and
  Atlassian builders construct through it. `agent_runtime.factory` adds a 600s cap on the
  whole turn as a second line of defense, covering our own `@tool` functions too.
- **Alternatives considered**: Waiting for upstream to expose a timeout - the failure
  bricks a station, so it needed fixing now. Calling `list_tools_sync` ourselves and
  passing tools instead of the client - means owning the MCP session lifecycle that
  Strands currently manages, for the same result. A stall timeout (no event for N seconds)
  instead of a whole-turn cap - rejected because a long tool batch legitimately yields no
  stream events, so it would fire on slow-but-working runs. Capping tool concurrency with
  a custom `ToolExecutor` - speculative until bounded waits prove insufficient (AGENTS.md).
- **Consequences**: A hung remote call now fails its tool instead of the station, and the
  model gets a tool error it can react to. 60s is generous for a file read or issue lookup
  and well under the console's own 300s read timeout, so a stuck tool surfaces as a failed
  step rather than a dead connection; 600s for the turn is far above any legitimate run
  (the Snowflake client alone allows 240s) and means "definitely broken". The subclass is
  coupled to `list_tools_sync`'s signature - if Strands changes it, or adds a real timeout
  parameter, delete this.

---

## 2026-09-05 - GitHub reads are scoped and slimmed in the prompt, not in a wrapper

- **Status**: Accepted.
- **Context**: Chasing where a Blueprint turn's six-figure token count comes from led to
  the repository scan, which is not one tool but the agent's own sequence of
  `search_repositories` -> `get_repository_tree` -> `search_code` -> N x
  `get_file_contents`. Dumping the remote server's tool schemas rather than guessing at
  them turned up three things the prompts never mentioned. `search_code` searches **all**
  of GitHub unless the query carries `repo:owner/repo`. Its `fields` parameter defaults to
  returning everything, and the schema itself says `text_matches` and `repository` are
  "the largest per-result data" - a full repository object was riding on every hit.
  `get_repository_tree` accepts a `path_filter`. And `get_file_contents` has no range
  parameter at all: a file read is the whole file or nothing.
- **Decision**: Say so in the two prompts. Scope every `search_code` with
  `repo:owner/repo`, ask for only the `fields` in use, keep `perPage` small, reach for
  `path_filter` on a large tree, and locate a file before reading it because there is no
  way to read part of one. Worded as what helps rather than as what is allowed, per the
  gate-by-direction rule in AGENTS.md.
- **Alternatives considered**: Wrapping each MCP tool in a `@tool` that injects the
  parameters, which is where policy belongs under the providers/tools split and cannot be
  ignored by the model - rejected for now because it means hand-maintaining a wrapper per
  tool against a schema we do not control, to enforce defaults the model can already read
  in that same schema. Revisit if a run shows the prompt being ignored. Post-processing
  results to strip fields - same cost, and it pays for the bytes before discarding them.
- **Consequences**: The unscoped search was a correctness bug, not just a cost one, and it
  is the fourth instance of the failure mode this repo keeps hitting: output that looks
  right, grounded in the wrong thing, with nothing on the surface to show it. Clipping
  `get_file_contents` results is now known to be the only lever left on file size, since
  the API will not return part of a file - that is still open. Nothing here is enforced by
  a test; the prompts are configuration, so a run is the only proof.

---

## 2026-09-05 - A silent model call reports how long it has been silent

- **Status**: Accepted.
- **Context**: A DEBUG log went quiet for a minute after
  `strands.models.bedrock: got response from model`, which reads like the model answered
  and something downstream hung. It is the opposite: `converse_stream()` returns as soon
  as the response headers arrive, and the log line sits above the `for chunk in
  response["stream"]` loop that pulls the actual generation. Strands logs nothing per
  chunk, so a long prefill on a large context and a genuinely stalled connection produce
  byte-identical output - and both look the same in the console, which shows a caret and
  no other sign of life. That ambiguity is what stopped us diagnosing the earlier 123.6s
  `ReadTimeoutError`, because 60s of dead air is both "Bedrock is slow" and "botocore is
  about to give up".
- **Decision**: Emit `{"thinking": {"seconds": float}}` every `_HEARTBEAT_SECONDS` (5)
  that pass with no stream event, relayed by the console API and rendered next to the
  working indicator. The wrapper polls a future kept alive across timeouts rather than
  awaiting through `asyncio.wait_for`, which cancels what it waits on and would leave the
  async generator unusable for the rest of the turn.
- **Alternatives considered**: A server-side log line only - cheaper, and it answers the
  question we actually had, but it leaves the person watching the console with the same
  frozen screen. Reusing the hook-append-drain pattern that streams tool calls - rejected
  on inspection: the drain runs when the *next* stream event arrives, and the whole
  problem is that no event arrives, so a synchronous hook has nothing to hand a consumer
  parked on `async for`. Raising `read_timeout` - refused without evidence, since it
  changes the symptom and not the cause; this is the instrument that decides whether it
  is warranted.
- **Consequences**: The SSE contract gains `thinking`, additive like `draft` and `usage`,
  and an unknown key is still ignored by every consumer. `create_app`'s entrypoint was
  already at ruff's 50-statement ceiling, so the per-event fan-out moved into
  `_model_events`, which now yields the agent's result alongside the console's events and
  lets the caller lift it back out. As with `draft`, only the local-dev path carries this:
  `orchestration/agent_invoker.py` keeps `result["result"]` and discards its siblings.

---

## 2026-09-05 - The artifact streams as raw draft JSON, not as parsed prose

- **Status**: Accepted.
- **Context**: A run looked frozen. A station showed a spinner for the whole generation
  and then produced its document in one shot. The transport was never the problem - no
  compression middleware, `iter_lines` on a streamed response, one `run_sync` hop per
  event, `readSse` yielding per frame. The cause was upstream: Strands implements
  `structured_output_model` as a forced call to a tool named after the output model, so
  writing the FSD *is* a tool call, arriving as deltas that append to that call's `input`.
  `factory.py` announced the first delta (the one carrying the tool use id) and dropped
  the rest, which is correct for a real tool and silently discards the artifact.
- **Decision**: Single that call out by name (`output_model.__name__`) and stream each
  delta's unsent tail as a `draft` event, relayed verbatim by the console API. The console
  renders it as a capped, auto-scrolling mono panel headed "Writing the scouting report",
  hidden from assistive tech, replaced by the artifact card when the run finishes.
- **Alternatives considered**: Extracting completed string fields from the partial JSON
  with an incremental scanner, so prose streams and structure does not - better reading
  experience, but a tolerant parser is real code to own and it still cannot show the
  document's shape. Leaving the spinner and labelling it ("Writing the scouting report")
  plus the new token counter - zero parsing and honest, but it shows progress rather than
  work, and a four-minute Blueprint still reads as a stalled bar. Raw JSON was chosen
  because it is the actual generation, needs no parser, and cannot drift from what the
  model produced; it is developer-grade output on a surface whose users approve gates, so
  revisit if the panel reads as noise rather than reassurance.
- **Consequences**: The SSE contract gains `draft` and `usage`; both are additive, and an
  unknown event key is ignored by every consumer, so nothing breaks by not knowing them.
  `_ToolUseStream` now owns the whole current-tool-use translation, including the offset
  restart when a rejected draft is rewritten under a fresh tool use id - a real case, since
  a draft that fails validation starts over from an empty input. Only the local-dev path
  carries these events: `orchestration/agent_invoker.py` returns `result["result"]` and
  discards siblings, so the deployed Step Functions path shows neither until it is taught
  to.

---

## 2026-09-05 - Prompt caching covers the system prompt and tools, not the artifacts

- **Status**: Accepted.
- **Context**: `agent_runtime.factory` clears `agent.messages` on every invocation, on
  purpose - a shared `Agent` instance would otherwise carry one project's history into the
  next. The cost is that the system prompt and the entire tool schema go over the wire
  every single turn, and a station is invoked repeatedly inside one project: redrafting
  after the gate reports gaps, again when its questions are answered, again when a build
  settles. Distill's prompt is 1,378 words and Blueprint's 1,404 (~1,900 tokens), before
  the tool schemas - and those are large by design, because a `@tool` docstring is the
  prompt the model reads.
- **Decision**: `CacheConfig(strategy="auto")` plus `cache_tools="default"` on
  `BedrockModel`. "auto" maps to Anthropic caching for Claude/Anthropic model ids and to
  no caching for anything else (verified in the installed SDK), so it is a request to
  cache where caching exists rather than an assertion that it does. TTL is left at
  Bedrock's default.
- **Alternatives considered**: *`cache_prompt="default"`* - the obvious parameter, and
  wrong: the SDK deprecates it and warns, because it only covers the system block.
  *A longer `ttl="1h"`* - would catch a human who takes ten minutes to answer a question,
  but a longer window costs more per cache write, and enough runs here are one-shot that
  paying the premium on every cold turn is the worse trade. Revisit with real hit-rate
  numbers. *A cache point after the predecessor artifacts in `_build_prompt`* - the
  biggest prize, since Review re-sends the whole spec and blueprint as JSON on every turn
  and both are frozen after G2. Deferred: a mid-message cache point means the prompt can
  no longer be a plain string, so the `{"prompt": str}` contract between the console API
  and the agent runtime would have to carry content blocks. Not worth it before measuring.
  *A per-agent opt-out in the YAML* - rejected as speculative; nothing needs to turn it off.
- **Consequences**: A cache write costs more than an uncached call, so a project that
  runs each station exactly once and never redrafts pays slightly more. Showroom's prompt
  is 355 words (~470 tokens), below the minimum cacheable prefix on its own - expected to
  simply not cache rather than to error, but that is not yet verified against a live call.
  Two tests assert `_cache_strategy`, an SDK private, because whether "auto" actually
  resolves for our model ids is the only fact that matters and is otherwise invisible.

---

- **Status**: Accepted.
- **Context**: Handing a delivery group to a coding agent produces a pull request that
  takes minutes and then sits there. Nothing told the human it existed until the station
  finished, and nothing told them when it went green - so "autopilot" meant "go and watch
  GitHub yourself".
- **Decision**: Review records what it opened (`ReviewReport.builds` plus `repository`),
  the console API gets a read-only `GET /projects/{id}/builds` backed by a small GitHub
  REST client, and the thread polls it every 15 seconds while any build is still moving.
  When they all settle, the console sends one ordinary agent turn so the station reports
  the outcome in its own voice. An unfinished check outranks a failed one, so a
  half-finished run is never announced as broken, and an unreadable pull request is
  reported as unknown rather than failed.
- **Alternatives considered**: *Poll by re-invoking the agent* - it already has
  `pull_request_read: get_check_runs`, so no new code at all. Rejected: a model call every
  fifteen seconds to answer a yes/no question is absurdly expensive and fills the thread
  with noise. *A GitHub webhook into a Lambda* - the production answer, and the only one
  that survives the tab closing. Rejected for now under "do not build speculative
  infrastructure": there is no deployed state machine driving this yet, and the browser is
  where the human already is. *A server-side background poller in the console API* -
  rejected for the same reason plus a worse one: it would poll for projects nobody is
  looking at. *Show status but never speak* - rejected because the ask was explicitly that
  the assistant say what to do next; a status chip is something you have to remember to
  look at.
- **Consequences**: Watching stops when the tab closes, and resumes on the first poll when
  it reopens - the follow-up turn is fired at most once per project per session, guarded by
  a module-level set, so a remount cannot re-send it. The GitHub token is now read by the
  console API, not just by the agents, which widens what a compromised console process can
  read; it stays read-only and scoped to pull requests. Without a token the endpoint still
  returns the links, unwatched, because a link a human can click is worth more than a 404.
  Revisit when the Step Functions path is live: a webhook then becomes both cheaper and
  correct, and this browser poll becomes the local-dev fallback.

---

- **Status**: Accepted.
- **Context**: Blueprint's units of work went to GitHub as one issue each, and Review
  assigned Copilot to each issue separately. A coding agent session branches from one ref,
  and nothing was passing one, so every session branched from the default branch. Run
  against a real four-unit blueprint (widen a persisted schema, then write it, then read
  it back), this produced four pull requests that each redefined the same Pydantic model
  with a different field vocabulary - `attachment_id`/`filename` in one, `id`/`name` in
  another. `git merge-tree` confirms every pair conflicts. Worse than the conflicts:
  whichever merged first would make the others' persisted data unreadable. The dependency
  order was in the artifact all along - `UnitOfWork.depends_on` exists and the G2 gate
  validates it for cycles - and was simply dropped at the GitHub boundary.
- **Decision**: Add `core.delivery.plan_delivery`, which groups units into the pull
  requests that can actually be built independently: units that write a common file are
  merged, groups that end up mutually dependent after that merge are merged again, and the
  result comes back in build order. One group is one branch, one pull request, and the
  issues it closes. Groups that merely depend on each other stay separate and chain
  through `assign_copilot_to_issue`/`create_pull_request_with_copilot`'s `base_ref`
  parameter, which starts a session from a predecessor's branch. Exposed as a shared
  `plan_delivery` tool on both Blueprint (so it can see how many pull requests its
  decomposition implies while there is still time to change it) and Review (which does the
  hand-off).
- **Alternatives considered**: *Wave model* - file everything, assign only the units with
  no unmet dependency, and assign the next wave when the previous one merges. Rejected:
  it needs a merge watcher (webhook or poller, neither of which exists) and, to be
  autopilot, it needs the agent to merge - which AGENTS.md forbids outright, and that
  prohibition is the product. *Reject the blueprint* when two units collide, forcing the
  model to redecompose. Rejected: the decomposition was not wrong. Four units is the right
  way to *review* that change; it is the wrong way to ship it, and the gate can compute the
  difference instead of arguing with the model about it. *One issue with a checklist* -
  simplest, and it does avoid the collision, but it throws away the per-unit traceability
  to requirements and acceptance criteria that makes G2 reviewable. *Stacked pull requests
  for everything* via `base_ref` - keeps per-unit review, but a unit that cannot be merged
  and be useful on its own (widen a schema nothing writes yet) is not a shipping unit no
  matter how it is branched, and stacking adds a timing dependency on the predecessor's
  branch existing.
- **Consequences**: The common case collapses to one pull request, which is honest: most
  blueprints are one change seen from four angles. Grouping is only as good as each unit's
  `files` list, so a unit that names a file it merely reads will over-group - the Blueprint
  prompt says so, and the group's `files` are returned precisely so a human can audit the
  grouping. A group failing halfway leaves one pull request that claims to close several
  issues; the issues stay open until a human merges, and Review checks each unit's
  acceptance criteria against the single diff before G3. The merge gate is untouched -
  autopilot stops at "the pull request is open and CI is green", which is where a person
  was always meant to take over. Not yet done: nothing re-runs Review when a build pull
  request goes green, so a human still asks it to look.

---

- **Status**: Accepted.
- **Context**: `EvidenceLink` was `requirement_id` plus a free-text citation, so every
  citation looked equally strong. It stopped being true once two things landed: Distill
  now reads historical FSDs from the reference bucket for grounding, and stakeholders now
  answer questions in the console instead of submitting a document. A requirement traced
  to "ADVA-2011's FSD" and one traced to "page 3 of the submitted spec" are not the same
  claim, and the reviewer signing G1 had no way to tell them apart.
- **Decision**: Add `EvidenceLink.source`, one of `source_document` (the document under
  distillation), `stakeholder_answer` (someone answered in this conversation) or
  `reference_material` (a past FSD or live schema consulted for context). The G1 gate
  flags any requirement whose *only* evidence is reference material - that requirement was
  inferred from another project rather than asked for here. A stakeholder answer is a real
  citation and scores normally; it is weaker than a document, not absent.
- **Alternatives considered**: *More granular sources* (separating Confluence from Jira
  from S3, or live data from past FSDs) - rejected: they are all "the document we were
  given" or "context we looked at", the distinction that matters is provenance rather than
  transport, and four near-identical categories invites the model to pick noise. *Making
  the field required*, matching the rest of `StructuredSpec` - rejected because specs
  written before it exists would fail `model_validate`, be treated as an absent
  predecessor, and hold their blueprints at G2 for no reason; it defaults to
  `source_document`, which is what pre-existing evidence meant by definition.
- **Consequences**: The gate cannot tell an explicit `source_document` from an omitted
  one, so the default is a small hole the prompt has to hold shut - acceptable against
  breaking every stored spec, and closable later by making the field required once no
  in-flight project predates it. The check is deliberately narrow: only *sole* reliance on
  reference material is flagged, since citing a past FSD alongside a real source is
  exactly the grounding Distill was given that bucket for.

---

## 2026-09-04 - An intake turn is persisted but is not a document

- **Status**: Accepted.
- **Context**: With question cards in, Distill's first turn on a one-line request returns
  an empty `StructuredSpec` scoring 0.0 with questions attached. That artifact was being
  saved and then presented like any other: a card in the thread reading "0 requirements",
  a tab in the inspector, a 0% completeness bar, and a chat reply claiming "I've got a
  first draft going" followed by validator gaps no stakeholder can answer. The questions
  themselves sat in the artifact panel, which has a close button - so a project could be
  held at its station with the reason invisible.
- **Decision**: Keep persisting the intake turn, but stop presenting it as a document.
  A `hasContent` predicate over the artifact's own lists gates the thread card and the
  inspector entry; the reply text has an intake branch; and questions move out of the
  inspector to an interactive prompt above the composer, where picked options compose into
  a single message paired with the questions they answer. The predicate is deliberately
  "has content" rather than "has questions" - a spec at 0.6 with two open questions is a
  real draft and still shows normally.
- **Alternatives considered**: *Not persisting the intake turn at all* - the tidier store,
  and the first instinct. Rejected because the artifact is the record of the turn: a page
  refresh would lose a set of half-answered questions, and `_build_prompt`'s
  previous-draft section would have nothing to feed back, so the next turn would redraft
  from scratch. Losing work to a ⌘R is a worse failure than a zero-score row in DynamoDB.
  *Having the agent skip structured output on an intake turn* - not possible:
  `create_app` binds one output model per container and `agent_runtime.factory` errors if
  `structured_output` is `None`, so every turn must return the station's shape. The choice
  was only ever about persistence and presentation. *Leaving questions in the inspector* -
  rejected on the close-button bug alone, and because a question is an action rather than
  a document.
- **Consequences**: The store keeps one zero-score entry per intake turn, including in the
  version history that exists as an audit trail; intake turns are not audit-worthy, so if
  that history gets noisy the fix is to skip *versioning* an artifact with no content
  rather than to skip saving it. Answers are sent as plain text paired with their
  questions, which the agent re-reads on the next turn - nothing records which requirement
  came from an answered question rather than a source document, and at G1 sign-off that
  provenance still matters.

---

## 2026-09-04 - The architecture diagram is hand-rolled SVG, not Mermaid

- **Status**: Superseded by "2026-09-28 - React Flow and dagre for the console's canvases".
  The case against Mermaid still stands: the canvas renders from the structured artifact,
  never from a DSL string.
- **Context**: Blueprint's design became structured data (components, data entities,
  integration points, unit-to-component edges), which makes it drawable. A reviewer at G2
  can judge a picture far faster than a list. The obvious library for this is Mermaid.
- **Decision**: Derive the component graph in the console as a pure function over the
  stored artifact (`ui/console/src/lib/architectureGraph.ts`) and render it as plain SVG.
  Layout is layered by longest-path depth, which is enough for the three-to-eight
  components a real blueprint has; past twelve the view falls back to the list rather than
  drawing something unreadable.
- **Alternatives considered**: *Mermaid* - rejected on three counts. It renders from a
  string DSL, so the structured artifact would be serialized into text purely to be parsed
  back, losing type safety on the way; those strings contain model-generated component
  names, and feeding LLM output through a DSL parser is a materially larger attack surface
  than mapping typed fields onto elements React escapes for us (Mermaid ships DOMPurify for
  exactly this reason); and it is ~600kB for one view, plus a dependency entry, plus
  theming that never quite matches the console's own tokens. Its real advantage is
  auto-layout, which a graph this small does not need. *Generating the diagram server-side*
  - rejected for now as premature: the artifact already carries everything, and no consumer
  outside the console wants it. If Showroom later needs the same picture for a demo deck,
  the function moves to `core/` unchanged.
- **Consequences**: No new frontend dependency. The diagram is deterministic - the same
  artifact lays out identically every time, which matters when it is a view of a gated
  document rather than a sketch. Edge routing is simple bezier curves with no collision
  avoidance, so a dense graph can cross lines; the twelve-node ceiling is what keeps that
  acceptable, and a real layout algorithm is the answer if blueprints get bigger.

---

## 2026-09-04 - Stations ask with question cards, and plan before they act

- **Status**: Accepted.
- **Context**: The elicitation Distill was specified to do - "it plans and asks before it
  drafts, so gaps get closed by structured elicitation rather than by agent guesswork" -
  had never been built. What existed was the gaps loop, which emits validator prose
  (`requirement R1 has no business value (use case/ROI)`) written for a machine. Nobody
  answers that. And nobody types a filled-in FSD into a chat box either: a real first
  message is one sentence, from which the agent was expected to invent six requirements.
  Separately, a long agent turn had nothing anchoring it to what it set out to do, which
  is how a run ends up looking busy while drifting.
- **Decision**: Two additions, both shared by all four stations rather than special-cased
  for Distill. `CompletenessScore` gains `questions: list[OpenQuestion]`, so an agent that
  cannot proceed asks in a form a stakeholder can answer, and the console renders an
  intake turn (`score == 0` with questions) as cards rather than a 0% bar. `tools/planning.py`
  adds `track_plan`, called first by every agent with the whole plan each time. The gate
  computes `score` and `gaps` but only *bounds* `questions` - dropping duplicates and
  malformed entries, capping at four, and flagging a turn that drafts nothing and asks
  nothing - because what is worth asking a human is a judgment no validator can make.
- **Alternatives considered**: *A separate Intake station or a second output model* -
  rejected: `create_app` binds one output model per container, so it would mean a new
  station, entrypoint, port, `Station` value, GSI behavior, state machine branch and gate
  rendering, and it would solve the problem only for Distill when Blueprint (scaffold
  confirmation), Review (which repository?) and Showroom (live or recorded?) need the same
  thing. Putting questions on the shared `CompletenessScore` costs one field and works
  everywhere. *An `ask_user` tool* - rejected: a tool returns to the model within the same
  turn and cannot block for a human, so the ask has to be part of the artifact. *Letting
  the gate generate questions from gaps* - rejected: gaps are phrased for the machine, and
  mechanically rewording them produces exactly the unanswerable questions this is meant to
  avoid. *A stateful plan store keyed by session* - rejected: `agent.messages` is reset per
  invocation on a shared agent instance, so a module-level plan would leak across projects
  the same way conversation history would.
- **Consequences**: The intake turn holds at its station through the existing
  `_has_open_gaps` path, and answers return through `_build_prompt`'s previous-draft
  section, so no new plumbing was needed. Blueprint's post-approval "shall I scaffold this
  repository?" now has a mechanism waiting for it. The cap at four is a judgment call, not
  a measurement - it exists because a wall of questions is how clarification UIs die, and
  should be revisited with real usage. Nothing yet records *which* requirements came from
  an answered question rather than from a source document; at G1 sign-off that provenance
  difference matters, and `EvidenceLink` is the natural place for it.

---

## 2026-09-04 - Blueprint designs in structure, and reads the repo before it drafts

- **Status**: Accepted.
- **Context**: A live run produced a blueprint that called its two validators, passed
  both, and moved on - no repository scan, no architecture worth the name. Three causes.
  (1) `blueprint.yaml` ended with "Only touch GitHub when explicitly asked to", and every
  repo instruction was conditional on the user asking, so with a prompt of "Coach may
  begin" nothing fired - even though `GITHUB_PAT` was set and the tools were attached.
  (2) Distill's prompt says "even when not explicitly asked to, always look for related
  historical FSDs" and Review's says read-only lookups are "not a side effect requiring
  explicit permission"; Blueprint had the mirror-image instruction and nobody reconciled
  them. (3) The design was one free-text `architecture_summary`, and the G2 gate scored
  traceability only - so a blueprint with perfect requirement coverage and a one-sentence
  summary scored 1.0. The gate created pressure toward complete linkage and none toward
  design depth.
- **Decision**: Split GitHub posture by direction rather than by agent. Reads
  (`search_repositories`, `get_repository_tree`, `search_code`, `get_file_contents`)
  become proactive on every Blueprint run; writes (`create_repository`, `push_files`,
  `issue_write`) still need an explicit request. Add the design to the artifact as
  structure - `Component`, `DataEntity` (owned by a component, with typed `EntityField`s),
  `IntegrationPoint`, and `UnitOfWork.component_ids` - and score it: components are
  coverable units, a blueprint with units but no components is a gap, a unit that builds
  no component is a gap, and every requirement the spec classified `integration` must have
  an integration point covering it.
- **Alternatives considered**: *Give Blueprint every GitHub tool including writes* -
  rejected because Blueprint runs before G2, so scaffolding there creates a real,
  irreversible resource before the human authorized the plan that justifies it; the
  prohibition was protecting the gate, not being timid. *Move repository creation to
  Review* - rejected outright: it makes Review an author, and a Review that scaffolds is
  reviewing its own scaffold, which destroys the independence its coverage view depends
  on. Scaffolding belongs to a post-G2 build step, derived deterministically from the
  approved blueprint rather than improvised, so the created repo matches the signed plan
  by construction. *Enforce a minimum length on `architecture_summary`* - rejected as a
  bad proxy; structure is the honest forcing function, since a model can pad prose but
  cannot fake a component graph that has to reconcile with units of work.
- **Consequences**: The intent classification added at G1 finally has a downstream
  consumer. A greenfield project still gets nothing from the repo scan on its first pass -
  the repository does not exist yet - so design quality there rests entirely on the new
  fields; the scan pays off on brownfield work and on later passes. Blueprints written
  before this change have no components and will hold at G2 for a turn. Still open: the
  scaffold emitter that would turn an approved blueprint into a real repository, and any
  check that a delivered change matches the declared components, touchpoints or contracts.

---

## 2026-09-04 - The G2 artifact is a portable build contract, not a plan to be read alongside a chat

- **Status**: Accepted.
- **Context**: The intent is to hand Blueprint's output to *any* coding agent or plugin,
  not just GitHub Copilot via the MCP hand-off. A unit of work was `id`, `title`,
  `description`, `depends_on` plus the spec traceability edges - enough for a human
  reading it next to the spec, not enough for an agent receiving it alone with no memory
  of the conversation. Nothing told it which files to touch or what interface to expose,
  so the actionable detail lived in prose the gate could not check.
- **Decision**: Add `UnitOfWork.files` (`FileTouchpoint`: `path`, `change` of
  add/modify/delete, `purpose`), `UnitOfWork.contract_ids`, and
  `Blueprint.api_contracts` (`ApiContract`: `id`, `method`, `path`, `summary`,
  `requirement_ids`, `request_schema`, `response_schema`). `core/validation/blueprint.py`
  scores contracts as coverable units alongside requirements and acceptance criteria, and
  checks what is now checkable: paths start with `/`, no two contracts share a
  method+path, contract requirement ids resolve, units implement only declared contracts,
  and every unit names at least one file with no duplicates.
- **Alternatives considered**: *Embed a raw OpenAPI document* on the Blueprint - the most
  faithful to "OpenAPI contracts", but validating it properly needs a parser dependency
  (`openapi-spec-validator` or similar), and an unvalidated dict is just free text in a
  costume. An endpoint list is machine-checkable today with Pydantic alone and OpenAPI can
  be generated from it when something actually needs to consume one. *Predict the full
  post-build directory tree* - rejected: it goes stale immediately on brownfield work,
  where per-unit file touchpoints stay meaningful and are diffable against the eventual
  change. *Build the Build station and wire Copilot to it first* - rejected for now
  because it couples the line to one vendor's coding agent, which is the opposite of the
  goal; making the artifact portable is what lets any agent consume it, and the station
  can follow once there is a reason to automate the hand-off.
- **Consequences**: `GET /projects/{id}/artifacts/blueprint` now returns everything an
  external agent needs per unit, so the hand-off is a JSON read rather than an
  integration. Blueprints written before this change have no `files` and will be held at
  G2 for one more turn until units name their touchpoints - intended, since the whole
  point is that a unit without them is not actionable. Projects with no HTTP surface are
  unaffected: `api_contracts` stays empty and the denominator does not move. Still open:
  nothing yet diffs the delivered change against the declared touchpoints or contracts,
  which is the natural job of a Build or Review step once one exists.

---

## 2026-09-04 - Completeness is computed from the persisted artifact, not self-reported by the agent

- **Status**: Accepted.
- **Context**: Blueprint's chat looked convincing - it called `validate_units_of_work`
  and `score_blueprint_completeness`, got `{"valid": true}` and `{"score": 1.0}`, and
  declared itself ready for the G2 gate - but the result was structurally guaranteed.
  Every `@tool` validator takes id lists as arguments, authored by the same model whose
  draft they are meant to check, and nothing binds those arguments to the
  `structured_output` that `agent_runtime/factory.py` actually persists. A cooperative
  model can pass a self-consistent set of ids, get a clean bill of health, and emit
  something else. Two scorers were worse than advisory: `score_review_completeness` and
  `score_showroom_completeness` returned `1.0` for any non-empty input. Compounding it,
  `UnitOfWork` had no field recording which requirement a unit addressed, so G2 coverage
  was unverifiable in principle rather than merely unverified.
- **Decision**: Split validation into two phases and invert who is trusted. The existing
  tools stay as an in-loop self-correction affordance for the model mid-draft. A new
  `core/validation/` package holds pure functions that take the real domain models -
  `evaluate_spec`, `evaluate_blueprint`, `evaluate_review`, `evaluate_showroom`, behind
  an `evaluate_artifact(agent, content, predecessors)` dispatcher -
  and `api/routers/projects.py` replaces the artifact's `completeness` with that verdict
  before `_has_open_gaps` decides whether the station advances. `UnitOfWork` gains
  `requirement_ids` and `acceptance_criterion_ids` so coverage is read off the stored
  artifact. Dependency-cycle detection moved to `core/validation/graph.py` and the
  Blueprint tool now delegates to it, so the in-loop check and the gate cannot drift.
  `AgentConfig.temperature` exists but is unset by default: `global.anthropic.claude-sonnet-5`
  rejects the parameter outright (`ValidationException: \`temperature\` is deprecated for
  this model`), so `build_agent` omits the argument entirely unless a config sets it.
  Reproducibility for these agents therefore rests on the gate - an artifact is redrafted
  until its computed gaps close - rather than on sampling controls the provider no longer
  exposes.
- **Alternatives considered**: *Rewrite the tools to take whole artifacts* - would make
  the tool the single source of truth, but destroys the affordance of checking a
  half-finished draft mid-turn, and still leaves the model free to emit something other
  than what it validated. *Reject the invocation outright when validation fails* - too
  brittle for an elicitation loop whose whole design is "hold at the station and ask the
  human for what's missing"; a computed `gaps` list already produces that behavior.
  *Make gaps out of things the agent cannot fix* (Showroom gapping on a Review blocker,
  Review gapping on missing Copilot assignments when GitHub is unavailable) - rejected,
  because a gap the agent cannot close holds the project at that station forever. Both
  gates check only what the responsible agent can act on.
- **Consequences**: A station now advances only when the artifact itself earns it, so
  the G2/G3/G4 gates mean what they say. Predecessor artifacts written before a contract
  changed no longer parse and are treated as absent, which surfaces as an explicit "no
  approved spec was available" gap rather than a crash or a silent pass - existing
  in-flight projects will need one more turn at the affected station. Two things
  Blueprint's prompt asks for remain prompt-only and unverified: intent-aware sequencing
  and keeping correlated rules' units connected. Neither is expressible today because
  `GateCriterion` has no link back to a requirement, so a `RuleCorrelation` cannot be
  traced to the units implementing it. Adding that edge is the prerequisite if these
  should become real checks. Review still judges a deliverable it mostly cannot see -
  the GitHub read-only path in `review.yaml` is the only real grounding it has - so G3
  remains closer to a plan review than a code review until that is closed.

---

## 2026-09-04 - StructuredSpec gains business value, per-requirement acceptance criteria, rule correlations, and intent classification

- **Status**: Accepted.
- **Context**: Asked whether Distill's `StructuredSpec` already captured a
  requirement's business justification (use case/ROI), testable acceptance criteria,
  correlation between machine-readable rules, and an intent classification - the
  kind of context Blueprint needs to plan technical units of work well, not just
  requirement prose. It did not: `Requirement` was only `id` + `description`,
  `GateCriterion` scores the spec's own G1 quality (not per-requirement done-ness),
  and `MachineReadableRule` had no id to correlate against.
- **Decision**: Add four new artifacts to `core/domain/spec.py` - `BusinessValue`
  (`requirement_id`, `use_case`, `roi`), `AcceptanceCriterion` (`id`,
  `requirement_id`, `description`), `RequirementIntent` (`requirement_id`, `intent`:
  one of functional/non_functional/integration/reporting/compliance/data_migration),
  and `RuleCorrelation` (`id`, `rule_ids`, `description`) - as new required top-level
  lists on `StructuredSpec`, linked to requirements/rules by id rather than nested
  onto `Requirement` directly, matching the existing `gate_criteria`/`evidence`
  pattern instead of introducing a second shape. `MachineReadableRule` gained its own
  `id` so a `RuleCorrelation` has something to reference. Distill's prompt now
  extracts all four per requirement (EDM FSD's "User Story" section for `use_case`,
  "Value Add"/"Success Criteria" for `roi` and acceptance criteria) and validates/
  scores them via `tools/distill.py`. To keep each `@tool` function's argument count
  at or under Pylint's default of 5 (`PLR0913`/`PLR0917`), the four
  per-requirement id lists are passed as one `requirement_coverage: dict[str, list[str]]`
  argument (keyed by field name) rather than four separate flat list parameters, and
  rule-correlation validation is its own small tool, `validate_rule_correlations`.
  Blueprint's prompt now reads intent to size/order units of work, folds acceptance
  criteria into a unit's description as its definition of done, uses business value
  to justify sequencing and write an intent-aware architecture summary, and keeps
  correlated rules from being split across independently-landable units.
- **Alternatives considered**:
  - **Attach the new fields directly onto `Requirement`** (e.g.
    `requirement.acceptance_criteria: list[str]`): rejected - breaks the existing
    `gate_criteria`/`rules`/`evidence` pattern of separate linked lists, and the
    `RequirementIntent`/`RuleCorrelation` split still wouldn't fit cleanly onto
    `Requirement` (intent is 1:1 but rule correlation is many-rules-to-many).
  - **A single `dict[str, Any]` payload per tool call** instead of the typed
    `requirement_coverage` dict: rejected - loses concrete typing under pyright
    strict and gives the LLM a vaguer schema to fill in than named list arguments.
  - **`# noqa: PLR0913` on the wide tool functions**: rejected per AGENTS.md's stance
    on weakening lint rules - restructuring the arguments was possible without an
    exception, so that was preferred over suppressing the check.
- **Consequences**: `StructuredSpec`, `validate_structured_spec`, and
  `score_completeness` all changed shape - any external caller constructing a
  `StructuredSpec` by hand (there are none outside `tests/unit/test_domain_contracts.py`
  today) needs the four new required lists. `MachineReadableRule.id` is a new
  required field Distill must assign, distinct from `criterion_id`. Revisit if
  `RequirementIntent` needs more than the six seeded values, or if a fifth
  per-requirement coverage category shows up - `requirement_coverage`'s key set is
  the extension point, not a new positional parameter.

---

- **Status**: Accepted.
- **Context**: Distill's `s3_list_reference_documents` only lets the LLM browse
  historical FSDs by S3 key/category, so it can miss a relevant past FSD filed under a
  differently-worded category. Asked whether to add real semantic ("vectorize") search
  before this lookup always runs (see the unconditional-lookup change logged the same
  day in CHANGELOG.md).
- **Decision**: Add `providers/storage/embeddings.py` (Bedrock Titan Text Embeddings V2,
  cosine similarity) and a new tool, `s3_find_similar_reference_documents`, that ranks
  FSDs against a plain-language query using a precomputed `{key: embedding}` index
  cached at `fsds/_index.json` in the same bucket. The index is built/refreshed by a new
  standalone script, `scripts/build_fsd_index.py` (`make build-fsd-index`), run with the
  operator's own AWS credentials - not the agent's runtime role, which stays read-only
  (`s3:GetObject` only) on this bucket per the existing least-privilege bucket policy.
  Distill's prompt now tries `s3_find_similar_reference_documents` first and falls back
  to `s3_list_reference_documents` if the index is empty/stale.
- **Alternatives considered**:
  - **Snowflake Cortex `EMBED_TEXT`/vector table**: rejected for now - the repo only has
    a natural-language Cortex Agent client (`snowflake_query`), not a raw SQL/vector
    client, so this would mean adding a new Snowflake dependency and an ingestion
    pipeline just for this feature.
  - **No vectors, cache a short per-doc summary instead**: cheaper and simpler, but
    weaker at surfacing a relevant FSD filed under an unrelated-sounding category -
    rejected in favor of real similarity search since that was the specific gap raised.
- **Consequences**: A new script (not just bash) lives under `scripts/`, now included in
  pyright's `include` list. The index must be rebuilt manually after adding/removing
  reference FSDs - there's no trigger wired to S3 uploads yet; revisit if the reference
  library grows large/frequently-updated enough to need automatic reindexing (e.g. an S3
  event notification driving a Lambda).

---

## 2026-09-03 - S3 + DynamoDB: consolidate onto us-east-1, own the documents bucket, versioned single-table schema

- **Status**: Accepted. Supersedes the `orchestration_region`/`aws_region` split logged in
  "2026-08-27 - Console backend as a standalone FastAPI service, not another AgentCore
  Runtime" and the `ap-southeast-2` orchestration region referenced throughout the Phase 2
  entries below - both are now historical context, not current behavior.
- **Context**: The orchestration table and Distill's document bucket grew organically
  (manually-created table in `ap-southeast-2`, borrowed external `edma-ai-test` bucket)
  while IAM access to actually deploy the CDK stacks was blocked. Asked to design both
  properly before real deployment happens: single region, an owned bucket, and a schema
  that scales past the "one project, one artifact" case it was built to prove out.
- **Decision**:
  - **Region**: every resource (DynamoDB, S3, Step Functions, both Lambdas, the console
    API) now lives in `us-east-1`, matching Bedrock/AgentCore Runtime - no more
    cross-region split. The manually-created `ap-southeast-2` table is disposable (no
    real data) and gets recreated fresh, not migrated.
  - **Stateful resources split out**: `infra/stacks/storage_stack.py` now owns the
    DynamoDB table and a new dedicated S3 bucket (`RemovalPolicy.RETAIN` on both),
    injected into `OrchestrationStack`/`ConsoleApiStack` as real CDK cross-stack
    references instead of each stack re-deriving (or duplicating) the table name string.
  - **Environment-aware naming**: every physical resource name is built through
    `infra/stacks/naming.py`'s `resource_name(env, ...)` (e.g. `hyperdelivery-dev-projects`),
    with `env` read from CDK context (`-c env=`, default `dev`) - so a future `prod`
    environment can never collide with `dev`'s resources.
  - **Own the documents bucket**: a dedicated, CDK-managed, versioned, fully
    public-access-blocked bucket replaces the borrowed `edma-ai-test` bucket. AgentCore
    Runtime execution roles are created outside CDK and PowerUserAccess cannot attach a
    policy to an existing IAM role (no `iam:*`, see the entry below on
    `AWSPowerUserAccess`) - so read access is granted via an S3 *bucket* policy naming
    the role ARN as principal (an `s3:PutBucketPolicy` call, not an IAM write), scoped to
    the `documents/*` and `fsds/*` prefixes (Distill's inputs and its historical-FSD
    reference lookups, respectively).
  - **GSI2 replaces the Scan**: `list_projects` used a full table Scan (see "2026-08-29 -
    Project Portfolio dashboard" below) because the schema had no "all projects"
    partition key. Added `gsi2-all-projects-by-updated` (every `STATE` item carries a
    constant `gsi2pk`, sorted by `gsi2sk=updated_at`), so listing is now a single-
    partition Query, descending, instead of reading every item in the table.
  - **Artifact versioning**: `save_artifact` now writes an immutable
    `ARTIFACT_VERSION#<agent>#v<NNNN>` history item alongside the overwritten
    `ARTIFACT#<agent>` latest alias `get_artifact`/`list_artifacts` still read by default.
    New `list_artifact_versions` reads the full history.
- **Alternatives considered**: A sharded `gsi2pk` (e.g. hash-bucketed) for the
  all-projects index - rejected as premature; a single constant partition key is fine at
  this app's scale (an internal delivery line, not a public multi-tenant service) and a
  shard key adds real query complexity (fan-out reads) for a problem that doesn't exist
  yet. Migrating the `ap-southeast-2` table's data - rejected, nothing real depends on it
  (Phase 2 isn't deployed). A full separate CDK App/pipeline per environment - rejected
  as more than this repo needs today; env-suffixed naming within one App covers the
  "dev and prod don't collide" requirement without the extra pipeline machinery.
- **Consequences**: `Settings.orchestration_region` is gone - `aws_region` now covers
  every AWS call. `OrchestrationStack`/`ConsoleApiStack` are no longer standalone
  constructible without a `project_table` argument (existing infra tests updated
  accordingly). `AGENTCORE_ROLE_ARN` must be set in the environment `cdk synth`/`deploy`
  runs in for the bucket policy statement to attach - without it the bucket still
  deploys, just with no cross-role grant. Revisit the constant `gsi2pk` if the project
  count ever grows large enough to make that partition a throughput hot spot.


## 2026-09-03 - Rejecting a gate now actually sends the project back to the agent, with the reason as its next prompt

- **Status**: Accepted.
- **Context**: `GateConsole`'s "Send back" CTA existed everywhere a gate does (one
  shared component, rendered generically for every `kind: "gate"` station), captured a
  required comment, and recorded the rejection in the audit trail - but
  `ProjectRepository.record_decision`'s reject branch set `project.station = station`
  (the gate itself), never moving it back to the agent whose artifact was under review.
  The frontend's auto-advance only fired `if (pending.decision.approved && ...)`, so a
  rejection left the project stuck at the gate forever: the comment was recorded but
  never actually reached the LLM as a new prompt - only a UI polish question surfaced
  the gap ("where ever we have gate approval we need to have another cta to send back
  to llm right?"), which turned out to already have the CTA but not the wiring behind
  it.
- **Decision**: Added `core.domain.project.prior_station()` (mirrors `next_station()`,
  walks `Station`'s declaration order backwards) and used it in `record_decision`'s
  reject branch instead of leaving `station` unchanged. `useProjectsStore.decide()`'s
  auto-advance condition dropped its `pending.decision.approved &&` guard - it now
  fires whenever the resulting station is an agent station, approved or not - and
  builds the prompt as `Sent back: ${comment}` on rejection instead of the generic
  `"${label} may begin."` used on approval, so the reviewer's reason is what the agent
  actually sees on its next turn.
- **Alternatives considered**: Leaving rejection as a terminal, human-only state (open a
  new turn manually) - rejected, it defeats the point of requiring a comment on
  send-back if that comment never reaches the agent. A separate "resubmit" button
  instead of auto-advancing - rejected, it would duplicate `advanceProject`'s existing
  auto-invoke-on-approval behavior for no reason; a rejection is symmetrical to an
  approval in this respect, not a different action.
- **Consequences**: A rejected `blueprint_approval` now correctly lands back on
  `blueprint` (which re-runs, then naturally advances back to `blueprint_approval` via
  the existing `next_station` chain, same as any other agent turn) - not stuck at the
  gate. Renamed the test that had encoded the old (buggy) behavior:
  `test_record_decision_rejected_stays_at_same_station` ->
  `test_record_decision_rejected_returns_to_the_reviewing_agent`.

---

## 2026-09-04 - Review's Copilot hand-off is automatic, not ask-gated

- **Status**: Accepted. Amends "2026-09-03 - Consolidated the Handoff agent back into
  Review" below - that entry's agent-consolidation decision still stands; only the
  "only when explicitly asked" trigger condition changes here.
- **Context**: explicit direction to make Review invoke the Copilot hand-off itself
  rather than waiting for the user to ask for it in chat: "i want it to be in review
  agent and the bot should invoke it."
- **Decision**: `config/agents/review.yaml`'s system prompt now sends every
  blocker/major finding to `assign_copilot_to_issue` automatically whenever GitHub
  tools and a repository reference are available, as part of producing the
  `ReviewReport` - no explicit ask required. `assignments` stays empty only when there
  are no blocker/major findings or no GitHub/repo context. This does not bypass
  AGENTS.md's "do not remove or bypass a human approval gate": the G3
  `Station.REVIEW_APPROVAL` gate is unchanged and still reviews every assignment
  (including any `assigned: false` failure) before the project can advance - the human
  sign-off happens after hand-off, not instead of it.
- **Alternatives considered**: Keeping the ask-gated trigger (rejected per the explicit
  instruction above - it required the user to remember to ask Review for something
  the pipeline should do by default once a finding exists).
- **Consequences**: `tools/review.py::validate_copilot_assignments` and
  `core/domain/review.py::ReviewReport.assignments`'s comments updated to describe the
  new automatic trigger; no schema or tool-signature change. CHANGELOG.md's Review
  Copilot hand-off entry amended in place to drop the now-superseded "only when
  explicitly asked" - the append-only decisions log above (2026-09-03) is left as
  written, since it accurately describes what was true at the time.

---

## 2026-09-03 - Consolidated the Handoff agent back into Review

- **Status**: Accepted. Supersedes "2026-09-02 - Fifth station: Handoff (G4) assigns
  Review's findings to Copilot, gated on a new G3 sign-off" below.
- **Context**: the Handoff agent/G3-gate design (below) was built and live-tested
  successfully end-to-end (real repo, issue, and PR opened by GitHub Copilot's coding
  agent against `underarmour/ua-distill-agent`). After seeing it built out, explicit
  direction was to keep the original four-agent scope rather than carry a fifth
  agent/station for this: "why do we have 5 agents we need only the 4 we discussed
  about these will be taken care in review agent itself."
- **Decision**: Removed `AgentName.HANDOFF`, `Station.HANDOFF`/`HANDOFF_APPROVAL`, the
  `agent_runtime/handoff/` container, and `config/agents/handoff.yaml`. Review absorbed
  the capability directly: `CopilotAssignment` now lives in `core/domain/review.py` as a
  field on `ReviewReport` (`assignments: list[CopilotAssignment] = []`, empty unless
  explicitly asked for), `validate_copilot_assignments` lives in `tools/review.py`
  alongside `validate_review_report`, and `tools/github.py::review_github_mcp_client`
  replaces `handoff_github_mcp_client` with the same tool scope (`issue_read`,
  `issue_write`, `list_issues`, `search_issues`, `assign_copilot_to_issue`,
  `create_pull_request_with_copilot`; toolsets `issues,copilot`). No new station and no
  new gate - Review does this only when explicitly asked, the same "ask-gated"
  discipline Blueprint already uses for its own GitHub tools, not a standing G3
  sign-off.
- **Alternatives considered**: Keeping Handoff as designed (rejected per the explicit
  instruction above - the gate did work, but a fifth agent/station was judged more
  ceremony than the capability needed once the mechanics were proven out).
- **Consequences**: Reverted the backend domain/tools/agent-runtime/infra/CDK/console-UI
  surface (~20 files) back to the four-agent shape (`AGENT_STATIONS =
  {distill, blueprint, review, showroom}`, two approval gates). The real live-tested
  GitHub artifacts remain valid proof the underlying mechanics work - only which agent
  calls them changed. Review's system prompt (`config/agents/review.yaml`) now documents
  how to resolve a finding to an issue and call `assign_copilot_to_issue` before calling
  `validate_copilot_assignments`. The console UI's `HandoffView` was folded into
  `ReviewView` (the "Copilot assignments" section now renders from `ReviewReport.
  assignments` directly) rather than deleted outright, since the rendering itself was
  correct and still needed.

---

## 2026-09-03 - GitHub PAT for SSO-enforced orgs: classic + SSO-authorized, not fine-grained

- **Status**: Accepted. Amends (does not replace) the "GitHub connector: remote
  first-party MCP server..." decision below, which still stands for the transport/tool
  design - this only changes which *token type* `GITHUB_PAT` should hold when the target
  org enforces SAML SSO.
- **Context**: Verified live against the real `underarmour` GitHub org. A fine-grained
  PAT hit two errors that looked separate - `search_repositories` blocked by SAML SSO,
  `create_repository` 403 "need admin access to the organization" - and neither was
  fixable from the token side: fine-grained PATs have no post-creation "authorize for
  SSO" step (SSO authorization is bound in at *creation* time, contingent on already
  having a linked identity for that org), unlike classic PATs' explicit "Configure SSO"
  button.
- **Decision**: Switched `GITHUB_PAT` to a **classic** PAT with `repo` scope, SSO-
  authorized for `underarmour` via Settings > Developer settings > Personal access
  tokens (classic) > token > Configure SSO > Authorize. This resolved both errors at
  once - `create_repository` under `underarmour` then succeeded with no separate
  org-admin grant needed, confirming the "admin access" 403 was downstream of the same
  SSO/token-type gap, not a genuinely distinct permission problem. Verified full chain
  end-to-end: repo created, issue filed, `assign_copilot_to_issue` succeeded, GitHub
  Copilot's coding agent opened a real PR (github.com/underarmour/ua-distill-agent/pull/2).
- **Alternatives considered**: Getting an `underarmour` org admin to grant repo-creation
  rights to the fine-grained PAT directly (rejected as the first fix - would not have
  addressed the SSO block either way, and the classic+SSO token fixed both in one step
  without needing to involve an org admin at all). Sticking with fine-grained per GitHub's
  general security recommendation (rejected here specifically - SSO enforcement on the
  target org is a harder blocker than the coarser scopes of a classic token are a
  liability, for this connector's threat model).
- **Consequences**: `tools/github.py`'s permission-mapping guidance (see
  docs/decisions.md's GitHub connector entry and /memories/repo/mcp-architecture.md)
  should note classic-PAT `repo` scope as the working option for SSO-enforced orgs,
  fine-grained as the option for personal accounts/non-SSO orgs. No code changed - this
  is purely which token string goes in `.env`'s `GITHUB_PAT`.

---

## 2026-09-02 - Fifth station: Handoff (G4) assigns Review's findings to Copilot, gated on a new G3 sign-off

- **Status**: Superseded by "2026-09-03 - Consolidated the Handoff agent back into
  Review" above. Was itself "Accepted. Supersedes the Copilot-on-Blueprint half of
  '2026-09-02 - Copilot coding-agent hand-off added to Blueprint's existing GitHub
  connector' below" - that supersession still stands, only this entry's own status
  changed.
- **Context**: the plan calls for Review's findings to actually get fixed, not just
  reported. The initial idea (Blueprint calls `assign_copilot_to_issue` on request) only
  handed off *new* work, not fixes to *findings Review discovers later*. It also raised a
  real conflict: the requested design had Review spawn a Copilot session automatically
  the moment it found a blocker/major finding, with no human step first - which directly
  contradicts AGENTS.md's "do not remove or bypass a human approval gate. The gates are
  the product." That was flagged explicitly and resolved by gating instead.
- **Decision**: Added a fifth agent, Handoff (`AgentName.HANDOFF`, `core/domain/handoff.py
  ::HandoffReport`), sitting after Review and before Showroom. A new `Station.
  HANDOFF_APPROVAL` gate (G3, "Grade sheet sign-off" in the console UI) sits between them
  - so a human sees Review's findings and signs off *before* Handoff runs, not after.
  Handoff does not write or review code itself: for each blocker/major finding it
  resolves a GitHub issue (an existing one from Blueprint's units of work, or a new one
  for a purely structural finding) and calls `assign_copilot_to_issue`
  (`tools/github.py::handoff_github_mcp_client`) - GitHub's own Copilot cloud agent does
  the actual coding, in its own ephemeral environment. `assign_copilot_to_issue` was
  removed from Blueprint's toolset (it never fit Blueprint's "one issue per unit of work"
  job cleanly) and Blueprint instead gained brownfield read tools (`get_repository_tree`,
  `search_code`) so it can inspect an existing linked repo before drafting units of work,
  for enhancement/maintenance projects rather than only greenfield ones.
- **Alternatives considered**: Handoff generating/pushing code itself via our own
  Bedrock/Claude setup and git tools (rejected - GitHub Copilot's coding agent already
  does this, in a sandboxed GitHub Actions environment, with its own PR lifecycle; building
  a parallel code-writer would duplicate that for no benefit and take on real-code-change
  risk this repo doesn't need to own). Auto-triggering Handoff without a gate (rejected -
  the AGENTS.md conflict above). Keeping the hand-off on Blueprint (rejected - Blueprint's
  job is drafting the initial build; reacting to Review's findings is a distinct
  responsibility with its own trigger (G3 sign-off) and its own narrower tool scope).
- **Consequences**: A new Strands agent/station touches a lot of surface that must move
  together - `AgentName`/`Station` enums, `infra/stacks/orchestration_stack.py`'s state
  machine, `Makefile`/`scripts/dev_all.sh`/`deploy_agent.sh`, and the console UI's
  `lib/pipeline.ts` (persona "GM", station "Free Agency", Gate 3) - all updated in this
  change; keep them in sync if the line changes again. Assigning Copilot to an issue only
  works if GitHub Copilot's coding agent is actually enabled/licensed for the target
  repo/org (see the "GitHub Copilot coding-agent hand-off" entry below for the real-world
  prerequisites and the SSO/admin blocker already hit against the `underarmour` org).

---

## 2026-09-02 - Copilot coding-agent hand-off added to Blueprint's existing GitHub connector

- **Status**: Superseded by "2026-09-02 - Fifth station: Handoff (G4) assigns Review's
  findings to Copilot, gated on a new G3 sign-off" above - `assign_copilot_to_issue`
  moved from Blueprint to the new Handoff agent. The rest of this entry (why the remote
  MCP server + `issue_write`/repo-scaffolding half of the connector was built the way it
  was) still stands.
- **Context**: Phase 3 of the plan calls for "approved tasks become issues and are
  assigned automatically, one pull request per task" (docs/hyperdelivery-plan.md). With
  Blueprint already filing one GitHub issue per unit of work, the natural next step is
  handing a filed issue to GitHub Copilot's coding agent so it opens the PR - without
  standing up a fifth "Build" agent.
- **Decision**: Added `assign_copilot_to_issue` (the `copilot` toolset, remote-server
  tool - not a separate integration) to Blueprint's existing allow-list in
  `tools/github.py`/`config/agents/blueprint.yaml`, gated the same way as the rest of the
  connector: only when explicitly asked, one issue at a time, no default follow-on after
  filing issues. Same `GITHUB_PAT` auth already wired for repo/issue creation - no new
  credential or connector needed.
- **Alternatives considered**: `create_pull_request_with_copilot` (remote-only, skips
  the issue entirely and has Copilot open a PR directly from a problem statement) -
  rejected for now, since it bypasses the "one issue per unit of work" traceability
  Blueprint already establishes; `assign_copilot_to_issue` keeps the issue as the unit of
  work's durable record.
- **Consequences**: This only works if GitHub Copilot's coding agent is actually usable
  on the target repo - a paid Copilot plan, an org admin enabling the coding-agent policy
  (Business/Enterprise), the repo not opted out, and the token owner holding an assigned
  Copilot seat, all outside this repo's control. We already hit an analogous real-world
  gate testing repo creation against the `underarmour` GitHub org (SAML SSO + no admin
  access) - assigning Copilot there will likely need the same org-side authorization
  fixed first. Revisit `create_pull_request_with_copilot` if the issue-per-unit-of-work
  model turns out to be unnecessary overhead once this is used in practice.



- **Status**: Accepted.
- **Context**: Blueprint (and Review/Showroom) always opened with no spec to work from.
  The console UI's gate-approval handoff only ever sends a short instruction like
  "Blueprint may begin." (`useProjectsStore.ts`), and `advance_project`/
  `advance_project_stream` passed that straight through as the agent's whole prompt -
  never fetching the prior station's saved artifact. The agents' own deterministic
  completeness scorers correctly reported "no spec given" - that part worked as
  designed - but the handoff feeding them was the actual gap.
- **Decision**: `api/routers/projects.py` gained `_PREDECESSOR_ARTIFACTS` (a station ->
  list of predecessor agent names map: Blueprint needs Distill; Review needs Distill and
  Blueprint; Showroom needs Distill) and `_build_prompt`, which fetches each named
  predecessor's saved artifact and prepends its JSON content before the user's own
  instruction. Wired into both `advance_project` and `advance_project_stream`.
- **Alternatives considered**: Fixing it in the console UI instead (rejected - the
  backend already owns artifact storage and is the single place both the streaming and
  non-streaming endpoints share; duplicating the fetch-and-format logic in TypeScript
  would just be a second copy to keep in sync). Fixing the real Step Functions handoff at
  the same time (rejected - out of scope here: `infra/stacks/orchestration_stack.py`
  already tracks that gap explicitly as `TODO(ADVA-3015)`, a separate Phase 3 unit of
  work with its own JSONPath-based design, not a copy of this local-dev shortcut).
- **Consequences**: The local-dev bypass now matches what a real artifact-grounded
  handoff should look like closely enough to demo end-to-end. `_PREDECESSOR_ARTIFACTS` is
  a second place (besides each agent's own system prompt) that encodes "who needs whose
  output" - if a new agent or dependency is added, both must be updated together. ADVA-3015
  still needs its own implementation for the production path; this does not close it.



- **Status**: Accepted.
- **Context**: Blueprint needs to scaffold a project repo from the golden path template
  and file one GitHub issue per unit of work (docs/hyperdelivery-plan.md Phase 3: "GitHub
  for repositories, issues, and pull requests"). Needed a connector shaped like the
  existing Atlassian/Snowflake ones - least-privilege, no standing infra to run ourselves
  if avoidable.
- **Decision**: GitHub's official `github/github-mcp-server` has a *remote* hosted mode
  (`https://api.githubcopilot.com/mcp/`, plain streamable-HTTP, PAT as an `Authorization:
  Bearer` header, `X-MCP-Toolsets` header to restrict tool groups server-side) - used that
  instead of the local Go binary. `strands.tools.mcp.MCPClient(url=..., headers=...)`
  talks to it directly, no OAuth wrapper needed. `tools/github.py` further restricts
  Blueprint to a curated allow-list via `tool_filters` (create/scaffold repo tools,
  issue create/read/comment, PR create/read/update) - deliberately excludes
  `merge_pull_request`, `pull_request_review_write`, `delete_repository`, `delete_file`,
  `fork_repository`: merging and deleting stay human/CI decisions, not an agent's (AGENTS.md,
  "do not remove or bypass a human approval gate").
- **Alternatives considered**: The local Go binary via stdio (rejected - needs either a Go
  binary baked into the agent's own Docker image, or `docker run` from inside that
  container, i.e. Docker-in-Docker; the remote server needs neither and matches this
  repo's existing "no subprocess to manage" preference from the Snowflake PAT decision).
  A single shared GitHub MCP client across future consumers (rejected for now, same
  least-privilege reasoning as the Atlassian split - revisit when a second consumer, e.g.
  Review reading PR diffs, needs a different tool scope).
- **Consequences**: Requires a fine-grained PAT (`GITHUB_PAT`) scoped to only the
  repos/orgs Blueprint should touch, not a classic account-wide `repo`-scope token. No new
  infra to deploy or operate. If GitHub Enterprise Server is ever needed, the remote
  server doesn't support it (`github-mcp-server` docs) - would need to add the local
  binary path at that point.

---



- **Status**: Accepted.
- **Context**: Merging `origin/dev`'s `feat/dashboard` work into `feat/flow` pulled in
  `notebooks/distill_agent_tools.ipynb` (an exploratory scratch notebook, not previously
  run through `make check` on `dev`), which failed `ruff`'s format and lint gates with 89
  errors - mostly `print()` calls (`T201`), which is exactly what a notebook is for and
  not the "never `print`, use `logging`" convention that applies to `src/`.
- **Decision**: Added `"notebooks"` to `[tool.ruff] extend-exclude` in `pyproject.toml`,
  alongside the existing `cdk.out` exclusion.
- **Alternatives considered**: Rewriting the notebook's cells to satisfy `T201`/format
  rules (rejected - fighting a scratch/exploratory artifact's natural style against
  production-code lint rules is exactly the kind of "weaken a rule to make it pass"
  AGENTS.md warns against in spirit, just inverted: the rule doesn't fit the artifact,
  not the other way around).
- **Consequences**: `notebooks/` is now unchecked by `make check` entirely - anything
  added there won't be caught by CI. Acceptable since it's explicitly scratch/exploration
  space, not part of the shipped pipeline (`src/`, `tests/`, `infra/`). Revisit if a
  notebook's code is ever meant to be copied into `src/` verbatim - lint it before that
  copy, not as a standing exception.

---

## 2026-08-29 - Snowflake access for Distill: Cortex Agent, not a hand-built SQL tool

- **Status**: Accepted. Supersedes the initial implementation from the same session (a
  `snowflake_query`/`snowflake_list_tables` pair calling Snowflake's SQL REST API
  (`/api/v2/statements`) directly).
- **Context**: Distill needed to answer prompts that reference live Snowflake data (e.g.
  "the MATERIAL_IMAGES table") instead of only raw FSD text. The first implementation
  hand-built SQL (`SHOW TABLES`, `SELECT ... LIMIT`), required `warehouse`/`database`/
  `schema`/`role` config, and needed a follow-up `snowflake_list_tables` tool after a live
  test showed Distill guessing a wrong table name. The user then directed a full reversal:
  replace it with a call to Snowflake's own hosted Cortex Agent
  (`/api/v2/cortex/agent:run`, `code_toolset_all`), which can discover schemas/tables and
  run its own SQL inside a managed sandbox, over my objections that a custom tool gives
  tighter least-privilege, determinism and testability.
- **Decision**: `providers/storage/snowflake.py` calls the Cortex Agent's SSE endpoint with
  a plain-language question and a system-instructions string, and concatenates each
  `response.text` event's text into one string. `tools/snowflake.py` exposes a single
  `snowflake_query` tool with the least-privilege system prompt (read-only, no DDL/DML).
  Config dropped from 6 fields to 4: `SNOWFLAKE_ACCOUNT` and `SNOWFLAKE_PAT` are required;
  `SNOWFLAKE_DATABASE`/`SNOWFLAKE_SCHEMA` are optional scoping hints appended to the system
  prompt when both are set, otherwise the agent explores the whole account unscoped - the
  whole point of using Snowflake's own agent instead of hand-built SQL. Live testing
  against the real account surfaced two bugs the initial code (from following an assumed
  event schema) got wrong: the real SSE framing is separate `event: <type>` / `data: {...}`
  line pairs (not a nested `delta.type` field), including a non-JSON `data: [DONE]`
  sentinel; and the default httpx timeout (5s) is nowhere near enough because sandbox
  provisioning plus tool calls routinely take 30s+, so the client now sets an explicit
  120s timeout.
- **Deployment**: `scripts/deploy_agent.sh` forwards these configured values to the
  Distill AgentCore runtime through its environment variables. Account and PAT are an
  atomic pair: deployment fails when only one is set, while omitting both deliberately
  leaves the optional tool detached.
- **Alternatives considered**: Kept the hand-built SQL tool (rejected by explicit user
  directive - the maintenance cost of hand-rolled discovery/pagination/error-handling for
  every future data need outweighs the reduced attack surface, given the Cortex Agent's
  own sandbox is already scoped to the PAT's own Snowflake grants). A dedicated
  `snowflake_list_tables` tool to fix the wrong-table-name failure mode (rejected - the
  Cortex Agent's own discovery makes it redundant).
- **Consequences**: Distill's Snowflake integration is now far less code and needs no
  SQL-building/polling logic in this repo at all, at the cost of: slower responses (a real
  sandbox-backed agent call vs. a direct SQL query), a less deterministic/harder-to-unit-test
  data path (mocked at the HTTP/SSE boundary rather than at a typed query interface), and a
  wider effective permission surface per call (the Cortex Agent can run arbitrary read
  queries the PAT's role allows, not just the ones this repo's code explicitly wrote).
  Revisit if response latency becomes a real UX problem, or if a future agent needs
  writes/DDL (this tool is read-only by prompt instruction only, not by grant - a
  determined prompt injection could attempt DML/DDL if the PAT's underlying role allows it;
  true enforcement would need a read-only role/PAT, which was not verified this session).
- **Addendum (same day)**: An end-to-end run through the console confirmed the latency
  cost above is real, not theoretical - a single-table listing question took ~117s
  through the Cortex Agent, and `orchestration.local_agent_client.LocalAgentClient`'s
  hardcoded 120s timeout (proxying the local dev agent's `/invocations` call) tripped
  before the response arrived. Raised the Snowflake provider's own timeout to 240s and
  the local proxy's to 300s, so the proxy always outlives the call it's waiting on. This
  is the first concrete latency data point for the "revisit if latency becomes a real UX
  problem" trigger above - a ~2 minute wait for a single tool call is already borderline.

---

## 2026-08-29 - Project Portfolio dashboard: DynamoDB Scan instead of a new GSI

- **Status**: Accepted.
- **Context**: The console needed a "list every project" view (a portfolio dashboard,
  reachable from a new top-bar icon) but the projects table has no partition key that
  spans all projects - `pk=PROJECT#<id>` scopes everything to one project, and the only
  existing GSI (`gsi1-pending-by-station`) only surfaces projects sitting at an approval
  gate.
- **Decision**: Added `ProjectRepository.list_projects()` as a table Scan filtered to
  `sk = STATE` (excludes artifacts/decisions, which share the same partition), sorted by
  `updated_at` in Python rather than in DynamoDB. Backs a new `GET /projects` endpoint and
  the console's `/portfolio` route.
- **Alternatives considered**: A dedicated GSI with a constant partition key (e.g.
  `gsi2pk="ALL_PROJECTS"`) would scale better and avoid a full-table Scan, but this is a
  demo-scale factory line with a human-gated pipeline (tens of projects, not thousands) -
  provisioning a GSI for that is exactly the speculative infrastructure AGENTS.md warns
  against building ahead of an actual bottleneck.
- **Consequences**: Cheap to ship now, but a Scan's cost is O(table size), including
  artifacts/decisions it then filters out - revisit with the GSI approach above if the
  table grows large enough for the portfolio dashboard's latency or read-capacity cost to
  become noticeable.

---

## 2026-08-28 - Splitting station from crew: staff titles for the agents

- **Status**: Superseded by 2026-09-28 "Plain stage names around a named crew" (the crew
  names and faces carry over; the station, output and gate names do not). It had superseded
  2026-08-27 "The crew: naming the agents after the apparel line, not the code".
- **Context**: The apparel naming (Draft / Pattern / Fit / Showroom) was an improvement on
  the engineering ids, but every name was still a process noun, so the console read as a
  list of stages rather than a team: "Fit found 3 blockers" names a step, not a someone.
  The faces made this worse, not better - a face implies a person, and the label under it
  was a verb. The underlying mistake was that one string was doing two jobs: naming the
  place work happens *and* naming who does it.
- **Decision**: Split the two, and move the vocabulary to the arc an athlete goes through -
  a world Under Armour owns, and one where all four stages already exist:

  | Wire id | Station (place) | Agent (person) | Hands over |
  |---|---|---|---|
  | `distill` | Combine (ST 01) | **Scout** | Scouting report |
  | `blueprint` | Playbook (ST 02) | **Coach** | Call sheet |
  | `review` | Film Room (ST 03) | **Ref** | Grade sheet |
  | `showroom` | Gameday (ST 04) | **Host** | Run of show |

  `AgentMeta.label` became `AgentMeta.name` and now holds a staff title;
  `StationMeta.label` keeps the place. Gate 1 is the scouting report sign-off, Gate 2 the
  call sheet sign-off. Station chrome (the line, station bands, the rail chip) shows the
  station; anything speaking about a teammate (avatars, turn bylines, the composer, gate
  copy) shows the agent. Crests moved with the names: a scout's tick, a coach's X, tally
  marks, a mic.

  Still a display layer only - the wire ids, `Station`, `AgentName`, the config filenames
  and the API contract are untouched, so this stayed a `ui/console/` change.
- **Alternatives considered**: Locker-room handles (`Scout`, `Chalk`, `Tape`, `Mic`) -
  more distinctive and they double as the instrument each role is named for, but `Chalk`
  and `Tape` need explaining once and the console is not a surface where you get to explain
  things. Baltimore place-surnames (`Camden`, `Fells`, `Locust`, `Canton`) - read as real
  names and lean on UA's actual roots, but carry no signal about what the agent does.
  Keeping the stage words as the agent names - rejected; that is the problem being fixed.
  Renaming the backend ids to match - rejected, the mapping cost is one table and the wire
  id is what every log line and API path carries.
- **Consequences**: The gate copy now reads as a handoff between people - "Ref is done.
  Host starts when you sign" - which is the sentence the whole product is about. Two
  strings per agent instead of one is the cost, and the risk is that they drift; the
  landing roster deliberately shows both (`ST 01  SCOUT  Combine`) so the mapping is
  taught rather than assumed. `Ref` sitting in `Film Room` is the one seam - an official
  grading tape is replay review rather than film study - and if it reads wrong to users,
  the station is the cheaper of the two to rename.

## 2026-08-27 - The crew: naming the agents after the apparel line, not the code

- **Status**: Superseded by 2026-08-28 "Splitting station from crew: staff titles for the
  agents". The display-layer-only constraint it established still holds.
- **Context**: The console showed the backend's internal agent ids as user-facing names -
  "Distill", "Blueprint", "Review", "Showroom". Three of those are engineering words for a
  product being sold inside a sportswear company, and they describe what the code does
  rather than what the user gets. Grok Bot was raised as a reference: its bots are named
  by job in plain language ("Chief of Staff", "Talent Scout", "Inbox Manager"), which is
  what makes them read as teammates rather than functions.
- **Decision**: Name the four stations after the steps a garment actually goes through, and
  give each a face:
  - `distill` -> **Draft** (ST 01), hands over a **tech pack**
  - `blueprint` -> **Pattern** (ST 02), hands over a **cut plan**
  - `review` -> **Fit** (ST 03), hands over a **fit report**
  - `showroom` -> **Showroom** (ST 04), hands over a **showroom pack**

  Gate 1 becomes "Tech pack sign-off", Gate 2 "Cut plan sign-off", and `done` becomes
  "Off the line". Every string lives in `ui/console/src/lib/pipeline.ts`.

  **This is a display layer only.** The wire ids, the `Station` enum, `AgentName`, the
  config filenames and the API contract are all untouched, so the naming can be revised
  without touching the backend.
- **Alternatives considered**: Invented character names (Ani-style) - rejected, they carry
  no meaning and would need explaining forever. Job titles in the Grok mould ("Spec
  Writer", "Patternmaker", "Fit Technician") - closer, but longer, and a station on a line
  is not a person. Leaving the engineering names - rejected; "Showroom" was already an
  apparel term sitting in the codebase, which is the tell that the original naming was
  reaching for this and stopped at one word.
- **Consequences**: The vocabulary now teaches the model instead of hiding it: "Draft is
  done. Pattern starts when you sign" explains the gate without a glossary. The risk is a
  mapping cost for engineers, who see `distill` in logs and "Draft" in the UI; the
  `AGENT_META` table is the one place that mapping lives, and the wire id is still what
  every error message and API path carries.

## 2026-08-27 - Console visual signature: faces, the UA lockup, and one hazard stripe

- **Status**: Accepted. The crest motifs below were superseded by 2026-08-28 "Splitting
  station from crew"; the one-head-per-agent family rule and the blink-while-working rule
  still stand.
- **Context**: With the crew named, they needed to be recognizable. Two references were
  supplied: the Hyperdelivery concept page (an industrial factory line - hazard stripes,
  station numbering, italic uppercase headings, conveyor) and Grok Bot (avatars with eyes
  that react).
- **Decision**: Three borrowings, each with a rule:
  - **Faces.** One head shape per agent with a different crest drawn from apparel - a
    tailor's chalk stroke for Draft, a dart notch for Pattern, tape ticks for Fit, a hanger
    hook for Showroom - so the four read as a family. Eyes carry state, and **blink only
    while that agent is working**, which keeps the motion a status indicator rather than
    decoration.
  - **The UA lockup.** Italic uppercase heavy type, matching the wordmark, on station and
    gate names only. Never on body copy or control labels.
  - **The hazard stripe.** Used exactly once, on the gate header, where "work stops here
    until a person signs" is the literal meaning. Anywhere else it would be costume.
- **Alternatives considered**: The concept page's animated conveyor belt and rollers -
  rejected for the console; perpetual decorative motion is what Operate-mode guidance
  exists to prevent, and this surface is used all day. Keeping the earlier abstract craft
  glyphs (funnel, grid, crosshair) - they were more legible at 16px but carried no
  personality, which was the thing being asked for.
- **Consequences**: Draft's first crest was a hangtag arch, which read as a padlock and
  collided with the gate's lock icon; it was replaced with an off-centre diagonal chalk
  stroke. Faces need ~18px to read, so they sit at `size-4.5` and up rather than `size-3`.

## 2026-08-27 - Console redesign: semantic token layer, light-default dual theme

- **Status**: Accepted
- **Context**: A three-lens audit ([docs/console-redesign.md](console-redesign.md)) scored
  the console 7/20 on technical quality. The root cause was one mismatch: the color tokens
  were authored for a dark surface (`--color-ua-fog` is 9.1:1 on `ua-black`) and then the
  app was built light, where the same token is 2.1:1. `body` was `ua-black` while `App`
  rendered `bg-white`. That single conflict produced most of the contrast failures.
- **Decision**: Replace the eight raw brand colors with a semantic layer - surface, fg,
  line, accent, status and agent-identity tokens - in `ui/console/src/index.css`.
  Components may only reference semantic tokens; brand values stay as private primitives.
  Light is the default and ships in the HTML so the first paint never flashes; dark is
  authored as a sibling palette under `[data-theme="dark"]`, not derived by inversion.
  Both verified at >=4.5:1 against the darkest surface each token is actually used on -
  which is what the earlier "verified on the canvas" check missed by 0.05.
- **Alternatives considered**: Dark-first (originally recommended in the plan; the user
  chose light-default, and both are now first-class so the order only sets the default).
  Deriving dark by inverting lightness - rejected, it produces muddy mid-tones and would
  have needed per-component correction anyway. Keeping the brand tokens and fixing
  contrast case by case - rejected, it treats the symptom in ~20 places instead of the
  cause in one.
- **Consequences**: Changing the palette is a one-file change and a theme flip cannot
  silently break contrast. Costs a naming indirection: `text-fg-muted`, not
  `text-ua-steel`. Verified in a browser across both themes: 0 contrast failures, worst
  ratio 4.77 light / 4.85 dark.

## 2026-08-27 - Console frontend dependencies: icons, motion, primitives, router, fonts

- **Status**: Accepted
- **Context**: The console had zero UI dependencies. Every glyph was a hand-rolled inline
  SVG or a literal Unicode character (nine of those across seven files), motion was four
  CSS keyframes with no `prefers-reduced-motion`, there were no accessible primitives, and
  no routing at all - the selected project lived in `useState`, so a project could not be
  linked to a colleague.
- **Decision**: Add `@phosphor-icons/react` (one icon family, tree-shakes cleanly - the
  production bundle contains no unused icons), `motion` (state-carrying transitions and
  the gate handoff), `@radix-ui/react-{dialog,dropdown-menu,tooltip}` (focus trap, Escape,
  ARIA wiring), `react-router` (deep links to `/projects/:id`), and
  `@fontsource-variable/geist{,-mono}` self-hosted, replacing the render-blocking Google
  Fonts `<link>`.
- **Alternatives considered**: Hand-rolling a focus trap and menu - rejected, this is the
  category of thing that is always subtly wrong and Radix is unstyled so it costs no
  design control. `lucide-react` - the taste skill discourages it and Phosphor has the
  weight range this UI needs. Keeping icons hand-drawn - rejected except for the four
  agent marks, which are identity and have no library equivalent.
- **Consequences**: Bundle is ~800 kB minified / 240 kB gzipped, up from roughly 450 kB;
  most of that total is MSAL and React, and this is an authenticated internal console, not
  a landing page, so first-load weight is a weak constraint. Revisit with route-level code
  splitting if it grows further.

## 2026-08-27 - Gate decisions: authenticated signer and an undo window, not a confirm dialog

- **Status**: Accepted. Partially supersedes the free-text signer introduced in the
  "five console UX quick wins" entry below.
- **Context**: The signer on a gate decision was a free-text input remembered in
  `localStorage`, while the app already held a verified Entra ID identity through
  `useCurrentUser`. Anyone could sign as anyone, in the one record the product exists to
  produce. Separately, the audit asked for an "are you sure?" confirmation before an
  irreversible approval.
- **Decision**: Take the signer from the MSAL account and show it as identity rather than
  an input. Replace the proposed confirmation dialog with deliberateness by construction -
  the gate criteria must be acknowledged before signing, sending work back requires a
  reason - plus a twelve-second undo window before the decision is dispatched.
- **Alternatives considered**: A confirmation modal - rejected on craft grounds; the
  `impeccable` craft floor calls a modal for a task needing neither interruption nor
  protected focus a refusal, and undo costs nothing when the user is right while a modal
  taxes every correct decision. Type-to-confirm - too heavy for a routine gate.
- **Consequences**: The undo timer is client-side, so closing the tab inside the window
  drops the decision instead of sending it - the safe direction to fail for an audit gate,
  but not durable. **The backend still trusts the signer string it is sent**; closing that
  requires reading the identity from the validated token server-side. Both are recorded as
  open items in `ui/console/README.md`.

## 2026-08-27 - Agent attribution in the thread

- **Status**: Accepted. Partially supersedes the single-persona decision recorded in
  `ui/console/src/lib/pipeline.ts`.
- **Context**: The thread deliberately showed one "Assistant" persona across all four
  agents, because swapping the visible name per stage "made the conversation read like a
  form for an internal artifact-generation tool". But it also meant the four agents were
  invisible, and a reviewer could not tell which one produced what.
- **Decision**: Keep one continuous conversation and one composer, but stamp every turn,
  artifact tab and station node with the agent that produced it - each with an authored
  geometric mark and an identity hue. Station bands break the thread into chapters.
- **Alternatives considered**: Keeping one anonymous persona - loses the factory-line
  story the product is selling. Full per-agent personas with distinct voices - this is
  what the original decision correctly rejected; it fragments the conversation.
- **Consequences**: The original decision was right about *voice* and wrong about
  *attribution*; only the latter is reversed. Agent identity hues are now a semantic token
  group, with a rule that they never appear on interactive chrome so they cannot compete
  with the accent.

## 2026-08-28 - Entra ID (Azure AD) SSO, ported from Material_Library_AI_Assistant

- **Status**: Accepted
- **Context**: The console had no auth at all - anyone who could reach the API could see
  and mutate any project. Rather than design something new, ported the exact pattern
  already validated in `Material_Library_AI_Assistant` (frontend MSAL + backend ID-token
  validation), including its explicit design tradeoffs.
- **Decision**:
  - New Entra ID app registration ("Hyperdelivery Console - Dev", single-tenant, SPA
    platform type, no client secret), same UA tenant as Material Assistant's.
  - Frontend: `@azure/msal-browser` + `@azure/msal-react`. New `src/auth/`:
    `msalConfig.ts` (the `PublicClientApplication`), `idToken.ts` (`getIdToken()` -
    silent refresh, falls back to redirect on `InteractionRequiredAuthError`),
    `AuthGate.tsx` (gates the whole app behind a "Sign in with Microsoft" screen),
    `useCurrentUser.ts`. `main.tsx` now awaits `msalInstance.initialize()` +
    `handleRedirectPromise()` before the first render - required or the redirect-back
    from Entra never resolves. `api/client.ts` attaches `Authorization: Bearer
    <idToken>` on every call, including the `/advance/stream` SSE POST. Sidebar shows
    the signed-in user's name + a sign-out link.
  - Backend: new `api/auth.py` - `get_current_user` FastAPI dependency, JWKS fetched
    from `https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys` (`PyJWKClient`,
    `@lru_cache`d per tenant), `jwt.decode(..., algorithms=["RS256"], audience=client_id,
    issuer=".../{tenant}/v2.0")`. Applied as a router-level dependency on the whole
    `/projects` router (`APIRouter(..., dependencies=[Depends(get_current_user)])`)
    rather than per-route, so a new route can't accidentally ship ungated. New
    `entra_tenant_id`/`entra_client_id` settings fields; `pyjwt[crypto]` dependency.
  - Same explicit scope-limiting choice as Material Assistant: no custom "Expose an
    API" scope, no admin consent grant. The frontend sends its **ID token** (default
    `openid profile` scopes), and the backend validates it with `audience = the app's
    own client id` - sufficient proof of who signed in without a separate API-scope
    flow. `oid` (immutable per-user GUID) is the identity backend code should key
    anything off, not email.
- **Alternatives considered**: None seriously - this is a direct port of an
  already-decided pattern (see Material Assistant's 2026-08-11/08-13 decisions.md
  entries for the original tradeoff analysis: PKCE over Snowflake `externalbrowser`
  SSO, `oid` over email as a storage key, validating vs. merely reading the token).
- **Consequences**: 114 backend tests passing (9 new in `test_auth.py`: valid token,
  missing credentials, unconfigured tenant, wrong audience/issuer, expired token,
  tampered signature, missing `oid`; 1 new endpoint test confirming a real 401 without
  Authorization on the non-overridden app). Existing endpoint tests needed one change:
  the `client` fixture now overrides `get_current_user` via
  `app.dependency_overrides` (auth is exercised separately, those tests assume an
  already-authenticated caller). Frontend build/lint clean. Not yet verified with a
  real browser login round-trip (needs a human to click through the actual Microsoft
  sign-in page) - only unauthenticated 401s and the sign-in screen render were
  confirmed automated.

---

## 2026-08-27 - Verify the Entra JWKS fetch against the OS trust store

- **Status**: Accepted
- **Context**: Every request to the console API returned 401 on a UA machine, with
  `CERTIFICATE_VERIFY_FAILED: unable to get local issuer certificate` behind it. The
  browser sign-in succeeded because the browser trusts the corporate root CA from the
  macOS keychain; `PyJWKClient`'s server-side JWKS fetch used Python's bundled certifi
  store, which does not contain it, so no token could ever be validated. This is the same
  TLS inspection that forces `UV_SYSTEM_CERTS=1` for `uv`, surfacing in a second place.
- **Decision**: Add `truststore` as a runtime dependency and pass
  `truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)` to `PyJWKClient` in `api/auth.py`. It
  reads the OS trust store on macOS and Windows and falls back to OpenSSL's default paths
  on Linux, so the Lambda deployment is unaffected.
- **Alternatives considered**: Documenting `SSL_CERT_FILE` pointing at a keychain export -
  works, but every developer has to produce and re-produce that PEM by hand, and it is
  invisible until it breaks. Global `truststore.inject_into_ssl()` at API startup - fixes
  more than the bug, and quietly changes TLS behavior for boto3 and every other client;
  scope it back up if a second call site actually needs it. Disabling verification - no.
- **Consequences**: One new runtime dependency, already present in the lock file as a
  transitive dev dependency of `httpx2`. `truststore` ships `py.typed`, so pyright strict
  stays clean without a stub exception. Local dev needs no per-machine certificate setup.

---

## 2026-08-27 - Vendored three third-party design skill sets, prose only

- **Status**: Accepted
- **Context**: `ui/console/` is a real React/Vite frontend, but the repo carries no design
  guidance for agents working on it - `.github/skills/` held only `log-decision` and
  `sync-docs`. Three upstream skill sets were proposed: `leonxlnx/taste-skill` (13 skills),
  `pbakaus/impeccable` (a Claude Code plugin), and `jamiemill/layers-skills` (9 skills).
- **Decision**: Copy the useful subset into `.github/skills/`, flat, one folder per skill,
  named after each skill's own `name` field. Provenance, upstream commit and license for
  every vendored skill live in `.github/skills/THIRD_PARTY_NOTICES.md`, with license texts
  in `.github/skills/licenses/`.
  - taste-skill: 6 of 13. Skipped `brandkit`, `gpt-tasteskill`, both `imagegen-*`,
    `stitch-skill`, `output-skill` and `taste-skill-v1` - image generation, Google Stitch
    and a superseded version, none of which this repo does.
  - impeccable: `SKILL.md` + `reference/` only. Its 3 MB `scripts/` bundle (browser
    overlay, design detector, hooks) is not vendored, so `live`, `hooks`, `doctor` and
    pinning are removed rather than left as instructions that would fail.
  - layers-skills: all 9, verbatim. They cross-reference each other.
  - Each vendored skill folder is added to `cspell.json` `ignorePaths`; layers-skills is
    written in British English and would otherwise fail the `flagWords` gate on every run.
    `log-decision` and `sync-docs` stay inside the gate.
- **Alternatives considered**:
  - *Vendor everything, all 23 skills plus impeccable's scripts.* Rejected: 3.4 MB of
    bundled Node in a Python repo, and a skill catalog where most entries can never fire.
    Skill descriptions are loaded into every agent's context; unusable ones are a tax.
  - *Install impeccable as an upstream Claude Code plugin instead of vendoring.* Rejected
    for now because it does not give VS Code Copilot the skill; if someone needs live mode,
    that is the route, and the notices file says so.
  - *Git submodules instead of copies.* Rejected: skill discovery wants
    `.github/skills/<name>/SKILL.md`, and none of the three repos has that shape at its
    root. Pinning the upstream commit in the notices file gives traceability without the
    submodule tax.
  - *Exclude `.github/skills/**` wholesale from cspell.* Rejected: it would silently
    un-lint our own two skills. The exclusions name each vendored folder.
- **Consequences**: Agents get design and product-design guidance for `ui/console/`, at the
  cost of ~712 KB of vendored prose that will drift from upstream. There is no sync
  automation - re-vendoring is manual, against the commits recorded in the notices file.
  Revisit if a vendored skill starts fighting the house conventions in `AGENTS.md`, or if
  VS Code gains a first-class way to consume remote skills.

---

## 2026-08-27 - Five console UX quick wins: signer memory, pipeline stepper, sidebar filter/rename, global error toast

- **Status**: Accepted
- **Context**: Asked "what else can be done?" after the chatbox/sidebar polish passes.
  Picked five low-risk items out of a larger brainstormed list (declined: soft-delete/
  undo and real-time station polling, both flagged as needing real backend design work
  rather than a quick pass).
- **Decision**:
  - `DecisionComposer`'s signer name now persists to `localStorage` (key
    `hyperdelivery:signer-name`) so repeat approvals don't require retyping.
  - New `PipelineStepper` component in the workspace header shows all four agent
    stages (D/B/R/S) with done/current/upcoming state, and pulses the connecting line
    amber while a project sits at the gate between two stages - the station badge
    alone named the current step but didn't show overall progress.
  - Sidebar gained a filter-as-you-type input (only shown once there are >3 projects,
    to avoid clutter on a small list) and inline rename (pencil icon next to delete,
    same hover-reveal pattern) via a new `PATCH /projects/{id}` endpoint +
    `ProjectRepository.rename_project`.
  - New `ErrorToast` component subscribes to the store's existing global `error` field
    and renders a dismissible, auto-expiring (6s) toast - several guarded actions
    (Sidebar delete, LandingComposer create, the new rename) had no inline error
    display of their own, so a failure there previously just silently stopped loading
    with zero feedback.
  - While wiring the toast, noticed API error messages were the raw JSON response body
    (e.g. `{"detail":"project not found"}`) shown verbatim - `api/client.ts` now
    extracts FastAPI's `detail` field when present, so both the toast and the existing
    inline `ChatThread` error banner show a clean sentence instead.
- **Alternatives considered**: Undo-on-delete (needs a soft-delete/TTL backend design,
  not just UI) and real-time station updates (needs polling or a websocket instead of
  the current mount-only fetch) were both explicitly deferred as bigger efforts.
- **Consequences**: 105 backend tests passing (2 new: `rename_project` repository
  tests, `PATCH /projects/{id}` endpoint tests for the happy path/404/blank-name
  cases). Frontend build/lint clean. Verified live: approved a real gate (stepper
  updated D✓→B live), renamed a project from the sidebar (header + row both updated),
  and forced a genuine 404 by deleting a project out from under an open rename - the
  toast showed a clean `project not found` message alongside the existing inline
  banner. The `error` store field is shared across the whole app, so an unrelated
  action's failure can appear as an inline banner in whatever project happens to be
  open at the time (pre-existing behavior, now more visible via the toast) - worth
  scoping `error` per-surface if this proves confusing in practice.

---

## 2026-08-27 - Fixed two real streaming bugs found by re-testing "it still doesn't support streaming"

- **Status**: Accepted
- **Context**: User reported the landing-page chatbox still didn't stream. Investigation
  found the running `distill`/`blueprint`/`review`/`showroom` dev servers - and the
  console API and Vite dev server - all predated the streaming work by hours (confirmed
  via `ps -o lstart` vs file mtimes; `make dev-all`'s process tree had exited at some
  point without anyone noticing, so every "verified live" streaming test since then had
  actually been hitting stale, pre-streaming code). Restarting them surfaced two real
  bugs that a stale server had been masking:
  1. **Backend**: `advance_project_stream`'s `try/except` only wrapped the agent-stream
     loop, not the `repo.save_artifact`/`repo.advance_after_artifact` calls after it. An
     exception there (e.g. the AWS SSO session expiring mid-turn, which happened live)
     crashed the generator uncaught *after* the HTTP response had already started
     streaming - the client just sees the connection die
     (`net::ERR_INCOMPLETE_CHUNKED_ENCODING`), never a clean `{"error": ...}` event. Fix:
     the whole body of `event_stream()` is now one `try/except`.
  2. **Frontend**: `advanceProject`'s cleanup (`dropFailedTurns`) matched the user/
     streaming turns to remove by **object reference** - but `appendChunk` replaces the
     streaming turn with a new object (`{...t, text: ...}`) on every chunk, so reference
     equality broke the moment a single chunk had arrived before an error, leaving a
     permanently orphaned "frozen mid-stream" bubble in the conversation. Fix: `ChatTurn`
     now carries a stable `id` (`crypto.randomUUID()`), and all three places that
     match/replace turns (`appendChunk`, `dropFailedTurns`, the final swap-in) key off
     `id` instead of object identity.
- **Alternatives considered**: N/A - both were straightforward correctness bugs once
  found, not design tradeoffs.
- **Consequences**: Verified live end-to-end, twice, with real gaps this time (previous
  passes had happened to get 100%-complete specs on the first try, so the gaps-path
  reply text had never actually been seen live until now): typed a vague admin-dashboard
  request, watched "Using score_completeness..." / "Using StructuredSpec..." stream in
  live, got a genuine natural-language gap-asking reply
  ("I've got a first draft... but I still need... requirement REQ-4 has no linked
  evidence..."), answered it in a second turn, watched a second correct gap-asking reply
  stream in with no duplicate/stuck turns. Added a backend test for the
  previously-uncaught persistence-error path
  (`test_advance_stream_surfaces_persistence_errors_as_an_sse_event`). No unit test
  added for the frontend id-matching fix (would need a Vitest/RTL setup that doesn't
  exist in this project yet) - covered by this live verification instead.

---

## 2026-08-27 - Landing page is a chatbox; projects are named by Claude Haiku, not typed in

- **Status**: Accepted
- **Context**: The landing (no-project-selected) page was just a static empty state -
  noticed live ("the landing page seems empty why don't we add chatbox... let the
  project pick a name using haiku"). Starting a project required clicking "+ New
  project", typing a name, then separately typing the actual first message to Distill -
  two steps for one intent.
- **Decision**: `ProjectNamer` (`orchestration/project_namer.py`) generates a short
  Title-Case name from a message via Claude Haiku
  (`global.anthropic.claude-haiku-4-5-20251001-v1:0` - Bedrock's cheaper/faster model,
  distinct from Distill's Sonnet since naming is a trivial task) with a heuristic
  fallback (first 6 words) on any model/network failure - naming should never block
  project creation. `POST /projects` now accepts `name` OR `message` (400 if neither).
  Console UI: new `LandingComposer` on the empty state, `createProjectFromMessage`
  store action creates the project then fires the first Distill turn in the background
  (not awaited) so the UI navigates into the new project's workspace immediately and
  the user watches Distill's reply stream in live, rather than waiting on the landing
  page for the whole turn to finish.
- **Alternatives considered**: A "us."-prefixed cross-region Haiku inference profile -
  tried first, invalid outside its home regions; discovered via
  `aws bedrock list-inference-profiles` that this account's actual global Haiku
  identifier is `global.anthropic.claude-haiku-4-5-20251001-v1:0` (unlike
  `global.anthropic.claude-sonnet-5`, it keeps its full dated suffix - not a fully
  consistent naming scheme across model families, so don't assume one from the other).
- **Consequences**: Passed `callback_handler=None` to the naming `Agent` - Strands'
  default handler otherwise prints every token to stdout, which would spam the console
  API's server logs for a one-off naming call. Verified live end-to-end against real
  Bedrock: typed a description on the landing page, got auto-named "TableReserve",
  navigated straight into the workspace, watched Distill produce a complete spec and
  advance to blueprint_approval. Known minor issue (not fixed): the store's `loading`
  flag is global, so the landing composer can briefly show "Starting…" while an
  unrelated request (e.g. Sidebar's mount-time refresh) is in flight - self-resolves in
  under a second, not worth a per-action loading-state refactor at this scale.

---

## 2026-08-27 - Decluttered the sidebar project list

- **Status**: Accepted
- **Context**: Feedback live: "the chats on left seemed cluttered." Every row had a
  colored left border AND a bold colored badge (double-signaling the same "needs
  decision" state), plus an always-partially-visible delete icon - busy, and since most
  projects in this demo data all happened to be sitting at `blueprint_approval`, every
  single row rendered an identical loud red pill.
- **Decision**: Dropped the colored left border entirely (selected state is now just a
  plain `bg-white/10` highlight, no color). Only the two actual approval gates
  (`blueprint_approval`/`review_approval`) get a colored "G1"/"G2" pill now; agent
  stations (distill/blueprint/review/showroom) render as plain small gray text, `done`
  as a small green check - one loud color reserved for the one thing that's actually
  actionable. Delete icon reverted to fully hidden until row hover (`opacity-0
  group-hover:opacity-100`) instead of always-dimmed. Tightened row spacing
  (`gap-1`→`gap-0.5`, `py-2`→`py-1.5`).
- **Alternatives considered**: Splitting "your recent projects" from "other pending
  projects" into two lists again - rejected, that's the exact thing the previous
  merge-into-one-list decision fixed; the clutter here was visual weight, not structure.
- **Consequences**: Verified live - list is visibly calmer with the same information
  still present, just less shouting.

---

## 2026-08-27 - Delete a project (backend + console UI)

- **Status**: Accepted
- **Context**: No way to remove a project existed anywhere - noticed live ("why is
  there no delete projects options?"). Test/throwaway projects created during
  development had no cleanup path other than leaving them in the table forever.
- **Decision**: `ProjectRepository.delete_project(project_id)` queries everything under
  that project's `pk` (state, artifacts, decisions) and deletes each item - no GSI
  needed, mirrors the pattern already used by `list_artifacts`. New
  `DELETE /projects/{project_id}` (204, 404 if unknown). Frontend: `api.deleteProject`,
  a `deleteProject` store action that also prunes the project out of
  `recentProjects`/`projects`/`artifactsByProject`/`conversationByProject`/
  `pendingByStation`, and a delete (trash) icon per sidebar row with a
  `window.confirm` guard - deleting the currently-open project deselects it
  (`Sidebar`'s `onSelect` now accepts `string | null`).
- **Alternatives considered**: A custom confirm modal instead of `window.confirm` -
  rejected for now, native confirm is fine for a low-stakes internal console action;
  revisit if this needs to match the rest of the UI's styling.
- **Consequences**: Verified live end-to-end (created a project, deleted it via the
  sidebar button + confirm dialog, confirmed via a direct GET that it's actually gone
  server-side, not just removed from local state). 93 backend tests passing.

---

## 2026-08-27 - Artifacts panel is closable, chat can reclaim its width

- **Status**: Accepted
- **Context**: The artifact panel was always visible with no way to dismiss it - noticed
  live ("artifacts tab has no close button?").
- **Decision**: `ProjectWorkspace` now owns `panelOpen` state. `ArtifactPanel` gets a
  close (X) button; closing it un-mounts the panel entirely so the chat column expands
  to full width. `ChatThread`'s header shows a "Show artifacts" button (only when
  there's at least one artifact and the panel is currently closed) to bring it back,
  and clicking "View artifact" on any chat turn also reopens it.
- **Consequences**: Verified live - close hides the panel and widens the chat, "Show
  artifacts" and "View artifact" both reopen it correctly.

---

## 2026-08-27 - One continuous "Assistant" persona in chat, not per-agent identity

- **Status**: Accepted
- **Context**: Feedback after using it live: "it's still not a chatbot... it's thrown
  in the user's face." The composer literally said "Distill is waiting for input" with
  a Distill-specific placeholder, and finished turns read "Distill finished (80%
  complete)" - correct information, but it reads like a status readout for an internal
  pipeline tool, not a chat reply, and naming the internal agent by name every turn
  breaks the illusion of one continuous conversation.
- **Decision**: One fixed persona (`ASSISTANT_META` in `lib/pipeline.ts` - label
  "Assistant", single avatar/color) used in `AgentMessage`/`StreamingMessage`/
  `RunAgentPrompt` regardless of which internal agent is actually running - `AGENT_META`
  (D/B/R/S, per-agent colors) is kept only for the sidebar's station badges, not the
  chat itself. The composer dropped its "X is waiting for..." narration bar and
  per-agent placeholder examples entirely, replaced with a single generic "Message the
  assistant..." placeholder. Finished turns now show the assistant's own first-person
  reply via new `composeReply()` (`lib/formatArtifact.ts`) instead of a status line -
  "Done - "X" is complete and ready to move forward" when finished, or "I've got a
  first draft going, but I still need: <gaps>" when Distill flags something missing -
  with a secondary "View artifact →" link into the ArtifactPanel for whoever wants the
  structured detail.
- **Alternatives considered**: Keeping per-agent identity but softening the copy -
  rejected, the identity-switching itself (not just the wording) was the thing that
  broke the "one conversation" feel.
- **Consequences**: Verified live in the browser: composer shows one persona and a
  generic placeholder throughout a project regardless of station; a finished turn reads
  as a first-person reply ("Done - "Feedback Portal" is complete...") instead of a
  status card. The gaps-path wording is implemented and covered by the same
  `composeReply` logic but wasn't hit live in this pass (the test prompt happened to
  score 100% complete on the first try) - worth a follow-up live check with a prompt
  vague enough to trigger it.

---

## 2026-08-27 - Sidebar merges "needs a decision" into the project list as a gate badge

- **Status**: Accepted
- **Context**: The sidebar had a separate "Needs a decision" section duplicating
  entries that could also appear in "Recent" - splitting a project's status into its
  own section instead of just tagging it in place.
- **Decision**: One "Projects" list. Each row gets a small station badge on the right -
  agent stations reuse their existing initial/gradient (D/B/R/S), and the two approval
  stations get a distinct red "G1"/"G2" (gate) badge plus a red-tinted left border, so a
  project awaiting a decision stands out inline without a separate section. The list is
  the union of `recentProjects` (locally remembered) and whatever's currently pending at
  either approval station (fetched from the backend) - so a decision-needed project
  shows up even if this browser never visited it. `lib/pipeline.ts` gained
  `stationBadge()` for the label/color mapping.
- **Alternatives considered**: Keeping both sections but deduping entries between them -
  rejected, doesn't address the actual ask (one list, not two).
- **Consequences**: Sidebar now calls `loadProject` for every recent project on mount
  (to get its current station for the badge, since only `recentProjects`' id/name are
  persisted) - fine at current scale, revisit if the recents list grows large enough for
  this to matter. Verified live: badges render correctly (red G1 for blueprint_approval
  projects, still opens the same ChatThread/ArtifactPanel workspace on click).

---

## 2026-08-27 - Console UI splits chat from artifacts (Claude-Artifacts-style), instead of one inline card per turn

- **Status**: Accepted
- **Context**: Each agent's structured output (StructuredSpec/Blueprint/ReviewReport/
  DemoPackage) was rendered as one big inline card in the chat thread itself (summary +
  a "view raw output" JSON toggle). Feedback: this conflates the conversation with the
  deliverable, clutters the thread, and buries a finished artifact once the conversation
  moves on to the next station.
- **Decision**: Split into two panes. `ChatThread` (`AgentMessage`) now shows just a
  compact "Distill finished (100% complete) - <title>" notice with a "View artifact"
  button - no structured content inline anymore. A new `ArtifactPanel`, always visible
  alongside the chat, renders the selected artifact's structured content field-by-field
  (completeness as a progress bar + gap warnings, arrays as labeled lists, strings as
  paragraphs - generic over whatever fields a given agent's model happens to have, via
  `lib/formatArtifact.ts`'s `humanizeKey`/`renderListItem`), with tabs across agents that
  have produced one and a raw-JSON toggle. `ProjectWorkspace` (new) owns which agent's
  artifact is selected and auto-follows the newest one as it lands, without yanking the
  panel away from a manually-selected older tab.
- **Alternatives considered**: A modal/overlay for the artifact instead of a persistent
  side panel - rejected, a modal interrupts the conversation flow more than a pane that's
  just always there to glance at. Keeping the inline card and just trimming it down -
  rejected, doesn't solve "buried once the conversation moves on."
- **Consequences**: Verified live in the browser - chat stays short and scannable, the
  artifact panel picks up the newest StructuredSpec correctly and renders Requirements/
  Gate Criteria/Rules/Evidence as readable lists instead of a JSON blob. The panel is
  unconditionally visible (not `hidden lg:flex`) - fine for this internal console tool,
  revisit if it's ever used on a narrow viewport.

---

## 2026-08-27 - Local-dev agent invocation streams over SSE instead of blocking

- **Status**: Accepted
- **Context**: The console UI's chat composer had no visible feedback beyond a spinner
  for the whole agent turn - live testing surfaced this as "there's no streaming" and
  "the UX seems terrible." The underlying chain (AgentCore entrypoint -> LocalAgentClient
  -> console API -> frontend) was fully synchronous end to end.
- **Decision**: `agent_runtime.factory.create_app`'s entrypoint is now an async generator
  driven by Strands' `Agent.stream_async(..., structured_output_model=...)`, emitting
  `{"chunk": ...}` SSE events for any free text the model produces plus a
  `"Using <tool>...\n"` chunk the first time each tool is called, ending in exactly one
  `{"result": ...}` or `{"error": ...}` (BedrockAgentCoreApp streams any generator
  entrypoint as SSE automatically). `LocalAgentClient` gained `.stream()` (parses the SSE
  response) with `.invoke()` reimplemented on top of it for callers that just want the
  final result. Added `POST /projects/{id}/advance/stream` on the console API, proxying
  those events as SSE and only running the save-artifact/advance-station side effects
  once the final result arrives. The frontend's `advanceProject` now consumes this via a
  `fetch` + hand-rolled SSE reader (no EventSource - it can't send a POST body) and
  renders a live `StreamingMessage` bubble that accumulates chunks, swapped for the
  final `AgentMessage` once done.
- **Alternatives considered**: WebSockets - rejected, SSE is simpler and one-directional
  is all this needs. Keeping `/advance` non-streaming and only adding `/advance/stream` -
  kept both: `/advance` stays for anything that just wants the final result without
  touching the streaming plumbing, `/advance/stream` is what the console UI actually
  uses now.
- **Consequences**: Verified live end-to-end (curl straight to an agent's `/invocations`,
  then again through the console API, then through the actual browser UI) - the SSE
  transport is genuinely correct. One real limitation found this way: Distill (and any
  agent forced into `structured_output_model`) mostly goes straight to its structured
  tool output with no free text or visible tool-use event in between, so in practice it
  still often shows nothing until the single final chunk - the tool-use announcement
  chunk was added specifically to give *some* visible progress in that case. Getting
  genuine token-by-token prose out of Distill would need a system-prompt change (e.g.
  "briefly explain your reasoning before finalizing"), which is a product decision, not
  plumbing - not done here.
- **Bug found and fixed via this same live testing**: a failed `/advance/stream` call
  (e.g. the AWS SSO session expiring mid-request, which happened during testing) left
  its user turn permanently in `conversationByProject`, so retrying the same message
  produced a duplicate user bubble in the thread. Fixed by matching turns to remove by
  object reference (`t !== userTurn && t !== streamingTurn`) instead of by position, so
  a failed attempt cleans up both turns it added and a retry starts clean.

---

## 2026-08-27 - Distill gets read-only Jira, as a third scoped MCP client not a shared one

- **Status**: Accepted
- **Context**: Chatting with Distill and mentioning a Jira ticket surfaced "no tool
  exists to retrieve content from Jira" - correct at the time, since only Blueprint had
  Jira wired (full issue-lifecycle: search/get/transition/comment/create/update, for
  updating tickets after work is done). Distill had no way to use a ticket as an FSD
  source alongside Confluence/S3.
- **Decision**: Added `jira_read_mcp_client()` to `tools/atlassian.py` - a third factory,
  scoped to `["jira_search", "jira_get_issue"]` only (no lifecycle/write tools), wired
  into `agent_runtime/distill/main.py` alongside Confluence/S3. Updated Distill's system
  prompt to call `jira_get_issue`/`jira_search` when given a Jira issue key instead of
  raw FSD text, matching the existing Confluence-page/S3-key fallback pattern.
- **Alternatives considered**: Reusing Blueprint's existing `jira_mcp_client()` (already
  includes `jira_search`/`jira_get_issue`) - rejected: that client also grants
  transition/comment/create/update, which Distill has no business holding (least-
  privilege split already established for Confluence read vs. Blueprint's Jira write,
  same principle applies here).
- **Consequences**: Three separate `mcp-atlassian` subprocess instances now spawn per
  Distill invocation (Confluence read, Jira read, plus S3 - not MCP but same tool list) -
  fine at this scale (see /memories/repo/mcp-architecture.md for when to switch to a
  shared `streamable-http` service instead of per-process `stdio` spawns).

---

## 2026-08-27 - Multi-turn Distill elicitation loop + self-contained transcripts

- **Status**: Accepted
- **Context**: The plan explicitly describes Distill as asking before it drafts
  ("gaps get closed by structured elicitation"), but the previous single-turn design
  always advanced the station after one agent call regardless of completeness. Testing
  this also surfaced a real bug: the local dev agent's underlying Strands `Agent` object
  is a process-wide singleton that retains conversation memory across *every* project
  hitting that port - a second, unrelated project's vague prompt got a confidently
  "complete" answer purely from leftover context of an earlier project's conversation in
  the same process.
- **Decision**: `POST /projects/{id}/advance` now inspects the agent's result for a
  `completeness.gaps` list (only Distill's `StructuredSpec` has this concept) and only
  calls `advance_after_artifact` when there are none - otherwise the artifact is still
  persisted (so the gaps are visible) but the project stays at the same station,
  keeping the chat composer open for another turn. On the client, `useProjectsStore`
  builds a self-contained transcript (`lib/transcript.ts`) from the full recorded
  conversation for that agent + the new message, and sends *that* as the prompt -
  instead of relying on the local agent process's own hidden memory, which is shared
  across projects and therefore unsafe to depend on. `ChatThread` renders the full
  per-station turn history (`conversationByProject`, persisted client-side) as
  alternating user/agent bubbles, with `RunAgentPrompt` staying open across turns
  instead of disappearing after one exchange. Verified live: a vague prompt correctly
  came back at 33% completeness with explicit missing-info bullets and the station held
  at `distill`; answering those brought it to 100% and the station auto-advanced.
- **Alternatives considered**: Relying on the Strands agent's own built-in conversation
  memory instead of building transcripts client-side - rejected after the cross-project
  contamination bug above proved it unsafe for anything beyond a single, single-project
  demo session.
- **Consequences**: `_has_open_gaps` is a local-dev-only heuristic living in the router,
  not domain logic - agents without a `completeness` concept (Blueprint/Review/Showroom)
  always advance after one turn, since the plan doesn't describe an elicitation loop for
  them. Transcript-building is naive (plain `User:`/`Agent:` line concatenation, no
  token-budget awareness) - fine for a short PoC exchange, would need trimming/
  summarization for long-running conversations.

---

## 2026-08-27 - Console UI: real chat input instead of a no-input "Run agent" button

- **Status**: Accepted
- **Context**: The local-dev "advance" flow (previous entry) let you click "Run Distill"
  with zero input, which is nonsensical for an agent whose whole job is distilling
  requirements from *something* - it always produced a useless zero-completeness "unable
  to retrieve FSD" result. Correctly called out as "not a chat interface."
- **Decision**: `POST /projects/{id}/advance` now accepts an optional `{"prompt": ...}`
  body (`AdvanceRequest`), used verbatim as the agent's input instead of the
  `"Project {id}"` placeholder (which remains only as a fallback for callers that omit
  it). `RunAgentPrompt` is now a real composer (textarea + Send, per-agent placeholder
  copy), and the console records what was typed (`promptsByProject`, keyed
  `${projectId}:${agent}`, persisted to localStorage) so the chat thread renders it as a
  right-aligned "You" bubble before the agent's reply - genuinely conversational, not a
  single opaque action button. Verified live: typed a real feedback-portal requirements
  paragraph into Distill, got back a 100%-completeness `StructuredSpec` with 5 real
  requirements and gate criteria, correctly rendered as a chat exchange.
- **Alternatives considered**: Persisting the prompt server-side (e.g. as part of the
  Artifact or a new record) instead of client-side localStorage - more correct long-term
  (survives across browsers/devices, becomes real audit trail) but bigger scope for what
  is still a local-dev-only bypass path; revisit if/when this graduates into the real
  Step Functions flow, where the prompt should be an explicit part of the Task payload
  and worth persisting properly.
- **Consequences**: Prompt history is per-browser (localStorage), not per-project source
  of truth - clearing browser storage loses the visible "user turn" (the agent's own
  output is unaffected, since that's still fetched fresh from the API). Still only a
  single request/response turn per agent, not true multi-turn back-and-forth (Distill
  can't yet ask a follow-up question and wait for a reply) - the plan's "asks before it
  drafts" elicitation loop is a bigger feature, not attempted here.

---

## 2026-08-27 - Local-dev orchestration bypass: console API calls agent dev servers directly

- **Status**: Accepted
- **Context**: With Step Functions/AgentCore Runtime still undeployed (blocked on IAM),
  creating a project in the console UI left it stuck at `distill` forever - nothing ever
  invoked an agent or advanced the station, since `state_machine_arn` is unset locally and
  `POST /projects` only calls `start_execution` when it's configured. The PoC needs to
  actually demo agent progress without a full AWS deploy.
- **Decision**: Added `orchestration/local_agent_client.py` (`LocalAgentClient`), which
  POSTs directly to an agent's local dev HTTP server (`make dev-distill` etc., ports
  8080-8083 per the Makefile) using the same request/response contract as the real
  `agent_invoker.py` Lambda. Added `ProjectRepository.advance_after_artifact` (moves a
  project past an agent station once its artifact is saved) and
  `POST /projects/{id}/advance` (invokes the current station's agent, persists the
  result, advances the station) - available only when no state machine is configured
  (`state_machine_client is None`), 409s otherwise so it can never race with real Step
  Functions execution. Console UI shows a "Run \<Agent> (local dev agent)" button at
  whatever station a project is currently sitting at. Verified live end-to-end against
  real Bedrock + DynamoDB: Distill ran, produced a real `StructuredSpec`, the project
  advanced to `blueprint_approval`, and it appeared correctly in the console's pending
  list.
- **Alternatives considered**: Seeding canned/fake artifacts straight into DynamoDB for
  demo purposes - rejected, since actually exercising the real agent code path (Bedrock
  call, tool use, structured output) is more useful for a PoC than a static fixture.
- **Consequences**: This is explicitly local-dev-only glue, not a production path - it
  has no IAM scoping story and assumes the caller already has the agent's dev server
  running locally. Should be deleted once Step Functions is actually deployed, not
  extended. Also surfaced (not fixed, out of scope): the placeholder prompt
  (`"Project {id}"`, already flagged as Phase 3 scope) gives Distill nothing real to work
  from, so it currently always produces a zero-completeness "unable to retrieve FSD"
  result - real artifact-grounded prompts are still needed before this is demo-quality.

## 2026-08-27 - Artifact persistence: DynamoDB, not S3, one item per agent

- **Status**: Accepted
- **Context**: Starting the Phase 2 front end (project console, artifact review surface)
  requires somewhere to read the FSD/TDD/gap-report/demo-package content from - today
  `agent_invoker` gets a result back from AgentCore Runtime and drops it straight into the
  Step Functions execution's transient `$.<agent>_result` JSON path, never persisted, never
  exposed via the console API.
- **Decision**: Added `ProjectRepository.save_artifact`/`get_artifact`/`list_artifacts`,
  storing each agent's result as its own item in the existing single-table schema
  (`sk=ARTIFACT#<agent>`, one per agent per project, overwritten on rerun - not versioned).
  `agent_invoker.handler` now persists the result immediately after invocation. Added
  `GET /projects/{id}/artifacts` and `GET /projects/{id}/artifacts/{agent}` to the console
  API. Content is stored as a JSON string, not a native DynamoDB Map, because the agent
  output models (e.g. `CompletenessScore.score`) use plain Python floats, which the
  boto3 Table resource rejects outright (`Decimal` required) - JSON-encoding sidesteps that
  without forcing every domain model to route through `Decimal`.
- **Alternatives considered**: S3 for artifact bodies (as already used for Distill's
  *input* documents) - rejected for now: every current artifact is small JSON/text, and
  reusing the single-table pattern avoids standing up a second storage seam and its IAM
  surface before it's needed. Revisit when Showroom's demo package includes real binary
  assets (video/slides) - Phase 4 scope, not yet built.
- **Consequences**: No artifact versioning/history yet - approving a station overwrites
  the prior run's artifact for that agent, so there's no way to see what an earlier
  rejected draft looked like. Revisit if the review UI needs a diff/history view.
  `agent_invoker` now needs DynamoDB write access (`project_table.grant_write_data`) in
  addition to its existing AgentCore permissions.

## 2026-08-27 - Console UI: Vite + React + TS + Tailwind + Zustand, own package

- **Status**: Accepted
- **Context**: Phase 2's front end (project console, artifact review, approval surface,
  notifications) needed a real client against the console API's project/artifact/decision
  endpoints. No frontend existed yet - `ui/streamlit_app.py` is a manual per-agent HTTP
  test harness, not a console.
- **Decision**: New `ui/console/` package (Vite + React + TypeScript strict, own
  `package.json`/`pnpm-lock.yaml` - not a yarn/npm workspace member of anything else),
  matching the standard frontend stack: Tailwind v4 (via `@tailwindcss/vite`, CSS
  `@theme` tokens) and Zustand for the projects/artifacts/pending-approvals store. Talks
  to the console API via `fetch` (`src/api/client.ts`), base URL from
  `VITE_API_BASE_URL` (defaults to `http://localhost:8090`, matching `make dev-console`).
  Added `make dev-console-ui` and a `cors_origins` setting + `CORSMiddleware` on the
  FastAPI app (default `http://localhost:5173`) so the Vite dev server can call it
  cross-origin locally. UA brand colors (`ua-red #E4002B`, `ua-black`, `ua-carbon`,
  `ua-steel`, `ua-fog`, `ua-mist`, `ua-cloud`) as Tailwind theme tokens - restrained,
  red-as-accent-only, no `@ua/ua-web-components` dependency (private registry, not worth
  the auth/access setup for what's currently just an icon set - see armourhouse-ui
  investigation this session).
- **Alternatives considered**: Extending `ui/streamlit_app.py` - rejected, it's scoped to
  raw per-agent HTTP testing, not the actual multi-user console product surface (auth,
  routing, a real design system eventually). `@ua/ua-web-components` for UI primitives -
  rejected for now (private Artifactory package, `.npmrc.enc` auth unavailable in this
  environment); plain Tailwind + hand-rolled components is enough for the current 3-screen
  MVP (create/lookup, pending approvals, project detail with artifacts + decision form).
- **Consequences**: No router yet - single-page view-swap via local `useState`, fine for
  3 screens but will need `react-router` once artifact review/comment threads or a real
  navigation shape shows up. No listing endpoint for "all projects" exists on the console
  API (only `GET /projects/{id}` and `GET /projects/pending/{station}`), so the UI can only
  reach a project by creating it or knowing its ID - revisit if a full project index view
  is needed. Verified end-to-end locally: `pnpm build`/`pnpm lint` clean, CORS headers
  confirmed present on real (non-500) responses; DynamoDB-backed routes 500 locally only
  because of an expired AWS SSO session, not a code issue.

---

## 2026-08-27 - One executable gate (`scripts/precheck.sh`) shared by developers and CI

- **Status**: Accepted
- **Context**: CI ran `ruff check` and `pytest` as separate workflow steps, and never ran
  the `infra/` tests at all. Anything added to CI would have to be remembered separately by
  every developer, and the two definitions of "green" would drift.
- **Decision**: `scripts/precheck.sh` is the only definition of green: format, lint, types,
  tests, infra, secrets, printing a PASS/FAIL table and exiting non-zero on any failure.
  `make check` runs it and CI runs the same script with `--ci`. `--fix` applies the
  mechanical fixes first.
- **Alternatives considered**: Keeping discrete CI steps for a nicer GitHub UI - rejected
  because per-step annotations are worth less than the guarantee that local and CI agree.
  Making pre-commit the gate - rejected because type checking and the full test suite are
  too slow for a commit hook; pre-commit stays for fast mechanical checks only.
- **Consequences**: Adding a check means editing one file and it applies everywhere. CI
  output is a single job, so a failure needs the log read rather than the summary. Revisit
  if the suite gets slow enough to want parallel CI jobs.

## 2026-08-27 - Aggressive ruff plus pyright strict, with relaxations named at source

- **Status**: Accepted
- **Context**: Setting the engineering bar for a repo that will be largely written by
  coding agents. Lint was five rule families with no formatter enforcement and no type
  checker, so "good code" was a matter of reviewer attention.
- **Decision**: Ruff's full practical rule set including `D` (docstrings) and `ANN`
  (annotations), `ruff format` enforced, and pyright in strict mode. Where a third-party
  library's own typing is the blocker, the relaxation is a documented setting in
  `pyproject.toml` naming the upstream cause, rather than scattered `# type: ignore`.
  Three such causes are recorded: bedrock-agentcore types `.run`/`.entrypoint` loosely,
  strands' `@tool` declares an unparameterized `dict`, and boto3-stubs emits an overload per
  AWS service of which only the installed extras resolve. `infra/` additionally downgrades
  `reportArgumentType` because aws-cdk-lib's jsii stubs are self-inconsistent - its concrete
  `Function` does not satisfy its own `IFunction` protocol.
- **Alternatives considered**: A moderate rule set without `D`/`ANN` - rejected because
  docstrings are how an agent learns the codebase's intent, so they need to be enforced, not
  encouraged. mypy instead of pyright - pyright matches what Pylance already runs in the
  editor, so developers see the same errors as CI. `flake8-type-checking` (`TC`) - rejected
  outright: pydantic, FastAPI and strands all resolve annotations at runtime, so hoisting
  imports into `TYPE_CHECKING` blocks would break schema generation in ways tests would not
  reliably catch. Typing-only imports are placed in such blocks by hand instead.
- **Consequences**: New code has a high, machine-checked floor. The relaxations are visible
  in one file and can be removed as upstreams improve, rather than being invisible debt.

## 2026-08-27 - Documentation review is a build step, not a convention

- **Status**: Accepted
- **Context**: The README claimed the repo had "no control plane (Step Functions, gate
  manager)" long after Step Functions, the console API and the SDK had all shipped, and
  `.env.example` was missing four `Settings` fields. Asking people to remember had already
  failed once.
- **Decision**: Three layers. `tests/unit/test_docs_consistency.py` fails the build when
  `.env.example` drifts from `Settings`, or when an agent lacks a config file or a runtime
  entrypoint. The Definition of Done in `AGENTS.md` makes the review an explicit final step
  with a checklist of surfaces. The `sync-docs` skill executes that checklist for an agent.
- **Alternatives considered**: Generating `.env.example` from `Settings` - rejected because
  the prose explaining *when* each variable is needed is the valuable part and cannot be
  generated. A PR-template checkbox - rejected as unenforceable; a checkbox is ticked, a
  test is not.
- **Consequences**: The mechanical half of doc drift is now impossible to merge. The
  judgment half (is the README Status section still true?) still depends on the reviewer,
  but it is at least on a list. Extend the consistency test whenever a new mechanical
  invariant appears.

## 2026-08-27 - `AGENTS.md` as the single source of truth for AI tool instructions

- **Status**: Accepted
- **Context**: The team uses the GitHub Copilot coding agent, and may add other tools. Each
  tool wants its own instruction file, which invites four copies of the same conventions
  drifting apart.
- **Decision**: `AGENTS.md` at the root holds all conventions. `.github/copilot-instructions.md`
  is a thin pointer plus Copilot-specific workflow notes. `.github/instructions/*.instructions.md`
  add only path-scoped rules via `applyTo` frontmatter, and link back rather than restating.
- **Alternatives considered**: Copilot-instructions as the source of truth - rejected
  because it is tool-specific and invisible to humans reading the repo. Symlinking
  `CLAUDE.md`/`AGENTS.md` - deferred until a second tool is actually in use.
- **Consequences**: One file to update. Adding a tool means adding a pointer file, not
  duplicating conventions.

## 2026-08-27 - Flat `src/` layout retained rather than an installable package

- **Status**: Accepted
- **Context**: `src/` holds flat top-level packages (`config`, `core`, `tools`, ...) that
  only import via pytest's `pythonpath`, with `[tool.uv] package = false`. Package names
  like `config` and `tools` could collide with PyPI distributions, `py.typed` cannot apply,
  and `ui/` cannot import from `src/` because `streamlit run` does not extend `sys.path`.
- **Decision**: Keep the flat layout for now. Document the convention and its consequences
  in `AGENTS.md` rather than adding a `py.typed` marker that would do nothing while nothing
  is distributed.
- **Alternatives considered**: Refactoring to `src/hyperdelivery/` as a real distribution -
  correct long-term, but it touches every import, the Dockerfile and the CDK handler paths,
  and was judged too large to combine with the standards work.
- **Consequences**: The Streamlit harness duplicates a small amount of agent config, and
  Lambda dependency bundling (TODO ADVA-3015) stays awkward. Revisit when that bundling is
  tackled - the two changes belong together.

## 2026-08-27 - Coverage reported with a deliberately low floor

- **Status**: Accepted
- **Context**: Coverage was not measured at all. Setting a high bar immediately would either
  block the PR that introduced it or invite tests written to satisfy the number.
- **Decision**: Report coverage on every run and fail CI below 10%. Actual coverage is
  around 90%; the floor exists to catch a collapse, not to describe the target.
- **Alternatives considered**: 80% or 90% enforced immediately - rejected for now because
  the boto3-heavy seams would push people toward mock-shaped tests. Reporting with no
  threshold - rejected because nothing then stops coverage silently going to zero.
- **Consequences**: The number is honest rather than gamed. Ratchet the floor upward
  deliberately as the suite matures; it is one line in `pyproject.toml`.

## 2026-08-27 - Lambda glue for agent invocation and human-approval task tokens

- **Status**: Accepted
- **Context**: The state machine's Task states were `Pass` placeholders. Needed real
  integrations for (1) invoking each of the four agents' AgentCore Runtime endpoints
  (cross-region: state machine in ap-southeast-2, AgentCore Runtime in us-east-1) and (2)
  pausing on human approval while persisting the callback task token onto the project's
  DynamoDB item. Discovered along the way: CDK's `DynamoUpdateItem` does not support
  `integration_pattern=WAIT_FOR_TASK_TOKEN` - it's silently ignored (verified against the
  compiled aws-cdk-lib JS; DynamoDB Step Functions integrations are Request/Response only).
- **Decision**: Added `src/orchestration/agent_invoker.py` (a Lambda, resolves the
  AgentCore runtime ARN by name via `list_agent_runtimes` since it isn't known at CDK
  synth/deploy time, then calls `invoke_agent_runtime`) as the `LambdaInvoke` Task for
  Distill/Blueprint/Review/Showroom. Added `src/orchestration/persist_approval.py` (a
  second Lambda) as a `LambdaInvoke` Task with `integration_pattern=WAIT_FOR_TASK_TOKEN`
  for the two approval waits - it writes `task_token`/`station`/gsi1 pending-lookup
  attributes and returns immediately, while the execution itself stays paused until the
  console API calls `send_task_success`/`send_task_failure` (now wired into
  `POST /projects/{id}/decisions`, replacing the earlier TODO stub; `POST /projects` now
  also starts the execution). Both Lambdas get least-privilege IAM: `agent_invoker` is
  scoped to `bedrock-agentcore:InvokeAgentRuntime` on `runtime/hyperdelivery_*` only;
  `persist_approval` gets DynamoDB write on the project table only.
- **Alternatives considered**: `DynamoUpdateItem` directly with `WAIT_FOR_TASK_TOKEN` -
  not actually supported by the CDK construct/AWS service integration, would have deployed
  successfully but never paused. A single combined Lambda for both agent invocation and
  approval-persistence - rejected for clearer least-privilege IAM boundaries (one function
  never needs the other's permissions).
- **Consequences**: Both Lambdas still use an unbundled code asset (no real dependency
  packaging - deferred like `ConsoleApiStack`'s Lambda, since deploy is blocked on IAM
  regardless). Rejections currently fail the whole execution (`States.ALL` catch to a
  `Fail` state) - no resubmit/retry loop; revisit if that's needed before Showroom's
  iteration-loop work (Phase 3+) lands. Agent prompts are placeholders (`"Project {id}"`)
  until Phase 3 memory/retrieval work supplies real artifact-grounded prompts.

## 2026-08-27 - Decision-needed notifications come from persist_approval, not EventBridge

- **Status**: Accepted
- **Context**: Automated PR review of the above entry's changes flagged that the
  `StateEnteredRule` EventBridge rule was named/intended to notify "who owes a decision"
  per approval station, but its `event_pattern` only matched
  `"Step Functions Execution Status Change"` - an execution-level event (RUNNING/
  SUCCEEDED/FAILED/...), not a per-state-entry event. Investigated whether Step Functions
  emits any native per-state EventBridge event (it does not - confirmed against AWS's own
  docs; the reviewer's own suggested fix, `"Step Functions State Change"`, is not a real
  detail-type either) so the rule as designed could never have driven the notification.
- **Decision**: Publish the "decision needed" SNS notification directly from
  `persist_approval.py` (the Lambda that runs at exactly the moment an approval wait
  begins), granted `notifications_topic.grant_publish`. Renamed the EventBridge rule
  construct `StateEnteredRule` -> `ExecutionStatusRule` to accurately describe its
  remaining scope (execution-level status only, kept for future ops/observability use,
  not per-station notifications).
- **Alternatives considered**: Polling DynamoDB's pending-approval GSI on a schedule to
  detect new waits - rejected as unnecessary latency/cost when the Lambda that creates the
  pending state can just publish inline.
- **Consequences**: Notification delivery is now coupled to `persist_approval`'s own
  success - if it throws after the DynamoDB write but before the SNS publish, the wait is
  still correctly persisted but no notification fires. Acceptable for now (the console can
  still poll/list pending approvals); revisit with a dead-letter queue or at-least-once
  retry if that gap matters in practice.

## 2026-08-27 - PR-review fixes: decision-write ordering, terminal state, response guard

- **Status**: Accepted
- **Context**: The same automated PR review flagged three more issues in the Step
  Functions glue: (1) `ProjectRepository.record_decision` wrote the DECISION audit item to
  DynamoDB *before* checking whether the project existed, risking orphaned audit records
  for unknown project IDs; (2) the domain model's station line (`core.domain.project`)
  ends in a terminal `"done"` station, but the Step Functions definition ended at
  `Showroom` with nothing ever writing `station="done"`; (3) `submit_decision` called
  `_to_response(repo.get_project(project_id))` on a final re-fetch with no `None` guard,
  risking an unhandled `AttributeError` if the project vanished between the two fetches.
- **Decision**: (1) Reordered `record_decision` to fetch and validate the project first,
  raising immediately if missing, before writing the Decision record. (2) Added a
  `MarkDone` `DynamoUpdateItem` Task (plain Request/Response - not a wait, so no callback
  pattern needed) after `Showroom` in the chain, setting `station="done"` and removing the
  now-irrelevant `gsi1pk`/`gsi1sk` GSI attributes. (3) Added an explicit `None` check in
  `submit_decision` that raises `HTTPException(500, ...)` instead of crashing.
- **Alternatives considered**: None of these had a real alternative design - they're
  correctness fixes, not tradeoffs.
- **Consequences**: None beyond the fixes themselves. Two other review comments (hardcoded
  AWS account ID in `scripts/iam/agentcore-trust-policy.json` and
  `agentcore-execution-policy.json`) were deliberately left as-is: this is a genuine
  single-account project and those are the actual files used for the real admin IAM grant
  request, not a reusable public template - parameterizing them would add templating
  complexity for no benefit here.

## 2026-08-27 - One core service, two integration seams, for multi-interface support

- **Status**: Accepted
- **Context**: The console API will eventually need more than one client (web console UI,
  a CLI, and possibly future integrations like a Slack/Teams bot), plus at least one
  streaming/push use case (chatbot-style token streaming, approval notifications). Needed
  a shape that adds new interfaces cheaply rather than growing bespoke backend logic per
  client.
- **Decision**: Keep exactly one place for business logic (`ProjectRepository`, and future
  services like a `ChatService`) behind exactly two integration seams: (1) a
  request/response seam (the HTTP API) for anything synchronous, and (2) a push/event
  fan-out seam (the existing SNS/EventBridge notification topic, extended later with a
  WebSocket API Gateway + connections table) for anything server-initiated. Added
  `src/sdk/python/` (`HyperdeliveryClient`, mirroring `ua-ai-platform`'s `sdk/python`
  convention) as the one client every interface (CLI, web UI, future integrations) should
  depend on instead of hand-rolling HTTP calls.
- **Alternatives considered**: Letting each interface (web UI, CLI) call the API directly
  with its own request-building code - rejected because it duplicates auth/retry/schema
  logic per client and drifts as the API evolves. A separate backend-for-frontend per
  interface - rejected as unnecessary complexity until a real interface-specific need
  (e.g. GraphQL for the web UI) actually appears.
- **Consequences**: New interfaces should almost never require new backend surface - a
  Slack bot, for instance, is just another SDK consumer plus an SNS/EventBridge
  subscriber, not new business logic. The WebSocket connections table/broadcast Lambda
  and a `ChatService` for streaming are still unbuilt - tracked as follow-up work, not
  yet implemented.

## 2026-08-27 - Console backend as a standalone FastAPI service, not another AgentCore Runtime

- **Status**: Accepted
- **Context**: Phase 2 needs a thin API for creating projects, reading their DynamoDB
  state projection, and submitting approvals - none of which is agent inference, so it
  doesn't belong behind the `/invocations` AgentCore Runtime contract the four agents use.
- **Decision**: Added `src/api/` (FastAPI, mirroring `ua-ai-platform`'s `main.py`/
  `routers/`/`schemas/` convention this repo forked from) as its own process, run via
  `make dev-console` / `uv run uvicorn api.main:app`. State lives in a new
  `ProjectRepository` (`src/infrastructure/repositories/`) wrapping the DynamoDB table
  from the orchestration CDK stack, with domain rules (station order, transitions) in
  `core/domain/project.py`. Table name/region are separate `Settings` fields
  (`projects_table`, `orchestration_region`) from `aws_region`, matching the existing
  intentional us-east-1 (Bedrock)/ap-southeast-2 (orchestration infra) split.
- **Alternatives considered**: Adding these endpoints as a fifth `agent_runtime/` app -
  rejected, since AgentCore Runtime's contract (`/invocations`, `/ping`) is
  agent-inference-shaped and would force CRUD/query traffic through an interface that
  doesn't fit it. Using `moto` to mock DynamoDB in tests - rejected in favor of this
  repo's existing convention (see `test_s3_storage.py`) of a small hand-written stub
  client, avoiding a new dev dependency for a handful of tests.
- **Consequences**: The approval endpoint (`POST /projects/{id}/decisions`) is currently
  a stub for the Step Functions callback - it advances the DynamoDB station but does not
  yet call `SendTaskSuccess`/`SendTaskFailure`, since no state machine is deployed (see
  `TODO(ADVA-3015)` in `api/routers/projects.py`). Must be wired up once the CDK stack
  actually deploys. The manually-created `hyperdelivery-projects` table (see prior entry)
  still needs CDK reconciliation before this and the CDK stack can coexist safely.

## 2026-08-27 - Step Functions + DynamoDB for Phase 2 orchestration

- **Status**: Accepted
- **Context**: Phase 2 needs a per-project state machine that sequences the four agents,
  survives a multi-day human approval wait, and keeps an audit trail (FSD/prompt/model
  version, signer) per decision - none of which exists yet.
- **Decision**: Use AWS Step Functions **Standard** workflows (not Express - supports
  executions up to 1 year) as the state machine, with the `waitForTaskToken` callback
  pattern for the human-hold/approval steps. DynamoDB holds the queryable project
  projection (current station, artifact versions, pending task tokens) since Step
  Functions execution history alone isn't efficient to query for "where is project X."
  EventBridge rules on Step Functions state-entered events drive notifications (who owes
  a decision) via SNS/SES. Each task state invokes the existing per-agent AgentCore
  Runtime `/invocations` endpoint - no change to the agents themselves.
- **Alternatives considered**: A custom Lambda/DynamoDB-only state machine - rejected
  because it would reinvent callback-token bookkeeping, retries, and execution history
  that Step Functions provides natively, for a workflow that genuinely needs multi-day
  durable waits.
- **Consequences**: Ties orchestration to a proprietary AWS service (harder to test
  locally, per-transition cost) in exchange for not hand-rolling durable human-in-the-loop
  waits and audit history. The project console (Phase 2 front end) becomes a thin client
  over the DynamoDB projection + an approval endpoint that calls `SendTaskSuccess`/
  `SendTaskFailure` - no orchestration logic in the frontend.

## 2026-08-26 - No AgentCore Memory/Gateway/Identity yet

- **Status**: Accepted
- **Context**: Bedrock AgentCore offers Memory, Gateway (MCP tool federation), and
  Identity (credential vending) beyond the Runtime HTTP contract. None are adopted.
  Static long-lived Atlassian API token in `.env` is the one concrete cost of skipping
  Identity today.
- **Decision**: Only use AgentCore Runtime (the `/invocations`/`/ping` HTTP contract) for
  now. Defer Memory/Gateway/Identity to the plan's Phase 3 ("Memory, MCP and
  Integrations").
- **Alternatives considered**: Adopt Gateway now for the Confluence/S3 tools instead of
  hand-rolled `@tool` wrappers - rejected because Gateway requires provisioning real AWS
  infra (Gateway + Gateway Target + IAM role) that doesn't exist yet, and no second
  consumer of these tools exists yet to justify centralizing them.
- **Consequences**: Revisit Identity specifically (not just Gateway/Memory) sooner than
  Phase 3 if the static Atlassian PAT becomes a real audit/security concern.

## 2026-08-26 - Register a real OTel TracerProvider at startup

- **Status**: Accepted
- **Context**: `bedrock_agentcore.runtime.tracing` auto-registers a `BaggageSpanProcessor`
  on every request, but silently no-ops against the default `ProxyTracerProvider` when
  nothing has called `trace.set_tracer_provider(...)`. Installing `opentelemetry-sdk`
  alone doesn't fix it - the provider still has to be set explicitly.
- **Decision**: Added `infrastructure/observability/tracing.py`'s `configure_tracing()`,
  called once in `factory.create_app()`, which sets a plain `TracerProvider()` unless one
  is already registered (so the managed Runtime environment's own provider, if any, wins).
- **Alternatives considered**: Rely on the managed AgentCore Runtime to inject a real
  provider at deploy time and ignore the local warning - rejected because it left local
  dev with zero tracing and a recurring swallowed exception in every startup log.
- **Consequences**: No exporter is configured yet, so spans aren't shipped anywhere -
  this only makes the existing auto-instrumentation hook functional instead of dead code.

## 2026-08-26 - Log invocation results at DEBUG, not INFO

- **Status**: Accepted
- **Context**: `agent_runtime/factory.py`'s `agent_invocation` only logged lifecycle
  events (started/succeeded/error), giving zero visibility into what an agent actually
  returned - which made diagnosing the `MaxTokensReachedException` bug harder than it
  needed to be.
- **Decision**: Log the full `result.structured_output.model_dump()` at `DEBUG`, gated
  behind `LOG_LEVEL=DEBUG` in `.env`.
- **Alternatives considered**: Log at `INFO` by default - rejected because results can
  contain full FSD/spec content, and dumping that into stdout by default is an
  unnecessary default-on data exposure.
- **Consequences**: Debugging a live agent requires remembering to set `LOG_LEVEL=DEBUG`
  first; this is an accepted tradeoff over always-on verbose logging.

## 2026-08-26 - Explicit `max_tokens` on every agent's `BedrockModel`

- **Status**: Accepted
- **Context**: `BedrockModel(...)` silently omits `maxTokens` from the Bedrock Converse
  API request if not set, falling back to a default too low for a real multi-entry
  `StructuredSpec` - this passed short smoke-test prompts but crashed
  (`MaxTokensReachedException`) on a real fetched document.
- **Decision**: Added `AgentConfig.max_tokens: int = 8192`, passed through in
  `strands_factory.build_agent()`. Every agent gets this default without needing to
  declare it in its YAML.
- **Alternatives considered**: Set `max_tokens` per-agent in each `config/agents/*.yaml` -
  rejected as unnecessary duplication until an agent is shown to need a different value.
- **Consequences**: Verified against a real 579 KB PDF producing a 30-requirement
  `StructuredSpec` with no truncation. Revisit the default if a future document needs more.

## 2026-08-26 - `aws_region` and `s3_region` stay separate settings

- **Status**: Accepted
- **Context**: Both happen to be `ap-southeast-2` today, which looked like possible
  duplication.
- **Decision**: Keep them as two independent `Settings` fields - one is the Bedrock
  compute region, the other is the S3 bucket's fixed physical region.
- **Alternatives considered**: Collapse into a single `AWS_REGION` env var - rejected
  because these are two genuinely independent resources with independent lifecycles that
  could diverge in the future even though they coincide today.
- **Consequences**: None currently; revisit only if a real reason to diverge appears.

## 2026-08-26 - Drop the `HYPERDELIVERY_` env var prefix

- **Status**: Accepted
- **Context**: All app config vars were prefixed `HYPERDELIVERY_*`, which read as
  redundant inside the `hyperdelivery` repo itself.
- **Decision**: Removed the prefix repo-wide (`settings.py`, `.env`, `.env.example`,
  `Makefile`, `scripts/dev_all.sh`, `README.md`, tool docstrings).
- **Alternatives considered**: Keep the prefix for future multi-service namespacing -
  rejected as premature; add a prefix back only if/when this config is actually shared
  across services.
- **Consequences**: None; verified via `grep` (zero remaining matches), lint, and tests.

## 2026-08-26 - S3 document access as an agentic `@tool`, not a separate API

- **Status**: Accepted
- **Context**: Needed a way for Distill to read FSD documents uploaded to S3
  (`edma-ai-test` bucket).
- **Decision**: Implemented as a Strands `@tool` (`tools/documents.py`'s
  `s3_get_document_text`) that the LLM calls by object key, backed by a generic,
  policy-free `providers/storage/s3.py` (fetch + parse, testable via an injected client).
  The tool wrapper pulls `bucket`/`region` from `Settings` - the LLM can only ever supply
  a `key`, never an arbitrary bucket, as a least-privilege boundary.
- **Alternatives considered**: A separate microservice/API endpoint that Distill calls -
  rejected because fetch+parse is deterministic, mechanical work with no need for the LLM
  to reason about *how* to fetch, only *whether* to. This exactly mirrors the existing
  `mcp_clients/atlassian.py` + `tools/atlassian.py` split, so no new architectural pattern
  was introduced.
- **Consequences**: Established "generic reusable provider + policy-gated tool wrapper"
  as this repo's standing convention for any new external-service integration, not just
  MCP-based ones.

## 2026-08-26 - `mcp_clients/` (generic) vs `tools/` (policy) split

- **Status**: Accepted
- **Context**: Needed a place for MCP client construction (Confluence, Jira) that's
  reusable across agents without baking in per-agent tool-filtering policy.
- **Decision**: Generic, `Settings`-free MCP client/session builders live in
  `mcp_clients/atlassian.py`; per-agent policy (which tools an agent is allowed to call,
  env-var gating) lives in `tools/atlassian.py`.
- **Alternatives considered**: One combined module per integration - rejected because it
  would couple reusable connection logic to agent-specific tool-filtering, making the
  connection logic harder to reuse for a future third agent.
- **Consequences**: This split was directly reused as the template for the (non-MCP) S3
  integration - see the entry above.

## 2026-09-07 - Skip `track_plan` on a turn with no real work

- **Status**: Accepted
- **Context**: All four agents were told to call `track_plan` "before anything else",
  unconditionally. A bare greeting or single-line reply has no steps worth planning, but
  still paid for a full extra model round trip: one call to emit the plan, then a second
  call - only now able to read the cached system prompt - to actually respond. Observed
  directly: a plain "hi" to Distill took roughly 10 seconds before any reply appeared,
  matching two sequential Bedrock calls rather than one. This is separate from the
  already-documented `max_tokens`/tokens-per-second ceiling (2026-08-26 entry above),
  which governs a turn that does have real output to produce - this was pure fixed
  overhead paid by every turn regardless of size.
- **Decision**: Every agent's prompt now opens with a carve-out: if the turn is only a
  greeting or a single reply with no drafting, lookup or questions to ask, respond
  directly and skip `track_plan` - a plan is not worth a whole extra round trip for that.
  The existing instruction (restate only on a finished step, ride along with the next
  real tool call) is unchanged for any turn that does have real work.
- **Alternatives considered**: *Make `track_plan` itself cheaper (e.g. accept a partial
  update instead of the whole plan)* - investigated and rejected: the plan dict is tens
  of tokens against an 8192-token budget, so shrinking it does not touch the observed
  10-second floor, and making the tool stateful revisits the "module-level plan store"
  alternative already rejected on 2026-08-26 (agent instances are shared across projects,
  so any store the tool owns itself risks leaking one project's plan into another's).
  *Skip `track_plan` based on message length client-side, before the model ever sees it*
  - rejected: the model, not the caller, is in the best position to judge whether a turn
  needs a plan (e.g. a short message can still name a Jira issue that needs real lookup).
- **Consequences**: A trivial turn now costs one model round trip instead of two. No test
  asserted `track_plan` is always the first tool call, so nothing needed updating; `make
  check` is green. Revisit if the model starts skipping the plan on a turn that actually
  had multiple steps - the carve-out is deliberately narrow ("no drafting, lookup or
  questions to ask") to make that misuse easy to spot in a transcript.

## 2026-09-07 - Default `completeness` instead of requiring it on every output contract

- **Status**: Accepted
- **Context**: With the `track_plan` fix above applied, a bare "hi" to Distill still cost
  up to three sequential Bedrock model calls instead of one, adding a further 5-7 seconds.
  Real per-call timing (a new Strands hook logging `BeforeModelCallEvent`/
  `AfterModelCallEvent`, added to `agent_runtime/factory.py`) showed the second and third
  calls were both attempts at the same forced `StructuredSpec` tool call. Strands'
  `StructuredOutputTool.stream()` validates the model's draft against the Pydantic model
  and, on a `ValidationError`, sends the error back to the model as a tool result rather
  than failing outright - so a rejected draft costs one full extra model call to retry.
  Isolating the actual error (via a targeted `DEBUG` override on just
  `strands.tools.structured_output.structured_output_tool`, not the whole process - see
  the security note below) showed the cause: `Field 'completeness': Field required`. The
  model, especially on a trivial turn with nothing to score, regularly omits the
  `completeness` field entirely. That field's own docstring
  (`core.domain.project.CompletenessScore`) already says `score` and `gaps` are
  recomputed server-side from the stored artifact and overwrite whatever the agent
  claimed (`core/validation/{spec,blueprint,review,showroom}.py`) - only `questions`
  actually survives from the agent's submission. So the field was required, but the
  values it required were thrown away regardless.
- **Decision**: `completeness` now defaults to `CompletenessScore(score=0.0)` on all four
  output contracts (`StructuredSpec`, `Blueprint`, `ReviewReport`, `DemoPackage`), the
  same way `EvidenceLink.source` is already defaulted rather than required. Verified live:
  three consecutive "hi" requests after the change each took exactly two model calls, down
  from as many as three before it.
- **Alternatives considered**: *Tell the model more forcefully in the prompt to always
  include `completeness`* - rejected: prompt instructions are advisory, not a validation
  guarantee, and the field's own values are discarded server-side anyway, so there is
  nothing left to insist on. *Make `completeness` optional (`| None`) instead of
  defaulting it* - rejected: every downstream reader (`api.routers.projects`'s
  `_has_open_gaps`, the console UI) already assumes a `CompletenessScore` is present;
  defaulting keeps that contract intact while removing the retry cost, whereas `None`
  would push a new null-check onto every reader for no benefit.
- **Consequences**: A validation round trip caused purely by an over-eager required field
  is gone; a genuine schema violation elsewhere in a draft still triggers Strands' retry
  as intended. Four existing tests in `tests/unit/test_domain_contracts.py` asserted
  omitting `completeness` raises `ValidationError`; they now assert it defaults instead,
  which is the point of this change, not a regression.
- **Security note on how the cause was found**: an earlier attempt at this used
  `LOG_LEVEL=DEBUG` on the whole process, which also enables `botocore`'s HTTP debug
  trace - that logged a live AWS SigV4 `Authorization` header and `X-Amz-Security-Token`
  (temporary STS credentials) in full, which then surfaced in a local log file and,
  briefly, in this session's own tooling output. The process was killed and the files
  deleted immediately. The credentials were a short-lived STS session token, not a
  long-lived key, which limits but does not eliminate the exposure. The safe method used
  afterwards - setting `DEBUG` on only the specific `strands` logger that emits the
  validation-failure message, leaving `botocore`/`boto3`/root at `INFO` - is now the
  standing approach for this kind of investigation; whole-process `DEBUG` should not be
  used again against a live Bedrock-calling process on this repo.
