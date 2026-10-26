<!-- Point-in-time research, retrieved 2026-10-25 for the UA-DLC plan. Claims carry source links; vendor features and dates change quickly, so verify before acting. See README.md in this folder. -->
<!-- cspell:words Cabra Gebert Micka Touillaud's Wayfinders Willison's automations beautifului fluidfunctionalism fxtwitter gabriell inspectable reactbits shapeof skimmable sparklines unvetted worktrees -->

# UI/UX references and AI-native outcome design for HyperDelivery (retrieved 2026-10-25)

Scope: this builds on `docs/design/` in the repo, which already covers kobra.systems, detail.design, reactbits.dev, beautifului.dev and diagram-design, plus the console's agent-states, approval-card and visual-language patterns. Nothing here repeats those. Web search ran out partway through (a budget shared across agents). After that, every product claim comes from fetching official pages directly. The one exception is called out where it applies.

## Part 1. The named references: what is new and useful

### 1. Taste Skill v2.1 (tasteskill.dev): the app-screen chapter matters most

[tasteskill.dev](https://www.tasteskill.dev/) is Leon Lin's MIT skill that keeps coding agents from producing generic UI. Two recent changes matter for HyperDelivery.

**The repo's vendored copy explicitly does not cover the console.** `.github/skills/design-taste-frontend/SKILL.md` is pinned at `ccbc156`. Its header scopes it to landing pages and portfolios, and away from dashboards, data tables and multi-step product UI. Upstream (2.1.5, [changelog](https://github.com/Leonxlnx/taste-skill/blob/main/CHANGELOG.md), dated 2026-10-25) now ships `references/app-screens.md`, which is distilled from measurements of 23 real product screens across 17 products. Its findings work as a review checklist for the console:
- **Color budget.** The median screen has about 3% colored pixels. 12 of 23 screens have no filled primary button. No screen puts icon circles or sparklines on its KPIs. 17 of 23 cards have no shadow.
- **Type.** One grotesk family. App h1 is 18-32px, and nothing reaches 48px. Body text is 13-16px (median 14) and labels are 12px. A screen uses 4-9 sizes (median 6) and a median of 3 weights. Tabular figures on every changing number. Sentence case on 19 of 23 screens.
- **Density is three settings that move together**: row pitch, padding and type size. Sparse screens use 56-92px rows, medium 44-56px, dense 28-42px.
- **States.** A real zero prints as "0". Missing data is a grey dash. An empty section keeps its frame and gets one sentence. On first run, the first action sits where the data will appear, with setup progress at its true percentage. Errors appear inside the failed block with a "last good at 09:14" stamp, never as a full-screen banner.
- **A "tells of generated dashboards" table.** Examples: "Welcome back" with a waving hand, four KPI tiles with icons, saturated status chips, neon on dark. In blind tests the judges called restrained screens "a well-applied kit, not a product with its own identity". The kit look they described includes stock Geist or Inter on #f8f8f8 with white 12px cards, which is close to the console's own base. The skill's fix is "one element only this product has". For HyperDelivery, that element is the line and its gates.

Housekeeping: in 2.1.3 the classic skills (`industrial-brutalist-ui`, `minimalist-ui`, `high-end-visual-design`) moved to [taste-skill-classics](https://github.com/Leonxlnx/taste-skill-classics), and `redesign-existing-projects` merged into the main skill (2.1.1). `THIRD_PARTY_NOTICES.md` will need updating on the next re-vendor.

### 2. Fluid Functionalism: a motion system you can adopt whole

[fluidfunctionalism.com](https://www.fluidfunctionalism.com/) is Micka Touillaud's library of 28 shadcn-compatible components. It is MIT ([repo](https://github.com/mickadesign/fluid-functionalism)) and built on Radix or Base UI 1.9, Tailwind v4 and motion ^14. Install with `npx shadcn@latest registry add @fluid`. It ships icon adapters for Phosphor, Tabler, Hugeicons and Untitled UI, so it passes the console's one-icon-family rule. The rules worth taking, from [motion-guidelines.md](https://github.com/mickadesign/fluid-functionalism/blob/main/motion-guidelines.md):
- **Three spring tiers, chosen by the size of what moves.** `fast` is 0.08s with no bounce (hover, focus, tooltips). `moderate` is 0.16s and critically damped (tab indicators, drawers). `slow` is 0.24s with bounce 0.12 (dialogs, stepped flows). No component writes its own duration.
- **Exits are tweens one tier faster** (0.06, 0.12 and 0.16s), so a dismissal reads as final rather than as the entrance played backwards.
- **Icon swaps.** Both glyphs stay mounted in one grid cell and crossfade with blur and scale. The label never changes, and an `aria-live` span announces "Copied".
- **Weight without reflow.** An invisible copy of the label at the heaviest weight reserves the width, so a selected tab can go bolder without the row jumping.
- **Fluid hover.** One highlight per list snaps to the nearest item's center, and a click in the gap between rows lands on the lit row.
- **Never stack two measured-height collapses.** When a parent collapses because its child did, the parent snaps instead of springing; a springing parent measured about 80px out of step mid-flight. Animate transforms, not `height`.
- **Reduced motion means fewer and gentler, not none.** Keep fades, drop travel.

Components that fit the console well: **AskUserQuestions** (stepped questions, single or multi-select, an "Other" free-text row, a free-text-only mode with validation, Skip, and arrow-key navigation), **ThinkingSteps**, and **ThinkingIndicator**. The [tone-of-voice](https://github.com/mickadesign/fluid-functionalism/blob/main/tone-of-voice.md) rules (lead with the count, plain words, no "seamless/powerful", instructions addressed to the hand) fit the console's vocabulary doc.

### 3. Bencho (bencho.dev): interaction-first blocks, with a new license catch

[bencho.dev](https://bencho.dev/) is by Lorenzo Cabra ([site JSON-LD](https://bencho.dev/), [X](https://x.com/cabralorenzo)). It holds roughly 140+ live React blocks grouped by interaction verb: Drag, Press, Hover, Type, Select, Swipe, Slide, Loading and Loop. Around them it adds Sounds, "Finds", an infinite-canvas **Bench** where you arrange and tune blocks in place, and an MCP server. Blocks relevant to HyperDelivery: Slide to confirm, Inline confirm, Access request, Step player, Checklist, Todo tower, Progress ticks, Blueprint loader, Toast stack, Rolling counter, Activity stack, Spec inspector and Upload dropzone.

**The license changed on 12 Oct 2026** ([license](https://bencho.dev/licence), [pricing](https://bencho.dev/pricing)). Only 44 blocks are now free (MIT). Pro costs EUR 79 a year, is licensed per person, and forbids three things: redistributing blocks as a kit, building a service or MCP that hands blocks to others, and adding them to training datasets. The [Dr. Web article of 15 Sep 2026](https://www.drweb.de/bencho-ui-bausteine/) still calls everything MIT; that is out of date. For a software factory this matters. Pro blocks must never flow into prototypes the coding agent generates for business users. Treat Bencho as inspiration plus a handful of MIT blocks. The verb taxonomy also maps neatly onto the console's existing frequency rule.

### 4. 21st.dev: a search index, not a dependency

[21st.dev](https://21st.dev) lists 12,000+ community components in shadcn registry format. Free users get 2 copies a day, and "21st AI" generation costs extra. There is an agent CLI (`npx @21st-dev/cli@latest init --client claude|cursor|codex|...`). Its [AI-chat category](https://21st.dev/s/ai-chat) has roughly 60-78 items; the page gives inconsistent counts. Quality and licenses vary by author. The useful find is **Agent Elements** ([agent-elements.21st.dev](https://agent-elements.21st.dev/)). Its registry JSON shows it depends on `@base-ui/react`, Tabler icons and Vercel's `ai` SDK, and it ships `plan-tool`, `question-tool`, `todo-tool`, `tool-group`, `mcp-tool` and a `tool-approval-footer`. That makes it a reference for how tool approval attaches to a tool row.

### 5. Ponytail (ponytail.dev): not UI, but useful to the factory

[Ponytail](https://ponytail.dev/) (Dietrich Gebert, MIT) is a ruleset that pushes coding agents toward the least code that works. The repo already vendors it for its own development. Three parts carry over to the factory:
- **The decision ladder**: is it needed, does it already exist in the codebase, the standard library, the platform, an installed dependency? This is exactly the brownfield-reuse question Blueprint should ask. Ponytail has instruction-only adapters for Copilot, so it can go into the generated repos the Copilot coding agent works in. Smaller diffs are easier to Review.
- **`/ponytail-debt`** harvests `shortcut:` comments into a ledger. Showroom needs the same thing: an honest list of what a prototype skips (mock data, no auth).
- **The "Band"**: a per-task bar showing cost, tokens, agent time, reuse rate and test status. It is a model for an outcome receipt.

The benchmark (53% less code, 26% cheaper across 39 tasks) is self-reported.

### 6. Beautiful UI: no change

Re-checked [beautifului.dev](https://www.beautifului.dev/). Still 21 copy-paste components, with no registry and no changelog. It still has no notification component and no plan component, which confirms the gaps the existing note implies. Nothing to add.

### 7. The animation-vocabulary post

[Gabriel (@gabriell_lab), 6 Oct 2026](https://x.com/gabriell_lab/status/2107443057805476100), via [fxtwitter](https://api.fxtwitter.com/gabriell_lab/status/2107443057805476100): about 375k views, 12k bookmarks. It is a 10.5s video, which I could not watch. The thumbnail names six terms: **scroll-triggered, scroll-linked, parallax, sticky, scroll snap, horizontal scroll**. They map to `whileInView`/`useInView`, `useScroll` plus `useTransform`, `position: sticky` and `scroll-snap-type`. Native CSS `animation-timeline: scroll()/view()` now has about 88% global support (Chrome and Edge 115+, Safari 26+, Firefox 159+; [caniuse](https://caniuse.com/mdn-css_properties_animation-timeline_scroll)).

The real lesson is the **vocabulary gap**: people who cannot name a pattern cannot ask an agent for it. HyperDelivery's users are exactly those people. The fix is to show options rather than name them. Offer visual pickers for look and feel, with thumbnails like Gabriel's, captured into the spec and handed to the coding agent. Claude Design's generated sliders and Canvas's reading-level slider use the same move.

## Part 2. How AI-native products design for outcomes (2025-2026)

- **Linear.** The [Agent Interaction Guidelines](https://linear.app/developers/aig) say an agent should: disclose that it is an agent, work natively in the platform, give instant feedback, show its internal state, stop when asked, and never be the accountable party. [AgentSession](https://linear.app/developers/agent-interaction) has six states (pending, active, error, awaitingInput, complete, **stale**). Activities are thought, elicitation, action, response and error, and thought or action activities can be **ephemeral**, replaced by the next one. Plans are a checklist with pending, inProgress, completed and canceled items, and every update replaces the whole plan. A session that shows no activity within 10s is marked unresponsive. Delegating keeps a human assignee. Since then Linear has shipped:
  - [Loops](https://linear.app/changelog/2026-07-20-introducing-loops): recurring agent work on a schedule or event, with every run inspectable.
  - [Text attribution](https://linear.app/changelog/2026-07-23-agent-assisted-editing): author indicators show whether a colleague or a loop wrote each piece of text, with checkpoint restore.
  - [Priority inbox and "Create with Agent"](https://linear.app/changelog/2026-09-03-priority-inbox): a project composer with autosaved drafts.
  - [The March 2026 refresh](https://linear.app/now/behind-the-latest-design-refresh): a dimmer sidebar so navigation recedes, fewer and softer borders (structure you feel rather than see), fewer and smaller icons, warmer and less saturated greys, and header actions in fixed positions. It shipped behind flags, using an in-house hue/chroma/lightness token tool built with Claude Code.
- **Claude.** [Claude Design](https://www.anthropic.com/news/claude-design-anthropic-labs) (17 Apr 2026) builds a design system from your codebase at onboarding. You refine through chat, direct text edits, inline comments, and **knobs and sliders Claude generates**. Sharing is org-scoped, colleagues can join a **group conversation** with Claude, and a **handoff bundle** goes to Claude Code. [Cowork](https://claude.com/product/cowork) asks for "what, not how", shows each step, waits for plan approval before significant actions (when enabled), and requires approval for deletions. Tasks run on schedules, keep going in the cloud with the laptop closed, and can be picked up on a phone. Plugins bundle skills, connectors and sub-agents. [Simon Willison's review](https://simonwillison.net/2026/Jan/12/claude-cowork/) shows a right rail with Progress, Artifacts and Context panels.
- **ChatGPT.** [Agent](https://openai.com/index/introducing-chatgpt-agent/) narrates what it is doing. You can interrupt and steer without losing progress, pause, ask for a progress summary, or stop and **receive partial results**. It notifies your phone when done, can schedule recurring runs, asks for explicit confirmation before consequential actions, and requires "Watch Mode" supervision for tasks like sending email. [Canvas](https://openai.com/index/introducing-canvas/) lets you highlight text to focus the model, suggests edits inline, has **length and reading-level sliders**, and keeps versions behind a back button. [Pulse](https://openai.com/index/introducing-chatgpt-pulse/) researches overnight, delivers scannable cards, and has a "Curate" control plus thumbs feedback.
- **Cursor 3** ([changelog](https://cursor.com/changelog/3-0), 2 Apr 2026). An Agents Window runs parallel agents locally, in worktrees, in the cloud or over SSH. Design Mode lets you annotate UI elements in the browser. `/best-of-n` runs one task across models to compare. Plans appear in shared chats.
- **v0** ([FAQ](https://v0.app/faq), Feb 2026 update). Git with a working branch per chat that never pushes to main. Previews run in a Sandbox close to production, at the cost of speed. **Publish stays disabled until there are changes and you have deploy permission**, and required checks still apply. It is aimed at PMs, designers and marketers.
- **Figma Make** ([page](https://www.figma.com/make/)). A plan mode produces an editable plan before generation. You can click any element to style, swap or prompt it, and batch annotations into one request. "Make kits" sync npm packages, library styles and guidelines. Version history tracks AI and manual edits together.
- **Notion** ([releases](https://www.notion.com/releases)):
  - Agents can **suggest edits** that you approve top to bottom (28 Aug 2026).
  - Nothing changes in a connected tool until you confirm (3.7, 15 Sep).
  - Version history attributes agent edits, and column permissions apply to agents (3.8, 13 Oct).
  - On 19 Oct, agents with their own computer can run for up to 24 hours, with a "Review for me" mode.
- **Granola.** [How Granola designs agents](https://granola.ai/blog/how-granola-thinks-about-designing-agents) (May 2026) argues for:
  - Transparency over confidence.
  - Honest failure modes: a flagged partial answer is fine, a confident wrong one is not.
  - A coverage-notes panel listing what the agent examined.
  - Making long waits legible; the post treats 38 seconds as long.

  Its [new look](https://granola.ai/blog/a-new-look-for-granola) used a hand-drawn logo and slab serif to escape generic SaaS. [Don't animate height](https://granola.ai/blog/dont-animate-height) moved a visualizer to transform-only: renderer CPU fell from 15% to 6%.
- **Perplexity Labs** ([post](https://www.perplexity.ai/hub/blog/introducing-perplexity-labs)). Designed for 10+ minute runs, with outputs collected in an **Assets** area under the query.
- **Dia / Atlassian.** Atlassian [acquired The Browser Company](https://www.atlassian.com/blog/announcements/atlassian-acquires-the-browser-company) (4 Sep 2025) to build a work-aware browser with skills and memory. UA's Atlassian estate may get this layer, so HyperDelivery should not compete as a general assistant.
- **Raycast** ([AI](https://www.raycast.com/core-features/ai)). Preset AI commands, custom agents with project memory, and scheduled automations that **show the next run** ("Daily at 09:00").
- **Shape of AI** ([shapeof.ai](https://www.shapeof.ai/), Emily Campbell). Organizes patterns as Wayfinders, Prompt actions, Tuners, Governors, Trust builders and Identifiers. Its [Action plan](https://www.shapeof.ai/patterns/action-plan) entry separates *advisory* plans (shown, not approved) from *contractual* ones (approved before running). It recommends editing the plan in place rather than regenerating, and explaining any divergence from it.
- **Microsoft Teams** is where UA's users already are. [Activity feed notifications](https://learn.microsoft.com/en-us/graph/teams-send-activityfeednotifications) (`sendActivityNotification`) deep-link into a tab. [Universal Actions for Adaptive Cards](https://learn.microsoft.com/en-us/microsoftteams/platform/task-modules-and-cards/cards/universal-actions-for-adaptive-cards/overview) (`Action.Execute`) supports user-specific views (only the approver sees Approve), sequential workflows, and cards that refresh to show who approved and when. It works in both Teams and Outlook.

## Part 3. Principles for HyperDelivery

**1. Progressive disclosure: outcome, then progress, then evidence.** Early feedback says users do not care which agent is working, so the first layer should name the deliverable and its state, not the worker. For example: "Your spec is being written. About 4 minutes. 14 requirements so far." The second layer is a Linear-style plan checklist in plain words. The third is the trace and sources, like Granola's coverage notes. Crew personas become texture: a small avatar, and voice in Detailed mode. Use ephemeral status lines that replace each other rather than piling up. Show stage and count, never a fake percentage.

**2. Long-running work must survive the user leaving.** Every run has a URL and a "since you left" digest. Add a **stale** state to the console's state model, beside working, waiting and done, so a silent agent reads as possibly stuck rather than busy. Pause, "summarize progress so far" and stop-with-partial-results belong beside the status, not hidden in a menu. Notify through Teams, not only the browser: it reaches the phone, which is what ChatGPT and Cowork achieve with their own apps. Recurring jobs show their next run.

**3. Approvals are contractual plans signed by an accountable human.** Each gate presents a skimmable plan plus what it commits to. The approver can edit it in place rather than regenerate, and any divergence is explained later. Keep Linear's split: the agent acts, a named human owns the result. Put gates where approvers already are: a Teams Adaptive Card with Approve or Send back, visible only to the assigned approver, that refreshes to a signed receipt. Keep in-console ceremony for rare moments. Copy v0's discipline: the irreversible button stays disabled, with the reason shown, until its preconditions hold.

**4. Artifact-first layout.** The deliverable (spec, design, demo) owns the main area and the conversation becomes a side rail, the pattern shared by Claude Design, Canvas, Cowork and Figma Make. Editing happens on the artifact: highlight to focus, inline comments, suggestions accepted top to bottom, and versions that attribute each change to a stakeholder or an agent. Attribution is what lets a business user trust a cited spec.

**5. Conversational first, structured fast.** Open with free text or a template. Then every agent question becomes a stepped card with options, "Other", Skip and keyboard support (Fluid AskUserQuestions, shadcn AI Elements Question). Express tuning as sliders and pickers (length, formality, density, motion), not prose. The ideathon finding argues for **multi-party intake**: invite a colleague from another function into the Distill session, Claude Design group-chat style, and attribute each contribution.

**6. Empty states teach the next action.** Use Shape of AI's Wayfinders: department-specific starters (for example, an EDM data-quality dashboard or a Snowflake report app), a gallery of past UA projects, and a sample of what the output will look like. Follow taste-skill's state rules: keep the frame, put the first action where the data will appear, and show true-percentage setup progress. Never show an illustration in place of a real zero.

**7. Motion encodes state change.** Spend motion on four things only: arrival, departure, progress and cause-to-effect (a handoff traveling to the next station). Adopt Fluid's spring tiers with faster exit tweens, the icon-swap recipe and the ghost-span weight trick. Animate transforms only (Granola's numbers prove the cost). Scroll vocabulary (scroll-linked, sticky and so on) belongs on the landing page and in Showroom demos, never in working surfaces.

**8. Typography and density for an enterprise tool.** Hold the console to taste-skill's measured ranges. Apply Linear's 2026 moves: dim the rail, fewer and softer borders, fewer icons, header actions in fixed places. Use warm neutrals with color on data and on "needs you" only. Change density by moving row pitch, padding and type together, never by shrinking type alone.

**9. Avoiding AI-generic aesthetics.** Run every screen against taste-skill's tells table. Avoid sparkle icons, gradient orbs, purple accents, glass, "Welcome back" headers and KPI tiles with icons. Identity comes from things only HyperDelivery has: the line, the gates, the UA stencil lockup and real UA project data. Granola shows that a deliberately imperfect, specific choice reads as more trustworthy than a polished generic kit.

## Part 4. Recommended stack (React 19, Tailwind v4, motion, Radix, xyflow)

Versions were checked on the npm registry on 2026-10-25.

| Need | Pick | Note |
|---|---|---|
| Primitives | Keep Radix, consolidating to the unified `radix-ui` 1.8.1 | Base UI 1.9 is viable but switching now buys nothing. Fluid and Agent Elements support both |
| Code distribution | `shadcn` 4.22 CLI as a copier, not a dependency | Registries: `@fluid`, shadcn **AI Elements** (Plan, Queue, Confirmation, Checkpoint, Subagent, Inline Citation; [docs](https://ui.shadcn.com/docs/ai-elements)) |
| Avoid | Vercel's `elements.ai-sdk.dev` | The [site](https://elements.ai-sdk.dev/) says it is deprecated at the end of November 2026 in favor of shadcn's version |
| Motion | `motion` 13.1 to **14.6** | 14.0 only removed internal compatibility APIs ([changelog](https://github.com/motiondivision/motion/blob/main/CHANGELOG.md)). Add a `springs.ts` with tiers and exits. `MotionConfig reducedMotion="user"` is already in `App.tsx` |
| Streaming text | `streamdown` 2.7 ([site](https://streamdown.ai/)) | Built for streamed AI markdown. Its license and Tailwind fit need checking before it replaces `react-markdown` |
| Panels | `react-resizable-panels` 4.15 | Artifact plus chat split |
| Lists | `@tanstack/react-table` 9 + `react-virtual` 3 | Requirements and findings |
| Numbers | `@number-flow/react` 0.6 | Tabular numbers that count up once |
| Toasts / palette | `sonner` 2.0.8; `cmdk` 1.1.1 | cmdk is stable but has not released since Mar 2025 |
| URL state | `nuqs` 2.10 | Filters as addresses |
| Canvas | `@xyflow/react` 12.12 + dagre | elkjs 0.12 still carries the EPL question |
| Spec editing with attribution | Decide between Tiptap 3.32 and Lexical 0.52 | Log as a decision. Tiptap's track-changes features may be paid |
| Skip | `vaul` (last release Dec 2024); full chat frameworks (assistant-ui) | HyperDelivery owns its stream protocol, so copy patterns instead |
| Factory outputs | taste-skill 2.1.5 + Fluid skill + Ponytail in generated repos' Copilot instructions | Free/MIT sources only. Bencho Pro and unvetted 21st components are excluded |
