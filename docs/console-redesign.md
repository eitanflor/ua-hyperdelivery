# Console redesign: audit and plan

Status: **implemented**, 2026-08-27. Phases 0-4 have shipped in `ui/console/`; Phase 5 and
the backend work in §9.2 have not. This document is kept as the record of *why* the console
looks the way it does - the audit it came from, the findings it answers, and the decisions
taken along the way. Where the implementation departed from the plan, §12 says so.

Scope: `ui/console/` only. The Streamlit harness (`ui/streamlit_app.py`) is out of scope.

---

## 1. Design read

> Reading this as: an **Operate**-mode internal console for a gated AI delivery line,
> for a small team who live in it daily but which doubles as the surface that sells the
> concept to leadership, with a **precision-instrument** language, leaning toward a
> dark-first semantic token system on Tailwind v4 + a real icon family + restrained,
> state-carrying motion.

Dials (per `design-taste-frontend` §1):

| Dial | Value | Why |
|---|---|---|
| `DESIGN_VARIANCE` | 5 | Product UI. Consistency beats surprise. Expression is spent in one place, not scattered. |
| `MOTION_INTENSITY` | 4 | Motion conveys state only. One authored moment (the gate handoff). |
| `VISUAL_DENSITY` | 6 | Operator tool with real data: requirements, findings, coverage, units of work. |

### Scope decisions taken

These were put to the user; the user was unavailable, so the recommended option was
taken in each case. **Each is reversible and worth confirming before implementation.**

| Question | Decision taken |
|---|---|
| Scope of change | Full overhaul — new visual world and IA. Product truth (stations, gates, artifacts, SSE) preserved. |
| Theme | **Light-first, dark available.** (The plan originally recommended dark-first; the user chose light as the default. Both are first-class, so this only sets the default.) |
| Brand | UA red stays primary and is *reserved*; a small harmonized secondary set carries agent identity. |
| Dependencies | Icons + motion + headless primitives allowed. Each logged as a decision. |
| Usage scene | Daily operator tool that is demoed constantly. Operate mode with a deliberate first impression. |
| Responsive | Desktop down to a 13" laptop. Graceful tablet. No mobile IA. |
| Agent identity | Hybrid — one continuous voice, but every turn and artifact is stamped with the agent that produced it, and each agent gets a real mark. |
| Deliverable | This document. No source edits until reviewed. |

### On applying `design-taste-frontend` to this surface

That skill states in its own header that it covers "landing pages, portfolios, and
redesigns — **not dashboards, not data tables, not multi-step product UI**." The console
is precisely what it excludes. Its landing-page rules (hero stack discipline, image
strategy, testimonials, eyebrow budget, bento rhythm, marquee caps) are therefore
**discarded as not applicable**, and saying so is part of using the skill correctly.

What was taken from it, because it is medium-independent: brief inference and the dials
(§0–1), design-system honesty (§2), the icon and emoji policy (§3.C–D), responsive
mechanics (§3.E), dependency verification (§3.F), typography and font-loading (§4.1),
color calibration and the accent lock (§4.2), materiality and the shape lock (§4.4),
interactive state completeness and the contrast checks (§4.5), form patterns (§4.6),
theme lock (§4.11), and motion motivation (§5).

---

## 2. Method, and where it was degraded

Three independent lenses, run as isolated sub-agents so that deterministic findings
could not anchor the design judgment (required by `impeccable`'s critique protocol):

| Lens | Question it answers |
|---|---|
| **A — `impeccable critique`** | Is this designed? Heuristics, cognitive load, emotional journey, persona failures. |
| **B — `impeccable audit`** | Is this built well? Accessibility, performance, theming, responsive, integrity. |
| **C — `layers-*`** | Is the surface honoring the layers below it? Conceptual model, interaction structure, vocabulary. |

> **Degraded run, declared:** the vendored `impeccable` copy ships without its Node
> scripts, so `detect.mjs` did not run, and the console requires a live API plus Entra ID
> sign-in, so no browser inspection or screenshots were possible. Every finding below is
> derived from source. Nothing is reported from a runtime observation that was not
> actually made. Findings that need runtime confirmation are marked **[runtime]**.

### Scorecards

**A — Design health (Nielsen, /40).** All ten heuristics apply on an Operate surface.

| # | Heuristic | Score | Key issue |
|---|---|:--:|---|
| 1 | Visibility of system status | 2 | Streaming is well handled; everything after a decision is not. |
| 2 | Match system / real world | 2 | Good domain nouns, but raw enum values leak (`blueprint approval`). |
| 3 | User control and freedom | 1 | No cancel on a running agent, no undo on a decision, no URL to go back to. |
| 4 | Consistency and standards | 3 | Form and button vocabulary is genuinely consistent. |
| 5 | Error prevention | 2 | Delete is confirmed; an irreversible gate decision is not. |
| 6 | Recognition over recall | 2 | Reviewer must recall the gate criteria — they are never displayed. |
| 7 | Flexibility and efficiency | 2 | One shortcut (Cmd+Enter). No palette, no project switching, no queue. |
| 8 | Aesthetic and minimalist design | 2 | Clean, but undifferentiated: the most important row is the quietest. |
| 9 | Error recovery | 1 | Raw API strings, auto-dismissed in 6s, no retry anywhere. |
| 10 | Help and documentation | 0 | None. No tooltips, no glossary, no empty-state teaching. |
| **Total** | | **17/40** | **Poor** — sound skeleton, unbuilt at the decisive moments. |

**B — Audit health (/20).**

| # | Dimension | Score | Key finding |
|---|---|:--:|---|
| 1 | Accessibility | 1 | Contrast fails on both themes; zero `aria-live`, zero reduced-motion. |
| 2 | Performance | 2 | Per-token store writes rewrite the conversation map; N+1 fetch on mount. |
| 3 | Responsive | 1 | Zero breakpoints in the entire codebase. |
| 4 | Theming | 1 | Tokens built for dark, applied to a light app; ~20 raw palette escapes. |
| 5 | Implementation integrity | 2 | Nine Unicode glyphs as icons, no shared primitives, no semantic layer. |
| **Total** | | **7/20** | **Poor** — major overhaul required. |

**C — Layers.**

| Layer | State | Note |
|---|---|---|
| Observed behavior | Assumed | No research in-repo. |
| Domain | Partial | Backend domain is crisp; the *user's* domain (what approving commits you to) is not. |
| User needs | Weak | No job stories. Emotional job at the gate — "don't let me sign off on something wrong" — is unserved. |
| Product strategy | Partial | Stated clearly in AGENTS.md: the gates are the product. |
| Conceptual model | **Strong (backend)** | `Project`, `Station`, `Decision`, `Artifact` are precise and well documented. |
| Interaction structure | **Weak — bottleneck** | Rejection flow undefined. Temporal states ad hoc. No places for queue, history, or run detail. |
| Surface | Partial | Honors maybe 60% of the model. Four modeled objects have no representation at all. |

**Bottleneck: interaction structure.** The model beneath it is sound. That is good news —
it means most of what follows is a design and surface problem, not a re-modeling problem.

---

## 3. Corrections to the sub-agent reports

Verified against source before consolidating. These were reported and are **wrong**; they
are excluded from the plan.

| Claim | Reality |
|---|---|
| "`dropFailedTurns()` is defined but never called; failed streams leave orphaned turns." | It **is** called, in the `catch` around the SSE loop in [useProjectsStore.ts](ui/console/src/store/useProjectsStore.ts). Failed turns are cleaned up. The real gap is narrower: no *retry* affordance. |
| "Delete button has no `aria-label`." | It has one: `aria-label={\`Delete ${project.name}\`}` in [Sidebar.tsx](ui/console/src/components/Sidebar.tsx). |
| "Chat transcript is ephemeral; refresh loses all turns." | `conversationByProject` is in the zustand `partialize` allowlist and **persists to localStorage**. It survives refresh. The real gap: it is per-browser, so a colleague opening the same project sees no history. |
| "Fixed widths cause the layout to overflow below 1456px." | It does not overflow — the center pane is `flex-1` and shrinks. The real failure is that the reading measure collapses (≈352px of content at a 1024px viewport) with no collapse affordance. |
| "After a decision the user sees blank space / nothing." | A [Checkpoint.tsx](ui/console/src/components/Checkpoint.tsx) row does render. The finding is sharper than reported — see below. |
| "Approval needs an 'Are you sure?' confirmation modal." | Rejected on craft grounds. See §6, adjudication 1. |

That last correction is worth restating, because it reframes the whole redesign.

---

## 4. The root cause

Two sentences explain most of the 40+ findings.

**One.** `AGENTS.md` says: *"Do not remove or bypass a human approval gate. The gates are
the product."* The interface renders that product as its **weakest element**. The moment a
human authorizes an irreversible handoff becomes a `text-xs text-ua-steel` row with a
14px glyph in [Checkpoint.tsx](ui/console/src/components/Checkpoint.tsx) — the lowest
contrast, smallest type in the thread. Meanwhile the pending decision is dressed in
*error* semiotics: red hairline border and a `!` avatar in
[DecisionComposer.tsx](ui/console/src/components/DecisionComposer.tsx). The gate is styled
as an alarm before it happens and as a footnote after. It is never styled as authority.

**Two.** The tokens in [index.css](ui/console/src/index.css) were designed for a dark
surface, then the app was built light. That single mismatch generates nearly every
contrast failure, and it is measurable:

| Token | On `ua-black` #101010 | On white | Verdict |
|---|:--:|:--:|---|
| `ua-fog` #b3b3b3 | **9.13:1** ✅ | **2.10:1** ❌ | Designed for dark. Used on light. |
| `ua-steel` #767676 | **4.21:1** ❌ | **4.54:1** ✅ | Fails on dark — and it is the dark sidebar's body color. |
| `ua-steel` on `ua-cloud` #f2f2f2 | — | **4.06:1** ❌ | Fails on the panel background. |
| `ua-red` #e4002b | **3.95:1** ❌ | **4.85:1** ✅ | Fails as body text on dark. |

`body` is `background: var(--color-ua-black)` while `App.tsx` renders `bg-white`. The app
is arguing with itself, and the contrast failures are the argument's fallout. Fixing the
theme direction fixes eight reported issues at once.

### The central design idea

> **The console is a factory line with instrumented, ceremonial checkpoints — not a chat
> app with an approval form inside it.**

Everything in §7–8 follows from that. The line becomes a real, persistent object. The
gate becomes the loudest, most deliberate moment in the product. The agents become
identifiable workers with visible output. Red is reserved for the three things that
actually matter: where you are, what you are about to commit, and what needs you.

---

## 5. Consolidated findings

Deduplicated across all three lenses. `A`/`B`/`C` marks which lens raised it; multiple
letters mean independent lenses converged, which raises confidence. `[surface]` is fixable
in the redesign; `[deeper]` needs a product or backend decision first.

### P0 — blocking

| # | Finding | Lens | Kind |
|---|---|:--:|---|
| 1 | **The signer is free text backed by `localStorage`** while the app already holds a verified Entra ID identity via `useCurrentUser`. Anyone can sign off as anyone. This is an audit-integrity hole in the one record the product exists to produce, not a UX nit. | — | `[deeper]` |
| 2 | **`Decision` is write-only.** It is a first-class persisted object with signer, comment and timestamp — and there is no repository read method, no API endpoint, and no UI. You cannot see who approved what. Needs backend work; the earlier report's claim that "the endpoint exists" is wrong. | C | `[deeper]` |
| 3 | **Gate criteria are never shown to the person deciding.** `gate_criteria[]` is modeled in the spec and never rendered. Reviewers approve against a completeness percentage instead of the rubric. This makes the gate ceremonial in the bad sense. | C | `[deeper]` |
| 4 | **Theme direction is unresolved** (`body` dark vs `App` white), producing systemic contrast failures on both surfaces. | B | `[surface]` |
| 5 | **Zero `prefers-reduced-motion` handling** across four keyframes and two infinite animations. WCAG 2.3.3. | B | `[surface]` |
| 6 | **Zero `aria-live` / `role="alert"`.** Streamed agent output and every error are silent to a screen reader — the two things that change without user action. WCAG 4.1.3. | B, C | `[surface]` |
| 7 | **No URL routing.** `selectedProjectId` is `useState` in `App.tsx`. No deep links, no back button, no refresh persistence of *which project*. You cannot send a colleague a link to the decision that is waiting for them — which is the core collaboration loop of an approval-gated product. | C | `[deeper]` |

### P1 — major

| # | Finding | Lens | Kind |
|---|---|:--:|---|
| 8 | The approved-checkpoint is the quietest element in the app (§4). | A, C | `[surface]` |
| 9 | The pending gate is styled as an error, not authority. | A, C | `[surface]` |
| 10 | Rejection has no defined flow. The project holds at the gate, nothing tells the user what happens next, and there is no path to send the feedback back to the agent. | C | `[deeper]` |
| 11 | No retry on a failed agent run. Failed turns are correctly discarded, then the user is left with a toast and nothing to click. | A, C | `[surface]` |
| 12 | Errors surface raw API strings (`409 conflict`), auto-dismiss in 6s, and never diagnose / explain / recover. | B, C | `[surface]` |
| 13 | No cancel or timeout on a streaming run. A hung agent hangs the user indefinitely. | A, C | `[deeper]` |
| 14 | Approval queue is not a place — it is inferred from badges. Same for decision history and agent run detail. | A, C | `[deeper]` |
| 15 | Artifact types are masked: four structurally different documents render through one generic `FieldBlock` path. Finding severity (`blocker` vs `minor`) is invisible. | A, C | `[surface]` |
| 16 | `Station` is a shapeshifter — four unrelated visual forms (sidebar badge, stepper node, header pill, checkpoint row) for one object. | C | `[surface]` |
| 17 | Nine Unicode glyphs used as icons across seven files; hand-rolled inline SVG elsewhere; no icon system. | B | `[surface]` |
| 18 | No semantic token layer. ~20 raw Tailwind palette escapes (`emerald`, `amber`, `sky`, `violet`, `orange`, `teal`). No spacing, radius, shadow, z-index or duration scale. | B | `[surface]` |
| 19 | Zero responsive breakpoints in the entire codebase. Reading measure collapses on a 13" laptop; no way to collapse either panel. | B | `[surface]` |
| 20 | Type floor is 9px. Eight instances below 12px. | B | `[surface]` |
| 21 | Inter loaded via a Google Fonts `<link>` — render-blocking third-party request, banned for production by the taste skill. | B | `[surface]` |
| 22 | No focus-visible system; `focus:outline-none` used with faint or absent replacement rings. | B | `[surface]` |
| 23 | Heading hierarchy is inverted — the `h1` is the sidebar wordmark; the project title is an `h2`. No landmarks. | B | `[surface]` |
| 24 | Placeholder-as-label in the decision form. No `<label>` on any input. | B | `[surface]` |
| 25 | No help, no glossary, no teaching empty states. "Artifact", "Completeness", "Gate" are undefined in-product. | A | `[surface]` |

### P2 — minor

| # | Finding | Lens | Kind |
|---|---|:--:|---|
| 26 | Per-token SSE writes rewrite the whole conversation map; no batching. **[runtime]** | B | `[surface]` |
| 27 | No scroll anchoring — there is no `useRef` anywhere in the app, so nothing follows the stream. | B | `[surface]` |
| 28 | `Sidebar` fires `loadProject` for up to 30 recents on mount, unconditionally. | B | `[surface]` |
| 29 | `window.confirm` for delete; unbranded, unlabeled, no undo. | B | `[surface]` |
| 30 | No `aria-current` on the selected project; touch targets ≈26px. | B | `[surface]` |
| 31 | Filter input hidden until 4+ projects; no sort; no keyboard project navigation. | A | `[surface]` |
| 32 | Unit-of-work `dependencies` are modeled and never visualized; `coverage[]` collapses to a count. | C | `[surface]` |
| 33 | No shared primitives — button, input and focus-ring class strings are copy-pasted 3–4× each. | B | `[surface]` |
| 34 | Vocabulary drift: "artifact" vs "output"; `G1` vs `blueprint approval` vs `D`; raw enum values shown to users. | C | `[surface]` |
| 35 | No optimistic-lock or conflict detection if two approvers act at once. | C | `[deeper]` |

---

## 6. Adjudications — where the skills disagreed

Consolidating meant resolving genuine conflicts, not averaging them.

**1. Confirmation modal before approval.** Lens A wants an "Are you sure?" modal.
`craft-floor` says *"a modal for a task that needs neither interruption nor protected
focus"* is a refusal, and Operate mode says *"modal as first thought is usually laziness."*
→ **Resolved: no modal.** Deliberateness comes from construction — the gate console
requires the criteria checklist to have been seen, shows the authenticated signer's real
identity, and separates the commit action from the browsing surface. Then add a **20-second
undo window** on the decision. Undo beats confirmation: it costs nothing when you are
right, and it actually saves you when you are wrong. This needs a backend affordance
(§9.2) — an unconfirmed decision is not dispatched until the window closes.

**2. How loud should the gate be?** Lens A says the red border reads as crisis and wants
it calmed to amber or blue. The product strategy says the gates *are* the product.
→ **Resolved: not alarming, but ceremonial.** Strip the error vocabulary (`!` avatar, red
hairline) — that is A's correct diagnosis. Replace with authority: a full-bleed band that
interrupts the thread, elevated surface, the handoff framed explicitly ("Distill is done.
Blueprint starts when you sign."), the criteria checklist, and the signer's real name and
photo. Red is spent on the commit control alone.

**3. One accent vs. four agent colors.** Taste §4.2 locks one accent per surface. Operate
mode permits a *state-rich semantic vocabulary*.
→ **Resolved:** the four agent hues are **data, not decoration**, so they are legitimate.
The lock becomes a rule: *identity hues never appear on interactive chrome; only UA red
does.* An agent hue may tint an avatar, a station marker, an artifact tab, and a line
segment — never a button, link, focus ring or selected state.

**4. Agent identity vs. the existing single-persona decision.** The user asked for
Grok-style per-agent icons. [pipeline.ts](ui/console/src/lib/pipeline.ts) carries a
deliberate, reasoned decision that swapping the speaker per stage *"made the conversation
read like a form for an internal artifact-generation tool."*
→ **Resolved: hybrid.** The original decision was right about *voice* and wrong about
*attribution*. One continuous assistant voice; every turn, artifact and station marker
stamped with the agent that produced it. This is how Claude and Grok label tool use and
sub-agent work — continuous conversation, attributed output. Reverses only half the prior
decision, and must be logged.

**5. Mobile.** Lens B wants `md:hidden` and a mobile drawer. Scope says desktop-only.
→ **Resolved:** no mobile IA. But the 13" laptop case is real and currently degrades badly,
so both panels become collapsible with a keyboard toggle, and the reading measure gets a
floor. Tablet degrades gracefully; phone is explicitly unsupported.

**6. Icons.** Taste §3.C bans hand-rolled SVG absolutely. But no library ships a "Distill
agent" mark.
→ **Resolved by splitting the two cases.** All *UI* icons come from one family
(Phosphor, `strokeWidth` 1.5 locked). The *four agent marks* are authored geometric SVGs —
identity, not iconography, which §4.8 permits as "a single, simple geometric mark". No
third source, ever.

---

## 7. The design system

### 7.1 Tokens

Replace the eight raw brand colors with a semantic layer. Brand values stay as private
primitives; **components may only reference semantic tokens.** This is the change that
retires findings 4, 18 and most of the contrast list.

```
primitives   ua-red #E4002B · ua-red-dark #B80022 · neutral ramp 0..1000
surface      base · raised · overlay · sunken · scrim
text         primary · secondary · muted · inverse · on-accent
border       subtle · default · strong · focus
status       success · warning · danger · info   (each: fg / bg / border)
agent        distill · blueprint · review · showroom   (each: fg / bg / line)
accent       UA red — reserved: primary action, current station, gate, needs-you
```

Plus the scales that do not currently exist: `space` (4px base), `radius`, `shadow`,
`z-index`, `duration` + `easing`.

**Shape lock:** one radius rule, followed everywhere — `sm` 6px inputs and chips, `md`
10px cards and panels, `full` avatars and status pills. Nothing else.

**Dark-first.** Every token pair is authored on the dark surface and verified at ≥4.5:1
for body, ≥3:1 for large text, before the light theme is derived. Light ships as a token
flip only — no component-level branching, no section-level inversion (taste §4.11).
> **As built:** light is the default and dark is the sibling. The verification rule turned
> out to matter more than the order: tokens must clear 4.5:1 against the *darkest surface
> they are used on*, not against the canvas. Checking only the canvas is what left
> `fg-subtle` at 4.49:1 on `bg-sunken` in the first cut.
### 7.2 Typography

Self-host **Geist** + **Geist Mono** with `font-display: swap`. This retires finding 21,
and Geist is designed for exactly this surface class. Mono is not a costume here — it
carries IDs, timestamps, percentages, requirement keys and JSON, which is the legitimate
use `craft-floor` permits.

Fixed rem scale at a 1.2 ratio, no fluid clamps (an Operate rule — a heading that shrinks
inside a panel looks worse, not better). **Floor of 12px, no exceptions**, retiring the
eight sub-12px instances. Body measure clamped to 65–75ch, which is also the fix for the
collapsing reading column in finding 19.

### 7.3 Icons and agent marks

One family, `@phosphor-icons/react`, `strokeWidth` locked at 1.5. Every one of the nine
Unicode glyphs and every hand-rolled inline SVG is replaced (finding 17).

Four authored agent marks — geometric, single-weight, legible at 16px, each carrying its
identity hue:

| Agent | Mark | Hue | Reads as |
|---|---|---|---|
| Distill | Converging funnel | Signal cyan | Intake, narrowing, clarifying |
| Blueprint | Modular grid | Indigo | Structure, decomposition |
| Review | Crosshair over a rule | Amber | Scrutiny, measurement |
| Showroom | Lit stage / frame | Emerald | Presentation, delivery |

Exact hues to be chosen against the dark surface and contrast-verified before use.

### 7.4 Motion

`motion/react`. 150–250ms on state transitions, exponential ease-out from an
already-visible default. Motion conveys state only — no decorative loops, no page-load
choreography. `prefers-reduced-motion` is honored with an intentional alternative that
preserves the state change rather than a blanket kill (finding 5).

**One authored moment,** and it is the gate: when a decision commits, the line visibly
advances and the next agent takes the station. That is the entire motion budget for
expression. It is also the demo's peak.

---

## 8. The shell

```
┌──────────────────────────────────────────────────────────────────────┐
│  ◆ Hyperdelivery      ◄── THE LINE ──►            ⌘K    ◔ 2     (A)  │  56px
├────────────┬───────────────────────────────────────┬─────────────────┤
│ NEEDS YOU  │  project title · station · agent      │  INSPECTOR      │
│  ● proj-a  │                                       │  ┌─┬─┬─┬─┐      │
│  ● proj-c  │  ── DISTILL ──────────────────        │  │D│B│R│S│      │
│            │  [user turn]                          │  └─┴─┴─┴─┘      │
│ ACTIVE     │  [assistant turn · stamped Distill]   │  criteria       │
│  proj-b    │                                       │  requirements   │
│  proj-d    │  ══ GATE 1 · SIGNED by A. Flor ══     │  gaps           │
│            │                                       │  evidence       │
│ DONE       │  ── BLUEPRINT ────────────────        │                 │
│  proj-e    │  [assistant turn · stamped Blueprint] │                 │
│            │                                       │                 │
│ ‹ collapse │  [composer]                           │  ‹ collapse     │
└────────────┴───────────────────────────────────────┴─────────────────┘
```

**Top bar.** The line is promoted from a 20px decoration in a thread header to the
primary orienting object, centered and persistent. **User profile moves to the top right**
(as requested) — avatar, name, and a menu carrying sign-out, theme, and shortcuts. It
leaves the sidebar, where it currently competes with the wordmark. A `⌘K` command palette
and an approval-queue indicator sit alongside it.

**Left rail.** Grouped by *what the user must do*, not by recency: **Needs you** first
(finding 14 — the queue becomes a real place), then Active, then Done. Collapses to a
56px icon rail. Search always visible (finding 31).

**Thread.** Station bands break the conversation into chapters so scrolling back reads as
a line log rather than undifferentiated chat, and fixes the shapeshifter (finding 16) by
giving `Station` **one** canonical form that scales: full band in the thread, compact
marker in the rail, node on the line.

**Gate.** A full-bleed band, not a card in the flow. Approved gates keep that weight
permanently — the checkpoint becomes the strongest horizontal rule in the thread, carrying
the signer's name, timestamp and comment (findings 8, 9, and the visible half of 2).

**Inspector.** Typed renderers per artifact kind instead of one generic path (finding 15):
a spec view with the criteria checklist, a blueprint view with the dependency graph, a
findings view sorted by severity with real severity badges, a demo view with the talk
track. Resizable, collapsible, Escape-dismissible.

---

## 9. Plan

Ordered so each phase is independently shippable and reviewable. Phase 0 must land first —
everything else depends on the token layer.

### Phase 0 — Foundations
Semantic tokens, dark-first theme resolution, type scale + self-hosted Geist, icon family,
motion primitives, `prefers-reduced-motion`, focus-visible system, shared primitives
(`Button`, `IconButton`, `Input`, `Field`, `Badge`, `Panel`, `Tooltip`).
*Retires 4, 5, 17, 18, 20, 21, 22, 33. Exit: zero raw palette escapes, zero Unicode icons, every pairing ≥4.5:1.*

### Phase 1 — The shell
Top bar with the line and the profile menu, grouped left rail, collapsible panels,
breakpoints down to 1280, reading-measure floor, landmarks and heading order, `⌘K` palette.
*Retires 14 (queue), 19, 23, 31. Exit: usable at 1280 with both panels collapsible.*

### Phase 2 — The gate
The gate console: criteria checklist, authenticated signer, decision + 20s undo, the
permanent signed checkpoint, the handoff moment, and the defined rejection flow.
*Retires 1, 3, 8, 9, 10. Exit: a reviewer can state what they approved against, and undo it.*

### Phase 3 — Legibility of work
Typed artifact renderers, severity badges, dependency graph, coverage matrix, agent
attribution on every turn, station bands.
*Retires 15, 16, 32, 34.*

### Phase 4 — Resilience and voice
Error taxonomy that diagnoses/explains/recovers, retry, cancel + timeout, `aria-live`,
scroll anchoring, SSE batching, `aria-current`, replace `window.confirm`, teaching empty
states and an inline glossary.
*Retires 6, 11, 12, 13, 25, 26, 27, 28, 29, 30.*

### Phase 5 — Places
URL routing, decision history view, agent run detail.
*Retires 2, 7. Depends on §9.2.*

### 9.1 Dependencies to add

Verified absent from `ui/console/package.json`. Each needs a `docs/decisions.md` entry.

| Package | For |
|---|---|
| `@phosphor-icons/react` | The icon family (finding 17). |
| `motion` | State transitions and the gate moment. |
| `@radix-ui/react-*` (dialog, dropdown-menu, tooltip, popover) | Accessible primitives — focus trap, Escape, ARIA wiring we would otherwise hand-roll badly. |
| `react-router` | Routing (finding 7). |
| Self-hosted Geist + Geist Mono | Retires the Google Fonts `<link>`. |

### 9.2 Backend work this implies

The console cannot fix these alone. Each is small and belongs to whoever picks up Phase 2/5.

1. `list_decisions(project_id)` on the repository + `GET /projects/{id}/decisions`. Nothing reads the audit trail today.
2. Take the signer from the validated Entra ID token server-side rather than trusting a client string. Finding 1 is not fixable in the UI alone.
3. Deferred dispatch for the undo window, or a compensating `revoke` on a decision.
4. Define rejection semantics: hold, or return to the prior agent with the comment as input? Today it holds, and nothing says so.
5. Optionally, `version` on `Project` for optimistic locking (finding 35).

---

## 10. Explicitly out of scope

Named so they are not silently reintroduced.

| Not doing | Why |
|---|---|
| Mobile IA | Desktop + graceful tablet only, per scope. |
| `Requirement` / `Finding` as queryable DB objects | Large backend change. Cross-linking within an artifact delivers most of the value. |
| Artifact versioning and diff | Current model is deliberately latest-wins; changing it is a product decision, not a UI one. |
| Analytics / agent performance metrics | No user has asked. Speculative infrastructure. |
| Pipeline branching | Changes the state machine. Out of scope entirely. |
| Onboarding tour library | Teaching empty states and an inline glossary first; a tour is what you build when the UI cannot explain itself. |
| Confirmation modal on approval | Replaced by undo — see adjudication 1. |
| Streaming artifacts live into the inspector | Interesting, unproven, and dependent on backend event shape. Revisit after Phase 3. |

---

## 11. Definition of Done for the implementation

Beyond `make check`:

- **Decisions to log** in `docs/decisions.md`: each new dependency; dark-first theming;
  the semantic token layer; agent attribution (partially reversing the `pipeline.ts`
  single-persona decision); undo-instead-of-confirm; server-side signer identity.
- **Docs to update**: `ui/console/README.md` (shell, routes, theming), `docs/architecture.md`
  (new endpoints), `.env.example` (only if `Settings` changes), `CHANGELOG.md` under
  `Unreleased`.
- **Per-phase gate**: every interactive component ships default, hover, focus, active,
  disabled, loading, error and empty. Contrast verified numerically, not by eye. No
  component references a primitive color directly.

---

## 12. What shipped, and where it departed from the plan

Phases 0-4 shipped. Phase 5 (routing shipped; decision history and agent run detail did
not, because they need §9.2). Findings 1-6 and 8-34 are addressed; 2, 7 (partially), 10
(partially) and 35 remain open on the backend.

**Departures worth knowing about:**

1. **Light is the default, not dark.** Changed on request after the plan was written. Both
   palettes are authored, so this sets the default rather than constraining the design.

2. **Contrast is verified against the darkest surface a token lands on, not the canvas.**
   The plan said "verified on the canvas", and that was not strict enough - `fg-subtle`
   passed on `--color-canvas` and failed at 4.49:1 on `--color-sunken` in the rail. Both
   themes now measure 0 failures with a worst case of 4.77:1 (light) and 4.85:1 (dark).

3. **The 12px type floor had to be enforced twice.** The first implementation reintroduced
   10px and 11px labels in 29 places despite the plan forbidding it. All were raised.

4. **Signer identity is fixed in the UI but not end to end.** The console now sends the
   authenticated user's email instead of a typed string, which closes the accidental case.
   It does not close the deliberate one: the API still trusts what it is sent. Finding 1 is
   *mitigated*, not resolved, until §9.2 item 2 lands.

5. **The cleared-gate checkpoint shows a locally recorded signature.** With no read
   endpoint for `Decision`, a gate signed in this browser shows who signed it and a gate
   signed elsewhere reads "Signed before this session". This is an honest placeholder, not
   an audit trail, and is labeled as such in the code and in `ui/console/README.md`.

**Not verified.** The redesign was inspected in a browser against a seeded store, which
exercises layout, both themes, contrast, focus and the type scale. It has **not** been run
against a live API, so streaming behavior, the undo dispatch, retry, cancel and the SSE
batching are correct by construction but unproven at runtime. That is the first thing to
exercise on the next real run.

---

## 13. The crew, and the visual signature

> **Superseded naming.** The Draft / Pattern / Fit / Showroom names below were replaced on
> 2026-08-28 by the staff titles Scout / Coach / Ref / Host at Combine / Playbook / Film Room
> / Gameday - see "Splitting station from crew" in [decisions.md](decisions.md). The
> faces, the one-head-per-agent rule and the hazard stripe still stand. On 2026-09-28 the
> station, output and gate names were replaced again with plain language around the same
> crew - see [design/vocabulary.md](design/vocabulary.md).

Added after the first implementation, from two references: the Hyperdelivery concept page
(an industrial factory line) and Grok Bot (avatars with eyes, and bots named by job).

**Naming.** §4 said the interface should feel authored for *this* product. Naming the
stations after the code (`Distill`, `Blueprint`, `Review`) worked against that: they are
engineering words for a product sold inside a sportswear company. They are now named for
the steps a garment actually goes through - **Draft · Pattern · Fit · Showroom** - which
makes the vocabulary teach the model instead of hiding it. "Draft is done. Pattern starts
when you sign" needs no glossary. Full rationale in `docs/decisions.md`.

**What was borrowed, and what was refused.** The concept page runs an animated conveyor
with rollers and a return belt. That is right for a concept page and wrong for a surface
someone uses all day, so the motion was left behind and only the static signatures were
taken: station numbering, the italic uppercase lockup, and one hazard stripe on the gate.
Grok's contribution was the naming discipline and faces with reactive eyes - the eyes blink
only while an agent is working, which keeps it a status indicator.

**One defect worth recording.** Draft's first crest was a hangtag arch over the head. It
read as a padlock, colliding with the lock the gates use, and was only obvious in a
screenshot. Replaced with an off-centre diagonal chalk stroke. Faces also need about 18px
to read at all - below that the crest and eyes collapse into a blob - so they sit at
`size-4.5` and up.
