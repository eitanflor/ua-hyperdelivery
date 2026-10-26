<!-- Point-in-time research, retrieved 2026-10-25 for the UA-DLC plan. Claims carry source links; vendor features and dates change quickly, so verify before acting. See README.md in this folder. -->
<!-- cspell:words CISO Cherny's Firecrawl -->

# Anthropic's AI-native SDLC playbook and what HyperDelivery should take from it

Research key: `anthropic-playbook`. Date: 2026-10-25. Sources are all Anthropic first-party unless noted. Quotes are avoided; everything is paraphrased.

## 1. The playbook itself

[The AI-native SDLC playbook](https://claude.com/resources/articles/the-ai-native-sdlc-playbook) (Anthropic Applied AI; links to an Oct 2026 article set) starts from the claim that code is no longer the bottleneck. When build collapses to hours, three things happen: the constraint moves to plan, review/test and deploy, which still run at human speed; line-by-line human review stops matching reality; and governance by weekly or monthly committee gets expensive. Its example is security: teams sized for human output either build a queue or ship under-reviewed code, and a regulated organization can accept neither.

### Stages and the artifact chain

Six non-linear stages (Plan, Design, Build, Test, Deploy, Maintain) form a loop. The thread running through all of them is the **committed artifact**: each stage ends by writing one file to version control and the next stage begins by reading it. The chain is `intent.md` -> `spec.md` -> `plan.md` -> diff plus tests -> PR with review findings -> incident record. Early artifacts are markdown because a product owner and an agent can both read and act on the same file. The chain of commits is the audit trail: who asked, what the agent produced, who approved. Handoffs are meant to become automatic. An accepted intent triggers the spec pass, an approved spec triggers plan mode, a merged PR triggers the pipeline, and a breached production control band writes the next `intent.md`. Teams start by prompting each step by hand. The end state is a loop where each accepted artifact fires the next gate, and human attention concentrates on what the agent flagged.

Each "play" has the same template: what changes, getting started (prerequisites, infrastructure), steps, governance (what is enforced, the evidence, where it is logged, who approves), and a leading and a lagging indicator. Plays with no prerequisites, so the place to start, are intent capture, `CLAUDE.md`, skills, the feedback loop, and hooks as approval gates. I derived this from the "Prerequisites" text, because the dependency-graph image could not be read.

| Stage | Play | Human-in-the-loop position | Measurement (leading / lagging) |
|---|---|---|---|
| Plan | Capture as `intent.md`. The originator brainstorms with Claude, which asks analyst questions (scope, users, constraints, success), and writes a proto-spec in the originator's own words from an org template encoded as a skill. Non-engineers use claude.ai or Cowork; a GitHub connector commits for them. | The originator corrects the draft. The product owner accepts or rejects it, recorded as a merge or a closed review. | Time from first conversation to committed intent (weeks down to hours) / intent survival rate, and intent edits made after the first spec commit |
| Design | Requirements and design in one session. Claude turns the accepted intent into `spec.md`, constrained by brand, security, compliance and UX **skills**, and must flag concerns, especially conflicting policies. This later becomes a non-interactive job triggered on intent merge. | The product owner reviews but does not write the spec. Flagged concerns go to named policy owners before engineering sees them. A tech lead is consulted for higher-risk work. A human always decides. | Intent-to-spec elapsed time / spec commits dated after the first `plan.md` (requirements rework) |
| Build | Plan mode by default. Claude reads without editing, interviews the engineer, and produces `plan.md` (files that change, order, risks, proof). The engineer probes what could break, which step is riskiest, and which options were rejected, until someone who never saw the chat could build from the plan alone. Then `CLAUDE.md`, skills, hooks, and parallel sessions and subagents. | The engineer approves routine plans. Tech lead or architect approves higher-risk ones. Plan mode itself blocks edits until acceptance. | Share of changes merged from the first pass / rework cycles, and how often the diff still matches `plan.md` |
| Test | Give Claude a feedback loop (tests, build, screenshot diff). Write the failing test first for bugs, and use a hook to stop the agent editing tests during a fix. Run continuous evals in CI on any change to `CLAUDE.md`, skills or hooks: 20 to 50 real tasks, plus an eval for every incident. | The code owner reviews intent and risk because mechanical evidence is already attached. | First-pass CI success; eval pass rate / review time per PR, change failure rate, CI-caught vs production regressions |
| Deploy | AI in the PR review loop, with `REVIEW.md` passes for bugs, security and compliance against `spec.md` and `plan.md`. Hooks as approval gates (allow, ask, block). Managed settings. CI/CD with tiered autonomy per environment and rehearsed rollback. | Findings never approve or block on their own; branch protection requires a code owner. A release manager authorizes production. The agent goes up to the production gate and never past it. | Time to first review, comments resolved without a human / defects caught pre-merge vs escaped; time waiting on each gate |
| Maintain | Closing the loop. Deterministic detection with tiered response: at 1 sigma log, at 2 sigma Claude diagnoses read-only, at 3 sigma Claude may open a PR or run a pre-approved runbook. Findings become `intent.md`. Plus recurring security scans and Claude Tag as on-call. | The service owner triages (fix, schedule, dismiss), and dismissals tune the bands. | Breach-to-intent time / share of findings that become merged fixes, repeat incidents |

**Roles named.** Originator (anyone in the company); product owner; policy owners (security, brand, compliance, UX), who own and sign off skill changes; technical lead or architect; engineer, whose job shifts to orchestrating sessions and then to building and monitoring loops; platform engineer (intent home, hooks, evals, CI, managed settings); tech lead, who writes `REVIEW.md`, sets thresholds, and rates findings monthly; code owner; release manager; service owner or on-call; security lead.

**Failure modes it warns about.**
- Skills are advisory. A policy that must always hold needs a deterministic hook or a re-check at the PR.
- An approval prompt during build puts a human back on the critical path of every parallel session. Ask-gates belong at deploy.
- An agent fixing code must not be able to weaken its own check (edit the tests).
- Running more parallel sessions than one person can review.
- A bloated or stale `CLAUDE.md`. Keep it under a page, and add a correction when Claude makes the same mistake twice.
- Two sources of truth with no link between them. The fix is to name one system of record per artifact (repo, or Jira/ServiceNow via MCP), or at minimum cross-link record IDs and commit SHAs.
- Approval gates that cannot explain themselves. A block must state its reason and the route to approval.

## 2. The surrounding Anthropic material (2025-2026)

**How the Claude Code team does code review** ([Oct 2026](https://claude.dev/blog/solving-code-review-at-anthropic/)). Merged PRs more than doubled while reverts fell by more than 40%. The layers:
1. Self-verification plus a fresh-context subagent review.
2. CI.
3. Parallel finders, with verifiers voting on each finding. Survivors are tagged Important, Nit or Pre-existing.
4. A blocking security review. Every finding is fixed or answered.
5. Risk-tiered approval needing zero, one or two humans. The change sets the tier, not the author. Bots never fill a human slot, and approval binds to one commit.
6. Staged release and fast rollback.

Tuning:
- Incidents become a daily eval.
- Noise is measured by how people respond to each comment.
- Re-reviews are capped at three rounds, after one PR ran more than 50.

The goal metric is human time per PR, with reverts as the guardrail. Humans keep: whether to build at all, risky code, architecture, reading evidence, and ownership.

**Securing the AI-native SDLC** ([Deputy CISO](https://claude.com/resources/articles/how-anthropic-secures-its-ai-native-software-development-lifecycle)):
- About 80% of code is Claude-authored.
- Once trusted, an automated security review lets teams self-approve low-risk launches.
- Bug classes found are written back into `CLAUDE.md` and skills.
- Narrow review agents beat one mega-prompt.
- New reviewers run in **shadow mode**, automated approvals are sampled, and every action goes to the SIEM.
- One agent asked another to push a fix and was stopped at a human gate. Lesson: draw boundaries around actions, not instructions.
- Non-technical teams are steered to an internal **low-code app-hosting platform** to avoid shadow IT.

**Running an AI-native engineering org** ([Jun 2026](https://claude.com/resources/articles/running-an-ai-native-engineering-org)):
- Just-in-time planning: prototype, put internal users on it, act on their feedback.
- Keep humans for legal review, trust boundaries and product taste.
- Roles blur: PMs code. Hire creative builders with product sense, plus systems experts.
- Track onboarding ramp and cycle time, and don't mistake throughput for success.
- I found no Anthropic piece that defines a "product engineer" role.

**Harness design for long-running apps** ([Mar 2026](https://www.anthropic.com/engineering/harness-design-long-running-apps)). Its planner, generator and evaluator mirror HyperDelivery's line.
- The planner writes an ambitious product spec without low-level technical detail, because errors there cascade downstream.
- Generator and evaluator agree a **sprint contract**, a testable definition of done, before code is written.
- The evaluator uses the running app through Playwright and fails anything below a threshold.
- Untuned, Claude is a lenient QA agent.
- The full harness cost about 20x a solo run but produced a working app.
- The evaluator is worth its cost only when the task is beyond what the model does reliably alone.
- The [Nov 2025 harness post](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) adds a JSON feature list that starts all-failing and a progress file for handoffs.

**Folding subagents into the main loop** ([Oct 2026](https://claude.com/resources/articles/building-agents-when-to-fold-subagents-into-your-main-agent-loop)):
- One agent with progressively disclosed skills often beats multi-subagent designs on quality, cost and latency.
- It warns against architectures that copy the org chart, subagent sprawl, and a system prompt bloated with conflicting rules from every team.
- A small central team should own the prompt and the end-to-end evals; departments contribute skills and tools.

**Dynamic workflows** ([Jun 2026](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code)):
- Long-task failure modes: laziness, self-preferential bias, and goal drift.
- Patterns: adversarial verification, fan-out-and-synthesize, tournament, and loop-until-done.
- Example: agents attack a business plan from investor, customer and competitor angles.

**[Best practices](https://code.claude.com/docs/en/best-practices):**
- Verification first; show evidence rather than asserting success.
- Explore, plan, code.
- Let Claude interview you, then write `SPEC.md`.
- Use a fresh-subagent review against `PLAN.md`, limited to correctness gaps, because reviewers asked to find gaps will invent them.

**Platform features.**
- [Plan mode](https://code.claude.com/docs/en/permission-modes): approve then go auto, approve with manual edits, or keep planning. Auto mode, where a classifier reviews actions, is the default from v2.1.283, including on Bedrock.
- [Code Review](https://code.claude.com/docs/en/code-review): find, verify, rank, post. Quick, Standard or Deep. Never approves. Team and Enterprise only, not available with ZDR. The [launch post](https://claude.com/resources/articles/code-review) gives about $15-25 per review and under 1% of findings marked incorrect.
- [Skills](https://code.claude.com/docs/en/skills): the [Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) open standard, enterprise-managed. [Hooks](https://code.claude.com/docs/en/hooks-guide): command, prompt, agent and HTTP.
- [Cloud sessions](https://claude.dev/blog/claude-code-in-the-cloud/): a VM per task, ending in a branch or PR.
- [Projects](https://code.claude.com/docs/en/claude-projects) (beta, Pro and Max only): one coordinator conversation, plus an Overview of what finished, what is ready, and what is waiting on you.
- [Analytics](https://code.claude.com/docs/en/analytics): explicitly conservative.

**Collaboration surfaces.**
- [Claude Tag](https://claude.com/product/tag): multiplayer @Claude in Slack with channel memory. Teams is listed as coming soon.
- [Agent identity](https://claude.com/resources/articles/agent-identity-access-model): per-channel permissions rather than borrowed user credentials.
- [Cowork](https://claude.com/product/cowork): give a goal, get back finished work for review.
- [Claude Design](https://claude.com/product/design): business users mock up designs locked to an approved design system.

**People.**
- [How AI is transforming work at Anthropic](https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic) (Dec 2025, with Aug 2025 data, so possibly dated): only 0-20% of work is fully delegable. People delegate what is easy to verify or low-stakes, and trust grows step by step. Risks include skill atrophy and less mentorship.
- The [Anthropic Institute](https://www.anthropic.com/institute/recursive-self-improvement) says its 8x lines-of-code figure overstates productivity.

## 3. Implications: what to embed in the factory

HyperDelivery already maps onto the playbook:
- Distill covers Plan and Design.
- Blueprint is plan mode.
- Copilot is Build.
- Review is the PR review loop.
- Showroom is Deploy.

Human-signed gates are the playbook's thesis, not a deviation from it. The gaps are elsewhere: an artifact chain the next stage can read, deterministic backing for policy, evidence-based review, risk-scaled human effort, evals on the factory itself, and closing the loop.

1. **Make every station emit a versioned, human-readable artifact, plus provenance.**
   - Today's pydantic outputs (StructuredSpec, Blueprint, ReviewReport, DemoPackage) should each also render as markdown (`intent.md`, `spec.md`, `plan.md`, `review.md`, `demo.md`).
   - Record the prompt version, skill versions and model ID in force, and the content hash the signer approved. The playbook logs exactly this for specs.
   - Re-signing is required if the artifact changes, the analogue of an approval binding to one commit.
   - Commit these into the generated GitHub repo (`/intent`, `/spec`, `/plan`) so the coding agent and Review read the same files.
   - Declare per artifact whether the repo or Jira/Confluence is the system of record, and cross-link IDs and SHAs at minimum.

2. **Split Distill into a fast "intent" and a policy-constrained "spec".**
   - The intent is the originator's own words: problem, outcome, affected users and systems, constraints, open questions. Its target is hours, and it is cheap to accept or reject.
   - The spec is then generated against UA **skills** for brand, security, EDM data governance (PII, Snowflake classifications), accessibility and UX. Each skill has a named policy owner who signs changes to it.
   - The spec must list flagged concerns, especially policy conflicts. These are routed to the owner as plain-language questions before Gate 1.
   - Track the intent survival rate and post-spec rework.

3. **Turn Blueprint into a plan-mode contract.**
   - Each unit of work states the areas that change, its order, its risks, its proof (acceptance tests), and the alternatives rejected.
   - Adopt the sprint contract: before build, Review agrees with Blueprint on testable "done" criteria per unit.
   - Generate failing acceptance tests first. Copilot must make them pass without modifying them, enforced by a Review check for test-file edits.

4. **Give the Build agent a feedback loop by construction.**
   - Generate `AGENTS.md` / `copilot-instructions.md` with one-command build, test and lint, a verification block telling the agent to run all three and paste the output, and a `REVIEW.md`.
   - Add Playwright or screenshot checks against the approved mock.
   - Split units along file boundaries for parallel Copilot tasks, and cap concurrency at the rate humans can review.

5. **Rebuild Review on the Code Review pipeline.**
   - Narrow parallel finders (bugs, security, spec, plan), then a verify step.
   - Tag findings Important, Nit or Pre-existing, and require an answer to each.
   - Cap re-reviews at three rounds.
   - Exercise the running prototype against the acceptance criteria.
   - Run new versions in shadow mode. Review never approves.

6. **Scale human effort by risk, without removing gates.** A classifier reads data classification, production access and system criticality. The resulting tier decides who co-signs and how deep review runs.

7. **Back skills with deterministic controls.** Least-privilege identity per agent, egress allowlists, validators in `tools/`, and every action logged to the SIEM.

8. **Run evals on the factory.** Keep 20 to 50 golden intakes, run them on every change to a prompt, skill or model, and turn each escaped defect into an eval.

9. **Close the loop and sanction the sandbox.** Showroom deploys only to a governed, Entra-gated prototype environment, and demo feedback becomes the next `intent.md`.

10. **Resist Conway's law.** Departments contribute skills and tools, not new agents.

**Measurement plan.** These follow the playbook's leading/lagging pairs, read from timestamps HyperDelivery already stores.
- Hours from first conversation to accepted intent.
- Intent survival rate.
- Spec revisions after plan approval.
- Share of units merged on the first build pass.
- Review rounds-to-pass, and how users respond to each finding (fixed, wrong, intentional, irrelevant).
- Wait time per gate.
- Human minutes per project, with escaped defects and failed demos as the guardrail.
- Time for a new business user to reach a first working prototype.
- Policy-citing findings, which should trend to zero as skills take hold.
- Eval pass rate on every change to the factory's configuration.

## 4. UX lessons for non-technical users who never see a terminal

- **One conversation, one voice.** Anthropic's own non-developer surfaces (Cowork, Projects) hide orchestration: you give a goal, a coordinator spins off work, and you get back finished work to review. The fold-subagents post shows splitting by agent also hurts consistency. This matches UA's feedback that users don't care which agent is working. Demote the crew to an activity-detail layer and lead with the artifact and the decision.
- **Status vocabulary from Projects**: Working / Needs you / Ready to review / Done, aggregated across projects.
- **Interview, don't form-fill.** Use analyst-style structured questions with choices (the `AskUserQuestion` pattern). The intent is written back in the user's own words for correction.
- **Review evidence, not code.** At each gate, show what was approved against what: screenshots against the mock, acceptance-test results in plain words, findings ranked by severity with "Pre-existing" separated so nothing feels like the user's fault, and a live demo link. Offer on-demand explainers of any part ("explain how this pulls from Snowflake"), as the Claude Code team does internally.
- **Concerns as questions to named people.** Policy conflicts should appear as "Data governance needs to confirm X", routed to the owner, not as jargon.
- **Multiplayer by default.** The ideathon finding and Claude Tag's design point the same way. Let a business originator invite a technical partner and a data steward into a project, with a shared thread and memory. Raise direction changes early in the thread, not as blocking comments on finished work. Agent identity scoped per project, not borrowed user credentials, makes this safe.
- **Meet users in Microsoft 365.** Make Teams and SharePoint the front door for intake and gate notifications, with the M365 connector for grounding. Claude Tag for Teams is only listed as coming soon, so HyperDelivery may need its own Teams surface.
- **Make reversibility visible.** The 12-second undo already does this. Extend it to "every prototype is disposable", which lowers the fear of approving.
- **Measure human time and outcomes, not output.** Don't report lines of code.

## 5. Caveats and gaps

- Product names and versions (Mythos 5, Opus 5.5, Fable, Claude Tag, Projects) are current as of Oct 2026 per the sources.
- The Dec 2025 study, the Jul 2025 "teams use Claude Code" piece, and the Dec 2024 "Building effective agents" post may be outdated.
- Not accessed:
  - The playbook PDF. I did not download it; the web page says it holds the same content.
  - The dependency-graph image.
  - Boris Cherny's X post.
  - Full bodies of the zero-trust white paper and the M365 connector page.
  - Follow-up searches on Anthropic guidance for non-technical builders, because the shared web-search budget ran out.
- Firecrawl was rate-limited, so most pages were fetched with curl and parsed locally.
