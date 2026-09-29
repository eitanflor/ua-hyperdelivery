# Pattern: approval cards

Gates are the product (see [AGENTS.md](../../../AGENTS.md)), so a gate card is the most
important surface in the console. This pattern covers the three moments where the line waits
for a person: a gate sign-off, a question from Scout, and the record left behind afterwards.

## What exists

[GateConsole.tsx](../../../ui/console/src/components/thread/GateConsole.tsx) already does a lot
right, and it stays the foundation:

- A hazard stripe and lock icon mark the one place work stops for a person.
- "Scout is done. Coach starts when you approve." frames the handoff.
- Every gate criterion must be ticked before signing; sending back requires a reason.
- The signer comes from the Entra ID token, not a typed name.
- A 12-second undo window replaces an "are you sure?" modal
  ([useProjectsStore.ts](../../../ui/console/src/store/useProjectsStore.ts#L44)).
- Gate 3 blocks while any pull request is still marked `[WIP]`.

Keep all of this. The redesign changes what the reader sees, not what they must do.

## Gaps for non-technical approvers

| Gap | Evidence |
|---|---|
| Nothing says **what you are approving** in plain words - the card assumes you read the thread and the artifact | [GateConsole.tsx](../../../ui/console/src/components/thread/GateConsole.tsx#L122-L140) |
| Criteria lead with a mono ID before the sentence | [GateConsole.tsx](../../../ui/console/src/components/thread/GateConsole.tsx#L171) |
| No "what happens next" beyond the next bot's name | Header copy only |
| Gate 3 speaks developer: pull requests, `[WIP]`, Copilot | [GateConsole.tsx](../../../ui/console/src/components/thread/GateConsole.tsx#L250-L255) |
| No way to hand the decision to someone else, or link to it | No share or request control |
| The undo countdown is a number only | [GateConsole.tsx](../../../ui/console/src/components/thread/GateConsole.tsx#L13-L20) |
| No history of who signed what (write-only `Decision`) | No `GET` decisions endpoint |
| "Needs you" is not personal - every viewer sees every gate | [Portfolio.tsx](../../../ui/console/src/routes/Portfolio.tsx#L15-L19) |

## The gate card, top to bottom

1. **Header band.** Keep the hazard stripe. Title as a verb: *"Gate 1 - Approve the
   requirements"*. Beneath it, two faces with an arrow: Scout (done) to Coach (waiting), and
   "Your call" with the signer's avatar between them.
2. **What you are approving.** A small bento row of real numbers from the artifact:
   requirements, completeness, open questions, sources cited (Gate 1); build tasks,
   components, integrations (Gate 2); findings by severity, requirements covered, builds ready
   (Gate 3). Each tile links to its section in the artifact.
3. **Plain summary.** Two or three sentences from `composeReply` in
   [lib/formatArtifact.ts](../../../ui/console/src/lib/formatArtifact.ts), not the model's
   prose.
4. **Criteria checklist.** Sentence first, ID second (Detailed mode only). A progress line:
   "3 of 5 confirmed", with a status mark per row. Each row has a *Show where* link that opens
   the artifact at the section that satisfies it. Space toggles; the list is one fieldset.
5. **Risks.** Open gaps and missing sections in a warning callout, written as what is missing
   rather than a count.
6. **What happens next.** *"Coach will turn this into a build plan. You'll be asked to approve
   that plan at Gate 2."* For Gate 3: *"Approving merges the finished code and starts the demo
   preparation."* - plain words for the merge that happens on approval.
7. **Decision.** Primary: **hold to sign** (about 1s, [Hold Button](../references/react-bits.md))
   or **slide to sign** ([Slide Commit](../references/react-bits.md)) - choose one after a
   usability test. Secondary: *Send back with notes*. Tertiary: *Ask a question* (posts to the
   thread) and *Request sign-off from someone else* (copies a deep link; notifies when
   notifications exist).
8. **Signer.** Avatar and name. Email only in Detailed mode or on hover.

A disabled sign control shakes when pressed (detail.design `motion-21`) and says why:
"Confirm the 2 remaining criteria first."

## After signing

- The signature **draws itself** (`motion-3`) across the card, which then folds into a
  **ticket stub**: *GATE 1 - SIGNED*, name, time, comment, a perforated edge (React Bits Tear
  Ticket). The stub stays in the thread permanently as the strongest horizontal rule.
- The undo window becomes a **bar that fills** (`motion-23`) with "Handing to Coach" beside
  it; Undo stays until the bar completes, then the line indicator advances and Coach's face
  turns to "working". That handoff is the one authored motion moment in
  [../principles.md](../principles.md).
- A receipt toast if the user navigates away during the window.

## Sending back

- A comment is required, as today. Offer starter chips - *Missing a requirement*, *Wrong
  scope*, *Needs a data source*, *Unclear wording* - that prefill the comment's first line.
- Pre-flight the comment (`interactivity-24`, `interactivity-27`): if it is under a few words,
  ask for specifics before sending.
- Show the receiving bot's face with "Returning to Scout with your notes".
- What sending back does is currently undefined on the backend (hold versus rerun). The card
  must say which, once decided.

## Questions from Scout

Scout pauses to ask clarifying questions ([QuestionPrompt.tsx](../../../ui/console/src/components/thread/QuestionPrompt.tsx)).
Use the approval-card pattern from Beautiful UI and Kobra's `question-card`:

- **One question per card**, "1 of 3", with Skip and Continue.
- Options as large chips; always an *Answer in my own words* path.
- *I don't know - ask someone*: copies a link to an **answer-only view** for an SME. That view
  shows the project name, who asked, why it matters (one sentence), the question card, and
  nothing else. No thread, no rail, no inspector.
- After answering: "Thanks - Scout will use this." and the question collapses to a receipt.

## Motion, frequency and accessibility

- Gates are rare, so they may carry ceremony. Nothing else in the console may be louder.
- Hold-to-sign needs a keyboard path (hold Space or Enter) and
  `aria-describedby` text: "Press and hold for one second to sign."
- Reduced motion: the fill completes instantly after the hold; the signature appears without
  drawing; the ticket appears without folding. The state change is kept.
- No confirmation modal. Adjudication 1 in [docs/console-redesign.md](../../console-redesign.md)
  stands: construction and undo, not interruption.

## Backend dependencies

| Need | For |
|---|---|
| `GET /projects/{id}/decisions` | Signed history on the card and the activity panel |
| Signer taken from the validated token server-side | The record the gate exists to produce |
| An approver field (or list) per gate | A personal "Needs you" and *Request sign-off* |
| Notifications (Teams or email) | Telling approvers and SMEs they are needed |
| Defined send-back semantics | Honest copy after sending back |
