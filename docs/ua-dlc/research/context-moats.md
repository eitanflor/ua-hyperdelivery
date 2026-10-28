<!-- Point-in-time research, retrieved 2026-10-27 for the UA-DLC north star (round 9). Claims carry source links; vendor features and dates change quickly, so verify before acting. See README.md in this folder. -->
<!-- cspell:words Akshay Alation Animesh Ashu Atlan Bitol Bugbot CMDB Casado Collibra Copyability DPIA Futurum Garg Graphlit Jamin Jaya Koratana Krishnaswamy Lauten NeurIPS ODCS Ossie SKOS Substack commoditize verticalization -->

# Context moats: what keeps HyperDelivery's deliverables better after feature parity (as of 2026-10-27)

Key: `context-moats`. Builds on [enterprise-plan.md section 5](../enterprise-plan.md#5-why-hyperdelivery-and-not-a-generic-tool)
(the advantage table, "Exit ramp" and "Who else is building toward this"),
[governance-collaboration.md](governance-collaboration.md) B4 and R3 (context engineering and
Context Capture), [dlc-landscape.md section 4](dlc-landscape.md#4-what-makes-hyperdelivery-different),
the moat analysis in [software-factories.md section 6](software-factories.md#6-moat-analysis-what-generic-platforms-structurally-cannot-do-for-ua),
insights 6 and 8 in [critique.md](critique.md), and the per-project index and memory in
[platform-architecture.md](../platform-architecture.md#the-per-project-index-and-memory). The
historical FSD corpus is researched in depth in [fsd-corpus-index.md](fsd-corpus-index.md), written in
parallel this round; this report ranks it as one entry and does not design it. The owner's
alignment notes (`aidlc-alignment-v2`) were read as supplemental context only, not as a source of
truth.

Labels: **(secondary)** means the claim comes from press, a summary or a third-party write-up rather
than the original; **[confirm]** means a fact about UA that the team has to check internally.

## 0. Bottom line

1. **Inside UA, the copier is another tool, not another company.** Microsoft 365 Copilot (with Work
   IQ), Atlassian Rovo (with the Teamwork Graph, opened to third-party AI tools over MCP in May
   2026), Glean-style enterprise graphs, Snowflake CoWork and engineering's coding agents can all be
   pointed at the same SharePoint, Confluence, Jira and Snowflake that HyperDelivery reads. Anything
   that already sits in those systems, including the approved FSDs, is a head start for HyperDelivery,
   not a moat.
2. **The strongest advantage is process-generated data: the record of how UA decides, captured at
   the moment of decision inside UA-DLC.** Decision records with rationale and the alternatives that
   were turned down; what people changed in a draft before they signed it; the SME
   question-and-answer ledger; definition disputes and how they were settled; acceptance evidence;
   handoff outcomes; redirected requests. This data exists only where the work runs, grows with every
   project, and cannot be rebuilt later by indexing the systems of record, because those systems
   keep the outcome and drop the reasoning
   ([Foundation Capital](https://ashugarg.substack.com/p/ais-trillion-dollar-opportunity-context)).
3. **Position is what produces that data, and it is the most fragile of the three advantages.** Being
   where approvals happen, owning the handoff format engineering's pipeline reads, and later serving
   confirmed context over MCP to Copilot, Factory, GitHub Copilot and Claude Code is what makes
   HyperDelivery the place records get made. UA can move that seat to a vendor (the plan's exit
   ramp), so the records have to live in open, exportable formats. The rule this report proposes:
   **own the write path, share the read path.** HyperDelivery makes the records; every sanctioned
   tool may read them.
4. **The data-moat critique is right about raw corpora and fine-tuned models, and wrong about
   decision-time judgment.** a16z's point that data scale effects flatten out and data goes stale
   ([a16z, 2019](https://a16z.com/the-empty-promise-of-data-moats/)), and the steep fall in model
   prices ([Epoch AI](https://epoch.ai/data-insights/llm-inference-price-trends)), both hold. What
   survives: small, human-confirmed, high-signal records used for retrieval, evaluation, routing and
   guardrails; access-controlled internal data (which a16z itself calls defensible); and labels that
   can only be captured at the moment of decision. Do not bet on a fine-tuned model; prefer retrieval
   and evals, which carry over when the model changes.
5. **Top five of the twelve ranked assets:** (1) decision records with rejected alternatives; (2)
   the crosswalk from the words people use to UA's certified definitions, with the disputes and
   their resolutions; (3) approval edits, meaning what humans changed before signing; (4) handoff
   outcomes and what engineering changed; (5) the SME answer ledger and who answered what. The
   approved FSD corpus ranks sixth: the best cold start UA has, and the most copyable.
6. **The same records are how UA earns the north star.** They are the evidence for moving one step at
   a time from human-led to AI-assisted to AI-driven (first-pass acceptance and edit distance for that
   step type across projects), and they keep proactive Teams asks rare, because HyperDelivery answers
   from the ledger before it asks a person. Humans keep every decision the AI surfaces.
7. **Prepare now means record, not build.** From the first Final MVP project: seven record types with
   fixed schemas, every draft version kept, provenance and reuse scope on every record, a notice to
   users that their answers and edits are recorded, and baselines for the measures. No org-wide
   knowledge graph, MCP server, expertise graph or fine-tuning before the Enterprise phase.
8. **Prove it with ablation and a parity test, not with volume.** Rerun the golden intakes with one
   asset removed at a time, and run the same intake through a generic tool given the same documents,
   blind-rated by SMEs. Track edit distance at approval, first-pass acceptance, handoffs without a
   rewrite, reuse rate, citation coverage and SME asks avoided. By the scale decision there will be
   tens of projects, not thousands, so trends will be noisy and ablation carries the proof.
9. **The main risks** are wrong context compounding across projects, an expertise graph that amounts
   to profiling teammates (an EMEA works-council and GDPR question), people gaming edit distance by
   approving without reading, and AI-written text coming back in as "human-confirmed" context.

## 1. What "moat" means for an internal platform

HyperDelivery is not defending revenue. The question is narrower: when a generic tool reaches feature
parity (multi-party input, approvals, prototypes, a handoff), what makes a UA deliverable produced
through HyperDelivery still measurably better? Three tests apply to every candidate asset:

1. **Would a generic tool, deployed inside UA with the same permissions, have it?** If the asset sits
   in SharePoint, Confluence, Jira or Snowflake, the answer is yes, or soon.
2. **Does it get better with each project?** A static corpus is worth the same on day 300 as on day
   1, minus staleness. A compounding asset is worth more.
3. **If HyperDelivery is replaced, does UA keep it?** The plan's exit ramp already says UA keeps "the
   golden paths, the confirmed context and the decision record"
   ([enterprise-plan.md section 5](../enterprise-plan.md#5-why-hyperdelivery-and-not-a-generic-tool)).
   An advantage that disappears with the tool belongs to the vendor, not to UA.

The first test matters more than it looks, because the generic tools are building exactly the
context layer that would erase a corpus advantage:

| Tool | What it builds | What it does not claim to hold |
|---|---|---|
| Microsoft Work IQ | A layer of Data, Memory and Inference for Copilot and Agent 365 agents; memory is a lasting picture of how people and teams work; reachable over A2A, a remote MCP server and REST; generally available in Copilot Studio, with some workloads still in preview ([Learn, Copilot Studio, updated 2026-10-22](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/add-work-iq); [Learn, overview](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/)) | Decisions with rationale, rejected options or sign-offs |
| Microsoft People Skills | Skills inferred from work activity ([Microsoft adoption](https://adoption.microsoft.com/en-us/ai-agents/people-skills)); people ask Copilot who has a skill, and search by skill in People Companion, which is in beta and needs an admin opt-in ([Microsoft support](https://support.microsoft.com/en-us/people-skills/explore-what-you-can-do-with-your-skills)) | Who gave a confirmed answer to a specific business-logic question |
| Atlassian Teamwork Graph | People, work, goals, code and content across Atlassian and connected apps; Teamwork Graph tools in the Rovo MCP server and a Teamwork Graph CLI give third-party agents access. Both launched in open beta on 2026-05-06 ([Atlassian](https://www.atlassian.com/blog/company-news/teamwork-graph-team-26)); the CLI went GA in version 1.0.15 on 2026-06-23 ([changelog](https://developer.atlassian.com/cloud/twg-cli/changelog.md)), and Atlassian's tool list no longer marks the two MCP tools as beta and prices most calls at 1 to 10 Rovo credits ([Atlassian support](https://support.atlassian.com/atlassian-ai-gateway/docs/supported-tools/)) | What a business teammate decided before a Jira ticket existed |
| Glean Enterprise Graph | Projects, people, customers, products, teams and processes, inferred per tenant from 275+ connectors ([Glean](https://www.glean.com/enterprise-context/enterprise-graph)) | The page does not say it records decisions or outcomes |
| Snowflake CoWork and semantic views | Cited answers over certified definitions (see [tool-landscape.md](tool-landscape.md)) | How a business phrase maps to a certified metric, or which of two meanings a department meant |

The right-hand column is where HyperDelivery's lasting advantage has to come from.

## 2. Three kinds of advantage

### 2a. A proprietary corpus that exists before HyperDelivery

What it is: approved FSDs and their template families (the repo already detects two, the EDM FSD and
the ServiceNow Idea, in `src/tools/distill.py`), Snowflake golden reports and certified semantic
views, Jira and Confluence history, engineering's AI-DLC context files and evidence packs, the
Baselayer design system, and architecture and InfoSec standards.

How it helps: retrieval of worked examples, a completeness checklist drawn from what approved
documents always contain, the vocabulary, and a cold start before HyperDelivery has run a single
project. [current-state.md](../current-state.md) already lists an embedding search over historical
FSDs as one of the "seeds of a UA knowledge layer".

Why it is weak as a moat: every sanctioned tool can index the same systems. What makes it harder to
copy is curation: which FSDs were approved and which were superseded, which section of each maps to
which part of today's Brief, and which ones led to something that shipped. Most of that curation
comes from process data (2b). The alignment notes also call FSD, TSD and BRD "legacy names, not
required", so the corpus should supply content and checklists, not force the old format back on
requesters. Details are in [fsd-corpus-index.md](fsd-corpus-index.md).

### 2b. Process-generated data that exists only because people run UA-DLC on HyperDelivery

What it is, by record type:

- **Decision records** with the options considered, the one chosen, the rationale, the evidence and
  who decided, kept apart from the prose so a regenerated draft cannot change them
  ([operating-model.md section 8](../operating-model.md#8-artifacts)).
- **Approval edits:** the last draft submitted for approval against the version that was signed, per
  section, with who edited it.
- **The SME question-and-answer ledger:** each question, why that person was asked, the answer, and
  whether the requester accepted it.
- **Definition disputes:** two departments' meanings of one term (the R3 example is "net demand" in
  Supply Chain and Finance), the steward's resolution and the certified object it ended on.
- **Prototype acceptance evidence and send-backs,** with the cause classified by the "fix the
  factory" taxonomy ([platform-architecture.md](../platform-architecture.md)).
- **Handoff outcomes:** whether engineering took the package into Construction without a rewrite,
  what it changed, and the Construction decision (AI-driven, AI-assisted or not now) with its reason.
- **Redirected requests:** requests sent to CoWork, Copilot Studio or Cortex Code at intake, and
  whether the redirect held.

Why it is hard to copy: nobody else sees the draft before the signature, the question before the
answer, or the option that lost. Foundation Capital's definition of a decision trace (the inputs
gathered, the policy applied, the exception granted, who approved, the state written) maps almost
field for field onto what HyperDelivery is designed to record. Its argument is that systems of record
keep the current state rather than the state at decision time, so the reasoning cannot be
reconstructed afterwards ([Foundation Capital, Dec 2025](https://ashugarg.substack.com/p/ais-trillion-dollar-opportunity-context)).

| Decision-trace element (Foundation Capital) | Where HyperDelivery records it (designed) | In the code today |
|---|---|---|
| Inputs gathered | `SourceRef` on every statement, `ResourceDigest`, `DataFindings` query ids ([platform-architecture.md](../platform-architecture.md)) | Evidence links on the spec; no `SourceRef` |
| Policy applied | Target tier, risk floor, who-signs rule, golden path version; a Cedar `policy_decision_id` in the Enterprise phase ([governance-collaboration.md R1](governance-collaboration.md)) | No |
| Exception granted | A metric accepted as "uncertified" or "not yet agreed", a steward ratification deferred, a check waived | Not a first-class record |
| Who approved | Signer, role, artifact version and hash | Signer and comment only (`Decision` in `src/core/domain/project.py`) |
| State written | The signed artifact hash, the handoff package, the Construction decision | Artifact versions |
| Alternatives turned down | Decision records with options (Layer 2) | No |
| Precedent | Not designed yet | No |

The last two rows are the gap this report most wants closed in the Final MVP schema.

### 2c. Position and distribution

- **Being where approvals happen.** Every approval in UA-DLC is signed in HyperDelivery and bound to
  an exact version, and that is the moment the decision trace is complete. Jamin Ball argues that the
  layer which decides what context agents see, and keeps permissions and audit, is the most valuable
  seat in the agent era, and that its own data becomes traces, evals and telemetry
  ([Ball, 2026-06-12](https://cloudedjudgement.substack.com/p/systems-of-record-won-the-saas-era)).
- **The handoff format engineering consumes.** If engineering's `jira-to-pr` pipeline reads
  HyperDelivery's AI-DLC context files ([ua-marketplace-alignment.md](ua-marketplace-alignment.md)),
  HyperDelivery is upstream of Construction by default, and handoff outcomes flow back to it.
- **Serving the context layer over MCP.** The tools UA already uses can call MCP servers: Copilot
  Studio since its GA on 2025-05-29 ([Microsoft](https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/model-context-protocol-mcp-is-now-generally-available-in-microsoft-copilot-studio)),
  Microsoft 365 Copilot declarative agents ([enterprise-integration-platform.md](enterprise-integration-platform.md)),
  GitHub Copilot under an enterprise MCP allowlist, GA and enforced in the Copilot app, Copilot CLI
  and VS Code ([GitHub changelog, 2026-08-06](https://github.blog/changelog/2026-08-06-mcp-allowlists-in-enterprise-managed-settings)),
  Factory's Droid (`droid mcp add`, [Factory docs](https://docs.factory.com/cli/configuration/mcp)) and
  Claude Code. The alignment notes already list an MCP server that lets "Factory or GitHub Copilot use
  the inception agent". This report recommends serving the context first and the agent later
  (section 4, "Distribution").
- **The cross-department view.** Only an internal line sees every project, so only it can say "Finance
  settled this term in March" or "two departments asked for the same tool"
  ([software-factories.md section 6](software-factories.md#6-moat-analysis-what-generic-platforms-structurally-cannot-do-for-ua)).

Position is granted by UA, not earned in a market. Leadership can move it, and Microsoft and
Atlassian are competing for the same seat.

### 2d. Which is strongest, and why

| | Corpus (a) | Process data (b) | Position (c) |
|---|---|---|---|
| Exists before HyperDelivery | Yes | No | No |
| Gets better with each project | Barely (more documents, more staleness) | Yes | Yes, while held |
| A generic tool inside UA can get it | Yes, by indexing | Only by running the process | Only if UA moves the seat |
| Survives the exit ramp | Yes (it was never HyperDelivery's) | Only in open formats | No |
| Main mechanism | Retrieval, cold start | Evaluation, guardrails, routing, preference data | Distribution, capture |

**Process data is the strongest of the three, because it is the only one that compounds and cannot
be indexed into existence.** Position matters because it produces process data; on its own, it is a
seat that can be taken away. The corpus matters because it carries quality for the first year, while
process data is still thin.

The order changes over time. Through the pilot (weeks 15 to 22) the corpus carries quality, because
there are only a handful of projects. By the scale decision (around week 52), the records from tens
of projects should beat the corpus on the measures in section 7, or the claim fails. Beyond
Enterprise, process data dominates, as long as stewards keep it current.

### 2e. The counter-view, and what survives it

The case against data moats, stated fairly:

- **Data network effects are rare, and scale effects flatten out.** More data costs more and adds
  less. Data goes stale, cold starts can be bootstrapped cheaply, and lasting defensibility comes
  from elsewhere: verticalization, distribution, account control, brand
  ([Casado and Lauten, a16z, 2019-05-09](https://a16z.com/the-empty-promise-of-data-moats/)).
- **Models commoditize.** The price of reaching a fixed benchmark score has fallen between 9 and 900
  times a year depending on the threshold ([Epoch AI, 2025-03-12](https://epoch.ai/data-insights/llm-inference-price-trends)).
  Advantages tied to a model, including a fine-tuned one, last until the next base model.
- **Decision traces need groundwork first.** Without identity resolution, ownership and entity
  relationships, decision traces cannot be captured or queried, and without open schemas they cannot
  be compared across systems ([Graphlit, 2025-12-24](https://www.graphlit.com/blog/context-layer-ai-agents-need), a vendor blog).
- **Context graphs could fail the way semantic layers did,** because people disagree on definitions.
  Ball raised this bear case in conversation with Foundation Capital; Garg's reply was that graphs
  form implicitly as a byproduct of delivering value, not from definition workshops
  ([Garg, 2026-01-16](https://ashugarg.substack.com/p/why-context-graphs-are-the-missing)).
- **Systems of record are not dying.** Agent failures usually come from pulling the wrong value from
  the wrong system, which raises the bar for canonical sources rather than replacing them
  ([Ball, 2025-12-12](https://cloudedjudgement.substack.com/p/clouded-judgement-121225-long-live)).

What survives:

1. **Process data is a byproduct, so collecting it does not get more expensive** the way a16z
   describes for bought or labeled data. Curating it does: steward time is the real cost, and it is
   budgeted in section 10.
2. **Small and confirmed beats large and raw.** Anthropic's guidance is to find "the smallest possible
   set of high-signal tokens", fetched just in time, with a few canonical examples rather than a long
   list of edge-case rules ([Anthropic, 2025-09-29](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)).
   A confirmed decision, a settled definition or an accepted SME answer is exactly that kind of token.
3. **a16z concedes the case that fits UA:** proprietary data is most defensible when the sources are
   scarce and their owners will not share them with several vendors, and the lessons earned in a
   complex domain ("scar tissue") are themselves defensible ([a16z](https://a16z.com/the-empty-promise-of-data-moats/)).
4. **Cheaper models help.** If models are a commodity, context is what differs between two tools
   running the same model, and cheaper inference makes it affordable to send more of it and to
   rerun evals on every change.
5. **The semantic-layer failure is designed around.** Disputes are first-class records routed to a
   steward, and settled definitions go to Snowflake, which stays the system of record. HyperDelivery
   keeps the crosswalk and the history, not a second semantic layer.
6. **Staleness is real, so it is part of the schema:** every record has a "last confirmed" date, a
   review-by date and a supersedes link (section 9).

What does not survive: claims that the size of the corpus is the moat; claims that a fine-tuned model
is the moat; and claims that the meeting corpus is UA's edge over Microsoft, which already holds the
recordings, transcripts and Copilot notes. What counts from meetings is the confirmed extract (a
decision, an answer, a settled term), which ranks under assets 1, 2 and 5.

## 3. Candidate assets: the long list

Kind: (a) corpus, (b) process data, (c) position. Thirty-seven candidates; the top twelve are ranked
in section 4.

| # | Candidate | Kind | Note |
|---|---|---|---|
| 1 | Approved FSDs and their template families | a | Cold start; see [fsd-corpus-index.md](fsd-corpus-index.md) |
| 2 | Golden reports and certified semantic views | a | Snowflake's system of record; referenced, never copied |
| 3 | Jira history: tickets, epics, created and resolved times | a | Precedent and estimation; Rovo can read it too |
| 4 | Confluence history: pages, revisions, comment threads | a | Same; revisions show what changed after review |
| 5 | UA vocabulary and acronyms | a | Static, cheap, high first-pass value |
| 6 | Fiscal and season calendar conventions | a | Fiscal year April to March; FW and SS season codes such as FW27 ([under-armour-context.md](under-armour-context.md)) |
| 7 | Product hierarchy knowledge | a | Article, style, colorway and franchise tags; levels and owners [confirm] |
| 8 | Data owners, stewards and system owners | a | From a catalog or CMDB, if UA has one [confirm] |
| 9 | Data contracts and schemas | a | Owned by data platform; ODCS is an open format for them |
| 10 | Data-quality incident history | a | Guardrails; where it lives is [confirm] |
| 11 | Known data caveats ("do not use table X for Y") | a, b | Mostly tribal; captured as projects find them |
| 12 | Approved architecture patterns and decision records | a | Engineering's |
| 13 | InfoSec and architecture review outcomes | a, b | Become checks, never raw findings |
| 14 | Baselayer templates and golden-path repositories | a | UA's look and stacks |
| 15 | Past meeting corpus: recordings, transcripts, Copilot and Loop notes | a | Microsoft holds it; extracts matter, not the corpus |
| 16 | Inventory of internal tools already built | a | Dedupe and "this exists" redirects |
| 17 | Engineering's AI-DLC context files and evidence packs | a | The handoff target format |
| 18 | Decision records with rationale and rejected alternatives | b | Rank 1 |
| 19 | Approval edits: draft versus signed | b | Rank 3 |
| 20 | SME question-and-answer ledger | b | Rank 5 |
| 21 | Who answered what (routing graph) | b | Part of rank 5; privacy-heavy |
| 22 | Definition disputes and resolutions; the term crosswalk | b | Rank 2 |
| 23 | Prototype acceptance evidence | b | Rank 9 |
| 24 | Prototype failures and send-back causes | b | Rank 9 |
| 25 | Handoff outcomes and what engineering changed | b | Rank 4 |
| 26 | Redirected requests and whether the redirect held | b | Rank 10 |
| 27 | Cycle-time and effort per step and project shape | b | Rank 11 |
| 28 | Construction decisions (mode and reason) and their results | b | Part of rank 4 |
| 29 | Post-launch usage of delivered tools | b | Beyond Enterprise; comes from Operations |
| 30 | Contributor ratings ("worth my time") and SME load | b | Guards SME goodwill; not ranked |
| 31 | Golden cases drawn from real projects | b | The eval set; part of rank 9 |
| 32 | Duplicate and prior-art matches across departments | b | Falls out of ranks 1 and 6 |
| 33 | Corrections promoted to rules (learned rules) | b | The mechanism of rank 3 |
| 34 | The seat at approvals | c | Enabler; section 2c |
| 35 | The handoff format engineering's pipeline reads | c | Enabler; part of rank 4 |
| 36 | Confirmed context served over MCP to other tools | c | Distribution; section 4 |
| 37 | Asks in Teams, where people already work | c | Enabler for rank 5 |

## 4. The top twelve, ranked

Ranking weighs four things: how much better a deliverable gets, how hard the asset is to get by other
means (compounding versus static), how soon it can exist, and how much governance it costs. Position
items (34 to 37) are enablers, not data, and are treated under "Distribution" below.

| Rank | Asset | Kind | Main mechanism | Copyability | First exists | Headline measure |
|---|---|---|---|---|---|---|
| 1 | Decision records with rejected alternatives | b | Retrieval of precedent; guardrails | Compounding | Final MVP | Decisions citing a precedent; decisions reopened |
| 2 | Term-to-certified-definition crosswalk, with disputes | b on a | Guardrails; routing to stewards | Compounding | Final MVP | Plan metrics bound to a certified definition |
| 3 | Approval edits | b | Preference data; evaluation | Compounding | Final MVP | Edit distance at approval, per section |
| 4 | Handoff outcomes and engineering's changes | b | Evaluation; guardrails | Compounding | Pilot readout | Handoffs taken without a rewrite |
| 5 | SME answer ledger and who answered what | b | Retrieval; routing | Compounding | Final MVP (ledger), Enterprise (routing) | Questions answered from the ledger |
| 6 | Approved FSD corpus and template | a | Retrieval; completeness checks; estimation | Static, copyable | Today | Brief sections seeded from a cited FSD |
| 7 | Golden paths and review outcomes as checks | a, b | Guardrails; generation templates | Copyable as files; compounding as rules | Final MVP (one), Enterprise | Prototypes built from a golden path |
| 8 | Data caveats and incident memory | a, b | Guardrails | Partly compounding | Final MVP (recorded), Enterprise (imported) | Wrong bindings caught by a caveat |
| 9 | Acceptance evidence, failures and golden cases | b | Evaluation | Compounding | Final MVP pilot | Golden-case pass rate; repeat causes |
| 10 | Redirected requests | b | Routing | Compounding | Final MVP | Redirects that held |
| 11 | Cycle-time and effort telemetry | b, a | Estimation | Compounding | Final MVP (recorded), Enterprise (calibrated) | Estimate error |
| 12 | UA vocabulary, calendar and product hierarchy pack | a | Retrieval; guardrails | Static, copyable | Final MVP | Vocabulary misses flagged by reviewers |

### 1. Decision records with rationale and rejected alternatives

- **What it is.** Each decision a project settles: the question, the options, the one chosen, why,
  why the others lost, the evidence (`SourceRef`s), who decided and in what role, what it supersedes,
  and its scope (project, workspace, or org once a steward promotes it).
- **Where it comes from.** Decision cards in the conversation and Teams, the Decisions tab, approvals
  and the Construction decision ([operating-model.md section 8](../operating-model.md#8-artifacts)).
- **Mechanism.** Retrieval of precedent ("Finance chose weekly grain for a similar tool in March, for
  this reason"); guardrails (a settled decision is not quietly reopened by a regenerated draft, and a
  new plan that contradicts an org-scope decision is flagged); routing (who decided the last one);
  later, precedent-backed defaults that shorten decisions but never skip the signature.
- **How hard to copy.** Hardest of all. The rejected options and the reasons exist nowhere else.
- **When.** Final MVP records them per project; Enterprise reuses them across projects through the
  Library.
- **Sensitivity and governance.** Attributed to named teammates; project access rules apply; moving
  a decision to org scope is a steward action; retention follows a schedule Legal sets.
- **Measure.** Share of new decisions that cite a precedent; decisions reopened after approval 2;
  median time from question to settled.

### 2. The crosswalk from business terms to certified definitions, with disputes

- **What it is.** How people actually say things ("sell-through", "net demand", "Factory") mapped to
  the certified Snowflake object or golden report they meant, per department, with every dispute and
  the steward's resolution. Snowflake keeps the definitions; HyperDelivery keeps the mapping and its
  history.
- **Where it comes from.** Data discovery in Inception (Cortex Code's `DataFindings`), "Confirm what
  we heard", steward ratifications and dispute records
  ([governance-collaboration.md R3](governance-collaboration.md)).
- **Mechanism.** Guardrails (bind every plan metric to a certified definition or label it); retrieval
  (the meaning this department used last time); routing (send the dispute to the steward who settled
  the last one).
- **How hard to copy.** Hard. CoWork reads the certified view, but not which of two meanings Supply
  Chain meant in a request, or that the question was already settled. "Factory" is a good test: in a
  merchandising request it means Factory House outlets, not the coding tool.
- **When.** Final MVP records disputes and bindings; Enterprise reuses them across projects and
  proposes catalog entries through stewards (HyperDelivery holds no catalog write access).
- **Sensitivity and governance.** Low for the mapping; disputes name departments, not people, in
  anything shared beyond the project.
- **Measure.** Plan metrics bound to a certified definition (the plan's 80% scale target); disputes
  reopened; median steward resolution time.

### 3. Approval edits: what humans changed before signing

- **What it is.** For each approval, the last AI-drafted version submitted against the signed version,
  section by section, with who made each edit and, where offered, a one-click reason using the
  plan's existing "fix the factory" causes (for example missing context, an ambiguous ticket or
  criterion, or a data definition gap; [platform-architecture.md section 14](../platform-architecture.md#14-quality-and-evaluation)).
- **Where it comes from.** Artifact versions, which the repo already keeps, and the signature hash.
- **Mechanism.** Preference data used without fine-tuning: infer a written preference from each
  edit and retrieve the preferences learned on similar past sections into the prompt, the approach
  CIPHER tested, which had the lowest edit cost of the methods compared
  ([Gao et al., NeurIPS 2024](https://www.microsoft.com/en-us/research/publication/aligning-llm-agents-by-learning-latent-preference-from-user-edits/));
  turn recurring corrections into candidate rules, as Cursor's Bugbot does with review feedback (it
  reports the share of its flagged bugs resolved by merge rising from 52% in July 2025 to about 78%,
  a vendor figure), with one difference: Bugbot promotes and disables rules automatically from
  signal, while HyperDelivery would promote a rule only when a human approves it
  ([Cursor, 2026-04-08](https://cursor.com/blog/bugbot-learning)); and evaluation (did the new
  prompt reduce the edits on the golden intakes?).
- **How hard to copy.** Hard. Only the tool that drafted the document and holds the signature sees the
  difference.
- **When.** Final MVP keeps every version and computes diffs from the pilot; Enterprise promotes rules
  on approval; Beyond Enterprise considers preference tuning only if retrieval and rules stop
  improving and ablation shows tuning would pay off.
- **Sensitivity and governance.** Personal data about who edited what. Use it only to improve the
  system, never to judge a person; report by role, not by name; notice in place before the pilot.
- **Measure.** Normalized edit distance at each approval, per section, trending down; the same cause
  recurring after a fix (it should not).

### 4. Handoff outcomes and what engineering changed

- **What it is.** For each handoff package: the Construction decision and its reason; whether
  engineering took it without a rewrite; if sent back, the cause; and, if engineering agrees, the
  difference between the handoff commit and the first Construction release.
- **Where it comes from.** The Construction decision record, engineering's Jira and repositories, and
  a short check-in at 30 and 90 days (proposed).
- **Mechanism.** Evaluation (the ground truth for "a good handoff"); guardrails (a pre-handoff
  checklist built from past send-backs); estimation (what Construction effort followed which kind of
  package).
- **How hard to copy.** Hard. It needs the handoff and engineering's cooperation, and it is the claim
  the pilot readout has to prove.
- **When.** First outcomes at the pilot readout; systematic in the Enterprise phase with engineering's
  agreement (a long-lead request).
- **Sensitivity and governance.** Close to team performance data; report by cause, not by team or
  person; agree the reporting with engineering leads first.
- **Measure.** Handoffs taken into Construction without a rewrite, by mode; size of engineering's
  changes; send-back causes over time.

### 5. The SME answer ledger and who answered what

- **What it is.** Every question HyperDelivery asked a person, why that person, the answer, whether the
  requester accepted it, and the facts it produced; from the ledger, a routing view of who gave
  accepted answers on which topics.
- **Where it comes from.** Question cards in the conversation and Teams, "Not me, suggest who" and "I
  don't know" replies ([operating-model.md](../operating-model.md)), and later the proactive Teams
  asks in the north star.
- **Mechanism.** Retrieval (answer from the ledger before asking anyone; the operating model already
  requires checking the per-project index first); routing (ask the person who answered this kind of question well, with a cap of
  one batched card per person per project per day).
- **How hard to copy.** The ledger is hard to copy. Microsoft's People Skills infers expertise from
  activity, but it does not know who gave an accepted answer to a specific business-logic question.
- **When.** Final MVP keeps the ledger per project; Enterprise shares it across projects and adds
  routing suggestions, after a privacy review; Beyond Enterprise drives proactive asks at scale.
- **Sensitivity and governance.** The highest of the twelve. A who-knows-what graph is profiling of
  employees, so it needs a DPIA, EMEA works-council review, purpose limits (routing questions only,
  never performance), opt-out, and people able to see and correct their own entries.
- **Measure.** Share of questions answered from the ledger rather than sent; cards per person per
  week; "Not me" rate (routing precision); acceptance rate of answers.

### 6. The approved FSD corpus and its template

- **What it is.** Historical, approved FSDs and the template families they follow. Designed in
  [fsd-corpus-index.md](fsd-corpus-index.md).
- **Where it comes from.** UA's document stores; today a reference bucket (`fsds/`) and an embedding
  index ([current-state.md](../current-state.md)).
- **Mechanism.** Retrieval of worked examples; a completeness checklist; estimation, by comparing an
  FSD's "Level of Effort" field with what Jira later recorded [confirm the data exists].
- **How hard to copy.** Copyable inside UA wherever the files sit in SharePoint or Confluence. The
  part that compounds is the curation (approved, superseded, outcome-linked), which comes from ranks
  1, 4 and 9.
- **When.** Exists today; cited as references in the Final MVP; curated in the Enterprise phase.
- **Sensitivity and governance.** Original access controls apply; some FSDs may name people or hold
  confidential plans.
- **Measure.** Share of Briefs with a cited FSD reference; completeness at approval 1.

### 7. Golden paths, with review outcomes encoded as checks

- **What it is.** Approved stacks, the Baselayer app kit, Snowflake role and Entra registration
  patterns, and the outcomes of InfoSec and architecture reviews turned into checks the coding agent
  cannot skip ([enterprise-plan.md](../enterprise-plan.md)).
- **Where it comes from.** Platform team, Brand, InfoSec and architecture review, plus each review
  finding on a HyperDelivery prototype.
- **Mechanism.** Guardrails and generation templates.
- **How hard to copy.** The files are copyable by design: shipped as Agent Skills folders and an
  `AGENTS.md`, both open formats now governed by the Linux Foundation's Agentic AI Foundation
  (AGENTS.md as a founding project, [2025-12-09](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation);
  [Agent Skills](https://agentskills.io/) donated by Anthropic on 2026-10-22,
  [Anthropic](https://www.anthropic.com/news/donating-agent-skills-to-the-agentic-ai-foundation)),
  so any UA tool can use them, which is the point. The compounding part is each review finding becoming a
  rule.
- **When.** One golden path in the Final MVP (the sandbox prototype); more in the Enterprise phase.
- **Sensitivity and governance.** Store review outcomes as rules and categories, never raw
  vulnerability findings.
- **Measure.** Share of prototypes built from a golden path; review findings per prototype, trending
  down.

### 8. Data caveats and incident memory

- **What it is.** Known traps ("do not use table X for Y", "this view double-counts returns before
  FY26"), owned and dated, plus the history of data-quality incidents.
- **Where it comes from.** Stewards, Teams threads, incident tickets, and caveats a project discovers
  during data discovery.
- **Mechanism.** Guardrails at binding time: Cortex Code's findings are checked against caveats before a
  metric is bound.
- **How hard to copy.** Partly. An incident system is indexable; the caveats people find in passing
  are not, unless something records them.
- **When.** Final MVP records caveats found in projects as typed facts; the Enterprise phase imports
  incident history once its location is known [confirm].
- **Sensitivity and governance.** Moderate; keep the caveat, owner and expiry, not incident details.
- **Measure.** Wrong bindings caught by a caveat; incidents later traced to a known caveat (should be
  none).

### 9. Acceptance evidence, failures and golden cases

- **What it is.** Evidence packs, approvals sent back with their cause, and the golden cases built
  from them ([platform-architecture.md](../platform-architecture.md)).
- **Mechanism.** Evaluation: the factory's own eval set, drawn from real UA work rather than
  benchmarks.
- **How hard to copy.** Hard; it is UA's own record of what "accepted" means.
- **When.** Final MVP pilot.
- **Sensitivity and governance.** Screenshots may show dev data; same retention as the project.
- **Measure.** Golden-case pass rate; causes that recur after a fix.

### 10. Redirected requests

- **What it is.** Requests sent at intake to CoWork, Copilot Studio, Cortex Code or an engineering
  team, with whether the redirect held or the request came back.
- **Mechanism.** Routing: an eval set for the intake decision the plan already measures ("share of
  requests pointed to another tool at intake", 20 to 40% at scale).
- **How hard to copy.** Hard, and a generic tool has little reason to collect it.
- **When.** Final MVP.
- **Sensitivity and governance.** Low.
- **Measure.** Redirects that held; requests that came back.

### 11. Cycle-time and effort telemetry

- **What it is.** Business days and hours by role per step and project shape, joined with Jira history
  for the baseline.
- **Mechanism.** Estimation: time budgets by shape and depth, and the evidence for moving a step
  toward AI-driven.
- **How hard to copy.** Compounding; Jira holds part of it, but not per UA-DLC step.
- **When.** Recorded in the Final MVP; calibrated in the Enterprise phase.
- **Sensitivity and governance.** Aggregate by step and shape; never per person.
- **Measure.** Forecast against actual business days.

### 12. UA vocabulary, calendar and product hierarchy

- **What it is.** Acronyms and terms ("golden report", "article activation", "monument", Brand House,
  Factory House), the fiscal calendar (April to March) and season codes such as FW27, and the product
  hierarchy ([under-armour-context.md](under-armour-context.md)), kept as an open skill.
- **Mechanism.** Retrieval and guardrails for first drafts.
- **How hard to copy.** Static and copyable; any tool given the same file benefits. It ranks because it
  is cheap and lifts first-pass quality, not because it is defensible.
- **When.** Final MVP.
- **Sensitivity and governance.** Low; leave out internal code names that are confidential.
- **Measure.** Vocabulary misses flagged by reviewers; terms in Briefs that resolve to an entry.

### Distribution: serving confirmed context over MCP

Serving the records to other tools is the position play, and it serves UA even though it narrows
HyperDelivery's lead as a tool. Every sanctioned tool grounded in UA's confirmed decisions writes
better work, and HyperDelivery stays the place where records are made.

- **Context before the agent.** Start with a read-only server: confirmed facts, decisions, the term
  crosswalk, caveats and golden paths, each answer citing its record. Exposing the Inception agent
  itself (the alignment notes' idea) comes later, because it can start work and spend budget.
- **Narrow on purpose.** Serve only what HyperDelivery alone holds. A generic "UA context layer" over
  M365 and Atlassian would compete with Work IQ and the Teamwork Graph and lose.
- **The caller's permissions, enforced.** Under the caller's own identity (OBO), with authorization
  pre-filtering so a record a person cannot read never reaches their tool
  ([governance-collaboration.md A1](governance-collaboration.md)).
- **When.** Enterprise rollout (week 37 on), after per-user identity, Cedar policies and the Library.
  Registering it in GitHub's MCP allowlist and as a Copilot Studio connector under DLP policy are
  long-lead requests (section 10).
- **Measure.** Calls from other tools per week; share of those answers that cite a confirmed record;
  whether projects that start elsewhere still cite UA's decisions.

## 5. Literature, verified and dated

| Source | Date | What it says that matters here | Primary or secondary |
|---|---|---|---|
| Jaya Gupta and Ashu Garg, Foundation Capital, "AI's trillion-dollar opportunity: Context graphs" ([Substack copy](https://ashugarg.substack.com/p/ais-trillion-dollar-opportunity-context); [Foundation Capital](https://foundationcapital.com/context-graphs-ais-trillion-dollar-opportunity/)) | December 2025 (Substack copy dated 2025-12-26; the firm's page shows a 2026-10-26 metadata date, likely an update) | Decision traces record inputs, policy, exception, approver and state written; systems of record keep current state, not decision-time state; agent platforms sit in the execution path, where the reasoning can be recorded; proposes new systems of record for decisions, not only for objects | Primary (VC opinion; the firm invests in companies it cites) |
| Ashu Garg, in conversation with Jamin Ball (Altimeter) and Animesh Koratana (PlayerZero), "Why context graphs are the missing layer for AI" ([Substack](https://ashugarg.substack.com/p/why-context-graphs-are-the-missing)) | 2026-01-16 | Concedes systems of record still matter; capture will be mostly implicit; airs the semantic-layer bear case | Primary (opinion) |
| Jamin Ball, "Long Live Systems of Record" ([newsletter](https://cloudedjudgement.substack.com/p/clouded-judgement-121225-long-live)) | 2025-12-12 | Agents fail by pulling the wrong value from the wrong system; systems of record are being rewired, not replaced | Primary (opinion) |
| Jamin Ball, "Systems of Record Won the SaaS Era - Clearinghouses Will Win the Agents Era" ([newsletter](https://cloudedjudgement.substack.com/p/systems-of-record-won-the-saas-era)) | 2026-06-12 | The seat that governs which agent acts on what context holds the moat; its data is traces, evals and telemetry | Primary (opinion) |
| Kirk Marple, Graphlit, "The Context Layer AI Agents Actually Need" ([Graphlit](https://www.graphlit.com/blog/context-layer-ai-agents-need)) | 2025-12-24 | Decision traces need identity, ownership and entity relationships first, and open schemas | Primary (vendor blog) |
| Anthropic, "Effective context engineering for AI agents" ([Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)) | 2025-09-29 | Smallest high-signal context; just-in-time retrieval by reference; structured notes; a few canonical examples | Primary |
| Glean, Enterprise Graph ([product page](https://www.glean.com/enterprise-context/enterprise-graph); [press release](https://www.glean.com/press/glean-introduces-third-generation-ai-assistant-new-enterprise-graph-to-enable-the-superintelligent-enterprise)) | Launched at Glean:LIVE, 2025-09-25 ([Reworked](https://www.reworked.co/knowledge-findability/glean-thinks-its-ai-understands-your-company-better-than-you-do/), secondary); product page undated | Entities and signals inferred per tenant; personal graphs; the page does not claim to record decisions | Primary for features; date secondary |
| Palantir, Ontology system ([Architecture Center](https://www.palantir.com/docs/foundry/architecture-center/ontology-system/)) | Undated docs | Models decisions as data, logic, action and security; feedback gathered in workflows feeds learning loops | Primary |
| Akshay Krishnaswamy, "Connecting AI to Decisions with the Palantir Ontology" ([Palantir blog](https://blog.palantir.com/connecting-ai-to-decisions-with-the-palantir-ontology-c73f7b0a1a72)); "Connecting Agents to Decisions" ([Palantir blog](https://blog.palantir.com/connecting-agents-to-decisions-277dee8ddb40)) | 2024-01-04; 2026-04-28 | Decisions, not data, are what the ontology represents; the 2026 post extends this to human-agent decisions | Secondary (both returned 403; from search summaries) |
| Microsoft, Work IQ ([Learn, Copilot Studio](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/add-work-iq); [Learn, overview](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/)) and People Skills ([adoption page](https://adoption.microsoft.com/en-us/ai-agents/people-skills); [support](https://support.microsoft.com/en-us/people-skills/explore-what-you-can-do-with-your-skills)) | Work IQ announced at Ignite 2025 (November 2025); Copilot Studio page updated 2026-10-22; People Skills expansion listed 2026-03-02 | Memory of how people and teams work; GA in Copilot Studio; inferred skills for expert finding | Primary |
| Atlassian, Teamwork Graph opened to third-party AI tools ([Atlassian blog](https://www.atlassian.com/blog/company-news/teamwork-graph-team-26); [press release](https://www.nasdaq.com/press-release/atlassian-opens-its-teamwork-graph-power-agentic-work-across-enterprise-2026-05-06); [CLI changelog](https://developer.atlassian.com/cloud/twg-cli/changelog.md); [The New Stack](https://thenewstack.io/atlassian-teamwork-graph-agents/); [Futurum](https://futurumgroup.com/insights/atlassian-teamwork-graph-the-secret-weapon-thats-no-longer-a-secret/)) | 2026-05-06; CLI GA 2026-06-23 | Rovo MCP tools and CLI launched in open beta; the CLI is now GA; Atlassian's own benchmarks claim 44% more accurate results with 48% fewer tokens when responses are grounded in the graph | Primary (Atlassian blog and changelog); figures are vendor benchmarks |
| Martin Casado and Peter Lauten, a16z, "The Empty Promise of Data Moats" ([a16z](https://a16z.com/the-empty-promise-of-data-moats/)) | 2019-05-09 | Data network effects are rare; scale effects flatten; data goes stale; scarce, access-controlled sources and long-tail domain lessons built into the product are the exceptions | Primary |
| Epoch AI, "LLM inference price trends" ([Epoch AI](https://epoch.ai/data-insights/llm-inference-price-trends)) | 2025-03-12 | Price for fixed performance fell 9 to 900 times a year, depending on the threshold | Primary |
| Ge Gao and others, "Aligning LLM Agents by Learning Latent Preference from User Edits" ([Microsoft Research](https://www.microsoft.com/en-us/research/publication/aligning-llm-agents-by-learning-latent-preference-from-user-edits/)) | NeurIPS 2024 | CIPHER infers a preference from each user edit and retrieves the preferences from similar past contexts into the prompt, with no fine-tuning; edit distance as the cost | Primary |
| Cursor, "Bugbot now self-improves with learned rules" ([Cursor](https://cursor.com/blog/bugbot-learning)) | 2026-04-08 | Candidate rules from reactions, replies and reviewer comments, promoted or disabled automatically by signal; users can edit or delete rules afterwards | Primary (vendor figures) |
| Linux Foundation, Agentic AI Foundation ([press release](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)); Anthropic, donating Agent Skills ([Anthropic](https://www.anthropic.com/news/donating-agent-skills-to-the-agentic-ai-foundation)) | 2025-12-09; 2026-10-22 | MCP, AGENTS.md and goose under neutral governance from the start; Agent Skills donated to the same foundation | Primary |
| Bitol, ODCS v3.1.0 ([Bitol](https://bitol.io/bitol-announces-odcs-v3-1-0-stronger-smarter-and-stricter/)); Snowflake, OSI specification ([Snowflake](https://www.snowflake.com/en/blog/open-semantic-interchanges-specs-finalized/)) and its move to Apache ([Snowflake](https://www.snowflake.com/en/blog/apache-ossie-open-semantic-interchange-incubator/)) | December 2025; 2026-01-27; 2026-07-08 | Open formats for data contracts and for semantic definitions; OSI's first specification shipped under Apache 2, and the project entered the Apache Incubator as Apache Ossie | Primary |

The literature agrees on the diagnosis (the reasoning behind decisions is not stored anywhere useful)
and disagrees on who captures it. Foundation Capital bets on new agent platforms, Ball on whoever holds
the governance seat, and Microsoft, Atlassian and Glean on graphs built from activity. For UA, the
useful conclusion is that capture happens where the decision is made and signed, which for a
cross-functional idea is HyperDelivery, and that the graphs from activity will not hold rationale.

## 6. Moat versus lock-in: keep the advantage UA's

The plan's exit ramp keeps the golden paths, the confirmed context and the decision record. This
report proposes adding approval edits, handoff outcomes, the SME ledger and the golden cases to that
list, because those are what would make a replacement tool good on its first day. To keep all of them
UA's:

1. **A published schema for every record type.** The repo already models its domain in Pydantic under
   `core/domain/`, which produces JSON Schema; export is JSON Lines per record type. No proprietary
   embedding is the asset: indexes and knowledge bases are rebuildable caches.
2. **Promote to UA's systems of record, not to HyperDelivery.** HyperDelivery keeps the working record
   and the history; the canonical copy lives where UA already governs it.
3. **Provenance on every record:** the `SourceRef`, who, when, source version, whether it was
   AI-drafted or written by a person, scope, classification, last confirmed, review-by date, and what
   it supersedes. The W3C PROV model's entity, activity and agent split is a reasonable field
   checklist ([W3C PROV-O](https://www.w3.org/TR/prov-o/)).
4. **Test the exit at the scale decision:** export the records, give them to a second tool (for
   example Microsoft 365 Copilot over a SharePoint folder of the export, or Claude Code with the golden
   path skills), rerun a sample of golden intakes, and compare. If quality holds, the advantage
   belongs to UA. If it does not, the advantage was locked inside HyperDelivery.

| Record | Canonical home | Open format |
|---|---|---|
| Decision records | Confluence decision log for the project or space ([governance-collaboration.md R3](governance-collaboration.md)) | JSON per a published schema; rendered as MADR-style Markdown (MADR 4.0.0, [MADR](https://adr.github.io/madr/)) |
| Settled definitions | Snowflake semantic views and golden reports, through a steward | References to Snowflake objects; Apache Ossie, formerly OSI, where an interchange is needed ([Snowflake](https://www.snowflake.com/en/blog/apache-ossie-open-semantic-interchange-incubator/)) |
| Term crosswalk and disputes | HyperDelivery, proposed to a catalog if UA has one [confirm] | CSV or SKOS concepts with alternate labels ([W3C SKOS](https://www.w3.org/TR/skos-reference/)) |
| Data caveats and contracts | Data platform's contracts | ODCS v3.1 ([Bitol](https://bitol.io/bitol-announces-odcs-v3-1-0-stronger-smarter-and-stricter/)) |
| Golden paths and review rules | A UA repository | Agent Skills folders and `AGENTS.md` |
| Requirements and handoff | Jira, the repository, engineering's AI-DLC context files | Engineering's own formats, checked with its validator |
| Approval edits, SME ledger, handoff outcomes, redirects, golden cases | HyperDelivery, exported on demand | JSON Lines per a published schema |

## 7. Measures that would show each advantage is real

Two kinds of evidence. **Causal:** (1) ablation, rerunning the golden intakes with one asset removed
at a time, which extends the plan's ablation on model changes to context assets; (2) a parity test,
running a sample of the same intakes through a generic tool given the same documents, with SMEs
rating both results blind. **Trend lines,** each paired with a counter-measure so it cannot be gamed
alone:

| Measure | What it shows | Paired with | Baseline from |
|---|---|---|---|
| Citation coverage: share of plan statements citing a source or a confirmed record | Grounding | Citations a reviewer marks wrong | Pilot |
| Reuse rate: share of projects using at least one confirmed record from another project | Compounding | Reused records later superseded or challenged | Enterprise (the Library) |
| Edit distance at approval, per section, normalized | Drafts getting closer to what people sign | Change requests after approval; handoff rewrites | Pilot |
| First-pass acceptance at each approval | Fewer send-backs | Approvals made with evidence opened (plan target 90%) | Pilot |
| Handoffs taken into Construction without a rewrite | The package is right | Engineering's change size | Pilot readout |
| Questions answered from the ledger, against questions sent | SME time saved | Answers the requester rejected | Pilot |
| Dispute resolution time and reopen rate | Definitions settling | Metrics labeled "not yet agreed" at handoff | Pilot |
| Estimate error, forecast against actual business days | Calibration | Projects excluded from the comparison | Enterprise |
| Ablation delta per asset | The asset matters | Golden intakes refreshed each quarter | Enterprise |
| Parity delta against a generic tool | The advantage survives parity | SME rater agreement | Scale decision |
| Stale-record rate: cited records past their review date | Hygiene | Steward queue time | Enterprise |

What would falsify the claim: no ablation difference for the process-data assets by the scale
decision, or a generic tool given the exported records matching HyperDelivery. The second outcome is
not a failure for UA; it means the exit ramp works and the advantage is in the records.

## 8. How this serves the north star

- **Human-led to AI-assisted to AI-driven, one step at a time.** A step's default mode (for example,
  drafting requirements or binding metrics) changes only by a recorded human decision, when that
  step's evidence crosses an agreed bar: first-pass acceptance and edit distance over a minimum number
  of projects, and no high-severity send-backs. Each step's mode is then a decision record like any
  other. The full proposed criteria, the per-cell unit and the two signers (workspace admin and line
  owner) are in [autonomy-levels.md](autonomy-levels.md) section 5. AI-driven means the AI does the work and people make the decisions it surfaces; precedent
  makes those decisions faster, never optional.
- **Proactive Teams asks stay rare and well aimed.** Check the ledger and the Library first, route by
  who gave accepted answers, cap the cards per person, and record every answer so nobody is asked
  twice.
- **Meetings feed records, not a corpus.** When a recording, transcript or Copilot or Loop note
  arrives, what HyperDelivery keeps is the proposed decision, answer or term, confirmed by the person
  it is attributed to. The meeting mechanics and consents are out of scope here.

## 9. What to prepare now (Final MVP), without building ahead

Record the right things, in the right shape, from the first project. None of this is new
infrastructure; it is schema and capture in records the Final MVP already writes.

1. **Decision record schema:** add `options` with a `why_not` for each option not chosen,
   `precedent_refs`, `exception` (what was waived or accepted as uncertified, and by whom),
   `supersedes`, `scope` and `review_by` to the decision record the platform design already
   specifies. Today's `Decision` model records only the station, approved or not, the signer, a
   comment and the time.
2. **Keep every draft version.** Never overwrite an artifact submitted for approval; store the
   submitted hash beside the signed hash so the edit can be computed later. Offer an optional reason
   using the existing cause taxonomy.
3. **The SME ledger as a typed record** from the question cards that already exist: question, asked
   whom and why, answer, answered by, accepted or not, facts produced.
4. **Dispute records:** the meanings, the departments, the steward, the resolution and the certified
   object, instead of a free-text note.
5. **Handoff outcome fields** on the Construction decision: mode, reason, taken without a rewrite or
   sent back, cause, and a slot for engineering's change summary at 30 and 90 days (proposed).
6. **Redirect records** at intake: where the request went, why, and whether it came back.
7. **Provenance on everything:** `SourceRef`, AI-drafted or person-written, classification,
   last-confirmed and review-by dates, so staleness and feedback loops can be handled later without a
   backfill.
8. **A notice and a purpose statement** shown to pilot users: answers, edits and decisions are
   recorded, attributed, and used to improve UA's projects, never to evaluate individuals.
9. **Baselines** for edit distance, first-pass acceptance, questions sent per project and step times,
   from the first pilot round.
10. **The vocabulary and calendar pack** as one small skill file, and FSD references cited, not
    copied, per [fsd-corpus-index.md](fsd-corpus-index.md).

Not in the Final MVP: an org-wide knowledge graph, the cross-project Library (Enterprise, as planned),
an MCP server, an expertise or routing graph, learned-rule promotion, automatic meeting ingestion, and
any fine-tuning.

## 10. Long-lead requests

| Request | Owning team | Why | Needed by phase |
|---|---|---|---|
| Agreement to record handoff outcomes (taken, sent back, cause) and to share a change summary after Construction | Receiving engineering leads; owners of `jira-to-pr` in the AI marketplace | Rank 4 needs what only engineering sees | Final MVP pilot (week 15) for outcomes; Enterprise for change summaries |
| Privacy and HR review, including EMEA works councils and a DPIA, of decision records, approval edits, the SME ledger and any expertise routing | Legal and Privacy; HR; EMEA works council | Records attribute statements and edits to named teammates; routing infers expertise | Notice before the pilot (week 15); DPIA before cross-project reuse (Enterprise) |
| A retention schedule and Purview label mapping for decision records, ledgers and edits | Records management; Legal | They are business records and start accumulating with the first project | Final MVP, before the pilot |
| Read access to the approved FSD corpus with approval status | FSD owners [confirm]; EDMA | See [fsd-corpus-index.md](fsd-corpus-index.md) | Final MVP |
| A list of certified semantic views and golden reports with owners, and a steward per domain | Data platform; data governance | The crosswalk and dispute routing need named stewards | Final MVP (friendly users, week 8) |
| Where data-quality incidents and known caveats live today, and read access | Data platform; data observability owners [confirm] | Rank 8 | Enterprise (week 23) |
| Read scope over past Jira and Confluence delivery history, including created and resolved times | Atlassian admins; EDMA leads | Precedent and estimation calibration | Enterprise (week 23) |
| InfoSec and architecture review outcomes as finding categories | InfoSec; enterprise architecture | Rank 7 rules | Enterprise hardening (weeks 23 to 36) |
| An owner for canonical org context and a steward time budget | Sponsor; data governance lead | Without owners, confirmed context goes stale | Before Enterprise |
| A read-only HyperDelivery context MCP server in GitHub's MCP allowlist, a Copilot Studio connector under DLP policy, and the AI marketplace configuration for Factory and Claude Code | GitHub enterprise admins; Power Platform and Microsoft 365 admins; engineering tooling owners | Distribution over MCP | Enterprise rollout (week 37 on) |
| Teams recording, transcript and meeting-insight consents | Teams admins; Legal | Raw input for decisions and answers ([critique.md](critique.md) insight 7) | Enterprise |
| Post-launch usage data for tools built through Construction | Operations and platform teams that run them | Candidate 29: did the delivered tool get used | Beyond Enterprise |

## 11. Risks

| Risk | How it shows up | Mitigation |
|---|---|---|
| Wrong context compounds | A wrong confirmed fact is reused by ten projects | Review-by dates; supersedes links; a "challenge" action on every record; track which projects cited a record so a correction reaches them; only stewards make records org-scope |
| AI text returns as human-confirmed | A draft approved with little reading becomes a precedent | Mark AI-drafted versus person-written; weight person-written and edited records higher; sample audits |
| Gaming the measures | Approvers sign without reading to keep edit distance low; SMEs answer quickly and badly | Pair every measure (section 7); evidence-opened rate; answers the requester rejected |
| Profiling teammates | The who-answered-what view reads as a performance record | Routing only; no rankings; opt-out; people see and correct their entries; DPIA; aggregated reporting |
| Survivorship bias in the FSD corpus | Approved is taken to mean good | Link FSDs to outcomes; weight by what shipped and was used |
| Legacy formats come back | The FSD template becomes the Brief again | Use the corpus for content and checklists, not structure |
| A second system of record | HyperDelivery's crosswalk drifts from Snowflake's definitions | Snowflake stays canonical; HyperDelivery stores references and history; steward-approved promotion only |
| A wider attack surface | An MCP server exposes records to more tools | Read-only; caller's identity; authorization pre-filtering; Enterprise only |
| Nobody owns curation | Records pile up unconfirmed and stale | A named owner and steward budget (long-lead); a stale-record rate on the sponsor digest |
| Too little data to prove anything | Tens of projects by the scale decision | Ablation on golden intakes and blind SME ratings instead of statistics |
| The vendor seat moves | UA adopts a vendor tool under the exit ramp | Open formats and the exit test (section 6) |

## 12. Open questions

1. Who owns canonical org context (EDM, data governance or the platform team), and how many steward
   hours a month are budgeted?
2. Will engineering report handoff outcomes, and share what it changed, for every handoff or only by
   agreement per team?
3. How long are decision records, ledgers and edit histories kept, and does a source's Purview label
   bind the copy HyperDelivery holds?
4. Can decisions and SME answers be shown across departments, and at which classification does that
   stop?
5. Does UA run a data catalog (Atlan, Collibra, Alation or another) that should hold the crosswalk
   [confirm]?
6. Where do known data caveats and data-quality incidents live today [confirm]?
7. Are Jira created and resolved times reliable enough for estimation across past EDMA work?
8. Which tools may call a HyperDelivery context server, under whose identity, and who approves the
   connector in Copilot Studio and GitHub?
9. What bar should move a step from AI-assisted to AI-driven, and who signs that decision?
   ([autonomy-levels.md](autonomy-levels.md) section 5 proposes both; the numbers are set from pilot
   data.)
10. Is preference tuning on UA edit data ever acceptable, given that models change faster than such a
    corpus grows?

## 13. Not verified, or could not access

- **Foundation Capital's publication date** on its own site: the page metadata shows 2026-10-26, which
  looks like a later update; the Substack copy is dated 2025-12-26. The follow-up's date comes from its
  Substack copy (2026-01-16).
- **Palantir's two blog posts** returned 403; their dates and claims come from search summaries. The
  Architecture Center page was read directly.
- **Atlassian's press release** on Nasdaq timed out; Atlassian's own blog post was read instead. The
  44% accuracy and 48% token figures are Atlassian's internal benchmarks, with no published method.
- **The Teamwork Graph MCP tools' release stage:** Atlassian's tool list no longer labels them beta,
  but no GA announcement for them was found, so their GA status is not verified.
- **Glean's launch date** comes from secondary coverage; the press release page shows no date.
- **Microsoft's Skills agent** retirement in March 2026 comes from a third-party blog; People Skills
  itself is on Microsoft's adoption and support pages. Searching people by skill in SharePoint search
  appears only in secondary summaries of a Microsoft communications template and is not verified.
- **The Agent Skills standard's exact release day:** Anthropic says it published the standard in
  December 2025; secondary coverage dates it 2025-12-18.
- **GitHub's MCP allowlist** is documented for the Copilot app, CLI and VS Code; whether it covers the
  Copilot cloud agent was not confirmed.
- **Model price figures** are Epoch AI's 2025 analysis and were not re-checked for 2026; secondary
  2026 coverage claims steeper declines.
- **Bugbot's resolution rates** are Cursor's own figures; the post does not say whether a human
  approves a rule before it goes active.
- **UA facts marked [confirm]:** a data catalog, where caveats and incidents live, the FSD store and
  its approval metadata, Jira history quality, product hierarchy levels and owners, and the planning
  calendar beyond the fiscal year and FW and SS season codes.

## Sources

All retrieved 2026-10-27.

- a16z, The Empty Promise of Data Moats: https://a16z.com/the-empty-promise-of-data-moats/
- Agent Skills: https://agentskills.io/
- Anthropic, Donating Agent Skills to the Agentic AI Foundation: https://www.anthropic.com/news/donating-agent-skills-to-the-agentic-ai-foundation
- Anthropic, Effective context engineering for AI agents: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Atlassian, Rovo MCP server supported tools: https://support.atlassian.com/atlassian-ai-gateway/docs/supported-tools/
- Atlassian, Teamwork Graph at Team '26: https://www.atlassian.com/blog/company-news/teamwork-graph-team-26
- Atlassian, Teamwork Graph CLI changelog: https://developer.atlassian.com/cloud/twg-cli/changelog.md
- Atlassian press release (via Nasdaq; timed out): https://www.nasdaq.com/press-release/atlassian-opens-its-teamwork-graph-power-agentic-work-across-enterprise-2026-05-06
- Bitol, ODCS v3.1.0: https://bitol.io/bitol-announces-odcs-v3-1-0-stronger-smarter-and-stricter/
- Cursor, Bugbot learned rules: https://cursor.com/blog/bugbot-learning
- Epoch AI, LLM inference price trends: https://epoch.ai/data-insights/llm-inference-price-trends
- Factory, MCP in the Droid CLI: https://docs.factory.com/cli/configuration/mcp
- Foundation Capital, context graphs (firm page): https://foundationcapital.com/context-graphs-ais-trillion-dollar-opportunity/
- Foundation Capital, context graphs (Substack copy): https://ashugarg.substack.com/p/ais-trillion-dollar-opportunity-context
- Foundation Capital follow-up (Substack): https://ashugarg.substack.com/p/why-context-graphs-are-the-missing
- Futurum on the Teamwork Graph (secondary): https://futurumgroup.com/insights/atlassian-teamwork-graph-the-secret-weapon-thats-no-longer-a-secret/
- Gao and others, learning from user edits: https://www.microsoft.com/en-us/research/publication/aligning-llm-agents-by-learning-latent-preference-from-user-edits/
- GitHub changelog, MCP allowlists in enterprise managed settings: https://github.blog/changelog/2026-08-06-mcp-allowlists-in-enterprise-managed-settings
- Glean, Enterprise Graph: https://www.glean.com/enterprise-context/enterprise-graph
- Glean press release: https://www.glean.com/press/glean-introduces-third-generation-ai-assistant-new-enterprise-graph-to-enable-the-superintelligent-enterprise
- Graphlit, The Context Layer AI Agents Actually Need: https://www.graphlit.com/blog/context-layer-ai-agents-need
- Jamin Ball, Long Live Systems of Record: https://cloudedjudgement.substack.com/p/clouded-judgement-121225-long-live
- Jamin Ball, Clearinghouses Will Win the Agents Era: https://cloudedjudgement.substack.com/p/systems-of-record-won-the-saas-era
- Linux Foundation, Agentic AI Foundation: https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation
- MADR: https://adr.github.io/madr/
- Microsoft, MCP GA in Copilot Studio: https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/model-context-protocol-mcp-is-now-generally-available-in-microsoft-copilot-studio
- Microsoft, People Skills: https://adoption.microsoft.com/en-us/ai-agents/people-skills
- Microsoft, People Skills support article: https://support.microsoft.com/en-us/people-skills/explore-what-you-can-do-with-your-skills
- Microsoft, Work IQ in Copilot Studio: https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/add-work-iq
- Microsoft, Work IQ overview: https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/
- Palantir, Ontology system: https://www.palantir.com/docs/foundry/architecture-center/ontology-system/
- Palantir blog (secondary, 403): https://blog.palantir.com/connecting-ai-to-decisions-with-the-palantir-ontology-c73f7b0a1a72 and https://blog.palantir.com/connecting-agents-to-decisions-277dee8ddb40
- Reworked on Glean (secondary): https://www.reworked.co/knowledge-findability/glean-thinks-its-ai-understands-your-company-better-than-you-do/
- Snowflake, Apache Ossie (formerly OSI) enters the Apache Incubator: https://www.snowflake.com/en/blog/apache-ossie-open-semantic-interchange-incubator/
- Snowflake, OSI specification: https://www.snowflake.com/en/blog/open-semantic-interchanges-specs-finalized/
- The New Stack on the Teamwork Graph (secondary): https://thenewstack.io/atlassian-teamwork-graph-agents/
- W3C PROV-O: https://www.w3.org/TR/prov-o/
- W3C SKOS: https://www.w3.org/TR/skos-reference/
