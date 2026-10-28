<!-- Point-in-time research, retrieved 2026-10-25 for the UA-DLC plan. Claims carry source links; vendor features and dates change quickly, so verify before acting. See README.md in this folder. -->
<!-- cspell:words ABAC AIOS Alation Atlan Atlan's CODEOWNERS CRDT Classmethod Collibra Collibra's DSPM Hocuspocus JTBD Liveblocks Sensio Superblocks Teamspace Teamspaces Topedia Zeratsky's acrs devtune firecrawl jobstobedone paywalled teamspace teamspaces -->

# Governance and collaboration for HyperDelivery at enterprise scale

Research date: 2026-10-25. Each claim has a source link next to it. Points that come only from secondary sources, or that I could not verify, are flagged as such.

## 0. Starting point (from the HyperDelivery repo, read-only)

- `src/api/auth.py`: `CurrentUser` holds only `oid`, `email` and `name` from the Entra token. The console checks who you are but has no role or resource-level authorization.
- `src/core/domain/project.py`: `Project` has no owner, workspace or member fields. `Decision` stores `signer` as an email or oid string. It does not record the artifact version or hash that was approved, the role the signer approved in, or any step-up authentication.
- `src/core/domain/context.py`: `GlobalContext` is one blob for the whole system ("closer to a system prompt than to project state"). There is no org, workspace or project layering, no provenance and no lifecycle.

So the enterprise move needs four new things: a tenancy model, an authorization layer, a stronger approval record, and a structured context store.

---

## Part A: Enterprise governance

### A1. RBAC vs ReBAC vs ABAC, and what fits an Entra and AWS shop

- **Entra app roles vs group claims.** Microsoft recommends basing in-app authorization on **app roles**, not groups, when nested groups aren't needed. Tokens stay smaller, and assigning users stays separate from configuring the app. The groups claim is capped at **200 entries for OAuth apps**. Past that limit, Entra leaves group claims out entirely, so the app must call Graph instead ([Microsoft Learn, group claims](https://docs.azure.cn/en-us/entra/identity/hybrid/connect/how-to-connect-fed-group-claims); [Zero Trust token guidance](https://learn.microsoft.com/ar-sa/security/zero-trust/develop/configure-tokens-group-claims-app-roles)). The usual pattern is to keep security groups as the place where admins assign people, and map those groups to app roles.
- **Amazon Verified Permissions (AVP) and Cedar.** AVP accepts any OIDC IdP, Entra included, as an identity source. Claims in ID tokens become principal attributes. Claims in access tokens become context. A `groups` claim can be mapped to Cedar principal groups for RBAC ([AVP identity sources](https://docs.aws.amazon.com/verifiedpermissions/latest/userguide/identity-sources.html)). AVP supported Cedar 4.5 from Aug 2025 ([AWS What's New](https://aws.amazon.com/about-aws/whats-new/2025/08/amazon-verified-permissions-cedar-4-5)). **Cedar policy templates** with `?principal` and `?resource` placeholders implement a "Share" button: each share creates a template-linked policy, and editing the template changes every linked policy. The documented downside is that linked policies follow user lifecycles, so offboarding means archiving or deleting them ([Cedar templates](https://docs.cedarpolicy.com/policies/templates.html)).
- **ReBAC (OpenFGA, SpiceDB).** Auth0's Oct 2025 comparison recommends OpenFGA for apps heavy on relationships: nested resources and group-based sharing. Its cost is a cluster and database that "can't fail", plus a sync step. It recommends Cedar for rules driven by attributes and managed as code. It also notes that Cedar does not do recursive folder inheritance natively ([Auth0 blog](https://auth0.com/blog/rebac-abac-openfga-cedar/)). For RAG, AuthZed and SpiceDB promote **pre-filtering** retrieval with `LookupResources` and **post-filtering** candidates with bulk checks. The rule is that a chunk a user can't read must never reach the model ([PureAI on AuthZed launch, Jun 2025](https://pureai.com/articles/2025/06/29/authorization-company-targets-ai-security-risks-with-new-infrastructure-tools.aspx); [tutorial](https://lucaberton.com/blog/rag-authorization-spicedb/)). Auth0 FGA documents the same post-retrieval check pattern ([Auth0 RAG authz](https://auth0.com/ai/docs/intro/authorization-for-rag)).
- **Implication.** HyperDelivery's resource graph is shallow (org > workspace > project > artifact or session). Cedar handles that by passing parents as entities. The decisive argument is that **AgentCore Policy also uses Cedar** (next section), so one policy language would govern both human console actions and agent tool calls.

### A2. Tenancy models used by Linear, Notion, GitHub, Vercel and Retool

| Product | Hierarchy | Patterns worth copying |
|---|---|---|
| Linear | Workspace > Teams (and sub-teams) | Workspace roles Owner (Enterprise only), Admin, Member, Guest. **Team owners** can configure who manages labels, templates and members. **Private teams** are hidden from non-members. **Guests** see only the teams they were added to. SCIM role groups such as `linear-owners` ([Linear docs](https://linear.app/docs/members-roles.md)). |
| Notion | Workspace > Teamspaces | Teamspaces can be **open, closed, private or default**. Teamspace owners and members. Enterprise admins can turn off public publishing, guest sharing and export per teamspace. A teamspace can only be made more permissive than the workspace by someone who also owns the workspace ([Notion help](https://www.notion.com/help/intro-to-teamspaces)). |
| GitHub | Enterprise > Orgs > Teams > Repos | Custom org roles inherited through teams, up to 20 per org. Enterprise custom roles are in preview ([GitHub docs](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-roles-in-your-enterprise/create-custom-roles)). |
| Vercel | Team > Projects | **Access Groups** bundle projects with project roles (Admin, Project Developer, Project Viewer). **Directory groups map to access groups**. Overlapping groups resolve to the highest role, and a member's level can only go up, never down ([Vercel docs](https://vercel.com/docs/rbac/access-groups)). |
| Retool | Org > **Spaces** > folders and apps | Each space has its own SSO, source control, users and permission groups. **Resource environments** separate production data credentials. **Access policies** restrict access to rows and columns per group. Releases and source-control PRs gate production ([Retool governance](https://docs.retool.com/org-users/concepts/governance)). |

What they share: one org per company, a team-shaped container that is also the unit for billing and policy, resource-level roles, guests for working across teams, and IdP group sync.

### A3. Agent identity, on-behalf-of and credential vending

- **AgentCore Identity OBO token exchange.** The service exchanges the inbound user token for a scoped downstream token, and the result carries **both the agent's identity and the user's**. It supports RFC 8693, and RFC 7523 JWT-bearer as used by **Microsoft Entra OBO** (`MicrosoftOauth2` with `JWT_AUTHORIZATION_GRANT`, `requested_token_use=on_behalf_of` added automatically). Agent code never handles client secrets ([AgentCore OBO docs](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/on-behalf-of-token-exchange.html); [AWS ML blog](https://aws.amazon.com/blogs/machine-learning/implement-on-behalf-of-token-exchange-for-multi-tenant-agents-with-amazon-bedrock-agentcore-gateway/)).
- **Policy in AgentCore** reached GA on **3 Mar 2026** ([AWS What's New](https://aws.amazon.com/about-aws/whats-new/2026/03/policy-amazon-bedrock-agentcore-generally-available/)). Policy engines attach to a Gateway and evaluate **every tool call** in Cedar, deny by default, outside the agent's code. They can condition on user identity and tool input parameters. Policies can be authored in natural language, with automated reasoning checks for rules that are too permissive or can never be satisfied. Decisions are logged to CloudWatch. The docs also describe **temporal (session-aware) policies**, for example "require that an approval was granted before a transfer" or a running budget, and Guardrails signals usable inside policies ([AgentCore Policy docs](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy.html)). A June 2026 Guardrails-in-Policy update is reported by [Classmethod](https://dev.classmethod.jp/en/articles/20260617-amazon-bedrock-agentcore-policy-guardrails/) (secondary source).
- **Snowflake-managed MCP server.** Tools include Cortex Agent, Analyst (semantic views only), Search, SQL (read-only by default, and Snowflake advises against putting it on the same server as an agent) and custom tools. It authenticates with Snowflake OAuth or **External OAuth with Entra**. Each tool needs its own grant. Snowflake recommends a dedicated MCP role, `OAUTH_USE_SECONDARY_ROLES = NONE` and a restricted `ALLOWED_ROLES_LIST` ([Snowflake docs](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-mcp)).
- **Microsoft side.** Entra Agent ID gives agents a first-class identity with sponsors and owners. The agent registry is moving to **Agent 365**, reported GA on 1 May 2026, while Conditional Access and governance stay in Entra ([Microsoft Learn what's new](https://learn.microsoft.com/en-za/entra/agent-id/whats-new-agent-id); [Topedia](https://blog-en.topedia.com/2026/04/agent-registry-is-moving-from-microsoft-entra-to-agent-365/), secondary). **Entra entitlement management access packages** provide project-bound access with approvals, sponsors, expiry and access reviews. Microsoft's guidance is to set an end date on project access and require approval to extend it ([Learn](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-access-reviews-create)).

### A4. Risk tiering: what ships automatically and what needs engineering

- **Microsoft's zoned governance** for Copilot Studio defines three zones. **Zone 1 Citizen** covers personal or team agents built on content the maker can already see: read-only, private, Microsoft 365 connectors only, sharing off. **Zone 2 Partnered** covers trained makers with a coach: IT-approved environments, ALM pipelines, IT admin approval to publish. **Zone 3 Professional** covers pro-dev, mission-critical work with full ALM and Purview ([Microsoft Learn, updated Oct 2026](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/sec-gov-phase2)). Power Platform pipelines add **delegated deployments**, where makers deploy through a service principal with no production rights, and approvals are required ([Learn](https://learn.microsoft.com/en-us/power-platform/alm/pipelines)).
- **Gartner (29 Jun 2026)**, via a vendor summary: govern vibe coding with **development controls plus pre-deployment validation**, use an adaptive framework to decide what citizens own versus engineering, and sandbox agents, restrict egress and cap token spend. Gartner predicts 60% of vibe-coded apps will be retired by 2028 ([Tray.ai summary](https://tray.ai/guides/gartner-govern-vibe-coding/); full report paywalled).
- **Change-level tiering in practice.** Vercel's LLM classifier labels each PR HIGH or LOW. Auth, payments and security always go to a human. The classifier must quote diff evidence, defaults to LOW when it finds none, and is tuned to prefer false HIGHs. Vercel reports 58% of PRs merged without human review, with no reverts across 671 low-risk PRs (Vercel blog, 6 Apr 2026, [URL](https://vercel.com/blog/58-percent-of-prs-in-our-largest-monorepo-merge-without-human-review); it returned 404 when fetched, so figures come from search snippets). A contrasting design argues that **deterministic path rules set the floor and agent evidence can only raise risk** ([TradersPost](https://blog.traderspost.io/article/risk-proportional-review-for-ai-agents)).
- **GitHub Well-Architected, "Governing agents"** (Apr 2026, updated 2 Oct 2026): keep the enterprise baseline minimal (audit streaming plus a model allowlist) and layer configuration below it. **Require human review of agent config and MCP config changes**. Never exempt agent PRs from rulesets. Correlate audit events by `agent_session_id`. Set spending limits with "stop usage at limit" ([GitHub](https://learn.github.com/well-architected/library/governance/recommendations/governing-agents/)).

### A5. Approvals and audit trails that work like e-signatures

- **Step-up at signing.** Entra Conditional Access **authentication context** (IDs `c1` to `c25`) lets an API demand stronger auth for specific operations. If the `acrs` claim lacks the required ID, the API returns a claims challenge. Note that `acrs` is an array, so check containment, not equality ([Microsoft dev guide](https://learn.microsoft.com/en-us/entra/identity-platform/developer-guide-conditional-access-authentication-context)).
- **Tamper evidence.** QLDB reached end of support on **31 Jul 2025**. AWS points to Aurora PostgreSQL with pgAudit and activity streams, which lack cryptographic verification on their own ([InfoQ](https://www.infoq.com/news/2024/07/aws-kill-qldb)). Teams typically add hash chaining plus S3 Object Lock themselves (design inference, not from a source).
- The usual signature record contains the printed name, timestamp, **meaning of the signature** and a binding to the exact record. This follows the general regulated e-signature practice in 21 CFR Part 11, which I did not fetch for this report.

### A6. Data classification and PII guardrails

- **Bedrock Guardrails sensitive-information filters** can block or mask PII and support custom regex. **Blocked content appears in plaintext in model invocation logs** if logging is on. Automated Reasoning checks validate responses against formal rules ([Bedrock docs](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-components.html)).
- **Purview APIs for custom AI apps.** `protectionScopes/compute` returns which policies apply to a user. `processContent` evaluates a prompt or response against UA's existing DLP policies and returns allow or restrict. `contentActivities` feeds audit. Delegated permissions are `Content.Process.User` and `ProtectionScopes.Compute.User` ([Purview developer tutorial](https://learn.microsoft.com/en-us/purview/developer/use-the-api); [overview](https://learn.microsoft.com/en-us/purview/developer/microsoft-purview-sdk-documentation-overview)). This would let HyperDelivery appear in **DSPM for AI** next to Copilot ([DSPM for AI](https://learn.microsoft.com/purview/dspm-for-ai)).

### A7. Model and prompt governance, and evaluation gates

- **Model allowlisting with SCPs.** SCPs support full IAM language, so a deny on `bedrock:InvokeModel` with `NotResource` restricts which providers or models can be called. Without that deny, new models are reachable by default ([AWS Security Blog](https://aws.amazon.com/jp/blogs/security/simplified-amazon-bedrock-model-access/); [model access docs](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html)).
- **AgentCore Evaluations** reached GA on **31 Mar 2026**. It has 13 built-in evaluators (quality, safety, task completion, tool use), custom LLM or Lambda evaluators, ground truth, **on-demand runs for CI/CD regression** and **online sampling of production traces** ([AWS What's New](https://aws.amazon.com/about-aws/whats-new/2026/03/agentcore-evaluations-generally-available)).

### A8. FinOps chargeback

- Since **9 Apr 2026**, Bedrock allocates inference cost by **IAM user or role tags** in CUR 2.0 and Cost Explorer ([AWS](https://aws.amazon.com/about-aws/whats-new/2026/04/bedrock-iam-cost-allocation)). **Application inference profiles** carry cost tags per application, team or project for InvokeModel and Converse. Each profile is tied to one model, and tags are not retroactive ([Bedrock docs](https://docs.aws.eu/bedrock/latest/userguide/cost-mgmt-application-inference-profiles.html)).
- The FinOps Foundation recommends quotas, tagging, token-level unit metrics, and tying spend to business outcomes. It also notes that non-technical groups are now direct drivers of AI spend ([FinOps for AI](https://www.finops.org/wg/finops-for-ai-overview/), retrieved via firecrawl after WebFetch got a 403).

### A9. Catalog and promotion to engineering

- Backstage software templates encode **golden paths**, Spotify's term for "the opinionated, supported way to build something" ([Spotify Backstage learn](https://backstage.spotify.com/learn/onboarding-software-to-backstage/11-spotify-templates)). Spotify Portal is a hosted Backstage with an AI knowledge assistant, reported GA Oct 2025 ([devtune](https://devtune.ai/verticals/internal-developer-platforms/backstage), secondary).
- The gap Gartner and practitioners describe is that AI-drafted internal tools stall on **unsecured DB connections, missing SSO and non-compliant data access** ([WeAreDevelopers talk, Jul 2026](https://www.wearedevelopers.com/videos/100290-how-to-govern-vibe-coding-for-the-enterprise.md?t=165)). A handoff package must close these gaps before engineering accepts the work.

---

## Part B: Collaboration and context capture

### B1. Real-time multiplayer building blocks

- **Yjs** is a CRDT library that doesn't care about transport. It has bindings for ProseMirror, Tiptap, Monaco and CodeMirror. Hosted providers include Liveblocks, Y-Sweet and Tiptap, and persistence providers are available ([Yjs docs](https://docs.yjs.dev/)).
- **Liveblocks (Apr 2026)**: agents join rooms with **presence** (name, avatar, status), apply JSON Patch to Storage, read comment attachments, and log to a new **Feeds** primitive. A user can @mention an agent in a comment thread, or from Slack or Teams, to trigger work ([Liveblocks](https://liveblocks.io/blog/introducing-feeds-and-apis-for-agent-workflows)). Private comment threads and AI agents in comments followed in mid-2026 ([May 2026 update](https://liveblocks.io/blog/whats-new-in-liveblocks-may-2026)).
- **Tiptap**: Hocuspocus is an open-source Yjs backend. The paid Server AI Toolkit lets agents read and write comment threads, and `tiptapEdit: false` restricts an agent to commenting only. Comment tools require Tiptap Cloud documents ([Tiptap docs](https://tiptap.dev/docs/content-ai/capabilities/ai-toolkit/agents/comments)).

### B2. Techniques that produce strong business context

- **AI-DLC Mob Elaboration** (Raja SP, AWS, 31 Jul 2025): the AI turns intent into requirements, stories and units of work, and "the entire team actively validates" its questions and proposals. Artifacts persist in the repo so later phases get richer context ([AWS DevOps blog](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/)). The open-source `awslabs/aidlc-workflows` repo (commit of 25 Oct 2026) adds a **facilitator guide**. It asks teams to bring a one-paragraph **vision note** and a **tech-environment note** so the first hour is spent "checking answers" rather than answering questions. It also defines a **multi-team workshop mode** (integration lead, unit teams, review group), a **strict-additive rule chain org → team → project → phase**, a **learning loop** (the agent keeps a diary of interpretations, deviations and tradeoffs, which is surfaced verbatim at the gate and kept only when a human confirms it) and a **124-event audit taxonomy** ([repo](https://github.com/awslabs/aidlc-workflows): docs/guide/facilitator-guide.md, 08-knowledge.md, 09-rules-and-the-learning-loop.md, 10-state-and-audit.md, workshop-mode.md).
- **Collaborative modeling.** EventStorming has three levels (Big Picture, Process, Design), typically 2–4 h sessions. Domain Storytelling is the more accessible option for non-technical participants, at 1–3 h. Both run remotely on Miro, Mural or FigJam ([O'Reilly, Domain-Driven Transformation, Nov 2025](https://www.oreilly.com/library/view/domain-driven-transformation/9798341640108/ch04.html); [SensioLabs 2026](https://sensiolabs.com/blog/2026/behind-the-scenes-3-collaborative-ceremonies-for-better-development)).
- **JTBD four forces.** Push and pull must outweigh anxiety and habit for someone to switch ([jobstobedone.org](https://jobstobedone.org/the-four-forces/)). **Working Backwards PR/FAQ** is a one-page press release plus an FAQ of five pages or less, which suits business authors ([About Amazon](https://www.aboutamazon.com/md/news/workplace/an-insider-look-at-amazons-culture-and-processes)). **Design sprints** are being compressed to one day with AI. Knapp and Zeratsky's **Foundation Sprint** is a separate method ([Miro](https://miro.com/ai/ai-design-sprint/)).

### B3. Tools that capture meeting and workshop knowledge

- **Teams Facilitator**: co-authored live notes on a **Loop page**, agenda timer, decisions and open questions, tasks synced to Planner, Q&A by @mention. It needs a Copilot license and transcription, and works only in scheduled (not channel or instant) meetings. Task features are in preview ([Microsoft Support](https://support.microsoft.com/en-US/teams/copilot/facilitator-in-microsoft-teams-meetings)).
- **Graph APIs**: Teams transcripts have been GA since Oct 2023 for scheduled meetings ([M365 Dev Blog](https://devblogs.microsoft.com/microsoft365dev/microsoft-graph-apis-for-microsoft-teams-meeting-transcripts-now-generally-available/)). The **Meeting AI Insights** `callAiInsight` resource (notes, action items, `contentCorrelationId` back to the transcript) is **still documented under /beta** (corrected 2026-10-27: the Meeting AI Insights API is now generally available on Graph v1.0; its change notifications are still preview; see [meeting-capture-automation.md](meeting-capture-automation.md#21-intelligent-recap-and-the-meeting-ai-insights-api)). It requires admin consent for `OnlineMeetingAiInsight.Read.All` ([Learn](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/api/ai-services/meeting-insights/resources/callaiinsight)).
- **Granola**: Series C of $125M (Mar 2026). Adds **Spaces** with access controls, an MCP server (Feb 2026), and personal and enterprise APIs with SSO, SCIM and consent ([The Next Web](https://thenextweb.com/news/granola-series-c-meeting-ai-enterprise-context)).
- **Whiteboards**: Miro has a beta **MCP server** at `mcp.miro.com`, which Enterprise admins must enable, and AI Sidekicks and Flows ([Miro help](https://help.miro.com/hc/articles/31624028247058); [dev FAQ](https://developers.miro.com/docs/miro-mcp-server-frequently-asked-questions)). Mural AI clusters, summarizes and classifies sentiment. **Mural MCP** lets assistants edit boards and turn outcomes into action items and tickets, and Mural holds ISO 42001 ([Mural](https://www.mural.co/ai)). FigJam AI sorts and summarizes stickies and generates templates ([Figma](https://www.figma.com/figjam/ai/)).

### B4. Context engineering and institutional memory as a moat

- Anthropic (29 Sep 2025): treat context as a finite attention budget ("context rot"). Prefer **just-in-time retrieval** through lightweight references, use compaction and **structured note-taking**, and use sub-agents that return condensed summaries ([Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)).
- **Catalogs serve context through MCP.** Atlan's MCP server delivers certified definitions, lineage and access rules, and supports glossary writes; existing permissions apply through OAuth ([Atlan MCP](https://atlan.com/mcp/)). Collibra's MCP offers glossary, lineage and asset search under Collibra RBAC, and Collibra context flows into Snowflake Horizon and Cortex (preview) ([Collibra](https://www.collibra.com/blog/governed-ai-at-the-speed-of-snowflake-how-collibra-mcp-powers-snowflake-cowork-and-cortex-coco)). Alation announced AIOS components, including ontologies, in Sep 2026 ([StorageNewsletter](https://www.storagenewsletter.com/2026/09/24/alation-launches-aios-expansion-with-six-products-that-accelerate-ai-transformation/)). **Snowflake semantic views** hold metrics and dimensions for Cortex Analyst. **Open Semantic Interchange** (Sep 2025) is reported to have entered the Apache Incubator in Jul 2026. Horizon Context was announced at Summit 2026 (all from [Atlan](https://atlan.com/know/snowflake/snowflake-semantic-views/) and [AtScale](https://snowflake.atscale.com/glossary/snowflake-horizon-context/), secondary; verify with Snowflake).

---

## Recommendations

### R1. Authorization model: Entra app roles for coarse access, Cedar for resources, the same Cedar for agents

1. **Entra (coarse).** Turn on "assignment required" for the HyperDelivery enterprise app. Define **app roles** such as `Builder`, `Viewer`, `EngineeringReviewer`, `DataSteward`, `GovernanceAdmin` and `PlatformAdmin`, assigned through security groups. Never authorize on raw group claims, because of the 200-group overage limit.
2. **AVP and Cedar (fine-grained).** Model entities as `Org`, `Workspace`, `Project`, `Artifact`, `Session`, `ContextAtom` and `Connection`. Relations live in DynamoDB (`USER#oid` ↔ `PROJECT#id` membership items, which also give you list filtering) and are passed to AVP as parent entities on each check.
   - Project roles are Owner, Editor, Contributor (comment and join sessions) and Viewer. Approver relations are per station: `BusinessApprover` for Distill, `EngineeringApprover` for Blueprint and Review at tier 2 and above, and `DataSteward` for Confidential connections.
   - ABAC conditions in policies cover `project.tier`, `project.classification`, `principal.department` and `context.acrs`. Use **Cedar templates** for "Share with group as Editor".
   - Re-evaluate OpenFGA or SpiceDB only if you add deep nesting or need "list everything I can see" across millions of objects.
3. **Agents.** Route every tool through **AgentCore Gateway with Policy (Cedar)**.
   - Example rules: Blueprint may create Jira issues only in the project's linked Jira key; repository creation and pushes require that the station approval exists (a temporal policy); Snowflake calls are allowed only with the project's mapped role.
   - Use **AgentCore Identity OBO with Entra** so Graph, SharePoint, Snowflake (External OAuth) and Atlassian see both the user and the agent.
   - Give each agent its own workload identity. Consider registering the agents in Entra Agent ID or Agent 365 so they show up in UA's Microsoft governance.
4. **Approvals.** Require a Conditional Access authentication context (for example `c1`, MFA within the last 10 minutes) on approve endpoints. Extend `Decision` with `signer_oid`, `signer_role` (the meaning of the signature), `artifact_version` and `artifact_sha256`, `acrs`, and `policy_decision_id`. Stream decisions to S3 Object Lock in compliance mode with a hash chain.

### R2. Tenancy model: Org > Workspace > Project, with zones as project tiers

- **Org** is UA's Entra tenant. It holds org policies, the model allowlist, golden paths and the org context layer.
- **Workspace** is one business domain or team (for example EDM, Supply Chain Analytics, Digital). It is the **cost center** (an application inference profile per workspace plus internal token metering), the **data envelope** (allowed Snowflake roles, SharePoint sites, Jira projects and GitHub org or team), and the workspace context layer. Visibility is open, closed or private, as in Notion. Directory groups map to workspace roles, as in Vercel.
- **Project** has members and **cross-workspace guests**, so ideathon-style mixed teams work without merging workspaces (Linear's guests, Notion's closed teamspaces).
- **Tiers.** Each project carries a tier, mapped from Microsoft's zones:
  - **T0 Sandbox**: synthetic or public data, private, no side effects outside HyperDelivery.
  - **T1 Team prototype**: workspace-approved Internal data, preview deployment, business approver only.
  - **T2 Department app**: Confidential data, adds an engineering reviewer at Blueprint and Review plus a data steward for connections.
  - **T3 Production handoff**: engineering owns the code, with CODEOWNERS, change management, and the repo transferred to an engineering org.
- **Promotion between tiers** is a gated, audited event: a checklist that is part development controls and part pre-deploy validation, plus an evaluation pass. A **deterministic risk floor** (data classification touched, writes to systems of record, auth or PII code, new dependencies, infrastructure changes, audience size) can only be raised by an LLM classifier, never lowered.

### R3. "Context Capture": turning cross-functional sessions into durable, cited UA context

1. **Inputs, live and async.**
   - A HyperDelivery Teams meeting app ingests the transcript (GA API) and Facilitator's Loop notes, plus Meeting AI Insights where tenant policy allows (v1.0 since 2026, Copilot license required; admin consent).
   - An in-console **Session Room** uses Yjs (self-hosted Hocuspocus or Liveblocks) for a shared doc and canvas, with technique templates: Domain Storytelling, EventStorming Big Picture, JTBD forces, PR/FAQ, 1-2-4-All.
   - Miro and Mural boards come in through their MCP servers. Async sources are comment threads, uploaded documents and SharePoint links.
   - **Async 1:1 context interviews** run in Teams chat with each stakeholder, then get reconciled.
2. **Extraction into typed Context Atoms.**
   - Atom types: Term, Metric, BusinessRule, Decision (with alternatives and rationale), Assumption, Constraint, OpenQuestion, Persona/Job, ProcessStep/DomainEvent, DataSourceRef.
   - Each atom stores the statement, **citations** (transcript timestamp and speaker, document URL and anchor, board item ID), contributors, departments, scope (org, workspace or project), classification label, status (proposed → confirmed → canonical → superseded) and links to Snowflake objects or catalog terms.
3. **Human confirmation gate.** This is the AI-DLC learning loop applied to business context. Attendees confirm or reject proposed atoms after the session.
   - **Conflicting definitions** (for example "net demand" meaning one thing to Supply Chain and another to Finance) become **definition disputes** routed to the data steward.
   - Only confirmed atoms ground the specs, so Distill cites atoms rather than raw transcripts.
4. **Storage and retrieval.** DynamoDB plus vector search, with **authorization pre-filtering** by the scopes and classification the user is allowed to see. Retrieval is just-in-time, through references. The strict-additive org → workspace → project chain replaces the single `GlobalContext` blob.
5. **Systems of record.** Promote canonical Terms and Metrics to the catalog (Atlan or Collibra MCP write, or Snowflake semantic views and OSI) through a steward approval. Publish Decisions to a Confluence decision log and requirements to Jira. Read canonical definitions back through catalog MCP and the Snowflake MCP (Cortex Analyst over semantic views) to ground new projects.
6. **Reuse and the moat.** When a project starts, a "What UA already knows" panel shows relevant canonical atoms, past decisions and similar projects. **Golden-path templates** (for example a Snowflake-backed internal app or a data-quality monitor) each carry a technical-environment note and default guardrails. Suggest invitees from the data owners of the sources a project touches, to recreate the ideathon mix on purpose.
7. **Measures.** Track five things:
   - Citation coverage of spec requirements.
   - Confirmation rate of proposed atoms.
   - How long disputes take to resolve.
   - How often atoms are reused across projects.
   - The number of distinct departments contributing per project.
8. **UX.** Users said they don't care which agent is working. Present **one assistant voice** and progress in terms of the deliverable ("Spec 80% ready – 3 questions for Finance"). Keep the crew in an expandable activity log. Governance views show **which humans approved what**, not which agent did what.

## Not verified

- The Vercel PR blog returned 404 when fetched; its figures come from search snippets.
- The Gartner report is paywalled (vendor summary only).
- The web search budget ran out before I checked Snowflake External OAuth setup details, Notion's enterprise multi-workspace org, the governance features of Superblocks and Lovable enterprise, and the JTBD switch-interview detail.
- 21 CFR Part 11 was not fetched.
- Dates for Agent 365 GA, OSI moving to Apache, and the June 2026 Guardrails-in-Policy update come from secondary sources.
