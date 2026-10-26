<!-- Point-in-time research, retrieved 2026-10-26 for the UA-DLC plan (round 7: where HyperDelivery fits among the tools UA teammates can use). Claims carry source links; vendor names, features, plans and prices change monthly, so verify before acting. Anything about UA's own licenses or internal use is marked [confirm]. See README.md in this folder. -->
<!-- cspell:words Bugbot Kiro Kiro's Slackbot Snowsight automations managedapps merill sandboxing worktrees -->

# Where HyperDelivery fits among the tools UA teammates can use

Research key: `tool-landscape`. Date: 2026-10-26. Prompted by the owner's ask to move "which tool
should I use" out of the product and into the plan, as two simple visuals: a complexity matrix and a
use-case matrix, comparing HyperDelivery with Snowflake, Cortex Code, GitHub Copilot, Palantir
Foundry and AIP, Factory, Claude Code, agentic IDEs as a group, and Microsoft Copilot. Starts from
what the plan already says ([enterprise-plan.md](../enterprise-plan.md) sections 1 and 5 and "Where
we route instead") and from earlier rounds ([software-factories.md](software-factories.md),
[delegation-coco-coding.md](delegation-coco-coding.md),
[factory-sources-round4.md](factory-sources-round4.md),
[ua-marketplace-alignment.md](ua-marketplace-alignment.md),
[under-armour-context.md](under-armour-context.md)), then re-checks each tool against vendor
documentation and announcements. HyperDelivery is described as the Final MVP will build it
([platform-architecture.md](../platform-architecture.md)), not as today's pilot.

## Bottom line

1. **HyperDelivery is the best fit for one kind of request:** a new tool that a business teammate
   starts, that needs input from more than one function and more than one system, and that needs
   approvals, a record of decisions and a path to production. For every other common request,
   another tool UA can use wins or ties. The plan should say so plainly.
2. **Questions about data go to Snowflake CoWork.** "CoWork" is not a UA label: it is Snowflake's
   own product name, formerly Snowflake Intelligence, renamed at Snowflake Summit on June 2, 2026,
   and Snowflake's announcement names Under Armour as a CoWork customer
   ([press release](https://www.nasdaq.com/press-release/snowflake-cowork-powers-agentic-enterprise-personal-agent-knowledge-workers-work),
   [product page](https://www.snowflake.com/en/product/snowflake-cowork/)). Dashboards go to
   Snowsight, or to EDMA's BI team when they recur on certified data.
3. **Personal Microsoft 365 work and simple team tools on Microsoft 365 data go to Microsoft 365
   Copilot, Copilot Cowork and Copilot Studio,** if UA licenses them [confirm]. Microsoft's
   business-user app building (Cowork's App skill, Copilot Studio Apps, Copilot Managed Runtime) is
   in Frontier or preview, and the App Builder agent retires on November 30, 2026
   ([Managed Runtime](https://learn.microsoft.com/microsoft-365/managed-apps/),
   [MC1505609](https://mc.merill.net/message/MC1505609)).
4. **Single-source Snowflake apps and pipelines go to Cortex Code with Streamlit in Snowflake.**
   Cortex Code is now called Snowflake CoCo; Snowflake calls it "simply the new name for Cortex
   Code" ([product page](https://www.snowflake.com/en/product/snowflake-coco/)).
5. **Operational apps on data that already lives in Palantir's Ontology go to Foundry and AIP.**
   That is Palantir's real strength: typed objects, links and actions that people and agents both
   use, with write-back. Whether UA uses Foundry is [confirm]; no public source links UA to
   Palantir, and UA's stated tenet of not moving data out of Snowflake limits where Palantir can win.
6. **Engineering work in existing codebases goes to engineering's coding agents:** GitHub Copilot,
   Factory, Claude Code and the agentic IDEs. They overlap heavily, so the choice is about what UA
   licenses and supports. UA's AI marketplace defaults to Factory (Droid) and GitHub Copilot, and
   Factory's home page still shows the Under Armour logo (checked 2026-10-26).
7. **Several names the plan uses changed in 2026** (section 7): Cortex Code is CoCo, Windsurf is
   Devin Desktop, Cursor is part of SpaceX, GitHub Copilot bills in AI Credits, and Palantir's AIP
   Agent Studio is now AIP Chatbot Studio.

## 1. How to read the two matrices

**The complexity matrix** places each tool where it does its best work.

- **Across (how far the result goes):**
  - *An answer:* a number, a chart, a summary or a report. Nothing is built.
  - *A personal tool:* an automation, prompt, agent or script one person runs for themselves.
  - *A team app:* an app or agent a team uses, hosted inside the tool that built it.
  - *A path to production:* code in UA's repositories that goes through review, release and
    support, or a governed handoff to engineering.
- **Up (who builds):** a business teammate, an analyst (writes SQL or some Python), or an engineer.

**The use-case matrix** has one row per common request and one column per tool. Each cell says
**Best fit** (the home we would send this request to), Works (it can do it, with more effort or
a caveat) or Not for this. Marks describe a typical request, not every possible use.

## 2. The complexity matrix

| Who builds | An answer | A personal tool | A team app | A path to production |
|---|---|---|---|---|
| **Engineer** | | | | GitHub Copilot, Factory, Claude Code, agentic IDEs |
| **Analyst** | (Snowsight worksheets) | (Snowsight dashboards) | Cortex Code with Streamlit in Snowflake; Palantir Foundry and AIP | |
| **Business teammate** | Snowflake CoWork | Microsoft 365 Copilot and Cowork (with team tools on Microsoft 365 data in Copilot Studio) | | **HyperDelivery** (with analysts, data owners and engineers at its approvals) |

What the picture says:

- **The bottom-right cell is the gap.** Every tool that reaches a path to production expects an
  engineer at the keyboard. Every tool a business teammate can use alone stops at an answer, a
  personal tool or an app hosted inside that vendor's platform. HyperDelivery is meant to sit in
  that cell: a business teammate starts, and the right analysts, data owners and engineers join at
  the approvals, so the result can leave the sandbox.
- **The engineer row is crowded on purpose.** The four coding tools are close substitutes; the
  plan should not pick among them, and HyperDelivery's own coding agent stays behind the `Builder`
  port so it can follow whatever UA standardizes on.
- **Vendors are moving toward the gap.** Microsoft says Managed Runtime apps can use Git-backed
  source control and deployment stages (preview; Learn notes that moving Cowork- and Copilot
  Studio-built apps to test or production environments is not supported yet,
  [Vibe migration](https://learn.microsoft.com/power-apps/vibe/migrate-apps)); Snowflake's Cortex
  Sense plugins promise "concept to production in days" (announced June 2, 2026, private preview
  soon). Section 6 covers what would make the plan's exit ramp apply.

## 3. The use-case matrix

Columns: **CoWork** = Snowflake CoWork and Snowsight; **CoCo** = Cortex Code (Snowflake CoCo);
**Copilot** = GitHub Copilot; **Palantir** = Foundry and AIP; **Factory** = Factory (Droid);
**Claude** = Claude Code; **IDEs** = agentic IDEs (Cursor, Devin Desktop, Kiro); **Microsoft** =
Microsoft 365 Copilot, Copilot Studio and Cowork; **HD** = HyperDelivery (Final MVP).

| Use case | CoWork | CoCo | Copilot | Palantir | Factory | Claude | IDEs | Microsoft | HD |
|---|---|---|---|---|---|---|---|---|---|
| Ask a question of certified data | **Best fit** | Works | Not for this | Works | Not for this | Not for this | Not for this | Not for this | Not for this |
| Build a dashboard on governed data | **Best fit** | Works | Not for this | Works | Not for this | Not for this | Not for this | Not for this | Not for this |
| Automate a personal Microsoft 365 task | Not for this | Not for this | Not for this | Not for this | Not for this | Not for this | Not for this | **Best fit** | Not for this |
| A recurring write-up from the same sources | Works | Not for this | Not for this | Not for this | Not for this | Not for this | Not for this | **Best fit** | Not for this |
| A simple team workflow, form or tracker | Not for this | Not for this | Not for this | Works | Not for this | Not for this | Not for this | **Best fit** | Works |
| A Streamlit data app on one Snowflake source | Not for this | **Best fit** | Works | Not for this | Works | Works | Works | Not for this | Works |
| A data pipeline or transform in Snowflake | Not for this | **Best fit** | Works | Not for this | Works | Works | Works | Not for this | Not for this |
| An operational app on governed enterprise data | Not for this | Works | Works | **Best fit** | Works | Works | Works | Not for this | Works |
| Review or fix code | Not for this | Works | **Best fit** | Not for this | **Best fit** | **Best fit** | **Best fit** | Not for this | Not for this |
| Change an existing codebase | Not for this | Works | **Best fit** | Not for this | **Best fit** | **Best fit** | **Best fit** | Not for this | Not for this |
| A large, multi-part engineering project | Not for this | Not for this | Works | Not for this | **Best fit** | **Best fit** | Works | Not for this | Not for this |
| A cross-functional new tool that needs a path to production | Not for this | Not for this | Works | Works | Works | Works | Works | Not for this | **Best fit** |

Notes on the cells:

- **Dashboards:** a recurring dashboard on certified data belongs to EDMA's BI team (Tableau or
  Power BI), which is not a column here. Snowsight dashboards and CoWork's published dashboards
  (public preview soon as of June 2, 2026) suit an analyst's own view.
- **Palantir's Best fit and Works marks assume the data is already in Foundry.** For data that
  lives only in Snowflake, Palantir is Not for this until UA decides otherwise [confirm].
- **Microsoft's marks assume Microsoft 365 Copilot licenses and, for app building, Frontier
  enrollment** [confirm]. Its app building is preview, so "Best fit" for a team tracker is a
  forward-looking call.
- **HyperDelivery's Works marks** are for the shapes the pilot will try: a workflow tool, a
  Teams-centered process and a data app. A simple tool on Microsoft 365 data alone still goes to
  Copilot Studio first, and a single-source Snowflake app built by someone who writes code still
  goes to Cortex Code. Publishing to Streamlit in Snowflake arrives in the Enterprise phase.
- **Review or fix code, and change a codebase:** a business team's change to a tool HyperDelivery
  built goes back through HyperDelivery; engineering's own codebases stay with engineering's tools.
- **The engineering columns are interchangeable for most rows.** The difference is licensing,
  support and where the code may run, not capability.

## 4. Tool by tool

### 4.1 Snowflake CoWork and Snowsight

- **Name.** Snowflake CoWork, formerly Snowflake Intelligence. The product page says "Snowflake
  Intelligence is now Snowflake CoWork" and that existing customers need take no action
  ([product page](https://www.snowflake.com/en/product/snowflake-cowork/)). The renaming was
  announced at Snowflake Summit 26 on June 2, 2026
  ([press release](https://www.nasdaq.com/press-release/snowflake-cowork-powers-agentic-enterprise-personal-agent-knowledge-workers-work)).
  The plan's use of "Snowflake CoWork" is correct and is not a UA-only name.
- **Who it is for.** Knowledge workers and business users; data teams add Verified Answers and
  semantic views ([docs](https://docs.snowflake.com/user-guide/snowflake-cortex/snowflake-cowork)).
- **What it builds.** Cited answers in natural language; Deep Research reports across structured
  and unstructured data (generally available soon, as of June 2); Artifacts, which save charts and
  tables and share a conversation (generally available soon); publishable dashboards inside
  Artifacts and User Skills for repeatable workflows (both public preview soon); Cortex Sense, a
  shared context layer with prebuilt role plugins (private preview soon)
  ([press release](https://www.nasdaq.com/press-release/snowflake-cowork-powers-agentic-enterprise-personal-agent-knowledge-workers-work)).
  Snowsight adds worksheets and dashboards made of query tiles, shared with people or by link and
  viewed under the viewer's role
  ([Snowsight dashboards](https://docs.snowflake.com/en/user-guide/ui-snowsight-dashboards)).
- **Where it runs.** Inside Snowflake: on the web and in an iOS app; a Slackbot and an Excel
  extension were announced as private preview soon. Microsoft Teams, Outlook and Exchange connect
  through custom MCP today ([product page](https://www.snowflake.com/en/product/snowflake-cowork/)).
- **Data access.** Cortex Agents route each question to Cortex Analyst (SQL over semantic views),
  Cortex Search (documents) or custom tools
  ([docs](https://docs.snowflake.com/user-guide/snowflake-cortex/snowflake-cowork),
  [build agents](https://docs.snowflake.com/en/user-guide/snowflake-cortex/snowflake-cowork/build-agents)).
  MCP connectors for Google Drive, Salesforce and Slack were generally available as of June 2.
- **Governance.** CoWork "inherits and respects" row access policies and column-level security;
  admins provision users through Okta or Entra ID and set budgets and per-user credit limits
  ([docs](https://docs.snowflake.com/user-guide/snowflake-cortex/snowflake-cowork),
  [shared budgets](https://docs.snowflake.com/en/user-guide/snowflake-cortex/snowflake-cowork/cowork-shared-budgets)).
- **Path to production.** None in the software sense. An answer, artifact or dashboard is shared
  inside Snowflake.
- **Status and pricing.** In use by "thousands" of customers; several June features are still
  labeled soon or preview. Billed in AI Credits by token consumption, with no per-seat fee; an AI
  Credit is $2.00 with global routing or $2.20 with regional routing
  ([AI pricing](https://docs.snowflake.com/user-guide/snowflake-cortex/pricing)).
- **At UA.** Snowflake's June 2 announcement names Under Armour among CoWork customers, and the
  [case study](https://www.snowflake.com/en/customers/all-customers/case-study/under-armour/)
  describes CoWork, CoCo and the golden-report pattern. Who at UA has CoWork today, and over which
  semantic views, is [confirm].
- **Best at.** Certified answers for business teammates without moving data.

### 4.2 Cortex Code (Snowflake CoCo)

- **Name.** "Snowflake CoCo is simply the new name for Cortex Code," with functionality and
  architecture unchanged ([product page](https://www.snowflake.com/en/product/snowflake-coco/));
  the docs now title it "Overview of Snowflake CoCo"
  ([docs](https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code)). The plan can keep
  "Cortex Code" and add "(now Snowflake CoCo)" once.
- **Who it is for.** Data engineers, analysts who write code, ML and AI teams, and account admins.
- **What it builds.** SQL and Python notebooks, data pipelines (dbt, Airflow, Spark, AWS Glue),
  ML pipelines, Streamlit apps and Cortex agents; it also answers admin questions about credits,
  query performance and permissions
  ([docs](https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code),
  [product page](https://www.snowflake.com/en/product/snowflake-coco/)).
- **Where it runs.** In Snowsight Workspaces (generally available March 9, 2026,
  [release note](https://docs.snowflake.com/release-notes/2026/other/2026-03-09-cortex-code-snowsight-ga));
  as CoCo Desktop for macOS and Windows (the product page labels it "Now GA"); as a CLI in a local
  shell or CI; inside editors through the Agent Client Protocol (Zed, JetBrains, VS Code, Neovim);
  and as a plugin for Claude Code.
- **Data access.** The user's own Snowflake connection; it runs SQL and reads the catalog, lineage
  and access policies so generated code names real objects.
- **Governance.** Runs under the user's role (RBAC), supports Restricted Session Scope, OS-level
  sandboxing and a three-tier approval system in the CLI, and shows a diff before applying changes
  in Snowsight ([docs](https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code)).
  Per-user quotas are in public preview.
- **Path to production.** Through the team's own Git and CI (the CLI supports `git` worktrees);
  Streamlit in Snowflake apps are shared by role
  ([Streamlit in Snowflake](https://docs.snowflake.com/developer-guide/streamlit/about-streamlit)).
  There is no business approval line.
- **Status and pricing.** Generally available in Snowsight and Desktop. Inside an account it is
  billed in AI Credits ([AI pricing](https://docs.snowflake.com/user-guide/snowflake-cortex/pricing));
  the product page's self-serve offer is a 30-day trial with $40 of inference credits, then $20 a
  month plus token use and Snowflake compute.
- **At UA.** The case study names CoCo; an EDMA job posting names Cortex Code (per
  [under-armour-context.md](under-armour-context.md), not re-read); HyperDelivery's Final MVP uses
  it as the read-only data specialist. Who at UA has it is [confirm].
- **Best at.** Single-source Snowflake work by someone who writes code.

### 4.3 GitHub Copilot

- **Who it is for.** Developers.
- **What it builds.** Code, through completions, chat and agent mode in the editor; the Copilot
  CLI; the GitHub Copilot app, a desktop app for agent sessions on macOS, Windows and Linux
  (generally available June 17, 2026,
  [changelog](https://github.blog/changelog/2026-06-17-github-copilot-app-generally-available); on
  every Copilot plan since July 7, 2026,
  [changelog](https://github.blog/changelog/2026-07-07-github-copilot-app-available-to-all/));
  and the cloud agent (formerly the coding agent), which researches, plans, edits, runs tests and
  opens a pull request in the background
  ([cloud agent](https://docs.github.com/en/copilot/concepts/copilot-surfaces/copilot-on-github)).
  Copilot code review reviews pull requests.
- **Where it runs.** In the developer's editor, or for the cloud agent in an ephemeral cloud
  environment on GitHub, for GitHub-hosted repositories only.
- **Data access.** The repository, plus MCP servers; by default the GitHub MCP server covers only
  the working repository.
- **Governance.** Organization policies, branch rulesets (Copilot can be a bypass actor), session
  logs, and pull request review. Each cloud agent task is capped at 59 minutes, one repository,
  one branch and one pull request ([cloud agent](https://docs.github.com/en/copilot/concepts/copilot-surfaces/copilot-on-github)).
- **Path to production.** The team's normal pull request, review and CI/CD.
- **Status and pricing.** Agent mode, the cloud agent, code review, the CLI and the app are all in
  Copilot Business and Enterprise ([plans](https://docs.github.com/en/copilot/get-started/plans)).
  Since June 1, 2026, Copilot bills in GitHub AI Credits metered by tokens instead of premium
  requests; Business stays $19 and Enterprise $39 per user per month, each including that amount in
  credits, with budgets at enterprise, cost-center and user level
  ([GitHub blog](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/)).
  GitHub stopped building a business-user app builder: Spark took no new apps from August 4, 2026,
  existing users could export apps until August 31, and apps already deployed keep running, with
  builders pointed back to VS Code, the CLI and the app
  ([changelog](https://github.blog/changelog/2026-08-04-upcoming-deprecation-of-github-spark-on-github-com)).
- **At UA.** UA job postings name Copilot; today's pilot builds with the cloud agent
  ([current-state.md](../current-state.md)); UA's AI marketplace defaults to Factory and Copilot
  ([ua-marketplace-alignment.md](ua-marketplace-alignment.md)). Seat counts and plan are [confirm].
- **Best at.** Everyday engineering in GitHub: changes, reviews and fixes inside existing repositories.

### 4.4 Palantir Foundry and AIP

- **Who it is for.** Operational users who work in the apps, application builders, data engineers,
  and Palantir's own deployment engineers.
- **What it builds.**
  - The **Ontology**, "an operational layer for the organization": objects, properties and links
    over datasets, virtual tables and models, plus actions and functions that change them
    ([Ontology](https://www.palantir.com/docs/foundry/ontology/overview)).
  - **Workshop** operational apps, such as inbox and task management or a common operational
    picture, with write-back through actions
    ([Workshop](https://www.palantir.com/docs/foundry/workshop/overview)).
  - **AIP Logic**, "a no-code development environment for building, testing, and releasing functions
    powered by LLMs"; its Ontology edits can be applied automatically or staged for human review
    ([AIP Logic](https://www.palantir.com/docs/foundry/logic/overview)).
  - **AIP Chatbot Studio**, previously AIP Agent Studio, for assistants that read and write, used in
    Workshop or through the Ontology SDK
    ([Chatbot Studio](https://www.palantir.com/docs/foundry/chatbot-studio/overview)).
  - **AI FDE**, an agent that operates Foundry from chat (pipelines, Ontology edits, functions,
    React apps) and proposes changes on a branch or as a pull request
    ([AI FDE](https://www.palantir.com/docs/foundry/ai-fde/overview)).
  - Custom React apps on the Ontology SDK, hosted on Foundry as static sites
    ([Developer Console](https://www.palantir.com/docs/foundry/developer-console/overview/)).
- **Where it runs.** A Palantir-operated Foundry enrollment.
- **Data access.** Data is integrated into Foundry or exposed to it as virtual tables; apps and
  agents read the Ontology, not source systems directly.
- **Governance.** One platform security model for apps and agents, branching with reviewable
  proposals, and AIP Evals. Palantir notes that the access controls that filter what a model reads
  "do not extend to the model's output or any Ontology edits it composes," and recommends markings
  or classification-based access to cover them ([AIP Logic](https://www.palantir.com/docs/foundry/logic/overview)).
- **Path to production.** Inside Foundry: a Workshop app is the production app for the users who
  work there. Leaving Foundry is not the point.
- **Status and pricing.** Commercial products; AIP features vary by customer ("subject to change
  and may differ between customers," [AI FDE](https://www.palantir.com/docs/foundry/ai-fde/overview)).
  No public price list; usage is metered in compute-seconds and gigabyte-months of storage
  ([usage types](https://www.palantir.com/docs/foundry/resource-management/usage-types)) under an
  enterprise agreement.
- **At UA.** [confirm] whether UA licenses Foundry or AIP and which data is in it. No public source
  was found. UA's case study states a tenet of not moving data out of Snowflake; whether Foundry
  virtual tables over Snowflake would satisfy it is [confirm].
- **Best at.** Operational apps where many people act on a shared object model with write-back,
  once the data and the Ontology exist.

### 4.5 Factory (Droid)

- **Who it is for.** Engineering teams.
- **What it builds.** Code, through one agent, Droid, which "runs the same everywhere": a desktop
  app, a CLI, IDE integrations (VS Code, Cursor, Windsurf, JetBrains, Zed), delegations from Slack,
  Linear, Jira and Microsoft Teams, Droid Exec for CI, and automations for triage, QA, incident
  response and release ([docs index](https://docs.factory.com/llms.txt),
  [welcome](https://docs.factory.com/welcome/index.md)). **Missions** plan large, multi-feature work
  as milestones; a person approves the plan before Mission Control runs it
  ([Missions](https://docs.factory.com/missions/overview.md)). It also runs code review and
  STRIDE/OWASP security review.
- **Where it runs.** On the developer's machine, in Factory cloud environments and Droid Computers,
  or, on Enterprise, on dedicated compute, on-premises or air-gapped.
- **Data access.** Repositories, MCP servers, and any model through Factory's router or the
  customer's own endpoints ([home page](https://factory.com/)).
- **Governance.** Business adds SSO, SAML/SCIM, zero data retention, audit logs and admin controls
  over model choice, autonomy level, deny lists and network policy; Enterprise adds sub-organizations,
  data residency and dedicated inference ([pricing](https://factory.com/pricing)).
- **Path to production.** The team's own repository and CI.
- **Status and pricing.** Pro $20, Plus $100 and Max $200 a month; Teams $60 a month per team plus
  $40 per seat; Business and Enterprise priced by sales ([pricing](https://factory.com/pricing)).
- **At UA.** Factory's home page logo wall includes Under Armour (raw HTML `aria-label="Under
  Armour"`, checked 2026-10-26; [home page](https://factory.com/)). UA's AI marketplace ships
  droids and scores coding fixtures through Droid and Copilot
  ([ua-marketplace-alignment.md](ua-marketplace-alignment.md)). What UA licenses, for whom, is [confirm].
- **Best at.** Organization-wide engineering automation and large multi-part projects with an
  approved plan, without locking to one model vendor.

### 4.6 Claude Code

- **Who it is for.** Developers, and technical analysts comfortable in a terminal or editor.
- **What it builds.** Code across a whole repository: features, fixes, tests, commits and pull
  requests; parallel subagents, projects that coordinate several cloud sessions, scheduled tasks,
  automatic PR review and auto-fix, GitHub Actions, and an Agent SDK for custom agents
  ([overview](https://code.claude.com/docs/en/overview)).
- **Where it runs.** In the terminal, VS Code, JetBrains, a desktop app, the browser and Slack.
  Cloud sessions run in Anthropic-managed VMs or in the organization's self-hosted environment; the
  CLI and IDE extensions can also use Amazon Bedrock or Google Cloud, but cloud sessions need an
  Anthropic account ([cloud sessions](https://code.claude.com/docs/en/claude-code-on-the-web)).
- **Data access.** The repository and MCP servers (Jira, Google Drive, Slack, custom tools).
- **Governance.** Permission modes, organization policies, network access levels for cloud
  sessions, and custom roles. In Anthropic-hosted environments GitHub credentials "never enter a
  session's VM"; a proxy attaches them server-side
  ([cloud sessions](https://code.claude.com/docs/en/claude-code-on-the-web)).
- **Path to production.** The team's own pull request and CI.
- **Status and pricing.** Included in Pro ($20 a month), Max (from $100), Team (standard and premium
  seats) and Enterprise ($20 per seat per month billed annually, 20-seat minimum, plus usage at API
  rates) ([pricing](https://claude.com/pricing)); also usable pay-as-you-go through the API or
  Bedrock. OpenAI's Codex is a close peer and is also on Bedrock
  ([AWS](https://aws.amazon.com/blogs/aws/get-started-with-openai-gpt-5-5-gpt-5-4-models-and-codex-on-amazon-bedrock/)).
- **At UA.** UA's AI marketplace is written to work with Claude Code, and an EDMA posting names
  Claude (per earlier rounds). Whether UA licenses Claude Code is [confirm]. HyperDelivery's own
  coding agent is the AgentCore harness in the sandbox account, not Claude Code
  ([agentcore-harness-coding.md](agentcore-harness-coding.md)).
- **Best at.** Deep work across a whole codebase, from a laptop or in the cloud.

### 4.7 Agentic IDEs as a group (Cursor, Devin Desktop, Kiro and others)

- **Who they are for.** Individual developers, with team and enterprise plans on top.
- **What they build.** Code in the editor, with agents that also run in the cloud and open pull
  requests.
  - **Cursor.** An agent on every plan; cloud agents, automations and Bugbot code review from the
    Premium plan ($30 a month); Teams from $30 per user; Enterprise adds SCIM, audit logs and spend
    controls ([pricing](https://cursor.com/pricing)). Cursor became part of SpaceX on August 14,
    2026 ([Cursor blog](https://cursor.com/blog/joining-spacex)), and its lowest paid plan now
    offers only Grok models.
  - **Devin Desktop, formerly Windsurf.** windsurf.com now redirects to Devin; "Devin Desktop is the
    new name for Windsurf," an IDE plus a command center for local and cloud agents. Pro $20, Max
    $200, Teams $80 plus $40 per seat ([Devin Desktop](https://devin.ai/desktop)).
  - **Kiro (AWS).** Spec-driven (requirements, design, tasks), generally available since November 17,
    2025 ([GA post](https://kiro.dev/blog/general-availability/)); Kiro Web with cloud sessions,
    automations and an autonomous mode followed in 2026 ([blog](https://kiro.dev/blog/)). Enterprise
    sign-in through IAM Identity Center, billed through AWS; credit plans from $20 to $200 a month
    ([pricing](https://kiro.dev/pricing/)).
  - **Others.** Google Antigravity and editors that host agents over the Agent Client Protocol (Zed,
    JetBrains).
- **Where they run.** On the developer's machine, with each vendor's cloud for background agents.
- **Data access and governance.** The repository and MCP servers; enterprise plans add SSO, audit
  and spend controls.
- **Path to production.** The team's own pull request and CI.
- **At UA.** An EDMA posting names Cursor (per earlier rounds); licenses are [confirm].
- **What to take from the group.** Two of the three changed owner or name in 2026. That is one more
  reason HyperDelivery keeps its coding engine behind a replaceable contract.

### 4.8 Microsoft 365 Copilot, Copilot Studio and Copilot Cowork

- **Who it is for.** Every Microsoft 365 user (Copilot), makers (Copilot Studio), and business users
  who want an app from a chat (Cowork's App skill, Frontier only).
- **What it builds.**
  - **Copilot Cowork** carries out multi-step work: emails, documents, spreadsheets, meetings and
    apps. It asks for approval before any action such as sending or posting, and runs scheduled and
    event-driven tasks ([get started](https://learn.microsoft.com/copilot/microsoft-365/cowork/get-started)).
  - **Copilot Studio** is "a graphical, low-code studio for building and managing AI-powered agents
    and workflows," published to Teams, Microsoft 365 Copilot and websites. It runs on a choice of
    harnesses, including a GitHub Copilot harness for multi-step work; its Apps experience is in
    preview ([overview](https://learn.microsoft.com/en-us/microsoft-copilot-studio/fundamentals-what-is-copilot-studio)).
  - **Copilot Managed Runtime** (preview) hosts line-of-business apps built from Cowork, Copilot
    Studio, Copilot Code or its SDK and `ms` CLI; every app inherits tenant governance and appears in
    the admin center ([Managed Runtime](https://learn.microsoft.com/microsoft-365/managed-apps/)).
- **Where it runs.** Microsoft's cloud: the Copilot web app, Outlook, Teams and the desktop app;
  apps open from managedapps.cloud.microsoft.
- **Data access.** Microsoft 365 content and Work IQ, plus approved connectors that read and write
  "within your Microsoft 365 tenant boundary"
  ([Microsoft blog](https://www.microsoft.com/microsoft-copilot/blog/copilot-studio/build-apps-in-copilot-cowork-and-copilot-studio/)).
- **Governance.** Entra authentication, tenant defaults (approved connectors, sharing rules, content
  security policy), the admin center's app and agent inventory, and per-action approval in Cowork.
- **Path to production.** Microsoft says Managed Runtime apps can use Git-backed source control,
  deployment stages and version isolation (preview,
  [Microsoft blog](https://www.microsoft.com/microsoft-copilot/blog/copilot-studio/build-apps-in-copilot-cowork-and-copilot-studio/));
  Learn notes that moving Cowork- and Copilot Studio-built apps to test or production environments
  is not supported yet ([Vibe migration](https://learn.microsoft.com/power-apps/vibe/migrate-apps)).
  They run on Microsoft's runtime, not UA's.
- **Status and pricing.** Microsoft 365 Copilot is $30 per user per month paid yearly, on top of a
  qualifying Microsoft 365 plan ([Microsoft](https://www.microsoft.com/en-us/microsoft-365-copilot/enterprise)).
  Copilot Cowork is generally available (June 16, 2026); it needs a Microsoft 365 Copilot license,
  but its usage is billed separately in Copilot Credits, as are Copilot Code and the Work IQ APIs
  ([Microsoft Copilot blog](https://www.microsoft.com/en-us/copilot/blog/2026/06/16/copilot-cowork-is-now-generally-available/),
  [Learn](https://learn.microsoft.com/en-us/microsoft-365/admin/manage/apps/),
  [pricing](https://www.microsoft.com/en-us/microsoft-365-copilot/pricing)). Copilot Studio agents
  for internal use are included with a Microsoft 365 Copilot license on the standard harness;
  agents on the GitHub Copilot harness and Apps in Copilot Studio use Copilot Credits
  ([pricing](https://www.microsoft.com/en-us/microsoft-365-copilot/pricing),
  [Vibe migration](https://learn.microsoft.com/power-apps/vibe/migrate-apps)). Cowork's App skill
  needs Frontier enrollment. The App Builder agent and vibe.powerapps.com stopped taking new apps in
  mid-October and retire on November 30, 2026, with makers pointed to Cowork and Copilot Studio
  ([Vibe migration](https://learn.microsoft.com/power-apps/vibe/migrate-apps),
  [MC1505609](https://mc.merill.net/message/MC1505609)).
- **At UA.** Whether UA licenses Microsoft 365 Copilot, enrolls in Frontier or uses Copilot Studio is
  [confirm] (open since [critique.md](critique.md)).
- **Best at.** Personal work on Microsoft 365 content, and simple team tools on Microsoft 365 data.

### 4.9 HyperDelivery

- **Who it is for.** Business teammates with an idea for a tool, joined by the analysts, data owners
  and engineers its approvals call in ([enterprise-plan.md](../enterprise-plan.md) section 4).
- **What it builds.** A working prototype with the brief, plan, decisions and evidence behind it,
  at a risk tier: T0 Sandbox, T1 Team prototype, T2 Department app, or a T3 Production handoff to
  engineering ([operating-model.md](../operating-model.md)).
- **Where it runs.** On AWS: the console, the console API and Step Functions; in the Final MVP, a
  coding agent on the AgentCore harness in the sandbox account, with previews there and code in a
  prototype GitHub organization ([platform-architecture.md](../platform-architecture.md)).
- **Data access.** Snowflake through a Cortex Code data specialist on a read-only service user, so
  rows stay in Snowflake; Microsoft 365 files read as the person who pointed at them; Jira and
  Confluence; a per-project index of everything pointed at.
- **Governance.** Three human approvals, with risk deciding who signs; a do-no-harm floor in the
  first two build weeks; cost shown per turn and per project from day one. Entra roles, on-behalf-of
  identity, audit, cost enforcement, evals and policy come in the Enterprise phase.
- **Path to production.** "Both, by risk tier": a low-risk app stays with its business team under
  guardrails; anything touching sensitive data, sign-in or core systems goes to engineering as a
  complete package. The production stage itself is Enterprise-phase work.
- **Status and pricing.** Current State is the EDM pilot (end to end locally, verified on AWS as far
  as the first approval). The Final MVP builds in weeks 1 to 14 and pilots in weeks 15 to 22;
  Enterprise starts in week 23. Its cost is AWS usage (models, AgentCore) and the team, not seats.
- **At UA.** Built in EDM; [N] projects and teammates so far (filled in before the meeting).
- **Best at.** Cross-functional, multi-system tools that need approvals, a record and a path to
  production. **Not better at:** answers, dashboards, personal automation, simple Microsoft 365
  tools, single-source Snowflake apps, Foundry-native apps, engineering in existing codebases, or
  looks (vibe-coding builders will always win on polish).

## 5. Where HyperDelivery wins, and where it does not

**Where it wins.** No other tool here combines all five: a non-technical person can start it; input
from several functions is captured and attributed; numbers are tied to UA's certified definitions;
approvals scale with risk and are recorded with who decided and why; and the result can be handed to
engineering as a complete package. Each of the others has one or two of these. Engineering's coding
agents have review and a path to production but expect an engineer. CoWork and Microsoft 365 Copilot
reach business users but stop at answers or apps inside their own platform. Palantir has the object
model and write-back, but only for data in Foundry.

**Where it does not, yet.** Most of what puts HyperDelivery in that cell is Final MVP work, not
today's pilot: the plan's own table marks cross-functional discovery, pointed context and governed
data as "No" or "Partly" today ([enterprise-plan.md](../enterprise-plan.md) section 5). Until the
pilot readout, the honest claim is that HyperDelivery is designed for the gap, not that it already
fills it.

**What this means for the app.** None of this belongs in the product's screens. If a request is a
better fit elsewhere, the person who runs the line says so in conversation; the plan holds the
matrices.

## 6. What could change this picture

- **Microsoft Copilot Managed Runtime** already gives business users apps under tenant governance,
  in preview, and Microsoft says they can use Git-backed source control and deployment stages
  (Learn notes that moving Cowork- and Copilot Studio-built apps to test or production environments
  is not supported yet, [Vibe migration](https://learn.microsoft.com/power-apps/vibe/migrate-apps)).
  If it adds multi-party input, approvals by risk and grounding in Snowflake's certified data, it
  covers much of HyperDelivery's cell for apps that can live on Microsoft's runtime.
- **Snowflake Cortex Sense** prebuilt plugins aim to take agents "from concept to production in days
  instead of weeks" (announced June 2, 2026, private preview soon). That is agents on Snowflake data,
  not multi-system apps, but it moves Snowflake toward the gap.
- **Factory Missions, Claude Code projects and Palantir AI FDE** all approve a plan before the work
  runs. They are engineer-facing today.

The plan's exit ramp already covers this: if a sanctioned vendor tool supports multi-party discovery,
signed approvals and grounding in UA's golden reports, move the process onto it and keep only what is
UA's: the golden paths, the confirmed context and the decision record
([enterprise-plan.md](../enterprise-plan.md) section 5). Re-check this matrix at the pilot readout.

## 7. Name changes and corrections for the plan

| What the plan or earlier research says | What is true on 2026-10-26 | Source |
|---|---|---|
| "Snowflake CoWork" (owner's question: a UA label?) | Snowflake's own product name, formerly Snowflake Intelligence, renamed June 2, 2026. The "renamed" claim [critique.md](critique.md) could not re-verify is now confirmed | [product page](https://www.snowflake.com/en/product/snowflake-cowork/) |
| UA uses CoWork (case study only) | Also stated in Snowflake's June 2 press release | [press release](https://www.nasdaq.com/press-release/snowflake-cowork-powers-agentic-enterprise-personal-agent-knowledge-workers-work) |
| "Cortex Code" | Renamed Snowflake CoCo on June 2, 2026; same product | [product page](https://www.snowflake.com/en/product/snowflake-coco/) |
| Factory lists UA as a customer | Still true; logo on factory.com, checked 2026-10-26 | [home page](https://factory.com/) |
| Copilot premium requests | GitHub AI Credits since June 1, 2026 | [GitHub blog](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/) |
| Windsurf | Devin Desktop (Cognition) | [Devin Desktop](https://devin.ai/desktop) |
| Cursor | Part of SpaceX since August 14, 2026 | [Cursor blog](https://cursor.com/blog/joining-spacex) |
| Palantir AIP Agent Studio | AIP Chatbot Studio | [docs](https://www.palantir.com/docs/foundry/chatbot-studio/overview) |
| Microsoft's new app runtime | Named Copilot Managed Runtime (preview); App Builder retires November 30, 2026 | [Learn](https://learn.microsoft.com/microsoft-365/managed-apps/), [Vibe migration](https://learn.microsoft.com/power-apps/vibe/migrate-apps), [MC1505609](https://mc.merill.net/message/MC1505609) |
| Kiro's autonomous agent in preview ([software-factories.md](software-factories.md)) | Kiro Web (May 2026) has cloud sessions and an autonomous mode; its current release status was not confirmed | [blog](https://kiro.dev/blog/) |

## 8. Could not verify

- **UA's licenses and use, all [confirm]:** CoWork scope and semantic views; Cortex Code users;
  GitHub Copilot plan and seats; Palantir Foundry or AIP at all; Factory scope; Claude Code; Cursor or
  other IDEs; Microsoft 365 Copilot, Frontier and Copilot Studio. The plan's license inventory
  ([enterprise-plan.md](../enterprise-plan.md) section 13) should add Palantir and Claude Code.
- **Snowflake's June labels.** Several CoWork features were "generally available soon" or "preview
  soon" on June 2; their status in October was not re-checked feature by feature.
- **Cortex Code billing** for the self-serve subscription versus usage inside an existing account;
  the AI pricing page lists it under AI Credits without detail.
- **Palantir:** AI FDE's release status, and whether virtual tables over Snowflake avoid copying data.
- **Microsoft:** whether UA has turned on usage-based billing for Cowork [confirm].
- **Agentic IDEs:** model access on Cursor's business plans after the SpaceX acquisition.
- **Job postings** naming Copilot, Claude, Cursor and Cortex Code come from earlier rounds and were
  not re-read.

## Sources

### Snowflake

- [Snowflake CoWork product page](https://www.snowflake.com/en/product/snowflake-cowork/)
- [Snowflake CoWork Powers the Agentic Enterprise as the Personal Agent for Knowledge Workers to Work Smarter](https://www.nasdaq.com/press-release/snowflake-cowork-powers-agentic-enterprise-personal-agent-knowledge-workers-work) (Business Wire, June 2, 2026, read through Nasdaq)
- Snowflake documentation: [Overview of Snowflake CoWork](https://docs.snowflake.com/user-guide/snowflake-cortex/snowflake-cowork), [Build agents](https://docs.snowflake.com/en/user-guide/snowflake-cortex/snowflake-cowork/build-agents), [CoWork shared resource budgets](https://docs.snowflake.com/en/user-guide/snowflake-cortex/snowflake-cowork/cowork-shared-budgets), [Snowflake AI pricing](https://docs.snowflake.com/user-guide/snowflake-cortex/pricing), [Snowsight dashboards](https://docs.snowflake.com/en/user-guide/ui-snowsight-dashboards), [About Streamlit in Snowflake](https://docs.snowflake.com/developer-guide/streamlit/about-streamlit)
- [Snowflake CoCo product page](https://www.snowflake.com/en/product/snowflake-coco/), [Overview of Snowflake CoCo](https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code), [Cortex Code in Snowsight general availability](https://docs.snowflake.com/release-notes/2026/other/2026-03-09-cortex-code-snowsight-ga) (March 9, 2026)
- [Under Armour case study](https://www.snowflake.com/en/customers/all-customers/case-study/under-armour/)

### GitHub

- [GitHub Copilot on GitHub.com](https://docs.github.com/en/copilot/concepts/copilot-surfaces/copilot-on-github) (the cloud agent; formerly "About Copilot cloud agent"), [Copilot plans](https://docs.github.com/en/copilot/get-started/plans)
- [GitHub Copilot is moving to usage-based billing](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/) (April 27, 2026)
- [GitHub Copilot app generally available](https://github.blog/changelog/2026-06-17-github-copilot-app-generally-available) (June 17, 2026)
- [GitHub Copilot app available to all](https://github.blog/changelog/2026-07-07-github-copilot-app-available-to-all/) (July 7, 2026)
- [Upcoming deprecation of GitHub Spark](https://github.blog/changelog/2026-08-04-upcoming-deprecation-of-github-spark-on-github-com) (August 4, 2026)

### Palantir

- Foundry documentation: [Ontology](https://www.palantir.com/docs/foundry/ontology/overview), [Workshop](https://www.palantir.com/docs/foundry/workshop/overview), [AIP Logic](https://www.palantir.com/docs/foundry/logic/overview), [AIP Chatbot Studio](https://www.palantir.com/docs/foundry/chatbot-studio/overview), [AI FDE](https://www.palantir.com/docs/foundry/ai-fde/overview), [Developer Console](https://www.palantir.com/docs/foundry/developer-console/overview/), [Usage types](https://www.palantir.com/docs/foundry/resource-management/usage-types)

### Factory

- [Factory home page](https://factory.com/) (customer logos, checked 2026-10-26), [Factory pricing](https://factory.com/pricing)
- Factory documentation: [docs index](https://docs.factory.com/llms.txt), [Welcome](https://docs.factory.com/welcome/index.md), [Missions](https://docs.factory.com/missions/overview.md)

### Anthropic and OpenAI

- Claude Code documentation: [Overview](https://code.claude.com/docs/en/overview), [Use Claude Code in the cloud](https://code.claude.com/docs/en/claude-code-on-the-web)
- [Claude pricing](https://claude.com/pricing)
- AWS News Blog, [Get started with OpenAI GPT-5.5, GPT-5.4 models, and Codex on Amazon Bedrock](https://aws.amazon.com/blogs/aws/get-started-with-openai-gpt-5-5-gpt-5-4-models-and-codex-on-amazon-bedrock/)

### Agentic IDEs

- [Cursor pricing](https://cursor.com/pricing), [Cursor is now part of SpaceX](https://cursor.com/blog/joining-spacex) (August 14, 2026)
- [Devin Desktop](https://devin.ai/desktop) (windsurf.com redirects here)
- [Kiro is generally available](https://kiro.dev/blog/general-availability/) (November 17, 2025), [Kiro blog](https://kiro.dev/blog/), [Kiro pricing](https://kiro.dev/pricing/)

### Microsoft

- Microsoft Learn: [Get started with Copilot Cowork](https://learn.microsoft.com/copilot/microsoft-365/cowork/get-started), [What is Microsoft Copilot Managed Runtime (preview)](https://learn.microsoft.com/microsoft-365/managed-apps/), [Copilot Managed Runtime overview for admins (preview)](https://learn.microsoft.com/en-us/microsoft-365/admin/manage/apps/), [Migrate apps created from Power Apps Vibe](https://learn.microsoft.com/power-apps/vibe/migrate-apps) (October 13, 2026), [Copilot Studio overview](https://learn.microsoft.com/en-us/microsoft-copilot-studio/fundamentals-what-is-copilot-studio)
- [Copilot Cowork is now generally available](https://www.microsoft.com/en-us/copilot/blog/2026/06/16/copilot-cowork-is-now-generally-available/) (Microsoft Copilot blog, June 16, 2026)
- [Build apps in Copilot Cowork and Copilot Studio](https://www.microsoft.com/microsoft-copilot/blog/copilot-studio/build-apps-in-copilot-cowork-and-copilot-studio/) (Microsoft Copilot blog, September 10, 2026)
- [Microsoft 365 Copilot pricing](https://www.microsoft.com/en-us/microsoft-365-copilot/pricing), [Microsoft 365 Copilot for enterprise](https://www.microsoft.com/en-us/microsoft-365-copilot/enterprise)
- [MC1505609](https://mc.merill.net/message/MC1505609) (Message Center, read through the merill.net mirror)

### This repository

- [enterprise-plan.md](../enterprise-plan.md) sections 1, 4, 5 and 13; [platform-architecture.md](../platform-architecture.md); [operating-model.md](../operating-model.md); [current-state.md](../current-state.md)
- Earlier rounds: [software-factories.md](software-factories.md), [delegation-coco-coding.md](delegation-coco-coding.md), [factory-sources-round4.md](factory-sources-round4.md), [ua-marketplace-alignment.md](ua-marketplace-alignment.md), [under-armour-context.md](under-armour-context.md), [critique.md](critique.md), [agentcore-harness-coding.md](agentcore-harness-coding.md)
