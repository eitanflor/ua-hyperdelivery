<!-- Point-in-time research, retrieved 2026-10-26 for the UA-DLC plan (round 8: who else is building toward UA-DLC). Claims carry source links; vendor products, names and dates change monthly, so verify before acting. Anything about UA's own licenses or use is marked [confirm]. Claims from press or third-party write-ups are marked (secondary). See README.md in this folder. -->
<!-- cspell:words Claxton Kiro Replit automations codekb unreviewed wireframes -->

# Who else is building toward UA-DLC, and what makes HyperDelivery different

*Researched 2026-10-26. Builds on [aws-aidlc.md](aws-aidlc.md),
[anthropic-playbook.md](anthropic-playbook.md), [github-next-chopin.md](github-next-chopin.md),
[software-factories.md](software-factories.md), [factory-sources-round4.md](factory-sources-round4.md),
[tool-landscape.md](tool-landscape.md), [ua-dlc-reconcile.md](ua-dlc-reconcile.md),
[ua-marketplace-alignment.md](ua-marketplace-alignment.md) and
[enterprise-plan.md section 5](../enterprise-plan.md#5-why-hyperdelivery-and-not-a-generic-tool).
It re-checks their status claims on 2026-10-26 and adds what changed since; it does not repeat
their detail. GitHub Universe 2026 is on October 28 and 29
([github-next-chopin.md](github-next-chopin.md)), two days after this was written, so re-check the
GitHub rows after it.*

**The framing used throughout** (owner, 2026-10-26, aligned with the other team's definition):
each UA-DLC phase is judged by what it hands over.

| Phase | Steps | Output |
|---|---|---|
| Ideation | Research, Brief | A **visual mockup**, supplementing the research and the brief |
| Inception | Requirements, Stories, Tech Design, Test Plan, Tickets | A **prototype**, at most on a hosted sandbox with dev data |
| Construction | Code, Review, Manual QA, Visual QA, Deploy | A **production-ready version** on production data connections |
| Operations | Deployments, promotions and the rest | Releases and promotions that are run and supported |

HyperDelivery stops at Inception for now. Whether Construction is fully AI-driven or AI-assisted with
engineers is decided later, because that is where work starts touching production systems and data.
When this was written the plan's diagram still put the prototype build in Construction and the
clickable mock in Tech Design. The plan and the operating model were revised the same day: a first
visual mockup now ends Ideation, the prototype build belongs to Inception, and every project ends
with a handoff package
([enterprise-plan.md section 4](../enterprise-plan.md#4-the-proposal-hyperdelivery-running-ua-dlc),
[operating-model.md section 1](../operating-model.md#1-the-line)).

## 1. The short answer

1. **Yes, many vendors are building pieces of this, and the shape is converging.** AWS AI-DLC,
   Anthropic's AI-native SDLC playbook, GitHub Spec Kit, Kiro, Factory and 8090 all describe the
   same chain (intent, spec, plan, build, review, release) with a person approving between steps
   (section 3). Nobody has to be convinced that the steering point has moved before the code.
2. **Nobody ships all of UA's Inception: the spec chain *and* a prototype a business teammate can
   use.** The market splits in two.
   - **Engineering lifecycles** (AWS AI-DLC and Kiro, Anthropic's playbook, Spec Kit and Copilot,
     Factory, Devin, Rovo Dev) write Inception's paperwork well, then go straight to production
     code, and they assume an engineer at the keyboard. AWS's own method paper puts simple systems
     that non-developers could build outside AI-DLC's scope
     ([aws-aidlc.md](aws-aidlc.md#0-ai-dlc-means-three-different-things)).
   - **Business-user builders** (Microsoft's Cowork and Copilot Studio apps, Lovable, v0, Bolt,
     Replit) produce a working prototype in minutes but skip the brief, requirements, test plan
     and named approvals, and each is built by one person. Snowflake's apps are built by analysts
     and engineers for business users to use, next to governed data, and write no brief either.
3. **The two closest in shape are not substitutes.** GitHub Next's Chopin has the shared plan and
   decisions only a person can settle, but it is a research prototype with no public instance,
   built around one GitHub repository
   ([Chopin README](https://github.com/githubnext/chopin/blob/main/README.md)). 8090 turns
   plain-English requirements into engineer-signed blueprints, but hands the work to engineers and
   has no known UA presence ([8090](https://8090.ai/)).
4. **What HyperDelivery adds is the join, at UA:** a business teammate starts; people from several
   functions answer in Teams; numbers tie to Snowflake's certified definitions; approvals scale with
   risk and bind to an exact version; and the line stops at a prototype on dev data, with a package
   engineering's own AI-DLC pipeline can pick up (section 4). This is designed, not yet proven: the
   plan's own table marks most of it "No" or "Partly" today
   ([enterprise-plan.md section 5](../enterprise-plan.md#5-why-hyperdelivery-and-not-a-generic-tool)).
5. **Say the rest plainly.** Others beat us on polish, production engineering, data-native hosting
   and method maturity (section 5). If a sanctioned vendor ships the join, the plan's exit ramp
   applies: move the process onto it and keep what is UA's.

## 2. The comparison table

**How to read it.** A stage is **Full** when the product produces that stage's output (mockup,
prototype, production version, run releases) and the work that leads to it; **Partial** when it
does some of the work, or produces the output without the work behind it; **None** when it does not
address the stage. Sources for every cell are in that product's paragraph in section 3.

### 2a. What it is, who it is for, and how much of the line it covers

| Product | What it is | Status on 2026-10-26 | Primary user | Ideation (mockup) | Inception (prototype) | Construction (production) | Operations |
|---|---|---|---|---|---|---|---|
| **GitHub Next Chopin** | Multiplayer planning document with a repo-grounded agent | Research prototype; self-host only; alpha "within a month or so" of September | Engineering team, with PMs and designers | Partial: research child pages, low-fi wireframes | Partial: plan, decisions, approved task graph; no prototype | Partial: hands the graph to a coding agent | None |
| **Anthropic AI-native SDLC playbook** ("Claude's AIDLC") plus Claude products | Method (Aug 21, 2026), with Claude Design, Cowork, Claude Code, Claude Tag | Method published; Claude Design on every plan and on by default since Oct 15, 2026 | Anyone originates; engineers build | Full: `intent.md` plus Claude Design mockups | Partial: `spec.md`, `plan.md`; build is engineer-led | Full: plan mode, review, hooks, release gate | Full (method): tiered detection, findings become intents |
| **AWS AI-DLC** (method, `aidlc-workflows`, Kiro) | Method, open-source rules and engine (MIT-0), spec-driven IDE | Workflows 2.11.1 stable (Oct 20, 2026), 2.11.2 previews daily; Kiro GA | Developers in an IDE or CLI | Full: intent, feasibility, scope, rough mockups | Partial: requirements to delivery plan, refined mockups; no prototype | Full: per-unit code, build and test, CI | Full (rules): 7 Operation stages |
| **GitHub Spec Kit, Copilot app and cloud agent** | Open-source spec toolkit plus GA coding products | Spec Kit 1.2.3 (Oct 22, 2026); Copilot app GA; Copilot in Teams | Developers | Partial: `assess` ends go, clarify or stop | Partial: spec, plan, tasks; no prototype | Full: cloud agent to pull request, code review | Partial: Actions, agentic workflows preview |
| **Factory** (Droid) | Agent-native engineering platform | Commercial, with published plans | Engineering teams | Partial: triage and dedupe of inbound work | Partial: Spec mode, Missions plan approval | Full | Full: QA, release, incident response, AutoWiki |
| **Cognition Devin** | Autonomous coding agent plus Devin Desktop | GA; Devin Desktop since Jun 2, 2026 | Engineers | None | Partial: Ask Devin plans tasks | Full | Partial: Auto-Triage, hosted app deploys |
| **Microsoft Copilot apps** (Cowork App skill, Copilot Studio Apps, Copilot Code, Managed Runtime) | Business-user and maker app building on a Microsoft-hosted runtime | Preview; Cowork App skill needs Frontier | Business users and makers | Partial: describe an outcome; no brief or mockup step | Partial: plan, follow-ups, working app; no requirements or test plan | Partial: Git-backed stages announced; test and prod moves not supported yet | Partial: admin inventory and monitoring |
| **Atlassian Rovo Dev in Jira** | Coding agent started from a Jira work item | Rolling out since Apr 2, 2026; needs Rovo credits | Developers; others follow in Jira | None | Partial: reviewed plan from the work item | Partial: sandboxed pull requests for small tasks | None |
| **Google** (Antigravity 2.0, AI Studio, Jules, Opal) | Developer agent hub, prompt-to-app studio, coding agent, mini-apps | Antigravity 2.0 and AI Studio current; Firebase Studio closed to new users | Developers; AI Studio for anyone prototyping | Partial: prompt-to-app prototypes | Partial: AI Studio prototype, export to Antigravity | Partial: developer tooling | Partial: scheduled and proactive tasks |
| **Business-user app builders** (Lovable, v0, Bolt, Replit) | Prompt-to-app builders with hosting | GA; enterprise controls added through 2026 | Business users (Lovable: 4 of 5 users non-technical) | Partial: drafts and variants | Partial: hosted prototype in minutes; no spec chain | Partial: publish to vendor hosting, Azure or Snowflake | Partial: hosting, scans, cleanup |
| **Snowflake apps** (CoCo, App Runtime, CoWork) | Apps built and run next to Snowflake data | App Runtime public preview (Jun 16, 2026); Streamlit Business User Access GA | Analysts and engineers build; business users use | Partial: CoWork answers over certified data | Partial: CoCo scaffolds and deploys an app | Partial: governed hosting inside Snowflake | Partial: budgets, audit logs, deploy control |
| **8090 Software Factory** | AI-native SDLC platform: Requirements, Blueprints, Work Orders, Feedback | Commercial; $135M Series A | Business writes requirements; engineers sign off and build | Partial: plain-English requirements | Partial: blueprints and work orders; no prototype | Partial: work orders to engineers' agents | Partial: feedback triage |
| **HyperDelivery** | UA's governed line from idea to prototype | Current State pilot; Final MVP weeks 1 to 14, pilot weeks 15 to 22 | Business teammates, joined by analysts, data owners and engineers | Full (designed): research, data discovery, brief, mockup | Full (designed): spec chain plus prototype on a sandbox with dev data | None for now: a handoff package; approach decided later | None for now |

### 2b. Approvals, data, people and the path to production

| Product | Human approvals and audit trail | UA data and certified definitions | Multi-party input | Where it runs, where data goes | Path to production | At UA |
|---|---|---|---|---|---|---|
| **Chopin** | Only a person's Save settles a decision; the Build press binds revision, graph, commit and person | None: one GitHub repository | Strong: live co-editing, shared chat, "Ask someone" | Self-hosted; GitHub.com only; needs a Copilot entitlement | Via a coding agent's pull requests | Not a product [n/a] |
| **Anthropic playbook** | Product owner accepts intent and spec; engineer approves plan; code owner; release manager; git history is the audit | Connectors and MCP; no certified-definition concept | Claude Tag in Slack; Teams "coming soon" | Anthropic cloud, or Bedrock and others for some surfaces | Team's own PR and release gate | Licenses [confirm]; UA marketplace works with Claude Code |
| **AWS AI-DLC** | Gate after every stage; verbatim `Person Reply`; human-presence guard; 124 audit event types | None; reverse-engineers code only | Mob Elaboration ritual; role-labeled questions; no live shared session | Inside the developer's harness and repo | Construction and Operation phases in the rules | Engineering already uses AI-DLC's vocabulary and an AI-DLC-shaped repository; Kiro [confirm] |
| **GitHub** | Spec Kit `gate` steps after spec and plan; branch rules and PR review | Repository plus MCP | Copilot in Teams; shared canvases in the Copilot app | GitHub cloud; repository on GitHub | Team's own PR and CI | Today's pilot builds with the cloud agent; seats [confirm] |
| **Factory** | Missions plan approval; autonomy levels; permission rules; audit log on Business | Repositories and MCP | Delegations from Teams, Slack, Jira | Local, Factory cloud, or on-premises on Enterprise | Team's own repository and CI | UA logo on factory.com; marketplace defaults to Droid; scope [confirm] |
| **Devin** | Explicit approval for hosted deploys; Devin Review; PR review | Snowflake, Redshift, BigQuery and other warehouses through database MCPs (data analyst agent), plus Databricks; no certified-definition concept | @Devin in Teams and Slack | Cognition cloud, dedicated deployment or self-hosted Outposts | Team's PR | None known [confirm] |
| **Microsoft** | Cowork asks before actions; tenant policies; no multi-signer approval described | Microsoft 365, Work IQ and approved connectors | One maker per app | Microsoft-hosted, inside the tenant | Microsoft's runtime; promotion to test and prod not supported yet | M365 Copilot and Frontier [confirm] |
| **Rovo Dev** | Plan review; PR review before merge | Jira, Confluence and code | Jira issues and comments, asynchronous | Atlassian cloud sandbox | Team's PR | UA uses Jira and Confluence; Rovo Dev credits [confirm] |
| **Google** | Artifacts to review; no named approval steps found | Google Workspace and Google Cloud | None found | Google cloud or local | Developer tooling | UA is a Microsoft 365 shop; none known [confirm] |
| **App builders** | Lovable: publish can require admin or owner approval; pre-publish scans | Per-user connectors; v0 queries Snowflake under the user's chosen role (beta) | Bolt: start from a Teams thread; otherwise single-builder | Vendor cloud; v0 apps can be hosted on Snowflake | Vendor hosting; v0 PR to protected main | Not sanctioned for UA data [confirm] |
| **Snowflake apps** | Admins control who deploys; inherited RBAC; audit logs | Strongest: runs next to the data, inherits policies; CoWork answers over certified semantic views | None | Inside Snowflake | Snowflake-hosted app | UA named as a CoWork customer; CoCo and App Runtime [confirm] |
| **8090** | Engineers sign off blueprints; "keeps an audit trail" | None known | Business authors plus engineers | Vendor-hosted in its modernization offer; its FAQ answer did not load | Engineers' agents and repositories | None known [confirm] |
| **HyperDelivery** | Three named approvals; risk decides who signs; approvals bind to a version hash | Every number cites a golden report or says "uncertified"; rows stay in Snowflake | Questions routed to named people in Teams; decisions attributed | UA's AWS accounts; coding agent in a sandbox account | A handoff package to engineering (Construction decided later) | Built in EDM |

## 3. Product by product

### GitHub Next Chopin

[Chopin](https://githubnext.com/projects/chopin/) is a GitHub Next **research prototype** published
in September 2026: a real-time multiplayer planning environment where a team and an agent write a
plan together around a GitHub repository. The page says the authors "don't recommend you attempt to
use it today" and expected to "entertain some alpha users" within about a month. The
[README](https://github.com/githubnext/chopin/blob/main/README.md) calls it experimental research
software with no public instance (run it locally or self-host). Under the default harness the
Planner cannot write to GitHub or implement code, and decisions are kept apart from the prose "so a
later rewrite cannot silently change what the team decided." The repository is MIT-licensed, about
499 stars, pushed daily, with CLI v0.0.21 on Oct 22, 2026
([repo](https://github.com/githubnext/chopin)). Build stays inert while decisions are open, and the
press binds the document revision, graph revision, commit and person
([implementation-lifecycle.md](https://github.com/githubnext/chopin/blob/main/docs/implementation-lifecycle.md)).
It is GitHub.com only, needs a Copilot entitlement, and is bound to one repository; early users
already asked for multi-repository documents
([#595](https://github.com/githubnext/chopin/issues/595), [github-next-chopin.md](github-next-chopin.md#6-status-limits-and-early-user-feedback)).
**Heading our way on:** multi-party input and decisions as human acts. **Not on:** business users,
enterprise data, prototypes, Microsoft 365.

### Anthropic's AI-native SDLC playbook and the Claude products behind it

There is no Anthropic product called AI-DLC; "Claude's AIDLC" is
[The AI-native SDLC playbook](https://claude.com/resources/articles/the-ai-native-sdlc-playbook)
(Louis Claxton, Anthropic, Aug 21, 2026), a method rather than a product. Six stages (Plan, Design,
Build, Test, Deploy, Maintain) run as a loop; each commits one artifact the next reads (`intent.md`,
`spec.md`, `plan.md`, the diff and tests, the PR with findings, the incident record), and git history
is the audit trail. People approve at every stage: the product owner accepts the intent and the
spec, the engineer approves the plan, code owners approve PRs, a release manager authorizes
production, and a service owner triages incidents. For non-engineers it names claude.ai and Cowork
for drafting the intent, and **Claude Design for product-owner mockups in the Design stage**, which
is UA's Ideation output. Since then, [Claude Design](https://claude.com/product/design) has moved
into every Claude conversation and every plan, including Free; it makes mockups and "clickable
flows for reviewing an idea before a spec is written", can lock a team to one approved design
system, hands off to Claude Code with `/design`, and turned on by default on Oct 15, 2026 (except
HIPAA-enabled organizations); the standalone site stays open until Dec 14, 2026.
[Cowork](https://claude.com/product/cowork) is being folded into Claude, shows its plan and waits for
approval before significant actions, and can stream activity to a SIEM.
[Claude Tag](https://claude.com/product/tag) brings a shared @Claude into Slack with its own identity
and per-channel tool permissions; Microsoft Teams is "coming soon". The build half (plan mode, Code
Review that never approves, cloud sessions) is engineer-facing
([anthropic-playbook.md](anthropic-playbook.md#2-the-surrounding-anthropic-material-2025-2026)).
AWS AI-DLC 2.x also installs into Claude Code as a harness
([aws-aidlc.md](aws-aidlc.md#7-how-it-plugs-into-agents)). **Heading our way on:** the artifact
chain, mockups for business people, approvals by role. **Not on:** a single governed product,
multi-party input in Teams, certified data.

### AWS AI-DLC: the method, `aidlc-workflows` and Kiro

AI-DLC is [AWS's method](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/)
(Jul 31, 2025): AI proposes and asks, humans approve, Intents break into Units built in Bolts. Its
Principle 5 puts simple systems that non-developer personas could build outside its scope and points
them to low-code tools ([aws-aidlc.md](aws-aidlc.md#0-ai-dlc-means-three-different-things)). The
open-source [`aidlc-workflows`](https://github.com/awslabs/aidlc-workflows) engine (MIT-0) runs 5
phases and 33 stages with 14 agents and 124 audit event types
([README](https://github.com/awslabs/aidlc-workflows/blob/main/README.md)); release 2.11.1 shipped on
Oct 20, 2026 ([CHANGELOG](https://github.com/awslabs/aidlc-workflows/blob/main/CHANGELOG.md)) and
2.11.2 previews were still landing daily on Oct 26
([releases](https://github.com/awslabs/aidlc-workflows/releases)). Its Ideation phase ends with
**1.6 Rough Mockups** and its Inception adds **2.5 Refined Mockups**, so AWS already treats a mockup
as an early output, but Inception still ends in a delivery plan, not a running prototype
([phases and stages](https://github.com/awslabs/aidlc-workflows/blob/main/docs/guide/04-phases-and-stages.md)).
Every stage ends at a gate, approvals are accepted only from a real person, and the reply is stored
verbatim ([audit format](https://github.com/awslabs/aidlc-workflows/blob/main/core/knowledge/aidlc-shared/audit-format.md)).
It installs into Claude Code, Kiro, Codex, Cursor, OpenCode and Copilot
([aws-aidlc.md](aws-aidlc.md#7-how-it-plugs-into-agents)). [Kiro](https://kiro.dev/blog/general-availability/)
(GA Nov 17, 2025) is AWS's spec-driven IDE (requirements, design, tasks); on Sep 30, 2026 it added
[workflows](https://kiro.dev/blog/introducing-workflows/), multi-agent graphs whose bundled
`feature-pipeline` recipe runs requirements, design review, planning, coding and parallel reviews,
with steps that ask before changing the design. AWS also open-sourced Kiro Crew, an always-on agent
team built on Kiro, in August 2026
([SiliconANGLE](https://siliconangle.com/2026/08/04/aws-launches-kiro-crew-autonomous-agentic-orchestrator-24-7-code-development/), secondary).
UA engineering's Inception already runs in an AI-DLC-shaped repository and hands Construction
per-ticket context files ([ua-marketplace-alignment.md](ua-marketplace-alignment.md#1e-the-ai-dlc-handoff-context-files)).
**Heading our way on:** vocabulary, stage contracts, audit. **Not on:** business users (by its own
scope), live multi-party sessions, enterprise data.

### GitHub: Spec Kit, the Copilot app and the cloud agent

[Spec Kit](https://github.github.com/spec-kit/) is GitHub's open-source spec toolkit: Specify, Plan,
Tasks, Implement and Converge, each writing a Markdown artifact, plus an opt-in assessment that ends
in a go, clarify or stop decision; it integrates with 38 agents, including Copilot, Claude and Kiro.
Version 1.2.3 shipped on Oct 22, 2026 and the repository has about 143,000 stars
([releases](https://github.com/github/spec-kit/releases)); its full workflow has two gates, after the
spec and after the plan ([ua-dlc-reconcile.md](ua-dlc-reconcile.md#1c-observations-that-shaped-the-proposal)).
The [Copilot app](https://github.blog/changelog/2026-06-17-github-copilot-app-generally-available)
(GA Jun 17, 2026) adds shared canvases of a plan, PR, terminal or browser, and the cloud agent turns
a task into one pull request, capped at 59 minutes and one repository
([docs](https://docs.github.com/en/copilot/concepts/copilot-surfaces/copilot-on-github)). On Oct 23,
2026 GitHub combined notifications and Copilot in the Teams app, so a team can @mention GitHub on a
bug report and get an investigation, fix and pull request
([changelog](https://github.blog/changelog/2026-10-23-turn-notifications-into-code-with-github-copilot-in-teams)).
GitHub retreated from its business-user builder: Spark took no new apps from Aug 4, 2026
([changelog](https://github.blog/changelog/2026-08-04-upcoming-deprecation-of-github-spark-on-github-com)).
**Heading our way on:** spec formats, Teams. **Not on:** business users, prototypes before code,
enterprise data.

### Factory

[Factory](https://factory.com/) now leads with "Build Your Software Factory": Droid across the CLI,
desktop, web, Slack, Microsoft Teams, Jira, Linear and CI, plus Missions for long multi-phase work,
automations and persistent Droid Computers, with human approval checkpoints. Its
[docs](https://docs.factory.com/llms.txt) describe a Software Factory of automations across the
lifecycle (triage and dedupe, code and security review, automated QA with visual evidence, release,
incident response, AutoWiki), Normal, Spec and Mission modes with autonomy levels, and a Missions
plan a person approves before Mission Control runs it
([Missions](https://docs.factory.com/missions/overview.md)). Business plans add SSO, zero data
retention and audit logs; Enterprise adds on-premises and air-gapped options
([tool-landscape.md](tool-landscape.md#45-factory-droid)). Factory's home page HTML still carries an
`aria-label="Under Armour"` logo (checked 2026-10-26), and UA's AI marketplace defaults to Droid
([ua-marketplace-alignment.md](ua-marketplace-alignment.md)). **Heading our way on:** a factory
across the whole lifecycle, Teams intake. **Not on:** business users or Ideation; its home page
speaks only to engineering teams.

### Cognition Devin

Devin is an autonomous coding agent; Windsurf became [Devin Desktop](https://cognition.com/blog/1)
on Jun 2, 2026, and recent posts cover Auto-Triage (May 18), a Series E (Sep 8), crossing $1B in
annualized revenue (Sep 25), an AWS partnership (Sep 15) and Devin Security (Oct 26)
([blog index](https://cognition.com/blog/1)). Its [docs](https://docs.devin.ai/llms.txt) cover
[Ask Devin](https://docs.devin.ai/work-with-devin/ask-devin.md) for planning tasks,
[Microsoft Teams](https://docs.devin.ai/integrations/microsoft-teams.md),
[hosted app deployments with approval rules](https://docs.devin.ai/product-guides/deployment-capabilities.md),
[test videos as proof](https://docs.devin.ai/work-with-devin/testing-and-recordings.md), a
[data analyst agent](https://docs.devin.ai/work-with-devin/data-analyst.md), and
[dedicated or self-hosted deployment](https://docs.devin.ai/enterprise/deployment/overview.md). Its
memory is personal, not organization-wide ([software-factories.md](software-factories.md#3-landscape-engineering-factories)).
**Heading our way on:** Teams intake, evidence by video. **Not on:** the front of the line.

### Microsoft: Cowork App skill, Copilot Studio Apps, Copilot Code and Copilot Managed Runtime

[Copilot Managed Runtime](https://learn.microsoft.com/microsoft-365/managed-apps/) (preview, docs
updated October 2026) hosts line-of-business apps built four ways: the App builder skill in Cowork
for business users (Frontier only), Copilot Studio Apps for makers ("proposes a plan, generates a
draft, and lets you refine it in an interactive preview"), Copilot Code cloud sessions for business
users and developers, and an SDK and `ms` CLI. Every app uses Entra sign-in, inherits tenant
governance (approved connectors, sharing rules, content security policy) and appears in the admin
center. Microsoft's [Sep 10 announcement](https://www.microsoft.com/microsoft-copilot/blog/copilot-studio/build-apps-in-copilot-cowork-and-copilot-studio/)
adds Work IQ context, write-back through connectors, Git-backed source control, deployment stages
and version isolation, and says nothing about approval workflows or multi-person building. Learn
still notes that moving Cowork- and Copilot Studio-built apps to test or production environments is
not supported yet ([Vibe migration](https://learn.microsoft.com/power-apps/vibe/migrate-apps)), and
the App Builder agent retires on Nov 30, 2026 ([tool-landscape.md](tool-landscape.md#48-microsoft-365-copilot-copilot-studio-and-copilot-cowork)).
**Heading our way on:** business-user prototypes under enterprise governance, inside the tenant UA
already runs. **This is the most direct threat** for tools that live on Microsoft 365 data. **Not
on:** a brief, requirements or test plan, named approvals, multi-party input, Snowflake's certified
definitions.

### Atlassian Rovo Dev in Jira

[Rovo Dev in Jira](https://www.atlassian.com/blog/company-news/rovo-dev-in-jira) (Apr 2, 2026)
starts a cloud session from a Jira work item, proposes a plan the user reviews, runs in a sandbox and
opens pull requests linked back to the work item; Jira Automation can trigger it. The post is aimed
at developers; product managers and designers "follow outcomes" through the same issues. It needs
Rovo Dev credits and a connected Bitbucket or GitHub
([support doc](https://support.atlassian.com/jira-software-cloud/docs/what-is-the-jira-coding-agent/)).
Atlassian's own "AI work factory" guidance (one scoped workspace per recurring job) is the closer
fit to UA-DLC's thinking ([factory-sources-round4.md](factory-sources-round4.md#23-atlassian-building-your-ai-work-factory-dugald-morrow-aug-21-2026)).
**Heading our way on:** starting from a Jira ticket with Confluence context. **Not on:** anything
before the ticket.

### Google: Antigravity 2.0, AI Studio, Jules and Opal

At I/O 2026 (May 20) Google launched [Antigravity 2.0](https://blog.google/intl/ja-jp/company-news/technology/google-io-2026-developer-highlights/),
a desktop hub for parallel agents, and rebuilt AI Studio on the Antigravity coding agent for
prompt-to-app work, with Workspace APIs and one-click export to Antigravity. The
[Antigravity page](https://antigravity.google/product/antigravity-2) targets developers and teams
but lists product, finance and marketing use cases. Firebase Studio stopped taking new users on Jun
22, 2026 and shuts down on Mar 22, 2027, with users pointed to Antigravity and AI Studio
([Firebase](https://firebase.google.com/docs/studio/migrating-project)). Opal added agentic
workflows in February 2026 ([TechCrunch](https://www.techcrunch.com/2026/02/24/google-adds-a-way-to-create-automated-workflows-to-opal/), secondary).
Jules's 2026 status could not be confirmed at a primary source. **Heading our way on:** idea to
prototype to code in one ecosystem. **Not on:** approvals, Microsoft 365, UA's stack.

### Business-user app builders: Lovable, v0, Bolt, Replit

They out-prototype everyone. Lovable says four of five users are in non-technical roles
([PCWorld, Aug 12, 2026](https://www.pcworld.com/article/3211855/), secondary), and its 2026
enterprise work adds scans before every publish, per-user connectors, drafts and trust pages
([Lovable blog](https://lovable.dev/blog/summer-2026)) plus workspace policies that block publishing
or require an admin or owner to approve it
([docs](https://docs.lovable.dev/features/workspace-policies)). v0 can now deploy apps that are
hosted on Snowflake; each member connects through OAuth with a role the admin permitted, and the
integration is in beta ([v0 docs](https://v0.app/docs/snowflake)). Bolt can start a build from a
Teams thread and deploy to Azure ([Bolt](https://bolt.new/blog/bolt-microsoft-partnership)). Replit
runs a Semgrep scan inside its agent's review ([changelog](https://docs.replit.com/updates/2026/08/07/changelog.md)).
**Heading our way on:** the prototype, and since October, publish approvals and Snowflake. **Not
on:** the brief, requirements, multi-party input, certified definitions.

### Snowflake apps: CoCo, App Runtime and CoWork

[Snowflake Apps](https://www.snowflake.com/en/blog/snowflake-apps-build-deploy-faster/) (Summit, Jun
16, 2026) run inside Snowflake next to the data. App Runtime (public preview) adds full-stack web
apps; Snowflake CoCo scaffolds a project from a description, connects it to data and deploys it to a
live URL; v0 deploys with one command; and Business User Access for Streamlit apps is GA. Apps
inherit data policies and role-based access, and admins get cost budgets, audit logs and control
over who deploys. Business users use these apps; they do not build them. [Snowflake
CoWork](https://www.snowflake.com/en/product/snowflake-cowork/) answers business questions over
certified semantic views, and Snowflake's June announcement names Under Armour as a CoWork customer
([tool-landscape.md](tool-landscape.md#41-snowflake-cowork-and-snowsight)). **Heading our way on:**
governed prototypes on certified data, the half of our cell where UA's data lives. **Not on:**
business-user building, multi-system apps, multi-party input, named approvals.

### 8090 Software Factory

[8090](https://8090.ai/) calls itself an "AI-native SDLC platform": business intent captured in
plain English (Requirements), engineer-signed technical design (Blueprints), tasks sent to engineers
and their agents in Cursor, VS Code or Claude Code over MCP (Work Orders), and Feedback that closes
the loop, with an audit trail. It raised a $135M Series A led by Salesforce Ventures and quotes EY.
**Closest in shape**, down to the word "Blueprint", but it hands Inception to engineers rather than
producing a prototype, and nothing links it to UA.

### Also considered

- **Palantir AIP's AI FDE** proposes every change on a branch or as a pull request and respects the
  user's permissions ([docs](https://www.palantir.com/docs/foundry/ai-fde/overview)), but only for
  data already in Foundry; no public source links UA to Palantir
  ([tool-landscape.md](tool-landscape.md#44-palantir-foundry-and-aip)).
- **Runlayer, Uber, Stripe** run internal factories; they are reference designs, not products UA
  could adopt for this ([software-factories.md](software-factories.md)).

## 4. What makes HyperDelivery different

Each point is tied to UA's data, people or gates. Each is designed, and the plan says which are not
true yet ([enterprise-plan.md section 5](../enterprise-plan.md#5-why-hyperdelivery-and-not-a-generic-tool)).

1. **The whole of Inception for a business teammate: the spec chain and a prototype.** Engineering
   lifecycles give the paperwork without a prototype; app builders give a prototype without the
   paperwork (section 2a). HyperDelivery produces both, ending at a prototype on a hosted sandbox
   with dev data, in a sandbox AWS account that never runs HyperDelivery
   ([enterprise-plan.md section 4](../enterprise-plan.md#how-hyperdelivery-does-the-work)). It is
   built for the persona AWS's method excludes.
2. **Numbers that tie to UA's certified definitions, with rows that stay in Snowflake.** Every
   number cites a Snowflake golden report or is labeled "uncertified", and Snowflake work goes to
   Cortex Code, which returns schema, counts and aggregates, never rows
   ([enterprise-plan.md section 4](../enterprise-plan.md#4-the-proposal-hyperdelivery-running-ua-dlc)).
   Snowflake's own apps inherit policy but do not write a brief; v0 respects a role but not a
   definition; engineering agents can query Snowflake through MCP, but none binds a number to a
   golden report. Today the Snowflake tool returns raw rows, read-only by prompt; fixing that is
   do-no-harm work.
3. **Mixed-function input, attributed, in Teams.** Questions go to the person who can answer them,
   in Teams, and decisions are recorded with who made them and why
   ([enterprise-plan.md section 4](../enterprise-plan.md#4-the-proposal-hyperdelivery-running-ua-dlc)).
   Chopin is the only other tool with real multi-party decisions, and it lives on GitHub; AI-DLC's
   Mob Elaboration is a meeting ritual, not a product feature
   ([aws-aidlc.md](aws-aidlc.md#6-rituals-mob-elaboration-mob-construction-bolts)). Today this is
   "Partly": one requester plus an expert answer page.
4. **Three named approvals, where risk decides who signs, bound to an exact version.** AI-DLC gates
   every stage (30 gates in its `feature` scope) and is already trimming them
   ([aws-aidlc.md](aws-aidlc.md#8-assessment-and-caveats)); Spec Kit has two; Microsoft describes no
   approval that involves a second person, and among the app builders Lovable's publish approval is
   the clearest example ([docs](https://docs.lovable.dev/features/workspace-policies)). HyperDelivery's approvals are "what we're building", "the plan" and the prototype; a
   low-risk sandbox needs only the requester, confidential data adds a data owner, and later edits
   show as "N changes since approval" ([ua-dlc-reconcile.md](ua-dlc-reconcile.md#0-bottom-line),
   [section 2](ua-dlc-reconcile.md#2-the-unified-ua-dlc-at-a-glance)).
5. **A deliberate stop before production, with a handoff UA engineering can take.** Under the new
   framing, HyperDelivery stops at the prototype and leaves the Construction choice (fully AI-driven
   or AI-assisted with engineers) to a later decision, because that is where production systems and
   data come in. HyperDelivery already holds every field of engineering's AI-DLC context files, so
   the handoff can feed engineering's own `jira-to-pr` pipeline in Factory, Copilot or Claude Code
   ([ua-marketplace-alignment.md](ua-marketplace-alignment.md#bottom-line)). Vendors with a
   production path take it inside their own runtime; HyperDelivery hands it to UA's.
6. **Context that compounds across UA projects.** What people point at (Teams recordings, folders,
   tickets, Confluence pages) is read as them and indexed per project on AWS, and confirmed decisions
   become reusable context. Devin's memory is personal; Microsoft's and Lovable's are per app
   ([software-factories.md](software-factories.md#6-moat-analysis-what-generic-platforms-structurally-cannot-do-for-ua)).
   This is "No" today and proven only at the scale decision.

## 5. Where others beat us

- **Polish and speed of prototypes.** Lovable, v0, Bolt and Claude Design produce a better-looking
  first version in minutes, and Claude Design locks to a design system
  ([Claude Design](https://claude.com/product/design)). We concede looks, as the plan already does.
- **Production engineering.** Factory, Devin, Copilot, Claude Code and Kiro are generally available,
  run review, QA, release and incident response, and ship monthly (section 3). HyperDelivery does
  none of Construction or Operations, by design for now.
- **Hosting next to governance.** Snowflake App Runtime inherits Snowflake policy and audit, and
  Copilot Managed Runtime inherits tenant governance and lists every app for admins
  ([Snowflake](https://www.snowflake.com/en/blog/snowflake-apps-build-deploy-faster/),
  [Microsoft](https://learn.microsoft.com/microsoft-365/managed-apps/)). HyperDelivery has local and
  sandbox previews only today.
- **Method maturity.** AI-DLC has 33 stage contracts, an audit format and a learning loop; Spec Kit
  has 38 agent integrations, 157 community extensions and about 143,000 stars
  ([AI-DLC README](https://github.com/awslabs/aidlc-workflows/blob/main/README.md),
  [Spec Kit](https://github.github.com/spec-kit/)). Ours is one team's design.
- **Multiplayer editing.** Chopin's live co-editing, anchored decision cards and "N changes to build"
  are ahead of anything HyperDelivery has built ([github-next-chopin.md](github-next-chopin.md)).
- **Scale and staying power.** Cognition reports more than $1B in annualized revenue and 8090 a
  $135M Series A; HyperDelivery is a small internal team. The counterweight is churn: GitHub Spark,
  Firebase Studio and Microsoft's App Builder agent were all retired or closed to new users in 2026
  (section 3).

## 6. What we borrow or could plug in

| From | What | Where it lands in UA-DLC |
|---|---|---|
| AWS AI-DLC | Phase names (already adopted), stage contracts that declare what they consume and produce, verbatim approval records, the human-presence guard, breadth and depth dials, the codekb freshness check | Process spine, audit, brownfield System Map ([aws-aidlc.md](aws-aidlc.md#10-what-ua-dlc-should-adopt-adapt-or-reject)) |
| AWS AI-DLC via UA engineering | Unit and epic context files | The Inception handoff package, so engineers continue with `jira-to-pr` ([ua-marketplace-alignment.md](ua-marketplace-alignment.md#4a-hyperdelivery-fields-that-fill-an-ai-dlc-context-file)) |
| Spec Kit | `spec.md`, `plan.md`, `tasks.md` formats; the assessment's go, clarify or stop verdict; workflow `gate` steps | An export engineers can open in any of 38 agents; the Brief's verdict ([Spec Kit](https://github.github.com/spec-kit/)) |
| Anthropic playbook | The `intent.md`, `spec.md`, `plan.md` chain; skills owned by named policy owners; findings that never approve | Versioned artifacts per step; policy skills; reviewers ([anthropic-playbook.md](anthropic-playbook.md#3-implications-what-to-embed-in-the-factory)) |
| Claude Design | Mockups and clickable flows locked to one design system, if UA licenses Claude [confirm] | A candidate engine for Ideation's mockup, behind a contract like the coding agent's |
| Chopin | Decisions kept outside the prose, Build "inert with a reason", Ask someone, low-fi wireframes | Decision records, approval buttons, Teams routing ([github-next-chopin.md](github-next-chopin.md#8-patterns-hyperdelivery-should-borrow)) |
| Factory, Copilot, Claude Code, Kiro | Construction engines | Behind the `Builder` port, once the Construction approach is decided |
| Snowflake App Runtime, Streamlit in Snowflake | Governed hosting next to the data | The prototype runtime for Snowflake-only data apps, and a T1 or T2 home |
| Copilot Managed Runtime | Tenant-governed hosting with an admin inventory | The home for tools that live only on Microsoft 365 data |
| Lovable | Publish approvals, a trust page per app, abandoned-app cleanup | Tier contract and Renew or retire |

## 7. Prepared answers for leadership

**"Is anyone already building this?"** Many are building halves. Engineering tools (AWS AI-DLC,
Anthropic's playbook, GitHub Spec Kit, Factory, Devin) run the spec-to-code chain for engineers.
Business-user builders (Microsoft Copilot apps, Lovable, v0) make a prototype for one person, and
Snowflake's apps are built by analysts and engineers for business users to use. The two closest in
shape are Chopin, a GitHub research prototype for engineering teams, and 8090, which hands work to
engineers. None takes a UA business teammate's idea, with several
functions' input and UA's certified data, through signed approvals to a prototype. We re-check after
GitHub Universe on October 28 and 29.

**"Why not Microsoft Copilot? We already run Microsoft 365."** For a simple tool on Microsoft 365
data, we would send people to Copilot Studio or Cowork, if UA licenses them [confirm]. Microsoft's
app building is in preview, has no brief, requirements or multi-person approvals, cannot yet promote
apps to test or production, and does not read Snowflake's certified definitions. If it adds those,
the exit ramp applies.

**"UA engineering already uses AWS AI-DLC. Why a second line?"** It is the same line. HyperDelivery
uses AI-DLC's phase names and hands over in engineering's AI-DLC context-file format. AI-DLC is built
for developers in an IDE and, by AWS's own scope, not for non-developers; HyperDelivery is the
business-facing front half that ends where engineering's Construction begins.

**"Why not just give business users Factory, Claude Code or Copilot?"** They expect an engineer, a
repository and a terminal or IDE, and they reach production quickly, which is exactly what we do not
want unreviewed for business-built tools. They are the right engines for Construction, and UA
already has Factory and Copilot; HyperDelivery can hand work to them.

**"Lovable or v0 would be faster and prettier."** Yes, and we concede looks. They are single-user,
start from a prompt rather than a brief, and are not sanctioned for UA data [confirm]. Their 2026
enterprise features (publish approvals, Snowflake hosting in beta) are worth watching, and we would
reuse patterns, not route UA data to them.

**"Won't Snowflake do this?"** Snowflake is moving toward governed apps next to UA's data, and for a
Snowflake-only data app built by someone who writes code, CoCo with App Runtime or Streamlit is the
better home. Snowflake's builders are for analysts and engineers, and its apps are single-platform;
HyperDelivery is for business teammates, many systems and many people. We would use Snowflake as the
runtime, not compete with it.

**"Why stop at Inception?"** Because after the prototype, work touches production systems and data,
and UA should choose deliberately between AI-driven and AI-assisted Construction. Stopping at a
sandbox prototype on dev data keeps risk low for the pilot, and the handoff package lets engineering
continue in its own AI-DLC pipeline.

**"What if a vendor ships all of this next quarter?"** We move onto it. The plan's exit ramp keeps
only what is UA's: the golden paths, the confirmed context and the decision record. The watch list
below says what would trigger that.

## 8. Watch list

| Watch | Trigger that changes the recommendation | What we would do |
|---|---|---|
| GitHub Universe (Oct 28 and 29, 2026), Chopin, Copilot app | Chopin becomes a supported product, or Copilot gains shared planning with decisions and Microsoft Teams | Offer it to engineering as the planning surface after handoff; borrow more of its decision model |
| Microsoft Copilot Managed Runtime | GA, plus promotion to test and production, plus approvals involving more than one person, plus a Snowflake connector that respects certified views | Move Microsoft 365-centered tools there and narrow HyperDelivery to multi-system work |
| Snowflake App Runtime, CoCo | GA, a business-user builder, and multi-party approvals | Make it the default prototype and T1 runtime for data apps |
| AWS AI-DLC and Kiro | A non-developer surface, or Principle 5 dropped; Kiro workflows with business-facing gates | Reuse the engine behind HyperDelivery's screens instead of our own stage logic |
| Anthropic | Claude Tag in Microsoft Teams; Claude Design turned on at UA [confirm] | Use Claude Design for Ideation mockups; test Tag for Teams questions |
| Factory, Devin | A business-user intake with a brief and approvals | Reassess whether HyperDelivery's front half should sit on the vendor UA already licenses |
| 8090 | Enterprise traction in retail, or a prototype stage | Compare in a vendor review |
| Lovable, v0 | Snowflake integration GA and a UA-sanctioned enterprise deal | Allow them as a prototype engine behind the same approvals |
| UA engineering's AI-DLC | Engineering accepts approval 2 as its approved design | Emit context files with `--require-context` handoffs |

## 9. Could not verify

- **UA's licenses and use** for Claude, Kiro, Devin, Microsoft 365 Copilot and Frontier, Rovo Dev,
  Snowflake CoCo and App Runtime, and any app builder are all [confirm], as in
  [tool-landscape.md](tool-landscape.md#8-could-not-verify).
- **Chopin's alpha** had not opened publicly as far as the repository and project page show.
- **8090's** deployment options (its FAQ answer did not load) and customers beyond those on its home page.
- **Google Jules** 2026 status and enterprise availability, and **Opal** in Workspace: secondary
  sources only, and they conflict.
- **OpenAI DevDay 2026** (Sep 29): its recap page returned 403, so nothing from it is used here.
- **Microsoft Copilot Code** details beyond the Managed Runtime page, and the exact date the runtime's
  public preview began.
- **Anthropic's playbook date**: the page says Aug 21, 2026; [anthropic-playbook.md](anthropic-playbook.md)
  linked it to an October article set.

## Sources

All retrieved 2026-10-26 unless the report linked says otherwise.

**GitHub.** [Chopin project page](https://githubnext.com/projects/chopin/);
[Chopin README](https://github.com/githubnext/chopin/blob/main/README.md);
[Chopin repository](https://github.com/githubnext/chopin);
[Chopin implementation lifecycle](https://github.com/githubnext/chopin/blob/main/docs/implementation-lifecycle.md);
[Chopin issue #595](https://github.com/githubnext/chopin/issues/595);
[Spec Kit site](https://github.github.com/spec-kit/); [Spec Kit releases](https://github.com/github/spec-kit/releases);
[Copilot app GA](https://github.blog/changelog/2026-06-17-github-copilot-app-generally-available);
[Copilot on GitHub.com](https://docs.github.com/en/copilot/concepts/copilot-surfaces/copilot-on-github);
[Copilot in Teams](https://github.blog/changelog/2026-10-23-turn-notifications-into-code-with-github-copilot-in-teams);
[Spark deprecation](https://github.blog/changelog/2026-08-04-upcoming-deprecation-of-github-spark-on-github-com).

**Anthropic.** [The AI-native SDLC playbook](https://claude.com/resources/articles/the-ai-native-sdlc-playbook);
[Claude Design](https://claude.com/product/design); [Cowork](https://claude.com/product/cowork);
[Claude Tag](https://claude.com/product/tag).

**AWS.** [AI-DLC blog](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/);
[aidlc-workflows](https://github.com/awslabs/aidlc-workflows), its
[README](https://github.com/awslabs/aidlc-workflows/blob/main/README.md),
[CHANGELOG](https://github.com/awslabs/aidlc-workflows/blob/main/CHANGELOG.md),
[releases](https://github.com/awslabs/aidlc-workflows/releases),
[phases and stages](https://github.com/awslabs/aidlc-workflows/blob/main/docs/guide/04-phases-and-stages.md) and
[audit format](https://github.com/awslabs/aidlc-workflows/blob/main/core/knowledge/aidlc-shared/audit-format.md);
[Kiro GA](https://kiro.dev/blog/general-availability/); [Kiro workflows](https://kiro.dev/blog/introducing-workflows/);
[Kiro Crew (SiliconANGLE, secondary)](https://siliconangle.com/2026/08/04/aws-launches-kiro-crew-autonomous-agentic-orchestrator-24-7-code-development/).

**Factory.** [Home page](https://factory.com/); [docs index](https://docs.factory.com/llms.txt);
[Missions](https://docs.factory.com/missions/overview.md).

**Cognition.** [Blog index](https://cognition.com/blog/1); [docs index](https://docs.devin.ai/llms.txt);
[Ask Devin](https://docs.devin.ai/work-with-devin/ask-devin.md);
[Microsoft Teams](https://docs.devin.ai/integrations/microsoft-teams.md);
[app deployments](https://docs.devin.ai/product-guides/deployment-capabilities.md);
[testing and recordings](https://docs.devin.ai/work-with-devin/testing-and-recordings.md);
[data analyst](https://docs.devin.ai/work-with-devin/data-analyst.md);
[enterprise deployment](https://docs.devin.ai/enterprise/deployment/overview.md).

**Microsoft.** [Copilot Managed Runtime](https://learn.microsoft.com/microsoft-365/managed-apps/);
[Build apps in Copilot Cowork and Copilot Studio](https://www.microsoft.com/microsoft-copilot/blog/copilot-studio/build-apps-in-copilot-cowork-and-copilot-studio/);
[Migrate apps created from Power Apps Vibe](https://learn.microsoft.com/power-apps/vibe/migrate-apps).

**Atlassian.** [Rovo Dev in Jira](https://www.atlassian.com/blog/company-news/rovo-dev-in-jira);
[Jira coding agent](https://support.atlassian.com/jira-software-cloud/docs/what-is-the-jira-coding-agent/).

**Google.** [I/O 2026 developer highlights](https://blog.google/intl/ja-jp/company-news/technology/google-io-2026-developer-highlights/);
[Antigravity 2.0](https://antigravity.google/product/antigravity-2);
[Firebase Studio sunset](https://firebase.google.com/docs/studio/migrating-project);
[Opal workflows (TechCrunch, secondary)](https://www.techcrunch.com/2026/02/24/google-adds-a-way-to-create-automated-workflows-to-opal/).

**App builders.** [Lovable blog](https://lovable.dev/blog/summer-2026);
[Lovable workspace policies](https://docs.lovable.dev/features/workspace-policies);
[PCWorld on Lovable (secondary)](https://www.pcworld.com/article/3211855/);
[v0 Snowflake docs](https://v0.app/docs/snowflake);
[Bolt and Microsoft](https://bolt.new/blog/bolt-microsoft-partnership);
[Replit changelog](https://docs.replit.com/updates/2026/08/07/changelog.md).

**Snowflake.** [Snowflake Apps](https://www.snowflake.com/en/blog/snowflake-apps-build-deploy-faster/);
[Snowflake CoWork](https://www.snowflake.com/en/product/snowflake-cowork/).

**Others.** [8090](https://8090.ai/); [Palantir AI FDE](https://www.palantir.com/docs/foundry/ai-fde/overview).

**This repository.** [enterprise-plan.md](../enterprise-plan.md), [operating-model.md](../operating-model.md)
and the research reports linked at the top.
