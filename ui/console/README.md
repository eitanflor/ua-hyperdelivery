# Hyperdelivery Console

React + Vite + TypeScript console UI - the client for the console API (`src/api/`). See
the root [README.md](../../README.md) and [docs/architecture.md](../../docs/architecture.md)
for how this fits into the rest of the system, and
[docs/console-redesign.md](../../docs/console-redesign.md) for the audit this shell was
built from.

## The crew

A station is a place; an agent is the person working it. The four agents are named for the
job a person actually holds - a scout measures raw talent at the combine, a coach turns the
read into a playbook, an official grades the tape in the film room, a host calls the game.
**These are display names only** - the wire ids, the `Station` enum and the API contract
still say `distill`, `blueprint`, `review`, `showroom`. Everything user-facing lives in
[src/lib/pipeline.ts](src/lib/pipeline.ts).

| Wire id | Agent | Station | Hands over |
|---|---|---|---|
| `distill` | **Scout** | ST 01 · Combine | Scouting report |
| `blueprint` | **Coach** | ST 02 · Playbook | Call sheet |
| `review` | **Ref** | ST 03 · Film Room | Grade sheet |
| `showroom` | **Host** | ST 04 · Gameday | Run of show |

Gate 1 is the scouting report sign-off, Gate 2 the call sheet sign-off, and a finished
project is "off the line". Each agent has a face: one head shape with a different crest -
a scout's tick, a coach's X on the board, tally marks on a grade sheet, a host's mic - so
the four read as a family. The eyes blink only while that agent is working, so the motion
is a status indicator rather than decoration.

## What it does

- **The line is the navigation.** The top bar carries all seven stations - four agents and
  two gates - showing where the project is, what it cleared and what is left. The signed-in
  user sits top right with the theme switcher and sign-out.
- **Projects grouped by what they need.** The left rail leads with **Needs you** (anything
  parked at a gate), then Active, then Done. `⌘K` opens a command palette; `⌘B` toggles
  the rail.
- **A thread, split into stations.** One continuous conversation, streamed over SSE, but
  each turn is stamped with the agent that produced it and each station gets a band. A run
  can be stopped mid-stream and retried if it fails.
- **Gates are the loudest surface.** A gate shows the criteria being signed against, the
  open completeness gaps, and the signer taken from the Entra ID token - not a typed name.
  Sending work back requires a reason. Every decision is undoable for twelve seconds
  before it is sent.
- **Typed artifact views.** The inspector renders a scouting report, a call sheet, a grade
  sheet and a run of show as four different documents, because they are - with severity
  ordering, requirement coverage and the unit-of-work dependency graph.

## Design system

Everything visual comes from the semantic token layer in [src/index.css](src/index.css).
**Components may not reference a brand primitive or a raw palette color directly** - that
is what makes the light/dark flip a one-file change.

- **Themes.** Light is the default and is what the HTML ships with, so the first paint
  never flashes. Dark is authored as a sibling palette, not derived by inversion. Both are
  verified at >=4.5:1 for body text against the darkest surface each token is used on.
- **Icons.** One family, `@phosphor-icons/react`. The only hand-drawn SVGs are the four
  agent faces in [src/components/agents/AgentFace.tsx](src/components/agents/AgentFace.tsx) -
  identity, not iconography. No Unicode glyphs standing in for icons.
- **Type.** Geist + Geist Mono, self-hosted via `@fontsource-variable`. Fixed rem scale,
  no fluid clamps. **12px is the floor**; mono carries IDs, timestamps and station numbers.
  The `.stencil` class is the Under Armour lockup - italic, uppercase, heavy - and is for
  station, gate and crew names only, never body copy or control labels.
- **The hazard stripe** (`.hazard`) appears exactly once, on the gate header, where "work
  stops here until a person signs" is the literal meaning.
- **Color discipline.** UA red is reserved for primary actions, the current station, the
  gate and needs-you. The four agent hues are data: they may tint a mark, a station node
  or an artifact tab, and never appear on interactive chrome.
- **Shape.** `rounded-sm` inputs and chips, `rounded-md` cards and panels, `rounded-full`
  avatars and pills. Nothing else.
- **Motion.** `motion/react`, 150-250ms, state-carrying only. The one authored moment is
  the line cursor advancing when a gate is signed. `prefers-reduced-motion` is honored
  globally.
- **Primitives.** `Button`, `IconButton`, `TextInput`/`TextArea`, `Badge`, `Tooltip`,
  `ConfirmDialog` in [src/components/ui/](src/components/ui/). `IconButton` requires a
  `label`, so an unlabeled icon button cannot be built.

## Known gaps

- The signer is taken from the ID token in the browser, but the **backend still trusts the
  string it is sent**. Closing that needs the API to read the identity server-side.
- `Decision` has no read endpoint, so a gate cleared before this session shows "Signed
  before this session" rather than who signed it. The local echo in `signaturesByProject`
  is not an audit trail.
- The undo window is client-side: closing the tab inside it drops the decision rather than
  sending it. That is the safe direction to fail, but a durable version needs the backend.

## Run it

```bash
pnpm install
pnpm dev      # http://localhost:5173, proxies to the console API on :8090
pnpm build    # production build
pnpm lint     # oxlint
```

Needs a `.env` (see `.env.example`): `VITE_API_BASE_URL`, `VITE_ENTRA_TENANT_ID`,
`VITE_ENTRA_CLIENT_ID` (same Entra ID app registration the backend validates against).

