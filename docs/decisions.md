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

## 2026-08-28 - Entra ID (Azure AD) SSO, ported from Material_Libraray_AI_Assistant

- **Status**: Accepted
- **Context**: The console had no auth at all - anyone who could reach the API could see
  and mutate any project. Rather than design something new, ported the exact pattern
  already validated in `Material_Libraray_AI_Assistant` (frontend MSAL + backend ID-token
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
  noticed live ("the landing page seems empty why dont we add chatbox... let the
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
  (completeness as a progress bar + gap warnings, arrays as labelled lists, strings as
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
