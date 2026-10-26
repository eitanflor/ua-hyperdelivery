<!-- Point-in-time research, retrieved 2026-10-25 for the UA-DLC plan (round 4: factory sources). Claims carry source links; vendor features and dates change quickly, so verify before acting. Items marked (via Firecrawl) were not re-read at their primary source. See README.md in this folder. -->
<!-- cspell:words Agentation Airbnb Cortana Fathima Hiba Kiran MTTR Tobi Uday antipattern architecting automations papercuts withastro Einy Faire Fawkes Firebrain Firecrawl Fleetshift Flue GitClear Honk Kimi Lütke Mastra Medisetty METR Minion Mitchem Morrow Dugald Pareto Rauch Rovo Stenberg Toolshed Toub Zohar dedupe fxtwitter moonshotai pkg subagent subagents tldraw triagebot uReview -->

# Factory sources, round 4: Firecrawl, Cloudflare, Atlassian, Uber and two factory definitions

> Stage numbers here predate the three-phase plan (2026-10-26): Stages 1 to 3 are now the Final MVP and its pilot; Stages 4 and 5 are Enterprise.

Research key: `factory-sources-round4`. Date: 2026-10-25. Builds on
[software-factories.md](software-factories.md) and [ua-dlc-reconcile.md](ua-dlc-reconcile.md), and
checks every finding against [enterprise-plan.md](../enterprise-plan.md),
[operating-model.md](../operating-model.md) and
[platform-architecture.md](../platform-architecture.md). It reports only what is new or sharpens a
decision; section 1 lists what was filtered out because the plan already has it.

## Bottom line

1. **Nothing here argues for removing an approval.** All four write-ups describe the shape the plan
   already has: gates built before the fleet, deterministic checks first, bounded loops, a person at
   the merge. What they add is mechanisms around the gates, and numbers to size them.
2. **Review capacity is the constraint wherever there is data.** On `dotnet/runtime`, two people
   wrote 36% of all human feedback on 878 agent pull requests
   ([Toub](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/)). UA's
   scarce reviewers are business owners, data owners, stewards and the engineering rotation.
   Measure how concentrated their load is, and sequence what we ask of them.
3. **Add a scope check on every build unit, and measure the gap between "checks pass" and "a
   person accepts".** Spotify's judge vetoes about a quarter of agent sessions, and half of those
   recover ([Spotify](https://engineering.atspotify.com/2025/12/feedback-loops-background-coding-agents-part-3)).
   About half of the PRs that passed SWE-bench's grader would not have been merged by maintainers
   ([METR](https://metr.org/notes/2026-03-10-many-swe-bench-passing-prs-would-not-be-merged-into-main/)).
4. **Cost needs the Uber treatment before the deck.** Uber decomposes spend into six multiplying
   terms, gives each managed agent a cost per unit of work plus a quality signal, picks models on a
   cost-quality frontier, and defaults subagents to cheaper models. It grew weekly users 7x while
   unit costs fell ([Uber](https://www.uber.com/us/en/blog/efficient-software-factory/)).
5. **Two org patterns deserve a decision.** First, work in the open by default: Shopify's River
   refuses direct messages, and the searchable corpus is the asset that compounds
   ([Shopify](https://shopify.engineering/under-the-river)). Second, treat every agent failure as
   debt in the factory, to be fixed in the golden path, skill, docs or tests rather than in the
   output ([Cloudflare](https://blog.cloudflare.com/astro-issue-triage),
   [Atlassian](https://www.atlassian.com/blog/ai-at-work/building-your-ai-work-factory)).
6. **Triage and routing get three concrete fixes.** The duplicate check must say "couldn't check"
   instead of "none found" ([Firecrawl](https://www.firecrawl.dev/blog/ai-software-factory)). The
   Fix path should reproduce the problem and judge "bug or intended" in a fresh context before
   anything is fixed, and the reporter should verify a preview (Astro went from more than 200 open
   issues to about 30). Recurring write-ups should be routed to a shared skill, not built as an app.
7. **The two X posts are alignment, not evidence.** Both define a factory as one shared, owned
   definition of the agent setup ([Einy](https://x.com/ZoharEiny/status/2112480184595063070),
   [Holmes](https://x.com/BHolmesDev/status/2110406463059636235)). The plan has most of it. The
   missing piece is a registry of every specialist, skill, golden path and connector, each with an
   owner.

## 1. Already in the plan (filtered out)

These appear in the sources but the plan already decides them, so no nugget is raised:

- Dedupe at Intake and joining existing work as "one more voice" (operating-model.md section 1).
- At most two CI rounds and three review rounds, then escalation in plain language
  (platform-architecture.md section 2), which matches Stripe's cap as reported by Firecrawl.
- Deterministic checks first; LLM reviewers add to them; new reviewers start in shadow mode; a
  verifier behind the code-review finders; the builder never grades itself (platform-architecture.md
  section 2).
- Three separate human decisions. Mastra's queue acceptance, plan approval and merge
  ([Mastra Factory](https://factory.mastra.ai/), via Firecrawl) map onto Intake triage plus
  approvals 2 and 3.
- Cost per accepted outcome as the headline, a budget on every delegation, per-project cost from
  Stage 1 (platform-architecture.md section 13).
- Model-quality evaluations per specialist before a model change ships, golden intakes, and every
  escaped defect becoming a case (platform-architecture.md section 14).
- Approvals bound to the prompt and model versions (platform-architecture.md section 4).
- A durable session log separate from disposable sandboxes (Step Functions, DynamoDB and the
  decision record), which is the brain, hands and session split Firecrawl and
  [Shopify](https://shopify.engineering/under-the-river) borrow from Anthropic.
- Critical dependency patches rebuilt from the golden-path base within 7 days
  (platform-architecture.md section 10).

## 2. Per source

### 2.1 Firecrawl: "How to Build an AI Software Factory" (Hiba Fathima, Sep 11, 2026)

[Source](https://www.firecrawl.dev/blog/ai-software-factory). This is a vendor blog post by
Firecrawl's growth marketing lead, and it ends with a pitch for Firecrawl's developer index. Its
value is that it compiles the published factory write-ups in one place. I re-read the primary
source for every number used in a nugget (Toub, Spotify, Faire, Shopify, Lütke, METR). Claims
marked (via Firecrawl) were not re-read.

**What it says**

- A factory is five stages, each with a gate: intake, isolation, tools, verification and the merge
  gate. The coding agent is the cheapest part, and every company that made it work built the
  gates before the fleet. Spotify's Fleetshift shipped two years before Spotify had an agent to put
  in it (via Firecrawl).
- **Review is the bottleneck.** On `dotnet/runtime`, 878 agent PRs drew review from 284 people,
  but the top 10 wrote 61% of the comments and the top two wrote 36% of all human feedback. The
  median agent PR needed 43% more review comments than a human PR (10 against 7)
  ([Toub](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/)).
- **Size and preparation decide success.** Agent PRs of 1 to 50 changed lines succeeded 76 to 80%
  of the time, falling to 64% at 101 to 500 lines and 54.5% for performance work. Toub's summary
  is that the agent is excellent at well-specified changes and relatively poor at architecting.
  Adding instructions, firewall rules for package feeds and setup steps moved success from 38.1%
  before the changes to 69% after, which he credits to preparation rather than better models
  ([Toub](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/)).
- **Agent PRs merge less often, and human touch helps.** Agent PRs succeeded 67.9% of the time
  against 87.1% for Microsoft engineers. PRs that received human commits succeeded 86.2% of the
  time, fully autonomous ones 55.1%. Revert rates were similar: 0.6% against 0.8%
  ([Toub](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/)).
- **Nested verification, cheapest first.** Spotify runs deterministic verifiers, then an LLM judge
  that compares the diff with the original prompt, then CI. The judge vetoes about a quarter of
  sessions, and the agent course-corrects half the time. The most common trigger is the agent
  going outside its instructions, for example refactoring or disabling flaky tests. Spotify ranks
  failures: no PR is an annoyance, a PR that fails CI is a burden, and a PR that passes CI but is
  wrong erodes trust in the whole system
  ([Spotify](https://engineering.atspotify.com/2025/12/feedback-loops-background-coding-agents-part-3)).
- **The confidence-score trap.** Faire filtered its AI reviewer's comments on the model's own
  confidence score. At the strictest setting that discarded 65% of comments and moved acceptance by
  3%. What lifted acceptance to 73% was better context about the change, better targeting, and
  model-graded gates instead of a fixed threshold
  ([Faire](https://craft.faire.com/spec-review-ship-how-ai-is-changing-the-way-faire-builds-software-79f475b60908)).
  Faire also found that flaky runs are worse than no runs and that false positives kill trust.
  Uber's uReview covers more than 90% of about 65,000 weekly diffs, and 65% of its comments are
  addressed, against 51% for human reviewers ([uReview](https://uber.com/blog/ureview), via
  Firecrawl).
- **Review sequencing.** Faire requires two reviews on agent-authored PRs (the assignee plus
  another person), does not request code-owner review until the PR has one review, and marks a PR
  ready only when the agent requests review
  ([Faire](https://craft.faire.com/swarm-coding-agentic-development-with-multiple-background-agents-3549adc7460d)).
- **Merge tiers by blast radius**, from auto-merge for mechanical changes to a named domain owner
  for auth, payments and data deletion. The Linux kernel's 2026 policy bars agents from adding
  `Signed-off-by:` and asks for an `Assisted-by: AGENT_NAME:MODEL_VERSION` trailer instead (via
  Firecrawl). OpenAI's Codex team lets agents merge their own PRs, but on a greenfield codebase
  with no external users ([harness engineering](https://openai.com/index/harness-engineering/), via
  Firecrawl).
- **Work in the open.** River, Shopify's agent, works only in public Slack channels and declines
  direct messages, so every conversation is searchable and anyone can join
  ([Lütke](https://x.com/tobi/status/2053121182044451016),
  [Shopify](https://shopify.engineering/under-the-river)). In one 30-day window there were 59,918
  River sessions in 5,170 channels and 3,536 River-coauthored PRs merged. Shopify's lesson is that
  a private agent is capped by the person at the keyboard, while a public one teaches every later
  session.
- **The dedupe gate fails open.** A search that returns nothing because the source is not indexed
  looks the same as one that returns nothing because there is no duplicate. Firecrawl's advice is
  to treat "not indexed" as unknown and route it to a person.
- **What the numbers say.** About half of the agent PRs that passed SWE-bench's grader would not
  have been merged by maintainers, a gap of about 24 points that did not shrink across model
  generations
  ([METR](https://metr.org/notes/2026-03-10-many-swe-bench-passing-prs-would-not-be-merged-into-main/)).
  DORA 2025 found AI raises throughput and instability together, and calls AI an amplifier
  ([DORA](https://dora.dev/dora-report-2025/), via Firecrawl). DORA's 2026 ROI model shows about
  39% first-year return and an eight-month payback, but only after a J-curve dip, partly from a
  "verification tax"; gains run 35 to 40% on simple tasks and often under 10% on legacy code
  ([InfoQ](https://www.infoq.com/news/2026/05/dora-roi-ai-assisted-dev-report/), via Firecrawl).
  GitClear found duplicated blocks up eightfold in 2024
  ([GitClear](https://www.gitclear.com/ai_assistant_code_quality_2025_research), via Firecrawl).
  The proven workload so far is mechanical change at scale (Airbnb, Spotify and Amazon
  migrations); Firecrawl found no comparable published results for greenfield product work.
- **Evidence on the PR.** A visual-verify skill reads the diff, captures the affected pages at
  1280 px and 375 px before and after, and attaches them. Since `gh` v2.99.0 (Sep 1, 2026),
  `--attach` puts images on PRs and issues without a person dragging files. It is not supported on
  GitHub Enterprise Server ([GitHub changelog](https://github.blog/changelog/2026-09-01-github-cli-media-in-issues-pull-requests-and-comments/),
  via Firecrawl). `gh skill install` (preview) distributes pinned skill versions so agents do not
  drift.
- **Framing.** Guillermo Rauch argues that a software company's moat shifts from the code it wrote
  to the means of producing it ([Rauch](https://x.com/rauchg/status/2043869656931529034), via
  Firecrawl). OpenAI keeps a roughly 100-line `AGENTS.md` as a map for about a million lines of
  code (via Firecrawl).

**What UA-DLC should take:** the scope check (nugget 7), the gap metric (9), reviewer
concentration and sequencing (12, 13), no confidence thresholds (8), small units and instructions
first (5), rework in the calendar (6), work in the open (2), a duplicate check that reports what it
searched (1), the J-curve (25), the greenfield caveat (26), evidence on the PR (10) and the
attribution trailer (11).

### 2.2 Cloudflare: "Astro issue triage" (Matthew Phillips, Aug 4, 2026)

[Source](https://blog.cloudflare.com/astro-issue-triage).

**What it says**

- After several months of automated triage, Astro's open issues fell from over 200 to about 30,
  with zero expected within a month. That would be the first time in the repository's five-year
  history. There was no "issue bankruptcy" and no auto-closing.
- It started as an agent skill that maintainers ran in their own harness. The same skill then ran
  in GitHub Actions, so the workflow was reused exactly.
- The skill mirrors manual triage: **reproduce** from the reporter's repository, **diagnose** with
  instrumentation, **verify** whether the behavior is a genuine bug or intended (against tests,
  comments and docs), then **fix** by turning the reproduction into failing unit tests. Each phase
  is an isolated subagent that hands a `report.md` forward. The isolation exists to counter the
  model's bias toward forcing a fix when there may be no bug.
- The pipeline is a state machine driven by issue labels ("triage needed" through "fix verified").
  It holds no state of its own and reads the issue's comments to work out what happens next. It
  posts its findings, full logs and install instructions for a preview release
  ([pkg.pr.new](http://pkg.pr.new/)). If the original reporter confirms the preview works, the
  automation opens a PR linked to the issue.
- Reasoning is kept separate from permitted actions. The reference action takes a read token and a
  write token, and the triage model and the verification model are separate settings
  ([triagebot-action](https://github.com/withastro/triagebot-action)).
- When the agent cannot find a correct fix, the team treats it as a sign of opaque abstractions,
  missing documentation or missing tests. In one case the bot kept editing a single condition and
  causing regressions; once a maintainer added a comment explaining the logic, it stopped.
- The logic moved out of the Astro monorepo into a standalone, tested repository, because changing
  it in place felt like surgery on live infrastructure. Other teams now use or fork it. The engine
  became [Flue](https://flueframework.com/), a platform-agnostic framework for durable agents.
- Maintainers report talking to users more, in more useful places (Discord, RFCs), not less.

**What UA-DLC should take:** isolated reproduce and verify phases, with the reporter confirming a
preview, on the Fix and "Report a problem" paths (nugget 4). Failure as factory debt (14). Skills
as tested, versioned packages that run the same locally and hosted (17). Flue is one to watch, not
adopt; the plan's Strands and Step Functions choice stands.

### 2.3 Atlassian: "Building your AI work factory" (Dugald Morrow, Aug 21, 2026)

[Source](https://www.atlassian.com/blog/ai-at-work/building-your-ai-work-factory).

**What it says**

- A work factory is a structured workspace holding everything an agent needs for one category of
  knowledge work. People set the strategy (frameworks, standards, judgment) and the AI executes.
- It has three layers. The **data layer** queries only the systems this job needs, through MCP;
  narrow scope is presented as a feature that cuts noise and confabulation. The **knowledge
  layer** holds research notes, evergreen context and append-only run logs, which the agent can
  also write. The **skills layer** holds playbooks. Frameworks (scoring rubrics), templates (output
  formats) and workflows live in separate folders, so the format can change without touching skill
  logic.
- Ad hoc skills plus MCP lack two things a factory adds: intentional scoping and a feedback loop.
  Use one factory per recurring job type; a single catch-all workspace with many skills and broad
  data access degrades output.
- Worked example: assessing a sales opportunity against a scoring framework and writing a weekly
  pipeline report. The skill says to mark missing data "unknown" rather than invent it.
- Recurring work (weekly reports, monthly reviews) suits factories best. Start with a manual
  trigger and automate once the output only needs light review.
- **Improve the factory, not the output.** Fixing an artifact by hand is an antipattern, because
  the factory does not learn. Making the same edit repeatedly is the signal to update the skill,
  framework or template.
- Writing the expertise down makes it onboarding material and a shared quality standard.

**What UA-DLC should take:** the repeat-edit signal (nugget 15), workspace packs with separate
skills, frameworks and templates (16), and a routing row for recurring write-ups (3).

### 2.4 Uber: "Running a Software Factory Efficiently at Uber Scale" (Uday Kiran Medisetty, Aug 27, 2026)

[Source](https://www.uber.com/us/en/blog/efficient-software-factory/). This is the primary
account; the earlier research cited a secondary summary (see section 4).

**What it says**

- **Scale.** More than 70% of PRs are attributed to agents. Engineers have built more than 3,600
  agent skills, which run more than 30,000 times a day. A growing share of sessions are started by
  managed agents rather than people: code review, self-healing CI, end-to-end PRs with visual
  validation, on-call triage, bug debugging and maintenance.
- **Cost under growth.** From February to August 2026, weekly active users across engineers and
  non-engineers grew 7x and weekly agent requests 9.4x, while total spend has been roughly flat
  since April. With the model held fixed, cost per 1,000 requests fell about 34% from its peak and
  cost per session fell 52% from its June peak.
- **Four layers** (the post's Figure 3), from most to least controlled:
  - Specialized agents, each with its own unit cost. Minion turns intent into a PR (cost per merged
    PR), uReview reviews code (cost per review), Agentic XP writes experiment readouts, Conan AI
    turns an alert into a root-cause analysis (cost per alert), and Fawkes runs scheduled
    maintenance (cost per cleanup). Each pairs the narrowest task with a real benchmark and the
    cost-quality-optimal model, so "every dollar maps to a unit of work".
  - A general hosted agent, Cortana (cost per query).
  - Laptop sessions using the shared skills (cost per session).
  - Raw Claude Code, Codex or OpenCode sessions (cost per session).
- **The cost equation.** Spend = users × sessions per user × turns per session × requests per turn
  × tokens per request × price per token. The first two terms are adoption to grow; the middle
  three are where optimization effort goes.
- **What is measured, weekly and monthly.** Portfolio cost and users. Unit economics per tool,
  including the cache hit rate and cost per active session hour. Model economics. A driver
  decomposition into adoption, engagement, input workload and output workload, with no
  unexplained residual. For each managed agent, its outcome cost, a quality signal (revert rate,
  F1 or MTTR) and its volume, tracked through model migrations.
- **Model choice.** Build a benchmark from the agent's real work, run it on a harness that can
  serve any model, then move to whichever is Pareto-optimal and keep moving, because the frontier
  shifts every few weeks. uReview's benchmark uses real PRs with known bugs, graded easy, medium
  and hard, and scores precision, recall, F1, cost per review, latency, timeouts and noise.
- **Defaults.** Defaulting subagents to a cheaper model is the most impactful default, because
  they run well-defined tasks while the main model plans and evaluates. Compaction triggers at
  400K tokens even on 1M-context models. Reasoning effort defaults to Medium.
- **Prompt caching.** Cache reads cost 0.1x of input. Writes cost 1.25x for a 5-minute entry and 2x
  for a 1-hour entry. Uber moved interactive sessions to the 1-hour TTL because idle gaps kept
  invalidating the cache; subagents stay at 5 minutes.
- **Tool schemas.** All MCP traffic goes through one gateway covering more than 1,000 servers.
  Preloading 100+ tools added roughly 50K to 70K tokens to every turn. One vendor's workspace suite
  ships 49 tools (about 22K tokens of schema), and messaging and project-tracking vendors ship 34
  and 46. The fixes are tool search and resolving tools through a CLI at call time. "Code-mode"
  runs chatty sequences such as SQL polling in a script, cutting tokens by 55 to 71% even for tiny
  result sets and by more than 90% on bulk loops.
- **Grounding.** An AI context graph (24M nodes, 80M edges, data from more than 30 systems,
  including historical table-usage queries) let an agent find the table more than 50 analysts use
  and answer correctly in 38 seconds. The same prompt without the graph took 20 minutes, spawned
  two subagents, hit three errors and wrongly concluded the data could not be queried.
- **Visibility, not caps.** A live cost counter in the harness status line. One shared spend tier
  across interactive tools, with separate tiers for managed agents. Slack nudges at 50, 80 and 100%
  of expected spend, quick manager approval to move up a tier, and a session analyzer that flags 16
  anti-patterns with their cost and a fix.
- **Next.** Dynamic model routing, and generating skill updates automatically from "papercuts"
  recorded in traces.
- **Conclusion.** Moving work from interactive sessions to managed agents gives control over
  routing, harness and spend. Optimizing a fleet of specialized, benchmarked agents is cheaper and
  more scalable than optimizing thousands of individual sessions.

**What UA-DLC should take:** the six-term run-rate (nugget 18), outcome cost per specialist (19),
Pareto model choice and cheaper defaults (20), context economics (21), nudges over caps (22),
usage-grounded data discovery (23), the maintenance agent (24) and the "managed beats ad hoc"
argument (26).

### 2.5 Zohar Einy (CEO, Port): what a software factory is (X, Oct 20, 2026)

[Post](https://x.com/ZoharEiny/status/2112480184595063070), read through
[fxtwitter](https://api.fxtwitter.com/ZoharEiny/status/2112480184595063070). Today every engineer
runs their own prompts, skills, agents and idea of what an agent may do. A factory pulls that into
one place the team shares, and makes the team settle seven things: context, governance,
orchestration (what stays deterministic, how hand-offs and retries work), human-in-the-loop, an
AI registry (which agents, skills, plugins and MCP servers exist, and who owns them), metrics, and
safe integrations. Port sells a factory platform, so read this as a vendor's framing.

**Alignment for UA-DLC:** the plan answers six of the seven. The AI registry with owners is the
gap (nugget 17).

### 2.6 Ben Holmes (Warp): factory engineering (X, Oct 14, 2026)

[Post](https://x.com/BHolmesDev/status/2110406463059636235), read through
[fxtwitter](https://api.fxtwitter.com/BHolmesDev/status/2110406463059636235). A factory centralizes
the team's agents into one definition: one source of truth for automations, repository access,
secret access, sandbox environments and model selection. Loops and automations come second, once
everything is unified into an always-on system. The team agrees on the agent setup the way it
agrees on CI and lint rules, and the engineer's job becomes making the agents better ("factory
engineering"). Holmes works at Warp, which sells agent tooling.

**Alignment for UA-DLC:** HyperDelivery is that single definition for UA's business-side factory.
The platform team's job can be described in these terms (nugget 27).

## 3. Nuggets

Priority is my judgment of value against effort. "Stage" follows the plan's roadmap.

| # | Nugget | Source | Applies to | Recommendation |
|---|---|---|---|---|
| 1 | A duplicate check that finds nothing is ambiguous: "no match" and "no coverage" look the same, so the gate fails open | [Firecrawl](https://www.firecrawl.dev/blog/ai-software-factory) | operating-model.md section 1 (Where a project starts; 1.1 Intake); platform-architecture.md section 11 (Starting from a Jira ticket) | **High, Stage 1.** Duplicate and Library checks return three states: match found; nothing found in a named list of Jira projects and running projects; or couldn't check (not allowlisted, no access, delegate error). The triage card lists what was searched, and "couldn't check" never displays as "no duplicates". |
| 2 | Shopify's agent works only in public channels; the searchable corpus is what compounds, and a private agent is capped by one person | [Shopify](https://shopify.engineering/under-the-river); [Lütke](https://x.com/tobi/status/2053121182044451016) | platform-architecture.md section 5 (Workspaces and tenancy); enterprise-plan.md section 5 (organizational memory); operating-model.md section 7 | **High, decide before Stage 2.** Make each project's Brief, decisions and status discoverable to its workspace by default, so others can find it, comment and join as "one more voice". Sources, data and previews stay membership-gated per the tier contract. A private project is an explicit, logged choice, and the default for People and Finance. Check with Privacy and the works council for EMEA. |
| 3 | Recurring knowledge work (same sources, same format, on a schedule) suits a scoped skill plus template plus one data source, not an app | [Atlassian](https://www.atlassian.com/blog/ai-at-work/building-your-ai-work-factory) | enterprise-plan.md section 5 (Where we route instead) and section 7 (finance example) | **Medium.** Add a routing row: "a recurring write-up from the same sources in the same format (weekly report, deal brief, variance commentary that people only read)" goes to a shared skill and template in UA's licensed enterprise assistant. HyperDelivery stays for things people act in. |
| 4 | Astro's triage runs reproduce, diagnose, verify (bug or intended?) and fix as isolated subagents, to stop the model forcing a fix; the reporter confirms a preview before a PR opens | [Cloudflare](https://blog.cloudflare.com/astro-issue-triage); [triagebot-action](https://github.com/withastro/triagebot-action) | operating-model.md section 1 (Fix and "From a signal" starting points; 3.5 Manual QA) and section 2 (Path) | **Medium, Stage 3 with Operate.** On the Fix and "Report a problem" paths, run reproduction and "bug, intended behavior or change request?" in fresh contexts that pass a written report forward, before any fix. "Could not reproduce" and "working as designed" are first-class outcomes shown to the reporter. The reporter gets a "Try the fix" card on the preview, and their confirmation is the Manual QA record. Track open reports per live app and time to a verified fix. |
| 5 | Agent PRs of 1 to 50 lines succeed 76 to 80%; performance work 54.5%. Instructions and setup moved success from 38.1% to 69%, not model upgrades | [Toub](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/) | operating-model.md 2.5 Tickets and 3.1 Code; platform-architecture.md section 9 (Coding lanes, the `hyperdelivery-builder` agent) | **High, Stage 1.** Keep build units small and well specified, with architecture choices settled in Tech Design and signed at approval 2. Version the generated repository's agent instructions and setup (exact build and test commands, firewall allowlist for package feeds) as part of the golden path. Improve them from failures before swapping models. Report merge rate by unit size and kind. |
| 6 | Agent PRs succeed 67.9% against 87.1% for humans; with a human commit 86.2%, fully autonomous 55.1%; reverts are no worse | [Toub](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/) | enterprise-plan.md sections 9 and 10; operating-model.md section 6 (budgets); platform-architecture.md section 9 (lane B) | **Medium.** Build calendar estimates assuming about one in three agent units needs a second pass. Give a stuck unit a platform-engineer assist (a lane B session or a human commit) rather than more autonomous retries. Do not claim fully autonomous builds in the deck. |
| 7 | Spotify's LLM judge compares each diff with the original prompt; it vetoes about 25% of sessions, half recover, and the top trigger is going out of scope | [Spotify](https://engineering.atspotify.com/2025/12/feedback-loops-background-coding-agents-part-3) | platform-architecture.md section 2 (checks table, loop budgets); operating-model.md 3.1 and 3.2 | **High; shadow in Stage 2, blocking by Stage 3.** After the deterministic checks, a fresh-context check compares each BuildResult diff with its signed BuildUnit and acceptance criteria. Out-of-scope changes (refactors, disabled tests, extra features) get one course-correction inside the existing loop budget, then escalate. Report veto and recovery rates. This makes approval 2 binding in the code itself. |
| 8 | Filtering review comments on the model's own confidence discarded 65% of them for a 3% gain; context, targeting and a model-graded gate reached 73% acceptance | [Faire review](https://craft.faire.com/spec-review-ship-how-ai-is-changing-the-way-faire-builds-software-79f475b60908); [uReview](https://uber.com/blog/ureview) (via Firecrawl) | platform-architecture.md section 2 (code-review finders plus verifier; shadow mode) and section 14 | **Medium.** The verifier asks whether a finding is worth a person's time, given the change's context, and never applies a self-reported confidence cutoff. Track, per reviewer, the share of findings the author addressed and the false-positive rate. A reviewer that falls below its bar returns to shadow mode. |
| 9 | About half of grader-passing PRs would not be merged by maintainers; "passes checks but wrong" is the failure that destroys trust | [METR](https://metr.org/notes/2026-03-10-many-swe-bench-passing-prs-would-not-be-merged-into-main/); [Spotify](https://engineering.atspotify.com/2025/12/feedback-loops-background-coding-agents-part-3) | enterprise-plan.md section 10; platform-architecture.md section 14 | **High, Stage 2.** Add a measure: approvals rejected or sent back even though every criterion had passing evidence. Each case becomes a golden case and a fix to the evidence plan or evidence agent. Push detection earlier (Test Plan, the scope check) and accept more failed generations instead. |
| 10 | Read the diff to scope screenshots; `gh --attach` (v2.99.0) puts evidence on the PR without a person; not on GitHub Enterprise Server | [Firecrawl](https://www.firecrawl.dev/blog/ai-software-factory); [GitHub changelog](https://github.blog/changelog/2026-09-01-github-cli-media-in-issues-pull-requests-and-comments/) (via Firecrawl) | operating-model.md 3.4 Visual QA and section 10 (brownfield PRs, handoff package) | **Low, Stage 3.** Limit Visual QA re-captures to the pages the diff touched, at desktop and phone widths. For PRs to owning teams and T3 handoffs, attach the before and after captures and an evidence summary to the PR. The evidence store stays the system of record, and capture rules (synthetic or approved data only) are unchanged. |
| 11 | The Linux kernel requires an `Assisted-by: AGENT:MODEL` trailer and forbids agents from signing off; without a policy, nobody can later tell where changes came from | [Firecrawl](https://www.firecrawl.dev/blog/ai-software-factory) (kernel policy via Firecrawl) | platform-architecture.md sections 9 and 10; operating-model.md section 10 | **Low effort, Stage 1.** Every agent commit carries an `Assisted-by:` trailer naming the specialist and model id, plus the project and BuildUnit ids. The human signature stays in the decision record and is never a Git sign-off. |
| 12 | On 878 agent PRs, the top two reviewers wrote 36% of human feedback and the top 10 wrote 61%; agent PRs needed 43% more comments | [Toub](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/); [Faire](https://craft.faire.com/spec-review-ship-how-ai-is-changing-the-way-faire-builds-software-79f475b60908) | enterprise-plan.md sections 10 and 12; operating-model.md sections 4 and 5 | **High.** Add a measure: the share of approvals and reviews done by the top two people in each role (business owner, data owner, steward, engineering reviewer). Add "co-signer concentration" as a risk with that early warning. Size the Scale gate on reviewer capacity as well as demand. |
| 13 | Faire does not request code-owner review until a PR has one review, so domain experts are not pulled into unfinished work | [Faire swarm](https://craft.faire.com/swarm-coding-agentic-development-with-multiple-background-agents-3549adc7460d) | operating-model.md section 4 (Who signs), section 10 (brownfield rule) and section 11 (notifications) | **Medium.** At T1 and above, send the data-owner and engineering-reviewer cards only after the business owner has opened a complete evidence pack, time-boxed so this adds no more than a day. For brownfield PRs, request code-owner review only after the platform engineer's review. The signer matrix and the approval count do not change. |
| 14 | Astro reads an agent failure as missing docs, missing tests or an opaque boundary, and adding one comment fixed a repeat failure; Uber is generating skill updates from trace "papercuts" | [Cloudflare](https://blog.cloudflare.com/astro-issue-triage); [Uber](https://www.uber.com/us/en/blog/efficient-software-factory/) | operating-model.md 4.3 Learn; platform-architecture.md section 14 | **High, Stage 2.** Classify every escalated unit, vetoed build and rejected approval into a fixed set of causes, each with an owner: missing context in the golden path or instructions (platform team), missing test, ambiguous ticket or criterion, data definition gap (steward), model error. Fix the cause in the golden path, skill, docs or tests, then rerun the golden cases. |
| 15 | "Improve the factory, not the output": making the same edit repeatedly is the signal to change the skill, framework or template | [Atlassian](https://www.atlassian.com/blog/ai-at-work/building-your-ai-work-factory) | operating-model.md section 8 (author marks in the living document) and 4.3 Learn; Admin | **Medium, Stage 3.** The living document already records who wrote each passage. Use that to detect the same kind of human edit to a generated section across projects (for example, the same caveat added to every finance Brief), and propose a skill or template change in Admin for the policy owner. Measure the repeat-edit rate falling. |
| 16 | A work factory keeps selective data sources, knowledge, skills, judgment frameworks and output templates as separate parts, one factory per recurring job | [Atlassian](https://www.atlassian.com/blog/ai-at-work/building-your-ai-work-factory) | platform-architecture.md section 2 (departments contribute skills and golden paths) and section 5 (workspace context layer); operating-model.md section 5 (policy owner) | **Medium, Stage 3.** Define a department's contribution as a versioned workspace pack: allowed sources (the envelope), evergreen context, skills, judgment frameworks (for example, a merchandising scoring rubric) and output templates, each with a named owner. Templates can change without touching skills, and every change runs the evaluation suite. |
| 17 | A factory must answer "which agents, skills, plugins and MCP servers exist, and who owns them?"; Astro moved its skill into a separate, tested repository; `gh skill` pins versions | [Einy](https://x.com/ZoharEiny/status/2112480184595063070); [Holmes](https://x.com/BHolmesDev/status/2110406463059636235); [Cloudflare](https://blog.cloudflare.com/astro-issue-triage); [Firecrawl](https://www.firecrawl.dev/blog/ai-software-factory) | platform-architecture.md sections 2, 12 and 13; operating-model.md section 5 | **Medium; Stage 3, shown in Admin from Stage 4.** Keep one registry of every specialist, skill, golden path, connector and model setting, with owner, version, evaluation status and the tiers it may run at. Release skills as tested, versioned packages that run the same locally and on AgentCore, pinned per project. The decision record already binds prompt and model versions; add skill and golden-path versions. |
| 18 | Uber decomposes spend into users × sessions per user × turns per session × requests per turn × tokens per request × price per token, and explains every change with no residual | [Uber](https://www.uber.com/us/en/blog/efficient-software-factory/) | enterprise-plan.md section 11 (run-rate table) and section 13; platform-architecture.md section 13 | **High, before the meeting.** Fill the run-rate's [estimate] cells as projects per month × turns per project (by depth) × model requests per turn × tokens per request × Bedrock price, plus specialist credits. Report each month's change split into adoption, engagement, input workload and output workload. |
| 19 | Each Uber specialized agent has an outcome cost (per merged PR, review, alert, cleanup), a quality signal (revert rate, F1, MTTR) and a volume, tracked through model changes | [Uber](https://www.uber.com/us/en/blog/efficient-software-factory/) | platform-architecture.md sections 13 and 14; enterprise-plan.md section 10 | **Medium, Stage 2.** Keep cost per accepted outcome as the headline. Add a unit cost and quality signal per specialist: cost per merged BuildUnit with rework rate; cost per review with findings addressed; cost per DataFindings with numbers-check pass rate; cost per ResourceDigest with citation accuracy. Confirm quality holds through every model change. |
| 20 | Uber picks each agent's model from a benchmark of its real work on a cost-quality frontier that moves every few weeks; defaulting subagents to a cheaper model is its biggest default lever | [Uber](https://www.uber.com/us/en/blog/efficient-software-factory/); [Faire](https://craft.faire.com/spec-review-ship-how-ai-is-changing-the-way-faire-builds-software-79f475b60908) | platform-architecture.md section 14 (model evaluations per specialist) and section 13 (Bedrock model allowlist) | **Medium, Stage 3.** Turn the per-specialist evaluations from a ship gate into a selection tool that reports quality, cost and latency per candidate model. Pick the cheapest model that meets the bar, and rerun when Bedrock adds models. Default bounded delegations (resource-reader digests, first-pass critics) to a smaller model with an override; keep the orchestrator on a frontier model. Make sure the model allowlist includes a cheaper tier. |
| 21 | 100+ preloaded tools cost Uber 50K to 70K tokens a turn; a project-tracking vendor's MCP server ships 46 tools; tool search, CLI resolution and code-mode fix it; a 1-hour cache TTL suits idle gaps | [Uber](https://www.uber.com/us/en/blog/efficient-software-factory/); [AWS](https://aws.amazon.com/about-aws/whats-new/2026/01/amazon-bedrock-one-hour-duration-prompt-caching/) | platform-architecture.md section 11 (Rovo MCP in Stage 3), section 2 (broker) and section 8 (traces) | **Medium, Stage 3.** Never load a whole vendor MCP server into an agent. Expose curated tool subsets per delegate through AgentCore Gateway with semantic tool search: read tools for the resource reader, write tools only after approval 2. Keep polling loops in broker code, as planned for Cortex Code. Track the cache hit rate and choose the TTL from the gap between turns. Station turns usually follow hours of human waiting, so keep the system prompt and skill prefix stable. Set compaction and reasoning effort as platform defaults. |
| 22 | Uber shows live cost, pools spend across tools, nudges at 50, 80 and 100% of expected spend, and audits sessions for 16 waste patterns instead of hard caps | [Uber](https://www.uber.com/us/en/blog/efficient-software-factory/) | platform-architecture.md section 13; operating-model.md section 11; enterprise-plan.md section 9 (Stage 4 budgets) | **Low, Stage 4.** Give each workspace one shared budget pool, with Teams nudges to the workspace owner at 50, 80 and 100% of expected spend and a quick approval to raise it. Keep the hard caps per delegation. Run a monthly trace audit for waste: the wrong model for the task, large tool payloads left in context, cold-cache resumes, heavy preambles. |
| 23 | With table-usage history in its context graph, Uber's agent found the table 50+ analysts use in 38 s; without it, it spent 20 minutes and wrongly concluded the data could not be queried | [Uber](https://www.uber.com/us/en/blog/efficient-software-factory/) | operating-model.md 1.3 Data discovery; platform-architecture.md section 6 (Cortex Code data specialist) | **Medium, Stage 3; confirm access with data platform.** When no certified definition exists, the Cortex Code specialist ranks candidate objects by how many distinct people query them (aggregated from Snowflake's access and query history, no rows) and labels the top one "most used, not certified". It never reports data as unavailable before both the catalog and usage have been checked. |
| 24 | The proven factory workload is mechanical change at scale; Uber runs a scheduled maintenance agent (Fawkes) priced per cleanup | [Firecrawl](https://www.firecrawl.dev/blog/ai-software-factory); [Uber](https://www.uber.com/us/en/blog/efficient-software-factory/) | platform-architecture.md section 10 (Patching) and section 12; operating-model.md section 3 (changes go back through the line) | **Medium, Stage 4.** Run golden-path base updates and dependency patches across live T0 to T2 apps as a scheduled agent, through the "Change this prototype" path. Its evidence pack shows no change in behavior, so approval 3 is a short glance. Report cost per cleanup against the 7-day patch rule. |
| 25 | DORA: AI amplifies throughput and instability together; the ROI model pays back in about eight months after a J-curve dip, with gains often under 10% on legacy code | [DORA](https://dora.dev/dora-report-2025/), [InfoQ](https://www.infoq.com/news/2026/05/dora-roi-ai-assisted-dev-report/) (both via Firecrawl) | enterprise-plan.md section 11 (break-even), section 10 and section 9 | **Medium, before the meeting.** Show a J-curve in the break-even, with verification cost coming first. Expect smaller gains on "change something that exists" than on new T0 work. Report instability (rework, kill-switch uses, apps retired early) next to cycle time. |
| 26 | Uber concludes that optimizing a fleet of managed, benchmarked agents beats optimizing thousands of individual sessions; published factory wins are mostly migrations, not greenfield | [Uber](https://www.uber.com/us/en/blog/efficient-software-factory/); [Firecrawl](https://www.firecrawl.dev/blog/ai-software-factory) | enterprise-plan.md section 1 (Why now) and section 5 (Why HyperDelivery) | **Medium, deck.** Add two lines for the Director. Uber's evidence answers "why not let everyone use Copilot directly": managed specialists give control over routing, harness and spend. And the cross-functional prototype claim is not yet proven in public; the tester loop is the test. |
| 27 | The heart of a factory is the whole team agreeing on one agent setup, like CI and lint; the engineer's job becomes making agents better | [Holmes](https://x.com/BHolmesDev/status/2110406463059636235) | enterprise-plan.md section 11 (team); operating-model.md section 5 (platform team) | **Low.** Describe the platform team's job as factory engineering, measured by agent success (unit merge rate, findings addressed, first-pass acceptance) rather than prototypes delivered. Review and gate agent configuration (agent YAML, skills, model choices, sandbox definitions) like CI config. |

## 4. Corrections and updates to earlier research

- **Uber.** [software-factories.md](software-factories.md) cites a secondary
  [summary](https://newsletter.port.io/p/how-uber-built-a-software-factory) giving a 2,500-skill
  registry. The primary post (Aug 27, 2026) gives more than 3,600 skills, more than 30,000 skill
  runs a day, more than 70% of PRs attributed to agents, and an MCP gateway in front of more than
  1,000 servers ([Uber](https://www.uber.com/us/en/blog/efficient-software-factory/)). The same post
  also says "1K+ MCP tools" in one place, so the server count is approximate. The port.io summary
  is published by Port, whose CEO wrote the post in section 2.5.
- **Stripe.** software-factories.md says more than 1,000 agent PRs a week and a 400-tool Toolshed.
  Firecrawl cites 1,300 merged a week
  ([Stripe, part 2](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2))
  and roughly 500 tools. I did not re-read either Stripe post.
- **Two Firecrawl numbers are slightly off from their source.** Firecrawl's FAQ says agent PRs
  were 14% of Microsoft-originated PRs; Toub's table shows 14% of all PRs and 22.2% of
  Microsoft-plus-agent PRs (878 of 3,960). Firecrawl says instructions moved success "from 41.7% to
  a sustained 71%". Those are the first month's rate and the recent quarter's. The direct
  before-and-after comparison is 38.1% to 69%
  ([Toub](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/)).

## 5. Could not access or verify

- **Not re-read; cited via Firecrawl:** Stripe part 2, Uber's uReview post, OpenAI's harness
  engineering post, DORA 2025 and the InfoQ write-up of the 2026 ROI model, GitClear, the Linux
  kernel attribution policy, the GitHub CLI `--attach` changelog, Airbnb's migration, Mastra's docs,
  Rauch's posts, Sentry's Seer and Ramp's Inspect.
- **Uber.** The four-layer names come from reading Figure 3 as an image; the post's text does not
  list them. I did not watch the AI Engineer 2026 talk. Uber's numbers are self-reported, and the
  caching multipliers are provider prices Uber quotes. On Bedrock, the 1-hour TTL has been generally
  available since January 2026 for Claude Sonnet 4.5, Haiku 4.5 and Opus 4.5
  ([AWS](https://aws.amazon.com/about-aws/whats-new/2026/01/amazon-bedrock-one-hour-duration-prompt-caching/),
  [docs](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html)). Confirm it for
  whichever model HyperDelivery pins.
- **Cloudflare** reports no per-issue cost, accuracy or false-fix rate. I did not inspect the
  triagebot-action code or Flue. The publication date comes from the page's metadata.
- **Atlassian** is a pattern article with an illustrative example, not measured results.
- **X posts** were read through the fxtwitter API, without their replies. Both authors sell
  factory products (Port and Warp).
- **Firecrawl's article** is vendor content. Its stage taxonomy and merge-tier table are its own
  synthesis.

## Sources

### The six sources for this round

- Firecrawl, [How to Build an AI Software Factory: Agents That Open, Review, and Merge PRs](https://www.firecrawl.dev/blog/ai-software-factory) (Hiba Fathima, Sep 11, 2026)
- Cloudflare, [Astro issue triage](https://blog.cloudflare.com/astro-issue-triage) (Matthew Phillips, Aug 4, 2026); [withastro/triagebot-action](https://github.com/withastro/triagebot-action); [Flue](https://flueframework.com/)
- Atlassian, [Building your AI work factory](https://www.atlassian.com/blog/ai-at-work/building-your-ai-work-factory) (Dugald Morrow, Aug 21, 2026)
- Uber, [Running a Software Factory Efficiently at Uber Scale](https://www.uber.com/us/en/blog/efficient-software-factory/) (Uday Kiran Medisetty, Aug 27, 2026)
- Zohar Einy, [X post on what a software factory is](https://x.com/ZoharEiny/status/2112480184595063070) (Oct 20, 2026), via [fxtwitter](https://api.fxtwitter.com/ZoharEiny/status/2112480184595063070)
- Ben Holmes, [X post on factory engineering](https://x.com/BHolmesDev/status/2110406463059636235) (Oct 14, 2026), via [fxtwitter](https://api.fxtwitter.com/BHolmesDev/status/2110406463059636235)

### Primary sources read to check Firecrawl's claims

- Stephen Toub, [Ten Months with Copilot Coding Agent in dotnet/runtime](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/)
- Spotify Engineering, [Feedback loops: background coding agents, part 3](https://engineering.atspotify.com/2025/12/feedback-loops-background-coding-agents-part-3)
- Faire, [Spec, review, ship: how AI is changing the way Faire builds software](https://craft.faire.com/spec-review-ship-how-ai-is-changing-the-way-faire-builds-software-79f475b60908) and [Swarm coding with multiple background agents](https://craft.faire.com/swarm-coding-agentic-development-with-multiple-background-agents-3549adc7460d)
- Shopify Engineering, [Under the River](https://shopify.engineering/under-the-river); Tobi Lütke, [Learning on the Shop floor](https://x.com/tobi/status/2053121182044451016) (May 9, 2026)
- METR, [Many SWE-bench-passing PRs would not be merged into main](https://metr.org/notes/2026-03-10-many-swe-bench-passing-prs-would-not-be-merged-into-main/)
- AWS, [Amazon Bedrock now supports 1-hour duration for prompt caching](https://aws.amazon.com/about-aws/whats-new/2026/01/amazon-bedrock-one-hour-duration-prompt-caching/) and [Prompt caching](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html)

### Cited through Firecrawl, not re-read

- Stripe, [Minions](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents) and [part 2](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2)
- Uber, [uReview](https://uber.com/blog/ureview)
- OpenAI, [Harness engineering](https://openai.com/index/harness-engineering/)
- [DORA 2025 report](https://dora.dev/dora-report-2025/); InfoQ, [DORA ROI of AI-assisted development](https://www.infoq.com/news/2026/05/dora-roi-ai-assisted-dev-report/)
- GitClear, [AI assistant code quality 2025](https://www.gitclear.com/ai_assistant_code_quality_2025_research)
- GitHub, [CLI media in issues, pull requests and comments](https://github.blog/changelog/2026-09-01-github-cli-media-in-issues-pull-requests-and-comments/) and [Agent HQ](https://github.blog/news-insights/company-news/welcome-home-agents/)
- [Mastra Factory](https://factory.mastra.ai/); Anthropic, [Managed agents](https://anthropic.com/engineering/managed-agents)
- Guillermo Rauch, [post on AI software factories](https://x.com/rauchg/status/2043869656931529034) and [post on the factory monorepo](https://x.com/rauchg/status/2089804717337817514)
- Airbnb, [Accelerating large-scale test migration with LLMs](https://airbnb.tech/infrastructure/accelerating-large-scale-test-migration-with-llms/); Sentry, [Seer automated debugging](https://blog.sentry.io/automated-debugging-workflow-sentry/); Ramp, [Why we built our background agent](https://engineering.ramp.com/post/why-we-built-our-background-agent)

### Earlier factory sources this round builds on

Full context is in [software-factories.md](software-factories.md),
[ua-dlc-reconcile.md](ua-dlc-reconcile.md) and the plan's
[key sources](../enterprise-plan.md#appendix-key-sources).

- Rafal Wilinski, [Runlayer's software factory](https://x.com/rafalwilinski/status/2109940991868252302) (via [fxtwitter](https://api.fxtwitter.com/rafalwilinski/status/2109940991868252302)); [Agentation](https://www.agentation.com/); [Runlayer](https://www.runlayer.com/)
- Addy Osmani, [Software factories](https://addyosmani.com/blog/software-factories/); Dan Shapiro, [The five levels](https://danshapiro.com/blog/2026/01/the-five-levels-from-spicy-autocomplete-to-the-software-factory/); [awesome-software-factories](https://github.com/varun1505/awesome-software-factories); [StrongDM factory](https://factory.strongdm.ai/); N. Mitchem, [Nobody has actually built a software factory](https://medium.com/@NMitchem/nobody-has-actually-built-a-software-factory-77ffdc0c3efc)
- Port newsletter, [How Uber built a software factory](https://newsletter.port.io/p/how-uber-built-a-software-factory) (superseded by Uber's own post above)
- Linear, [coding sessions](https://linear.app/changelog/2026-06-11-coding-sessions); [8090](https://8090.ai/); [LightSprint](https://lightsprint.ai); Factory, [Software Factory docs](https://docs.factory.com/software-factory/overview.md)
- Anthropic, [The AI-native SDLC playbook](https://claude.com/resources/articles/the-ai-native-sdlc-playbook); AWS, [AI-Driven Development Life Cycle](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/); GitHub Next, [Chopin](https://githubnext.com/projects/chopin/)
