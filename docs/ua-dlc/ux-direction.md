<!-- cspell:words Baselayer Baselayer's Chivo -->

# HyperDelivery UI/UX direction

| | |
|---|---|
| Status | Proposal v4 for review, 2026-10-26: a collapsible side nav, a chat-first Home, every project as one workspace with an artifact panel, and HyperDelivery's build stopping at Inception with a handoff. Since 2026-10-27 the UI direction is open to a team vote between three variants (section 3); v4's shell is Variant B, the reference build until the vote closes. Section 6 defers to the design system |
| Scope | Desktop and laptop browsers, 1280 px wide and up; phone layouts are out of scope. Light theme only; dark is out of scope for now. Teams means Teams on the desktop |
| Builds on | [docs/design/](../design/README.md): personas, principles, audit and patterns. This document says what changes and why |
| Design system | [design-system.md](design-system.md), "HyperDelivery on Baselayer": tokens, type, space, shape, the app shell, component specs and icons. It is the visual source of truth; where the two disagree on a visual value, it wins |
| Concept screens | [HyperDelivery concepts canvas](https://claude.ai/artifact/BUcEKzAz1CXa27EY398sAF) (private until shared), with a standalone copy in the repo under `docs/ua-dlc/site/concepts/`, on five pages (the fifth, North Star, holds items 21 to 24 below): Compare and Vote (one board), A · Top Bar and C · Guided Path (seven screens each), and B · Side Nav and Chat, which holds the 22 artboards described here in rows: Final MVP, Enterprise, Help and the design system. On page B, Home (`Main.dc.html`) and New project (`Start.dc.html`) are the reference boards: every product board copies their side nav, top bar and project workspace. Nineteen carry product copy only and three are design-system galleries; the reasoning lives here. Every name, project and number on the canvas is invented to show the design; none is a measured result |
| Polished Variant B | Seven screens in `docs/ua-dlc/site/variant-b/`, the owner's preferred direction polished to the design system (the vote stays open), and the source of the Figma file [HyperDelivery · Variant B](https://www.figma.com/design/TvkJQitUv5BjF9YmgTMGut) |
| Companions | [enterprise-plan.md](enterprise-plan.md), [operating-model.md](operating-model.md) (the line, inputs and outputs per step, roles, notifications, glossary), [platform-architecture.md](platform-architecture.md) (orchestrator and specialists) |
| Research | [ui-ux-references.md](research/ui-ux-references.md), [chips-tables-diagrams.md](research/chips-tables-diagrams.md), [logo-assets.md](research/logo-assets.md), [uiarc-inventory.md](research/uiarc-inventory.md), [baselayer-for-hyperdelivery.md](research/baselayer-for-hyperdelivery.md), [ai-app-layouts.md](research/ai-app-layouts.md), [figma-libraries.md](research/figma-libraries.md) |

## 1. The change in one paragraph

Today's console is built around the factory: a named crew of four agents on every turn, tab and
button, and an eight-step line in the top bar (four agent stations, three gates and Done) as the
main navigation. It is carefully made, accessible and themed, but early users told us they do not
care which agent is doing what. They care about three things: **what is happening with my idea,
what do you need from me, and can I see it working.** The running prototype, the thing they
actually want, is the least visible element today: a 12px link that appears only if a local
preview happened to start. This direction turns the console around. The **outcome** is the
subject of every screen, the **decision** is the loudest element, and the machinery is one click
away for anyone permitted to see it.

Version 3 adds three things the owner asked for after the first concept review:

- **One assistant that delegates.** An orchestrator owns the conversation and delegates Snowflake
  work to Cortex Code, building to a sandboxed coding agent, and heavy reading to a resource reader.
  People see one voice; each delegation appears as a one-line tool call with the system's real logo
  and only what came back.
- **Color with meaning.** The v2 screens were too gray. Color now comes from what is real: brand
  marks in full color on chips, each person's avatar fill, a system's brand hue on its data series,
  and agent hues in the detail layers, while red keeps its single meaning
  ([design-system.md section 3](design-system.md#3-color)).
- **Point, don't upload.** A project can start from nothing, from a Jira ticket, or from links to a
  Teams recording, a OneDrive folder or a Confluence page. HyperDelivery reads them as the person
  who pointed, indexes them per project, and shows what it knows and where it learned it.

Version 4, on October 26, answers the owner's second review: HyperDelivery has to be as simple for
a business user as ChatGPT, Claude Desktop or Gemini, or people will try it once and go elsewhere.
It changes four things:

- **A side nav.** The product areas leave the top bar for a collapsible left side nav: New
  Project, Search, Home, Inbox, Projects and Library, the recent projects with their status marks,
  the role-gated Portfolio and Admin, and the account and workspace at the bottom. The top bar
  keeps only the page name or breadcrumb, the page's own actions, and Help behind the "?".
- **A chat-first Home.** Home is one question, "What Do You Want to Make?", over one composer that
  points at Teams, OneDrive, SharePoint, Confluence, Jira and Snowflake, then what waits on you and
  the projects to pick up. The separate Start page and its tabs are gone, and so are feed and
  showcase cards such as "Shipped Across UA This Week", which held a column of whitespace open
  under it.
- **One workspace per project.** Every project is the conversation on the left and an artifact
  panel on the right, the way Claude shows artifacts and ChatGPT shows a canvas: the brief, the
  mockup, the plan, the prototype, its data, its sources and its decisions, each a tab that appears
  once it exists. Approvals arrive as cards in the conversation and are signed in the panel beside
  the evidence. Confirm What We Heard and the approval screen are now views of the workspace, not
  pages of their own.
- **The stop at Inception.** UA's agreed definition gives each phase one output: Ideation a visual
  mockup, Inception a prototype (at most on a hosted sandbox with dev data), Construction a
  production-ready version on production data connections. HyperDelivery runs Ideation and
  Inception and ends every project at approval 3 with a handoff package, so the line reads
  Discover, Plan, Prototype, Handoff. How Construction is done, AI-driven or AI-assisted with
  engineers, is a named decision after the handoff, made by the Construction owner; it is not a
  fourth approval ([operating-model.md section 1](operating-model.md#1-the-line)).

Kept from the earlier October 26 revision: Help sits behind a "?" in the top bar, Inbox and Projects
have their own screens, and advice on when to use HyperDelivery rather than another tool stays out
of the product; it is a planning question, answered by the complexity and use-case matrices in
[enterprise-plan.md section 5](enterprise-plan.md#5-why-hyperdelivery-and-not-a-generic-tool). The
patterns behind version 4 are in [ai-app-layouts.md](research/ai-app-layouts.md) (how the leading
AI work apps lay out their UI) and [figma-libraries.md](research/figma-libraries.md) (what UA's
Baselayer libraries already hold: a side nav, preview sections with a compact empty state, the
three-dot loader).

## 2. Principles

These nine are this direction's full set. In [principles.md](../design/principles.md) they
replace 1 ("Plain first, character second"), 6 ("Detail on demand") and 9 ("Brand lives in the
details"), restate 2, 3 and 8, and leave 4 (one place answers "what needs me?"), 5 (every state is
designed) and 7 (everything has an address) unchanged.

1. **Outcome first.** Every screen leads with the user's thing: the idea, the brief and its mockup,
   the plan, the prototype. Copy follows the same rule: "Your plan is ready to approve", not "Coach
   is done".
2. **One voice.** HyperDelivery speaks as one assistant, directly, and honest about uncertainty
   (section 10). It uses the first person only inside its own messages; status lines, chips and
   labels never say "I". In Layer 1 a delegation reads as what was done ("Checked margin
   per door in Snowflake"), with the system's logo, as one row in the conversation. Agents, models
   and specialists are attribution in Layers 2 and 3 and the audit trail.
3. **Red means you.** UA red has one meaning: *something is waiting on you*. It is always a solid
   shape with a label, never color alone, and it appears in the same four places: the Inbox count,
   the project's mark in Recent and its row, the line's notch, and the card that asks. Charts and
   buttons never use it, and a system failure uses it only when the viewer must decide what happens
   next; an error in a field the viewer is filling in is red because fixing it waits on them (HD-R1
   in [design-system.md section 3.3](design-system.md#33-the-red-rule-hd-r1)).
4. **Evidence over documents.** Approvers see the prototype doing each acceptance criterion, beside
   the conversation, not a 20-page document. On dev data the evidence says what it can prove:
   "Definitions match the golden report; numbers not checked on dev data (checked in
   Construction)". If something blocks approval, the button stays visible but inactive, with the
   reason and a jump to the blocker. **No bulk approve, ever.**
5. **Teams is where you are asked; signing happens where the evidence is.** A question is one item
   wherever it shows: answered inside the Teams card, the Inbox row or the conversation, it clears in
   all three. Approval cards open the project's artifact panel on the evidence, where the signature
   happens.
6. **Show, don't name.** Business users cannot ask for a pattern they cannot name. Offer visual
   choices (layout, density, chart type, tone) and carry the choice into the mockup, the plan and
   the gate.
7. **Calm by default, detail on demand.** Every block earns its place: no feed, showcase or KPI
   cards, and a section with nothing to show is hidden or one quiet line, never a column held open.
   Entra roles decide what you *may* see. Three layers of detail (outcome and progress; decisions,
   delegations and rationale; traces and cost) are opened per element by anyone permitted. One
   personal preference, "Show Technical Detail" in the account menu, starts from your role, can be
   changed, and replaces today's Simple and Detailed modes.
8. **Motion encodes state change.** Arrival, departure, progress, and cause and effect. Motion
   stops when work stops.
9. **UA precision, color with meaning.** Ink first, Baselayer's type scale and 8 px rhythm, dense
   where data lives, generous where decisions live. Color is spent only where it carries
   information: a brand mark names the system a step touched, a person's fill names who decided or
   was waited on, an agent hue tells a Layer 2 or 3 reader who held the work, a chart encodes data.
   The shell follows the convention people already know from ChatGPT, Claude and Gemini (side nav,
   composer, artifact panel); the identity comes from the line and its gates.

## 3. Information architecture

### Three UI directions for the team vote

On October 27 the owner put the UI direction to a team vote instead of assuming one. The content is
the same in all three variants: the projects, people, dates, waits, the line and its three approvals,
and every fact on screen. Only the UI pattern differs, and each variant is drawn at its best, none
made weak to flatter another. The decision stays open until the vote closes; until then Variant B is
the reference build, the rest of this section and section 4 describe it, and
[design-system.md section 7](design-system.md#7-the-app-shell) documents its shell.

| Variant | What it is | Feels like | Best for |
|---|---|---|---|
| **A · Top Bar** ("the app") | The round 7 header design, rebuilt with today's content and rules and without its showcase cards. A 56 px top bar holds the UA lockup, text tabs (Home, Projects, Inbox with its red count, Library), search, "Start a Project", Help and the avatar. Pages are dashboards and lists; a project is a page with a header, the line, tabs for its artifacts (Brief, Mockup, Plan, Prototype, Data, Sources, Decisions) and the conversation in a panel at the right | Jira, ServiceNow, SharePoint | People in it every day who track several projects at once: owners, approvers and leads |
| **B · Side Nav and Chat** ("the assistant") | Today's boards, unchanged: a 248 px side nav with Recent, a chat-first Home, and each project as a conversation beside an artifact panel | ChatGPT, Claude, Copilot | People who start by describing a need and like to talk the work through |
| **C · Guided Path** ("the guide") | The UA-DLC line is the navigation. A 64 px top bar with no side nav; inside a project the bar shows its four stations as a compact path. Home is one large "Next for You" card for the oldest thing waiting on the viewer, "Start Something New" and each project as a journey row. Projects is a board with a column per station and one for Handed Off; a new project, an approval and the Construction decision are step-by-step flows; the assistant is on call in a drawer | TurboTax, DocuSign | People who come in now and then: a business owner who signs a few approvals a month, or a first-time requester |

**The screens drawn.** Each variant draws the same seven screens, at the same positions on its canvas
page, so switching pages swaps the UI in place: Home, Inbox, Projects (viewer Maya Chen), New project
(Priya Nair), Project (the SKU productivity workbench at Plan, waiting on Maya), Approval (Maya signs
the Wholesale sell-through tracker's working prototype, last of three) and Handoff (Kim Patel's
Construction decision for the Activation scorecard). B's are `Main`, `Inbox`, `Projects`, `Start`,
`Project`, `Gate` and `Graduation`; A's and C's carry the same names with an `A_` or `C_` prefix. A
destination a variant does not draw (Library, Portfolio, Admin, Activity, a project with no board) is
a real control marked "Drawn in Variant B", and no link crosses between variants.

**Pros and cons**, as the Compare and Vote board puts them for business teammates:

- **A · Top Bar.** Pros: familiar to anyone who uses UA's enterprise tools; shows a lot at once, with
  lists, tables and tabs across many projects; every page has a fixed place to bookmark and share;
  Library, Portfolio and Admin fit as more tabs. Cons: more to learn up front; the AI sits in a side
  panel and feels like one feature among many; busy for someone who signs one thing a month; the top
  bar gets crowded as screens are added.
- **B · Side Nav and Chat.** Pros: works like the AI tools people already use; starting is as easy as
  typing what you need; the conversation and what it made share one screen; recent projects are one
  click away, each marked when it waits on you. Cons: a blank box can stall people who don't know
  what to ask; decisions can get lost in a long conversation; two panes side by side leave less room
  for big tables and the prototype; it looks like Copilot, so people may ask why not just use Copilot.
- **C · Guided Path.** Pros: nothing to learn, because the next step is always obvious; signing feels
  deliberate (see what changed, try it, check the evidence, then sign); projects sit in a column for
  their station, so the board reads like the line; what waits on you leads Home, one item at a time.
  Cons: slower for people who use it every day; the AI sits in a drawer, so it is less visible and can
  feel less smart; jumping between projects or steps takes more clicks; it is the most to build, since
  each station needs its own guided flow.

| What matters | A · Top Bar | B · Side Nav and Chat | C · Guided Path |
|---|---|---|---|
| Learn it in five minutes | Mostly: familiar, but many tabs | Yes: type, or pick a starter | Yes: one step at a time |
| Fast for people who use it daily | Yes: lists, tabs and search | Mostly: Recent is one click; long threads scroll | Slower: steps add clicks |
| Always shows what waits on you | Yes: Needs You list, Inbox count | Yes: Inbox count, marks in Recent | Yes: one card, oldest first |
| Makes the next step obvious | Mostly: Needs You list, a button per row | Mostly: Waiting on You, approval cards | Yes: one card, one button |
| Signing feels deliberate | Mostly: decision card above the evidence | Mostly: decision bar under the evidence | Yes: what changed, try it, evidence, sign |
| Keeps the AI visible and useful | Partly: a panel on project pages | Yes: the conversation leads | Less: on call in a drawer |
| Fits Microsoft 365 habits | Mostly: like a SharePoint site | Yes: like Teams and Copilot | Partly: closer to e-signing |
| Room for Enterprise screens (Library, Portfolio, Admin) | Yes: a tab each | Yes: side nav rows, already drawn | Partly: competes with the path |
| Effort to build | Least: keeps the console's current top bar (`shell/TopBar.tsx`) | Moderate: specified; replaces the top bar | Most: a guided flow per station |

**The same in all three:** the line (Discover, Plan, Prototype, Handoff) and its three approvals
signed by name; red only for what waits on the viewer; each project's brief, mockup, plan and
prototype with its data, sources and decisions; questions and approvals in Teams cards, with signing
where the evidence is; and the same facts on every screen (Maya's approval of The Plan has waited
1d 4h in all three).

**How the vote works.** The concept canvas has four voting pages (its fifth page, North Star, is not part of the vote): **Compare and Vote** (`Compare.dc.html`,
the three variants side by side, opened first), **A · Top Bar**, **B · Side Nav and Chat** and
**C · Guided Path**. Teammates click through pages A, B and C, then vote on the
[vote page](https://claude.ai/artifact/CWBVHp8AvGL9YYp9xP2pVT) (private until the owner shares it; teammates need Contributor access to vote, and
anyone it is shared with can read the results). Each person picks one variant, can mark the others
they could live with, and says why; results show once you have voted, and the owner can close the
vote. The Compare board carries the same link. The result is logged in
[decisions.md](../decisions.md) ("The UI direction goes to a team vote between three variants"), and
if A or C wins, this section, section 4 and the design system's shell are rewritten for it.

### Navigation (Variant B, the reference build)

One navigation surface, on the left, as in ChatGPT, Claude and Gemini; every page then starts with
its own content. Baselayer's own account navigation is the UA precedent: a vertical text list whose
selection is weight alone. The side nav's anatomy and sizes are in
[design-system.md section 7](design-system.md#7-the-app-shell); the research is in
[ai-app-layouts.md](research/ai-app-layouts.md) section 5 and
[figma-libraries.md](research/figma-libraries.md) section 3.

| In the side nav | For | What it does | Arrives in |
|---|---|---|---|
| **New Project** | Everyone who may start a project | An outlined pill at the top of the nav. Opens Home with the composer focused, like a new chat (⌘⇧O) | Final MVP |
| **Search** | Everyone | Projects, facts, people and actions in one palette (⌘K). There is no search box in the top bar | Final MVP |
| **Home** | Everyone | The composer, what waits on you, and the projects to pick up (section 4, item 1) | Final MVP |
| **Inbox** | Everyone | Everything waiting on me: approvals, questions, confirmations, definition disputes, reviews and Construction decisions, oldest first, filtered by kind, with what I finished in the last 7 days folded underneath. Its count is red and appears only when something waits on the viewer. "Decisions" is reserved for decision records inside a project (Open or Settled) | Final MVP |
| **Projects** | Members | Every project the viewer can see, as a gallery of project cards (the default) or a table (owner, target tier, the mini line, who it waits on, last activity, elapsed time, cost and status), with Search and filter chips for All, Waiting on Me, Building, Handed Off and Needs Attention | Final MVP |
| **Library** | Everyone | *What UA Already Knows*: confirmed facts with sources, golden-path templates, and Recently Handed Off projects with their architecture, the one place finished work is shown off. Tagged "Enterprise" in the nav until it ships | Enterprise |
| **Recent** | Everyone with projects | The five most recent projects, one line each, with the line's own status mark: a red notch waits on you, an ink outline notch waits on someone else, the three-dot loader is work running, an ink notch is an accepted prototype, a dashed gray notch is a draft. "All Projects" ends the list | Final MVP |
| **Portfolio** | Sponsors and leads, by Entra group | A line board of projects by workspace and target tier, with split times, spend by system, Construction decisions and their mode, the use cases tried and how many requesters came back for a second project | Enterprise |
| **Admin** | Platform Admin and Governance Admin roles | Workspaces, roles from Entra groups, approved data, the prototype contract and target tiers, connectors, policies, budgets, model allowlist, audit export | Enterprise |
| **Account** | Everyone | At the bottom: avatar, name and workspace. Its menu switches workspace, sets "Show Technical Detail" and signs out | Final MVP |

Portfolio and Admin are absent, not disabled, for everyone else, so a business owner sees one short
list and their own recent projects. The nav collapses to a 64 px rail of icons with tooltips (⌘B)
that keeps the red Inbox count. The **top bar** is slim: the page name or a breadcrumb ("Projects /
SKU productivity workbench") on the left, the page's own actions on the right, then the "?" Help
button. It has no search box, no "Start a Project", no workspace switcher and no avatar. The
**trace** and a project's **architecture** are not destinations; they open from a project's More
menu, a decision or a line in the conversation.

**Where each persona starts:**

| Persona | First screen | Inbox item types |
|---|---|---|
| Requester | Home | Questions back to them; approval 1 when they sign it alone (Low risk) |
| Business owner | Inbox | Approvals, changes since approval, escalations |
| Contributor | A Teams card | Questions; facts attributed to them to confirm |
| Analyst | A project's Prototype tab | Evidence and definition checks to review |
| Data owner | Inbox | Data access, dev-data and envelope requests |
| Data steward | Inbox | Definition disputes, unratified metrics, catalog proposals |
| Engineering reviewer | Inbox | Co-signs for T2 and T3 targets, architecture reviews |
| Construction owner | Inbox | Construction decisions, handoff packages |
| Policy owner | Admin | Policy changes and learned rules awaiting signature |
| Platform engineer | A project's Trace (More) | Failed delegations, budget alerts, connector health |
| Sponsor | Portfolio | Weekly digest |

### Help, behind the "?"

Help is not an area and not part of the Library. A round "?" button at the right end of the top
bar opens the same small menu on every screen:

| Item | What it opens |
|---|---|
| How Work Moves | The Lifecycle map (section 4, item 18) |
| How HyperDelivery Is Built | HyperDelivery's own platform architecture, by phase (section 4, item 19) |
| Keyboard Shortcuts | The short list of keys, opened in place: ⌘K Search, ⌘⇧O New Project, ⌘B to hide or show the sidebar, @ to mention a person or source, ⌘/ for this list, Esc to close |
| What's New | The last three changes, dated, opened in place. When the side nav ships, the first entry says where things moved, under the same names |
| Ask the Platform Team | The platform team's Teams channel |

The two help pages carry the breadcrumb "Help / How Work Moves" and "Help / How HyperDelivery Is
Built", show no current item in the side nav, and keep the "?" selected; the menu is the one way
between them. The menu's anatomy is in
[design-system.md section 9.23](design-system.md#923-help-menu-and-account-menu).

### The project workspace

Every project is one workspace, the same at every stage: the line in a strip under the top bar,
then the **conversation** on the left (440 px at 1440) and the **artifact panel** on the right (the
rest of the width, a white panel on the gray canvas). What a project makes is a tab in the panel;
what happens is a message in the conversation. There is no third pane. The line doubles as the
table of contents: selecting a stretch or a notch opens its artifact or its decision. Phase names
never appear in Layer 1; the stretches follow the [unified line](operating-model.md#1-the-line).
"Project workspace" names this layout in the docs only; in the product, "workspace" means the
tenancy unit, such as Merchandising.

**The conversation** carries Layer 1, newest at the bottom:

- the requester's and teammates' messages, right-aligned in gray bubbles, with the chips of what
  they pointed at;
- HyperDelivery's turns under the product mark, with each delegation as a collapsed tool-call row:
  the system's logo, what was done and what came back (section 8);
- **artifact cards** (icon, name, version line, chevron) that open the artifact in the panel;
- **question cards** with answer chips, "Not Me, Suggest Who" and "I Don't Know", answered in
  place; the follow-on choices after a first message arrive this way (what kind of project, who
  should weigh in, how thorough with its time cost), never as a long form;
- **approval cards**: the red notch, "Your Approval: The Plan", who else signs, the wait, and
  "Review and Sign", which opens the decision bar in the panel;
- system notes as small gray lines, a 14 px check for a signature and a clock for a wait ("Priya,
  Luis and you signed what we're building, Oct 21. 5d 2h."; "Asked Dana Ortiz in Teams how
  markdowns count. Waiting on Dana, 4m.");
- a failure that needs the viewer, as a card with one action (section 4, item 11);
- "Since You Left" at the top on return, and one **progress row** above the composer while work
  runs ("Building the prototype: 3 of 8 pieces, about 2 hours left", Pause);
- the composer, pinned at the bottom ("Reply, or point at another file"), with suggestion chips
  above it.

**The artifact panel** holds every made thing as a tab that appears only once the thing exists. A
future artifact shows grayed, with a tooltip saying when it appears ("The plan is drafted after
Maya approves what we're building"). Each tab has a header with its title, a version line,
Versions and Open Full Screen. When a decision waits on the viewer, the **decision bar** sits at
the bottom of the panel: the attestation checkbox, the named primary ("Sign and Accept", inactive
until the box is checked), Send Back and Ask Someone. One primary button per screen.

| Tab | Holds | Appears |
|---|---|---|
| Brief | The living document (problem, who it is for, what good looks like, scope, the data it will use), each statement with its source chip, and open questions in place. When Confluence is the project's collaborative space, an "Open in Confluence" link sits in the header and comments made there come back as threads | From the first message |
| Mockup | Ideation's output: the starting looks the requester chose between and the mockup drawn from the choice, captioned as shape only with invented numbers. Signed with the Brief at approval 1 | When the first look is drawn |
| Plan | Requirements, stories and acceptance criteria, the tech design summary, test plan and tickets; the refined, clickable mock with What You'll Get, What It Skips and Which Data It Uses; the target tier and the cost | After approval 1 |
| Prototype | The sandbox preview with its provenance strip ("Sandbox, dev data"), its version, Open in New Tab and point-and-say notes; at approval 3, evidence per acceptance criterion | When the first piece builds |
| Data | The data map: objects, certified definitions, query ids and who ratified them; never rows | When data is discovered |
| Sources | What the project points at, as a data table: logo, title, kind, owner, pointed by, last read, chunks indexed and state (Indexed, Reading, Stale, Snapshot, Needs Access, Access Lost, Blocked by a Microsoft 365 Setting). Beside it, **What HyperDelivery Knows** (today's Memory): one-sentence facts with source chips ("From the Teams meeting, 14:02", "From Confluence revision 12", "From MERCH-1182, comment by Jordan"), a status (Proposed, Confirmed, Certified), who confirmed it, and Edit or Forget in place; nothing proposed is treated as true. "Test a Question" shows which passages would ground an answer. Readers see only what they can open at the source; a row they cannot open shows "You don't have access" | From the first pointed link |
| Decisions | Decision records (Open, Settled), the signed approvals with split times, and "Changes Since Approval" | From the first decision |
| More | Timeline (where it stands and who held the work: Layer 2 lanes and the decision timeline by person, with the approvals named on its rail), Architecture (the project's own solution) and Trace (Layer 3) | Timeline always; Architecture from Tech Design; Trace by role or with "Show Technical Detail" |

What the panel opens on, by stretch:

- **Discover (before approval 1):** the Brief and the Mockup, with Sources. The decision bar reads
  "Approval 1: What We're Building" and sends both to the business owner, who signs them together.
- **Plan (before approval 2):** the Plan, opened on the clickable mock. The project's architecture
  sits under More.
- **Prototype (before approval 3):** the progress row in the conversation and the Prototype tab as
  pieces land; at approval 3, the preview with its evidence per criterion.
- **Handoff (after approval 3):** the handoff package, the demo and the Construction decision
  (section 4, item 17). The prototype stays open to members and named testers until it expires.

At 1280 px, the narrowest supported width, the side nav can fold to its rail, and Open Full Screen
gives the artifact the whole width with the conversation one click away, so the prototype is never
squeezed into a third of the screen. Engine and model names, query ids and schema paths appear only
with "Show Technical Detail" on.

### The line: HyperDelivery's signature element

Generic AI tools look alike because they share a kit, and the shell above deliberately follows that
kit. The element only HyperDelivery has is the line and its gates.

- **Geometry:** a 2px ink line. Gates are 12 px square notches, not dots. Done segments are 2px
  solid, the current segment is 4px with a shimmer, future segments are dashed. The component spec
  is in [design-system.md section 9.21](design-system.md#921-the-line).
- **Split times:** under each signed gate, the elapsed time since the previous gate and who signed,
  in Regular tabular figures with lowercase units, under the Bold approval label: a first name for
  one signer ("4d 2h, Maya"), a count for several ("3d 2h, 3 signers"), never a string of
  initials, never condensed or uppercase. They put the plan's headline measure, idea to accepted
  prototype, on every project.
- **Two readings:** in Layer 1 the four stretches carry plain words: **Discover** (intake,
  research, data discovery, the brief and the mockup) up to approval 1, **Plan** (requirements,
  stories, tech design, test plan, tickets) up to approval 2, **Prototype** (built in the sandbox on
  dev data) up to approval 3, then **Handoff** (the package, the demo and the Construction
  decision), with no notch after it. The three approvals are named by their decision ("What We're
  Building", "The Plan", "The Working Prototype"), never by number. HyperDelivery's line ends at
  Handoff. Where a screen shows what comes after it (the Lifecycle map, the Handoff screen, a
  project's architecture), Construction and Operations are dashed gray and marked "Outside
  HyperDelivery" or "After Handoff"; never "Live", never "Graduate". The Lifecycle map in Layer 2
  shows the same line with its phases and every step (section 4, item 18).
- **States:**

| State | Mark |
|---|---|
| Upcoming | Outline notch, dashed segment |
| In progress | Solid segment with shimmer |
| Waiting on someone else | Ink outline notch with the person and the wait ("Dana, 1d") |
| Waiting two business days or more | The same notch with a Bold age and a clock glyph, never amber |
| Waiting on you | Solid red notch with no halo, labeled "Your Approval: The Plan" |
| Partly co-signed | Half-filled notch, "1 of 2" |
| Signed | Ink notch with split time |
| Sent back | The segment redraws with "Round 2"; the earlier signature is struck through and kept |
| Changes since approval | Signed notch with a small ink dot and a count ("3 changes") |
| Handed off | The line ends at Handoff, solid; a short dashed gray stub labeled "Construction", with "After Handoff" or "Outside HyperDelivery" under it. The Construction decision and its mode show in the status line, not on the stub |

- **Four scales:** the workspace's line strip (full width), a mini line with 8 px notches on cards,
  rows and the Portfolio, the Teams card header (rendered as an image), and the three-notch product
  mark as the app icon. The side nav's Recent list uses the same marks, one per project.

## 4. Key screens

All are on the [concept canvas](https://claude.ai/artifact/BUcEKzAz1CXa27EY398sAF). Home and New
project are the reference boards: every product board copies their side nav, top bar and, for a
project, the line strip and the split. What each step of the line takes in and produces, which
agent owns it, where its artifact is stored and on which of these screens it appears are in
operating-model.md, under
[Inputs and outputs, step by step](operating-model.md#inputs-and-outputs-step-by-step) and
[How artifacts are shown](operating-model.md#how-artifacts-are-shown); this list does not repeat
them. Each screen arrives in the Final MVP unless it is marked Enterprise, and that includes the
Handoff screen and the two Help pages behind the "?"; the canvas titles mark the Enterprise screens
the same way. Every screen has one primary action at most, copy that explains the screen to the
person looking at it is cut, and no block holds open space it cannot fill.

1. **Home.** The page's one question, "What Do You Want to Make?", over one composer with a calm
   placeholder ("Describe the problem, who has it, and what would help."). The "+" ("Point at What
   You Have") adds a Teams recording, a OneDrive or SharePoint file, a Confluence page, a Jira
   ticket, a Snowflake report or an uploaded file, each as a chip with its logo and state, read with
   the person's own access; nothing is copied out of Snowflake. The workspace picker and the start
   arrow, the screen's one primary, sit in the composer's footer, and the arrow stays inactive until
   there are words or a chip. Four starters below fill the composer and never submit: Track a Weekly
   Measure, Spreadsheet to App, Compare Scenarios, From a Jira Ticket. **Waiting on You**: up to
   four Inbox rows, oldest first ("2 approvals, 1 question and 1 confirmation"), each with a red
   marker, the decision, the project, what it unblocks and its wait under a "Waiting" label, and
   "Open Inbox (4)". **Pick Up Where You Left Off**: three project cards, each with a thumbnail of
   its latest mockup or prototype, the mini line and one status line (with the three-dot loader
   while work runs), and "All 7 Projects". The empty state is one line: "Nothing waiting on you. New
   approvals and questions also arrive in Teams." No greeting banner, no KPI tiles, no feed or
   showcase card; recently handed-off work lives in the Library.
2. **Inbox.** A list and a detail, like a mail client. The list holds what Home shows, all of it,
   oldest first ("4, oldest first"), under filter chips with counts (All, Approvals, Questions,
   Confirmations); each row shows the title, the project and what it unblocks, the kind and the
   age, with no action on the row. The selected item opens on the right: an approval shows what
   you're signing, where it stands on the line and who signs, in order, and ends in "Review and
   Sign", the page's one primary, which opens the project's workspace on the decision. A question
   is answered there with its answer chips, or passed on with "Not Me, Suggest Who". A Construction
   owner's Construction decisions arrive here too. A closed "Done in the Last 7 Days" row lists
   what the viewer signed, confirmed, answered or passed on, each with its project. Approver
   assignment, reassignment and reminders arrive with the Teams cards.
3. **Projects.** Every project the viewer can see, as a gallery of project cards by default (the
   latest mockup or prototype as the thumbnail, the mini line, one status line and who it waits
   on) or, with the Gallery and Table toggle, as a table: the owner's avatar and the project name
   as the link, the target tier, the mini line, who it waits on, last activity, elapsed time, cost
   and status ("Handed Off" once accepted, with the Construction mode once it is decided). "Search
   projects" (with the `/` key) and five filter chips with counts (All, Waiting on Me, Building,
   Handed Off, Needs Attention) open the page, and the footer reads "7 projects, 3 waiting on you".
   No checkboxes and no row menus; below 1440 px the table's Cost and Elapsed columns drop, so
   Status stays in view without a sideways scroll.
4. **First run.** Nadia Flores, a Merchandise Planner, on her first visit: Home's question and
   composer with one coach mark ("Start here: describe the problem, or paste a Teams, OneDrive,
   Confluence or Jira link", with "Got It"); four starters as cards, each naming the function and
   the source it starts from (Track a Weekly Measure, Flag Late Vendor Invoices, Watch Late
   Purchase Orders, Plan Weekly Labor by Store); and two links, "See How It Works (2 min)" for the
   walkthrough and "Browse Projects". The side nav hides Recent until there is a project, and the
   Inbox shows no count. No showcase of teammates' projects: recently handed-off work lives in the
   Library.
5. **New project: the first conversation (Discover).** What the start arrow opens: the new project's
   workspace, breadcrumb "Projects / `<Project>`" tagged Draft, with the line at Discover. The
   request sits at the top as the requester's message, with the chips of what was pointed at.
   HyperDelivery's first turn shows what it read as tool rows (the Jira ticket and its linked pages;
   the Teams recording, read as the person who attended; the certified Snowflake view, as layout and
   counts only), then the Brief and three starting looks as artifact cards. Three choices follow in
   one question card: what kind of project (Build Something New, Change Something That Exists, Turn
   a Report Into an App, Fix Something), who should weigh in (suggested from catalog owner tags and
   the ticket, each with Invite), and how thorough: Light, Standard and Thorough, "Ready in 3 days",
   "Ready in 2 weeks" and "Ready in 4 weeks", with the requester's time under them ("Your time:
   about 3 hours, for answers and reviews."). A question sent to someone else shows as a system note
   with its wait. The panel opens on the Brief, each statement with its source chip and the open
   question in place; the Mockup tab offers the starting looks (Workbench Table, Scorecard, List and
   Detail) and draws the chosen one; Sources lists what was read; Plan and Prototype show grayed
   with when they appear. The decision bar reads "Approval 1: What We're Building", and "Send for
   Approval" stays inactive until the kind of project is chosen; the requester, Luis and Maya sign
   the brief and the mockup together, so once sent the note reads "Luis and Maya sign next", and
   Undo is offered. Pasting a Jira key or URL into Home's composer unrolls the ticket into a card
   read with the person's own access (summary, description, linked Confluence pages, attachments and
   comments), and the Brief attributes every statement to the ticket, a comment or a linked page.
6. **Project workspace, by stage.** One project's workspace at each stretch of the line (section
   3): what the conversation carries and which tab the panel opens on, from Discover through
   Handoff. At Plan, the approval card reads "Your Approval: The Plan", second of three signers,
   waiting 1d 4h, and "Review and Sign" opens the decision bar under the Plan tab; at Prototype,
   the progress row counts pieces while the Prototype tab fills.
7. **Confirm what we heard (a workspace view).** Opened from its Inbox row or its card in the
   conversation, inside the Sources tab: captured facts to confirm or correct, including statements
   attributed to the viewer, from the working session, the Teams recording and ingested Confluence
   comments (each with its mark, author, and resolved or open state). "Finish Review" stays
   inactive, with how many are left, until every item is handled. A definition dispute offers the
   level certified today as the recommended choice, with both positions one click away.
8. **Approve the working prototype (a workspace view).** The approval card opens the Prototype
   tab's decision view: breadcrumb "Inbox / `<Project>`" when reached from the Inbox, the decision
   label above the title, and at most three meta pairs; evidence per criterion, with "Not verified:
   check this yourself in the preview" where evidence is missing and advice from checks as the last
   row; the definitions check, which on dev data reads "Definitions match the golden report;
   numbers not checked on dev data"; open items that block approval; what it skips (required at
   approval 3); who signs, in order, with the viewer as "You, now"; the decision bar with a short
   attestation, "Sign and Accept" (the same decision bar as the project workspace), Send Back, Ask
   Someone and Reassign; the pending signature; the signed record as a timing slip; and "3 Changes
   Since Approval: Review Only the Changes". Once the last signer signs, the handoff files the Jira
   epic and its issues (WHSL-430, 7 issues, for the Wholesale sell-through tracker) and a Package
   tab lists the handoff package's 10 items. The same view serves approval 1, with the mockup beside
   the Brief, and approval 2, with the plan's clickable mock.
9. **Activity: Timeline and Trace, full view.** A project's More > Timeline and More > Trace opened
   at full width. Layer 1 narration lives in the conversation; Layer 2 holds lanes with
   delegations, "Who Held the Work" (the decision timeline by person, its approvals named on the
   rail) and a side-effect ledger; Layer 3 is the trace,
   with playback. Specified in section 8. Data-bearing steps show metadata only. A failure that
   needs the viewer sits as a band at the top of the event list, with one action.
10. **Architecture.** The interactive system diagram for multi-system work. Under a project's More
    menu it shows **that project's own solution** (its users, app, data, upstream feeds, outputs and
    how it is built and run), drafted at Tech Design and signed with the plan, in two parts: the
    prototype (sandbox, dev data) and the production target, dashed, because Construction builds
    it. HyperDelivery stays outside the diagram as the builder. HyperDelivery's own platform
    architecture is a help page (item 19).
11. **Needs attention.** Each failure shown inside the failed block, and as a card in its project's
    conversation, with a "last good at" stamp, plain copy and one action: a stalled build, a
    Snowflake check that hit its credit cap, a build failing its second check round, a pointed
    Confluence page the project lost access to, a Teams meeting with transcripts turned off, a
    policy block, a loop budget reached, a preview waking or expired, and, once budgets are
    enforced in Enterprise, a workspace budget reached. The Needs Attention filter in Projects
    gathers them. Codes, test names and repositories sit behind "Open Trace". None uses red unless
    the failure waits on the viewer to decide what happens next (HD-R1).
12. **Teams.** A question card answered in place, headed "HyperDelivery, an AI assistant, asking for"
    the requester, with "Question 1 of 2", why you, what was already checked, a deadline tied to the
    next approval, "Not Me, Suggest Who" and "I Don't Know", and Pause Questions and Why Am I Getting
    This? in its footer ([north-star.md section 6](north-star.md#6-questions-to-the-people-who-know)); an
    approval card with the mini line, a short summary and "Review and Sign", which opens the
    project's decision view; the evidence view with a strong sign-in where required; the refreshed
    receipt with an "Open Project" link; and the weekly digest, "This Week Across UA", whose one
    "3 Handed Off" row names the projects handed off that week.
13. **Working session (Enterprise).** Inside a Teams meeting: "Now Asking" (with who should answer)
    and "Captured (Proposed)" in the side panel, the living document on the shared stage, and a
    capture indicator every participant can see: "Notes Only: Not Recording" by default, with a
    named scribe, or "Transcript On, Organizer Consented 14:02". "Confirm What We Heard" links to the
    review after the session. The live "Now Asking" and "Captured (Proposed)" panel depends on
    real-time transcript access for apps, which Microsoft has not shipped (roadmap item RM570651);
    until it is generally available and reviewed, statements arrive after the meeting ends, as on
    the North Star page's "After a linked meeting" board.
14. **Library (Enterprise).** What UA already knows: confirmed facts, each with its source chip, who
    confirmed it, status (certified, canonical, confirmed, or not yet agreed) and reuse count;
    golden paths; and Recently Handed Off projects, the showcase that left Home. Reached from a new
    project, it shows only the facts that apply to the idea ("7 facts apply, 5 agreed") and ends in
    "Start With 6 Facts".
15. **Portfolio (Enterprise).** A line board: one row per project, gates aligned in columns with
    split times, sorted by longest wait; handed-off projects with their Construction decision and
    mode; one comparison against the baseline with its n; the use cases tried and how many
    requesters started a second project.
16. **Admin (Enterprise).** Roles from Entra groups, approved data, the prototype contract (one
    row: members and named testers, dev data, the sandbox, an expiry) with the target tiers beside
    it as a read-only reference, connectors (Atlassian, GitHub, Snowflake, Microsoft Graph, Amazon
    Bedrock, S3) with each tool marked read or write and pausable, budgets including Snowflake, the
    model allowlist with provider marks, an audit log, and a policy change awaiting its policy
    owner's signature, using the same gate pattern.
17. **Handoff: the Construction decision (Final MVP).** The Construction owner's view (the receiving
    engineering lead, deciding with the business owner). What the handoff package holds: the Jira
    epic and issues, AI-DLC context files validated with engineering's validator, the repository,
    the decision chain, the evidence, What It Skips, the mockup and the dev-to-production data map;
    and what Construction must add for the target tier, as a checklist. Then "Your Decision:
    Construction", with three choices: AI-Driven, AI-Assisted With Engineers (with "Rebuild From the
    Plan" under it) and Not Now. The default comes from risk and the target tier and is marked
    Recommended, with its reason; low-risk, read-only work defaults to AI-driven, and sensitive
    data, sign-in or writes to systems of record default to AI-assisted with engineers. "Sign
    Decision" records the choice, which shows in the record rather than on the button. The
    10-business-day window is shown, and the line ends at Handoff with a dashed Construction stub
    marked "Outside HyperDelivery". Engineering's gates on push, merge and release apply in both modes,
    and a pipeline, never a model, deploys. It is a decision record, not a fourth approval.
18. **Lifecycle map ("How Work Moves", a help page).** A Layer 2 process view of the unified line:
    Ideation and Inception with their steps and the three approvals, then the handoff and the
    Construction decision; Construction (engineering's Code, Review, Manual QA, Visual QA and
    Deploy) and Operations are dashed and marked "Outside HyperDelivery". Selecting a step opens its
    inputs and outputs in place: the owning agent (hue and mark), the human involved, whether it is
    a confirmation or an approval, and where people see the result (with a link to the screen).
    Automated is the default and carries no tag. The Mockup step is drafted without waiting on
    anyone and signed with the Brief at approval 1; approval 2 allows the prototype repository,
    pushes, the sandbox, dev-data grants and build spend; Tickets are filed to Jira at the handoff,
    after approval 3. Path and depth controls show which steps run and which compress; steps that
    arrive in Enterprise are dashed and labeled so.
19. **How HyperDelivery Is Built (a help page).** HyperDelivery's own platform architecture on the
    same canvas as item 10, with a Today, MVP and Enterprise control; the plan carries the same
    three phases as diagrams. The MVP view includes the handoff package; Enterprise adds
    HyperDelivery's own production environment and a Construction intake with engineering.
20. **The line.** Every state and the four scales on one artboard, including Handed Off with its
    dashed Construction stub.

**The North Star page** draws four screens from [north-star.md](north-star.md), in Variant B's shell.
They are Enterprise rollout or later, and the canvas titles say so:

21. **After a linked meeting (Enterprise).** The project workspace the afternoon after "Line review
    prep": the assistant says the meeting ended, what it read (the transcript and the Copilot
    recap) and where each statement went; the Sources tab shows the meeting with who linked it and
    how attendees were told, then each statement by speaker with its transcript time and state:
    confirmed, waiting on the speaker, corrected, sent to the steward because it conflicts with a
    certified definition, not used at the speaker's request, or from AI notes with no transcript
    match and so unused. Loop notes are read only when someone points at them.
22. **A question in Teams (Enterprise).** Dana's 1:1 chat with HyperDelivery: a card that says it is
    an AI asking for Maya, "Question 1 of 2", why Dana, what was already checked, the deadline tied to
    the plan approval, "Not Me (Suggest Who)", and Pause Questions and Why Am I Getting This? in the
    footer; Dana's free-text answer, one clarifying follow-up, a receipt of what was recorded and
    where it goes, and two days later the note that her answer changed the plan.
23. **Approved precedent in the plan (Enterprise).** The Plan tab drafting from three approved specs,
    each with its template, approval date, what happened after and the section used, a superseded
    one hidden; what precedent has and this plan lacks appears as questions for named people, and
    effort ranges come from Jira actuals.
24. **Admin: autonomy by step (Enterprise).** A grid of steps by risk tier with each cell's level,
    the evidence against the promotion bars for a selected cell, "Propose Promotion" enabled only
    when every bar is met and signed by the workspace admin and the line owner, a disabled example
    with its reason, recent promotions and an automatic demotion. The approvals, Try It and the
    Construction decision read "A person's decision at every level".

**Prototypes carry a persistent banner:** Prototype, "Sandbox, dev data" or "Synthetic data", the
owner, the expiry, and "Report a Problem", which opens a change request back into the line.

## 5. Status and waiting

- **System work shows UA's three-dot loader,** Baselayer's `Animation/3Dot_Loader`: three dots
  that brighten in turn, never a rotating ring. It marks a running project in Recent and on cards,
  a running tool-call row, the progress row and a running span in the trace, and it fits inside its
  row, so nothing clips (the rings in the earlier trace playback did). Under reduced motion the dots
  hold still.
- **People never get a loader.** A human wait shows its age, not staleness. In the conversation
  and on the line strip it carries a 14 px clock glyph and the age in Regular ("Waiting on Dana,
  4m"); in dense rows (tables, cards, the line column of Projects and Portfolio) a short wait is
  Regular text with no glyph. At 2 business days or more in the time zone of the person being
  waited on, everywhere, the age turns Bold and carries the clock ("Waiting on Dana in Finance,
  2d"), never amber, with Nudge and Reassign.
- **"Stale" applies only to system work,** with thresholds per activity: an agent turn with no
  event for 2 minutes, a build for 30, a preview start for 3. Each offers "Retry From This Step",
  "Stop and Keep Partial Results" and "Tell the Platform Team".
- **Long work survives leaving.** One progress row above the composer says what is running, as a
  step and a count ("Building the prototype: 3 of 8 pieces, about 2 hours left"), with Pause;
  "Since You Left" sums up what happened on return.
- **Delegations show the specialist's own state** in Layers 2 and 3 ("Cortex Code · running 14s",
  "Coding agent · piece 4 of 8 · checks round 2"); in Layer 1 they roll up into the progress row.
- Progress is step and count, never a percentage.

## 6. Visual language

The visual source of truth is [design-system.md](design-system.md), "HyperDelivery on Baselayer".
When this section was first written, UA's public brand was the only source. Baselayer, Under
Armour's internal web design system, is now available, so the tokens, type, space, shape, the app
shell and every component spec live in the design system, and this section keeps only the
direction and the rules that are not visual values. Where the two disagree on a visual value, the
design system wins.

The goal is unchanged: an internal tool that feels unmistakably UA in its precision and restraint,
without borrowing consumer marketing assets. **A dated Brand review of the wordmark, red usage,
typeface, third-party marks and the design system's proposed extensions runs in the long-lead
track (W2 to W10)**; [design-system.md section 15](design-system.md#15-brand-review) lists the
items. It does not hold up the Final MVP, which is open to invited pilot users only; it must clear
before HyperDelivery opens beyond them at Enterprise ready (proposed).

### What changed from v3

| v3 said | Now | In design-system.md |
|---|---|---|
| UA's public brand as the only source, in two themes | Baselayer role tokens in the light theme, with `--hd-*` aliases for product meaning | [Section 3.1](design-system.md#31-role-tokens) |
| A white page with `#f9f9f9` panels and `#e6e6e6` hairlines | A `#F9F9F9` canvas, white panels with a `#D0D0D0` edge, one level of nesting | [Section 6.3](design-system.md#63-planes-and-elevation) |
| `danger`, `caution` and tinted status backgrounds | Retired by the red rule, HD-R1: failures are an X glyph and words in ink, long waits a Bold age and a clock glyph, red only for what waits on the viewer | [Section 3.3](design-system.md#33-the-red-rule-hd-r1) |
| Sequential blues and a categorical data palette | The ink ramp for stages, statuses and counts; a system's brand hue for its series; a person's fill for theirs | [Section 3.5](design-system.md#35-data-and-charts) |
| Tinted surfaces, agent tints in Layer 1, and a 2px colored left rule on agent cards | Neutral surfaces, selection as an ink outline, no side stripes; agent hues in Layers 2 and 3 only | [Section 6.2](design-system.md#62-borders) |
| An indigo orchestrator; indigo, violet and sky avatar fills | The orchestrator in ink; a deeper, less saturated set of people fills | [Section 3.6](design-system.md#36-people) |
| An ink focus ring | The `#0096FA` focus ring, with a white separator on gray containers | [Section 6.4](design-system.md#64-focus) |
| Sentence case everywhere; condensed uppercase for short strings | Title Case for the UI's own words, sentence case for content; no condensed widths, no letter spacing, ALL CAPS only on mono badges | [Section 4](design-system.md#4-type) |
| Archivo with a width axis and three weights; Geist Mono | Archivo 400 and 700 at normal width; Chivo Mono 400 and 600 | [Section 4.1](design-system.md#41-families) |
| Headings 18 to 32 px, chip text 11.5 to 12.5 px | Seven sizes from 12 to 40, with a 12 px floor | [Section 4.2](design-system.md#42-the-app-type-scale) |
| A 4px spacing scale; 3, 6 and 8 px radii; 5 to 6 px chips | The 8/16/24/32/56 rhythm on a 12-column grid; radii 0, 4, 8 and pill | [Section 5](design-system.md#5-space-grid-and-control-sizes), [section 6.1](design-system.md#61-radii) |
| The station line in the top bar as navigation | A collapsible side nav with the product areas (selection by weight alone), a slim 56 px top bar with the page name or breadcrumb, its actions and help behind a "?", and the line in each project's workspace | [Section 7](design-system.md#7-the-app-shell) |

### Color with meaning

Ink first. Color comes from what is real, each kind with one meaning, listed by how often it
appears on a screen:

1. **Brand marks** in full color on object chips, logo stacks, Sources, Connectors, trace rows and
   architecture nodes. Chips stay neutral, so most of the color on a screen comes from logos, and
   every colored thing has a name beside it.
2. **People:** each person's fill, on avatars and on their decision-timeline lanes.
3. **Data:** a system's brand hue on its series, a person's fill on theirs, and the ink ramp for
   stages, statuses and counts. Never red.
4. **Agent hues** on trace bars, lanes, delegation markers and architecture zone edges, in Layers 2
   and 3 only. Layer 1 never shows them.
5. **Status:** a green glyph and word for passed and accepted, red for waiting on you, and the orange
   NEW badge and provenance rule.

At thumbnail size every Layer 1 screen shows brand marks in color and colored avatars; one that
reads as grayscale is missing real marks or people, never decoration. Some agent hues sit close
together under color-vision deficiencies (violet and the two brand blues), so color never stands
alone: every bar's row carries the agent's mark and name, and a "Second engine (swap test)", where
one is shown, is dashed as arriving later. Run the palette
through protanopia, deuteranopia and tritanopia simulation before it ships.

**The red remap.** Today red is the primary button variant, the focus ring, text selection, the
user avatar and the hazard stripe, about 84 uses across 29 files. In the Final MVP: primary buttons
become black pills, the focus ring becomes `#0096FA`, selection becomes an ink outline, the account
avatar takes the person's fill, and the hazard stripe is retired. The crew's identity hues leave
the main surfaces; agent hues return only in Layers 2 and 3.

### Data provenance

Every mockup, preview, screenshot and recording carries a strip that cannot be dismissed. A
prototype runs only in the sandbox on dev data, so the strip names which: "Sandbox, dev data:
Merchandising dev copy" or "Synthetic data, not real sales". Production data connections are made
in Construction, after the handoff. It is a neutral band with a 2px orange top rule and an ink
alert glyph, never red ([design-system.md section 9.20](design-system.md#920-provenance-strip)).

### Imagery

No athlete photography, campaign films, taglines or AI-generated athletes; no logo lockups or
recolors without Brand sign-off. The product's own content is the imagery: previews, documents,
the line, and the marks of the systems a project touches.

## 7. Logos, tool chips and model chips

### The brands registry

One registry, `ui/console/src/lib/brands.ts` (proposed), holds every mark the console may show:
key, name, kind (tool, resource, model or system), color and mono files, source and code license,
trademark note, the surfaces it is cleared for (chip, canvas, docs) and a fallback glyph. A tool's
wire name and a span's `metadata.brand.type` resolve to the same key, and AgentPrism already renders
that field as a logo avatar.

A first pack of 42 sanitized marks covers Atlassian, Microsoft 365, Snowflake and its neighbors,
GitHub, the model providers and AWS, plus generic glyphs (browser, database, file, spreadsheet,
meeting, recording, terminal, folder, link). Sources, licenses and each owner's rules are in
[logo-assets.md](research/logo-assets.md). Rules for using a mark:

- Always pair a logo with its name, in the chip or its accessible label.
- Never recolor, crop or restyle a mark, and never nest the Atlassian tile in a second container.
  Show the Snowflake mark at 20px or larger so its registered-trademark symbol stays legible; at the 16 px
  chip size the Brand review decides between the mark and the name with the database glyph.
- The coding agent never carries the Copilot mark. It is "Coding agent", subtitled "AgentCore
  harness, in the sandbox", with the `terminal` glyph (in its violet tile in Layers 2 and 3), or the
  Amazon Web Services mark where a vendor mark is shown. Anthropic approves logo use in advance, so
  production may show model names as text until UA legal clears the marks.
- Microsoft and AWS license their icons for diagrams, training and documentation, not product
  chips. **The architecture canvas is within those licenses; product chips go through the Brand
  review.** The fallback, one switch in the registry, is the name with a generic glyph ("Teams
  recording" with the meeting glyph).
- Generated prototypes never carry third-party marks without the vendor's terms.

### Tool chip

One `ToolChip` row replaces today's `ToolTile` glyph (`ui/console/src/components/thread/ToolTile.tsx`,
which maps a wire name to six Phosphor kinds). The anatomy comes from Beautiful UI's tool chips,
which have the right grammar but no logos and no status. Its parts are the object chip, logo tile
and status in [design-system.md section 9](design-system.md#9-components), which set the sizes and
colors.

| Part | Spec |
|---|---|
| Logo tile | A 24 px tile holding a 16 px mark in rows and traces; a bare 16 px mark inside an object chip. Radius 4, `surface` fill with an inset 1px `outline-variant` ring. Marks keep their own colors (the one-color variant only where design-system.md section 3.4 allows it). Jira and Confluence marks skip the tile, since their own tile is the container. Fallback: the system's initial as a monogram, or the generic glyph for a generic resource. On hover the slot swaps to a chevron |
| Label | A verb phrase, never truncated. Layer 1: outcome words ("Checked 3 Confluence pages", "Read the Jira ticket"). Layer 3: action plus system in `on-surface-variant` ("Search pages · Confluence"), with the wire name in the popover |
| Object chip | 24 px high, radius 4, `tertiary` fill, an inset 1px `outline-variant` ring, Label XS 12/16, truncates with a tooltip holding the full value. Mono for identifiers (Jira key, page title, query id, file). **Data-bearing steps show metadata only:** "query 01b2… · 3 views · 50 rows scanned", never values |
| Status, right edge | Running: the three-dot loader (section 5) and a live elapsed time in tabular figures, with a slow shimmer on the label that stops under reduced motion. Done: the duration ("2.4s"). Failed: an ink X and the word "Failed", the reason as the first detail line and "Retry From This Step" where allowed. Stopped: "Stopped" in `on-surface-variant`. A writing tool awaiting authority: "Waiting on Dana" in `on-surface-variant`, and the solid red notch with a label **only when the viewer is the one being waited on** |
| States | Hover: `surface-container-high` fill. Focus: the `#0096FA` ring. Expanded: chevron down and an indented detail block with a 1px `outline-variant` guide. Queued: label in `on-surface-variant`, no time |
| Group header | Collapsed runs read in Layer 1 words with a logo stack (three marks, then "+2"): "4 lookups, 1 change · 18s" |
| Diff chips | Object chips: mono file name, `+13` in `status-success` and `-41` in `on-surface-variant`. Deletions are never red |

Rows open with an opacity and 4px translate fade, not a height animation.

### Resource chip

The chip for something a person pointed at: the source's mark, the title, the owner, and a state
in words with a small glyph, all in ink. Indexed and Snapshot are quiet; Reading carries the
running shimmer; Stale takes a clock glyph; Access Lost and Needs Access (the person who pointed
cannot open it yet) take an alert glyph, the last with "Ask" and the owner's name; Blocked by a
Microsoft 365 Setting takes a lock glyph and "Ask an Admin". None is amber, and the red marker appears only
when the viewer is the one who must act (HD-R1). The chip deep-links to the source at the cited version, comment or timestamp.

### Model and engine chips

Layer 3 and the audit trail only. The provider mark and the model name in `on-surface-variant`: the orchestrator
"Claude Sonnet 5.5", reviewers "Claude Opus 5.5", triage "Claude Haiku 4.5", each with "via Amazon
Bedrock" in the tooltip. The chip always shows the `model_id` recorded with the turn (decision
2026-09-30), so it names what actually ran; which models the allowlist offers depends on what Bedrock
carries at the time. Cortex Code shows the Snowflake mark and its own model. The coding agent's
model chip reads "Claude Sonnet 5.5 · via Amazon Bedrock", the model set on that build call, and an
engine chip beside it names what ran ("AgentCore harness", with the harness version and image digest
in the tooltip), so a swapped engine or model is visible in the trace and on the receipt. Neither
chip ever shows the Copilot mark.

## 8. Activity, traces and the components that carry the product

Three views share one `Timeline` core (time scale, an axis that can break across idle gaps, bars,
hatching, elbow connectors, markers, a playback clock): the Layer 3 trace in seconds, Layer 2 lanes
in hours and days, and the decision timeline in days and weeks. In the product they sit under a
project's More menu (Timeline and Trace) and open at full width; Layer 1 lives in the
conversation. Build it once on AgentPrism's
`TraceSpan` model; take the reference trace's grammar, not anyone's code.

### The trace (Layer 3)

Modeled on the reference trace the owner shared
([analysis](research/chips-tables-diagrams.md#3-the-reference-trace-and-how-layer-3-and-layer-2-adopt-it)),
with our color and failure rules.

| Region | Spec |
|---|---|
| Summary strip | Duration, Cost, Tokens, Model calls, Tool calls, Errors, and Snowflake credits when Cortex Code ran (dollars marked as estimated). Errors above zero show an ink X glyph. A **Slowest** button (compact secondary, clock glyph) jumps to the slowest step. Search with a `⌘F` key hint and the CloudWatch link sit above |
| Steps tree | Agent rows pinned while children scroll: the agent's mark in its hue, its name, the model in `on-surface-variant`. Tool rows: the system's logo tile, the action in `on-surface`, the system in `on-surface-variant`. A 24 px indent per level with 1px guides; resizable column |
| Time axis | Round ticks that rescale as the run grows, zoom, a hover scrubber, a live "now" cursor during a run. Idle gaps past a threshold collapse to a zigzag break labeled "38 min" |
| Bars | 16px on 32px rows. Working: the agent's hue. A span still running shows the three-dot loader in its label column, inside the 32 px row so it never clips. Waiting on a tool: its tint with a hue border. Waiting on a person: hatched gray. Agent rows show a composite strip of their children; per row, "17s · $0.15", with rollups stated ("incl. 3 sub-steps") |
| External agents and the build | Cortex Code is one bar with an "External agent" marker and what it reports (query ids, views touched, rows scanned and returned). The coding agent runs in HyperDelivery's sandbox account, so its build is one session band with the `terminal` glyph in its violet tile: a tick per turn, a hatched pause while an `ask_user` question waits, and what each piece reports (commit, checks, questions asked, cost). **What came back is shown as size, not content** |
| Delegations | A 1.5px elbow with a 4 px corner, in the child's hue, from the delegation instant to the child's first bar. Agent-to-agent passes are always "delegations"; "handoff" means only the end-of-Inception package |
| Failed and retry | A `surface` bar with a 1.5 px ink outline and an X, and "Failed" in the label column; the label stays `on-surface`. The retry follows in the agent's hue with a circular-arrow glyph, linked to its failed attempt |
| Footer | Play, pause, restart, speed 0.5x to 4x, Jump to Failure, Jump to Slowest, and the legend (Model Call, Tool Call, Waiting on a Tool, Waiting on a Person, Delegation, Failed, Retry). Bar variants are specified in [design-system.md section 9.22](design-system.md#922-trace-bars-and-lanes) |
| Details drawer | Status, duration, start offset, cost, tokens including cache, time to first token, the model chip, the error, a summarized input (metadata only for data-bearing spans), span and trace ids with copy buttons |

Space plays and pauses, Left and Right step between spans. The tree is a `treegrid`, each bar a
labeled button, and an outline table carries the same rows for screen readers and print. Under
reduced motion nothing plays automatically.

### Lanes and delegations (Layer 2)

The same grammar at project scale, calmer: 10px bars, fewer labels, weekends shaded, today marked.

- **Lanes are actors:** the orchestrator, each specialist that ran (mark and hue), and each person
  (avatar, name, role).
- **Delegations** are a dispatch marker on the orchestrator's lane with the request's objective
  ("Margin per door by franchise, FW27"), an elbow to the specialist, and a return marker with the
  one-line result ("3 certified views · weekly by franchise · 0 rows returned").
- **Gates** are vertical ink rules topped with the square notch and split time; **decisions** are
  diamonds that open the record; **side effects** (repository created after approval 2, the Jira
  epic and issues filed at the handoff, Confluence page updated) are logo ticks that open the
  side-effect ledger. The tab that holds this view is "Decisions and Delegations".

### Delegations in the conversation (Layer 1)

The assistant speaks in its own voice in the project's conversation; each delegation underneath is a tool-call group, collapsed
by default to one row: the system's tile, what was done in Layer 1 words, what came back on a
second line, and one total duration on the right:

| Marks | What was done | What came back |
|---|---|---|
| Snowflake | "Checked margin per door in Snowflake" | "3 certified views, 0 rows returned" |
| Confluence, Teams | "Read 4 Confluence pages and the Oct 21 working session" | "23 statements, 2 open questions" |
| Coding agent (`terminal` glyph), running | "Building piece 4: filters" | "Checks round 1 of 2, about 2 hours left" |
| Jira, side effect | "Filed the Jira epic and 8 issues for the handoff" (only after approval 3) | "1 epic, 8 issues" |

Expanding a group shows plain outcome lines ("Found 3 certified views"), not value boxes or
per-step durations; with "Show Technical Detail" on it shows the tool chips and opens the trace at
that span. The conversation never shows values from a data step beyond the aggregate the plan
cites, and never rows.

### Decision timeline by person

The view the owner singled out, kept and refined: where did the time go, and who were we waiting on?

- **Rows are people,** grouped by function, each with an avatar disc in the person's color.
- **Spans:** deciding is solid in the person's color; asked is an outline; waiting on them is
  hatched gray with its age, turning Bold with a clock glyph after 2 business days in their time
  zone, and red only when the viewer is the one waited on (it ends in the solid notch labeled "Your
  Decision").
- **Marks:** diamonds for decisions with ids ("D-3"), elbow arrows for "asked Dana" and "reassigned
  to Jordan", approvals as black square notches on a top rail, each named with its split time ("The
  Plan, 5d 4h"), a today line. On the Activity board the view is titled "Who Held the Work". A
  sent-back decision is struck through and kept, and "Round 2" starts.
- **Interaction:** a hover card per span (question, options, answer, source), zoom by day or week,
  filter by role, click to open the record. One sentence above states the finding: "Waits on
  people: 61% of elapsed time."

It is read-only and must match the trace's axis exactly, so it is built on the `Timeline` core
rather than a gantt library (options compared in
[chips-tables-diagrams.md](research/chips-tables-diagrams.md#5-gantt-and-timeline-components-for-the-decision-timeline-by-person)).

### Data tables

Every dense list (a prototype's SKU workbench, Sources, Library facts, the Inbox, findings, the
side-effect ledger, Admin, cost) uses one table: TanStack Table v9 and TanStack Virtual for logic,
Dice UI's Data Table (Radix variant, MIT) copied and pinned as the pattern source and restyled to
UA tokens, and Arc's free Sortable data table, Tree table and Filter toolbar for motion and states.
The visual spec (header, densities, cells, row states, footer) is in
[design-system.md section 9.14](design-system.md#914-data-table).

| Part | Spec |
|---|---|
| Toolbar | Search (`/`), faceted filter chips with counts ("Finance 12") and Clear Filters, a View menu for column visibility and order, density, Export |
| Columns | Sticky header; pinned first column with an edge shadow only while scrolled; numbers right-aligned in tabular figures |
| Sort and state | Click to sort, Shift-click for multi-sort; sort and filters kept in the URL (`nuqs`) |
| Selection | Checkbox with Shift-range and a bar reading "3 selected". **The bar never offers approve** |
| Cells | A 64 by 16 sparkline with the last point dotted, bar-in-cell, a delta with a direction glyph (never red), status as a glyph and a word (never on a tint), mono identifiers, row hover actions |
| Scale and states | Three densities; virtualization past about 200 rows; "1-50 of 1,284" in the footer. Empty keeps the frame and offers the first action; a real zero prints "0", missing data is a dash in `on-surface-variant`; loading is skeleton rows; an error shows inside the table with "last good at 09:14" |

**The SKU workbench:** Style (pinned, mono style number then name), Franchise, Sell-through
(bar-in-cell), Margin per door (with a delta against last year), a 12-week trend sparkline, Flag
("Below line" with a glyph) and Reason (expands in place), with Franchise and Flag facets and an
Excel export, inside the preview's provenance strip. Generated prototypes get the same table as the
UA app kit's pre-wired `DataTable`, so the coding agent only writes column definitions; a lint rule
blocks `ag-grid-enterprise` imports in the escape hatch.

### Architecture canvas

An interactive diagram on xyflow, in two uses that never mix: a project's own solution architecture
under its More menu, and HyperDelivery's platform architecture on its own page. A project's diagram
has two parts: the prototype (the sandbox account, dev data) and the production target, dashed and
labeled "Built in Construction", so nobody reads the prototype as the production system.

- **Layout:** inputs, the system, outputs, left to right. Zones sit in fixed columns by rule, with
  dagre inside each zone: deterministic, readable, and free of the copyleft licenses elkjs and
  Graphviz carry.
- **Zones:** People and surfaces; HyperDelivery on AWS (control, agent and knowledge planes);
  Snowflake; GitHub prototype organization; Sandbox AWS account; Atlassian; Microsoft 365; Entra ID.
  Each is a neutral `surface-container` zone with a 1px edge in the system's hue, an 8 px radius
  and a label tab (vendor mark, name, and a sublabel such as "Snowflake · UA_EDM"); the
  HyperDelivery zone's edge is ink. Trust boundaries are dashed, ownership boundaries solid.
- **Nodes and edges:** nodes are `surface` with an 8 px radius, a 24 px logo tile, a name and a
  sublabel (mono only for machine identifiers). Edges are orthogonal, dashed when asynchronous, and **labeled with what
  crosses**: "DataTask → DataFindings · metadata and aggregates only", "BuildUnit → BuildResult · a
  commit and checks per piece", "ResourceRef → ResourceDigest", "signed gate token".
- **Replay a request:** the side panel beside the diagram holds the replay: pick a scenario (a
  data question, build a piece, point at a resource) and nodes and edges light in order beside a
  numbered step list, with play, previous and next.
- **Interaction:** hover highlights a node's paths; click swaps the side panel to that node's
  details (responsibility, data touched, identity used, owner, the phase it lands in) with "Back to
  Replay"; zooming out collapses a zone into one node with a count; zoom, fit, minimap, outline view
  and export with a logo credits line.
- **Phases on the platform view:** a Today, MVP and Enterprise control. Today lights only what
  runs now; MVP dims the parts that arrive in Enterprise, which are dashed; Enterprise shows
  everything. These are the only phase names inside the product, as a diagram legend.
- **Who sees it:** the platform view as the "How HyperDelivery Is Built" help page and in the docs;
  a project's architecture in Layer 2 from Tech Design, under More > Architecture, while the Plan
  tab shows the "Which data it uses" table in Layer 1. LikeC4 is a candidate architecture-as-code format for Blueprint to emit (a decision,
  since it lays out with Graphviz).

## 9. Motion

- **Three tiers by size,** all critically damped: *fast*, 0.08s (hover, focus, tooltips);
  *moderate*, 0.16s (tabs, drawers, a tool-call row arriving); *slow*, 0.24s (dialogs, stepped
  flows). Exits are tweens one tier faster. Adapted from
  [Fluid Functionalism](https://www.fluidfunctionalism.com/).
- **No bounce on anything involved in signing.**
- **The gate moment:** the red notch fills to ink, the split time stops counting, and the signed
  record slides 8px into place over 0.24s. The other authored moments are the preview becoming
  ready, a delegation returning (its summary fades in), an artifact card opening its tab in the
  panel, and the handoff package becoming ready.
- Status lines crossfade with opacity only, because they change often. The line's shimmer and the
  three-dot loader stop when work is stale and under reduced motion. Document change marks fade over 3 seconds with no
  animated reflow.
- Trace and canvas replay follow the playback clock; nothing replays on its own under reduced
  motion.
- Transforms and opacity only, never height. Reduced motion means fewer and gentler, not none.

## 10. Vocabulary and voice

The glossary, including terms that may never appear in Layer 1, is in
[operating-model.md](operating-model.md#12-glossary). These points matter for the screens:
approvals are named by the decision ("Your Approval: The Plan"), not by number; the line's phase
names (Ideation, Inception, Construction, Operations) stay in Layer 2 and the docs; the roadmap's
phases (Current State, Final MVP, Enterprise) never label anything in the product except the
platform diagram's Today, MVP and Enterprise control and the Lifecycle map's "Arrives in
Enterprise"; and "Spec" is not used because in apparel it means a garment tech pack. Layer 1 also
avoids "tenant setting" (say "a Microsoft 365 setting"), "data envelope" (say "approved data") and
"v1" (say "the first version").

Version 4 fixes these words:

| Say | Means | Not |
|---|---|---|
| Handoff | The end of Inception and the line's fourth stretch: the handoff package, the demo and the Construction decision | An agent passing work to another agent |
| Delegation | The orchestrator passing a piece of work to a specialist (Cortex Code, the coding agent, the resource reader) and getting a summary back. Named in Layers 2 and 3; in Layer 1 it is a tool-call row that says what was done | "Handoff" |
| Construction decision | The Construction owner's choice after approval 3: AI-Driven, AI-Assisted With Engineers, or Not Now. A decision record, defaulted from risk and the target tier | "Approval 4", "Graduate" |
| Mockup | Ideation's output: the shape of the app, with invented numbers, signed with the Brief at approval 1 | "Prototype" (a mockup does not run) |
| Prototype | Inception's output: a working app in the sandbox on dev data, for members and named testers, with an expiry | "Live", "Production", "Shipped" |
| Dev data | Synthetic data, a dev Snowflake database, or views data platform designates as dev data | "Real data" |
| Target tier | Where the production version is meant to land ("Target: T1 Team App", "Target: T2 Department App", "Target: T3 Engineering-Owned"): proposed in the brief, confirmed with the plan, built in Construction | A tier the prototype runs at |

**Never "Live" or "Graduate" for anything HyperDelivery builds.** An accepted prototype reads "Handed
off Oct 23", then "Construction: AI-assisted" (or AI-driven) once the decision is made. Where a
screen shows Construction and Operations, they read "Outside HyperDelivery" or "After Handoff".

One voice: short, declarative, in UA's direct register; first person only in the assistant's own
messages. It flags partial answers
and never sounds certain when it is not.

| Moment | Example |
|---|---|
| Asking | "I need one answer from Finance before I can finish the plan." |
| Waiting | "Waiting for Dana (Finance) since Tuesday. I'll nudge her tomorrow morning." |
| Started from a ticket | "Started from MERCH-1182. Read the ticket, 3 linked pages and 12 comments." |
| Delegation returned | "Margin per door exists weekly by franchise in a certified view. No rows left Snowflake." |
| Resource lost | "I can no longer open 'FW27 line plan' in OneDrive. Ask Maya to share it again, or remove it." |
| Stale | "No progress on the build for 32 minutes. Retry from the build, or keep what's done?" |
| Failed | "I stopped the margin check at its Snowflake credit cap. Narrow the question, or ask to raise the cap." |
| Sent back | "Back to the plan, round 2. Jordan asked for wholesale accounts to be included." |
| Approved | "Plan approved. You'll see a working first piece here, likely tomorrow." |
| Numbers on dev data | "Definitions match the golden report. Numbers aren't checked on dev data; Construction checks them." |
| Handed off | "The handoff package is ready for Kim Patel in Retail Systems, who decides how Construction runs. Testers keep the prototype in the meantime." |
| Partial result | "I covered 5 of 6 criteria. Excel export works as CSV only; it's listed in what this skips." |

**Never:** "Here's", "Great question", "I've analyzed", "seamless", "effortless", "unlock",
"supercharge", "magic", "delve", "powered by AI", sparkle icons or exclamation marks. Say "Recommended",
not "Assistant's pick". No dashes as punctuation in interface copy. Title Case for the UI's own words (headings, buttons,
tabs, labels, status words) and sentence case for content (messages, helper text, status sentences,
toasts), as [design-system.md section 4.3](design-system.md#43-case) defines.

## 11. Component stack

Keep React 19, Tailwind v4, Radix, motion and xyflow. Copy patterns instead of adding heavy
frameworks; every new package gets a decision-log entry.

| Need | Choice | Note |
|---|---|---|
| Primitives | Radix: per-component packages today; consolidate to the unified `radix-ui` package | |
| Motion | Upgrade `motion` 13 to 14 | Needed by Fluid Functionalism; 14 removed only internal compatibility APIs |
| Agent UI patterns | shadcn AI Elements (plan, queue, confirmation, checkpoint, inline citation), copied through the shadcn CLI | Vercel's older `elements.ai-sdk.dev` is deprecated at the end of November 2026 |
| Questions and thinking states | Fluid Functionalism's AskUserQuestions, ThinkingSteps, ThinkingIndicator (MIT) | Also adopt its motion rules |
| Trace, lanes and decision timeline | AgentPrism (MIT, alpha, OpenTelemetry adapter) for the span model and tree; our own `Timeline` core for the axis, bars and connectors | Restyle from Tailwind 3 to v4. Arc's Pro Agent timeline is the alternative if Arc Pro is bought |
| Data tables | TanStack Table v9 and TanStack Virtual; Dice UI Data Table anatomy (Radix variant), copied and pinned | `nuqs` for filters as addresses |
| Diagrams | `@xyflow/react` 12 with a zoned layout and dagre inside zones | elkjs or LikeC4 only by decision (copyleft layout engines) |
| Component source | Arc free tier (MIT), copied into `components/arc/` with one token override | Arc Pro: decision pending, console only (section 12) |
| Brand marks | `brands.ts` registry with per-mark source, license and cleared surfaces | Section 7 |
| Panels and numbers | `react-resizable-panels`; `@number-flow/react` | Or Arc's free equivalents; pick one per need |
| Toasts, palette, URL state | `sonner`, `cmdk`, `nuqs` | Arc's command palette or `cmdk`, not both |
| Icons | Phosphor, held to a 1.5 px rendered stroke ([design-system.md section 10](design-system.md#10-icons)) | Arc's source uses lucide: swap on copy or log a decision to allow lucide |
| Type | Archivo 400 and 700 and Chivo Mono 400 and 600, self-hosted; UA Text and UA Technical if Brand licenses them | Replaces Geist and Geist Mono ([design-system.md section 4.1](design-system.md#41-families)); the font package gets a decision-log entry |
| Document editing with attribution | Decide between Tiptap and Lexical | Log the decision; some Tiptap collaboration features may be paid |

**A UA internal app kit for generated prototypes.** Generated apps use a small, free and
permissively licensed kit built on these tokens, so every prototype looks like UA built it rather
than like stock shadcn. Paid component kits (Arc Pro, Bencho Pro, affectUI Pro, Kobra) never flow
into generated prototypes. Generated repositories also carry the taste-skill app-screen rules,
Fluid Functionalism and Ponytail's least-code rules in their coding-agent instructions, and each
kit component gets a page in the style of Arc's per-item docs (when to use, when not to, props,
keyboard, accessibility, motion, notes for agents), which is what makes a library usable by a
coding agent.

## 12. UI Arc mapping

[Arc (uiarc.dev)](https://uiarc.dev/components) was inventoried in full, with a verdict for every
item; the table of all 299 is in
[uiarc-inventory.md](research/uiarc-inventory.md#appendix-a-full-inventory-all-299-items).

### What Arc is

- **299 items: 187 components and 112 blocks.** 142 are free under MIT (120 components, 22 blocks)
  and 157 are Arc Pro (67 components, 90 blocks), at $799 once for a team of up to 10 seats.
- **Almost exactly our stack** (React 19, TypeScript, Vite, `motion`, Radix, `lucide-react`), but
  styled with **CSS modules and CSS variables, not Tailwind**, which is the main integration cost.
  Copied files live in `components/arc/` with one override mapping Arc's variables onto UA tokens:
  never map `--accent` to UA red, map danger to ink with an X glyph (HD-R1), override radii to 4 and
  8 px plus pills, retune `motion-tokens.ts` to our three tiers, swap icons on copy.
- **Young and fast-moving:** first release September 2026, most AI and Agents items shipped
  2026-10-20, from a sole proprietor. Treat it as source to copy and own, not a dependency.

### The license line

Pro may be used in internal tools, but its license forbids offering Pro source "through a tool
that lets others generate or copy it" or putting it in "an agent that others can use to reproduce
it". HyperDelivery's coding agent is that kind of tool.

| Destination | Free (MIT) | Pro |
|---|---|---|
| HyperDelivery console | Yes, with the MIT notice | Yes, for seat holders, keeping the Arc Pro notices |
| UA app kit, generated prototypes, handed-off repositories | Yes; the kit's intended source | **No** |
| Factory skills, prompts, generated repositories' instructions, any MCP server or registry the coding agent can reach | Free docs and the free agent skill | **No**, including Pro docs used as a recipe to rebuild an item |

### What is in it, by group

| Group | Free | Pro | What matters for HyperDelivery |
|---|---|---|---|
| Actions, inputs, selects, pickers, editors | 58 | 2 | Action button, Split button, Mention input, Radio cards, File dropzone: Home's composer, Inbox, gates |
| Navigation, overlays, messages, progress, cards, media, text effects | 38 | 3 | Tabs, Resizable panels, Drawer, Hover card, Alert, Empty state, Skeleton, Image compare |
| Charts | 13 | 8 | Sparkline, Bar, Line, Brush, Treemap; Pro advanced charts as inspiration only |
| Tables and activity | 10 | 0 | Sortable data table, Tree table, Filter toolbar, Tree view, JSON viewer, Timeline, Comment thread |
| Special components | 1 | 54 | The five Pro AI items (Agent status, Tool call, Agent plan, Agent timeline, Context window) are the closest match to the reference trace; most others are decorative |
| Blocks: AI and Agents | 0 | 18 | AI composer, AI side panel, Agent memory, Knowledge base, Agent orchestrator, MCP servers |
| Other blocks | 22 | 72 | Page header, Command palette, Notification center, Empty states (free); the rest is inspiration for Admin and the Portfolio, or skipped |

Verdicts across all 299: free 72 Adopt, 20 Adapt, 12 Inspiration, 38 Skip; Pro 13 Adapt (console
only), 56 Inspiration, 88 Skip. **Arc does not fill:** the decision timeline by person, a node
canvas, brand marks for UA's systems, Teams Adaptive Cards, a free app shell or a free data grid.

### The fifteen that would most raise the console

Ten are Pro (one only as inspiration), and each has a free fallback, so nothing here depends on
buying Arc Pro.

| # | Item | Tier | Where it goes | Fallback without Pro |
|---|---|---|---|---|
| 1 | Agent timeline | Pro | Layer 2 and 3 trace; also the decision timeline by person | AgentPrism and our `Timeline` core |
| 2 | Tool call and tool call group | Pro | The conversation and Layer 2, with our marks | Our `ToolChip` |
| 3 | Agent orchestrator | Pro | Layer 2 delegation lanes | xyflow with our own lanes |
| 4 | Agent status | Pro | The status capsule on every project | Text shimmer and Icon morph (free) |
| 5 | Knowledge base | Pro | The Sources tab and "Test a Question" | Tree view and Progress (free) |
| 6 | Agent memory | Pro | What HyperDelivery Knows, in the Sources tab | Tree table and Inline edit (free) |
| 7 | AI side panel | Pro | Proposed edits to the living document, landing as attributed Confluence revisions | Tiptap or Lexical suggestion mode |
| 8 | AI composer | Pro | Home's composer, with no model menu | AI Elements prompt input, Mention input, File dropzone |
| 9 | Document extraction | Pro, inspiration | Confirm what we heard: a fact beside its transcript span | Our own two-pane layout |
| 10 | Page header | Free | Every project workspace: the line strip folding to the mini line | n/a |
| 11 | Sortable data table, Tree table, Filter toolbar | Free | Every dense list, on TanStack logic | n/a |
| 12 | Comment thread, Mention input | Free | Margin questions and ingested Confluence comments | n/a |
| 13 | Timeline, Text shimmer | Free | Layer 1 narration and "Since You Left" | n/a |
| 14 | MCP servers | Pro | Admin connectors, each tool marked read or write | Switch, Usage meter, data table (free) |
| 15 | Hero section, workflow variant | Free | Replay a request on the architecture canvas | n/a |

### App kit v1

54 free items, restyled with UA tokens: Button, Action button, Split button, Copy button, Icon morph,
Input, Textarea, Search field, Inline edit, Number field, Money input, Tag input, Select, Combobox,
Multi-select, Chip group, Radio cards, Checkbox, Radio group, Switch, Segmented control, Date picker,
Date range picker, File dropzone, File upload, Tabs, Breadcrumb, Pagination, Accordion, Resizable
panels, Dialog, Drawer, Popover, Tooltip, Hover card, Alert, Toast stack, Skeleton, Card, Avatar,
Badge (quiet), Empty state, Line chart, Bar chart, Donut chart, Sparkline, Sortable data table, Tree
table, Filter toolbar, Timeline, Command palette, Page header, FAQ section, and Announcement bar as
the provenance banner. We add a UA app shell and the TanStack-based `DataTable`.

### Recommendations

1. **Use Arc's free tier now, as copied source,** for the console and the app kit. Log the decision,
   and the lucide versus Phosphor choice.
2. **Decide Arc Pro as a logged decision.** The team plan is justified only if the console adopts
   the AI set (items 1 to 8 and 14); seats go to the people who touch Pro source; confirm the
   procurement path for a sole proprietor first.
3. **Guard the factory.** A CI check in generated repositories and in the kit fails on
   `@uiarc-pro`, `/r/pro/` URLs or the Arc Pro file notice, and no Arc MCP session signed in with a
   Pro account is reachable by the coding agent. The kit carries Arc's MIT notice.
4. **Copy Arc's documentation pattern** for every kit component (section 11).

## 13. What changes in today's console

**The Final MVP build ships these** (weeks 1 to 14), mapped to today's files and, where one exists,
to a row of the roadmap in
[enterprise-plan.md](enterprise-plan.md#phase-2-final-mvp).

| Change | Where today | Weeks |
|---|---|---|
| One voice: agents out of the default view (turns, tabs, gate copy, composer, tab title, receipts, Home tile); delegations shown as tool-call rows in the conversation | `AGENT_META` in about 28 files, e.g. `Turns.tsx`, `Inspector.tsx`, `GateConsole.tsx`, `Composer.tsx`, `App.tsx` | W1 to W4, with the orchestrator |
| Engineering words out of the default view (pull requests, merge, bare requirement IDs); documents named by content, not author; "Show Technical Detail" in the account menu | `thread/BuildBoard.tsx`, `inspector/views.tsx`, `inspector/Inspector.tsx`, `DocumentViewer.tsx` | W1 to W4 |
| The console look: the [design-system.md](design-system.md) light tokens and type, the red remap's structural parts, `brands.ts`, `ToolChip` replacing `ToolTile`, the three-dot loader replacing the spinner, the line in the project workspace and the mini line on cards and rows | `index.css`, `ui/Button.tsx`, `ui/Spinner.tsx`, `thread/ToolTile.tsx` | W2 to W6 |
| The shell: a collapsible side nav (New Project, Search, Home, Inbox, Projects, Library, Recent with status marks, role-gated Portfolio and Admin, the account and workspace) in place of the top bar's navigation; a slim top bar with the page name or breadcrumb, its actions and help behind the "?"; a one-time note on where things moved | `shell/TopBar.tsx`, `shell/ProjectRail.tsx`, `shell/LineIndicator.tsx`, `shell/UserMenu.tsx`, `shell/CommandPalette.tsx`, `help/HelpPanel.tsx` | W2 to W6 |
| A chat-first Home: one composer that recognizes Jira keys and links and points at Teams, OneDrive, SharePoint, Confluence, Jira and Snowflake, then Waiting on You and the projects to pick up. The Start page's tabs and the Home bento retire; the follow-on choices become question cards in the new project's conversation, with the time cost shown when choosing how thorough | `routes/Home.tsx`, `routes/Landing.tsx` | W3 to W6 |
| The project workspace: the thread as the conversation (artifact, question and approval cards, system notes, the progress row) and the inspector as the artifact panel, with tabs named by content (Brief, Mockup, Plan, Prototype, Data, Sources, Decisions, More) that appear once the artifact exists, in place of one tab per agent | `routes/Workspace.tsx`, `thread/Thread.tsx`, `thread/Turns.tsx`, `inspector/Inspector.tsx`, `inspector/views.tsx` | W3 to W8 |
| The Mockup tab: starting looks, then the mockup drawn from the chosen one, signed with the Brief at approval 1 | new | W4 to W8 |
| The Sources tab with index states, and What HyperDelivery Knows (today's Memory) inside it | `inspector/SourcesView.tsx` | W3 to W7, with the resource reader |
| Modern data tables: one `DataTable` replacing ad hoc tables, first used by Projects | new, used across routes | W4 to W7 |
| Timeline and Trace under More, and the decision timeline by person, on the `Timeline` core; agent-to-agent passes named delegations everywhere, including the animation that shows one | new; `inspector/TraceView.tsx` stays as Layer 1 requirement coverage; `moments/Handoff.tsx` | W5 to W8 |
| Gates rewritten as decisions with evidence, attestation and the pending signature, signed in the artifact panel's decision bar, on the line's three approvals | `thread/GateConsole.tsx` | W3 to W8 |
| The prototype as the Prototype tab, with the "Sandbox, dev data" provenance strip | the shipped banner in `thread/Thread.tsx` | W4 to W8 |
| The project's Architecture view under More, with the prototype and the dashed production target | new | W8 to W11 |
| The Handoff view: the handoff package and the Construction decision for the Construction owner, in the Inbox and the project workspace. The shipped celebration retires, since nothing ships from HyperDelivery | `moments/Shipped.tsx` | W10 to W14 |
| Teams cards and the Inbox screen, with approver assignment, reassignment and reminders (email deep links before then) | new | W9 to W14 |
| Confirm what we heard, as a view in the Sources tab, with ingested Confluence comments | new | W9 to W14 |
| Feedback in the product: point-and-say notes on previews and "Report a Problem" | new | W8 (friendly users) onward, through the pilot |

**Also in the Final MVP build:** the definitions check (numbers too, where the dev data is a
designated copy of the golden report), "change this prototype" requests, the living-document view,
the two help pages (How Work Moves and How HyperDelivery Is Built), and first run.

**Enterprise:** Admin (roles, approved data, the prototype contract, connectors, budgets, model
allowlist), Library v1 with Recently Handed Off, replacing Workspace notes in `routes/Context.tsx`,
Portfolio in place of today's count cards, the working session in a Teams meeting, strong sign-in
flows for High-risk approvals, existing-system changes and the Construction decision, and the audit
views.

**Naming:** rename `routes/Workspace.tsx` to Project, because "workspace" is the tenancy unit
(Merchandising, Sourcing) that the account menu switches; "project workspace" in this document names
a layout and never appears as a label. Rename `moments/Handoff.tsx` for delegation, because
"handoff" now means only the end-of-Inception package.

## 14. Research plan

- **Concept test** of the canvas in W2 and W3, before the Final MVP look locks: at least 6 business
  teammates from at least 3 functions outside EDM, 2 from EDM, one engineer and one data steward.
- **Usability test** at Friendly users (W8) and at MVP ready (W14). Tasks: start a project from an
  idea; start one from a Jira ticket; point at a OneDrive folder and see what was indexed; answer a
  question sent to you (an email link until the Teams cards ship in the Final MVP build); find the
  mockup and then the prototype from the project's conversation; approve a plan; find why a
  decision was made and who it waited on; find what the assistant checked in Snowflake; find what a
  prototype skips and what Construction must add; find how work moves from the "?" menu; get back
  to a project from the side nav.
- **Success criteria:** at least 4 of 5 participants complete each task unaided; median SEQ of 5.5
  of 7 or better; no participant names an agent when asked what is happening; at least 4 of 5 can
  say which systems a step touched from its chips; time from a gate opening to its signature
  recorded; share of approvals with the evidence opened.
- **Vocabulary comprehension test** ("What happens when you click this?"), at least 8 of 10
  correct, covering Brief, Mockup, Prototype, Dev data, Handoff, Decision and the meaning of red.
- **Baseline interviews** with the people behind five recent requests handled through Excel,
  Tableau or an engineering ticket.
- **Tester feedback** every two weeks through the pilot, from in-product notes and a short call.
- Re-score the September 2026 audit at MVP ready.

## 15. Updates the design library will need

When this direction is accepted:

| File | Change |
|---|---|
| [principles.md](../design/principles.md) | Replace principles 1, 6 and 9 with "Outcome first", "Calm by default, detail on demand" (one "Show Technical Detail" preference replaces Simple and Detailed) and "UA precision, color with meaning"; fold 2, 3 and 8 into "One voice", "Evidence over documents" (which carries "No bulk approve") and "Motion encodes state change"; add "Red means you", "Teams is where you are asked; signing happens where the evidence is" and "Show, don't name"; keep 4, 5 and 7 (section 2) |
| [personas.md](../design/personas.md) | Replace test task 2 (naming the crew member); rename Approver to Business owner, Leadership viewer to Sponsor and SME to Contributor; add data owner, data steward, engineering reviewer, policy owner, platform admin, platform engineer and champion |
| [vocabulary.md](../design/vocabulary.md) | Point to the glossary in operating-model.md once the vocabulary test is done, and adopt the Title Case rule for UI words from [design-system.md section 4.3](design-system.md#43-case) |
| [patterns/bot-personas.md](../design/patterns/bot-personas.md) | Crew retired; agents appear only as marks and hues in Layers 2 and 3 and the audit trail; expressions, player cards and "the fifth player" parked |
| [patterns/visual-language.md](../design/patterns/visual-language.md) | Geist, stencil station names, the hazard stripe, the bento Home, the isometric crew and dither portraits superseded by [design-system.md](design-system.md) and section 7 |
| [patterns/canvas-and-diagrams.md](../design/patterns/canvas-and-diagrams.md) | Add the zoned layout, edge labels for what crosses, and Replay a request from section 8 |
| [patterns/approval-cards.md](../design/patterns/approval-cards.md) | The attestation sentence replaces hold-to-sign; the ticket stub becomes the timing slip; crew faces and the hazard band removed |
| [patterns/agent-states.md](../design/patterns/agent-states.md) | Crew eyes as the activity signal replaced by the line's shimmer, the three-dot loader, the status capsule and delegation states; stale rules and human waits from section 5 |
| New pattern files | `patterns/tool-chips.md`, `patterns/data-tables.md` and `patterns/timelines.md`, written from sections 7 and 8 |
| [asset-briefs.md](../design/asset-briefs.md) | Crew artwork briefs parked; a brand-marks brief replaces them |
| [roadmap.md](../design/roadmap.md) | UX work tracked against the phases in enterprise-plan.md |
