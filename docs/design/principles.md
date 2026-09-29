# Design principles

The rules every Hyperdelivery surface is checked against. They extend, and where noted
replace, the design read in [docs/console-redesign.md](../console-redesign.md) section 1. When a
reference in [references/](references/) disagrees with a rule here, this file wins; the
rulings are recorded at the end.

## North star

> Anyone at Under Armour can bring an idea to the line, see where it is, and approve the work
> with confidence - without learning to read an engineering tool.

The line is still the product and the gates are still its most important moments. What
changes is who the default reader is: the console is designed first for the requester, the
approver, the SME and the analyst, with full technical detail one switch away.

## Principles

1. **Plain first, character second.** Chrome, gates and documents speak plain language. The
   crew's names, faces and voice add warmth on top; they never replace a plain word
   ([vocabulary.md](vocabulary.md)).
2. **Show the work in the reader's words.** An agent is never silent and never shows raw
   internals by default. Every running state says what is happening now, in a sentence
   ([patterns/agent-states.md](patterns/agent-states.md)).
3. **The gate is the loudest thing on screen.** Ceremony is spent there and nowhere else. A
   reviewer can always say what they approved against
   ([patterns/approval-cards.md](patterns/approval-cards.md)).
4. **One place answers "what needs me?"** Personal, role-aware, and the first thing Home
   shows ([personas.md](personas.md)).
5. **Every state is designed.** Empty, loading, working, waiting, error, done, stopped. An
   empty state names what is missing and the next action.
6. **Detail on demand.** Simple is the default for everyone except developers; Detailed is one
   switch away and hides nothing. Diagrams follow the same audience and detail settings
   ([references/diagram-design.md](references/diagram-design.md)).
7. **Everything has an address.** Projects, gates, questions, artifact sections and filtered
   views are URLs, so they can be shared, bookmarked and reopened.
8. **Motion explains cause and effect.** It shows what changed and what happens next. The more
   often an interaction fires, the less it moves.
9. **Brand lives in the details.** UA red reserved, the stencil lockup for names, the hazard
   stripe at gates, an athletic voice in status words - never in what someone signs.

## Settings for this surface

The design-taste dials, re-set for a non-technical default reader. Previous values in
parentheses.

| Dial | Value | Why |
|---|---|---|
| Design variance | 6 (5) | Home, landing and empty states earn expression; working surfaces stay consistent |
| Motion intensity | 6 (4) | More state-carrying motion (working states, gate ceremony), governed by the frequency rule |
| Visual density | 4 in Simple, 6 in Detailed (6) | Fewer, larger elements for newcomers; today's density stays available |

## The frequency rule

From detail.design's decision gate, applied to every animation and delight proposal:

| How often it fires | Allowed |
|---|---|
| Many times a minute (typing, hovering, scrolling) | Nothing beyond color and opacity |
| Many times a day (opening panels, switching tabs, sending) | 150-250ms transitions |
| A few times a project (a run finishing, a question arriving) | A settle animation, a receipt |
| Once or twice a project (gate approved, project shipped, first project) | An authored moment |

## Porting rules for outside components

Anything taken from Kobra, React Bits, Beautiful UI or elsewhere passes these before merging:

- **One icon family.** Replace Hugeicons, Tabler or Lucide with the Phosphor equivalent.
- **Tokens only.** Map every color to a semantic token; no hex values, no raw palette classes.
- **One radius family.** `sm` 6px, `md` 10px, `full`; nested radii follow `design-1`.
- **12px type floor.** Raise anything smaller.
- **Reduced motion.** A branch that keeps the state change and removes the travel.
- **Keyboard and screen reader.** Operable without a pointer; state changes announced once.
- **License kept.** MIT notices stay in copied files; Commons Clause components are not
  resold; Kobra paid components are bought before they are installed.
- **US English** in any copy that comes with the component.
- **A decision entry** in [docs/decisions.md](../decisions.md) for any new package.

## Rulings where sources disagree

| Conflict | Ruling |
|---|---|
| Kobra: a busy button stays enabled and keeps its label. detail.design `interactivity-21`: disable on click to stop duplicates. | Set `aria-busy`, show the spinner beside the label, and ignore repeat activation in the handler. The button never dims. |
| A confirmation step for approving a gate vs. [docs/console-redesign.md](../console-redesign.md) adjudication 1 (no modal). | No modal. Hold-to-sign or slide-to-sign supplies deliberateness in place; the undo window stays. |
| Whimsical status words (Claude Code) vs. `copywriting-7` (status describes the current phase). | Facts first: any tool event wins. Persona words only fill silence and never imply progress. |
| One accent per surface vs. four agent hues. | Unchanged from the prior ruling: identity hues are data and never appear on interactive chrome. Additionally, **no identity hue may equal a status hue** ([patterns/bot-personas.md](patterns/bot-personas.md)). |
| Diagram Design: no shadows. Layer lifts need depth. | Diagrams have no shadows. Layer lifts are for illustrative cards only. |
| Diagram Design: a serif for titles and callouts. | No third family; titles use Geist and the stencil lockup. |
| Kobra: two font weights. The UA lockup uses 800 italic. | The stencil lockup is the one exception, for names only. |

## Checks before a surface ships

- Contrast measured, not eyeballed: 4.5:1 for text on the darkest surface it sits on, both
  themes.
- Every interactive element: default, hover, focus, active, disabled, loading, error, empty.
- Works at 1280px with both side panels open, and at 1024px with the rail collapsed.
- Reduced motion checked with the OS setting on.
- Keyboard-only walkthrough of the primary task.
- The Simple-mode version read aloud to someone non-technical; every word they stumble on is a
  [vocabulary.md](vocabulary.md) finding.
