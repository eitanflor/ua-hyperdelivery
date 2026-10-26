<!-- Point-in-time research, retrieved 2026-10-25 for the UA-DLC plan. Claims carry source links; vendor features and dates change quickly, so verify before acting. See README.md in this folder. -->
<!-- cspell:words Choropleth GAAP Holo Keycap Kuratli OHLC Reorderable Rerank Scrollbars Sparkline affordances cheatsheet drilldown firecrawl hoverable inspectable keycaps llms merch oklch paywalled playhead replayable reranking retargets retoken retokened retuned scatterplot signup sparklines squarified swipeable tabbar uiarc unblur underdamped waitlist watchlist -->

# uiarc.dev (Arc): complete inventory and HyperDelivery mapping

> Phone layouts and the dark theme described here are out of scope since 2026-10-26: HyperDelivery targets desktop and laptop browsers, light theme only.

| | |
|---|---|
| Key | `uiarc-inventory` |
| Retrieved | 2026-10-25 (catalog generated 2026-10-25 15:30 UTC) |
| Builds on | [ux-direction.md](../ux-direction.md) sections 3 to 6, 9 and 11; [research/ui-ux-references.md](ui-ux-references.md) (Bencho, 21st, stack); [research/agent-traces-observability.md](agent-traces-observability.md) (AgentPrism, affectUI, Kobra) |
| Sources | [llms.txt](https://uiarc.dev/llms.txt), [catalog.json](https://uiarc.dev/r/catalog.json), [registry.json](https://uiarc.dev/r/registry.json), [license](https://uiarc.dev/license), [pricing](https://uiarc.dev/pricing), [introduction](https://uiarc.dev/docs/introduction), [installation](https://uiarc.dev/docs/installation), [changelog](https://uiarc.dev/docs/changelog), [roadmap](https://uiarc.dev/roadmap), [imprint](https://uiarc.dev/imprint), [terms](https://uiarc.dev/terms), [GitHub repo](https://github.com/kuratlielia/arc-library), the site's sidebar navigation (scraped with firecrawl), and per-item pages and markdown |

## 1. Summary

- **Arc is 299 items: 187 components and 112 blocks.** 142 are free under MIT (120 components, 22 blocks); 157 are Arc Pro (67 components, 90 blocks). The machine-readable [catalog](https://uiarc.dev/r/catalog.json) lists every item, Pro included, with when to use, when not to, accessibility, motion, responsive, performance and AI notes. All 299 are inventoried in Appendix A, each with a HyperDelivery verdict.
- **It targets almost exactly our stack:** React 19, TypeScript, Vite or Next.js, `motion`, Radix for a few primitives and `lucide-react` icons. It styles with **CSS modules and CSS variables, not Tailwind**, which is the main integration cost for the console ([installation](https://uiarc.dev/docs/installation)).
- **The Pro "AI" set is the closest thing on the market to the owner's reference trace.** [Agent timeline](https://uiarc.dev/components/agent-timeline) has colored rows per agent with model marks, elbow handoff connectors, failed and retry markers, a playhead with play, pause, scrub and speed, and a live mode. It lacks only a slowest badge. Tool call, Agent status, Agent plan, Context window, Agent orchestrator, Knowledge base, Agent memory, AI side panel, AI composer and MCP servers map one to one onto the owner's direction (orchestrator delegation, resources as a moat, collaborative documents).
- **The free tier is a strong base for the console and for the UA internal app kit:** tables (sortable, tree), filter toolbar, timeline, comment thread, mention input, page header, command palette, notification center, empty states, resizable panels and charts. 54 free items form a sensible app kit v1 (section 8).
- **License:** free items are plain MIT (copyright 2026 Elia Kuratli). Pro may be used in internal tools, but it explicitly forbids offering Pro source "through a tool that lets others generate or copy it, such as a public MCP server, code generator or registry", and putting it in "an agent that others can use to reproduce it" ([license](https://uiarc.dev/license)). HyperDelivery's coding agent is that kind of tool. **Pro is console-only, never in the app kit, generated prototypes, factory skills or any registry the coding agent can reach.**
- **Maturity and vendor risk are real.** First release was September 2026; most of the AI and Agents items (Agent timeline, Tool call, Agent status, Agent plan, Context window, Agent orchestrator, Knowledge base, Agent memory, MCP servers and others) shipped on 2026-10-20, five days ago; items ship almost daily; the vendor is a Swiss sole proprietorship that is not in the commercial register ([imprint](https://uiarc.dev/imprint)). Treat Arc as source to copy and own, which is its model, not as a dependency to track.
- **Gaps Arc does not fill:** a decision timeline by person (gantt), a node-graph canvas, brand marks for UA's systems (Snowflake, Teams, OneDrive, SharePoint, Jira, Confluence, Bedrock, S3), Teams Adaptive Cards, a free app shell and a free data grid.

## 2. What Arc is

| Fact | Detail | Source |
|---|---|---|
| Maker | Elia Kuratli, sole proprietorship, Frauenfeld, Switzerland; Swiss law governs the terms | [imprint](https://uiarc.dev/imprint), [terms](https://uiarc.dev/terms) |
| Age | First public release in September 2026; Agent timeline, Tool call, Agent status, Agent plan, Context window and every Agents block except Agent run released 2026-10-20 (Agent run and AI chat were in the first release, AI side panel on 2026-10-06, Research run on 2026-10-24); Uptime status and Ruler slider 2026-10-25 | [changelog](https://uiarc.dev/docs/changelog) |
| Counts | 187 components and 112 blocks (catalog and llms.txt agree). The sidebar shows "Components 129, Blocks 105, Special components 55" because families share a page (four theme switches, four sidebars, five logins). One page footer still said "186 components" and the GitHub README says 119 components (Ruler slider is newer) | [llms.txt](https://uiarc.dev/llms.txt), site nav, [repo README](https://github.com/kuratlielia/arc-library) |
| Organization | Components grouped by job (actions, inputs, disclosure, feedback, data, text); Special components are "motion-forward pieces with layered interaction"; Blocks are complete flows | [introduction](https://uiarc.dev/docs/introduction) |
| Stack | React 19 with TypeScript and the `@/*` alias; Next.js or Vite; CSS modules on a small token set; `motion` (repo pins `^13.4.0`); 225 of 299 items use `lucide-react`; Radix only for tooltip (20 items), dropdown menu (19), popover (13), switch (8), dialog (5), select (5), checkbox (3), tabs (3), accordion (1) | [installation](https://uiarc.dev/docs/installation), catalog dependencies, repo `package.json` |
| Distribution | shadcn-compatible registry: free items at `https://uiarc.dev/r/{name}.json`, Pro at a token-gated `@uiarc-pro` registry. The public registry holds 145 entries, all free (120 components, 22 blocks, foundation, motion tokens, agent skill) and none references a Pro item | [registry.json](https://uiarc.dev/r/registry.json) |
| AI tooling | Per-item markdown, `llms.txt`, `llms-small.txt`, `llms-full.txt`, a free agent skill (`SKILL.md`, `INSTRUCTIONS.md`, checklist, motion, accessibility), Pro-only skills (full-page generation, refactor to Arc, audits), and an MCP server at `/api/mcp` that requires an Arc account over OAuth | [llms.txt](https://uiarc.dev/llms.txt), [AI docs](https://uiarc.dev/docs/ai) |
| Price | Pro yearly $149; lifetime $249; team of up to 10 for $799 once or $449 a year; more than 10 or a company-wide license by email | [pricing](https://uiarc.dev/pricing) |
| Roadmap | Now: monthly Pro templates, Autocomplete, SQL editor, GAAP financial report, more chart variants. A "Workflow editor" wish (nodes, conditionals) exists but is not planned | [roadmap](https://uiarc.dev/roadmap) |

The agent rules inside `llms.txt` are worth noting because HyperDelivery's coding agent would read them: prefer an existing Arc item, read its markdown first, keep a reduced-motion branch, use semantic tokens, sentence case, "regular and medium weights only", no eyebrow labels, no em dashes, no decorative gradients or glows, and "Pro items are licensed: never reconstruct their source".

## 3. License terms and what they mean for a software factory

**Free (MIT).** Use, change and redistribute, commercially or not, keeping the copyright notice. The free files carry no per-file header (checked in the cloned repo), so the notice has to travel as a `LICENSE` or `THIRD_PARTY_NOTICES` entry wherever we copy them.

**Pro (Arc Pro license).** Granted per seat to "use, copy and modify Pro source to build your own projects and end products". An internal tool counts as an end product. Each person who works directly with Pro source needs a seat; people who only use the product do not. The license forbids:

- redistributing Pro source on its own, as files, a package, a registry, a snippet collection or a download;
- building "a UI kit, component library, design system, template, theme or page builder" from it;
- offering it through "a public MCP server, code generator or registry" that lets others generate or copy it;
- using it to train a model offered to others, or putting it into "a shared prompt library, dataset or agent that others can use to reproduce it";
- sharing accounts or tokens, or removing the notices that mark a file as Arc Pro.

Giving Pro source to *your own* AI coding tools to build *your* projects is allowed. Yearly licenses keep covering Pro code already shipped after cancellation; a refund ends the license.

**What this means for HyperDelivery.**

| Destination | Free (MIT) | Pro |
|---|---|---|
| HyperDelivery console (`ui/console`) | Yes, with the MIT notice | Yes, for seat holders; keep the Arc Pro notices |
| UA internal app kit for generated prototypes | Yes; this is the intended source | **No.** The kit is itself a "design system" and it feeds a code generator |
| Code the coding agent writes for business users | Yes, via the kit | **No.** The factory is "a tool that lets others generate" code |
| Factory skills, prompts, `AGENTS.md` of generated repos, any MCP the coding agent reaches | Free markdown and the free skill, yes | **No**, including Pro docs used as a recipe to "rebuild" an item |
| Graduated repos handed to engineering | Clean if only the kit was used | Must not contain Pro |

Two cautions. First, the Pro docs and live previews are public, so a coding agent could be told to rebuild an item from them; Arc's own agent rules forbid that, and the [Kobra and affectUI attribution dispute](https://x.com/haaarshsingh/status/2113295780450587049) recorded in agent-traces-observability.md shows the reputational cost of provenance questions. Second, procurement: $799 is small, but the seller is a sole proprietor outside any commercial register, paid through Stripe or Whop. UA vendor review may still apply.

## 4. Fit with today's console

| Topic | Arc | Console today ([package.json](../../../ui/console/package.json)) and UA direction | Consequence |
|---|---|---|---|
| Framework | React 19, Vite supported | React 19.2, Vite 8 | Fits |
| Styling | CSS modules, `--background`, `--surface`, `--foreground`, `--text-secondary`, `--border`, `--accent`, `--success`, `--warning`, `--danger`, `--series-1..4` | Tailwind v4 with UA tokens (`ink`, `canvas`, `surface`, `line`, `muted`, `decision`, `danger`, `success`, `caution`) | Keep Arc files in `components/arc/` and map Arc's variables onto UA tokens in one override file. Two styling systems coexist; porting each copied item to Tailwind is possible but loses the upstream diff |
| Accent | Default accent is neutral gray (`oklch(33% 0 0)`) | Monochrome first; red only for "waiting on you" | Good match. **Never map `--accent` to UA red**: Arc uses it for highlights, shimmer and active states |
| Danger | `--danger` red, filled in some variants (danger button) | Errors are an outline icon plus words, never a fill, never decision red | Restyle danger variants |
| Radii | 18px controls, 26px panels, 34px surfaces | 3, 6 and 8px | Override `--radius-*` |
| Motion | `motion-tokens.ts`: every spring `bounce: 0` (snappy 0.26s, smooth 0.4s, morph 0.42s), durations 0.12 to 0.48s | Three critically damped tiers 0.08, 0.16, 0.24s; no bounce on signing; motion stops when work stops | Philosophy matches; one file to retune. Arc's shimmers already stop when inactive or off screen |
| Icons | `lucide-react` | `@phosphor-icons/react` | Swap icons on copy, or log a decision to allow lucide |
| Primitives | Radix per-component packages | Radix dialog, dropdown menu, tooltip | Fits; consolidating to `radix-ui` later is unaffected |
| Planned libraries | Arc has resizable panels, toasts, animated counter, command palette, sortable table | ux-direction section 11 plans `react-resizable-panels`, `sonner`, `@number-flow/react`, `cmdk`, TanStack Table and Virtual | Pick one per need and log it. Sensible split: TanStack for table logic and virtualization with Arc's table visuals; Arc's command palette or `cmdk`, not both |
| Typography rules | "Regular and medium weights only" | Condensed uppercase 700 to 800 for strings of three words or fewer | Override in the kit's instructions |

## 5. Category overview

`*` marks Pro. Full rows with descriptions, motion notes, dependencies and verdicts are in Appendix A.

| Section | Site group | Free | Pro | Items |
|---|---|---|---|---|
| Components | Buttons | 14 | 0 | Button, Action swap, Action button, Split button, Button group, Floating button group, Expanding button group, Copy button, Theme switcher (+ Eclipse, Split, Rise), Icon morph, Confirm morph |
| Components | Gestures | 3 | 0 | Hold to confirm, Swipe actions, Reactions |
| Components | Menus | 3 | 0 | Dropdown menu, Context menu, User menu |
| Components | Text fields | 7 | 0 | Input, Textarea, Password field, Password strength, Search field, Expanding search, Inline edit |
| Components | Special inputs | 7 | 0 | Number field, Money input, Phone input, Scrub input, Tag input, Mention input, Shortcut recorder |
| Components | Selects | 5 | 0 | Select, Combobox, Multi-select, Morph select, Chip group |
| Components | Toggles | 7 | 0 | Radio cards, Billing toggle, Checkbox, Radio group, Switch, Segmented control, Rating |
| Components | Sliders | 4 | 0 | Slider, Elastic slider, Range histogram slider, Ruler slider |
| Components | Pickers | 5 | 1 | Calendar, Date picker, Date range picker, Time picker, Color picker, Emoji picker* |
| Components | Editors | 3 | 1 | Rich text editor, Signature pad, File dropzone, Avatar upload* |
| Components | Navigation | 3 | 1 | Tabs, Breadcrumb, Pagination, Mega menu morph* |
| Components | Expand | 5 | 0 | Scroll area, Accordion, Expandable card, Resizable panels, Expandable text |
| Components | Overlays | 6 | 1 | Dialog, Drawer, Bottom sheet, Popover, Hover card, Tooltip, Share access* |
| Components | Messages | 5 | 0 | Alert, Toast, Toast stack, Announcement bar, Cookie consent |
| Components | Progress | 6 | 0 | Progress, Skeleton, Stepper, Countdown, Usage meter, Onboarding checklist |
| Components | Avatars | 3 | 1 | Avatar, Avatar group, Badge, Presence stack* |
| Components | Cards | 3 | 0 | Card, Metric card, Empty state |
| Components | Charts | 13 | 1 | Line, Bar, Donut, Streamgraph, Brush, Waffle, Slope, Sparkline, Gauge, Activity heatmap, Animated counter, Ridgeline, Treemap, Split bar* |
| Components | Advanced charts | 0 | 7 | Sunburst*, Sankey flow*, Funnel*, Radar*, Realtime stream*, Race bar*, Data grid* |
| Components | Tables | 7 | 0 | Sortable data table, Tree table, Tree view, Reorderable list, Filter toolbar, Code block, JSON viewer |
| Components | Activity | 3 | 0 | Timeline, Comment thread, Chat thread |
| Components | Media | 3 | 0 | Image compare, Carousel, Card stack |
| Components | Text effects | 4 | 0 | Text reveal, In-view title, Text morph, Text shimmer |
| Special | Docks and tabs | 0 | 6 | Share sheet*, Action morph*, Morph nav*, Dock*, Liquid tab bar*, Orbit menu* |
| Special | Glass | 0 | 4 | Glass menu*, Glass segmented*, Glass card*, Glass tab bar* |
| Special | Surfaces | 0 | 6 | Sheet stack*, Wallet stack*, Control center*, Holo card*, Card to article*, Link unfurl* |
| Special | Galleries | 0 | 4 | Product gallery*, Lightbox gallery*, Photo grid*, Cover flow* |
| Special | Audio and video | 0 | 3 | Voice orb*, Now playing*, Voice recorder* |
| Special | Data | 0 | 4 | Booking pill*, Activity rings*, Time dial*, Date reel* |
| Special | Type | 1 | 3 | Keycap keyboard*, Slot text, Sand text*, Typewriter terminal* |
| Special | Loaders | 0 | 4 | Stretch refresh*, Morph loader*, Skeleton morph*, Black hole* |
| Special | Playful | 0 | 3 | Sticker peel*, Page curl*, Orbit logos* |
| Special | Cursor | 0 | 3 | Dot grid*, Gravity well*, Ink fluid* |
| Special | AI | 0 | 5 | Agent status*, Tool call*, Agent plan*, Agent timeline*, Context window* |
| Special | Illustrations | 0 | 9 | Data flow*, Payment flow*, Multi-region failover*, Vector search*, Agent loop*, Mixture of experts*, Speculative decoding*, Prompt cache*, Reasoning tree* |
| Blocks | Analytics | 0 | 12 | Metrics dashboard*, KPI drilldown*, Metric explorer*, Revenue explorer*, MRR waterfall*, Cohort retention*, Usage forecast*, Journey flow*, Uptime status*, Choropleth explorer*, Connected scatter*, Horizon chart* |
| Blocks | Finance | 0 | 2 | Market terminal*, Budget variance* |
| Blocks | Line charts | 0 | 2 | Small multiples*, Line replay* |
| Blocks | AI | 0 | 10 | AI chat*, AI composer*, AI answer*, Model picker*, Model arena*, Prompt studio*, Document extraction*, Agent memory*, AI side panel*, Research run* |
| Blocks | Agents | 0 | 8 | Agent run*, Agent tasks*, Agent approvals*, Agent routines*, Agent orchestrator*, MCP servers*, Knowledge base*, Eval suite* |
| Blocks | App shell | 4 | 6 | Sidebar family* (Workspace sidebar, Sidebar rail, Docs sidebar, Inbox sidebar), Page header, Command palette, Notification center, Selection toolbar*, Empty states, Search results* |
| Blocks | Auth | 4 | 4 | Login family (Sign up form, Sign in, Centered login; Immersive login*, Login split*), Onboarding illustration*, OTP input, Multi-step form* |
| Blocks | Settings | 0 | 6 | Settings page*, Settings command*, Security settings*, Billing overview*, Usage billing*, Cancel flow* |
| Blocks | People | 0 | 4 | Team members*, Invite people*, Team directory*, Roles and permissions* |
| Blocks | Developer | 0 | 4 | API keys*, Webhooks*, Integrations*, Environment variables* |
| Blocks | Pricing | 1 | 5 | Plan comparison, Pricing calculator*, Usage pricing*, Cart drawer*, Checkout summary*, Live checkout* |
| Blocks | Commerce | 0 | 5 | Invoice studio*, Wallet card*, Delivery tracker*, Product listing*, Product detail* |
| Blocks | Support | 0 | 4 | Inbox triage*, Support conversation*, Support widget*, Help center* |
| Blocks | Media | 1 | 1 | File upload, Media player* |
| Blocks | Projects | 0 | 5 | Week calendar*, Availability picker*, Project board*, Release readiness*, Kanban board* |
| Blocks | Heroes | 1 | 1 | Hero section, Hero signup* |
| Blocks | Features | 1 | 3 | Scroll story*, Spotlight grid*, Feature bento*, Comparison table |
| Blocks | Social proof | 2 | 1 | Logo marquee, Studio perspectives*, Stats band |
| Blocks | Content | 4 | 1 | Changelog feed, FAQ section, Contact section, Team showcase*, Blog grid |
| Blocks | Headers and footers | 4 | 0 | Site header, Site footer, CTA section, Newsletter signup |
| Blocks | Showpieces | 0 | 6 | Activity terrain*, Revenue globe*, Customer galaxy*, Semantic zoom*, Layout morph*, Exploded view* |

Verdict totals across all 299: free items 72 Adopt, 20 Adapt, 12 Inspiration, 38 Skip; Pro items 13 Adapt-Pro (console only), 56 Inspiration, 88 Skip.

## 6. Mapping onto HyperDelivery surfaces

Verdicts: **Adopt** (copy, retoken, use), **Adapt** (copy and change materially), **Adapt-Pro** (needs Pro seats; console only), **Inspiration** (study the interaction, build our own), **Skip**. Nothing Pro may appear in the app kit or a generated prototype.

### 6.1 Home and Inbox

| Item | Verdict | How |
|---|---|---|
| Empty state, Empty states block (free) | Adopt | "Nothing needs you. 3 projects moving." Restyle the morphing illustration monochrome |
| Expandable card (free) | Adapt | Project outcome card: preview thumbnail, mini line with split times, one status line, one next step; expands in place |
| Filter toolbar, Chip group (free) | Adopt | Inbox facets (approvals, questions, disputes, reviews; oldest first) |
| Action swap, Action button (free) | Adopt | Nudge to Nudged; Reassign with pending and done states |
| Notification center (free) | Adapt | A "since you left" popover in the top bar; the Inbox stays a page |
| Changelog feed (free) | Adapt | *Across UA*: recently shipped work the viewer may see |
| Inbox triage (Pro) | Inspiration | Snooze and restore motion; never archive an approval |
| Time dial (Pro) | Inspiration | "Waiting for Dana (Finance) · 2d" with whether it is working hours where Dana is |
| Swipe actions (free) | Inspiration | Phone Inbox: swipe opens or snoozes, never approves |
| Metric card (free) | Skip on Home | Home has no KPI tiles by direction |

### 6.2 Start a project

| Item | Verdict | How |
|---|---|---|
| AI composer (Pro) | Adapt-Pro | One box: pasted links become resource chips, files upload in place only when there is nothing to point at, @ people (from catalog owner tags), / for the four starters, send becomes a stop ring. Remove the model and effort menu |
| File dropzone, File upload (free) | Adopt | Drop files; constraints, progress and errors |
| Link unfurl (Pro) | Inspiration | Paste a Teams recording, OneDrive folder, Jira ticket or Confluence link and it unrolls into a resource card (title, owner, freshness, access) instead of an upload |
| Radio cards (free) | Adopt | Starters (new, change something that exists, report to app, fix), depth choice with its time cost, the visual picker (layout, density, chart type, tone) |
| Mention input, Tag input (free) | Adopt | Suggested people and resource tags |
| Stepper (free), Multi-step form (Pro) | Adapt / Inspiration | Optional guided prompts (who uses it, what data, how you will know it worked) |
| Comparison table (free) | Adapt | Triage results side by side: "CoWork can answer this today", "Supply Chain is already building this", "Request from EDMA BI" |

### 6.3 Project page by stage

| Stage | Items | Verdict | How |
|---|---|---|---|
| All | Page header (free) | Adopt | Header folds into a compact bar on scroll; full line in the header, 120px mini line in the compact bar; tab counts roll |
| All | Tabs, Resizable panels (free) | Adopt | Primary object plus assistant rail; split at 1440px and wider |
| All | AI chat (Pro), Chat thread (free) | Adapt-Pro / Adapt | Assistant rail: streamed markdown, folding reasoning, cited sources; one voice; model chip only in Layer 3 |
| Before approval 1 | AI side panel (Pro) | Adapt-Pro | Living document: the assistant proposes edits as word diffs, apply with a tint sweep, one-click undo. With Confluence as the collaboration space, each applied change becomes a Confluence revision with attribution |
| Before approval 1 | Comment thread, Mention input (free) | Adapt | Questions anchored in the margin beside the section they inform; ingested Confluence inline and footer comments shown with resolve state |
| Before approval 1 | Presence stack (Pro) | Inspiration | Who is in the document now during a working session |
| Before approval 1 | Rich text editor (free) | Inspiration | Slash menu and floating toolbar only; the editor is still the Tiptap or Lexical decision |
| Working session / Confirm what we heard | Document extraction (Pro) | Inspiration | Facts on the right, transcript or page on the left; hovering a fact draws a connector to its source span; confidence and "inferred" notes |
| Working session | Media player (Pro) | Inspiration | Teams recording playback beside its transcript |
| Before approval 2 | Agent plan (Pro) | Adapt-Pro | The plan as an editable draft that becomes a live checklist after approval. Approval itself stays a gate |
| During build | Agent status (Pro), Text shimmer (free), Timeline (free) | Adapt-Pro / Adopt | "Building: 3 of 8 pieces done, about 2 hours left"; status capsule with live ring; "Since you left" digest |
| During build (engineer view) | Agent run (Pro) | Adapt-Pro | Coding agent steps, diff approve or send back, PR button. Engineering reviewers only; business users never see diffs |
| Approval 3 | Image compare (free), Skeleton morph (Pro) | Adapt / Inspiration | Changes since approval as before and after; preview waking grows from skeleton to content |
| Resources tab (new) | Knowledge base (Pro), Tree view (free) | Adapt-Pro / Adopt | Pointed resources and their indexing pipeline (section 7, item 5) |
| Memory (new) | Agent memory (Pro) | Adapt-Pro | What HyperDelivery remembers about this project, with source, edit and forget |

### 6.4 Gate decision

| Item | Verdict | How |
|---|---|---|
| Accordion, Drawer (free) | Adopt | Evidence per acceptance criterion; "Not verified: check this yourself in the preview" |
| Split button (free) | Adopt | Send back, with Ask someone and Reassign in the menu. Approve stays a separate, visible black pill with the attestation |
| Reorderable list, Avatar group (free) | Adapt | Co-sign row with order and state |
| Date picker (free) | Adopt | Expiry in the consequence line |
| Image compare (free) | Adapt | "3 changes since approval: review only the changes" |
| Expandable text (free) | Adopt | Rationale in decision records |
| Hold to confirm, Signature pad (free), Confirm morph for signing | Skip | The direction replaced hold-to-sign with an attestation sentence |
| Release readiness (Pro) | Inspiration | Graduation: readiness checklist with the final action beside it |

### 6.5 Trace and activity (three layers)

| Layer | Item | Verdict | How |
|---|---|---|---|
| 1 | Timeline, Text shimmer, Text morph (free) | Adopt | Narration and human waits, newest first, grouped by day |
| 1 | Agent status (Pro) | Adapt-Pro | Status capsule with HyperDelivery's mark (one voice); needs-input state for "waiting on you" |
| 2 | Agent orchestrator (Pro) | Adapt-Pro | Orchestrator lanes: Cortex Code, coding agent, resource reader; packets show dispatch and return |
| 2 | Tool call (Pro) | Adapt-Pro | "Used 4 tools · 12s" groups with real logos; Allow and Deny only for side-effecting tools |
| 2 | Webhooks (Pro) | Inspiration | Side-effect ledger: delivery history, payload inspector, retries |
| 2 and 3 | Agent timeline (Pro) | Adapt-Pro | The reference trace (section 7, item 1) |
| 3 | JSON viewer, Code block (free) | Adopt | Raw span, tool input and output |
| 3 | Context window (Pro) | Adapt-Pro | What a turn carried: system prompt, tools, resources, memory, messages |
| 3 | Brush chart, Treemap (free) | Adapt | Overview strip for long traces; cost by agent, tool and model |
| 3 | Typewriter terminal, Line replay (Pro) | Inspiration | Sandbox log replay with scrubber; key moments annotated as the playhead passes |

Arc does not replace AgentPrism (MIT): Agent timeline is a compact multi-agent view sized for "a few hundred spans" in a 360 to 760px card, not a trace tree with details tabs. Pair them: AgentPrism's `TraceSpan` model and tree, Arc-style swimlanes on top.

### 6.6 Decision timeline by person

Arc has no gantt. Two routes:

1. **Adapt Agent timeline (Pro).** Its data model is generic: rows (`agents`) with a name, role, color and mark; spans of kind thinking, tool or waiting with start, end, label and status; handoffs between rows. Map rows to people (requester, business owner, data steward, engineering reviewer), "waiting" (hatched) to time the line waited on that person, solid spans to deciding and signing, handoffs to "asked Dana", "reassigned to Jordan". The playhead replays the project from idea to accepted prototype; the header summary becomes the split-time sentence. Failed becomes "sent back" with the round number.
2. **Build on free items:** Brush chart for the overview strip, Hover card and Avatar for row heads, Tooltip, and our own SVG bars on the 4px grid. Availability picker (Pro) is inspiration for people-as-rows across time.

Either way, wait coloring follows ux-direction section 5: caution after two business days in the waited-on person's time zone, never red unless the wait is on the viewer.

### 6.7 Data tables

| Item | Verdict | How |
|---|---|---|
| Sortable data table (free) | Adopt | Visual layer; rows glide on sort, selection count rolls. Logic and virtualization from TanStack Table and Virtual |
| Tree table (free) | Adopt | Criteria to evidence, work breakdown, Library facts by domain; hierarchy-preserving sort, lazy children |
| Filter toolbar (free) | Adopt | Chips with morphing values; state in the URL with `nuqs` |
| Tree view, JSON viewer, Pagination (free) | Adopt | Resource trees, raw records, generated apps |
| Selection toolbar (Pro) | Inspiration | Batch actions for Library and admin only. **No bulk approve, ever** |
| Data grid (Pro) | Inspiration | Spreadsheet range selection for a numbers check; never in generated apps |

### 6.8 Architecture canvas

xyflow stays the engine; Arc has no node editor (the "Workflow editor" wish on the [roadmap](https://uiarc.dev/roadmap) is not planned).

| Item | Verdict | How |
|---|---|---|
| Hero section, workflow variant (free) | Adapt | Its routing animation (each step turns accent while it runs, data draws along the edge, result and time swap in) becomes a "Replay a request" mode on xyflow edges |
| Data flow (Pro) | Inspiration | Records as dots along cubic paths through a core to destinations; one rAF loop writing to the DOM so React does not render per frame |
| Semantic zoom (Pro) | Inspiration | Level of detail: system, then services, then components, as the viewport zooms |
| Context menu, Hover card, Button group (free) | Adopt | Node actions, node preview, zoom and fit toolbar |
| Dock (Pro), Floating button group (free) | Inspiration | Canvas tool tray |

### 6.9 Teams-like cards

Teams cards are Adaptive Cards rendered by Teams, so no React kit applies inside Teams. Arc helps the in-console preview and the evidence view the card opens: Agent approvals (Pro, inspiration) for laying out a request with its reason and arguments, Carousel (free) for evidence thumbnails, Bottom sheet (free, adapt) for the phone evidence view. The mini line in the card header stays an image, as the direction says.

### 6.10 Library

| Item | Verdict | How |
|---|---|---|
| Search results (Pro) | Inspiration | Mixed fact, person and file results with highlighted matches and a preview pane |
| AI answer, Research run (Pro) | Inspiration | "I found 7 confirmed facts that apply": every citation lights the sentence it supports |
| Knowledge base (Pro) | Adapt-Pro | Test a question against what UA already knows |
| Tree table, Tree view, Filter toolbar, Chip group (free) | Adopt | Facts by domain, status filters (certified, canonical, confirmed, not yet agreed) |
| Hover card, Badge (quiet), Expandable text (free) | Adopt | Who confirmed, reuse count, source |
| Team directory (Pro) | Inspiration | Owners and stewards |

### 6.11 Admin

| Item | Verdict | How |
|---|---|---|
| MCP servers (Pro) | Adapt-Pro | Connectors per workspace with each tool marked read or write and its context cost (section 7, item 14) |
| Integrations (Pro) | Inspiration | Connect morphs to Connected |
| Roles and permissions (Pro) | Inspiration | Entra group to role matrix; the review bar becomes a policy change awaiting its policy owner's signature, reusing the gate pattern |
| Usage meter, Sparkline, Number field, Money input, Switch (free) | Adopt | Budgets (workspace, Bedrock, Snowflake), thresholds, loop limits |
| Usage forecast, Usage billing, Budget variance (Pro) | Inspiration | Forecast cone with a draggable budget that dates the crossing |
| Model picker (Pro) | Inspiration | Model allowlist with provider marks; business users never pick models |
| Settings page, Settings command, Prompt studio, Eval suite (Pro) | Inspiration | Platform team surfaces |
| Agent approvals (Pro) | Inspiration | "Always allow" maps to a learned rule that waits for a policy owner |

### 6.12 Failure states

| Item | Verdict | How |
|---|---|---|
| Alert (free) | Adapt | Inside the failed block with "last good at", plain copy, one action; outline icon plus words, no red |
| Action button (free) | Adopt | Retry from this step; Reconnect Snowflake |
| Confirm morph (free) | Adapt | Stop and keep partial results, with undo |
| Tool call failed and retry states (Pro) | Adapt-Pro | Failure shown on the call that failed, with Retry |
| Morph loader, Skeleton morph (Pro) | Inspiration | Loader folds into a check or cross; preview waking |
| Uptime status (Pro) | Inspiration | "Tell the platform team" landing with an incident timeline |

### 6.13 Onboarding (first run)

Onboarding checklist (free, adapt) for three example projects, the two-minute sample walkthrough and the guided start; Empty states (free, adopt); Agent loop and Vector search (Pro, inspiration) for a short "how I work with your resources" explainer; Onboarding illustration (Pro, inspiration). Orbit logos (Pro) is marketing-leaning; skip unless the connected-sources moment needs it.

### 6.14 Generated prototypes: the UA internal app kit

Free MIT items only, retokened to UA (section 8). The banner every generated app carries (tier, freshness or "sample data", owner, expiry, Report a problem) can start from Announcement bar with dismiss removed. Arc's free tier has no app shell, sidebar or data grid, so the kit needs its own shell and TanStack for grids. **Excluded by license:** every Pro item, including tempting ones for UA prototypes such as Product listing, Product detail, Metrics dashboard, Data grid, Sidebar and Settings page.

## 7. The 15 components that would most elevate the concept screens

Ten of the fifteen are Pro (item 9 only as inspiration). For each, the fallback if Pro is not bought is named.

1. **Agent timeline (Pro), Activity Layer 2 and 3.** Map AgentCore and OTel spans into `AgentTimelineRun`: the orchestrator first, then Cortex Code, the coding agent and the resource reader, ordered so connectors pass through idle rows. Claude marks are inferred from the model name; pass custom marks for Cortex Code (Snowflake) and the Copilot coding agent (GitHub). Add a **slowest badge** (computed in the adapter, shown on the span and in its card) and cost per span from `src/core/domain/pricing.py`. Use live mode during a run and replay after. Retune `--series-1..4` to the agent hues in ux-direction section 6, none of which approach decision red. Labels carry metadata only on data-bearing steps. Second use: the decision timeline by person (6.6). *Fallback:* AgentPrism plus our own swimlane.
2. **Tool call and ToolCallGroup (Pro), assistant rail and Layer 2.** "Read 3 Confluence pages", "Asked Cortex Code for margin by region (metadata only)", "Created the repository" with a stacked logo header and total duration. Built-in marks are only GitHub, Linear, Postgres, Slack, Gmail and web ([tool-call markdown](https://uiarc.dev/components/tool-call/markdown)), so we supply 16px marks for Snowflake, Confluence, Jira, Teams, OneDrive, SharePoint, S3 and Bedrock under each brand's guidelines. Allow and Deny appear only on side-effecting calls, matching AGENTS.md "gate tools by direction". *Fallback:* affectUI's free Tool Call Card (MIT).
3. **Agent orchestrator (Pro), Layer 2.** The concept screen for direction (1): the orchestrator's plan items stream in, dispatch packets travel to Cortex Code and coding-agent lanes, results return as one-line summaries ("3 tables, margin by region at week grain, no rows"). Queued lanes stay dashed. *Fallback:* xyflow with our own lanes.
4. **Agent status (Pro), the status capsule on every project.** Activity rolls in, the live ring freezes when stale, needs-input gives one soft ping and becomes the red "Your approval" notch, done draws a check. Use HyperDelivery's mark, not an agent's. *Fallback:* Text shimmer plus Icon morph (free).
5. **Knowledge base (Pro), a new Resources tab.** Each pointed resource is a source row moving through parse, chunk, embed and index with counts, plus freshness and source permissions. "Test a question" shows which chunks ground an answer and why, including rerank. This makes the per-project index, the moat, visible and checkable. *Fallback:* Tree view plus Progress (free) and our own chunk preview.
6. **Agent memory (Pro), "What I know about this project".** Captured facts as one-sentence memories with source chips ("From the Teams meeting, 14:02", "From Confluence revision 12"), edit or forget in place, statuses aligned with the Library. *Fallback:* Tree table plus Inline edit (free).
7. **AI side panel (Pro), the living document before approval 1.** Edits arrive as word diffs, apply with a tint sweep and undo, and land as attributed Confluence revisions if Confluence is the collaborative space. *Fallback:* Tiptap or Lexical suggestion mode.
8. **AI composer (Pro), Start a project.** One box for words, files and links; @ people; / starters; stop ring; no model menu. *Fallback:* shadcn AI Elements prompt input plus Mention input and File dropzone (free).
9. **Document extraction (Pro, inspiration), Confirm what we heard.** Fact on the right, its transcript span on the left, joined by a drawn connector, with confidence and an "inferred" note. Build our own on the two-pane layout.
10. **Page header (free), every project page.** Folding header that carries the full line and collapses to the mini line; tab counts roll ("Open questions 3", "Evidence 5 of 6").
11. **Sortable data table, Tree table and Filter toolbar (free), every data-dense list.** Arc's motion and states on TanStack logic: criteria to evidence, Library facts, Inbox.
12. **Comment thread and Mention input (free), margin questions and Confluence comments.** Threads anchored to sections, resolve folds into a chip, "Not me, suggest who" as a reply action.
13. **Timeline and Text shimmer (free), Layer 1 and "Since you left".** Day-grouped narration with human waits; the shimmer on the current segment stops when work is stale and under reduced motion.
14. **MCP servers (Pro), Admin connectors.** Per workspace: Atlassian (mark built in), GitHub, Snowflake Cortex, Microsoft Graph and S3, each tool marked read or write with its context cost, pausable. *Fallback:* Switch, Usage meter and Sortable data table (free).
15. **Hero section workflow variant (free) with Semantic zoom (Pro, inspiration), the architecture canvas.** "Replay a request" lights nodes in order and draws data along edges; zoom reveals services and components. Built on xyflow.

## 8. Recommendations

1. **Use Arc's free tier now, as copied source, for the console and the app kit.** Keep it in `components/arc/` with a single token override mapping Arc's variables to UA tokens (neutral accent, UA radii, danger as outline, motion tiers retuned in `motion-tokens.ts`). Log the decision and the lucide versus Phosphor choice.
2. **Decide on Arc Pro as a logged decision.** A team lifetime plan is $799 for up to 10 named seats. It is justified only if the console adopts at least the AI set (items 1 to 8 and 14 above). Seats go to the people who touch Pro source. Confirm the procurement path for a Swiss sole proprietor first.
3. **Guard the factory.** Generated repos use only the UA app kit (vendored free items, pinned), never `@uiarc-pro`, never `ARC_PRO_TOKEN`, and never an Arc MCP session signed in with a Pro account. Add a CI check in generated repos and the kit that fails on `@uiarc-pro`, `/r/pro/` URLs or the Arc Pro file notice (exact notice text unverified; see section 9). Carry Arc's MIT notice in the kit's third-party notices.
4. **App kit v1 (free, 54 items):** Button, Action button, Split button, Copy button, Icon morph, Input, Textarea, Search field, Inline edit, Number field, Money input, Tag input, Select, Combobox, Multi-select, Chip group, Radio cards, Checkbox, Radio group, Switch, Segmented control, Date picker, Date range picker, File dropzone, File upload, Tabs, Breadcrumb, Pagination, Accordion, Resizable panels, Dialog, Drawer, Popover, Tooltip, Hover card, Alert, Toast stack, Skeleton, Card, Avatar, Badge (quiet), Empty state, Line chart, Bar chart, Donut chart, Sparkline, Sortable data table, Tree table, Filter toolbar, Timeline, Command palette, Page header, FAQ section, and Announcement bar as the provenance banner. Add a UA app shell and TanStack-based grids ourselves.
5. **Copy Arc's documentation pattern for the kit.** The per-item markdown (when to use, when not to, props, keyboard, accessibility, motion, AI notes) is what makes a library usable by a coding agent. Give every UA kit component the same page, and put the kit's rules (overriding Arc's "regular and medium weights only" and accent rules) in generated repos' instructions alongside taste-skill, Fluid Functionalism and Ponytail.
6. **Use the brand-mark pack in [logo-assets.md](logo-assets.md)** for tool chips and model marks (Snowflake, Cortex Code, Teams, OneDrive, SharePoint, Confluence, Jira, GitHub, Bedrock, S3, Claude), with each owner's trademark guidance checked, since no component kit ships these.

## 9. What could not be accessed or verified

- **Pro source** (paywalled). Pro verdicts rest on public previews, catalog metadata and per-item docs. The exact wording of the Arc Pro file notice is unverified.
- **Interactive previews:** only Agent timeline was viewed as a rendered screenshot; other motion descriptions come from the catalog's motion notes, not observation.
- **The MCP server** (needs an Arc account over OAuth) and **Pro skills** (members only) were not used.
- **Arc CRM template** and the [compare pages](https://uiarc.dev/compare) were listed but not read in full.
- Count discrepancies between the sidebar, the page footer, the README and the catalog are explained in section 2; the catalog generated on the day of retrieval is treated as authoritative.

## Appendix A. Full inventory (all 299 items)

Order follows the site's sidebar groups. "Extra deps" omits `motion` and `lucide-react`, which almost every item uses; `radix/x` means `@radix-ui/react-x`. `[kit]` marks free items eligible for the UA app kit. Free means MIT (copyright 2026 Elia Kuratli); Pro means the Arc Pro license. Stack for every item: React 19, TypeScript, CSS modules on Arc tokens, `motion`.

### Components (132 items: 119 free, 13 Pro)


#### Buttons (14)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 1 | [Button](https://uiarc.dev/components/button) `button` | Free, MIT | A clear, responsive action with quiet secondary states. | Presses scale to about 0.97 on a snappy spring; icon-sized buttons press slightly deeper. | - | **Adapt** (All): Restyle primary as UA black pill, secondary outline pill; keep the Save to Saved width morph [kit] |
| 2 | [Action swap](https://uiarc.dev/components/action-swap) `action-swap` | Free, MIT | Swap an action label while preserving its place and intent. | Width, padding, tone, and icon move on one morph spring; only the changed run of letters rises in from a soft blur. | - | **Adopt** (Inbox, gate): Nudge to Nudged, Connect to Connected without layout shift [kit] |
| 3 | [Action button](https://uiarc.dev/components/action-button) `action-button` | Free, MIT | A compact button for frequent toolbar actions. | Changed letters rise from a soft blur while the width springs to fit; the arrow leaves forward and a check draws itself in. | - | **Adopt** (Failure, Inbox): Pending and success states for Retry from this step, Nudge, Reconnect [kit] |
| 4 | [Split button](https://uiarc.dev/components/split-button) `split-button` | Free, MIT | A primary action with a menu of nearby alternatives. | The main label and icon morph in place while its width springs; the menu half never scales, so the menu opens from a still anchor. | radix/dropdown-menu | **Adopt** (Gate decision): Send back with Ask someone and Reassign in its menu; never put Approve in a menu [kit] |
| 5 | [Button group](https://uiarc.dev/components/button-group) `button-group` | Free, MIT | Related actions joined into one surface with hairline dividers: a hover highlight glides between segments, the pressed one answers in place, and an attached menu can close the row. | One highlight lives under all segments. Moving the pointer or keyboard focus to another segment carries it there on the snappy spring; arriving from outside the group it fades in where it... | radix/dropdown-menu | **Adopt** (Trace, canvas): Zoom, fit and layer toolbars [kit] |
| 6 | [Floating button group](https://uiarc.dev/components/floating-button-group) `floating-button-group` | Free, MIT | Separate soft buttons in a quiet tray, with one shared highlight that morphs from button to button as you move, and a pressed state that settles in place. | One highlight per tray, driven by motion values so moving it never re-renders the buttons. It travels in position and size to the hovered or focused button on the morph spring, and stays... | radix/tooltip | **Inspiration** (Canvas): Shared highlight idea for a canvas tool tray |
| 7 | [Expanding button group](https://uiarc.dev/components/expanding-button-group) `expanding-button-group` | Free, MIT | Icon buttons in a compact group: the one you point at or focus grows to reveal its label while its neighbors slide aside, and an action confirms in place. | Each button's width springs on the morph spring between its icon size and icon plus measured label. Neighbors slide aside in normal flow and the group's own width follows, so nothing... | - | **Skip**: Hides labels until hover; weak discoverability for business users |
| 8 | [Copy button](https://uiarc.dev/components/copy-button) `copy-button` | Free, MIT | Copy a value with immediate confirmation. | The old icon and word fade out in about 100ms while the new ones fade in over about 160ms, with no blur; the check draws its stroke in. | - | **Adopt** (Trace, Library): Copy trace id, Jira key, source link [kit] |
| 9 | [Theme switcher](https://uiarc.dev/components/theme-switch) `theme-switch` | Free, MIT | Four smooth ways to move between light and dark appearance. | Sun and moon trade places with a shared rotation, scale, and blur on a snappy spring; the icon also nudges in the direction of the chosen variant. | - | **Adopt** (Shell): Plain light and dark switch only [kit] |
| 10 | [Eclipse](https://uiarc.dev/components/theme-switch-eclipse) `theme-switch-eclipse` | Free, MIT | The next appearance crosses the page like an eclipse. | variant="eclipse": the next appearance crosses the page like an eclipse; run it in onThemeChange with a view transition. | - | **Skip**: Decorative |
| 11 | [Split](https://uiarc.dev/components/theme-switch-split) `theme-switch-split` | Free, MIT | The next appearance opens from a slim center seam. | variant="split": the next appearance opens from a slim center seam; run it in onThemeChange with a view transition. | - | **Skip**: Decorative |
| 12 | [Rise](https://uiarc.dev/components/theme-switch-rise) `theme-switch-rise` | Free, MIT | The next appearance rises into place. | variant="rise": the next appearance rises into place from the bottom; run it in onThemeChange with a view transition. | - | **Skip**: Decorative |
| 13 | [Icon morph](https://uiarc.dev/components/icon-morph) `icon-morph` | Free, MIT | Icons that morph between states: menu to close, play to pause, copy to check, and more. | Lines rotate and slide, and shapes interpolate their path data, all on interruptible springs, so fast toggling reverses from wherever the icon is. | - | **Adopt** (Shell): Menu to close, copy to check [kit] |
| 14 | [Confirm morph](https://uiarc.dev/components/confirm-morph) `confirm-morph` | Free, MIT | A destructive button that morphs into an inline confirmation, a spinner, and a result with undo. | Only the pill's width moves, on the morph spring growing and the smooth spring shrinking, so corners and text never scale or wobble and nothing around it jumps. | - | **Adapt** (Failure, admin): Inline confirm with undo for Stop and keep partial results, remove a resource; never for signing [kit] |

#### Gestures (3)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 15 | [Hold to confirm](https://uiarc.dev/components/hold-to-confirm) `hold-to-confirm` | Free, MIT | Confirm a destructive action by holding, not tapping. | The fill advances on a linear timeline while held, rewinds on a smooth spring when released, and resumes from where it was on a quick re-press. | - | **Skip**: UA direction replaced hold-to-sign with an attestation sentence |
| 16 | [Swipe actions](https://uiarc.dev/components/swipe-actions) `swipe-actions` | Free, MIT | Reveal row actions with a swipe, or from the same actions in a menu. | The row tracks the finger, rubber-bands past its last stop, and settles on a spring that carries the release velocity; a flick projects its travel. | radix/dropdown-menu | **Inspiration** (Phone Inbox): Swipe to snooze or open only; a swipe must never approve |
| 17 | [Reactions](https://uiarc.dev/components/reactions) `reactions` | Free, MIT | Acknowledge a post in one tap, with counts that roll. | Pills scale in from a blur and reflow on a morph spring; the icon gets a velocity kick that stacks on quick taps, and digits roll in the direction of the count. | radix/popover | **Skip**: Teams and Confluence already carry reactions |

#### Menus (3)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 18 | [Dropdown menu](https://uiarc.dev/components/dropdown-menu) `dropdown-menu` | Free, MIT | A focused list of actions anchored to a trigger. | The highlight glides between items on a snappy spring for the pointer and jumps instantly for the keyboard. | radix/dropdown-menu | **Adopt** (All): Radix-based; matches the console's Radix [kit] |
| 19 | [Context menu](https://uiarc.dev/components/context-menu) `context-menu` | Free, MIT | Secondary actions kept close to the selected object. | The menu grows from the pointer on a snappy spring, even when clamped away from a viewport edge; reopening fades the old one out in place. | - | **Adopt** (Canvas, tables): Right-click on a canvas node or table row [kit] |
| 20 | [User menu](https://uiarc.dev/components/user-menu) `user-menu` | Free, MIT | Your account, settings, theme, and sign out behind the avatar. Opens as a bottom sheet on phones. | The panel scales and fades out of the avatar on a spring that never overshoots; rows fade in with a short stagger, and closing is a quick fade. | - | **Adopt** (Shell): Account, Show technical detail preference, theme, sign out; bottom sheet on phones [kit] |

#### Text fields (7)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 21 | [Input](https://uiarc.dev/components/input) `input` | Free, MIT | A single line field with clear labels and useful states. | Helper and error rows open their height on a smooth spring, then changed words rise in and unblur while numbers roll digit by digit. | - | **Adopt** (All) [kit] |
| 22 | [Textarea](https://uiarc.dev/components/textarea) `textarea` | Free, MIT | A multiline field for notes, descriptions, and longer text. | Message rows open their height on a smooth spring; changed words rise in with a soft blur and counts roll only the digits that changed. | - | **Adopt** (All) [kit] |
| 23 | [Password field](https://uiarc.dev/components/password-field) `password-field` | Free, MIT | Capture sensitive text with a visible reveal control. | A slash draws across the eye and masks the outline beneath it instead of swapping icons. | - | **Skip**: Entra SSO; no passwords in the console or generated apps |
| 24 | [Search field](https://uiarc.dev/components/search-field) `search-field` | Free, MIT | A recognizable search entry point with clear affordances. | The clear button scales in from 0.8 with a slight blur on a snappy spring and presses to 0.96. | - | **Adopt** (Library, Inbox) [kit] |
| 25 | [Inline edit](https://uiarc.dev/components/inline-edit) `inline-edit` | Free, MIT | Rename in place: the text becomes a field without moving. | Text rolls between values, a check draws once a save lands, and multiline boxes follow their height; failed saves roll back with motion. | - | **Adopt** (Project, Confirm what we heard): Rename a project, correct a captured fact in place [kit] |
| 26 | [Expanding search](https://uiarc.dev/components/expanding-search) `expanding-search` | Free, MIT | An icon that morphs into a search field with results beneath it. | The button morphs into the field on a spring, results unfold beneath with a panel that tracks the field width, and a highlight travels between options. | - | **Inspiration** (Shell): Icon-to-field morph for the top bar |
| 27 | [Password strength](https://uiarc.dev/components/password-strength) `password-strength` | Free, MIT | Show how strong a new password is while it is typed. | Segments fill and change tone in a staggered wave, rules check off with drawn ticks, remaining counts roll, and the word morphs up or down with strength. | - | **Skip**: As above |

#### Special inputs (7)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 28 | [Number field](https://uiarc.dev/components/number-field) `number-field` | Free, MIT | Enter a bounded number with clear increment controls. | Digits roll on wheels in the direction of change (up rolls up, down rolls down) with tabular numerals, and affixes reword in place. | - | **Adopt** (Admin): Budgets, thresholds, loop limits [kit] |
| 29 | [Tag input](https://uiarc.dev/components/tag-input) `tag-input` | Free, MIT | Turn short text values into removable tags. | New tags blur and scale in where the text was typed; removed tags leave and the rest glide on the morph spring. The shell follows wrapped rows on a smooth spring. | - | **Adopt** (Start a project, Library): Resource tags, catalog owner tags [kit] |
| 30 | [Scrub input](https://uiarc.dev/components/scrub-input) `scrub-input` | Free, MIT | A Figma-style number field: drag the label to scrub, or type values, units, and arithmetic. | Past min or max the field strains with rubber-band resistance, up to 12px, and springs back on release; the number leans with it. | - | **Skip**: Designer tool affordance |
| 31 | [Phone input](https://uiarc.dev/components/phone-input) `phone-input` | Free, MIT | A phone field with a country picker, formatting as you type, and E.164 output. | One surface springs its width, height, and corner radius from the country button into the list, and back when closing. | - | **Skip** |
| 32 | [Money input](https://uiarc.dev/components/money-input) `money-input` | Free, MIT | A currency field with live grouping, stable width, rolling digits, and minor-unit output. | Chips and arrow keys roll each digit column in the direction of change while new columns open their width; typing cuts straight to the result so the caret never lags. | - | **Adopt** (Admin): Workspace and Snowflake budgets in USD [kit] |
| 33 | [Shortcut recorder](https://uiarc.dev/components/shortcut-recorder) `shortcut-recorder` | Free, MIT | Record key combinations into key caps, with conflict warnings, Kbd, and a searchable cheatsheet. | Caps pop in with a small scale and blur, staggered when a finished shortcut settles, and slide on a snappy layout spring as the chord changes. | - | **Skip** |
| 34 | [Mention input](https://uiarc.dev/components/mention-input) `mention-input` | Free, MIT | A textarea with @people and #channel mentions that act as single tokens, with suggestions at the caret. | The field height springs to its content between minRows and maxRows. | - | **Adopt** (Assistant rail, margin questions): @people and #resource tokens with caret suggestions [kit] |

#### Selects (5)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 35 | [Select](https://uiarc.dev/components/select) `select` | Free, MIT | A compact choice field with a keyboard friendly menu. | A later option rises in from below and an earlier one drops from above, with a soft blur. | radix/select | **Adopt** (All) [kit] |
| 36 | [Combobox](https://uiarc.dev/components/combobox) `combobox` | Free, MIT | Search and select from a list without leaving the field. | The popover springs in from slightly above and the listbox height follows filtering on a smooth spring. | - | **Adopt** (Start a project, admin): Pick a Confluence space, Jira project, Snowflake view [kit] |
| 37 | [Multi-select](https://uiarc.dev/components/multi-select) `multi-select` | Free, MIT | Select several values while keeping the field readable. | Chips open their slot width on a smooth spring and grow in from 0.9 with a blur; the +N count rolls up or down. | - | **Adopt** (Admin, filters) [kit] |
| 38 | [Chip group](https://uiarc.dev/components/chip-group) `chip-group` | Free, MIT | Filter by a few facets with chips that morph as you pick them. | Selecting grows a check in, slides the label over, and springs the chip edge while neighbors glide to new places, even across lines. Revealed chips stagger in and the group height morphs. | - | **Adopt** (Inbox, Library): Facet filters (type, role, age) [kit] |
| 39 | [Morph select](https://uiarc.dev/components/morph-select) `morph-select` | Free, MIT | A select whose trigger grows into the list, with a gliding highlight and type-ahead. | The trigger surface grows into the list on a physical spring with slight bounce and folds back without overshoot; the corner radius morphs with it. | - | **Inspiration**: Trigger-grows-into-list motion |

#### Toggles (7)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 40 | [Checkbox](https://uiarc.dev/components/checkbox) `checkbox` | Free, MIT | A binary choice with a precise, legible state. | The fill scales in on a snappy spring while the check path draws; switching to indeterminate morphs the same path into a dash. | radix/checkbox | **Adopt** (All) [kit] |
| 41 | [Switch](https://uiarc.dev/components/switch) `switch` | Free, MIT | A tactile toggle for settings that take effect immediately. | Pressing stretches the thumb toward the other side like a held finger; releasing sends it across on a snappy spring. | radix/switch | **Adopt** (Admin, settings) [kit] |
| 42 | [Radio group](https://uiarc.dev/components/radio-group) `radio-group` | Free, MIT | Choose one option from a visible set. | One highlight glides to the chosen row on the morph spring while the new dot springs in and the old one shrinks away. | - | **Adopt** (All) [kit] |
| 43 | [Segmented control](https://uiarc.dev/components/segmented-control) `segmented-control` | Free, MIT | Switch between a small set of related views. | A shared layoutId pill slides to the selected segment on the morph spring, scoped per instance by a LayoutGroup. | - | **Adopt** (Activity, project): Layer 1, 2, 3 switch; density setting [kit] |
| 44 | [Rating](https://uiarc.dev/components/rating) `rating` | Free, MIT | A simple, accessible way to capture a numeric opinion. | The fill sweeps star by star with a small stagger in the direction the value moved; a commit pops the stars in a wave. | - | **Inspiration** (Generated apps): Report a problem or rate a prototype [kit] |
| 45 | [Billing toggle](https://uiarc.dev/components/billing-toggle) `billing-toggle` | Free, MIT | A monthly and yearly switch with a savings badge and prices that roll to the new amount. | One thumb is measured from the selected option and glides to its x and width on a critically damped spring (0.34s, no bounce). | - | **Skip** |
| 46 | [Radio cards](https://uiarc.dev/components/radio-cards) `radio-cards` | Free, MIT | Selectable option cards with a sliding selection ring, price and description slots, and radio keyboard behavior. | One ring springs to the selected card's box and its size; resizes snap it without replaying the glide. | - | **Adopt** (Start a project, visual picker): Four starters, depth choice with time cost, layout and density choices [kit] |

#### Sliders (4)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 47 | [Slider](https://uiarc.dev/components/slider) `slider` | Free, MIT | Pick a value or a range on a track that follows your finger. | Released drags carry a little momentum before snapping; the bubble springs up over an active thumb and digits roll in the readout. At a limit the thumb strains toward the key press and... | - | **Adopt** (Admin) [kit] |
| 48 | [Elastic slider](https://uiarc.dev/components/elastic-slider) `elastic-slider` | Free, MIT | A slider that stretches like rubber past its ends, with a swaying value tag and detents the thumb clicks into. | The track rubber-bands past either end with iOS-style resistance and springs back with the release velocity. | - | **Skip** |
| 49 | [Range histogram slider](https://uiarc.dev/components/range-histogram-slider) `range-histogram-slider` | Free, MIT | A price range over a live histogram of the data, lighting the bars inside the range and settling on bar edges. | Lit bars and the track fill are clipped by one path, so both cut exactly at each thumb on the same frame. | - | **Inspiration** (Trace list, Portfolio): Filter runs by duration or cost over a live histogram |
| 50 | [Ruler slider](https://uiarc.dev/components/ruler-slider) `ruler-slider` | Free, MIT | A tape of ticks that slides under a fixed needle, with momentum, snapping, and a rolling readout. | Dragging moves the tape 1:1; a flick coasts with scroll-like deceleration and lands on a tick. | - | **Skip** |

#### Pickers (6)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 51 | [Calendar](https://uiarc.dev/components/calendar) `calendar` | Free, MIT | Browse dates in a clear, compact month view. | Months slide in the direction of travel while the title letters and year digits roll; the selection highlight glides between days on the morph spring. | - | **Adopt** (Admin, gate) [kit] |
| 52 | [Date picker](https://uiarc.dev/components/date-picker) `date-picker` | Free, MIT | Choose a date without losing context. | Changed date parts roll up for a later date and down for an earlier one; the popover springs in and closes about 240 ms after a pick so the highlight can land. | - | **Adopt** (Gate decision): Expiry dates in the consequence line [kit] |
| 53 | [Time picker](https://uiarc.dev/components/time-picker) `time-picker` | Free, MIT | Choose a time with sensible keyboard behavior. | A later time rises in from below and an earlier one drops from above with a soft blur; the menu springs in from slightly above. | - | **Adopt** (Working session) [kit] |
| 54 | [Date range picker](https://uiarc.dev/components/date-range-picker) `date-range-picker` | Free, MIT | A range picker that grows from its trigger into two months with presets and a stretching range highlight. | The trigger surface grows into the panel on a physical spring and shrinks back on Apply while the formatted label flies into the trigger with a shared layoutId. | - | **Adopt** (Portfolio, trace list) [kit] |
| 55 | [Color picker](https://uiarc.dev/components/color-picker) `color-picker` | Free, MIT | A swatch that grows into a picker with format morphing, eyedropper, saved swatches, and contrast readout. | The panel grows out of the swatch with an animated clip-path inset on a spring, and its drop shadow follows the clipped shape. | - | **Skip** |
| 56 | [Emoji picker](https://uiarc.dev/components/emoji-picker) `emoji-picker` | Pro, Arc Pro license | A full emoji picker with instant search, scroll-synced categories, skin tones, recently used emoji, and a virtualized, keyboard-navigable grid. | The category indicator slides to the category under the top edge on the morph spring as you scroll. When a tab is pressed it goes straight there and waits while the list scrolls smoothly to... | - | **Skip**: Pro; not needed |

#### Editors (4)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 57 | [File dropzone](https://uiarc.dev/components/file-dropzone) `file-dropzone` | Free, MIT | A generous target for dropping one or more files. | The icon lifts while files hover, the edge animates, rows enter and collapse on a smooth spring, and progress bars ease toward their target. | - | **Adopt** (Start a project, resources): One box for words, files and links [kit] |
| 58 | [Signature pad](https://uiarc.dev/components/signature-pad) `signature-pad` | Free, MIT | Smooth ink that thins with speed, with undo, replay, and PNG or SVG export. | Clear sweeps a squeegee edge across the pad while a clip-path wipe removes the ink over 0.56s. | - | **Skip**: Attestation, not ink |
| 59 | [Rich text editor](https://uiarc.dev/components/rich-text-editor) `rich-text-editor` | Free, MIT | A lightweight editor with markdown shortcuts, a floating toolbar, a slash menu, and HTML and markdown output. | The toolbar glides with the selection and its surface springs between the formatting face and the link face, which slide and blur across each other. | - | **Inspiration** (Living document): Slash menu and floating toolbar; the editor itself is the Tiptap or Lexical decision because attribution and revisions are required [kit] |
| 60 | [Avatar upload](https://uiarc.dev/components/avatar-upload) `avatar-upload` | Pro, Arc Pro license | Click or drop a photo onto the avatar to crop it in place with drag, pinch and zoom. It uploads through a progress ring and settles, with clear errors and retry. | Opening the cropper grows the avatar itself into the 184px crop circle with a layout animation on the smooth spring, while a tinted stage fades in behind it and the new photo fades in. The... | - | **Skip**: Pro; Entra supplies photos |

#### Navigation (4)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 61 | [Tabs](https://uiarc.dev/components/tabs) `tabs` | Free, MIT | Switch between related content in the same context. | The selection pill glides between triggers on a morph spring, scoped to one Tabs instance. | radix/tabs | **Adopt** (Project page): Stage objects one keystroke away [kit] |
| 62 | [Breadcrumb](https://uiarc.dev/components/breadcrumb) `breadcrumb` | Free, MIT | Show where a page sits in a hierarchy. | Crumbs present on first render stay still; new crumbs slide in 8px from the left out of a blur while siblings shift on a smooth spring. | - | **Adopt** (Library, canvas) [kit] |
| 63 | [Pagination](https://uiarc.dev/components/pagination) `pagination` | Free, MIT | Move through a long collection with clear bounds. | The current page mark springs to the selected button. | - | **Adopt** (Generated apps) [kit] |
| 64 | [Mega menu morph](https://uiarc.dev/components/mega-menu-morph) `mega-menu-morph` | Pro, Arc Pro license | A site header whose menus share one floating panel. Moving between sections morphs its size, slides the next menu in from that side and glides the caret under the new trigger, with hover intent, a safe triangle and an accordion... | One surface serves every menu. Its position, width and height are springs restated as stiffness and damping, so retargeting mid flight keeps the velocity it has: growing carries a trace of... | - | **Skip**: Marketing header; Pro |

#### Expand (5)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 65 | [Accordion](https://uiarc.dev/components/accordion) `accordion` | Free, MIT | Progressively reveal supporting information in place. | Panel height springs without overshoot while the answer slides down 6px out of a subtle blur; the chevron rotates on a snappy spring. | radix/accordion | **Adopt** (Gate decision, Library): What it skips, evidence per criterion [kit] |
| 66 | [Expandable card](https://uiarc.dev/components/expandable-card) `expandable-card` | Free, MIT | Give a dense card more room when requested. | Open and close are one morph: width and height move together on the smooth spring, which never overshoots, and the arrow turns on the same spring. | - | **Adapt** (Home): Project outcome card expands to show split times and next step [kit] |
| 67 | [Resizable panels](https://uiarc.dev/components/resizable-panels) `resizable-panels` | Free, MIT | Trade space between panes by dragging the divider between them. | Dividers follow the pointer 1:1, rubber-band past limits, and spring to rest; flicks toward an edge collapse a pane. Double-click resets the layout. | - | **Adopt** (Project page): Primary object plus assistant rail; side-by-side split at 1440px. Choose this or react-resizable-panels, not both [kit] |
| 68 | [Scroll area](https://uiarc.dev/components/scroll-area) `scroll-area` | Free, MIT | A native scroll container with thin overlay scrollbars and edge fades that appear only when content overflows. | Scrollbars fade in while scrolling or on hover and fade out after hideDelay; the thumb thickens under the pointer. | - | **Adopt** (All) [kit] |
| 69 | [Expandable text](https://uiarc.dev/components/expandable-text) `expandable-text` | Free, MIT | Long text clamped to a few lines with a soft fade that glides open with Read more and closes with Show less, shown only when the text overflows. | Height, the fade mask, and the chevron all follow one progress value, so they always move in step and a click mid-way reverses from the current height. | - | **Adopt** (Decision records): Long rationale clamped with Read more [kit] |

#### Overlays (7)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 70 | [Drawer](https://uiarc.dev/components/drawer) `drawer` | Free, MIT | A temporary side surface for focused work. | The panel springs in from its edge and leaves faster on a tween; a drag past a third of the panel or a quick flick closes it and keeps the release velocity. | radix/dialog | **Adopt** (Gate decision): Evidence drawer per acceptance criterion [kit] |
| 71 | [Dialog](https://uiarc.dev/components/dialog) `dialog` | Free, MIT | A focused surface for decisions that need attention. | The overlay fades while the panel rises 8px and scales from 0.96 on a smooth spring; closing is shorter and retargets from the current state. | radix/dialog | **Adopt** (All) [kit] |
| 72 | [Popover](https://uiarc.dev/components/popover) `popover` | Free, MIT | A small anchored surface for contextual information. | CSS transitions: the panel fades and settles from 5px toward its trigger at 0.97 scale on a spring; it leaves in 140ms. | radix/popover | **Adopt** (All) [kit] |
| 73 | [Tooltip](https://uiarc.dev/components/tooltip) `tooltip` | Free, MIT | Short supporting text for unfamiliar controls. | Opens after 250ms with a 3px rise from 0.97 scale; within 300ms of another tooltip it opens instantly with a fade only. | radix/tooltip | **Adopt** (All) [kit] |
| 74 | [Bottom sheet](https://uiarc.dev/components/bottom-sheet) `bottom-sheet` | Free, MIT | A sheet that rests at a peek or full height and follows your finger. | One motion value drives the sheet: drags follow the finger 1:1, rubber-band past the tallest detent, and releases project velocity to pick a detent or dismiss. | radix/dialog | **Adapt** (Phone approvals): Peek and full-height states for the evidence view [kit] |
| 75 | [Hover card](https://uiarc.dev/components/hover-card) `hover-card` | Free, MIT | Preview a person or link on hover or focus without leaving the page. | Grows from the trigger edge: scale from 0.96 and a 4px offset on a smooth spring, with a separate fade. Mid-exit returns retarget instead of jumping. | radix/popover | **Adopt** (Library, gate, canvas): Who confirmed a fact, who is being waited on, a node preview [kit] |
| 76 | [Share access](https://uiarc.dev/components/share-access) `share-access` | Pro, Arc Pro license | A share panel: invite people as validated email chips with suggestions, change roles from a compact menu, remove with undo, switch link access and copy the link, with every change landing in place. | Chips pop in from 80 percent scale on the snappy spring and the field reflows around them with layout transforms, so the caret slides to its new spot. | radix/dropdown-menu | **Inspiration** (Project sharing): Pro; email chips and roles map onto Entra groups |

#### Messages (5)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 77 | [Alert](https://uiarc.dev/components/alert) `alert` | Free, MIT | A persistent message that helps people recover or continue. | Presence collapses or expands the height on a smooth spring with a fade, so content below closes the gap. | - | **Adapt** (Failure states): Inline in the failed block with last good at; danger as outline icon plus words, never red fill [kit] |
| 78 | [Toast](https://uiarc.dev/components/toast) `toast` | Free, MIT | Brief confirmation for a completed background action. | Enters rising 16px from 0.96 scale on a morph spring while the check draws in; a swipe past 80px or 480px/s throws it off with its release velocity. | - | **Adopt** (All): Pick this or sonner, not both [kit] |
| 79 | [Toast stack](https://uiarc.dev/components/toast-stack) `toast-stack` | Free, MIT | Stack short results at the edge until you reach for them. | New toasts rise from their own height below the edge; older ones tuck behind at 14px peeks and 0.05 scale steps, and fan out on a morph spring. | - | **Adopt** (All) [kit] |
| 80 | [Cookie consent](https://uiarc.dev/components/cookie-consent) `cookie-consent` | Free, MIT | A consent bar that morphs into preferences and folds into a reopen button. | One surface springs its position, width, height, and radius between the bar, the panel, and the 44px reopen button; faces rise from a short blur. | - | **Skip** |
| 81 | [Announcement bar](https://uiarc.dev/components/announcement-bar) `announcement-bar` | Free, MIT | A top banner that rotates messages, counts down, and collapses smoothly when dismissed. | Next messages rise from below and leave upward (previous runs the other way) while the viewport springs to the new height. | - | **Adapt** (Generated apps): Basis for the persistent provenance banner, with dismiss removed [kit] |

#### Progress (6)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 82 | [Progress](https://uiarc.dev/components/progress) `progress` | Free, MIT | Show how much of a known task is complete. | One smooth spring drives both the fill and the counted number, so they always agree. The fill slides in from the left to keep its rounded end. | - | **Adapt** (Uploads only): UA rule: build progress is stage and count, never a percentage [kit] |
| 83 | [Skeleton](https://uiarc.dev/components/skeleton) `skeleton` | Free, MIT | Reserve space while content is still loading. | Blocks pulse in a staggered wave, each a beat after the one above. | - | **Adopt** (All) [kit] |
| 84 | [Usage meter](https://uiarc.dev/components/usage-meter) `usage-meter` | Free, MIT | Show what fills an allowance and how close it is to the limit. | Segments grow in left to right once scrolled into view, then re-flow on one spring each when values change; crossing the limit fades in a hatched overage and limit marker. | - | **Adopt** (Admin): Workspace, Bedrock and Snowflake budgets against limits [kit] |
| 85 | [Onboarding checklist](https://uiarc.dev/components/onboarding-checklist) `onboarding-checklist` | Free, MIT | Guide a new workspace through setup, one step at a time. | Checks fill from the center and draw their tick; after 720ms the finished step folds into the completed group while the ring and count roll forward. | - | **Adapt** (First run): Three example projects, sample walkthrough, guided start [kit] |
| 86 | [Stepper](https://uiarc.dev/components/stepper) `stepper` | Free, MIT | Show where a person is in a multi-step flow and what is done. | Connectors fill one after another when progress jumps several steps; the ring then grows around the new current marker. | - | **Adapt** (Start a project, first run): Guided prompts; not a substitute for the line, which stays custom [kit] |
| 87 | [Countdown](https://uiarc.dev/components/countdown) `countdown` | Free, MIT | A launch countdown with rolling digits that morphs into a live state at zero. | Each digit is a clipped wheel that turns the short way, so 00 to 59 is one step down and the window feathers the edges. | - | **Skip**: Launch-style; the 10-day graduation window is better as plain text with a date |

#### Avatars (4)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 88 | [Avatar](https://uiarc.dev/components/avatar) `avatar` | Free, MIT | A compact identity marker for people and accounts. | A photo still loading fades in from a soft blur; a cached one shows at once. | - | **Adopt** (All) [kit] |
| 89 | [Avatar group](https://uiarc.dev/components/avatar-group) `avatar-group` | Free, MIT | Show a team or set of contributors in a small space. | Joining or leaving members open and close their slot on a spring, so the stack slides instead of jumping. | - | **Adopt** (Home, project header): Co-signers, contributors [kit] |
| 90 | [Badge](https://uiarc.dev/components/badge) `badge` | Free, MIT | A small label for status, category, or metadata. | A new label rises in with a short blur while the old one lifts away, and the pill width springs to fit. | - | **Adapt** (All): Quiet variant only; UA status is text with a glyph, never a filled colored chip [kit] |
| 91 | [Presence stack](https://uiarc.dev/components/presence-stack) `presence-stack` | Pro, Arc Pro license | Avatars of the people here now: joins pop in as the stack reflows, a counter rolls past the limit, dots show typing and idle, and hover fans it out with a gliding name label. | Faces are positioned with transforms only. Reflow after a join or leave rides the smooth spring, so a burst of changes blends into one movement instead of queueing. | radix/popover | **Inspiration** (Working session): Pro; who is here now, typing and idle dots |

#### Cards (3)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 92 | [Card](https://uiarc.dev/components/card) `card` | Free, MIT | A contained group of related content and actions. | Hover lifts the card 2px and slowly zooms the media. | radix/dialog | **Adopt** (All) [kit] |
| 93 | [Metric card](https://uiarc.dev/components/metric-card) `metric-card` | Free, MIT | A compact summary for a number that needs context. | The value uses animated-counter: digits roll on view and turn the way the number moved. | - | **Inspiration** (Generated apps, admin): UA Home has no KPI tiles; fine inside generated dashboards [kit] |
| 94 | [Empty state](https://uiarc.dev/components/empty-state) `empty-state` | Free, MIT | A useful next step when there is nothing to show yet. | Changing title or description rolls the copy in place while the block height springs to fit. | - | **Adopt** (Home, Inbox, Library): Nothing needs you. 3 projects moving. [kit] |

#### Charts (14)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 95 | [Sparkline](https://uiarc.dev/components/sparkline) `sparkline` | Free, MIT | Show a compact trend beside a value. | The line draws in on first view and the end dot appears as it lands. | - | **Adopt** (Admin, cards): Cost and wait trends beside a value [kit] |
| 96 | [Gauge](https://uiarc.dev/components/gauge) `gauge` | Free, MIT | Show a value against a known range. | The ring fills once when half in view without overshoot, then springs to new values while the percent counts. | - | **Skip** |
| 97 | [Animated counter](https://uiarc.dev/components/animated-counter) `animated-counter` | Free, MIT | Give changing totals a clear sense of movement. | Each digit column turns in the direction the whole number moved, wrapping 9 to 0, with a slight stagger on first reveal. | - | **Adopt** (All): Counts that roll; overlaps @number-flow/react, choose one [kit] |
| 98 | [Bar chart](https://uiarc.dev/components/bar-chart) `bar-chart` | Free, MIT | Compare one measure across days and scrub any bar for its value. | Bars grow in with a stagger on first view; new ranges morph bars, ticks, and the average line. | - | **Adopt** (Generated apps, admin) [kit] |
| 99 | [Activity heatmap](https://uiarc.dev/components/activity-heatmap) `activity-heatmap` | Free, MIT | See a year of activity at a glance, one square per day. | Cells wave in once on view and a new range recolors the grid in a sweep. | - | **Skip** [kit] |
| 100 | [Line chart](https://uiarc.dev/components/line-chart) `line-chart` | Free, MIT | A multi-series line chart with a gliding crosshair, legend toggles, and paths that morph between ranges. | Lines draw left to right the first time the chart scrolls into view. | - | **Adopt** (Generated apps, Portfolio) [kit] |
| 101 | [Donut chart](https://uiarc.dev/components/donut-chart) `donut-chart` | Free, MIT | A donut whose arcs morph between datasets, with the active value rolling into the center. | One sweep the first time the chart scrolls into view: every segment leaves the top together and each trailing edge follows a beat behind the one before. | - | **Adopt** (Generated apps) [kit] |
| 102 | [Streamgraph](https://uiarc.dev/components/streamgraph) `streamgraph` | Free, MIT | Layered streams on a wiggle baseline that morph between ranges, with a layer you can isolate and read week by week. | The stream swells out of a hairline along its centre the first time it is seen. | - | **Skip** |
| 103 | [Brush chart](https://uiarc.dev/components/brush-chart) `brush-chart` | Free, MIT | A dense time series with an overview strip: drag a window to zoom, resize it by its handles, and read events in place. | The line draws in from the left once, the first time it is seen. | - | **Adapt** (Trace Layer 3, Portfolio): Overview strip to zoom long traces or long time ranges [kit] |
| 104 | [Ridgeline](https://uiarc.dev/components/ridgeline) `ridgeline` | Free, MIT | Overlapping distributions, one ridge per group: hover to lift a ridge and read its quartiles, switch datasets and every curve morphs. | Curves are sampled on a shared grid, so a new dataset or domain interpolates every point: ridges swell, slide, and split in one spring. | - | **Skip** |
| 105 | [Treemap](https://uiarc.dev/components/treemap) `treemap` | Free, MIT | A squarified treemap: click to drill and the tiles grow to fill the view, with a breadcrumb back and metrics that morph every tile. | Drilling in carries every tile through one affine zoom: the chosen tile grows to fill the view, its siblings fly outward, and its children open inside it. | - | **Adapt** (Trace Layer 3, admin): Cost by agent, tool and model with drill-down [kit] |
| 106 | [Waffle chart](https://uiarc.dev/components/waffle-chart) `waffle-chart` | Free, MIT | A ten by ten unit chart where every cell is one percent, and cells fly to their new group when the data changes. | Cells are persistent: a data change keeps as many cells in place as possible and flies the rest to their new block, staggered by position so the grid refills like a wave. | - | **Skip** |
| 107 | [Slope chart](https://uiarc.dev/components/slope-chart) `slope-chart` | Free, MIT | Before and after on two axes: lines draw in, rank moves sit beside each value, and switching datasets slides every line to its new slope. | On first view each line draws from start to end with a small stagger, and the end dots and labels arrive as it lands. | - | **Inspiration** (Portfolio): Baseline versus now comparison [kit] |
| 108 | [Split bar](https://uiarc.dev/components/split-bar) `split-bar` | Pro, Arc Pro license | A single 100% bar split into shares: rest on a segment to widen it and read its exact figures, toggle segments from the legend and the rest reflow, with labels inside when they fit and on leader lines when they don't. | Each segment is a full width layer cut to its share with an animated clip-path, and its edges ride the smooth spring. Reflow never touches layout, and a new target mid flight retargets from... | - | **Inspiration** (Trace, admin): Pro; cost share bar |

#### Advanced charts (7)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 109 | [Data grid](https://uiarc.dev/components/data-grid) `data-grid` | Pro, Arc Pro license | A spreadsheet grid with range selection, inline editing, a fill handle, and animated sorting. | The selection rectangle and active cell spring between ranges on motionTokens.spring.snappy. Scrolling moves them at once, and resizing a column snaps them. | radix/dropdown-menu, radix/popover | **Inspiration** (Numbers check): Pro; spreadsheet range selection. Use TanStack for the console and never in generated apps |
| 110 | [Race bar chart](https://uiarc.dev/components/race-bar-chart) `race-bar-chart` | Pro, Arc Pro license | A ranking over time: bars overtake each other on springs, values count up, and a timeline you can play or scrub. | Time is continuous: values interpolate between periods, so bars grow smoothly and numbers count rather than jump. | - | **Skip** |
| 111 | [Sunburst](https://uiarc.dev/components/sunburst) `sunburst` | Pro, Arc Pro license | A hierarchy in rings: click a segment and every arc swings around it as the new centre, with a breadcrumb back and a rolling total. | Zooming interpolates every arc's angles and ring from where it is on screen to its place around the new centre, on one spring. | - | **Skip** |
| 112 | [Sankey flow](https://uiarc.dev/components/sankey-flow) `sankey-flow` | Pro, Arc Pro license | Flows between stages as ribbons with drifting particles; hover any node or ribbon to pour its share through the whole journey. | Nodes and ribbons grow in from their centres on first view, and morph from the layout on screen to the new one when data changes. | - | **Inspiration** (Portfolio): Pro; triage routing (built here, CoWork, EDMA BI) |
| 113 | [Funnel chart](https://uiarc.dev/components/funnel-chart) `funnel-chart` | Pro, Arc Pro license | A tapered conversion funnel with drop-off at every step, a device split that morphs the band, and dots that stream through it. | Switching views morphs the band from the shape on screen with a spring; the split gap opens and closes with the same spring. | - | **Skip** |
| 114 | [Radar chart](https://uiarc.dev/components/radar-chart) `radar-chart` | Pro, Arc Pro license | Two or three profiles on one web: shapes morph when you swap a profile, and a sweep across the axes compares values in place. | Swapping a profile morphs its shape from the one on screen with a gently bouncing spring. | - | **Skip** |
| 115 | [Realtime stream](https://uiarc.dev/components/realtime-stream) `realtime-stream` | Pro, Arc Pro license | A live line that scrolls at 60fps as readings arrive, holds still on hover to read, and pops a marker on every anomaly. | The line scrolls continuously at the display rate; the head interpolates between readings, so new points slide in rather than pop. | - | **Skip** |

#### Tables (7)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 116 | [Tree view](https://uiarc.dev/components/tree-view) `tree-view` | Free, MIT | Navigate nested folders and structured content. | Opening a folder grows the space and staggers its children in; closing collapses rows smoothly. | - | **Adopt** (Resources, Library): Indexed Confluence page tree, OneDrive folder [kit] |
| 117 | [Filter toolbar](https://uiarc.dev/components/filter-toolbar) `filter-toolbar` | Free, MIT | Keep collection filters close and easy to reset. | Chips open and close their slot on a spring so neighbors glide; values morph in place. | - | **Adopt** (Data tables, Inbox, trace): Filters as chips; put filter state in the URL with nuqs [kit] |
| 118 | [Sortable data table](https://uiarc.dev/components/sortable-data-table) `sortable-data-table` | Free, MIT | Compare structured records with sortable columns. | Rows glide to their new positions on a spring when the sort changes; the sort arrow flips. | - | **Adopt** (Data tables): Visual layer over TanStack Table and Virtual for large lists [kit] |
| 119 | [Code block](https://uiarc.dev/components/code-block) `code-block` | Free, MIT | Present code with legible hierarchy and copy access. | Expanding or collapsing springs the source height; new code fades up in place. | - | **Adopt** (Trace Layer 3): Tool input and output [kit] |
| 120 | [Reorderable list](https://uiarc.dev/components/reorderable-list) `reorderable-list` | Free, MIT | Organize items with direct drag and drop. | Rows lift slightly on press and neighbors slide on a spring while dragging. | - | **Adapt** (Gate co-sign order, plan) [kit] |
| 121 | [JSON viewer](https://uiarc.dev/components/json-viewer) `json-viewer` | Free, MIT | A collapsible JSON tree with search, paging for long arrays, and copy value or path. | Each row unfolds its own height, so opening a branch, loading a page, or expanding all share one motion. | - | **Adopt** (Trace Layer 3): Raw span, payload, copy path [kit] |
| 122 | [Tree table](https://uiarc.dev/components/tree-table) `tree-table` | Free, MIT | A table with nested rows, tri-state selection, hierarchy-preserving sort, and lazy-loaded children. | Rows open and close on a height spring with a short stagger per sibling; sorting moves rows with a position layout animation. | radix/checkbox | **Adopt** (Data tables, Library): Criteria to evidence, work breakdown, facts by domain; lazy children [kit] |

#### Activity (3)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 123 | [Timeline](https://uiarc.dev/components/timeline) `timeline` | Free, MIT | Follow what happened, newest first, grouped by day. | The connecting line draws as rows come into view and markers pop in. | - | **Adopt** (Activity Layer 1, decision records): Since you left digest, grouped by day [kit] |
| 124 | [Chat thread](https://uiarc.dev/components/chat-thread) `chat-thread` | Free, MIT | A chat thread with grouped messages, reactions, read receipts, typing, and a composer with attachments. | New messages rise in from their own side with a small scale on a smooth spring, and the list glides up by the added height instead of jumping. | - | **Adapt** (Assistant rail): Grouped messages and composer with attachments; restyle to one voice [kit] |
| 125 | [Comment thread](https://uiarc.dev/components/comment-thread) `comment-thread` | Free, MIT | Threaded comments with replies, reactions, mentions, inline edit, and resolve. | The thread height springs when replies expand, comments arrive, or the thread folds into the resolved chip. | - | **Adapt** (Living document, Confluence): Margin questions anchored to a section; display ingested Confluence comments with resolve [kit] |

#### Media (3)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 126 | [Image compare](https://uiarc.dev/components/image-compare) `image-compare` | Free, MIT | Drag a divider across two images to see what changed. | The divider follows the pointer and settles with release velocity; the handle stretches into a capsule while dragging. | - | **Adapt** (Gate decision): Changes since approval as a before and after screenshot [kit] |
| 127 | [Carousel](https://uiarc.dev/components/carousel) `carousel` | Free, MIT | Browse a row of slides by dragging, flicking, or arrowing through them. | Slides follow the finger and settle with momentum; neighbors shrink and dim with distance. | - | **Inspiration** (Teams approval card, gate): Evidence thumbnails [kit] |
| 128 | [Card stack](https://uiarc.dev/components/card-stack) `card-stack` | Free, MIT | Review a deck one card at a time, with a throw and an undo. | The top card follows the drag with tilt and stamps; a flick or far drag throws it off with its velocity. | - | **Inspiration** (Confirm what we heard): One fact at a time with undo; must not feel like bulk approval |

#### Text effects (4)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 129 | [Text reveal](https://uiarc.dev/components/text-reveal) `text-reveal` | Free, MIT | Reveal a short piece of content with restrained motion. | Words rise out of a clip and sharpen from blur on a per-word stagger; total stagger is capped so long text never drags. | - | **Skip** |
| 130 | [In-view title](https://uiarc.dev/components/in-view-title) `in-view-title` | Free, MIT | Bring a section title in as it scrolls into view. | Triggers when 45% of the title is visible. Opacity leads, blur clears next, and the transform settles last, so text is readable before it fully arrives. | - | **Skip** |
| 131 | [Text morph](https://uiarc.dev/components/text-morph) `text-morph` | Free, MIT | Morph a label into its next state, letter by letter. | Letters are matched by character and occurrence, so shared letters glide to their new positions on a spring while new letters stagger in with a blur. | - | **Adopt** (Status line): Status changes letter by letter; UA prefers opacity-only crossfade for frequent changes [kit] |
| 132 | [Text shimmer](https://uiarc.dev/components/text-shimmer) `text-shimmer` | Free, MIT | Show ongoing work with a calm light across the words. | A bell-shaped highlight band in the current text color sweeps linearly over a muted base, pausing briefly between passes. | - | **Adopt** (The line, status): The current segment's shimmer; stop it when work is stale [kit] |

### Special components (55 items: 1 free, 54 Pro)


#### Docks and tabs (6)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 133 | [Morph nav](https://uiarc.dev/components/morph-nav) `morph-nav` | Pro, Arc Pro license | A navigation bar that morphs into rich menus, search, and a compact state as one surface. | The surface springs to each panel's size, with a little bounce when it grows and none when it shrinks. Moving to a neighbor slides the new panel in from that side while a highlight glides... | - | **Skip** |
| 134 | [Dock](https://uiarc.dev/components/dock) `dock` | Pro, Arc Pro license | A floating tool dock with a gliding label, a springy selection, and trays that grow out of it. | The label glides between items after a short first hover delay and stays warm so the next one follows at once; the accent tint springs between items with a shared layoutId whose corner... | - | **Inspiration** (Architecture canvas): Pro; floating tool dock with trays |
| 135 | [Liquid tab bar](https://uiarc.dev/components/liquid-tab-bar) `liquid-tab-bar` | Pro, Arc Pro license | Tabs with a lens selection that slides between them, swaps labels cleanly, and fills in icons as it passes. | The lens slides and resizes to the new tab on the morph spring as one shape, with no stretch or squash; it leans slightly toward a hovered tab. | - | **Skip** |
| 136 | [Orbit menu](https://uiarc.dev/components/orbit-menu) `orbit-menu` | Pro, Arc Pro license | Hold a button and its actions orbit out, ready to pick with a drag. | Actions swirl out along the arc in reading order and fold back in reverse; a lens glides between targeted actions and nearby actions lean toward the pointer. | - | **Skip** |
| 137 | [Action morph](https://uiarc.dev/components/action-morph) `action-morph` | Pro, Arc Pro license | A floating button that morphs into a quick-action menu, then an inline form, then back with a check. | One surface animates width, height, and corner radius on physical springs: growing carries a little bounce, folding settles without overshoot. | - | **Skip** |
| 138 | [Share sheet](https://uiarc.dev/components/share-sheet) `share-sheet` | Pro, Arc Pro license | A Share button that opens into a panel with copy link, access level, channels, and people to send to. | One shape springs its width, height, and corner radius between the button, the panel, and the confirmation; faces cross with a short blur and scale. | - | **Skip** |

#### Glass (4)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 139 | [Glass menu](https://uiarc.dev/components/glass-menu) `glass-menu` | Pro, Arc Pro license | A glass action menu whose trigger morphs into the panel, with a highlight pill that glides between rows, one in-place submenu, and full keyboard support. | The trigger's glass and the panel's glass share a layout id, so opening is one spring morph from the trigger's box to the panel's, and closing morphs back. | - | **Skip**: Glass and glow conflict with UA precision |
| 140 | [Glass segmented](https://uiarc.dev/components/glass-segmented) `glass-segmented` | Pro, Arc Pro license | A glass segmented control whose liquid indicator stretches between segments and can be dragged and flung. | Each edge of the indicator has its own spring: the edge facing the travel is quick, the other lags, so the drop stretches and then settles. | - | **Skip** |
| 141 | [Glass card](https://uiarc.dev/components/glass-card) `glass-card` | Pro, Arc Pro license | A glass info panel over a photo whose rim catches a pointer-following highlight while the card tilts; tap to morph it into a detail sheet. | Tilt and highlight follow the pointer through springs, so the card eases into position and settles back when the pointer leaves. Touch input skips the tilt. | - | **Skip** |
| 142 | [Glass tab bar](https://uiarc.dev/components/glass-tabbar) `glass-tabbar` | Pro, Arc Pro license | A floating Liquid Glass tab bar that refracts what scrolls beneath it, with a glass lens that glides, magnifies and can be dragged between tabs, and an optional search bubble; it compacts on scroll down. | The lens glides on the smooth spring, which never overshoots. Its speed lifts it off the bar: it grows, stretches along the direction of travel, and turns into a clear lens that magnifies... | - | **Skip** |

#### Surfaces (6)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 143 | [Wallet stack](https://uiarc.dev/components/wallet-stack) `wallet-stack` | Pro, Arc Pro license | Fan a stack of cards and lift one out to see its activity. | Every card's transform is one pure function of a continuous stack position, the open amount, and the fan amount, so springs, drags, and interruptions all move the same shape. Z order never... | - | **Skip** |
| 144 | [Control center](https://uiarc.dev/components/control-center) `control-center` | Pro, Arc Pro license | Workspace quick settings: tiles that morph into detail, a duration dial, and rubber-banded meters. | A tile grows into its detail with a shared element morph, and meters follow the pointer 1:1 from where they were grabbed, with rubber-banded edges. A tap without a drag jumps the meter to... | - | **Skip** |
| 145 | [Sheet stack](https://uiarc.dev/components/sheet-stack) `sheet-stack` | Pro, Arc Pro license | Nested sheets that stack with depth, drag to dismiss, and become stacked dialogs on wide screens. | A new sheet rises from the bottom edge (or eases in as a dialog) while the one below scales back 5%, dims, and peeks above it. | - | **Inspiration** (Phone): Pro; nested sheets for evidence on phones |
| 146 | [Holo card](https://uiarc.dev/components/holo-card) `holo-card` | Pro, Arc Pro license | A member card that tilts toward you with a holographic foil and flips to its back. | Tilt follows the pointer on a lightly underdamped spring, and the light position trails on a softer one, so the sheen lags the lean just enough to feel physical. | - | **Skip** |
| 147 | [Card to article](https://uiarc.dev/components/card-to-article) `card-to-article` | Pro, Arc Pro license | Story cards that open into full articles with one seamless morph and shrink back into their exact slot when dragged down. | The card itself becomes the article: its box and corners spring to the sheet while the hero scales as one piece, so image and title never distort. | - | **Skip** |
| 148 | [Link unfurl](https://uiarc.dev/components/link-unfurl) `link-unfurl` | Pro, Arc Pro license | A composer where pasting a URL shows a loading shimmer on the link, then unfurls it into a rich preview card with title, image and favicon in one morph, which can be collapsed back to the inline link or removed. | One rAF loop drives every card from a critically damped spring, writing only transforms, clip paths, opacity, and the plate size; React renders once per state change, never per frame. | - | **Inspiration** (Start a project, resources): Pro; paste a Teams, OneDrive, Jira or Confluence link and it unfurls into a resource card |

#### Galleries (4)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 149 | [Photo grid](https://uiarc.dev/components/photo-grid) `photo-grid` | Pro, Arc Pro license | Pinch through zoom levels and open any photo straight from its cell. | Pinch zoom scales live and reflows around the photo under the fingers; the viewer grows from the tapped cell and can be dragged down to dismiss. | - | **Skip** |
| 150 | [Cover flow](https://uiarc.dev/components/cover-flow) `cover-flow` | Pro, Arc Pro license | A depth rail of images you can throw, with soft grounded shadows and a quiet reflection. | Drag or throw the rail and it lands on the card its momentum reaches, on a spring tuned to the release speed; a quick flick always moves at least one card. The ends rubber-band. | - | **Skip** |
| 151 | [Lightbox gallery](https://uiarc.dev/components/lightbox-gallery) `lightbox-gallery` | Pro, Arc Pro license | A masonry grid where photos zoom from their slot into a viewer you can swipe, pinch, and drag away. | Opening flies the photo from its grid slot to fit the stage on a spring with a constant corner radius; closing flies it back to the current photo's slot while the backdrop fades. | - | **Inspiration** (Gate evidence): Pro; screenshots zoom from their slot |
| 152 | [Product gallery](https://uiarc.dev/components/product-gallery) `product-gallery` | Pro, Arc Pro license | A product gallery with a hover magnifier, gliding thumbnails, and color and size variants that crossfade photos. | The photo track springs to the photo on show and follows a finger one to one, with rubber-band edges; one flick moves one photo. | - | **Skip** |

#### Audio and video (3)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 153 | [Now playing](https://uiarc.dev/components/now-playing) `now-playing` | Pro, Arc Pro license | Grow a mini player into the full player in one continuous morph. | The mini bar morphs into the full player with shared layout while the shell height springs to fit. In the full player, pulling the artwork down more than 70px or flicking it closes the... | - | **Skip** |
| 154 | [Voice recorder](https://uiarc.dev/components/voice-recorder) `voice-recorder` | Pro, Arc Pro license | Record with a live waveform, review and scrub, then send the take into the thread. | Mic, recording bar, review, and sent bubble share one layout id, so a take morphs from the mic into the thread on a spring. | - | **Inspiration** (Start a project): Pro; a voice note as an idea, transcribed |
| 155 | [Voice orb](https://uiarc.dev/components/voice-orb) `voice-orb` | Pro, Arc Pro license | A voice mode orb that listens, thinks, and speaks, with a live transcript and call controls. | Nine shape parameters (breath, wobble, swirl, tint, ring, and more) follow the state on a hand-rolled spring each frame, so state changes interrupt cleanly. | - | **Skip** |

#### Data (4)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 156 | [Activity rings](https://uiarc.dev/components/activity-rings) `activity-rings` | Pro, Arc Pro license | Daily goals as tick rings that sweep, count up, and trace a second lap past 100%. | Every change sweeps from what is on screen to the new values, so a quick second change redirects mid flight; past 100% a second lap traces the inside edge. | - | **Skip** |
| 157 | [Time dial](https://uiarc.dev/components/time-dial) `time-dial` | Pro, Arc Pro license | Spin a dial to pick an hour and see which team cities are at work. | Drags have soft quarter-hour detents, flicks coast on a spring into the nearest quarter hour, and bounds rubber-band. | - | **Inspiration** (Inbox waits): Pro; shows whether the person waited on is in working hours |
| 158 | [Booking pill](https://uiarc.dev/components/booking-pill) `booking-pill` | Pro, Arc Pro license | One pill that reshapes through party size, date, time, and a ticket. | The pill's shape springs to fit each step while content slides in a beat later in the direction of travel. | - | **Skip** |
| 159 | [Date reel](https://uiarc.dev/components/date-reel) `date-reel` | Pro, Arc Pro license | A 3D wheel date and time picker (like iOS reels) with momentum scrolling, snapping, curved perspective, and full keyboard support. | One requestAnimationFrame loop runs only while a reel moves and writes transforms, opacity and text straight to recycled DOM nodes; React re-renders only when a value is committed. | - | **Skip** |

#### Type (4)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 160 | [Keycap keyboard](https://uiarc.dev/components/keycap-keyboard) `keycap-keyboard` | Pro, Arc Pro license | Mechanical keycaps that sink and light up as you type, with the text above the board. | A cap drops 92% of its travel in 35ms on key down and returns in 200ms with a small lift past rest, so each press feels crisp. | - | **Skip** |
| 161 | [Slot text](https://uiarc.dev/components/slot-text) `slot-text` | Free, MIT | Text and numbers that spin into their new value on staggered slot machine reels. | Each reel spins with a fast start and a long, soft landing that never passes the target. | - | **Inspiration** (The line): Free; split time settling when a gate is signed. UA keeps it subtle [kit] |
| 162 | [Sand text](https://uiarc.dev/components/sand-text) `sand-text` | Pro, Arc Pro license | A headline made of sand that pours into the letters, crumbles where the cursor digs, and heals itself. | Letters fill bottom first like jars. Dug grains fly with the pointer's velocity and settle with a falling sand automaton. | - | **Skip** |
| 163 | [Typewriter terminal](https://uiarc.dev/components/typewriter-terminal) `typewriter-terminal` | Pro, Arc Pro license | A terminal that types a scripted CLI session with a seeded human cadence, colors the shell syntax, and streams output lines, progress bars and spinners, with a scrubber, play/pause and replay controls. | One rAF loop derives the whole screen from a single session time and writes attributes, text, transforms, and opacity straight to the DOM, only when a value changed. React does not render... | - | **Inspiration** (Trace Layer 3): Pro; replay of the coding sandbox log with a scrubber |

#### Loaders (4)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 164 | [Stretch refresh](https://uiarc.dev/components/stretch-refresh) `stretch-refresh` | Pro, Arc Pro license | Pull a feed down and a line stretches to tell you when to let go. | The sheet rubber-bands with growing resistance while rows spread apart; scrolling up again at the top also pulls. | - | **Skip** |
| 165 | [Morph loader](https://uiarc.dev/components/morph-loader) `morph-loader` | Pro, Arc Pro license | Tiny loaders that morph between shapes and fold into a check or a cross when done. | Each stroke is a center, length, direction, bend, and width, each on its own spring, so any shape can morph into any other and interruptions keep velocity. | - | **Inspiration** (Failure states): Pro; loader folds into a check or cross |
| 166 | [Black hole](https://uiarc.dev/components/black-hole) `black-hole` | Pro, Arc Pro license | A delete transition that pulls the chosen items into a tiny singularity while the rest of the list bends around it; undo spins them back out. | Items fall along a logarithmic spiral. Points nearer the hole start earlier, so the inner edge falls faster than the outer one and rows stretch into arms. | - | **Skip** |
| 167 | [Skeleton morph](https://uiarc.dev/components/skeleton-morph) `skeleton-morph` | Pro, Arc Pro license | Loading skeletons that grow into the real content, block by block, instead of swapping. | Blocks resolve one after another in DOM order, 40ms apart by default. | - | **Inspiration** (Preview waking): Pro; skeleton grows into content |

#### Playful (3)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 168 | [Sticker peel](https://uiarc.dev/components/sticker-peel) `sticker-peel` | Pro, Arc Pro license | Peel stickers off a surface with a real curl, move them around, and stick them back down. | The peel is a real fold: the pulled part is mirrored across the fold line with clip-path and foreshortened a touch, showing a plain paper backing with one soft shade at the bend and a light... | - | **Skip** |
| 169 | [Page curl](https://uiarc.dev/components/page-curl) `page-curl` | Pro, Arc Pro license | A small magazine you read by dragging page corners, with a real fold, lit curl, and flick to turn. | The fold line is the perpendicular bisector between the corner and the pointer, so the page follows the finger from where it was grabbed. | - | **Skip** |
| 170 | [Orbit logos](https://uiarc.dev/components/orbit-logos) `orbit-logos` | Pro, Arc Pro license | An integrations showcase with brand logos orbiting your product mark on tilted rings. Hover or focus one to rest the orbit, draw a connection, and see what it does. | One rAF loop writes chip translations and the connector; React does not render per frame, and the loop stops when everything is at rest, off screen, or the tab is hidden. | - | **Inspiration** (First run, admin): Pro; connected sources around the HyperDelivery mark; marketing-leaning |

#### Cursor (3)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 171 | [Dot grid](https://uiarc.dev/components/dot-grid) `dot-grid` | Pro, Arc Pro license | A dot field that bulges around the cursor like a lens and ripples from every click. | Each dot rides its own damped spring toward the lens and ripple offsets, so the field wobbles and settles instead of snapping. | - | **Skip** |
| 172 | [Ink fluid](https://uiarc.dev/components/ink-fluid) `ink-fluid` | Pro, Arc Pro license | A real time fluid simulation behind your hero: the cursor stirs soft ink that swirls, settles and fades; calm when left alone. | Semi Lagrangian advection, vorticity confinement and a 20 step pressure solve on a small grid, drawn with linear upscaling and a soft light term from the ink gradient so wisps read silky. | - | **Skip** |
| 173 | [Gravity well](https://uiarc.dev/components/gravity-well) `gravity-well` | Pro, Arc Pro license | A grid of tiles that bends toward the cursor like spacetime, with a click that sends a shockwave through it. | The well follows the pointer on a critically damped spring, and each tile follows the field on an underdamped spring, so fast moves leave a jelly wake. | - | **Skip** |

#### AI (5)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 174 | [Agent timeline](https://uiarc.dev/components/agent-timeline) `agent-timeline` | Pro, Arc Pro license | A compact timeline of one orchestrated agent run: the orchestrator and its subagents share a time axis, handoffs draw in between rows, and a playhead replays thinking, tool calls and waiting while the header counts time, tokens... | Bars and the playhead read one CSS variable for the current time, updated every animation frame, so spans grow smoothly without React rendering per frame; React updates counters and states... | - | **Adapt-Pro** (Trace Layer 2 and 3, decision timeline): Per-agent rows with model marks, handoff connectors, failed and retry, playhead; add a slowest badge |
| 175 | [Context window](https://uiarc.dev/components/context-window) `context-window` | Pro, Arc Pro license | An AI context window as a grid of 200 cells: the system prompt, tools, files, summary and messages fill it in order, a threshold row marks where compaction starts, and sending a message, attaching a file or compacting shows... | New tokens fill cells in a short wave from where the change happened, about 4 to 9ms per cell and never more than 360ms in total. | radix/dropdown-menu | **Adapt-Pro** (Trace Layer 3, admin): Shows what an agent turn carried: tools, resources, memory |
| 176 | [Agent status](https://uiarc.dev/components/agent-status) `agent-status` | Pro, Arc Pro license | A compact live status pill for a running AI agent: the agent's mark in a live ring, the current activity and an elapsed timer, opening into the steps so far. | A new activity rolls in vertically in about 180ms while the old one leaves upward; the pill's width follows on the morph spring, and the label fades at its right edge only while it is wider... | - | **Adapt-Pro** (Status capsule, Activity Layer 1): Live ring, activity roll, needs-input state; one voice in Layer 1 (HyperDelivery mark, no agent identity) |
| 177 | [Tool call](https://uiarc.dev/components/tool-call) `tool-call` | Pro, Arc Pro license | A tool call row for agent transcripts: the tool's mark and the call in plain words, a live state while it runs, and the input and output a click away, with approval and retry when needed. | Opening a row, opening the group and showing more lines animate height on the critically damped smooth spring, with a short opacity fade; chevrons turn on the shared CSS spring. | - | **Adapt-Pro** (Assistant rail, Activity Layer 2): Tool chips with real logos; supply our own marks for Snowflake, Confluence, Jira, Teams, OneDrive, S3, Bedrock |
| 178 | [Agent plan](https://uiarc.dev/components/agent-plan) `agent-plan` | Pro, Arc Pro license | The plan an agent writes before it acts: edit, reorder or add steps while it is a draft, then watch it work through them as a live checklist. | Reorders, inserts, removals and activity lines move on a critically damped spring (about 260ms, no bounce), so rows slide and grow without overshoot. | - | **Adapt-Pro** (Project during build): Draft plan then live checklist; plan approval itself stays a gate |

#### Illustrations (9)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 179 | [Data flow](https://uiarc.dev/components/data-flow) `data-flow` | Pro, Arc Pro license | Data flow illustration. Sources (app, database, events) are on the left, a processing core with a live count sits in the middle, and destinations (warehouse, dashboard, alerts) are on the right. Records leave as hollow dots and... | One rAF loop writes SVG transforms, opacity, and dash offsets straight to the DOM, and only when a value changed; React does not render per frame. | - | **Inspiration** (Architecture canvas): Pro; records travel along cubic paths through a core to destinations |
| 180 | [Payment flow](https://uiarc.dev/components/payment-flow) `payment-flow` | Pro, Arc Pro license | A card tap goes to a processor, then the network, then the bank and back with authorization, then settlement; each hop lights up with a status label and the amount travels as a chip. | One rAF loop writes transforms, opacity, dash values, a few attributes, and text nodes straight to the DOM, and only when a value changed; React does not render per frame. | - | **Skip** |
| 181 | [Multi-region failover](https://uiarc.dev/components/multi-region-failover) `multi-region-failover` | Pro, Arc Pro license | Animated multi-region failover on a 2.5D stage: users stream requests through a global load balancer to two regions; the primary degrades, fails three health checks, traffic shifts smoothly to the healthy region, then it... | One requestAnimationFrame loop writes SVG attributes, transforms, opacity and text directly, and only when a value changed; React never re-renders per frame. | - | **Skip** |
| 182 | [Vector search](https://uiarc.dev/components/vector-search) `vector-search` | Pro, Arc Pro license | Documents drop onto a tilted embedding plane and fold into points that cluster by topic; the index links neighbors, a query is typed, embedded and lowered onto the plane, a signal hops along the graph toward it, and a widening... | One rAF loop writes SVG transforms, opacity, dash lengths, and a few text nodes straight to the DOM, and only when a value changed; React does not render per frame. | - | **Inspiration** (First run, Library): Pro; explains how project resources are indexed |
| 183 | [Agent loop](https://uiarc.dev/components/agent-loop) `agent-loop` | Pro, Arc Pro license | An illustration of the agent loop: gather context, take action, verify, repeat, with a bright head circling three stations around the model. | The head eases from station to station round the ring and drags a soft gradient trail that stretches with its speed and shrinks to nothing when it lands, so it never sits still with a tail.... | radix/tooltip | **Inspiration** (First run): Pro; explainer |
| 184 | [Mixture of experts](https://uiarc.dev/components/mixture-of-experts) `mixture-of-experts` | Pro, Arc Pro license | An illustration of mixture of experts routing: each token is scored by a router, travels to its top experts, and their outputs merge into the token's result. | One clock drives the story: the input chip slides in, a packet with a short soft trail travels to the router, the score bars grow, packets travel to the chosen experts, the tiles light up... | radix/tooltip | **Skip** |
| 185 | [Speculative decoding](https://uiarc.dev/components/speculative-decoding) `speculative-decoding` | Pro, Arc Pro license | An illustration of speculative decoding: a fast draft model guesses a few tokens, the target model checks them in one pass, and accepted guesses join the answer. | Draft chips appear one by one, fading in from 4px to the left, with a short shimmer on the text while they wait. | radix/switch, radix/tooltip | **Skip** |
| 186 | [Prompt cache](https://uiarc.dev/components/prompt-cache) `prompt-cache` | Pro, Arc Pro license | An animated explainer for prompt caching: the shared prefix of each request is cached once, later requests read it back, and the cost and time saved add up. | One requestAnimationFrame clock drives the story and runs only while playing or stepping, on screen and in a visible tab. The ring and countdown are written straight to the DOM; React... | radix/tooltip | **Skip** |
| 187 | [Reasoning tree](https://uiarc.dev/components/reasoning-tree) `reasoning-tree` | Pro, Arc Pro license | An illustration of tree search over thoughts: candidates are scored, weak branches fade, the best expand, and the winning path from question to answer draws in. | A proposed thought fades in as its edge draws out of the parent, 20ms apart per sibling. | radix/tooltip | **Skip** |

### Blocks (112 items: 22 free, 90 Pro)


#### Analytics (12)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 188 | [Metrics dashboard](https://uiarc.dev/components/blocks/metrics-dashboard) `metrics-dashboard` | Pro, Arc Pro license | A dense analytics view with KPI tabs, one inspectable chart, and top pages and sources. | KPI values and list counts count to their new amounts with tabular numerals. | - | **Skip**: Pro; generated apps cannot use it and Home has no KPI tiles |
| 189 | [Revenue explorer](https://uiarc.dev/components/blocks/revenue-explorer) `revenue-explorer` | Pro, Arc Pro license | A SaaS revenue chart you zoom with a brush while paths, axes and figures glide to the range. | Paths, axes and ticks glide to the new range on springs while totals roll with Animated counter. | - | **Skip** |
| 190 | [Journey flow](https://uiarc.dev/components/blocks/journey-flow) `journey-flow` | Pro, Arc Pro license | A Sankey of user journeys whose flows morph by channel and trace a cohort on hover. | Ribbons morph their widths on a spring slightly slower than a control when the segment changes; counts follow a beat later and never overshoot. | - | **Skip** |
| 191 | [Cohort retention](https://uiarc.dev/components/blocks/cohort-retention) `cohort-retention` | Pro, Arc Pro license | A cohort retention triangle that morphs into retention curves and rewashes by segment. | Cells morph into curves on the view switch and rewash their color when the segment changes; headline figures roll with Animated counter. | - | **Skip** |
| 192 | [Uptime status](https://uiarc.dev/components/blocks/uptime-status) `uptime-status` | Pro, Arc Pro license | A status page with 90 day uptime bars, a morphing latency chart and an incident timeline. | The selected service highlight moves between rows with a shared layout spring, and the tooltip follows the pointer on a spring. | - | **Inspiration** (Admin, failure): Pro; platform status with an incident timeline |
| 193 | [Usage forecast](https://uiarc.dev/components/blocks/usage-forecast) `usage-forecast` | Pro, Arc Pro license | A billing period usage chart with a forecast cone and a draggable budget that dates the crossing. | The budget line follows drags directly and settles on a snappy spring when released or moved by keyboard. | - | **Inspiration** (Admin budgets): Pro; forecast cone with a draggable budget that dates the crossing |
| 194 | [MRR waterfall](https://uiarc.dev/components/blocks/mrr-waterfall) `mrr-waterfall` | Pro, Arc Pro license | An MRR bridge whose floating bars morph by period and open the accounts behind each move. | Bars morph to new levels when the period changes, and the account list reorders with layout animation. | - | **Skip** |
| 195 | [Metric explorer](https://uiarc.dev/components/blocks/metric-explorer) `metric-explorer` | Pro, Arc Pro license | KPI cards that open into a scrubbable chart and morph between metrics and ranges. | A card's surface morphs into the chart panel with a shared layout transition and back on close. | - | **Inspiration** (Portfolio): Pro |
| 196 | [KPI drilldown](https://uiarc.dev/components/blocks/kpi-drilldown) `kpi-drilldown` | Pro, Arc Pro license | KPI cards that expand into a full detail chart with period comparison and a breakdown table, then fold back. | The card grows into the detail on one spring, and the detail folds back into the same card. | - | **Inspiration** (Portfolio): Pro; card expands into detail and folds back |
| 197 | [Choropleth explorer](https://uiarc.dev/components/blocks/choropleth-explorer) `choropleth-explorer` | Pro, Arc Pro license | A filled-region map that shades every state or region by revenue, growth or penetration on a stepped scale, with a country switch (United States, Canada, Brazil, United Kingdom, France, Germany, Italy, Australia), a hoverable... | Switching the metric fades each region to its new fill with a delay set by its position, so the change sweeps across the map from west to east in under 800ms. | - | **Skip** |
| 198 | [Connected scatter](https://uiarc.dev/components/blocks/connected-scatter) `connected-scatter` | Pro, Arc Pro license | A connected scatterplot of monthly CAC against LTV where the path draws itself in, a scrubber moves a head along the curve, and a channel switch morphs the path against a shaded 3x target line. | The first time the block scrolls into view, the head travels every month and the path draws in behind it; the dotted future path, arrows and labels fade in once it lands. | - | **Skip** |
| 199 | [Horizon chart](https://uiarc.dev/components/blocks/horizon-chart) `horizon-chart` | Pro, Arc Pro license | A horizon chart that stacks fourteen daily series as compact folded rows, with a synced crosshair, a sort by name, peak or latest, a band count setting that folds every row on one spring, and a legend that explains how to read... | Changing the band count animates one motion value that drives two custom properties on the root, so every layer in every row folds or unfolds together on a no-overshoot spring, on transform... | - | **Skip** |

#### Finance (2)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 200 | [Market terminal](https://uiarc.dev/components/blocks/market-terminal) `market-terminal` | Pro, Arc Pro license | A trading terminal with a canvas candlestick chart, volume, moving averages, crosshair OHLC readout, wheel, drag and pinch zoom, a live watchlist with sparklines and flashing prices, and a market and limit order ticket. | The chart is one canvas drawn in a requestAnimationFrame loop that runs only while something moves; React never re-renders per frame. | - | **Skip** |
| 201 | [Budget variance](https://uiarc.dev/components/blocks/budget-variance) `budget-variance` | Pro, Arc Pro license | Budget against actual operating spend by department as aligned bullet charts, with favorable and unfavorable variance, a month, quarter and year to date switch that springs every bar, in-place drill-down into budget lines, and a... | Switching the window springs every bar to its new length on one critically damped spring and counts every amount and share to the new value, all written to the DOM from motion values. | - | **Inspiration** (Admin): Pro; budget against actual by workspace |

#### Line charts (2)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 202 | [Small multiples](https://uiarc.dev/components/blocks/small-multiples) `small-multiples` | Pro, Arc Pro license | A trellis of small line charts that reads as one chart, with a synced crosshair, a shared or independent y scale that springs the axes, sorting with a FLIP reorder, a ghost of the overall total behind every panel and dimming for... | Switching the y scale springs each panel's domain on one critically damped spring. The line, the area, the end dot and the axis ticks all derive from the same two motion values, so the axes... | - | **Inspiration** (Portfolio): Pro; split times per workspace as a trellis |
| 203 | [Line replay](https://uiarc.dev/components/blocks/line-replay) `line-replay` | Pro, Arc Pro license | A time replay line chart that draws a day of traffic with a moving playhead, a value label on the tip, a scrubber, speed control and key moments annotated as the playhead passes them. | Playback advances a single motion value from requestAnimationFrame; each frame writes the line and area paths, the playhead, the tip label, the axis clock, the scrubber and the readout... | - | **Inspiration** (Trace playback): Pro; playhead with key moments annotated as it passes |

#### AI (10)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 204 | [AI composer](https://uiarc.dev/components/blocks/ai-composer) `ai-composer` | Pro, Arc Pro license | The prompt box at the bottom of an AI app: files upload in place, / opens commands, @ inserts mentions, a model and effort menu sits in the toolbar, and the send button turns into a stop control ringed by the reply's progress. | The send arrow lifts out and a stop square scales in on the morph spring; a thin accent arc around the button fills with the reply, then fades as the button turns back into an arrow the... | radix/dropdown-menu, radix/tooltip | **Adapt-Pro** (Start a project, rail): Files upload in place, @ mentions, / starters, stop ring; model and effort menu removed for business users |
| 205 | [AI chat](https://uiarc.dev/components/blocks/ai-chat) `ai-chat` | Pro, Arc Pro license | A full-screen AI chat where answers stream in as markdown with folding reasoning, tool chips and cited sources. People can switch chats and models, edit or retry a message into versions, rate replies and stop a reply mid-stream. | Answers stream in chunks of three or four whole words every 34ms on a requestAnimationFrame clock (about 90 to 120 words per second). Each chunk is its own span that fades in once over... | radix/dropdown-menu, radix/tooltip, radix/popover | **Adapt-Pro** (Assistant rail): Streaming markdown, folding reasoning, tool chips, cited sources; one voice, model chip hidden below Layer 3 |
| 206 | [AI side panel](https://uiarc.dev/components/blocks/ai-side-panel) `ai-side-panel` | Pro, Arc Pro license | An assistant docked beside a page that reads it and edits it: ask about the page or a selected passage, review each edit as a word diff, and apply it with a tint sweep on the page and one-click undo. | Closing the panel narrows the dock on a critically damped spring (no bounce) while the panel slides out; the page column widens and the document glides to center. | radix/tooltip | **Adapt-Pro** (Living document): Assistant edits as word diffs, applied with undo; Chopin-like collaboration |
| 207 | [Research run](https://uiarc.dev/components/blocks/research-run) `research-run` | Pro, Arc Pro license | Deep research that plans searches, reads sources with their marks, and streams a cited answer where every chip lights up the sentence it supports. | Streamed text is buffered and drained on a requestAnimationFrame loop at a rate that follows the measured arrival rate, scaled by how full the buffer is and eased so bursts bend the pace... | - | **Inspiration** (Discovery, Library): Pro; plans searches, reads sources with marks, streams a cited answer |
| 208 | [AI answer](https://uiarc.dev/components/blocks/ai-answer) `ai-answer` | Pro, Arc Pro license | One AI answer set like a clean article: it thinks, shows its sources as small cards with colored marks, and streams a formatted answer where every citation lights the sentence it supports. Copy, regenerate with options, rate... | "Thinking" uses the Arc text shimmer for about a second and settles to solid text as "Thought for 9s" when the first words arrive. | radix/dropdown-menu, radix/popover, radix/tooltip | **Inspiration** (Library): Pro; I found 7 confirmed facts, each citation lights its sentence |
| 209 | [Model picker](https://uiarc.dev/components/blocks/model-picker) `model-picker` | Pro, Arc Pro license | A model picker in one quiet pill: open it to choose from featured models with a one line note each, set the reasoning effort, or browse every other model by provider, and the pill swaps to your choice in place. | The menu opens from the pill edge with a short offset, a slight scale and a quick fade, and reverses from where it is if closed mid-open. | radix/dropdown-menu | **Inspiration** (Admin model allowlist): Pro; provider marks and effort; business users never pick models |
| 210 | [Model arena](https://uiarc.dev/components/blocks/model-arena) `model-arena` | Pro, Arc Pro license | A blind side by side model comparison in one card: send one prompt to two models, watch both answers stream at the same pace, vote for the better one, then reveal which model wrote each. | Answers stream in chunks of whole words every 30 to 40ms, each fading in over 160ms with no blur or travel, at the same pace in both panes; settled text never re-renders, and each answer... | radix/popover, radix/switch | **Skip** |
| 211 | [Prompt studio](https://uiarc.dev/components/blocks/prompt-studio) `prompt-studio` | Pro, Arc Pro license | One card for editing, testing and shipping a prompt template: variables as chips with sample values, a test run against the chosen model, and versions you can compare and promote to production. | Promoting a version glides the Production marker from its old row to the new one on the critically damped smooth spring, with no overshoot. Undo glides it back. | radix/popover | **Inspiration** (Admin (platform team)): Pro; prompt versions promoted to production |
| 212 | [Document extraction](https://uiarc.dev/components/blocks/document-extract) `document-extract` | Pro, Arc Pro license | Turns a document into typed data with a model and shows where every value came from: fields fill in as the page is read, and hovering a value lights its source on the PDF. | The connector is one cubic Bezier that draws in over 220ms with round caps in the field's series color; a soft band of light travels along it once, then the line rests. Round anchors sit at... | radix/tabs, radix/dropdown-menu, radix/tooltip | **Inspiration** (Confirm what we heard): Pro; hovering a value lights its source; maps to fact to transcript span |
| 213 | [Agent memory](https://uiarc.dev/components/blocks/agent-memory) `agent-memory` | Pro, Arc Pro license | One card for what an assistant remembers about you: filter and search memories, edit or forget one in place, and turn saved memories and chat history on or off. | Capture and add: a copy of the new row lifts off the pill or the field and glides to the row's place in its group on the smooth spring (0.4s, no bounce), moving only by transform, while the... | radix/switch, radix/tooltip | **Adapt-Pro** (Project memory, Library): What HyperDelivery remembers about this project; edit, forget, source |

#### Agents (8)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 214 | [Agent run](https://uiarc.dev/components/blocks/agent-run) `agent-run` | Pro, Arc Pro license | A single card that follows one AI coding agent through a task: steps stream in with the live one shimmering, tool calls open in place, and the agent stops on a two-file diff for you to approve or send back before it writes. When... | New steps open their height on a critically damped spring and fade in; nothing bounces. | radix/tooltip | **Adapt-Pro** (Build (engineering reviewer view)): Steps, tool calls, diff approve or send back, PR; business users never see diffs |
| 215 | [Agent tasks](https://uiarc.dev/components/blocks/agent-tasks) `agent-tasks` | Pro, Arc Pro license | A home for background coding agents: start a task on a repository and branch, watch each card move from queued to running to ready for review, and open a pull request from the result. | A started task grows in at the top on the critically damped smooth spring and its background flashes the accent tint once, so the eye lands on it. | radix/dropdown-menu, radix/tooltip | **Inspiration** (Build board): Pro; queued, running, ready for review cards |
| 216 | [Agent approvals](https://uiarc.dev/components/blocks/agent-approvals) `agent-approvals` | Pro, Arc Pro license | One approval card for agents: the waiting tool call reads like a permission prompt with the tool's mark, the agent's reason and its arguments, and you approve, deny or allow it from now on. | Bringing a queued request into focus is one crossfade of the request (the old one fades out in 100ms, the new one fades in over 200ms from 3px) while the card's height follows on a... | radix/dropdown-menu, radix/popover | **Inspiration** (Admin policies, side effects): Pro; permission prompt for side-effecting tools; Always allow maps to a learned rule awaiting a policy owner |
| 217 | [Agent routines](https://uiarc.dev/components/blocks/agent-routines) `agent-routines` | Pro, Arc Pro license | Scheduled agents in one card: each routine reads as a sentence with its schedule, next run countdown, connectors and destination, and opens smoothly to edit or run it now. | A row opens from height 0 to auto and back on a critically damped spring (about 340ms, no bounce). Opacity starts a beat after the height and ends a beat before it on close, the content... | radix/switch, radix/tooltip, radix/popover, radix/select | **Inspiration** (Digests): Pro; scheduled weekly digest as a sentence |
| 218 | [Agent orchestrator](https://uiarc.dev/components/blocks/agent-orchestrator) `agent-orchestrator` | Pro, Arc Pro license | A lead agent splits a goal into a plan, fans the subtasks out to parallel worker lanes and merges what comes back, with each lane's model, progress and result in view. | Plan items grow in one by one on a critically damped spring and their text streams in chunks of a few words that only fade in. | - | **Adapt-Pro** (Activity Layer 2): Orchestrator fans work to Cortex Code and the coding agent in lanes and merges results |
| 219 | [MCP servers](https://uiarc.dev/components/blocks/mcp-servers) `mcp-servers` | Pro, Arc Pro license | Manage the MCP servers that give an agent its tools: see what the enabled tools cost in context, connect or pause a server, and switch single tools on or off. | Toggling a tool rolls the tool count and token numbers with tabular digits, and its server's segment resizes on a critically damped spring. | radix/switch | **Adapt-Pro** (Admin connectors): Read and write marked per tool, context cost, Atlassian mark built in |
| 220 | [Knowledge base](https://uiarc.dev/components/blocks/knowledge-base) `knowledge-base` | Pro, Arc Pro license | A retrieval knowledge base in one card: add sources and watch them parse, chunk, embed and index, then test a question and see which chunks come back and why. | Turning on Rerank shows a short reranking state, then moves each result to its new rank with a critically damped layout animation (no bounce) while score bars and numbers roll to the... | radix/popover, radix/dropdown-menu, radix/select, radix/switch | **Adapt-Pro** (Project resources, Library): Parse, chunk, embed, index pointed resources; test a question and see chunks |
| 221 | [Eval suite](https://uiarc.dev/components/blocks/eval-suite) `eval-suite` | Pro, Arc Pro license | Run an evaluation suite on a new version of an LLM feature against its baseline: results stream in case by case, and regressions and fixes are called out with the cases behind them. | Cells fill as results arrive: the background tints over 240ms and the glyph scales in from 40 percent with an ease out. Cases in flight breathe once a second. | - | **Inspiration** (Admin (platform team)): Pro; agent version against baseline |

#### App shell (6)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 222 | [Command palette](https://uiarc.dev/components/blocks/command-palette) `command-palette` | Free, MIT | A complete keyboard driven action surface with search, grouped results, and shortcuts. | The panel rises in on a spring; the results frame springs to the list height as the query filters. | - | **Adopt** (Shell): Free alternative to cmdk [kit] |
| 223 | [Notification center](https://uiarc.dev/components/blocks/notification-center) `notification-center` | Free, MIT | A home for updates with read state, grouped information, and animated disclosure. | The bell tilts when open; counts roll like an odometer in the direction of change. | radix/popover | **Adapt** (Shell): Popover of what changed since you left; the Inbox stays a page [kit] |
| 224 | [Selection toolbar](https://uiarc.dev/components/blocks/selection-toolbar) `selection-toolbar` | Pro, Arc Pro license | A contextual batch action surface that appears when items are selected. | The bar rises and scales in on a spring and sinks back faster when the selection clears. | - | **Inspiration** (Library, admin): Pro; batch actions, never bulk approve |
| 225 | [Page header](https://uiarc.dev/components/blocks/page-header) `page-header` | Free, MIT | A project page header that folds into a compact bar as you scroll, with tabs whose counts roll. | Past a short scroll threshold the header folds into a compact bar; the tab indicator glides with a shared layoutId and counts roll with Animated counter. | radix/tabs, radix/dropdown-menu | **Adopt** (Project page): Folds into a compact bar; tab counts roll; carries the line [kit] |
| 226 | [Empty states](https://uiarc.dev/components/blocks/empty-states) `empty-states` | Free, MIT | Four empty states in one illustration whose shapes morph between scenes as you switch tabs. | Each shape morphs its path to the next scene with slight per-shape delays, and the tab indicator glides with a layoutId. | - | **Adopt** (Home, Library, failure): Morphing illustration; restyle monochrome [kit] |
| 227 | [Search results](https://uiarc.dev/components/blocks/search-results) `search-results` | Pro, Arc Pro license | A faceted workspace search page with suggestions, facet counts that follow the query, filter chips, mixed doc, person and file results with highlighted matches, a gliding keyboard cursor and a preview pane. | One neutral fill glides between results on a no overshoot spring as the cursor moves, by keyboard or pointer. | - | **Inspiration** (Library): Pro; mixed fact, person and file results with preview pane |

#### App shell (Sidebar family) (4)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 228 | [Workspace sidebar](https://uiarc.dev/components/blocks/workspace-sidebar) `workspace-sidebar` | Pro, Arc Pro license | A product sidebar with a workspace switcher, live search, draggable favorites, and inline projects. | The sidebar width springs between full and rail, and favorites reorder with layout animation. | radix/dropdown-menu, radix/tooltip | **Inspiration** (Shell): Pro; workspace switcher and favorites |
| 229 | [Sidebar rail](https://uiarc.dev/components/blocks/sidebar-rail) `sidebar-rail` | Pro, Arc Pro license | An app shell whose sidebar folds into an icon rail and slides in as a sheet on phones. | The sidebar folds to a rail on a spring and nested groups expand by height. | radix/dialog, radix/tooltip | **Inspiration** (Shell): Pro; folds to an icon rail |
| 230 | [Docs sidebar](https://uiarc.dev/components/blocks/docs-sidebar) `docs-sidebar` | Pro, Arc Pro license | A docs layout with a live filtering nav tree, version switcher, and a gliding on this page outline. | The outline indicator glides to the heading in view, and the sidebar folds to a rail on a spring. | radix/tooltip | **Skip** |
| 231 | [Inbox sidebar](https://uiarc.dev/components/blocks/inbox-sidebar) `inbox-sidebar` | Pro, Arc Pro license | A mail sidebar whose Compose button grows into a composer and whose folders take dropped mail. | Compose grows into the composer through a shared layoutId, and unread counts roll. | radix/dropdown-menu, radix/tooltip | **Skip** |

#### Auth (3)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 232 | [OTP input](https://uiarc.dev/components/blocks/otp-input) `otp-input` | Free, MIT | A six digit verification flow with paste support and keyboard navigation. | Typed characters rise into the slot and unblur; a paste lands as a short left-to-right wave. | - | **Skip** |
| 233 | [Multi-step form](https://uiarc.dev/components/blocks/multi-step-form) `multi-step-form` | Pro, Arc Pro license | A guided form that presents one decision at a time and preserves progress. | Steps slide 20px in the direction of travel while the shell springs to the new step's height. | - | **Inspiration** (Start a project): Pro; one decision at a time |
| 234 | [Onboarding illustration](https://uiarc.dev/components/blocks/onboarding-illustration) `onboarding-illustration` | Pro, Arc Pro license | A compact onboarding card whose line illustration morphs from folder to files, team, and badge. | The same line shapes morph between folder, files, team, and badge scenes on springs. | - | **Inspiration** (First run): Pro |

#### Auth (Login and sign up family) (5)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 235 | [Sign up form](https://uiarc.dev/components/blocks/signup-form) `signup-form` | Free, MIT | An account creation flow with field validation, password strength, and a clear completion state. | The card height springs between the form and the completion panel, which slides in while the form exits. | - | **Skip**: Entra SSO |
| 236 | [Sign in](https://uiarc.dev/components/blocks/sign-in) `sign-in` | Free, MIT | A sign in card that morphs from email to a six digit code to your account. | The card morphs its height between the email, code, and done steps, sliding content in the direction of travel. | - | **Skip**: Entra SSO |
| 237 | [Centered login](https://uiarc.dev/components/blocks/login-centered) `login-centered` | Free, MIT | A passkey-first login card on a quiet ring backdrop that morphs through email and code. | Steps slide and blur between passkey, email, code and done while the card height follows; the resend label rolls. | - | **Skip**: Entra SSO |
| 238 | [Immersive login](https://uiarc.dev/components/blocks/login-immersive) `login-immersive` | Pro, Arc Pro license | A glass magic link card over dusk photography that folds its envelope shut once sent. | After sending, the form gives way to an envelope that folds shut and the resend countdown rolls. | - | **Skip** |
| 239 | [Login split](https://uiarc.dev/components/blocks/login-split) `login-split` | Pro, Arc Pro license | A full screen split login: an email-first form that morphs into a password step beside a photo. | Continue morphs the email form into the password step with the account avatar, and labels roll between states. | - | **Skip** |

#### Settings (6)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 240 | [Settings page](https://uiarc.dev/components/blocks/settings-page) `settings-page` | Pro, Arc Pro license | Account settings with a gliding section nav and a save bar that morphs in as you edit. | The active section indicator glides between nav items. | - | **Inspiration** (Admin): Pro; save bar morphs in on edit |
| 241 | [Billing overview](https://uiarc.dev/components/blocks/billing-overview) `billing-overview` | Pro, Arc Pro license | A billing page where the plan card morphs into a picker and usage, invoices, and card follow. | The plan card morphs into the picker and back inside a region whose height springs; the selected plan highlight glides with a shared layoutId. | - | **Skip** |
| 242 | [Security settings](https://uiarc.dev/components/blocks/security-settings) `security-settings` | Pro, Arc Pro license | An account security page with guided two-factor setup, password change and active sessions. | Two-factor steps advance along a rail with a gliding marker, and sections expand with a height spring. | - | **Skip** |
| 243 | [Cancel flow](https://uiarc.dev/components/blocks/cancel-flow) `cancel-flow` | Pro, Arc Pro license | A cancellation flow that answers each reason with a tailored offer and a calm hold-to-cancel. | Steps slide between reason, offer and confirm, the selection highlight glides with a layoutId, and prices roll with Animated counter. | - | **Skip** |
| 244 | [Settings command](https://uiarc.dev/components/blocks/settings-command) `settings-command` | Pro, Arc Pro license | Workspace settings where a search field grows into a palette that flies you to any setting. | The search field grows into the palette: position, size, and corner radius ride one spring, and results are revealed by the growing edge instead of reflowing. | - | **Inspiration** (Admin): Pro; search flies to any setting |
| 245 | [Usage billing](https://uiarc.dev/components/blocks/usage-billing) `usage-billing` | Pro, Arc Pro license | A usage based billing dashboard with a projected spend line, meters against limits, alerts, and an upgrade that morphs into a confirm sheet. | The spend line draws in once, the projection and alert rules follow; alert rules glide to their new height while you type an amount. | - | **Inspiration** (Admin budgets): Pro; projected spend, meters, alerts |

#### People (4)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 246 | [Team directory](https://uiarc.dev/components/blocks/team-directory) `team-directory` | Pro, Arc Pro license | Searchable people, team filters, and a focused profile panel. | The filter highlight and the row selection highlight glide with shared layoutIds on the morph spring. | - | **Inspiration** (Library): Pro; owners and stewards |
| 247 | [Team members](https://uiarc.dev/components/blocks/team-members) `team-members` | Pro, Arc Pro license | A members list where typed emails turn into chips and fly into pending invites as seats roll. | Email chips fly into the pending invites list and the seat count rolls. | radix/select | **Inspiration** (Project people): Pro |
| 248 | [Roles and permissions](https://uiarc.dev/components/blocks/roles-permissions) `roles-permissions` | Pro, Arc Pro license | A permissions matrix with group toggles that ripple, role duplication and a review bar. | Group toggles ripple across their permissions with a short stagger, and a column band follows the hovered role. | radix/dropdown-menu | **Inspiration** (Admin roles): Pro; Entra group to role matrix with a review bar that becomes a signed policy change |
| 249 | [Invite people](https://uiarc.dev/components/blocks/invite-people) `invite-people` | Pro, Arc Pro license | Invite teammates with roles, bulk paste validation, a seat meter, and avatars that fly into a pending list. | Avatars share layoutIds, so a person flies from the suggestion into a chip, from the chip into the pending list, and from the row into the team stack when they join. | - | **Inspiration** (Start a project): Pro; suggested people from catalog owner tags |

#### Developer (4)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 250 | [Integrations](https://uiarc.dev/components/blocks/integrations) `integrations` | Pro, Arc Pro license | An integrations directory where Connect morphs to Connected and the filters recount as you go. | Connect morphs into a Connected state and filter counts recount as you go. | - | **Inspiration** (Admin connectors): Pro; Connect morphs to Connected |
| 251 | [API keys](https://uiarc.dev/components/blocks/api-keys) `api-keys` | Pro, Arc Pro license | API key management where Create key unfolds into its form and each secret is shown once. | The Create key button unfolds into its form, and new keys slide into the list. | - | **Skip** |
| 252 | [Webhooks](https://uiarc.dev/components/blocks/webhooks) `webhooks` | Pro, Arc Pro license | A webhooks console with delivery history, a payload inspector and retries that roll the rate. | Selection highlights and the active tab slide with shared layout springs; new rows grow in and flash once. | - | **Inspiration** (Side-effect ledger): Pro; delivery history, payload inspector, retries |
| 253 | [Environment variables](https://uiarc.dev/components/blocks/env-variables) `env-variables` | Pro, Arc Pro license | An environment variables and secrets manager with masked values, per-environment scope toggles, .env paste import with duplicate and invalid key warnings, write-only sensitive values, an environment diff by fingerprint, and a... | The redeploy banner, add panel, inline editor, and conflict notes open with height and opacity on the smooth spring and close with a quicker exit ease. | radix/select, radix/switch, radix/checkbox | **Skip** |

#### Pricing (6)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 254 | [Plan comparison](https://uiarc.dev/components/blocks/plan-comparison) `plan-comparison` | Free, MIT | Compare meaningful differences between plans and billing periods. | Prices count between billing periods and the selection highlight moves with layoutId. | - | **Skip** |
| 255 | [Usage pricing](https://uiarc.dev/components/blocks/usage-pricing) `usage-pricing` | Pro, Arc Pro license | A pricing calculator that finds your plan as you drag seats and traffic. | Prices roll with the animated counter and plan names morph with text-morph as sliders move. | - | **Skip** |
| 256 | [Cart drawer](https://uiarc.dev/components/blocks/cart-drawer) `cart-drawer` | Pro, Arc Pro license | Products fly into the cart, counts roll, and a drawer handles quantities, shipping progress, and checkout. | The product photo flies along a quadratic arc into the cart over 780ms, shrinking and tilting; the badge count only changes when it lands, then the cart bumps and rings. | - | **Skip** |
| 257 | [Pricing calculator](https://uiarc.dev/components/blocks/pricing-calculator) `pricing-calculator` | Pro, Arc Pro license | A seat slider and billing toggle drive plan cards with rolling prices and a moving recommended badge. | The selection frame and the Recommended badge are shared layout elements that travel between cards on a spring. | - | **Skip** |
| 258 | [Checkout summary](https://uiarc.dev/components/blocks/checkout-summary) `checkout-summary` | Pro, Arc Pro license | An order summary with a promo code that becomes a chip, discount and tax lines, and pay button states. | Adjustment and coupon lines open with a height spring and fade. | - | **Skip** |
| 259 | [Live checkout](https://uiarc.dev/components/blocks/checkout-live) `checkout-live` | Pro, Arc Pro license | A subscription checkout whose summary recomputes as you edit, then glides to the centre and unfolds into a receipt. | Every amount rolls digit by digit on the snappy spring; add-on and discount lines open and close their height on the smooth spring. | - | **Skip** |

#### Commerce (5)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 260 | [Wallet card](https://uiarc.dev/components/blocks/wallet-card) `wallet-card` | Pro, Arc Pro license | A compact account view with balance, recent activity, and focused money actions. | Balances count to the new value over about 0.75s, and the card resizes on a gentle spring. | - | **Skip** |
| 261 | [Invoice studio](https://uiarc.dev/components/blocks/invoice-studio) `invoice-studio` | Pro, Arc Pro license | An editable invoice with live totals and a clear save flow. | Totals roll with a short vertical slide and blur when they change. | - | **Skip** |
| 262 | [Delivery tracker](https://uiarc.dev/components/blocks/delivery-tracker) `delivery-tracker` | Pro, Arc Pro license | A live order tracker whose marker glides between stops while the arrival time rolls. | The marker glides between stops while the arrival time rolls. | - | **Inspiration** (The line): Pro; marker glides between stops while the ETA rolls |
| 263 | [Product listing](https://uiarc.dev/components/blocks/product-listing) `product-listing` | Pro, Arc Pro license | A storefront grid with price, color and size filters, a sort menu, hover photo swaps, and quick add with a size row. | Cards reflow on a spring when filters or sort change; removed cards fade out and new ones fade in, all at the same size. | - | **Skip**: Pro; may tempt merch prototypes but must never enter generated apps |
| 264 | [Product detail](https://uiarc.dev/components/blocks/product-detail) `product-detail` | Pro, Arc Pro license | A product page with a swipeable gallery, finish and size variants, add to bag that confirms in place, shipping, a reviews summary, and details. | The gallery follows the pointer 1:1, rubber-bands at the ends, projects the flick with momentum, and hands the release velocity to the spring. | - | **Skip**: As above |

#### Support (4)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 265 | [Support conversation](https://uiarc.dev/components/blocks/support-conversation) `support-conversation` | Pro, Arc Pro license | A responsive message thread with useful quick replies and live feedback. | Messages rise into the thread on a gentle spring and existing messages shift via layout. | - | **Skip** |
| 266 | [Inbox triage](https://uiarc.dev/components/blocks/inbox-triage) `inbox-triage` | Pro, Arc Pro license | Process a focused inbox with archive, snooze, and restore actions. | Rows and message details open and collapse with height and opacity on the smooth spring. | - | **Inspiration** (Inbox): Pro; archive, snooze, restore |
| 267 | [Support widget](https://uiarc.dev/components/blocks/support-widget) `support-widget` | Pro, Arc Pro license | An in-app help launcher that grows into live article search, reading, and a chat with your team. | The launcher springs open into the panel, and views slide in the direction of travel. | - | **Skip** |
| 268 | [Help center](https://uiarc.dev/components/blocks/help-center) `help-center` | Pro, Arc Pro license | A help center with instant search, topic cards, and popular articles that open into a readable article with an outline and feedback. | Results drop in from the field with a short fade and scale; they are never animated while you arrow through them. | - | **Skip** |

#### Media (2)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 269 | [Media player](https://uiarc.dev/components/blocks/media-player) `media-player` | Pro, Arc Pro license | An audio player with a living playlist and complete playback controls. | The selection rail glides to the current track with a shared layoutId on the gentle spring; playing bars pulse beside it. | - | **Inspiration** (Working session): Pro; Teams recording playback beside its transcript |
| 270 | [File upload](https://uiarc.dev/components/blocks/file-upload) `file-upload` | Free, MIT | A complete file selection flow with constraints, progress, and error feedback. | The dropzone label swaps to Drop to add files while dragging; rows open and close their height on a spring. | - | **Adopt** (Start a project, resources): Constraints, progress, errors [kit] |

#### Projects (5)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 271 | [Release readiness](https://uiarc.dev/components/blocks/release-readiness) `release-readiness` | Pro, Arc Pro license | A launch checklist that keeps prerequisites, progress, and the final action together. | The completed count swaps with a 5px rise and fade. | - | **Inspiration** (Graduation): Pro; prerequisites, progress and the final action together |
| 272 | [Project board](https://uiarc.dev/components/blocks/project-board) `project-board` | Pro, Arc Pro license | A living workflow board for moving work between stages. | Cards travel between columns with a per-card layoutId on the gentle spring; new cards scale in from 0.98. | - | **Inspiration** (Projects by stage): Pro |
| 273 | [Availability picker](https://uiarc.dev/components/blocks/availability-picker) `availability-picker` | Pro, Arc Pro license | Find a meeting time across people and see the choice come together. | Time slots slide in from the direction of the day change. | - | **Inspiration** (Decision timeline): Pro; people as rows across time |
| 274 | [Week calendar](https://uiarc.dev/components/blocks/week-calendar) `week-calendar` | Pro, Arc Pro license | A week calendar where you drag to create, move, and resize events, with color coded calendars, day and agenda views, and swipes on phones. | Ranges slide in the direction of travel on a spring without overshoot, the header and all day row move with the grid, and a swipe on touch drags the neighbors along so letting go continues... | - | **Skip**: Pro; scheduling, not a decision timeline |
| 275 | [Kanban board](https://uiarc.dev/components/blocks/kanban-board) `kanban-board` | Pro, Arc Pro license | A kanban board where cards lift, tilt and spring into the slot that opens for them, with swimlanes and live WIP limits. | The lifted card rides pointer motion values, lifts slightly and tilts on a spring from horizontal velocity. | - | **Skip**: Gates are signed, not dragged |

#### Heroes (2)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 276 | [Hero section](https://uiarc.dev/components/blocks/hero-section) `hero-section` | Free, MIT | Three full screen SaaS heroes: a live dashboard rising from the bottom edge over a drifting mesh, a workflow graph that routes sample events node by node, and editorial type over a mesh gradient. | Screenshot: the copy rises in reading order, then the window rises in behind it and settles flat from a tilt. | - | **Adapt** (Architecture canvas): Free workflow variant routes events node by node; lift the routing animation onto xyflow edges [kit] |
| 277 | [Hero signup](https://uiarc.dev/components/blocks/hero-signup) `hero-signup` | Pro, Arc Pro license | A full screen waitlist hero on a soft, drifting mesh gradient: the email field validates as you type and its button grows into the confirmation with your place in line. | The headline rises in word by word once on load, followed by the supporting line, the field, and the social proof. | - | **Skip** |

#### Features (4)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 278 | [Scroll story](https://uiarc.dev/components/blocks/scroll-story) `scroll-story` | Pro, Arc Pro license | A feature section where scrolling the copy drives a pinned product view through each step. | Scroll position drives a progress value that fills the step tabs, sorts messages on springs and draws the trend line. | - | **Skip** |
| 279 | [Spotlight grid](https://uiarc.dev/components/blocks/spotlight-grid) `spotlight-grid` | Pro, Arc Pro license | A feature grid where light follows the pointer, cards play live demos, and a click morphs a card into its detail. | The card surface and title share layoutIds with the detail view, so opening grows the card on a spring with a little bounce and closing settles without overshoot. | - | **Skip** |
| 280 | [Comparison table](https://uiarc.dev/components/blocks/comparison-table) `comparison-table` | Free, MIT | An us versus them table with a sticky header, a highlighted column, and a stacked phone view. | Checks in your column draw in once, staggered down the table, when they scroll into view. | - | **Adapt** (Definition dispute): Theirs, ours and certified today side by side with a highlighted column [kit] |
| 281 | [Feature bento](https://uiarc.dev/components/blocks/feature-bento) `feature-bento` | Pro, Arc Pro license | A six cell feature bento where small, real product UI acts each feature out on hover. | Cells rise 14px and fade in once as they enter view, staggered by column. | - | **Skip** |

#### Social proof (3)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 282 | [Logo marquee](https://uiarc.dev/components/blocks/logo-marquee) `logo-marquee` | Free, MIT | A quiet, continuously moving row of brand marks with a pause control. | A CSS keyframe loop scrolls two copies of the list for a seamless track. | - | **Skip** |
| 283 | [Studio perspectives](https://uiarc.dev/components/blocks/testimonial-stage) `testimonial-stage` | Pro, Arc Pro license | Portrait led editorial stories with a focused reading state. | Portrait and quote crossfade with a small directional shift. | - | **Skip** |
| 284 | [Stats band](https://uiarc.dev/components/blocks/stats-band) `stats-band` | Free, MIT | Headline numbers that count up in view, each with a tiny visual that proves it and a context line on hover, plain or in a hairline grid. | Each number counts from zero with a strong ease out over 1.6s, staggered 90ms per stat, the first time the band is half in view. | - | **Skip** |

#### Content (5)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 285 | [Team showcase](https://uiarc.dev/components/blocks/team-showcase) `team-showcase` | Pro, Arc Pro license | An image led team introduction with profiles that open in place. | Profiles crossfade and expand in place when selection changes. | - | **Skip** |
| 286 | [Changelog feed](https://uiarc.dev/components/blocks/changelog-feed) `changelog-feed` | Free, MIT | Release notes you can filter, open in place, and scroll through month by month. | Entries open in place on a spring while the chevron rotates; the month label slides in the scroll direction. | - | **Adapt** (Home Across UA): Recently shipped work, filterable [kit] |
| 287 | [FAQ section](https://uiarc.dev/components/blocks/faq-section) `faq-section` | Free, MIT | FAQs as an accordion, a topic rail, or a searchable list that highlights matches. | Answers open with height and opacity together and the plus icon turns. | - | **Adopt** (Generated apps, help) [kit] |
| 288 | [Contact section](https://uiarc.dev/components/blocks/contact-section) `contact-section` | Free, MIT | A validated contact form that morphs into a confirmation, support channels, and office cards with local times. | The form card springs into the confirmation; faces slide along one axis in the direction of travel out of a soft blur. | - | **Skip** |
| 289 | [Blog grid](https://uiarc.dev/components/blocks/blog-grid) `blog-grid` | Free, MIT | A blog index with a featured post, category filter, post cards, pagination and an in-place reader. | The filter and page highlights glide on the morph spring. | - | **Skip** |

#### Headers and footers (4)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 290 | [Site header](https://uiarc.dev/components/blocks/site-header) `site-header` | Free, MIT | A sticky website header that turns solid on scroll, with a gliding active link, mega menu panels, and a mobile sheet. | Mega panels open on hover after a short intent delay and close after a leave grace; switching items morphs the panel to the new content. | - | **Skip** |
| 291 | [Site footer](https://uiarc.dev/components/blocks/site-footer) `site-footer` | Free, MIT | A website footer with link columns and newsletter, a minimal layout, and a large fading Arc mark. | The subscribe button morphs to its confirmed state while the form keeps its width. | - | **Skip** |
| 292 | [CTA section](https://uiarc.dev/components/blocks/cta-section) `cta-section` | Free, MIT | A call to action as a centered closing section, a split beside a setup card that completes itself, or a dismissible banner. | Primary actions lean their arrow forward on hover; buttons press to .97 and morph their width when the label changes. | - | **Skip** |
| 293 | [Newsletter signup](https://uiarc.dev/components/blocks/newsletter-signup) `newsletter-signup` | Free, MIT | An email signup framed by a stack of past issues; subscribing drops the next issue, addressed to you, onto the front. | On success the next issue, addressed to you, rises onto the front of the stack while the others step back and the oldest drops away. It is one no-overshoot spring, and opacity resolves fast... | - | **Skip** |

#### Showpieces (6)

| # | Item | Tier, license | What it does | Notable motion or interaction | Extra deps | HyperDelivery verdict |
|---|---|---|---|---|---|---|
| 294 | [Activity terrain](https://uiarc.dev/components/blocks/activity-terrain) `activity-terrain` | Pro, Arc Pro license | A 3D terrain of hourly activity you can orbit, zoom, fly into and flatten into a heatmap. | Columns rise in a wave on load and when the metric changes; camera moves use spring physics with momentum on drag. | - | **Skip** |
| 295 | [Revenue globe](https://uiarc.dev/components/blocks/revenue-globe) `revenue-globe` | Pro, Arc Pro license | A dotted globe where live payments arc home to headquarters, with a replayable day. | Payments draw as arcs to headquarters while the globe drifts; drags rubber-band past the latitude limit. | - | **Skip** |
| 296 | [Customer galaxy](https://uiarc.dev/components/blocks/customer-galaxy) `customer-galaxy` | Pro, Arc Pro license | 2,400 accounts as a drifting galaxy that spirals into clusters by plan, region or health. | Accounts drift, then spiral into clusters with spring physics when grouping changes; flying to a cluster eases the camera. | - | **Skip** |
| 297 | [Semantic zoom](https://uiarc.dev/components/blocks/semantic-zoom) `semantic-zoom` | Pro, Arc Pro license | An infinite-zoom map of a company that reveals teams, projects, tasks and people as you fly in. | The camera flies between levels on eased zooms, and detail fades in as each level gets large enough. | - | **Inspiration** (Architecture canvas, Portfolio): Pro; zoom levels reveal system, service, component |
| 298 | [Layout morph](https://uiarc.dev/components/blocks/layout-morph) `layout-morph` | Pro, Arc Pro license | A 24 card gallery that flies between grid, masonry, list, fan, carousel and a 3D helix. | Cards fly between layouts on springs, staggered outward from the chosen origin. | - | **Skip** |
| 299 | [Exploded view](https://uiarc.dev/components/blocks/exploded-view) `exploded-view` | Pro, Arc Pro license | A scroll driven exploded view where a live phone screen built from five CSS 3D layers lies back, separates in depth with labels that follow each layer, takes each layer into focus, and then reassembles. | One scroll timeline drives everything: the screen tilts back and turns, the layers spread apart in depth, the labels draw their leader lines and fade in bottom to top, then the stack closes... | - | **Skip** |
