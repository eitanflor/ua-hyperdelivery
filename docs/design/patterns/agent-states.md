# Pattern: agent working states

Loading, thinking, streaming, tool use and the words that describe them. The single
largest gap for non-technical users: in Simple (PM) mode an agent can work for minutes while
the reader sees three drifting dots.

## What the console does today

| State | Source of truth | What renders | Where |
|---|---|---|---|
| Waiting for the first event | Turn created, nothing streamed | Three drifting dots | [Turns.tsx](../../../ui/console/src/components/thread/Turns.tsx#L223-L236) |
| Model silent | `thinking` heartbeat `{seconds}` | "thinking 12s" after the text | [Turns.tsx](../../../ui/console/src/components/thread/Turns.tsx#L238-L242) |
| Tool use | `tool_call` start/done | Grouped trace rows - **hidden in PM mode** | [Turns.tsx](../../../ui/console/src/components/thread/Turns.tsx#L207-L213) |
| Prose | `chunk` | Markdown with a blinking caret | [Turns.tsx](../../../ui/console/src/components/thread/Turns.tsx#L216-L236) |
| Artifact being written | `draft` (raw JSON of the forced output tool) | Auto-scrolling mono JSON panel - **shown in PM mode too** | [Turns.tsx](../../../ui/console/src/components/thread/Turns.tsx#L256-L281) |
| Plan | `track_plan` tool calls | Collapsible plan above the composer | [PlanPanel.tsx](../../../ui/console/src/components/thread/PlanPanel.tsx) |
| Cost | `usage` | "12k tok" beside the agent name - all modes | [Turns.tsx](../../../ui/console/src/components/thread/Turns.tsx#L90) |
| Done | `done` / `result` | Artifact card | [Turns.tsx](../../../ui/console/src/components/thread/Turns.tsx#L97-L128) |

The API relays `chunk`, `draft`, `tool_call`, `thinking` and `usage` unchanged, then `error`,
`result` or `done` ([projects.py](../../../src/api/routers/projects.py#L737)). A Stop control
exists - the composer's send button while a run is active - and locally the API closes the
agent connection when the stream is aborted. There is **no cancel for deployed runs** and no
explicit phase event; phases must be inferred from tool names.

## Prior art

| Product | What it does well |
|---|---|
| Claude Code | A rotating whimsical gerund beside an animated glyph, elapsed time, a token count, and "esc to interrupt". Finished reasoning collapses to "Thought for 14s". |
| Cursor | Plain status lines ("Planning next moves", "Reading file", "Searching codebase"), with repeated reads grouped ("Explored 6 files"). |
| ChatGPT / Claude apps | A thinking disclosure that stays collapsed by default and names its duration. |
| Grok | Named bots with faces; the persona is the status indicator. |
| Kobra | `reasoning-steps`, `task-list`, `streaming-text` - [../references/kobra-systems.md](../references/kobra-systems.md) |
| React Bits | Thought Line, Status Mark, Lattice Loader - [../references/react-bits.md](../references/react-bits.md) |
| Beautiful UI | Loading State with elapsed time, Thinking traces, Tool Chips, Task Rows - [../references/beautiful-ui.md](../references/beautiful-ui.md) |

## The state model

Every run moves through the same states. Each has one visual, one sentence of copy, and one
screen-reader announcement.

| State | Trigger | Simple mode | Detailed mode |
|---|---|---|---|
| Queued | Turn sent, deployed mode not yet started | "Waiting for Scout to pick this up" | Same, plus Step Functions state |
| Warming up | First seconds, no events | Face blinks; persona keyword | Same |
| Reading | `tool_call` for read-type tools | "Reading your FSD", "Checking Confluence" | Full trace row with argument |
| Thinking | `thinking` heartbeat, no tool running | Persona keyword + timer | "thinking 12s" + keyword |
| Writing | `draft` events | Document skeleton filling section by section | Skeleton + raw JSON toggle |
| Checking | `validate_*`, `score_*` tools | "Checking the report is complete" | Trace row |
| Needs you | Questions asked, or gate reached | Question card or gate card takes over | Same |
| Done | `done` | Settles to "Scout finished in 2m 14s"; artifact card | Same, plus tokens and model |
| Failed | `error` | Status mark turns to failed; copy from `lib/errors.ts`; Retry | Same, plus the raw error |
| Stopped | User stops (local runs today; deployed runs need a cancel endpoint) | "Stopped. The run was canceled before it finished." | Same |

## Two layers of words

1. **Facts first.** A tool event always wins. Turn the tool name into a present-tense
   sentence in the reader's language: `s3_get_document_text` becomes "Reading *Line plan
   FSD.docx*", `jira_search` becomes "Searching Jira", `score_completeness` becomes "Checking
   nothing is missing". [lib/toolLabels.ts](../../../ui/console/src/lib/toolLabels.ts) already
   humanizes names; this adds the present participle and the object.
2. **Persona keywords fill silence only.** When no tool is running for more than ~2s, rotate a
   short word in the agent's voice. They never claim progress that did not happen
   (detail.design `copywriting-7`).

| Agent | Silence keywords (examples) |
|---|---|
| Scout | Scouting, Sizing up, Measuring, Clocking, Charting |
| Coach | Drawing up, Game-planning, Sequencing, Whiteboarding |
| Ref | Reviewing the tape, Checking the call, Weighing, Flagging |
| Host | Setting the stage, Rehearsing, Cueing, Warming up |

Rules: one keyword at a time; rotate no faster than every 3s; never during an error; never on
a gate. The list lives next to `AGENT_META` so persona voice stays in one file.

## Simple mode, specified

One **thought line** per running turn, replacing the dots:

- The working face (blinking eyes), then one line: *"Scout is reading your FSD"*, then an
  elapsed timer in tabular numerals.
- Beneath it, up to five **grouped steps** with status marks: "Read 3 documents", "Checked
  Confluence", "Pinned down 14 requirements". Consecutive calls to one tool are one step.
- While `draft` streams, a **document skeleton** replaces the JSON: the artifact's section
  headings appear as they arrive, each with a growing count ("Requirements - 9 so far").
  Parse the partial JSON keys; show nothing that is not in it.
- On settle, the line becomes past tense ("Scout finished in 2m 14s") and folds its steps
  away; the artifact card enters with a short blur cross-fade (`motion-7`).
- No tokens, no JSON, no tool wire names, no model names.

## Long runs

- After ~30s with no new step, add a reassurance line that describes the phase, not a promise:
  *"Still reading - long FSDs take a while."*
- Offer **Notify me when done** (needs notifications) and a **Stop** beside the thought line,
  not only in the composer (deployed runs need a cancel endpoint for it to mean anything).
- When the user leaves the project, reflect state in the favicon and tab title
  (`interactivity-36`): a working dot while any run they started is active, a red count when a
  gate or question is waiting for them.
- When a run finishes elsewhere, a receipt toast: "Scout finished *Line plan tool* - 14
  requirements, 2 open questions. Open".

## Loading surfaces outside the thread

- Home and portfolio tiles use a **skeleton the size of what is coming** (Kobra rule 11), not
  spinners.
- A bento tile for a running project may use a small pixel-grid or dither loader (Lattice
  Loader, Beautiful UI Loading State). Never in the thread, where it would fire constantly.

## Accessibility and motion

- One polite live region per running turn, announcing **phase changes** ("Scout is checking
  the report"), not every token. The prose region stays as it is.
- Timers and keyword rotation are not announced.
- Reduced motion: glyph static, no shimmer, no breathing; keyword changes still happen but
  without a transition.
- The stop control, once it exists, is reachable by keyboard and labeled "Stop Scout".

## Backend dependencies

| Need | Why |
|---|---|
| Deployed-mode cancel endpoint | A Stop that ends the Step Functions execution, not just the watcher |
| Optional `phase` event | Would replace tool-name inference with a stated phase |
| Notifications | "Notify me when done" |
