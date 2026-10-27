<!-- Point-in-time research, retrieved 2026-10-26 for the UA-DLC plan (round 8: how the leading AI work apps lay out their UI). Claims carry source links tagged [O] official, [T] third party or [M] measured; these apps move their sidebars and panels every few months, so verify before acting. Board screenshots are kept outside the repo. See README.md in this folder. -->
<!-- cspell:words Colab Krieger -->

# How the leading AI work apps lay out their UI, and what it means for HyperDelivery

> **Superseded in part (2026-10-26):** open question 1 is answered. Approval 1 now ends Ideation and signs the
> Brief and the mockup, approval 3 ends Inception, and the line's business labels are Discover, Plan, Prototype,
> Handoff rather than "Production (later)": Construction and Operations are outside HyperDelivery for now, and a
> Construction decision (AI-driven, AI-assisted with engineers, or not now) follows the handoff. The boards
> adopted the side nav at 248 px with a 64 px rail, and tiers became target tiers ("Target: T1 Team App") built
> in Construction. See [operating-model.md section 1](../operating-model.md#1-the-line) and
> [section 10](../operating-model.md#10-handoff-and-the-construction-decision).

| | |
|---|---|
| Status | Research and proposal for review, 2026-10-26. Not a decision. Feeds [ux-direction.md](../ux-direction.md) section 3 and [design-system.md](../design-system.md) section 7 |
| Question | How do ChatGPT, Claude, Gemini, Microsoft Copilot and the agentic builders lay out their apps in October 2026, and what information architecture would make HyperDelivery as simple as they are while it still carries work from an idea through three human approvals to a working prototype? |
| Scope | Desktop browsers, 1280 px and up, light theme only. Identity kept: Baselayer, ink with sparing red, the line and its three approvals |
| Method | Official help centers, docs and release notes read on 2026-10-26; third-party coverage only where official pages are silent (marked **[T]**). Two logged-out pages measured in a private headless Chrome at 1440 x 900 (marked **[M]**). No sign-in anywhere. The seven HyperDelivery boards were screenshotted at 1440 wide from the local site |
| Source tags | **[O]** official vendor page, **[T]** third party, **[M]** measured by us. Full list at the end |

## 1. What the leaders agree on

Eight products were read. Where they converge, the convergence is the lesson; a business user who has
used any of them already knows these moves.

1. **The sidebar starts with "New".** ChatGPT, Claude, Gemini and Microsoft Copilot all put "New chat"
   as the first row of the sidebar, a row with an icon rather than a large button. Search is the second
   row. Projects, a library of made things, and recents follow. Account and settings sit at the bottom.
2. **The sidebar is about 260 to 290 px and collapses to an icon rail.** ChatGPT measured 260 px
   expanded and a 55 px rail **[M]**; Gemini 288 px **[M]**. ChatGPT's desktop app, Claude Desktop and
   Lovable all toggle it with Cmd+B **[O]**. Lovable hides it entirely inside a project and reveals it
   on hover **[O]**.
3. **Mode choice is disappearing.** Anthropic merged Chat and Cowork into one conversation "so you don't
   need to decide which option better suits your task before getting started" **[O]**. ChatGPT keeps one
   Chat or Work toggle above the composer, and Microsoft keeps Chat, Cowork and Code, but both describe
   Work and Cowork as "describe the outcome, step away, review the result" **[O]**.
4. **Made things open beside the conversation, chat on the left.** Claude's artifacts, ChatGPT's file
   previews and canvas, Gemini's Canvas ("the Canvas panel on the right ... the chat on the left"),
   Copilot Pages ("Copilot Chat and Pages open side by side") and Lovable's preview all sit to the right
   of the chat **[O]**. Each also has a gallery in the sidebar: Claude's Artifacts tab, Gemini's Library,
   Copilot's Library, ChatGPT's Library and Space **[O]**.
5. **Long work shows a plan, then progress, then comes back to you.** Gemini Deep Research shows an
   editable plan before it starts and notifies you beside the thread when done **[O]**. Replit and Lovable
   ask you to approve a plan before building **[O]**. ChatGPT pins a goal progress row above the composer
   with pause, resume, edit and clear **[O]**. Claude and ChatGPT both keep work running in the cloud when
   you close the laptop **[O]**.
6. **"Needs you" is a status on the row, plus one view that collects it.** ChatGPT added an Activity view
   behind a bell for "work that needs your attention" **[O]**; Claude Desktop marks sessions that need input
   in the sidebar **[O]**; v0 shows streaming, waiting and ready on each sidebar row **[T]**; Copilot Cowork's
   My Tasks filters by "need your input, in progress, complete, scheduled" **[O]**.
7. **Asking a person is a card in the conversation, and writes always ask.** Copilot Cowork's approval
   shows a preview and a button named for the action ("Send", "Post", "Create") beside Cancel **[O]**.
   Lovable reads connected tools without asking and asks before it creates, sends or changes anything
   **[O]**. GitHub's cloud agent "asks permission before each write action" **[O]**. ChatGPT and Claude put the
   permission level in the composer (Ask for approval or Approve for me; Manual or Auto) **[O]**.
8. **Context is chosen in the composer, by "+" and by a mention.** Gemini's placeholder reads "Type @ for
   connectors, skills and more" **[M]**; ChatGPT uses "@" plus a plugin name **[O]**; Copilot uses "/" plus a
   file, person or meeting **[O]**; Lovable uses "@" for files and other projects **[O]**. Files, tools and
   research modes sit behind one "+" menu **[O]**.
9. **The empty state is one line, one composer, a few chips.** ChatGPT logged out: "Where should we
   begin?", a 768 px composer and a single "What can you do?" chip **[M]**. Gemini: a greeting line and a
   660 px pill composer **[M]**. Nothing else on the page.
10. **The keyboard is shared.** Cmd+K for search or commands, Cmd+Shift+O for a new chat on the web,
    Cmd+B for the sidebar, Cmd+/ for the shortcut list **[O]** (Gemini's pair is **[T]**).

**What this means for HyperDelivery:** a business user should meet a ChatGPT-shaped app (sidebar, one
composer, a conversation with its work beside it) whose one unfamiliar element is the line with its
three approvals. Today's boards invert that: they lead with a seven-item top bar, a separate Start page
with three tabs, a project page with eight tabs and a narrow assistant rail, and a separate Approval
screen.

## 2. App by app

Each entry uses the same fields so they can be compared. Dates are when the behavior was documented.

### 2.1 ChatGPT (web and the desktop app that absorbed Codex)

- **Shape of the product.** Since July 9, 2026 the Codex app is part of the ChatGPT desktop app. The
  product menu at the top left switches ChatGPT and Codex; inside ChatGPT a toggle "above the composer"
  switches Chat and Work **[O]**. Codex keeps a separate history **[O]**. ChatGPT Work "prefers nontechnical
  language and finished outputs" and hides "technical details like Git or shell commands"; Codex shows
  them **[O]**. That is HyperDelivery's "Show Technical Detail" split, made by OpenAI.
- **Sidebar items and order.** Logged out on the web: New chat, Search chats, Images, Plugins, Deep
  research, Settings, Help **[M]**. Signed in on desktop: New chat (with a Quick chat icon on hover),
  Search chats, Scheduled, Customize (Plugins, Skills), a Projects section, then Recents, where "Chat and
  Work chats appear together ... where you can sort, filter, and pin" **[O]**. Projects, Sites, Maps, GPTs
  and Pull requests moved under a "..." menu in build 26.924 (Sept 27, 2026) **[T]**. A bell opens the
  Activity view (July 30, 2026) **[O]**. The sidebar can show remaining Work usage (August 2026) **[O]**.
  User reaction to the redesign was largely negative because familiar items moved **[T]**: a caution about
  moving things people already know.
- **Width and collapse.** 260 px expanded, about 55 px as an icon rail **[M]**. Toggle with Cmd+B or
  Cmd+Shift+S on desktop **[O]**.
- **"New" as the primary action.** The first sidebar row, plus Cmd+N or Cmd+Shift+O on desktop and
  Cmd+Shift+O on the web **[O]**. No large "new" button anywhere.
- **Projects and recents.** A project keeps chats, files and instructions; on the web each project has a
  **Chats** section and a **Sources** section for uploaded files and connected context **[O]**. Pin a
  project to keep it near the top; pin, rename and archive chats; Archive chats per project **[O]**.
  Recents default to "Last updated"; Manual order is a choice **[T]**.
- **Artifacts beside the chat.** The desktop app "previews generated documents, presentations,
  spreadsheets, and PDF files alongside the chat", and can open a file automatically when a task
  finishes **[O]**. HTML previews switch between rendered and source **[O]**. Annotations let you point at
  part of a preview and ask for a change **[O]**. While a task runs, "the chat sidebar ... can surface the
  agent's plan, sources, generated files, and chat summary" **[O]**. Layout cycles through full view,
  split view and hidden tabs (Cmd+Shift+B); Cmd+Shift+F enters full view **[O]**. In Chat, canvas has
  version arrows and a Show changes button **[O]**. Space (DevDay 2026) holds Pages and Slides with
  "Request edits" on a selected element **[O]**.
- **Long-running work.** "ChatGPT shows its progress and pauses when it needs information or approval"
  **[O]**. `/goal` puts a progress row above the composer with pause, resume, edit and clear; a side chat
  gives a status recap without interrupting **[O]**. Cloud Work continues after the app closes and
  continues on web or phone **[O]**. Scheduled tasks run once, on a schedule, on an event or while
  monitoring **[O]**.
- **Asking a human.** An approval request in the chat; Enter approves and Esc declines **[O]**. The
  permissions control "below the composer" sets Ask for approval or Approve for me **[O]**. Pets and system
  notifications tell you "when a chat needs input or is ready for review" **[O]**.
- **Attachments and sources.** One "+" menu holds attach, Create image, Thinking, Deep research and Web
  search **[T]**. "To point ChatGPT to a specific tool, type `@` and the plugin name" **[O]**. Plugins such
  as Google Drive, SharePoint and Slack are installed from Customize **[O]**.
- **Empty home.** "Where should we begin?" centered, the composer at 768 px, one chip **[M]**.
- **Keyboard.** Cmd+K or Cmd+Shift+P command menu, Cmd+/ shortcuts, Cmd+B sidebar, Cmd+Shift+O new
  chat, Cmd+F find in chat, Cmd+Option+U Activity, Ctrl+1/2/3 Chat, Work, Codex **[O]**.

### 2.2 Claude (web and Claude Desktop)

- **Shape of the product.** The "new Claude experience" merges chat and Cowork into one conversation,
  rolling out to Pro and Max, and to Team and Enterprise where "Chat and Cowork unified" is on **[O]**.
  "Ask Claude for what you need, and it can decide which tool to use" **[O]**. On desktop the Code tab sits
  at the top of the sidebar **[O]**.
- **Sidebar items and order.** New chat, Search, Recents (quick questions and longer tasks in one list),
  Projects, Artifacts ("everything you make is saved to the Artifacts tab in your Claude sidebar"), and
  Customize (Connectors, Skills, Plugins) **[O]**. Desktop adds a Pinned list that shows its first 20 items
  with Show more, a Group and sort control on group headings, and a needs-input marker on sessions waiting
  for you **[O]**.
- **Width and collapse.** Cmd+B toggles the sidebar on desktop (Cmd+. was removed) **[O]**. Width is not
  documented and the web app needs sign-in, so it was not measured.
- **"New" as the primary action.** The first sidebar row; the home composer opens on the last mode used
  **[O]**.
- **Projects and recents.** "Keep files, instructions, and context together for related work. Projects
  work in every conversation" **[O]**. Cowork projects add their own memory **[O]**.
- **Artifacts beside the chat.** "It opens beside your conversation ... An artifact opens in its own
  window beside your conversation" **[O]**. Templates (Docs, Slides, Design, Dashboards, Motion) open on a
  canvas you edit directly; "highlight the text you want changed, click Edit with Claude" **[O]**. Versions
  come from editing an earlier message, which branches the chat with its own artifacts **[O]**. Export to
  Word, PDF, PowerPoint, Google Docs or HTML **[O]**. In the unified experience "files Claude creates
  appear alongside the conversation" **[O]**. Desktop panes (diff, terminal, plan, preview) can be dragged
  into any layout, opened in Split View or popped into their own window **[O]**. No split ratio is
  documented.
- **Long-running work.** Claude "analyzes your request and creates a plan"; "progress indicators show what
  Claude is doing at each step"; a live list of steps and progress notes follows the current step **[O]**.
  Work keeps running in the cloud; "when Claude finishes a task or needs your input, you'll get a
  notification on your phone" **[O]**.
- **Asking a human.** The permission setting in the message box is Auto (default on Pro, Max, Team) or
  Manual (default on Enterprise): Manual "asks before it takes actions, and you choose whether to allow
  each one" **[O]**. Tools a server marks as needing a person "ask only on the in-app card, so their
  notifications have no Allow button" **[O]**: approvals happen where the details are, not in a toast.
- **Attachments and sources.** The "+" below the input holds files, connectors and Research; connectors
  are managed in Customize > Connectors; there is no web search toggle any more because "Claude searches
  the web when it helps" **[O]**.
- **Empty home.** One home for chat and Cowork tasks with the composer at the center **[O]**.
- **Keyboard.** Cmd+B sidebar **[O]**; Claude Slides documents F6 between editor areas **[O]**. A full web
  shortcut list is not published on the help center; third-party lists disagree **[T]**.

### 2.3 Gemini (gemini.google.com and the apps)

- **Sidebar items and order.** Since the I/O 2026 "Neural Expressive" redesign (May 19, 2026): New chat,
  Search chats, Library (formerly My stuff), Gems, Notebooks, Recent; profile and settings at the bottom
  **[T]**. Library splits Media from Documents, where Deep Research reports and Canvas creations live
  (January 2026) **[T]**. Spark, the always-on agent, adds "Chat" and "Spark" tabs at the top of the
  drawer **[T]**.
- **Width and collapse.** 288 px expanded on the web, with a collapse toggle beside the logo **[M]**.
- **"New" as the primary action.** The first sidebar row; Cmd+Shift+O on the web **[T]**.
- **Projects and recents.** No projects; Gems (custom assistants) and Notebooks (shared with NotebookLM)
  hold reusable context **[T]**. Past research is found under Recent **[O]**.
- **Artifacts beside the chat.** Canvas opens as "the Canvas panel on the right" with "the chat on the
  left"; auto-saved; Previous and Next Version at the top; Code view and Show console; Select and ask on
  an app, select-and-prompt in a doc; Share and export to Docs, Slides or Colab **[O]**.
- **Long-running work.** Deep Research drafts a plan; you can Edit plan, then Start research; it takes
  "about 5-10 minutes"; you can leave and are notified "next to the chat thread with your completed
  report" **[O]**. Spark shows live task progress and "will have you confirm high-stakes actions like
  sending emails or spending money" **[T]**. Daily Brief sits in the side panel with "Top of mind" actions
  **[T]**.
- **Attachments and sources.** The pill composer's "+" (Upload and tools) holds files, Drive and
  Notebooks, then tools such as Deep research and Canvas; Deep Research has a Sources picker (Search,
  Gmail, Drive) **[O]**. The placeholder teaches the mention: "Type @ for connectors, skills and more"
  **[M]**. The model picker sits in the composer **[M]**.
- **Empty home.** A greeting at the center over the 660 px pill composer, on a gradient **[M][T]**.
- **Keyboard.** Cmd+Shift+O new chat and Cmd+Shift+K search **[T]**; Cmd+Shift+D dictate **[M]**.

### 2.4 Microsoft Copilot app (formerly Microsoft 365 Copilot app)

- **Sidebar items and order.** "Three experiences in the left navigation, along with New chat, Search,
  Library, Agents and Skills, and Notebooks": Chat, Cowork and Code **[O]**. A waffle menu at the top of the
  pane launches Outlook, Word, Excel, PowerPoint and Teams; name and avatar sit at the bottom with a
  "Work" or "Personal" label; agents, apps and chats can be pinned to the pane **[O]**. Notebooks expands to
  a list with a "+" beside it **[O]**. Library "centralizes Copilot-generated content like images and Pages"
  **[O]**. The built-in sections cannot be reordered **[T]**.
- **"New" as the primary action.** "New chat" in the pane **[O]**.
- **Projects and recents.** Notebooks are the project: "Bring together all your relevant resources
  including Copilot Chat, files, pages, meeting notes, links, and more in one place", shared in real time,
  with References and custom instructions **[O]**.
- **Artifacts beside the chat.** Pages open "side by side" with Copilot Chat; a response becomes a Page
  through "Edit in Pages"; Pages are shared, co-edited and can hold charts and lightweight apps **[O]**.
  Cowork's right side panel shows the task **Progress**, the **Input folder** and the **Output folder**;
  each output has Preview and Download, opens inline, full screen or in its native app **[O]**.
- **Long-running work.** Cowork reports "progress updates or intermediate results"; pause "to finish the
  current step, or immediately", resume or cancel; My Tasks filters by needs input, in progress, complete
  and scheduled **[O]**.
- **Asking a human.** "The approval dialog shows a preview of what Cowork plans to do and a button labeled
  with the specific action" (Send, Post, Create) plus Cancel. Approval is required for actions involving
  other people, money, personal information and account changes **[O]**.
- **Attachments and sources.** "Type a forward slash (`/`) and then the name of a file, person, or meeting
  to point Copilot to the source you mean" **[O]**. A **Work IQ** control at the top of Chat turns
  organizational data on (default) or off, beside an **Auto** model picker **[O]**.
- **Empty home.** Cowork home: chat input, suggested prompts and recent tasks **[O]**.
- **Why it matters for UA.** Under Armour runs on Microsoft 365. Its people will compare HyperDelivery
  with this app first, and its "/" mention, Notebooks-as-project and action-named approval button are the
  conventions they will bring.

### 2.5 Lovable (agentic builder)

- **Layout.** "You describe what you want in the chat panel on the left, and you watch your app take
  shape in the preview on the right" **[O]**. Hide chat panel (Cmd+B) gives the preview the full window
  **[O]**.
- **Sidebar.** Hidden inside a project; the menu icon reveals it on hover or pins it **[O]**. Its items:
  workspace switcher, Dashboard, Chats, Search, Connectors, Projects, Starred, Recents (filter All, Chats,
  Projects), user menu at the bottom **[O]**.
- **Tabs for the made thing.** Preview, Files, Code, and More; More lists Analytics, Database, Users,
  Storage, Security, Usage and Settings, and "sections tied to a feature appear once you use it" **[O]**:
  progressive tabs. History (versions, restore, bookmarks) sits beside the project name **[O]**.
- **Approvals and plans.** Chat, Plan and Build modes (Option+P cycles); Plan mode writes "a plan you edit
  and approve before building" **[O]**. Connectors: "Lovable reads from a connected tool without asking,
  and asks for your approval before it creates, sends, or changes anything" **[O]**.
- **Context.** "@" references files and other projects **[O]**. Cmd+K command palette **[O]**.

### 2.6 v0 (Vercel)

- **Sidebar.** Chats grouped by project, each with a live status (streaming, waiting, ready) and a hover
  card that previews the site, changed files and branch, and "how a turn ended, including the closing
  summary or the question on which v0 is waiting" (August 2026) **[T]**.
- **In-chat sidebar.** Design Mode, Integrations, Environment Variables and Project Rules in one panel
  beside the chat **[T]**. Design Mode (Option+D) edits a selected element of the live preview and writes it
  back to code **[O]**.

### 2.7 Replit Agent

- **Plan, then build.** The Plan toggle sits "at the bottom right of the chat input". A plan arrives as a
  task list with **Revise**, **Cancel**, **Build in background** and **Build here**; before the first
  checkpoint the button is **Start building** **[O]**.
- **Progress and undo.** "Monitor Agent's progress as it works through the task list. Each completed task
  creates a checkpoint, so you can review changes and roll back" **[O]**.

### 2.8 GitHub Copilot app (technical preview since June 2, 2026)

- **One view of everything in motion.** "From a single **My Work** view, you can see work in motion ...
  active sessions, issues, pull requests, and background automations" **[O]**.
- **Chat for instruction, canvas for the work.** A canvas "might show a plan, pull request, browser
  session, terminal, deployment, dashboard, or workflow state"; agents update it as they work and people
  "edit, reorder, approve, or redirect that work on the same surface" **[O]**.
- **Approvals.** "By default, the cloud agent asks permission before each write action. Switch to
  autopilot once you have established trust" **[O]**.

## 3. Side by side

| | ChatGPT | Claude | Gemini | Microsoft Copilot | Builders (Lovable, v0, Replit, GitHub) |
|---|---|---|---|---|---|
| First sidebar row | New chat | New chat | New chat | New chat | Dashboard or projects; New inside the editor is the chat itself |
| Sidebar width | 260 px, 55 px rail **[M]** | Not measured | 288 px **[M]** | Not measured | Lovable hides it in the editor |
| Collapse | Cmd+B | Cmd+B | Toggle | Pane toggle | Cmd+B (Lovable) |
| Where work is grouped | Projects (Chats, Sources) | Projects (files, instructions, memory) | Gems, Notebooks | Notebooks (References) | Projects |
| Gallery of made things | Library, Space | Artifacts tab | Library (Media, Documents) | Library, Pages | History, Files |
| Made thing beside chat | Preview pane, split, full view | Artifact beside chat, panes | Canvas on the right | Pages side by side; Cowork side panel | Preview on the right with tabs |
| Mode choice | Chat or Work toggle | None (unified) | Chat or Spark | Chat, Cowork, Code | Chat, Plan, Build |
| Progress | Goal row above composer | Live step list | Plan, then notification | Progress panel, My Tasks | Task list with checkpoints |
| "Needs you" collected | Activity view (bell) | Needs-input marker | Notification by the thread | My Tasks filter | Row status (v0), My Work (GitHub) |
| Approval | Card; Enter or Esc | In-app card; Auto or Manual | Confirm high-stakes (Spark) | Dialog with action-named button | Plan approval; ask before writes |
| Context in composer | "+", "@plugin" | "+", connectors | "+", "@" | "/" file, person, meeting; Work IQ | "@" files, projects |
| Empty state | Line, composer, 1 chip | One home composer | Greeting, pill composer | Input, prompts, recent tasks | The chat panel |

## 4. What today's boards do (seven boards at 1440)

Screenshots of the seven boards (Main, Project, Start, Inbox, Projects, Gate, Activity) are kept outside the repo.

1. **Navigation is a seven-zone top bar.** Lockup, workspace switcher, six areas (Home, Projects, Inbox,
   Library, Portfolio, Admin), search, Start a Project, "?" and avatar compete in one 56 px row. Nothing
   in it shows the projects a person is working on, so every return trip goes through a list.
2. **Home is a dashboard, not a starting point.** "Needs You" (four rows), My Projects (four 220 px cards
   in a two-column grid) and a "Shipped Across UA This Week" rail whose two items leave about 1,600 px of
   empty column under them at 1440 x 2400. There is no composer on Home; starting means leaving for Start.
3. **Start is a separate page with three tabs** (Describe It, From a Jira Ticket, Point at What You Have).
   The tabs ask the person to classify their input before typing, which is the mode choice the leaders
   are removing; a pasted Jira key or link can be recognized instead.
4. **The project page has eight tabs and a narrow assistant rail on the right.** Document, Plan, Preview,
   Data, Sources, Memory, Activity, Architecture; the rail is about 280 px with its composer at the bottom
   of a tall column. The conversation, which is how every leading app is driven, is the smallest thing on
   the screen, and on the Activity tab it disappears.
5. **Approval is its own screen (Gate).** It repeats the project header and the line, then evidence,
   numbers check, what it skips, who signs and the Decision card. Good content, but it is a second place
   for the same project, reached from the Inbox.
6. **Inbox and Home repeat each other.** The same four rows appear on both.
7. **What works and should stay.** The line in the header; red only for "waits on you"; question rows
   answered in place with answer chips; the Decision card with attestation and an inactive Sign until
   checked; brand marks on chips; split times; "What It Skips"; the provenance strip; the Projects table
   with the mini line.

## 5. Proposed information architecture

### 5.1 The line under the clarified stage definitions

The owner aligned with the other team on what each phase hands over: **Ideation** produces a visual
mockup that supplements the Brief and Research; **Inception** produces a prototype, at most on a hosted
sandbox with dev data; **Construction** produces a production-ready version on production data
connections. The build stops at the end of Inception for now, and how work moves to production (fully
AI-driven, or AI-assisted with engineers) is decided later because it touches production systems and data.

Proposed Layer 1 reading of the line, so each segment is named by what the person gets:

```
  Mockup ─────────■────────── Plan ─────────■──────── Prototype ────────■ - - - - Production (later) - - -
            What We're Building        The Plan           The Working Prototype      Hand to Production
            (Brief, Research,          (Requirements,     (sandbox, dev data,        (dashed: decided later,
             Mockup)                    Stories, Tech      evidence per criterion)    AI-driven or with engineers)
                                        Design, Test Plan,
                                        Tickets)
```

- The three approvals keep their names and remain the product's signature; only where approval 3 sits
  moves: it now closes Inception and accepts a sandbox prototype on dev data, not a deployed build.
- Construction and Operation stay in Layer 2 and the plan as the future path; the fourth segment is drawn
  dashed with the label "Production (Later)" so nobody reads the prototype as production.
- The provenance strip on every prototype reads "Sandbox, dev data" in this phase.
- This changes [operating-model.md section 1](../operating-model.md#1-the-line)
  (approval 1 currently sits after Stories, approval 3 after the QA steps). It needs the plan owner's
  sign-off; an alternative that moves less keeps approval 1 after Stories and only relabels the segments.

### 5.2 The side nav

A left sidebar replaces the top bar. 256 px expanded, a 56 px icon rail collapsed, Cmd+B to toggle,
remembered per person. Inside a project it collapses to the rail by default (Lovable's pattern) and opens
as an overlay on hover, so the conversation and the work get the width.

```
┌──────────────────────────┐
│ [UA] HyperDelivery    «  │  lockup links Home; « collapses to the rail
│                          │
│ +  New Project    ⌘⇧O    │  first row, like every chat app
│ ⌕  Search          ⌘K    │  projects, facts, people, actions
│ ⌂  Home                  │
│ ▣  Inbox          ■ 4    │  red count only when something waits on you
│ ▤  Projects              │
│ ▥  Library               │  Enterprise; hidden until it ships
│                          │
│ Pinned                   │  up to 5, drag to order
│ ■  SKU workbench         │  red square: waiting on you
│ ●  Tariff planner        │  shimmer dot: working
│ Recent                   │  last 8, by last activity
│ ◷  Product master qual.  │  clock: waiting on someone 2+ business days
│ ✓  Activation scorecard  │  check: prototype accepted
│                          │
│ Manage                   │  shown only to these roles
│ ▦  Portfolio             │  sponsors and leads
│ ⚙  Admin                 │  Platform Admin, Governance Admin
│                          │
│ ?  Help                  │  the existing Help menu
│ (MC) Maya Chen           │  account menu: workspace, Show Technical
│      Merchandising ▾     │  Detail, Sign Out
└──────────────────────────┘
```

| Group | Items | Who sees it | Notes |
|---|---|---|---|
| Start | New Project, Search | Everyone who may start; Search for all | New Project opens Home with the composer focused, like New chat |
| Places | Home, Inbox, Projects, Library | Everyone (Library in Enterprise) | Four places, one count, fixed order |
| Your work | Pinned, Recent | Everyone with projects | Each row: status glyph, name; hover card shows the mini line, who it waits on and the next step (v0's hover card) |
| Manage | Portfolio, Admin | Role-gated by Entra group | Absent, not disabled, for everyone else |
| Footer | Help, account with workspace | Everyone | The workspace switcher moves out of the bar into the account block (Lovable and Copilot put identity here) |

Rows are 36 px, Label SM, the active row Bold with an ink selection outline; status glyphs follow the
red rule. The rail shows the same icons with tooltips and keeps the red count on Inbox.

### 5.3 Home: one question, one composer, what waits on you

```
┌──────┬──────────────────────────────────────────────────────────────────────────────┐
│ nav  │                                                                              │
│      │                       What Do You Want to Make?                              │
│      │     ┌────────────────────────────────────────────────────────────────┐       │
│      │     │ Describe the problem, who has it, and what would help.         │       │
│      │     │ [Teams: Oct 21 working session · Indexed] [MERCH-1182 · Read]  │       │
│      │     │ +   @                       Merchandising ▾        Start  →    │       │
│      │     └────────────────────────────────────────────────────────────────┘       │
│      │     [Finance: Flag late vendor invoices] [Stores: Plan weekly labor] [+4]    │
│      │                                                                              │
│      │     Waiting on You                                          Open Inbox (4)   │
│      │     ■ Your Approval: The Plan   SKU workbench    1d 4h    [Review and Sign]  │
│      │     ■ Which level counts as one style?   [Style] [Style-Color] [Article]     │
│      │     ■ Confirm What We Heard   SKU workbench      20m      Review Facts       │
│      │                                                                              │
│      │     Your Projects                                           All Projects     │
│      │     SKU workbench      ─■─■- - -□- -   Your approval: The Plan    20m ago    │
│      │     Tariff planner     ─■─■━━━□- -    Building 3 of 8             3h ago     │
│      │     Product master     ─□- - -□- -    Waiting on Dana, 2d         42m ago    │
└──────┴──────────────────────────────────────────────────────────────────────────────┘
```

- **The composer is the start.** Start and First run merge into Home. The composer is about 720 px wide,
  centered, with the page's one question as its headline (no greeting banner, no KPI tiles). When nothing
  waits and there are no projects, the composer sits at the vertical center, as in ChatGPT and Gemini.
- **No tabs before typing.** A pasted Jira key or URL unrolls into the ticket card; a pasted Teams,
  OneDrive, SharePoint, Confluence or Excel link unrolls into a resource chip with its logo, owner and
  state (Reading, Indexed, Snapshot, Needs Access, Blocked by a Microsoft 365 Setting).
- **"+" opens:** Add a Link, Add Files, Start From a Jira Ticket, and Browse Sources (Teams recordings,
  OneDrive, SharePoint, Confluence, Jira, Snowflake). **"@" mentions** people and sources in one grouped
  list (people first, then each source with its logo). There is no model picker.
- **Starters:** at most six function starters, one row, with "+4" to see the rest. Picking one fills the
  composer; it never submits.
- **After Start**, the follow-on choices (kind of project, how thorough with its time cost, a starting
  look, who should be involved) arrive as question cards inside the new project's conversation, one at a
  time, each with a Recommended option, rather than as a long form.
- **Waiting on You:** at most three rows, oldest first, the same row component as the Inbox; hidden when
  empty, replaced by one quiet line: "Nothing waiting on you. New approvals and questions also arrive in
  Teams."
- **Your Projects:** at most three compact rows with the mini line and one status line, not cards;
  hidden when the person has none. Everything else is in the sidebar and Projects.
- **Dropped from Home:** "Shipped Across UA This Week" (it moves to Library as Recently Accepted, where
  it already exists), the two-column project cards and the right rail.

### 5.4 The project workspace: conversation plus artifact panel

```
┌──┬────────────────────────────────────────────────────────────────────────────────────────┐
│≡ │ Projects / Merchandising                                                               │
│+ │ SKU productivity workbench   T1 Team Prototype                   (MC)(LR)(PN) +3  Share│
│⌕ │ Mockup ──────■ What We're Building ── Plan ──■ Your Approval: The Plan - - Prototype - □ - Production (later) │
│⌂ ├──────────────────────────────────┬─────────────────────────────────────────────────────┤
│▣4│ Since You Left: plan drafted,    │ Brief  Mockup  Plan  Data  Sources 6  Decisions 3  ▾│
│▤ │ 2 reviews passed                 │                         Version 3, Oct 24 ▾   ⤢   × │
│  │                                  │                                                     │
│  │ HyperDelivery                    │  What You'll Get | What It Skips | What Data It Uses│
│  │ The plan is ready: 8 pieces...   │                                                     │
│  │ [❄] Checked margin per door  14s │  [ clickable mock of the SKU workbench ]            │
│  │     3 certified views, 0 rows    │                                                     │
│  │ ┌────────────────────────────┐   │                                                     │
│  │ │■ Your Approval: The Plan   │   │                                                     │
│  │ │ Second of three · 1d 4h    │   │                                                     │
│  │ │ [Review and Sign]          │   │                                                     │
│  │ └────────────────────────────┘   │                                                     │
│  │ Maya: Can each flag explain...   │                                                     │
│  │                                  │                                                     │
│  │ ▸ Waiting on you · The Plan      │  progress row: step and count, Pause, Stop          │
│  │ ┌──────────────────────────────┐ │                                                     │
│  │ │ Ask or tell HyperDelivery    │ │                                                     │
│  │ │ +  @  /                    → │ │                                                     │
│  │ └──────────────────────────────┘ │                                                     │
└──┴──────────────────────────────────┴─────────────────────────────────────────────────────┘
 56            480 (400 min)                      flex, about 900 at 1440
```

- **Two panes, chat on the left.** Every reference product puts the conversation left and the made thing
  right, so HyperDelivery follows the convention its users already know. Today's right-hand rail moves
  left and widens to about 480 px (400 minimum); the artifact panel takes the rest.
- **The header is compact and the line is the map.** Breadcrumb, title, tier, avatars and Share in one
  row, then the full-width line. Clicking a segment or an approval notch opens its artifact (Mockup,
  Plan, Prototype) or its decision, so the line doubles as the table of contents.
- **The conversation carries Layer 1.** The assistant's messages; delegations as collapsed tool-call
  groups with logos (unchanged from ux-direction section 8); "Since You Left" at the top when returning;
  question cards with answer chips, "Not Me, Suggest Who" and "I Don't Know"; approval cards; failures
  with one action. One **progress row** is pinned above the composer ("Building: 3 of 8 pieces, about 2
  hours left", Pause, Stop), as in ChatGPT's goal row. Work continues when the person leaves.
- **The artifact panel holds every made thing, as tabs that appear when they exist:**

| Tab | Holds | Appears |
|---|---|---|
| Brief | The living document, Research summary, margin questions, "Open in Confluence" | From the first message |
| Mockup | The Ideation mockup, marked "Shape, Not Final", and the visual choices behind it | When the first mockup is drawn |
| Plan | Requirements, stories and criteria, tech design summary, test plan, tickets, the consequence line, the clickable mock | Inception |
| Prototype | The sandbox preview with its provenance strip ("Sandbox, dev data"), version, "Open in New Tab", point-and-say notes | When the first piece builds |
| Data | The data map: objects, definitions, query ids, never rows; certified views; who ratified | When data is discovered |
| Sources | What the project points at with index states, and What HyperDelivery Knows (today's Memory tab merged in), with "Test a Question" | From the first pointed link |
| Decisions | Decision records (Open, Settled) and the signed approvals with split times and "Changes Since Approval" | From the first decision |
| More ▾ | Timeline (today's Activity: Where It Stands, Where the Time Went), Architecture, and Trace with Show Technical Detail on | Timeline always; the rest by role or preference |

- **Versions, full view, close.** A version menu on every tab ("Version 3, Oct 24"); "Changes Since
  Approval" as a count beside it. ⤢ (Cmd+Shift+F) hides the conversation to a 56 px strip that keeps an
  Ask button; × closes the panel and the conversation goes full width at a readable 720 px column. The
  splitter drags, with snaps at 40/60 and 50/50.
- **At 1280 px** the artifact panel opens full width and the conversation becomes a 400 px overlay from
  the Ask button, so the prototype is never squeezed into a third of the screen (ux-direction section 3).
- **One project, one place.** The Approval screen, Confirm What We Heard and Needs Attention stop being
  separate pages and become views of this workspace (section 5.6).

### 5.5 Where approvals and questions appear

| Surface | Approval | Question | Confirmation (What We Heard) |
|---|---|---|---|
| Conversation | A card: decision label, "second of three", the wait, "Review and Sign", which opens the Decision view in the artifact panel | A card with answer chips, "Not Me, Suggest Who", "I Don't Know"; answered in place | A card with the count to review; opens Sources > What We Heard |
| Artifact panel, Decision view | Evidence per criterion, numbers check, What It Skips, who signs, the Decision card with attestation; the button names the action ("Approve the Plan", "Accept Version 4") | n/a | Facts with Confirm or Correct; "Finish Review" inactive until all are handled |
| The line | Solid red notch: "Your Approval: The Plan" | n/a | n/a |
| Inbox | A row, oldest first; "Review and Sign" deep-links to the Decision view | A row answered in place with the same chips | A row with "Review Facts" |
| Sidebar | Red count on Inbox; red square on the project row | Same | Same |
| Home | Up to three Inbox rows | Same | Same |
| Teams | The approval card opens the Decision view; signing happens there | Answered inside the card | Link to the review |

One item, one state: answering in Teams, the Inbox or the conversation clears it everywhere. The
breadcrumb keeps where the person came from ("Inbox / SKU productivity workbench").

### 5.6 Screens to merge, keep or drop

| Today's board | Proposal |
|---|---|
| Top bar (all screens) | **Replace** with the side nav (5.2). Search moves to the sidebar and Cmd+K; "Start a Project" becomes New Project; workspace moves to the account block |
| Main (Home) | **Rework** as composer-first Home (5.3). Drop "Shipped Across UA This Week" from Home; project cards become three compact rows |
| Start | **Merge into Home.** Its three tabs go; the composer recognizes Jira keys and links. Follow-on choices become question cards in the new project |
| FirstRun | **Merge into Home** as its empty state, with one "See How It Works (2 min)" link |
| Project | **Rework** as conversation plus artifact panel (5.4). Eight fixed tabs become seven that appear as artifacts exist, plus More |
| Gate (Approval) | **Merge into Project** as the Decision view of the artifact panel; same content, one place per project |
| Activity | **Move** to More > Timeline. Layer 1 narration lives in the conversation; "needs a look" becomes a card there and an Inbox row |
| ContextReview (Confirm What We Heard) | **Merge into Project** as a view of Sources, opened from its Inbox row or card |
| Failures (Needs Attention) | **Merge**: each failure is a card in its project's conversation; Projects gets a "Needs Attention" filter chip |
| Inbox | **Keep**, same rows as Home; filter chips stay |
| Projects | **Keep** the table; consider showing Cost only to leads or with Show Technical Detail |
| Library, Portfolio, Admin, Graduation | **Keep** (Enterprise). Library gains Recently Accepted from Home; Portfolio and Admin move to the Manage group; Graduation becomes the future "Hand to Production" decision view |
| Lifecycle, PlatformArchitecture | **Keep** behind Help |
| Huddle, TeamsCards | **Keep**; they live in Teams |

### 5.7 Keyboard

| Keys | Does | Precedent |
|---|---|---|
| Cmd+K | Search and commands | ChatGPT, Lovable, today's boards |
| Cmd+Shift+O | New Project | ChatGPT and Gemini on the web |
| Cmd+B | Show or hide the side nav | ChatGPT desktop, Claude Desktop, Lovable |
| Cmd+Shift+F | Artifact full view; Esc returns | ChatGPT desktop |
| Cmd+/ | Keyboard shortcuts | ChatGPT |
| Up arrow | Restore the last composer message when empty | ChatGPT |
| (none) | Signing an approval | Deliberately no shortcut: the attestation checkbox and the named button are the signature |

## 6. The 10 rules that keep it simple

1. **Start with words, not choices.** One composer is the only way in; no tabs, modes or project types
   before the first message. The assistant asks what it needs, one card at a time.
2. **Five places, one count.** New Project, Search, Home, Inbox, Projects (Library when it ships). Roles
   add Portfolio and Admin; nobody sees a place they cannot use.
3. **One conversation, one artifact panel.** Every project is those two panes. Anything else is a tab in
   the panel or a message in the conversation; there is no third pane by default.
4. **Tabs appear when the thing exists, and the line is the map.** No empty tabs. Clicking the line opens
   the artifact or decision at that point.
5. **Red means you, in the same four places.** Inbox count, project row, line notch, card. Nowhere else.
6. **Sign where the evidence is.** Approvals open in the artifact panel beside the evidence, the button
   names the action, and there is no modal, no bulk approve and no one-key approve.
7. **Ask once, answer anywhere.** A question is the same item in the conversation, the Inbox and Teams;
   answering it in one place clears it in all three.
8. **Point, don't upload.** "+" and "@" in the composer reach Teams recordings, OneDrive, SharePoint,
   Confluence, Jira and Snowflake; each becomes a chip with its logo, owner and state.
9. **Progress is one row, and work survives leaving.** Step and count above the composer, never a
   percentage; Pause and Stop beside it; "Since You Left" on return.
10. **Every block earns its place; machinery is opt-in.** No feed, showcase or KPI cards on working
    screens. Tool groups start collapsed; Timeline detail, Architecture, Trace and model names follow
    role and "Show Technical Detail".

## 7. What HyperDelivery deliberately does not copy

- **Enter to approve.** ChatGPT approves a request with Enter **[O]**. HyperDelivery's approvals are
  signatures bound to an artifact version, so they keep the attestation and the named button.
- **An Auto mode for approvals.** Claude's Auto and ChatGPT's Approve for me hand tool permissions to an
  automated reviewer **[O]**. Tool-level writes inside HyperDelivery stay gated by the approval that
  authorizes them; the three approvals are never automatic.
- **Moving familiar items without warning.** ChatGPT's September sidebar move drew complaints **[T]**. The
  move from the top bar to the side nav should ship with a one-time "Where things moved" note and keep
  the same names.
- **A model picker.** Every reference app has one; HyperDelivery's users should not need to know which
  model runs (ux-direction section 7).
- **Generic chrome.** The sidebar, composer and panel follow the convention; the line, its split times
  and the red rule are what make the product recognizable at a glance.

## 8. Open questions for the owner

1. Approve the relabeled line (Mockup, Plan, Prototype, Production later) and the move of approval 3 to
   the end of Inception, or keep approval 1 after Stories and relabel only.
2. Should the sidebar collapse to the rail by default inside a project at 1440, or stay open?
3. Should Home show "Your Projects" at all, given the sidebar lists Pinned and Recent? (Proposed: yes,
   three rows with the mini line, because the line is the product's signature.)
4. Is "@" for people and sources together acceptable, or do Microsoft users expect "/" for files and
   meetings? (Copilot uses "/" **[O]**; HyperDelivery's boards use "/" for actions today.)

## Sources

All read on 2026-10-26 without signing in.

**ChatGPT and OpenAI**
- [O] OpenAI Help Center, "ChatGPT Work and Codex": https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
- [O] ChatGPT docs, desktop app: https://learn.chatgpt.com/docs/app
- [O] ChatGPT docs, Use ChatGPT (Chat, Work, Codex comparison; progress and approvals): https://learn.chatgpt.com/docs/use-chatgpt
- [O] ChatGPT docs, Get started with ChatGPT Work: https://learn.chatgpt.com/docs/get-started-with-work
- [O] ChatGPT docs, Work with files (artifacts viewer, annotations, chat sidebar): https://learn.chatgpt.com/docs/artifacts-viewer
- [O] ChatGPT docs, Long-running work (goal progress row): https://learn.chatgpt.com/docs/long-running-work
- [O] ChatGPT docs, Projects and chats: https://learn.chatgpt.com/docs/projects
- [O] ChatGPT docs, Permissions: https://learn.chatgpt.com/docs/permission-modes
- [O] ChatGPT docs, Commands and keyboard shortcuts: https://learn.chatgpt.com/docs/app/commands
- [O] ChatGPT docs, What's new (Activity view July 30, Codex merge July 9, Space, Plugin Extensions): https://learn.chatgpt.com/docs/whats-new
- [O] ChatGPT docs, Get started with ChatGPT Space: https://learn.chatgpt.com/docs/space/getting-started
- [O] OpenAI Help Center, canvas (version arrows, Show changes; read through the help-lb.openai.com mirror via search, the main page did not render): https://help.openai.com/en/articles/9930697-what-is-the-canvas-feature-in-chatgpt-and-how-do-i-use-it
- [O] OpenAI Help Center, finding chats, projects and files (sidebar search): https://help.openai.com/en/articles/10056348-finding-your-chats-projects-and-files-in-chatgpt
- [T] OpenAI Developer Community, "ChatGPT Desktop 26.924 sidebar redesign", Sept 27, 2026: https://community.openai.com/t/chatgpt-desktop-26-924-sidebar-redesign-some-missing-features-are-still-there-just-moved/1401386
- [T] TechRadar on the desktop update and user reaction (page blocked to our fetcher; claim taken from the search result summary): https://www.techradar.com/ai-platforms-assistants/christ-almighty-this-is-so-bad-chatgpts-big-app-update-brings-huge-changes-to-your-workflows-and-users-seem-to-hate-it
- [T] AI UX Playground, ChatGPT composer teardown ("+" menu contents): https://aiuxplayground.com/teardowns/chatgpt/composer
- [M] chatgpt.com logged out, headless Chrome 1440 x 900: sidebar 260 px expanded, about 55 px rail, composer 768 px, one chip

**Claude and Anthropic**
- [O] Claude Help Center, "Claude Cowork and chat are one Claude": https://support.claude.com/en/articles/16761823
- [O] Claude Help Center, artifacts: https://support.claude.com/en/articles/9487310
- [O] Claude Help Center, Get started with Claude Cowork (progress, permission modes): https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork
- [O] Claude Help Center, Use Claude Cowork on web, desktop and mobile: https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile
- [O] Claude Help Center, live artifacts in Cowork (Artifacts in the sidebar): https://support.claude.com/en/articles/14729249-use-live-artifacts-in-claude-cowork
- [O] Claude Desktop and Cowork changelog (Pinned list, Group and sort, needs-input marker, Cmd+B, Split View, in-app approval cards): https://claude.com/docs/cowork/changelog
- [O] Claude Code Docs, desktop quickstart (Code tab, panes, permission modes): https://code.claude.com/docs/en/desktop-quickstart
- [T] Mike Krieger on X, Chat and Cowork share one home tab: https://x.com/mikeyk/status/2074531605537046953

**Gemini and Google**
- [O] Gemini Help, Canvas: https://support.google.com/gemini/answer/16047321
- [O] Gemini Help, Deep Research: https://support.google.com/gemini/answer/15719111
- [T] 9to5Google, Gemini app "Neural Expressive" redesign, Spark and Daily Brief, May 19, 2026: https://9to5google.com/2026/05/19/gemini-app-google-io-2026/
- [T] 9to5Google, Documents history for Deep Research and Canvas, Jan 13, 2026: https://9to5google.com/2026/01/13/gemini-documents-history/
- [T] Shortcut references for Gemini web (Cmd+Shift+O, Cmd+Shift+K): https://fastshortcuts.com/shortcuts/gemini/
- [M] gemini.google.com logged out, headless Chrome 1440 x 900: sidebar 288 px, composer 660 px, "Type @ for connectors, skills and more"

**Microsoft Copilot**
- [O] Get started with Microsoft Copilot (left navigation, Work IQ, "/" references): https://support.microsoft.com/en-us/microsoft-365-copilot/get-started-with-microsoft-365-copilot-chat
- [O] Get started with the Microsoft Copilot app (navigation pane, pinning, waffle): https://support.microsoft.com/en-us/microsoft-365-copilot/what-is-microsoft-copilot-app
- [O] Get started with Copilot Cowork: https://support.microsoft.com/en-us/microsoft-365-copilot/get-started-with-cowork
- [O] Take control of Cowork actions before they run (approval dialog, side panel): https://support.microsoft.com/en-us/microsoft-365-copilot/cowork-take-control-actions
- [O] Manage tasks and schedule prompts in Cowork (My Tasks filters): https://support.microsoft.com/en-us/microsoft-365-copilot/cowork-manage-tasks-schedule-prompts
- [O] Get started with Copilot Pages: https://support.microsoft.com/en-us/microsoft-365-copilot/get-started-with-microsoft-365-copilot-pages
- [O] Get started with Copilot Notebooks: https://support.microsoft.com/en-us/microsoft-365-copilot/get-started-with-microsoft-365-copilot-notebooks
- [O] Pin Copilot Chat in the Microsoft 365 apps (app items): https://learn.microsoft.com/en-us/microsoft-365/copilot/pin-copilot-chat-navbar
- [T] Microsoft Q&A, left pane cannot be reordered: https://learn.microsoft.com/en-us/answers/questions/5872558/microsoft-365-copilot-menu-left-pane

**Agentic builders**
- [O] Lovable docs, editor map: https://docs.lovable.dev/features/projects/editor
- [O] Lovable docs, Chat mode (modes, connector approvals, "@"): https://docs.lovable.dev/features/chat-mode
- [O] Lovable docs, preview: https://docs.lovable.dev/features/projects/preview
- [O] v0 docs, Design mode: https://v0.app/docs/design-mode
- [T] Create With, v0 sidebar with project groups and live status: https://www.createwith.com/tool/v0/updates/v0-introduces-new-sidebar-with-project-groups-and-live-status
- [T] Create With, v0 in-chat sidebar: https://www.createwith.com/tool/v0/updates/v0-brings-project-controls-into-its-new-in-chat-sidebar
- [O] Replit docs, Plan vs. Build mode: https://docs.replit.com/learn/plan-vs-build-mode
- [O] Replit docs, Agent (checkpoints): https://docs.replit.com/core-concepts/agent
- [O] GitHub Blog, "GitHub Copilot app: The agent-native desktop experience", June 2, 2026: https://github.blog/news-insights/product-news/github-copilot-app-the-agent-native-desktop-experience/

**HyperDelivery inputs**
- [ux-direction.md](../ux-direction.md) (v3, 2026-10-26), [design-system.md](../design-system.md) section 7,
  [operating-model.md](../operating-model.md) sections 1 and 8
- The concept boards in [site/concepts/project/](../site/concepts/project/) (Main, Project, Start, Inbox, Projects,
  Gate, Activity) as they stood before this round, served from a local copy of the site; screenshots kept outside
  the repo
