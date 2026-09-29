# Design library

The UI/UX reference for the Hyperdelivery console: who it is for, what is wrong with it today,
the rules it is designed against, the patterns it borrows, and the plan to get there. Written
to outlast any one redesign - add to it as the product grows.

## Start here

| Document | Read it when |
|---|---|
| [ux-audit-2026-09.md](ux-audit-2026-09.md) | You want to know what is wrong and why, with file-level evidence |
| [roadmap.md](roadmap.md) | You are picking up work - phases, exit criteria, backend dependencies |
| [principles.md](principles.md) | You are designing or reviewing anything - the rules and the rulings |
| [personas.md](personas.md) | You need to know who a surface is for |
| [vocabulary.md](vocabulary.md) | You are writing any user-facing word |
| [asset-briefs.md](asset-briefs.md) | You are generating or commissioning illustrations |
| [asset-prompts.md](asset-prompts.md) | You have a generator open and want the exact prompt, size and file name |

Earlier record: [docs/console-redesign.md](../console-redesign.md) - the August 2026 audit and
redesign this library builds on. Its adjudications still hold unless
[principles.md](principles.md) says otherwise.

## Patterns

Cross-cutting design patterns, each combining several references with the console's current
state.

| Pattern | Covers |
|---|---|
| [patterns/agent-states.md](patterns/agent-states.md) | Loading, thinking, streaming, tool use, status words |
| [patterns/bot-personas.md](patterns/bot-personas.md) | The crew as characters: bible, expressions, player cards |
| [patterns/approval-cards.md](patterns/approval-cards.md) | Gates, questions, the signed record |
| [patterns/canvas-and-diagrams.md](patterns/canvas-and-diagrams.md) | Line map, architecture, build order, traceability |
| [patterns/artifacts-and-panels.md](patterns/artifacts-and-panels.md) | Document viewer, citations, export, diffs, side panels, settings |
| [patterns/visual-language.md](patterns/visual-language.md) | Isometric, layer lifts, dither and ASCII, bento, icons, motion, type |

## References

One file per external source: what it is, its license, its full catalog, and what
Hyperdelivery takes from it.

| Reference | Source | License |
|---|---|---|
| [references/kobra-systems.md](references/kobra-systems.md) | <https://kobra.systems/> | 10 free, rest paid |
| [references/detail-design.md](references/detail-design.md) | <https://detail.design/> | MIT (skill) |
| [references/react-bits.md](references/react-bits.md) | <https://reactbits.dev/> | MIT + Commons Clause |
| [references/beautiful-ui.md](references/beautiful-ui.md) | <https://www.beautifului.dev/> | MIT |
| [references/diagram-design.md](references/diagram-design.md) | <https://cathrynlavery.github.io/diagram-design/> | MIT |

The vendored design skills in `.github/skills/` (`impeccable`, `layers-*`,
`design-taste-frontend`, `industrial-brutalist-ui` and others) are working tools, not
references; see [.github/skills/THIRD_PARTY_NOTICES.md](../../.github/skills/THIRD_PARTY_NOTICES.md).

## Adding a reference

Create `references/<source-name>.md` with:

1. A header table: source URL, date retrieved, what it is, license or cost.
2. **Why it is in the library** - the console problem it helps with, in two or three sentences.
3. **The catalog or rules**, paraphrased in our words. Link, do not paste: never copy paid or
   licensed source code into this folder.
4. **What Hyperdelivery takes** - a table of item, surface, roadmap phase.
5. **What it does not take, and why.**
6. **Porting notes** against the rules in [principles.md](principles.md).

Then add a row to the table above and, if it changes a pattern, link it from that pattern.

## Keeping it true

- Review the references each quarter; component libraries change fast. Update the retrieval
  date when you do.
- When a roadmap phase ships, mark its findings resolved in the audit and move anything
  learned into [personas.md](personas.md) and [principles.md](principles.md).
- Architectural choices made from this library (a dependency, a default, a rejected
  alternative) still go in [docs/decisions.md](../decisions.md).
- Prose follows the repo's US English rule; `cspell.json` enforces it here too.
