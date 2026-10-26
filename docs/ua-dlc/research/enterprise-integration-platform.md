<!-- Point-in-time research, retrieved 2026-10-25 for the UA-DLC plan. Claims carry source links; vendor features and dates change quickly, so verify before acting. See README.md in this folder. -->
<!-- cspell:words Atlan BYOC BYOI Classmethod Daytona Fargate Rego SPCS Semperis Shing devcontainers hostnames itpros thoughtstuff -->

# Enterprise integration and platform options for HyperDelivery (as of 2026-10-25)

Scope: concrete M365, Atlassian, AWS, sandbox and Snowflake options for taking HyperDelivery from an EDM pilot to a UA-wide tool. Everything below was checked against 2026 sources where possible; items that rest on secondary sources are marked.

## 1. Microsoft 365

### 1.1 Teams meeting transcripts and recordings (Graph): the rules changed in 2026

- **Tenant control, off by default.** Message center MC1393806 (16 Jun 2026) added a tenant control on Graph access to meeting transcripts. It is off by default, so Graph-based apps and agents get no transcripts until an admin enables it in Teams admin center or with `Set-CsTeamsMeetingConfiguration -EnableGraphTranscriptAccess $true` ([office365itpros, Sep 2026](https://office365itpros.com/2026/09/21/teams-meeting-graph-api/)). The Teams platform changelog lists the admin controls as GA on 30 Jul 2026. Admins can deny all access, or allow only transcripts *without speaker attribution*. Apps must handle both cases ([Teams what's new](https://learn.microsoft.com/en-us/microsoftteams/platform/whats-new)).
- **What breaks when it is off.** Creating or renewing a transcript subscription returns `403` with inner error `GraphAccessToTranscriptsDisabled`. **Recording subscriptions are unaffected** ([Graph change notifications for transcripts/recordings](https://learn.microsoft.com/en-us/graph/teams-changenotifications-callrecording-and-calltranscript)).
- **Subscription scopes.** Five are available: tenant-wide (`communications/onlineMeetings/getAllTranscripts`, application permission only), per meeting, per organizer, per ad hoc call, and **"every meeting where a specific Teams app is installed"** (`appCatalogs/teamsApps/{id}/installedToOnlineMeetings/getAllTranscripts`). The last one can run on resource-specific consent (`OnlineMeetingTranscript.Read.Chat` with `?useResourceSpecificConsentBasedAuthorization=true`).
- **Caveats.** A notification fires only if the subscription existed *before* transcription started. Private channel meetings are not supported. Subscriptions longer than 1 hour need a `lifecycleNotificationUrl` (same source).
- **Real time is not available yet.** Roadmap item RM570651, "Work IQ: Real Time Transcripts", promises apps and agents real-time transcript access: preview around Sep 2026, GA around Nov 2026, still "in development" ([RM570651](https://mc.merill.net/message/RM570651)).
- **Copilot meeting insights API** (summary, action items, mentions). Reported GA in Dec 2025, but it needs a Microsoft 365 Copilot license and delegated permissions, and results can take up to about 4 hours after the meeting ([thoughtstuff](https://blog.thoughtstuff.co.uk/2025/12/weekly-update-22-december-2025-aicontextprovider-copilot-ai-insights-api-ga-vs2026-debugging/), secondary).

**What this means for HyperDelivery.** RSC scoped to the HyperDelivery app *installed in the meeting* is the cleanest consent model. Adding HyperDelivery to the meeting is the opt-in, and no tenant-wide transcript read is needed. Even so, UA's Teams admins must flip the tenant control first, so this is a governance conversation to start now. The code must also fall back gracefully on `GraphAccessToTranscriptsDisabled`, for example with "upload or paste transcript".

### 1.2 Teams app surfaces

- **Teams SDK** (successor to the Teams AI library). Python reached GA on 1 May 2026 (`pip install microsoft-teams-apps`), with streaming, Adaptive Cards, proactive messages, built-in OAuth, and Graph calls as user or app ([M365 dev blog](https://devblogs.microsoft.com/microsoft365dev/python-support-for-the-microsoft-teams-sdk-is-now-generally-available/)). Teams SDK 2.1.0 (28 Sep 2026) adds agentic identity, composability with the M365 Agents SDK, OpenTelemetry, and multi-service OAuth ([Teams what's new](https://learn.microsoft.com/en-us/microsoftteams/platform/whats-new)). This fits HyperDelivery's Python backend well.
- **Agent UX primitives, 2026:**
  - Targeted (private) messages in group chats and agent slash commands: GA 30 Jul.
  - Extended Markdown for agent messages (tables, code, citations, progressive render while streaming): GA 8 Oct.
  - Prompt starters: GA 27 Apr.
  - Apps in private channels: GA 7 Jul.
  - The "agent sessions" preview was **canceled** on 22 Oct ([Teams what's new](https://learn.microsoft.com/en-us/microsoftteams/platform/whats-new)).
- **Meeting side panel and stage.**
  - Share-to-stage needs `meetingSidePanel` and `meetingStage` contexts plus the RSC permission `MeetingStage.Write.Chat`.
  - `shareAppContentToStage` can share a specific URL in either "Collaborative" mode (everyone can interact) or "ScreenShare" mode (view-only).
  - Only presenters and organizers can share. Anonymous users can't see shared apps.
  - Screen-share-to-stage isn't supported on Mac, web, mobile or VDI ([Learn, updated Jul 2026](https://learn.microsoft.com/en-us/microsoftteams/platform/apps-in-teams-meetings/build-apps-for-teams-meeting-stage)).
  - This is the surface for ideathon-style co-creation: put the live spec or preview on stage and let business and engineering edit it together.
- **Live Share.** Still documented and still runs on Azure Fluid Relay. Hosted data may stay accessible for up to 24 hours ([Live Share FAQ](https://learn.microsoft.com/nb-no/microsoftteams/platform/apps-in-teams-meetings/teams-live-share-faq)). I found no 2026 investment signal, so treat it as optional.
- **Loop components.** Adaptive Card-based Loop components need Adaptive Cards 1.6+, manifest 1.13+ and Universal Actions, and are not available on macOS or mobile ([Learn](https://learn.microsoft.com/en-CA/microsoftteams/platform/m365-apps/cards-loop-component)). The docs date from 2023-24, so maturity is uncertain. A portable "approval card" for a spec is plausible, but don't build the core UX on it.

### 1.3 SharePoint, OneDrive and SharePoint Embedded

- **Least privilege.** Use `Sites.Selected` / `Lists.SelectedOperations.Selected` for app-only access. Granting `Files.Read.All` alongside them silently overrides the restriction ([MS Q&A](https://learn.microsoft.com/en-us/answers/questions/5621045/sites-selected-not-working-as-expected-with-files)).
- **ACS retired.** SharePoint app-only authentication through Azure ACS was retired on **2 Apr 2026**. Use Entra client credentials instead ([Bedrock SharePoint connector doc](https://docs.aws.amazon.com/bedrock/latest/userguide/sharepoint-data-source-connector.html)).
- **SharePoint Embedded (SPE).** App-owned file containers inside UA's tenant, billed pay-as-you-go through Azure. The meters are storage, archived storage, Graph API transactions and egress. A private-preview agent message meter covers SPE agent and Copilot Retrieval calls, at 12 Copilot Studio messages per interaction ([SPE billing meters, Aug 2026](https://learn.microsoft.com/en-us/sharepoint/dev/embedded/administration/billing/meters)). SPE would give HyperDelivery a tenant-resident, Purview-governed, Copilot-retrievable store for specs, blueprints and demo packages without Azure compute.

### 1.4 Microsoft 365 Copilot extensibility and Agent 365

- **Declarative agents.**
  - They can call **MCP servers as actions**, and MCP tools can return **interactive UI widgets** (the MCP Apps standard or the OpenAI Apps SDK) inline or full-screen in Copilot.
  - Authentication is OAuth 2.1 or Entra SSO, built with Agents Toolkit 6.12+ ([MCP apps doc, Sep 2026](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/plugin-mcp-apps)).
  - Manifest 1.9 (Oct 2026) adds `agent_skills` (the Agent Skills standard) and a Fabric capability. Manifest 1.8 added `MeetingActions` and `EmailActions` ([Copilot extensibility what's new](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/whats-new)).
  - Also new: the Agent Registration API (preview, Apr 2026), the Package Management API returning the agent's Entra `agentIdentityId` (Aug 2026), and pay-as-you-go Retrieval API for unlicensed users (preview, Jan 2026) (same source).
- **Work IQ API.** GA was scheduled for 16 Jun 2026, with REST, A2A and a redesigned remote MCP server of **10 generic tools** (fetch, create, update... over mail, calendar, files, people, chat, sites). It has a Rego policy engine. Custom and third-party agents are **billed by consumption** ([M365 dev blog](https://devblogs.microsoft.com/microsoft365dev/work-iq-production-ready-intelligence-for-every-agent/)). Meeting transcripts are not in the core tool list. Learn still labels some Work IQ MCP pages "preview" ([Learn](https://learn.microsoft.com/microsoft-agent-365/tooling-servers-overview)).
- **Agent 365.**
  - GA on 1 May 2026 for Commercial. Licensed per user at USD 15 per user per month standalone, or included in M365 E7 ([Learn](https://learn.microsoft.com/en-us/microsoft-agent-365/overview), [MS Security blog](https://www.microsoft.com/security/blog/2026/05/01/microsoft-agent-365-now-generally-available-expands-capabilities-and-integrations/)).
  - **Registry sync with Amazon Bedrock and Google Cloud is in public preview** and auto-inventories agents running there. UA's security team could therefore see HyperDelivery (on AgentCore) in the same registry as Copilot agents.
  - Conditional Access for agents needs Entra P1/P2 plus an Agent 365 license ([Learn CA for agents](https://learn.microsoft.com/en-us/entra/identity/conditional-access/agent-id)). The agent registry has moved out of the Entra portal into the Agent 365 admin center ([Semperis](https://www.semperis.com/blog/the-agent-registry/)).

### 1.5 Entra ID

The model HyperDelivery needs:

- App roles or Entra groups map to HyperDelivery roles (requester, approver, admin) and to per-project membership.
- Teams SSO in the tab.
- **On-behalf-of (OBO)** for any read that should respect the user's own M365 permissions.

AgentCore Identity's built-in Microsoft provider performs the OBO exchange natively:

- Use `@requires_access_token(auth_flow="ON_BEHALF_OF_TOKEN_EXCHANGE")` in the Runtime, or `grantType: TOKEN_EXCHANGE` on a Gateway target. AWS announced this in April 2026.
- Inbound tokens must be issued to the agent's own app ID; Graph-audience tokens are rejected.
- Delegated Graph scopes need admin pre-consent ([Classmethod, Oct 2026](https://dev.classmethod.jp/en/articles/agentcore-identity-obo-entra-id/)).

## 2. Atlassian

- **Rovo MCP Server**
  - **Status and coverage.** GA since 4 Feb 2026 for Jira and Confluence. It offers search, fetch, page and issue create/update, and MCP "apps". Admins control which clients may connect, and usage is audit-logged ([Atlassian blog](https://www.atlassian.com/blog/announcements/atlassian-rovo-mcp-ga)).
  - **Endpoint.** `https://mcp.atlassian.com/v1/mcp`. The **SSE endpoint stopped being supported after 30 Jun 2026**.
  - **Authentication.** OAuth 2.1 by default. Admins can enable **API tokens**: personal tokens via Basic auth, or **service-account API keys** via Bearer. Tools run with the token owner's permissions ([Atlassian support](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/configuring-authentication-via-api-token)).
  - **Tool groups.** Jira (delete and admin tools are off by default), Confluence, JSM, Bitbucket, and the Teamwork Graph.
  - **Cost.** **Rovo credits** are consumed: typically 1-10 per enriched Teamwork Graph call, 15-30 per Confluence infographic ([supported tools](https://support.atlassian.com/atlassian-ai-gateway/docs/supported-tools/)).
- **Rovo A2A.** Atlassian also exposes an A2A gateway at `a2a.atlassian.com` ([Rovo A2A](https://developer.atlassian.com/cloud/rovo-a2a/)).
- **Forge.** Offers `rovo:agent`, action and `rovo:mcp` modules. Agents triggered by automation can't invoke CREATE, UPDATE or DELETE actions ([Forge rovo-action](https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-action/)). RFC-134 moves AI-facing capabilities to a new `tool` module ([RFC-134](https://community.developer.atlassian.com/t/rfc-134-forge-rovo-tools-and-mcp/100683)). Forge only matters if UA wants a HyperDelivery entry point *inside* Jira; for context capture, Rovo MCP is enough.

## 3. AWS

### 3.1 Bedrock AgentCore, full surface

- **Runtime**
  - **microVM mode.** Each session gets a dedicated microVM. Sessions last up to 8 hours and end after 15 minutes idle ([docs](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-how-it-works.html)).
  - **Instances (Aug 2026).** Managed EC2 in your account, sessions up to 14 days, GPUs, shared host directories. Billed at EC2 price plus a management fee ([InfoQ](https://infoq.com/news/2026/08/aws-bedrock-agentcore-runtime)).
  - **Managed session storage (preview).** A per-session `/mnt/...` directory survives stop and resume. It **expires after 14 days idle and is wiped on runtime version update**. It can be combined with S3 Files or EFS mounts, up to 5 per runtime ([filesystem configurations](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-filesystem-configurations.html)).
  - **Shell access.** `InvokeAgentRuntimeCommand` runs shell commands inside a live session ([AWS ML blog](https://aws.amazon.com/blogs/machine-learning/persist-session-state-with-filesystem-configuration-and-execute-shell-commands)).
  - **Pricing.** microVM v2 costs $0.1276 per vCPU-hour and $0.0169 per GB-hour, billed per second ([pricing](https://aws.amazon.com/bedrock/agentcore/pricing/)).
- **Gateway.** Targets can be Lambda, OpenAPI, API Gateway, Smithy, or other MCP servers, with semantic tool search, target-level 3LO, and interceptors ([docs](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-core-concepts.md)). Pricing is $0.005 per 1k invocations.
- **Identity.** Inbound JWT (Entra), an outbound token vault, and native Entra OBO. Free when used through Runtime or Gateway.
- **Memory.** Short-term and long-term memory plus **episodic** memory. Short-term pricing changed on 6 Oct 2026 to per-GB billing.
- **Code Interpreter.** Default 15-minute execution, extendable to 8 hours. Network modes are Sandbox, Public and VPC ([docs](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/code-interpreter-tool.html)).
- **Browser.** Adds session recording and replay, plus persistent profiles.
- **Policy.** GA 3 Mar 2026. Cedar rules, or natural-language rules compiled to Cedar, evaluated on every Gateway tool call, with a log-only mode. Evaluations went GA 31 Mar 2026 with 13 built-in evaluators ([AWS blog](https://aws.amazon.com/blogs/aws/amazon-bedrock-agentcore-adds-quality-evaluations-and-policy-controls-for-deploying-trusted-ai-agents/)). A June 2026 report says Guardrails now plug into the Policy layer for Gateway inputs and outputs ([report](https://ai-radar.vonikakv.people.aws.dev/reports/https-aws-amazon-com-about-aws-whats-new-2026-06-amazon-bedrock-agentcore-policy.html), secondary).
- **Harness.** GA 18 Jun 2026: a managed agent loop with a per-agent sandbox and shell ([secondary](https://aihub.hkuspace.hku.hk/2026/06/19/amazon-bedrock-agentcore-harness-is-now-generally-available-go-from-idea-to-production-grade-agent-in-minutes/)). Note the CSA research note on **CVE-2026-18830** (InvokeHarness tool-use injection) ([CSA](https://labs.cloudsecurityalliance.org/research/csa-research-note-agent-infra-guardrail-bypass-20260806-csa/)).
- **AWS Agent Registry.** Preview April 2026, GA 31 Aug 2026 ([Atlan](https://atlan.com/know/ai-agent/aws/what-is-aws-agent-registry.md), secondary).

### 3.2 Knowledge, Q Business, Guardrails

- **Bedrock Knowledge Bases.** **No new SharePoint or Confluence connectors on customer-managed KBs after 30 Sep 2026.** AWS points to **Bedrock Managed Knowledge Base** instead: 7 native connectors (S3, SharePoint, Confluence, OneDrive, Google Drive, Web, Custom), agentic retrieval, AgentCore Gateway integration and Amazon Quick integration ([SharePoint connector](https://docs.aws.amazon.com/bedrock/latest/userguide/sharepoint-data-source-connector.html), [Managed KB](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-build-managed.html)).
- **ACL-aware retrieval in Managed KB.** It filters on the ACLs from the last crawl, then re-checks the user's live permissions in SharePoint or Confluence at query time.
  - Emails must match exactly across systems.
  - AWS states it is "not a security boundary" ([ACL doc](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-acl.html)).
- **Amazon Q Business** is closed to new customers. Migrate to **Amazon Quick**, which offers BYOI, MCP actions with a 60-second timeout, and document ACLs for SharePoint and Confluence ([AWS](https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/qbusiness-availability-change.html)). Don't build on Q Business.

## 4. Sandboxes and preview environments

| Option | What it gives HyperDelivery | Isolation / cost | Fit for UA |
|---|---|---|---|
| **AgentCore Runtime + session storage** | Per-project build workspace the agent can shell into; stop and resume keeps repo and `node_modules` | microVM per session, 14-day idle expiry built in; preview feature | **High** for agent-side builds and tests. Git must be the source of truth because the workspace is wiped on version update |
| **AgentCore Instances** | Long builds, multi-agent shared directories | EC2 in UA's account plus fee | Medium, for heavy brownfield builds |
| **ECS Express Mode (Fargate)** | One call creates service, ALB and an HTTPS URL; up to 25 services per ALB; no extra fee ([AWS](https://aws.amazon.com/about-aws/whats-new/2025/11/announcing-amazon-ecs-express-mode/)) | Task-level isolation; per-second Fargate pricing; scale to 0 = "pause" | **High** as the default per-project *preview* runtime |
| **App Runner** | n/a | **Closed to new customers since 30 Apr 2026**; AWS points to ECS Express Mode ([AWS](https://docs.aws.amazon.com/ja_jp/apprunner/latest/dg/apprunner-availability-change.html)) | Avoid |
| **Amplify Hosting PR previews** | Unique URL per PR; temporary backend deleted when the PR closes; 50-branch quota; private repos only for backends ([AWS](https://docs.aws.amazon.com/amplify/latest/userguide/pr-previews.html)) | Managed | High for SPA/Next.js front ends |
| **CodeBuild** | Self-hosted runner for the **Copilot coding agent** inside the UA VPC ([Shing Lyu](https://shinglyu.com/blog/2026/04/20/copilot-cloud-agent-custom-runner-aws-codebuild.html)); SSH "sandbox" debugging ([AWS](https://aws.amazon.com/about-aws/whats-new/2025/04/aws-codebuild-enhanced-debugging-experience)) | Ephemeral; per-second billing | High. GitHub officially supports only ARC for self-hosting; the built-in firewall must be off; Ubuntu x64; no persistent runners ([GitHub docs](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/customize-the-agent-environment)) |
| **Lambda function URLs** | Fastest way to expose an API stub | Per request | Low; too narrow for full apps |
| **DIY Firecracker** | Own microVM fleet; EC2 nested virtualization on C8i/M8i/R8i since Feb 2026 ([AWS](https://aws.amazon.com/about-aws/whats-new/2026/02/amazon-ec2-nested-virtualization-on-virtual)) | Strongest control, highest ops cost | Low unless at very large scale |
| **E2B** | Firecracker sandboxes; pause keeps memory and disk **indefinitely**; Pro tier $150/month for 24h continuous runtime; **BYOC on AWS (Enterprise)**; Apache-2.0 "E2B Embed" for self-hosting ([persistence](https://docs.e2b.dev/sandbox/persistence), [billing](https://docs.e2b.dev/billing), [BYOC](https://docs.e2b.dev/byoc)) | microVM | Medium-high if a "live preview while we talk" experience matters |
| **Daytona** | Container sandboxes by default, VM sandboxes optional; auto-stop (15 min default), auto-archive to object storage, auto-delete, wall-clock TTL; BYOC custom regions on customer EKS ([docs](https://www.daytona.io/docs/en/sandboxes/), [BYOC](https://www.daytona.io/docs/en/bring-your-own-compute)). Standard preview tokens unlock the *whole* sandbox, so use signed per-port URLs ([preview](https://www.daytona.io/docs/en/preview)) | Container or VM | Medium-high; its lifecycle model is the best template to copy |
| **Modal** | gVisor sandboxes, 24h max, snapshots, tunnels (secondary sources only) | gVisor | Low; no AWS-account deployment found |
| **Coder** | Self-hosted, Terraform-defined workspaces; Coder Agents with LLM credentials kept in the control plane; "Agent Boundaries" egress allowlists ([Coder](https://coder.com/docs/@v2.36.3/about)) | Your infrastructure | Medium; engineer-oriented |
| **Ona (Gitpod)** | AWS runner in UA's VPC (EC2 environments, ECS orchestrator via CloudFormation); agents only on the Enterprise runner ([Ona](https://ona.com/docs/ona/runners/aws/overview)) | Your VPC | Medium; engineer-oriented |
| **Codespaces / devcontainers** | Org policies for idle timeout (30 min default), retention, machine types and port visibility ([GitHub](https://docs.github.com/en/codespaces/managing-codespaces-for-your-organization/restricting-the-idle-timeout-period)); about $0.18/hour on 2-core | GitHub-hosted | Use **devcontainer.json as the portable spec** in every generated repo; Codespaces as the handoff to engineers |

## 5. Snowflake

- **Streamlit in Snowflake container runtime.** GA 9 Mar 2026. Runs on SPCS compute pools, with GPUs, broader packages and no sleep timers ([release note](https://docs.snowflake.com/en/release-notes/2026/other/2026-03-09-sis-container-runtime-ga)).
- **SPCS public endpoints** are moving to per-account `snowflake.app` hostnames (bundle 2026_08) ([BCR](https://docs.snowflake.com/en/release-notes/bcr-bundles/2026_08/bcr-2451)).
- **Snowflake-managed MCP server.** Exposes Cortex Analyst, Search and Agents as tools ([docs](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-mcp)).
- **Native Apps.** Cortex Agents and MCP servers in Native Apps went GA 7 Aug 2026 ([release note](https://docs.snowflake.com/en/release-notes/2026/other/2026-08-07-native-apps-agents-mcp-ga)).

For EDM's data-centric prototypes, the cleanest **promote target** is Streamlit-in-Snowflake: data never leaves Snowflake governance.

## 6. Recommended reference architecture

### (a) Context capture from M365 and Atlassian

1. **Meetings.**
   - The HyperDelivery Teams app is added to a project chat or meeting; that is the consent signal.
   - Subscribe via RSC: `appCatalogs/teamsApps/{id}/installedToOnlineMeetings/getAllTranscripts?useResourceSpecificConsentBasedAuthorization=true`, plus `getAllRecordings`.
   - Flow: webhook on API Gateway + Lambda, then EventBridge, then KMS-encrypted S3, then Distill ingest. Speaker-attributed transcripts are kept only if the tenant allows them.
   - Handle `GraphAccessToTranscriptsDisabled` with an upload fallback.
   - Move to Work IQ real-time transcripts once GA (around Nov 2026) for a live in-meeting spec outline.
2. **Documents.**
   - User-picked files: a OneDrive/SharePoint picker in the tab plus Graph calls under **OBO** (AgentCore Identity). Users only ever surface what they can already read.
   - Department corpora: **Bedrock Managed KB** with SharePoint and Confluence connectors (ACLs on, real-time verification), registered as an AgentCore Gateway target.
   - Any app-only access uses `Sites.Selected`.
3. **Atlassian.**
   - Rovo MCP as a Gateway MCP target with **per-user 3LO for reads**.
   - A **service-account API key for writes** (Blueprint creating epics). Cedar policy permits writes only after the G2 approval token exists.
   - Budget Rovo credits per project.
4. **Snowflake and Work IQ.** Snowflake-managed MCP and Work IQ MCP sit behind the same Gateway, so policy, Guardrails, audit and evaluations are applied in one place.
5. **Write-back.** Publish approved specs, blueprints and demo packages to a project SharePoint site or SPE container, so M365 Copilot and colleagues find them where they already work.

### (b) Per-project build and preview sandboxes

- **Workspace tier.**
  - One AgentCore Runtime session per project with managed session storage at `/mnt/workspace`.
  - The Copilot coding agent runs on CodeBuild runners in a dedicated **sandbox AWS account** (Organizations OU, SCPs, no routes to production, egress allowlist).
- **Preview tier.**
  - ECS Express Mode service per project or PR, with ALB OIDC auth against Entra so access is limited to the project's Entra group.
  - Amplify PR previews for pure front ends.
  - Streamlit-in-Snowflake for data apps.
- **Lifecycle controller.** A Step Functions machine drives each sandbox through `requested -> provisioning -> running -> paused -> expired/archived -> promoted | deleted`.
  - **Pause:** scale to 0, or `StopRuntimeSession`.
  - **Expire:** an EventBridge Scheduler TTL (for example 14 days idle, matching AgentCore's own expiry) archives the image and snapshot to ECR/S3.
  - **Promote:** a new **human gate** that hands the repo to a CDK pipeline into a governed account. The promoted build is never the sandbox itself.
  - Track sandboxes in a DynamoDB table, with cost tags and per-project budget alarms.
  - Put a `SandboxProvider` interface in `providers/` so E2B BYOC or Daytona BYOC can be dropped in later.

### (c) Where HyperDelivery meets users in Teams

Ship **one Teams app, one persona ("HyperDelivery")**; per-agent identities stay out of the user's way, matching the early feedback.

- **Personal and group-chat agent** (Teams SDK for Python): streaming, Extended Markdown, targeted messages for private questions, and slash commands.
- **Gate approvals as Adaptive Cards** posted in the project chat.
- **Channel tab** embedding the console with Teams SSO.
- **Meeting side panel** with capture status, open questions and the live spec outline, plus **share-to-stage** of the spec or running preview so mixed technical and business groups co-create, recreating the ideathon dynamic.
- **Message extension:** "send this thread to HyperDelivery".

Later, add a declarative agent in M365 Copilot that calls HyperDelivery's MCP server, with an MCP Apps status widget, for Copilot-licensed users. Register HyperDelivery in Agent 365 (Bedrock registry sync) and in AWS Agent Registry.
