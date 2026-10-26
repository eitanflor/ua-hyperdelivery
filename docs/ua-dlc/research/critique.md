<!-- Point-in-time research, retrieved 2026-10-25 for the UA-DLC plan. Claims carry source links; vendor features and dates change quickly, so verify before acting. See README.md in this folder. -->
<!-- cspell:words ADOT Agentation Bugbot CRDT DPIA Duroseau Hocuspocus ITGC beautifului firecrawl flohoeller fluidfunctionalism gabriell haaarshsingh itpros unreviewed -->

# Completeness critique: HyperDelivery / UA-DLC research set (2026-10-25)

I read all nine full reports. The shared WebSearch budget ran out after my first query, so every spot-check below used direct WebFetch, firecrawl, local clones, or a read-only look at the HyperDelivery repo.

## 1. Contradictions between reports

1. **Whether Teams transcripts are "GA" (governance-collaboration) or blocked by default (enterprise-integration).** Governance builds Context Capture v1 on the "GA Graph API" from 2023. Enterprise says MC1393806 added a tenant control that is off by default. I checked: enterprise is right (see §2). Governance's plan is missing an admin dependency that blocks it.
2. **Meeting AI Insights API.** Enterprise says it went GA in Dec 2025, citing a secondary blog. Governance says it is still `/beta`. The primary resource page is still `/beta`. Treat the API as beta, and note that it needs an M365 Copilot license.
3. **Percentages.** Governance proposes a "Spec 80% ready" status. Chopin and UI/UX both reject percentages: Chopin shows plain-language phases taken from real events ([agent-work-progression-design.md](https://github.com/githubnext/chopin/blob/main/docs/agent-work-progression-design.md)), and UI/UX says to show "stage + count, never a fake percentage". Use stage + count.
4. **HyperDelivery's deterministic gate scoring.** AWS-AIDLC calls it a strength that matches AI-DLC's audit. Chopin's docs say a completeness score must not disable Build ([implementation-lifecycle.md](https://github.com/githubnext/chopin/blob/main/docs/implementation-lifecycle.md)). The two fit together: deterministic checks work as hard preconditions (sensors) with a stated reason, but a percentage threshold should never be the gate.
5. **Too many new steps.** Each report adds something:
   - AWS: Plan and Graduate.
   - Chopin: Assess.
   - Anthropic: an intent-acceptance step.
   - Governance: tier promotion.
   - Enterprise: a "promote" gate.

   Adopt them all and HyperDelivery has 7–9 human stops. Meanwhile AI-DLC 2.11.0 made new work leaner by default (fewer support agents, Guard Policy off, plan approval off for its quick scopes) while keeping its approval gates, which suggests ceremony has a real cost ([CHANGELOG](https://github.com/awslabs/aidlc-workflows/blob/main/CHANGELOG.md)); and UA users already say they don't care about the mechanics. The new steps need consolidating (see insight 5).
6. **Zero-human merges and "never remove a gate".** Runlayer's diagram (thumbnail examined) shows human review as an optional, dashed step. Anthropic's code-review tiers allow zero humans for low-risk changes, and Vercel reports 58% of PRs merging unreviewed (from snippets only). Software-factories, AWS and governance all say gates are never removed. Both can hold if the scope is explicit: station gates always stay human, while PR merges inside a T0/T1 prototype repo may be automatic for low-risk changes. This needs an explicit, logged decision.
7. **How collaboration is built:**
   - Governance: a self-built Yjs/Hocuspocus Session Room.
   - Enterprise: Teams side panel plus share-to-stage.
   - Chopin: defer CRDT co-editing until it is clearly needed.
   - AWS: an async "Huddle" over Adaptive Cards.

   Start with Teams and async, and keep the CRDT room for later.
8. **One living document (Chopin) or a chain of committed files (Anthropic's intent.md, spec.md, plan.md).** Do both: keep versioned artifacts underneath, with one rendered project document on top.
9. **Brand.** UI/UX says identity should come from "the UA stencil lockup". UA-context says no lockups or recolors without Brand sign-off, because UA "aggressively polices" its marks. UA-context also recommends Geist, while UI/UX's taste-skill lists Geist or Inter on #f8f8f8 with white cards as a sign of a generated kit. UA's own tokens fix both: #1d1d1d monochrome, 3–8px radii, and red only for the gate.
10. **Who sets the risk tier.** Anthropic has a classifier set it. Governance uses a deterministic floor that an LLM may only raise. Take governance's version.
11. **How many questions to ask.** HyperDelivery caps question cards at 4. AI-DLC keeps asking until every ambiguity is resolved. Chopin batches up to 10 and warns against "manufacturing" a complete spec. Pick one policy: draft a provisional section first, then send one batch of role-labeled questions.

## 2. Unverified or outdated claims, with spot-checks

**These six were spot-checked:**

| # | Claim (report) | Result |
|---|---|---|
| 1 | Graph transcript access is off by default behind a tenant control (enterprise) | **Confirmed, with new limits.** The [Graph doc](https://learn.microsoft.com/en-us/graph/teams-changenotifications-callrecording-and-calltranscript) (updated 2026-06-29) documents `403 GraphAccessToTranscriptsDisabled`, including on the app-installed scope. [office365itpros](https://office365itpros.com/2026/09/21/teams-meeting-graph-api/) confirms MC1393806 with a default of disabled and the `-EnableGraphTranscriptAccess` setting. **The reports missed two limits:** the app-installed RSC scope covers *scheduled meetings, not channel meetings*, and app-only access also needs a Teams application access policy. If UA runs ideathon sessions as channel meetings, capture fails silently. |
| 2 | Meeting AI Insights is GA (enterprise) | **Not confirmed.** The [callAiInsight](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/api/ai-services/meeting-insights/resources/callaiinsight) page still carries the `/beta` "not supported in production" banner, and the overview URL returns 404. |
| 3 | The App Builder agent and vibe.powerapps.com retire, and Copilot Managed Runtime is the threat (software-factories) | **Confirmed.** [MC1505609](https://mc.merill.net/message/MC1505609) was published 12 Oct 2026: new apps stop mid-October and the service retires 30 Nov, with users pointed to Cowork and Copilot Studio. The [CMR Learn page](https://learn.microsoft.com/microsoft-365/managed-apps/) (updated 15 Oct, preview) lists four build paths. One is **Copilot Code cloud sessions for business users**, which the reports underplayed. Every path inherits tenant defaults and shows in the admin inventory. |
| 4 | Customer-managed Bedrock KBs stop accepting new SharePoint and Confluence connectors on 30 Sep 2026 (enterprise) | **Confirmed, and wider than reported** ([doc](https://docs.aws.amazon.com/bedrock/latest/userguide/sharepoint-data-source-connector.html)). Salesforce and Web Crawler are also cut. AWS recommends Managed KB. The same page warns that synced data is readable by anyone with `bedrock:Retrieve`. |
| 5 | UA EDMA uses Snowflake CoWork and CoCo with a golden-report pattern (UA-context) | **Confirmed** by the [case study](https://www.snowflake.com/en/customers/all-customers/case-study/under-armour/): CoWork, CoCo, the golden report, the tenet of not moving data, Duroseau as CDAIO, and the AI help desk as UA's first agentic workflow. The "renamed from Snowflake Intelligence" claim is not in the case study and was not re-verified. |
| 6 | AgentCore Identity does Entra on-behalf-of exchange natively (enterprise, governance) | **Confirmed** ([doc](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/on-behalf-of-token-exchange.html)): `MicrosoftOauth2` with `JWT_AUTHORIZATION_GRANT`, `requested_token_use=on_behalf_of` added automatically, and `GetResourceOauth2Token` with `ON_BEHALF_OF_TOKEN_EXCHANGE`. The page carries no preview label. |

**Bonus checks:**
- **Factory.ai lists UA as a customer: confirmed.** factory.ai now redirects (308) to factory.com. Its raw HTML contains a logo with `aria-label="Under Armour"`. WebFetch missed it; firecrawl found it. UA engineering may already license Factory.
- **The Spark deprecation and GitHub Models retirement: confirmed** ([changelog](https://github.blog/changelog/2026-08-04-upcoming-deprecation-of-github-spark-on-github-com)).
- **AI-DLC release dates: confirmed** from the CHANGELOG in the local clone: 2.0.0 on 2026-06-18, 2.11.1 on 2026-10-20.
- **Telemetry in the HyperDelivery repo, from a read-only check:**
  - `tracing.py` registers a bare `TracerProvider()` with no processor or exporter.
  - There is no ADOT dependency.
  - `Dockerfile` runs `python -m agent_runtime.${AGENT}.main` without `opentelemetry-instrument`.
  - Spans are very likely dropped. Whether AgentCore injects its own exporter is still unknown.
- **`Decision`** (`src/core/domain/project.py`) has no artifact hash or version: confirmed.

**Still unverified, and decision-relevant:**
- Whether UA licenses **M365 Copilot**. Facilitator, Meeting AI Insights, Cowork `/app` and declarative agents all depend on it, and no report could check.
- UA's use of M365 and Atlassian. It is assumed from the brief and cannot be verified publicly.
- The date of the Copilot "cloud agent" rename, and its Teams integration.
- Vercel's 58% figure (the page returned 404).
- AgentCore Harness GA and Policy+Guardrails (secondary sources only).
- Agent Registry GA.
- Work IQ: GA or preview.
- The productivity figures from re:Invent DVT214 (vendor claims).
- Whether Danny Miles is still CTO in 2026.

## 3. Material gaps

**Every link the owner named was covered:**
- AI-DLC blog and repo
- the Anthropic playbook
- Chopin
- Runlayer
- both flohoeller posts
- haaarshsingh
- gabriell_lab
- tasteskill
- 21st.dev
- ponytail
- fluidfunctionalism
- bencho
- beautifului

I filled two holes in that coverage:

- **Runlayer.** I viewed the video thumbnail, which the researcher had not. It shows six columns (Signals, Watchers, Triage, Build, Review, Ship) and adds detail the post text lacks:
  - watchers on fixed schedules (call scan every 3h, channels hourly, CI triage every 4h on weekdays);
  - triage into "small → build", "big → scoped for a human" and "track → Linear";
  - human review drawn as *optional*;
  - a **daily** digest as well as the weekly video;
  - write-back of ":merged:" plus a note into the thread that asked;
  - "click a signal to replay it".

  This is also a strong layout reference for HyperDelivery's own line view.
- **gabriell_lab.** The [post](https://x.com/gabriell_lab/status/2107443057805476100) text confirms what the researcher inferred: it is a vocabulary list for describing scroll animations to Claude or Codex. The insight still holds: show visual pickers instead of asking users to name a pattern.

**Topics not adequately covered:**
1. **EMEA privacy and labor law for meeting capture.** UA runs EMEA from Amsterdam. Recording or transcription can trigger works-council consent (the Dutch WOR) and a GDPR DPIA, and transcripts and decisions need Purview retention and eDiscovery or legal-hold treatment. This is general knowledge I could not source after the search budget ran out. Raise it with UA Legal before Context Capture.
2. **EU AI Act Article 4 (AI literacy)** has applied since 2 Feb 2025 to *deployers'* staff ([text](https://artificialintelligenceact.eu/article/4/)). Enabling business users is a compliance duty as well as an adoption task.
3. **Adoption program.** AI-DLC's "Unicorn Gym" and "AI-DLC Master" got one line. Nothing covers champions, a center of excellence on the Power Platform CoE model, office hours, or onboarding curricula.
4. **Accessibility.** No report covers WCAG 2.2 AA for the console or the generated prototypes. It appears only as a "skill".
5. **AWS-native rivals for business users.** [Amazon Quick](https://aws.amazon.com/quick/) now offers shared Spaces with agents, Flows, and *custom apps* (intake forms, calculators) built "without writing code or filing an IT ticket". Combined with Copilot Code and CMR, simple asks have three sanctioned homes besides HyperDelivery.
6. **Supply-chain security of generated code:** SBOMs, license and dependency scanning, secret scanning, CodeQL in generated repos. Only Lovable's pre-publish scan was covered.
7. **Usability testing of HyperDelivery's own vocabulary.** Chopin issue #597 showed that "decision" was misread. No report plans research with UA business users on terms like "Brief", "Huddle" or "Graduate".
8. **SOX and ITGC** when a prototype that touches finance data moves up to T3.

## 4. Fifteen cross-cutting insights for UA-DLC and an enterprise HyperDelivery

1. **The product is the gated line, not the code generator.** With build down to hours, the bottleneck is now intent, decisions and review ([Anthropic playbook](https://claude.com/resources/articles/the-ai-native-sdlc-playbook), [Chopin](https://githubnext.com/projects/chopin/), [Osmani](https://addyosmani.com/blog/software-factories/)). Invest in Distill, decisions and Review. Keep the Copilot coding agent swappable, since UA may already have Factory ([factory.com](https://factory.com/)).

2. **One voice, outcome first, with no percentages.** All nine reports agree. Narrate in plain language from real events ("Reading your Confluence page", "Building 3 of 8"). Add a *stale* state, and make the crew an opt-in detail layer ([Chopin progression design](https://github.com/githubnext/chopin/blob/main/docs/agent-work-progression-design.md), [Linear AIG](https://linear.app/developers/aig), [fold subagents](https://claude.com/resources/articles/building-agents-when-to-fold-subagents-into-your-main-agent-loop)).

3. **Keep decisions apart from the prose, and bind approvals to a hash.**
   - A Decision has a status, who saved it, anchors to requirement IDs, and history kept on Reopen.
   - The signature records the artifact's SHA-256 and the signer's role.
   - After a change, show "N changes since approval".
   - Render one living document from the versioned artifacts.

   Sources: [Chopin decisions.md](https://github.com/githubnext/chopin/blob/main/docs/decisions.md); [Anthropic code review](https://claude.dev/blog/solving-code-review-at-anthropic/), where approval binds to one commit. Today's `Decision` lacks all of this.

4. **Gates should explain themselves, not multiply.** Approve stays visible but disabled, with the reason, while preconditions are unmet. Scores are advice only. Every block names its route to approval ([Chopin lifecycle](https://github.com/githubnext/chopin/blob/main/docs/implementation-lifecycle.md), [v0 FAQ](https://v0.app/faq), [Anthropic playbook](https://claude.com/resources/articles/the-ai-native-sdlc-playbook)).

5. **Merge every proposed front step into one "Brief".**
   - It combines AWS's Plan, Anthropic's intent.md and Spec Kit's assess: intent in the user's own words, a proposed path and depth, and a go / clarify / kill verdict.
   - It runs inside Distill, ahead of G1, rather than as an extra gate.
   - Depth changes prompts and thresholds, never the gate count.
   - Use AI-DLC's composer, which proposes the smallest workflow that still works ([composing.md](https://github.com/awslabs/aidlc-workflows/blob/main/core/knowledge/aidlc-composer-agent/composing.md)).

6. **Cross-functional capture is the moat, so build it async-first in Teams.** Build it in this order:
   1. Role-labeled questions.
   2. "Ask someone" on Adaptive Cards that only the assignee can act on.
   3. Transcript ingestion.
   4. The meeting stage.
   5. A CRDT room, last.

   Sources: [Universal Actions](https://learn.microsoft.com/en-us/microsoftteams/platform/task-modules-and-cards/cards/universal-actions-for-adaptive-cards/overview), [AI-DLC Mob Elaboration](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/), and software-factories' moat analysis.

7. **Meeting capture is a governance project before it is code.**
   - The tenant control is off by default.
   - Channel meetings are unsupported on the app-installed scope.
   - Insights are beta and need a Copilot license.
   - EMEA works-council and GDPR review apply.

   Open the request with Teams admins and Legal now. Ship upload and paste as the default path ([Graph doc](https://learn.microsoft.com/en-us/graph/teams-changenotifications-callrecording-and-calltranscript), [office365itpros](https://office365itpros.com/2026/09/21/teams-meeting-graph-api/)).

8. **Organizational memory comes from context that people confirm.**
   - Typed, cited context atoms are confirmed by humans.
   - Rules are layered org → workspace → project.
   - Corrections at a gate become candidate rules, promoted only on approval.
   - Metrics cite their golden report.

   Sources: [AI-DLC learning loop](https://github.com/awslabs/aidlc-workflows/blob/main/docs/guide/09-rules-and-the-learning-loop.md), [Bugbot learned rules](https://cursor.com/blog/bugbot-learning), [UA case study](https://www.snowflake.com/en/customers/all-customers/case-study/under-armour/). Devin's memory is personal; HyperDelivery's can be organization-wide.

9. **Set governance once and let everything inherit it.** Read as the user; write as a gated service.
   - Use Cedar for both console authorization (Amazon Verified Permissions) and agent tool calls ([AgentCore Policy GA](https://aws.amazon.com/about-aws/whats-new/2026/03/policy-amazon-bedrock-agentcore-generally-available/)).
   - Use Entra on-behalf-of exchange for reads ([confirmed](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/on-behalf-of-token-exchange.html)).
   - Use temporal policies so a write happens only after its gate token exists.
   - Use gh-aw-style staged writes ([staged mode](https://github.com/github/gh-aw/blob/main/docs/src/content/docs/reference/staged-mode.md)).
   - Copy the inherit-once pattern from [Databricks App Spaces](https://www.databricks.com/blog/enabling-governed-vibe-coding-enterprise-apps-databricks) and CMR.

10. **Three separate dials, none of which removes a gate:**
    - **Depth** (process), set in the Brief.
    - **Risk tier** (who co-signs, how deep review goes), with a deterministic floor that an LLM may only raise.
    - **Lifecycle tier** T0–T3 (data allowed, deploy targets).

    Sources: [Microsoft zones](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/sec-gov-phase2), Runlayer's always-human zones, Anthropic's risk-tiered approval.

11. **Show approvers evidence, not artifacts.** For each acceptance criterion:
    - before/after screenshots and a walkthrough, with the recording script approved first;
    - Playwright checks run against the approved mock;
    - a coverage note, plus a "what this prototype skips" ledger;
    - [Agentation](https://www.agentation.com/)-style pins on previews that feed Review.

    Sources: [Factory /demo](https://docs.factory.com/software-factory/droid-control.md), [Anthropic harness](https://www.anthropic.com/engineering/harness-design-long-running-apps), [Granola](https://granola.ai/blog/how-granola-thinks-about-designing-agents).

12. **Every loop needs a budget and a plain-language way out.** Benchmarks: AI-DLC's halting conditions, Anthropic's 3-round review cap, and Stripe's limit of [two CI rounds](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents). Apply budgets to the G1/G2 gap loops, Copilot polling and Review re-handoffs, and escalate to the gate owner with a summary.

13. **Run evals on the factory, and fix telemetry first.**
    - Export the spans.
    - Adopt the [OTel GenAI](https://github.com/open-telemetry/semantic-conventions-genai) contract.
    - Keep 20–50 golden intakes, run in CI on every prompt, skill or model change through [AgentCore Evaluations](https://aws.amazon.com/about-aws/whats-new/2026/03/agentcore-evaluations-generally-available).
    - Report cost per *accepted* outcome.
    - Track human minutes per project, not lines of code.

14. **Graduate, don't deploy.**
    - Previews live in a sanctioned, Entra-gated sandbox with TTLs ([ECS Express](https://aws.amazon.com/about-aws/whats-new/2025/11/announcing-amazon-ecs-express-mode/), [SiS container runtime](https://docs.snowflake.com/en/release-notes/2026/other/2026-03-09-sis-container-runtime-ga)).
    - Promotion is a human gate.
    - Engineering receives a hand-off package (Jira epic, Confluence page, optional `aidlc-docs/`).
    - Gartner, via a vendor summary, predicts 60% of vibe-coded apps will be retired by 2028 ([Tray summary](https://tray.ai/guides/gartner-govern-vibe-coding/)), so lifecycle hygiene matters ([Lovable](https://lovable.dev/blog/summer-2026)).
    - Anthropic steers non-technical teams to sanctioned hosting to avoid shadow IT ([source](https://claude.com/resources/articles/how-anthropic-secures-its-ai-native-software-development-lifecycle)).

15. **Triage intake to the right home, and stay neutral about runtimes.**
    - Data questions go to CoWork.
    - A simple M365 tool goes to CMR or Copilot Code ([CMR](https://learn.microsoft.com/microsoft-365/managed-apps/)).
    - A form or flow goes to [Amazon Quick](https://aws.amazon.com/quick/).
    - HyperDelivery keeps cross-functional, data-grounded, governed prototypes that need an audit chain.

    Vendor builders churn: [Spark is deprecated](https://github.blog/changelog/2026-08-04-upcoming-deprecation-of-github-spark-on-github-com) and [App Builder is retiring](https://mc.merill.net/message/MC1505609). That churn argues for owning the line and publishing to whichever runtime fits.
