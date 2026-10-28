<!-- Point-in-time research, retrieved 2026-10-27 for the UA-DLC north star (round 9). Claims carry source links; vendor features and dates change quickly, so verify before acting. See README.md in this folder. -->
<!-- cspell:words Automatica Bainbridge Buser Conti Crossref Feng Goodhart Holkeri Manzey Miikka Parasuraman RePEc Rehor Reimagining Schwaninger Shen Smyers Sterchi Swarmia Tamkin Wickens Zhang arxiv misattributed misattribution paywalled -->

# Autonomy levels: from human-led to AI-driven on UA-DLC (as of 2026-10-27)

Key: `autonomy-levels`. Builds on [operating-model.md](../operating-model.md) sections 1 (the line, its rules, the three approvals, where a project starts), 2 (the dials), 4 (who signs) and 10 (handoff and the Construction decision); [enterprise-plan.md](../enterprise-plan.md) sections 4 and 10; [platform-architecture.md](../platform-architecture.md) sections 2, 8 and 14; and the research in [aws-aidlc.md](aws-aidlc.md), [anthropic-playbook.md](anthropic-playbook.md) and [harness-engineering.md](harness-engineering.md). A recent internal team note, read as context and not as a source, frames the vision as an end-to-end process where AI does the work and humans make the decisions it surfaces, drawn as a maturity arrow (Human-led, AI-assisted, AI-driven as the target) with the human share of each stretch shrinking.

Naming, because it matters here: **HyperDelivery is the tool; UA-DLC is the process it runs.** An autonomy level describes how one step of UA-DLC runs on HyperDelivery, in one workspace, at one risk tier. It is never a property of HyperDelivery as a product, and "UA-DLC is AI-driven" is only ever shorthand for many steps that each earned it.

## 0. Bottom line

1. **The three levels differ in who does the work between decisions, not in how many decisions people make.** Human-led: people do the work and AI helps when asked. AI-assisted: AI drafts and proposes, people edit, review the whole artifact and decide. AI-driven: AI does the work of a stretch, including gathering context and asking people, and people make the decisions it surfaces, reviewing what changed and the evidence rather than whole documents. The three approvals, the signer matrix, the Construction decision, decision records saved only by a person and confirmations of attributed statements exist at every level. **AI-driven never means auto-approval.**
2. **A level belongs to a cell: one step, in one workspace, at one risk tier.** Microsoft's Frontier Firm research notes organizations sit in several phases at once, and SAE J3016 assigns a level to the feature engaged, not the vehicle. UA-DLC should do the same, so "AI-driven" can be true for Evidence in Merchandising at Low risk while the Brief in Finance stays AI-assisted.
3. **The Final MVP already runs most of the prototype stretch at AI-driven** (Tickets, Prototype build, Checks, Evidence, Looks like the mockup, Handoff assembly), bounded by approvals 2 and 3 and the sandbox. Ideation and the Plan stretch are AI-assisted. Try it stays human by design. The largest human share is in the three cross-cutting activities (context from meetings, questions to SMEs, finding related past work), because people must point, pick and chase. The owner's north-star asks (noticing finished Teams meetings, proactively asking SMEs, indexing approved FSDs) are the AI-driven versions of exactly those rows.
4. **Autonomy is earned per cell on evidence, never by date.** Proposed criteria: a minimum number of runs across several requesters and approvers, first-pass acceptance without material edits, a low SME correction rate, an eval floor on the step's golden cases, no severe escapes, and reviewers who still catch seeded challenge items. Promotion is a recorded decision by the workspace admin and the line owner, shown in Admin; demotion is automatic on defined triggers. Low-risk tiers and low-risk steps go first; High risk stays AI-assisted at least until the scale decision.
5. **The main risk of AI-driven work is the reviewer, not the model.** Complacency and automation bias occur in experts as well as novices and are not removed by practice or instructions ([Parasuraman and Manzey 2010](https://journals.sagepub.com/doi/10.1177/0018720810376055)). Promotion therefore comes with approvals that show diffs and evidence, flagged items the signer must answer, seeded challenge items, sampled audits, rotating auditors and a visible record of what the AI did versus what a person did.
6. **What to prepare in the Final MVP is telemetry, not infrastructure.** Keep the AI's first draft of every section, record section-level authorship, put reason codes on send-backs and overrides, record SME corrections and later-found escapes, and stamp every run with its cell and level. None of this can be backfilled, and without it no step can ever be promoted on evidence.
7. **The external references agree on the shape.** The Knight Institute's levels treat autonomy as a design choice separate from capability, and their "approver" level is the closest match to AI-driven. AWS uses "AI-driven" for AI that initiates and directs work while deferring critical decisions to humans, which is the meaning UA-DLC adopts. Anthropic's February 2026 data shows experienced users grant more autonomy and also interrupt more. None of the sources supports removing a human decision on a consequential step.

## 1. What never moves, and what does

The internal note's vision line is the right one: AI does the work and humans make the decisions it surfaces. Read literally, it already contains the rule this report depends on.

**Fixed at every level (the gates are the product):**

- The three approvals ("what we're building", "the plan", "the working prototype"), each bound to artifact hashes, with no bulk approve ([operating-model.md section 1](../operating-model.md#1-the-line)).
- The signer matrix: risk and the target tier decide who signs, never how many approvals there are ([section 4](../operating-model.md#4-who-signs)). A promotion never removes a signer.
- The Construction decision, a person's decision record after approval 3 ([section 10](../operating-model.md#10-handoff-and-the-construction-decision)).
- Decisions inside a project (decision records with options, a recommendation and evidence) are saved only by a person.
- Confirmations: only the person a statement is attributed to can confirm it ("Confirm what we heard").
- Deterministic checks block; writes outside the conversation wait for the approval that authorizes them; nothing writes to a production system.
- Policy changes are signed by their policy owner.

**What moves as a step's level rises:**

- Who does the work between decisions: a person, a person with AI drafts, or the AI.
- Who starts the work: a person asks, or the AI acts on a signal inside an agreed policy (a finished meeting, an open question, a gap the critic found).
- How much a person assembles by hand: sources, evidence, the list of what changed, who to ask.
- What the signer reads: the whole artifact, or what changed since the last signed version, the evidence and the items flagged for them, with the whole artifact one click away.
- How often the AI asks before proceeding inside the signed scope.

The Construction decision already uses the same words with the same meaning. "AI-driven" Construction means agents build from the handoff under engineering's gates on push, merge and release; "AI-assisted with engineers" means engineers lead with their own tools and approve the plan themselves. This report extends those meanings to every step on the line; it does not change the Construction choices.

## 2. The three levels, defined

| | Human-led | AI-assisted | AI-driven (north star) |
|---|---|---|---|
| **Who does the work** | People. AI answers when asked (search, a summary, a draft paragraph) | AI drafts each artifact end to end; people edit and complete it | AI does the stretch's work, including finding sources, asking SMEs and reconciling answers, within an agreed policy |
| **Who starts it** | A person | A person, step by step | The AI, on a signal the policy allows (a finished meeting in an opted-in series, an open question, a failed sensor); a person can always pause it |
| **Who decides** | People | People | People. The AI surfaces each decision as a card with options, a recommendation and evidence, and never saves a decision itself |
| **What the human reviews** | Their own work | The whole AI draft | What changed since the last signed version or the closest approved precedent, the evidence per claim or criterion, and every flagged item, which the signer must answer before signing |
| **Evidence the human assembles** | All of it | Some: the AI attaches sources and evidence, the person checks them | None by hand: the AI assembles the evidence pack; the person reads it and can open any source |
| **When the AI asks** | n/a | Whenever information is missing, through the requester | Directly to the person who can answer, under the notification policy, and whenever two readings would produce different work |
| **What the record shows** | Who did what | AI draft, person's edits, the decision | Per section and per action: AI-authored, person-authored, or AI-authored and changed by a person; every AI-initiated action and on whose behalf |
| [Knight Institute level](https://knightcolumbia.org/content/levels-of-autonomy-for-ai-agents-1) | L1 operator | L2 collaborator to L3 consultant | L4 approver. L5 observer is never used at a decision point |
| [Microsoft Frontier Firm phase](https://www.microsoft.com/en-us/microsoft-cloud/blog/2025/04/25/leading-the-ai-revolution-insights-from-microsofts-work-trend-index/) | Human with assistant | Human-agent teams | Human-led, agent-operated |

Three clarifications:

- **AI-driven is not AI-autonomous.** AWS sets its AI-Driven Development Life Cycle against two existing approaches, AI-assisted (AI enhances specific tasks) and AI-autonomous (whole applications without human intervention): in AI-DLC, AI initiates and directs workflows, defers critical decisions to humans, and implements solutions only after human validation ([AWS DevOps blog, 31 Jul 2025](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/)). UA-DLC's target is AI-driven in that sense. AI-autonomous, and the Knight Institute's L5 observer, are out of scope for every step that ends in a decision.
- **Some steps are human by definition.** An approval, a decision, a confirmation of one's own words and Try it (people using the prototype) cannot be done by an AI at any level. At AI-driven the AI prepares and organizes them; it does not perform them.
- **AI-driven can make an approval harder, not easier.** The signer sees less text but must answer every flagged item and cannot sign past an unanswered one. That is deliberate (section 6).

## 3. Each step at each level, and where the Final MVP sits

"Final MVP sits at" reads the Kind and Human columns of [operating-model.md section 1](../operating-model.md#inputs-and-outputs-step-by-step). Approvals and the Construction decision are listed to show they do not change.

| Step | Human-led | AI-assisted | AI-driven (north star) | Final MVP sits at |
|---|---|---|---|---|
| **Intake** | A form or email; a person triages and searches Jira by hand | One box; AI proposes path and depth and checks duplicates, saying what it searched; the requester chooses | AI notices candidate work in signals (a meeting where a need came up, a labeled Jira ticket, a problem report) and offers a draft project to the named person with duplicates already joined; nothing starts without that person's yes | AI-assisted |
| **Research** | The requester gathers and pastes documents | The requester points at resources; the resource reader reads them as that person and indexes them | AI proposes the sources it found that the requester can already read (related meetings, pages, approved FSDs, past projects); the requester confirms the set | AI-assisted |
| **Data discovery** | An analyst finds tables and definitions by hand | Cortex Code finds certified definitions and profiles aggregates; the requester confirms numbers; the steward answers in Teams | Cortex Code builds the data map and takes disputes straight to the steward; the requester sees only uncertified items and conflicts | AI-assisted |
| **Brief** | The requester writes it | AI drafts it with citations; the brief critic advises; the requester edits | AI drafts it, runs the critic, closes gaps by asking people, and presents the open items and a recommended verdict | AI-assisted |
| **Mockup** | A designer or the requester sketches | AI drafts three looks from the UA app kit; the requester picks and reacts | Same, starting from the closest approved mockup of a similar tool | AI-assisted |
| *Approval 1* | *Signers per section 4* | *Same* | *Same; the view leads with changes from the closest precedent, flagged assumptions and evidence* | *Fixed* |
| **Requirements** | Interviews and notes by an analyst | Question cards to people the requester names; "What we heard" captured; decisions saved only by a person | AI chooses whom to ask from the stakeholder map and past answers, asks, follows up and turns conflicting answers into decision cards; people decide | AI-assisted |
| **Stories** | An analyst writes them | AI drafts stories and criteria; the requester reacts | AI drafts; the readiness and testability sensors run; the requester sees only stories that changed or failed a sensor | AI-assisted |
| **Tech Design** | An engineer designs | AI drafts on the golden path; reviewers advise; signers per section 4 | AI drafts on the golden path; anything off it, and every policy flag, becomes a decision for its named owner | AI-assisted, agent-reviewed |
| **Test Plan** | An analyst writes test cases | The evidence agent generates the evidence plan; the business owner reviews it | Generated and checked for coverage deterministically; a person reviews numbers-check targets and gaps | AI-assisted, close to AI-driven |
| **Tickets** | A lead writes tickets | AI drafts the work graph | Same | AI-driven: no human step; people decide over it at approval 2 |
| *Approval 2* | *Signers per section 4* | *Same* | *Same; the view leads with what changed since approval 1, golden-path conformance, coverage and cost* | *Fixed* |
| **Prototype build** | A developer codes | AI writes code; an engineer reviews each piece | The coding agent builds the signed plan piece by piece in the sandbox and asks when two readings would build different things | AI-driven inside the signed plan |
| **Checks** | An engineer reviews and runs scanners | Scanners and reviewers run; a person reads every finding | Deterministic scans block; model reviewers advise; only confirmed or blocking findings reach a person | AI-driven for scans; model reviewers in shadow mode from week 8, blocking from MVP ready |
| **Evidence** | A tester runs criteria by hand and takes screenshots | The evidence agent records evidence; an analyst checks all of it | Same, with the analyst seeing failures, unexplained differences and a sample of passes | AI-driven; the analyst is optional |
| **Looks like the mockup** | A person compares screens | Automated diff; the requester checks every screen | Automated diff; the requester sees differences only | AI-driven; the requester glances |
| **Try it** | Testers try it and email notes | Named testers try it; point-and-say notes become fixes | AI invites the people who contributed, runs a scripted session, groups the notes, fixes within scope and asks each tester to confirm; people still try it | Human by design, with AI fixing |
| *Approval 3* | *Signers per section 4* | *Same* | *Same; the evidence pack leads with exceptions* | *Fixed* |
| **Handoff** | Someone assembles the package by hand | AI assembles it; a person checks it | AI assembles it and validates the context files; the requester presents the demo | AI-driven assembly |
| *Construction decision* | *The Construction owner* | *Same* | *Same, with a default from risk and the target tier* | *Fixed* |
| **Context capture from meetings** (cross-cutting) | Someone takes notes and shares them | A person points at a Teams meeting or recording; the transcript is pulled at point time | HyperDelivery notices that a meeting in an opted-in series has ended and its transcript (and Copilot recap, where the organizer is licensed) is available, pulls them in (never the recording itself; see [meeting-capture-automation.md](meeting-capture-automation.md)), extracts attributed statements and asks each speaker to confirm their own | AI-assisted, started by a person |
| **Questions to SMEs** (cross-cutting) | The requester emails or messages people | AI drafts batched Teams cards to people the requester confirms, with "Not me, suggest who" and "I don't know" | AI picks the person from ownership records and past answers, asks proactively within the notification policy, follows up, reroutes, and sends definitions to stewards for ratification | AI-assisted (Teams cards from about week 10; email deep links before) |
| **Finding related past work** (cross-cutting) | People remember | Duplicate check in named Jira projects and running projects, returning match, nothing found in a named list, or couldn't check | AI searches the Library, approved FSDs, past handoffs and golden reports, cites the closest precedent in each artifact and flags conflicts with past decisions | AI-assisted; the Library arrives in Enterprise |

Read as the internal note's bars: in the Final MVP the human share is already small on the prototype stretch, medium on Ideation and the Plan, and largest on the cross-cutting rows. Moving those rows to AI-driven is what the owner's new asks describe; how meeting artifacts and proactive Teams messages are obtained is outside this report.

## 4. External references

### 4.1 Knight First Amendment Institute: levels of autonomy for AI agents

Kevin Feng, David McDonald and Amy Zhang, "Levels of Autonomy for AI Agents", [Knight First Amendment Institute, 28 Jul 2025](https://knightcolumbia.org/content/levels-of-autonomy-for-ai-agents-1) (preprint: [arXiv 2506.12469](https://arxiv.org/abs/2506.12469v1)).

- **Five levels, named by the user's role.** L1 operator: the user directs; the agent suggests or acts on request. L2 collaborator: user and agent plan and execute together, and the user can take over at any time. L3 consultant: the agent leads and consults the user for expertise and preferences. L4 approver: the agent handles most decisions and involves the user to resolve blockers, supply credentials or sign off on consequential actions. L5 observer: the agent acts alone and the user can only watch logs and use an off switch.
- **Autonomy is a design decision separate from capability.** A capable agent can be configured to consult before each action. This is the premise of earned autonomy: UA-DLC chooses each step's level; model capability only makes a higher level possible.
- **Assisted evaluations.** The authors propose measuring autonomy as the minimum involvement an agent needs to meet an accuracy threshold, logging every intervention. UA-DLC's promotion test (section 5) is the same idea applied to live runs: a step deserves a level when people stop needing to correct it at the level below.
- **Autonomy certificates** cap the level an agent may run at, and changes to its model, tools or environment can invalidate them. The UA-DLC equivalent is the promotion decision record, invalidated by a model, prompt, skill or envelope change.
- **Guidance.** L4 suits tasks with many lower-stakes decisions, where errors carry little risk. For L5 the risks may outweigh the benefits in most cases; careful development may be justified in a closed environment, such as a simulated or sandboxed system, that keeps consequences from reaching the outside world. The authors stress that more autonomy is not automatically better.

### 4.2 SAE J3016, as an analogy, and its limits

SAE J3016 ([J3016_202104](https://saemobilus.sae.org/content/j3016_202104), April 2021) defines six levels of driving automation, from 0 (none) to 5 (full), by the roles the human and the system play in the driving task and its fallback. Its guiding principles say it is descriptive and informative rather than normative, and the level is set by the feature engaged, not the vehicle ([2018 edition text](https://mixed.de/wp-content/uploads/2021/04/J3016_201806.pdf); [ANSI summary](https://blog.ansi.org/ansi/defining-automated-driving-systems-sae-j-3016-2021/)). SAE's listing now files the 2021 edition under its history and shows a newer revision, J3016_202609, dated 20 Sep 2026; that revision was not accessed, so the points below rest on the earlier editions.

What carries over:

- **Level per feature, not per product.** A UA-DLC level belongs to a step, as a J3016 level belongs to an engaged feature.
- **An operating domain.** J3016's features are defined for a set of conditions. A UA-DLC cell's workspace, risk tier and data envelope play that part: a level earned in Merchandising at Low risk says nothing about Finance at Medium.
- **Roles by design intent.** In J3016 a driver who stops watching is still the driver. In UA-DLC a signer who does not read the evidence is still accountable for the signature.

The limits, which are why UA-DLC should not borrow the numbers:

- J3016 describes one continuous control task with seconds to react. UA-DLC is a chain of discrete artifacts with days between decisions, so a person can always be put back in without a takeover emergency.
- At J3016's top levels no human decides anything. UA-DLC rejects that for every consequential step.
- The intermediate level that relies on a person ready to take over on request is the one most often criticized in driving. UA-DLC avoids the equivalent by making every human role a discrete decision, not standby monitoring.
- It is a taxonomy, not a safety case: a level says who does what, not that it is safe. UA-DLC's levels likewise say nothing about quality; the evidence in section 5 does.

### 4.3 Microsoft Work Trend Index: the Frontier Firm

- **2025 report** ([WorkLab, 23 Apr 2025](https://www.microsoft.com/en-us/worklab/work-trend-index/2025-the-year-the-frontier-firm-is-born)). Three phases on the "Journey to the Frontier Firm": AI as an assistant, agents joining teams as digital colleagues taking tasks at human direction, and humans setting direction for agents that run whole business processes, checking in as needed. The phase labels, "Human with assistant", "Human-agent teams" and "Human-led, agent-operated", come from the report's graphic as reproduced on [the Microsoft Cloud blog, 25 Apr 2025](https://www.microsoft.com/en-us/microsoft-cloud/blog/2025/04/25/leading-the-ai-revolution-insights-from-microsofts-work-trend-index/). The report says the journey is not strictly linear and organizations can be in all three phases at once, which supports per-cell levels. It also proposes a "human-agent ratio"; for UA-DLC the plan's own measures fit better, teammate time per project by role and human corrections per accepted outcome ([enterprise-plan.md section 10](../enterprise-plan.md#10-measuring-it)), with the escapes this report proposes (section 5.3) as their guardrail.
- **2026 report**, "Agents, human agency, and the opportunity for every organization" ([WorkLab, 5 May 2026](https://microsoft.com/en-us/worklab/work-trend-index/agents-human-agency-and-the-opportunity-for-every-organization)). Relevant findings: 86% of AI users treat AI output as a starting point rather than a final answer; the top human skill named is quality control of AI output (50%); Frontier Professionals more often pause to decide what AI versus a human should do (53% vs 33%) and more often do some work without AI to keep their skills sharp (43% vs 30%). Its section on evaluation infrastructure asks who reviews agent performance and who may update the workflows agents run, which are the two questions the Admin control in section 5 answers.

### 4.4 AWS AI-DLC: what "AI-driven" means

- The method's launch post describes AI-DLC as AI that initiates and directs workflows, defers critical decisions to humans and implements solutions only after human validation, and sets it against AI-assisted and AI-autonomous development ([AWS DevOps blog, 31 Jul 2025](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/)). Its first dimension is "AI-powered execution with human oversight".
- The Workflows 2.0 specification adds the principle of moving toward autonomy in safe increments, and says a stage judged only by an LLM must not self-halt but still goes to a human. Its "Continue automatically" option waives routine unit checkpoints while plan approval, skeleton approval, the verification command and every failure still stop for a person ([aws-aidlc.md](aws-aidlc.md), retrieved 2026-10-25). Release 2.11.0 made new work leaner by default, a signal of approval fatigue. UA-DLC takes the same lesson: lower the interruptions, keep the decisions.

### 4.5 Anthropic, 2026

- **"Measuring AI agent autonomy in practice"** ([Anthropic, 18 Feb 2026](https://www.anthropic.com/research/measuring-agent-autonomy)), from about 500,000 interactive Claude Code sessions and about a million API tool calls:
  - The 99.9th-percentile turn length nearly doubled between October 2025 and January 2026, from under 25 to over 45 minutes, smoothly across model releases, which the authors read as trust and product changes as well as capability.
  - Internally, success on the hardest tasks doubled from August to December while human interventions per session fell from 5.4 to 3.3.
  - About 20% of new users' sessions use full auto-approve, rising to over 40% by 750 sessions; interrupt rates also rise, from about 5% to about 9% of turns, which the authors read as active monitoring.
  - On complex tasks Claude asks for clarification more than twice as often as on simple ones, and agent-initiated stops outnumber human interruptions; the authors caution that the agent may not always stop at the right moment.
  - They see a "deployment overhang" (models could handle more autonomy than they are given) and advise policymakers against mandating approval of every action, focusing instead on whether people can monitor and intervene.
  - For UA-DLC: count the AI's own questions as part of oversight, and expect reviewers to grant more trust with experience, which is useful when earned and dangerous when it drifts.
- **The AI-native SDLC playbook** (Oct 2026) expects handoffs to become automatic, with human attention concentrated on what the agent flagged, and uses tiered response by severity in Maintain ([anthropic-playbook.md](anthropic-playbook.md) section 1). Anthropic's security team runs new reviewers in shadow mode, samples automated approvals, and lets teams self-approve low-risk launches once automated review is trusted ([anthropic-playbook.md](anthropic-playbook.md) section 2). That is earned autonomy in practice.
- **"How AI assistance impacts the formation of coding skills"** ([Anthropic, 29 Jan 2026](https://www.anthropic.com/research/AI-assistance-coding-skills)): see section 6.2.

### 4.6 GitHub, 2026

I found no GitHub first-party post that defines or measures levels of agent autonomy. What GitHub publishes is throughput:

- Merged pull requests created by the Copilot coding agent, pull request cycle time, and review-suggestion acceptance in the Copilot usage metrics API ([changelog, 19 Feb 2026](https://github.blog/changelog/2026-02-19-pull-request-throughput-and-time-to-merge-available-in-copilot-usage-metrics-api/)); merged pull requests reviewed by Copilot code review and their time to merge ([changelog, 8 Apr 2026](https://github.blog/changelog/2026-04-08-copilot-reviewed-pull-request-merge-metrics-now-in-the-usage-metrics-api)); a daily per-repository breakdown ([changelog, 17 Jul 2026](https://github.blog/changelog/2026-07-17-repository-level-github-copilot-usage-metrics-generally-available/)).
- A third-party index of public GitHub repositories (secondary) reports that 56% of 268 merged agent pull requests in significant repositories (org-owned or at least 10 stars) had no human reviewer ([amplifying.ai](https://amplifying.ai/coding-agents/autonomy), fetched 2026-10-27; the only window the page states, 30 Jul to 28 Aug 2026, is given for its per-agent rates). A merge with no reviewer reads like autonomy in a merge count; it is the absence of review.

The lesson for UA-DLC: merges and cycle time say how much work passed, not how much a person had to change before accepting it, nor what was found wrong afterwards. Those two numbers (edit distance at approval and escapes) are what promotion needs, and no vendor dashboard provides them.

## 5. Earned autonomy

### 5.1 The unit is a cell

A cell is one step (or cross-cutting activity), in one workspace, at one risk tier. Each cell runs at one level at a time. The human factors literature has long treated automation this way: one system can automate different functions to different levels (Parasuraman, Sheridan and Wickens, 2000; see Sources). A project inherits the level of each cell it touches, and its requester can always lower any step for that project ("Ask me first on this project"), which mirrors the right to take over at the Knight Institute's L2 and the stop control in [EU AI Act Article 14(4)(e)](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-14).

Steps whose output does not depend on domain content (Tickets, Looks like the mockup, the mechanics of Evidence, Handoff assembly) may be judged on evidence pooled across workspaces; the promotion is still recorded per workspace. Content steps (Brief, Requirements, Data discovery, questions to SMEs) are judged only on their own workspace's runs, because a merchandising definition says nothing about a finance one.

### 5.2 How a cell moves up

1. **Shadow.** The higher level runs beside the current one and records what it would have done: "would have asked Dana Ortiz", "would have pulled Tuesday's meeting", "would have left these sections unflagged". People keep working at the current level. This is the Knight Institute's assisted evaluation and Anthropic's shadow mode applied to live runs.
2. **Evidence.** The cell accumulates the measures in 5.3 at its current level and in shadow.
3. **Decision.** When the criteria are met, the Admin control enables "Propose promotion", which opens a decision record filled with the evidence. Promotion is never automatic.
4. **Audit.** After promotion, a sampled share of runs gets a full independent review (section 6.1) for as long as the cell stays promoted.

The same path takes a cross-cutting activity from human-led or AI-assisted to AI-driven. Proactive meeting capture and proactive SME questions start in shadow, then run with a person approving each action (AI-assisted), and only then on their own.

### 5.3 Promotion criteria (proposed, to calibrate in the pilot)

| Criterion | Proposed bar, AI-assisted to AI-driven | Why |
|---|---|---|
| **Minimum runs** | At least 20 completed runs at Low risk (40 at Medium) in the cell, from at least 3 requesters and 2 approvers, over at least 6 weeks; abandoned and sent-back runs count | One person's taste is not evidence. With zero failures in n runs, the 95% upper bound on the failure rate is about 3/n ([rule of three](https://en.wikipedia.org/wiki/Rule_of_three_(statistics)), secondary): 15% at 20 runs, 5% at 60. That is why audits continue after promotion |
| **First-pass acceptance without material edits** | At least 80% of runs pass their approval with no send-back and no material edit to the step's artifact | The direct measure of "people stopped needing to correct it" |
| **SME correction rate** | At most 5% of AI-attributed statements and definitions later corrected by the SME or steward, and none on a certified definition | Catches errors a requester cannot see but the person quoted can |
| **Eval floor** | The step's golden cases pass at or above the floor (proposed 90%) on the prompt, skill, tool and model versions in force | A live record can look good on easy projects; the golden cases include the hard ones ([platform-architecture.md section 14](../platform-architecture.md#14-quality-and-evaluation)) |
| **No severe escapes** | Zero severe escapes in the window | One wrong number shown to a decision-maker outweighs many good runs |
| **Reviewers still read** | Evidence opened on at least 90% of the cell's approvals; once seeded challenge items run, at least 80% caught | Without this, high acceptance may mean nobody looked (section 6.1) |

Definitions:

- **Material edit.** HyperDelivery's artifacts are typed, so a change to a typed field (an acceptance criterion, a metric binding, a scope item, a decision, a data object, a person attributed) is material by definition. For prose, a section-level normalized edit distance above a threshold (proposed 0.2) is material. The editor's own tag ("wording" or "substance") is recorded beside the computed value; where they disagree, the audit decides.
- **Severe escape.** An error in a step's output found after the approval that signed it, which changed scope, a number or definition shown to a decision-maker, data access, an attributed statement, a policy outcome, or an external write. It counts wherever it was found: a later step, Try it, the receiving team, Construction or an audit.
- **The step's own artifact.** Edits made later for new information (a changed business need) are not counted against the step; the reason code (section 8) separates them.

From human-led to AI-assisted the bar is lower: the AI draft exists, the golden cases pass, and a shadow comparison shows the drafts are usable. Most steps start the Final MVP at AI-assisted already.

### 5.4 Demotion triggers (automatic; a person restores)

- Any severe escape in the cell: back one level immediately, pending review.
- First-pass acceptance below 70% over the last 10 runs, or an SME correction rate above 10% over the last 20 attributed statements.
- An eval regression after any model, prompt, skill, tool or coding-engine change: the cell runs one level down until the golden cases pass again. This ties into the ablation pass on model changes ([platform-architecture.md section 14](../platform-architecture.md#14-quality-and-evaluation)).
- A change to a policy that governs the step, or to the workspace's data envelope: the cell re-earns its level.
- An incident raised by InfoSec, a data owner, a policy owner or a Construction owner that names the cell.
- Reviewers missing seeded items below the bar: not a demotion of the AI but a review pause, in which the cell's approvals open on the full artifact until the cause is fixed.

Demotion needs no meeting and is logged with its trigger; promotion always needs a person.

### 5.5 Who decides

A promotion is a decision record signed by two people:

- **The workspace admin**, accountable for the workspace's envelope, budget and how its people work. This report proposes the role; it does not exist in [operating-model.md section 5](../operating-model.md#5-roles) yet. Until it does, the workspace's sponsor or business lead holds it.
- **The line owner**, accountable for UA-DLC as a process across workspaces. Today that is the plan owner in EDM; it may become a joint role with engineering.

Consulted, with their view recorded: the policy owner for any policy-governed step (Checks, security), the data owner and steward for Data discovery and definitions, an engineering reviewer for Tech Design, and the platform team, which attests the eval floor. The record states the cell, the evidence snapshot, the options (promote, shadow longer, decline), the decision, and a re-validation each quarter or on any trigger. Re-validation is a check, not a date-based promotion. From the Enterprise phase the record takes strong sign-in, like other decisions that change how work is governed. No bulk promotion, mirroring no bulk approve.

### 5.6 The Admin control

An **Autonomy** page in Admin (Enterprise), beside policies and budgets ([ux-direction.md section 4, item 16](../ux-direction.md#4-key-screens)):

- A grid per workspace: rows are the steps and cross-cutting activities, columns are Low, Medium and High risk. Each cell shows its level (Human-led, AI-assisted, AI-driven, or "Shadow: AI-driven"), the evidence against each bar ("14 of 20 runs", "first pass 83%", "SME corrections 2%", "eval 94%", "escapes 0", "seeded items caught 9 of 10"), the decision record that set it and its signers.
- Rows for the approvals, Try it and the Construction decision show "A person's decision at every level" and have no controls.
- The High column shows AI-assisted with the reason "Not before the scale decision".
- Actions: "Start shadow", "Propose promotion" (disabled with its reason until every bar is met), and "Demote" (any admin, immediately). The history lists every change with its trigger.
- In a project, Layer 2 shows each step's level with a link to its decision record, so a business owner can see why a step ran the way it did.

### 5.7 Order: low risk first

Volume decides the pace. The pilot (weeks 15 to 22) has 8 to 12 users and will produce few runs per cell, so a content-step promotion is unlikely before Enterprise rollout (after week 36). That is a consequence of the evidence rule, not a target date.

1. **Formalize what is already AI-driven** (Tickets, Looks like the mockup, Evidence, Handoff assembly, deterministic Checks): record them as AI-driven cells with their evidence, so the measures and demotion triggers apply to them too.
2. **Low-risk steps at Low risk:** finding related past work, source discovery in Research, Data discovery restricted to certified definitions, Stories, Test Plan.
3. **Cross-cutting activities at Low risk, opt-in:** meeting capture for opted-in recurring series, then questions to SMEs who have opted in, starting with factual and definition questions.
4. **Content steps at Low and then Medium risk:** Brief, Requirements elicitation, Tech Design on the golden path.
5. **Not promotable:** the approvals, the decisions inside a project, confirmations, Try it, the Construction decision and policy changes. High risk stays AI-assisted until at least the scale decision (about week 52), which also decides, on the same kind of evidence, whether HyperDelivery adds a Construction lane of its own.

## 6. Failure modes and mitigations

### 6.1 Automation complacency and rubber-stamping

**The evidence.**

- Complacency and automation bias are overlapping effects in which attention plays the central role. Complacency appears when a monitored automated task competes with other work, in naive and expert users alike, and is not overcome by practice; automation bias produces both omission and commission errors with imperfect aids and is not prevented by training or instructions ([Parasuraman and Manzey, Human Factors, 2010](https://journals.sagepub.com/doi/10.1177/0018720810376055); abstract only).
- A review of 35 studies from 2015 to April 2025 found that explanations often fail to reduce automation bias and simple ones can reinforce misplaced trust in less experienced users, while designs that prompt critical checking help ([Romeo and Conti, AI & Society, 2025](https://doi.org/10.1007/s00146-025-02422-7); abstract and a secondary summary).
- In a survey of 319 knowledge workers, higher confidence in generative AI went with less critical thinking, and critical thinking shifted toward verification, integration and task stewardship ([Lee et al., CHI 2025](https://advait.org/files/lee_2025_ai_critical_thinking_survey.pdf); self-reported).
- Anthropic's own users auto-approve more as they gain experience (section 4.5). HyperDelivery's reviewers will follow the same curve.
- The EU AI Act requires that people overseeing high-risk AI systems can stay aware of automation bias and can disregard, override or reverse output ([Article 14(4)(b) and (d)](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-14)). HyperDelivery is not assumed to be a high-risk system under the Act; this is a design analogy, not a legal determination.
- The plan already tracks two symptoms: approvals sent back although every criterion passed, and the share of reviews made by the top two people in each role ([enterprise-plan.md section 10](../enterprise-plan.md#10-measuring-it)).

**Mitigations, all required before a cell is promoted to AI-driven:**

- **Approvals that show diffs and evidence, not documents.** The approval view opens on what changed since the last signed version (or, for a new artifact, against the closest approved precedent or the template), the evidence for each claim and criterion, and the items flagged for the signer. Each flagged item needs an answer (accept, change, ask) before "Sign" is enabled, so a signature cannot be one click. The full artifact is one click away and opening it is recorded.
- **Seeded challenge items.** In a sampled share of approvals in AI-driven cells (proposed 1 in 10), the review view includes one known, plausible defect: a wrong definition, a dropped criterion, a misattributed statement. It is never part of the signed artifact or its hash. When the reviewer flags it, the view says it was a practice check; if they reach "Sign" without flagging it, the view shows it, says it is not in the artifact, and offers another look before the real signature. Airport screening uses the same method: fictional threat images projected into real bag scans, which a 2025 study of about 1.2 million events found to be a valid measure of detection that predicted covert test results ([Buser, Schwaninger, Rehor and Sterchi, Transportation Research Part A, 2025](https://ideas.repec.org/a/eee/transa/v200y2025ics096585642500268x.html)). The same study needed about 100 events per person for a reliable individual score, more than one UA reviewer will see in a year, so results are reported per cell, never as individual ratings. Reviewers are told the program exists, not when it runs, and HR, Privacy and the EMEA works council agree it first.
- **Sampled audits.** After promotion, a share of AI-driven runs (proposed 1 in 5 for the first 20 runs, then 1 in 10) gets a full review against sources by a second person who did not sign: a rotating analyst or steward. Audit findings feed the escape count.
- **Rotating reviewers and auditors.** The auditor is never the signer and rotates; a signer who has approved several runs in a row from the same requester gets a different auditor. The top-two concentration measure gets an alert threshold.
- **A visible record of what the AI did versus what a person did.** Each artifact section is marked as AI-authored, person-authored, or AI-authored and changed by a person, with the person's name. Every AI-initiated action (a meeting pulled, an SME asked) is labeled as HyperDelivery acting for the project under a named policy, never as a person. The record travels in the handoff package beside the `Assisted-by` trailers already in commits.
- **The AI's own questions are measured.** Agent-initiated questions and human course corrections are separate events, because a step that stops asking may be overconfident rather than better.

### 6.2 Skill atrophy among analysts

**The evidence.**

- Automation leaves operators the tasks that cannot be automated while removing the practice they need to do them, so the more advanced the automation, the more crucial and the less practiced the human contribution ([Bainbridge, Automatica, 1983](https://doi.org/10.1016/0005-1098(83)90046-8)).
- In Anthropic's randomized trial with 52 developers learning a new library, the AI group scored 17% lower on a comprehension quiz (50% vs 67%), with the largest gap on debugging, and was not significantly faster. People who delegated code generation scored under 40%; people who asked conceptual questions or asked for explanations alongside code scored 65% or more ([Anthropic, 29 Jan 2026](https://www.anthropic.com/research/AI-assistance-coding-skills); small sample, short-term quiz).
- Microsoft's 2026 report finds that the people furthest ahead keep doing some work without AI to keep their skills sharp (section 4.3). Anthropic's internal study flags skill atrophy and less mentorship ([anthropic-playbook.md](anthropic-playbook.md) section 2).

**Why it matters for UA-DLC.** EDM analysts and data stewards are the people who know which definition is right and how to ask a merchandiser what they mean. If HyperDelivery elicits every requirement, junior analysts stop learning to elicit, and the reviewers of AI-driven steps get weaker over time, which makes the promoted cells less safe.

**Mitigations.**

- **Analyst-first runs.** On a rotating share of projects (proposed 1 in 10 per analyst), the analyst drafts one section before seeing the AI's draft and then compares. This keeps the skill and gives a human baseline for edit distance.
- **Explanations as questions.** "Why this definition?" answers with the source and a short check question, following the patterns that preserved learning in Anthropic's trial, rather than a summary to accept.
- **Audits as practice.** Rotating analysts and stewards through sampled audits keeps full reading in their week.
- **Enablement.** Add reviewing AI-driven work (reading diffs, answering flagged items, spotting misattribution) to [operating-model.md section 14](../operating-model.md#14-enablement).

### 6.3 Accountability gaps

When the AI drafts, one person accepts and another signs, "the system decided" becomes an easy answer to every error. Rules:

- **The signer answers for what they signed.** Every approval states the meaning of the signature (already the e-signature pattern in [governance-collaboration.md](governance-collaboration.md) A5), and that meaning does not change with the level.
- **The platform team answers for the AI's behavior in a cell**: its golden cases, evals, sensors and the classification of failures ([platform-architecture.md section 14](../platform-architecture.md#14-quality-and-evaluation)).
- **The workspace admin and the line owner answer for the promotion**, by name, in the decision record.
- **People are never impersonated.** When HyperDelivery asks an SME or pulls a meeting, the message says it is HyperDelivery asking for a named project and requester.
- **Construction keeps its own owner.** The Construction owner answers for AI-driven Construction under engineering's gates, as today.

### 6.4 Other ways this goes wrong

- **Goodhart's law.** First-pass acceptance rises if reviewers stop reading. That is why seeded items, audits and evidence-opened rates are part of the criteria, not extras.
- **Survivorship.** Abandoned and sent-back projects must stay in the denominators.
- **Silent drift on a model change.** Covered by the eval floor and automatic demotion.
- **SME fatigue.** Proactive questions can turn into a new obligation nobody agreed to. The notification policy (one card per project per day, in the recipient's working hours: [operating-model.md section 11](../operating-model.md#11-notification-policy)) and the "Not me, suggest who" answer apply at every level; this report adds that proactive asks go only to people who opted in.
- **Language.** "AI-driven" heard as "no humans" by leadership or users. Always say it with its second half: AI does the work, people make the decisions.

## 7. Worked example: the SKU productivity workbench

The workbench is the plan's first illustrative project: merchandisers decide which styles to cut before line review, today from Excel exports; target T1 Team app, read-only; the prototype uses dev sell-through and units with synthetic margin ([enterprise-plan.md section 7](../enterprise-plan.md#7-how-this-connects-to-uas-priorities)). The people are the concept canvas's: Priya Nair (requester), Maya Chen (business owner), Luis (co-signer) and Dana Ortiz (asked how markdowns count). Assume the Merchandising workspace at Low risk. Everything below is illustrative, not measured.

**Human-led (how it works without HyperDelivery).** Priya emails a request to the EDMA queue with two Excel exports. An analyst schedules three meetings, takes notes and writes a specification from the template. Nobody checks whether the Wholesale team built something similar. The analyst emails Dana about markdowns and waits a week. An engineer builds a dashboard; Priya and Maya review screenshots by email; Maya approves in a reply. Every piece of evidence was assembled by a person, and the record of who decided what lives in an inbox.

**AI-assisted (the Final MVP).** Priya types the idea in the Home composer and points at the line-review prep meeting recording and the two exports. HyperDelivery checks duplicates and says what it searched; the resource reader pulls the transcript; Cortex Code finds the certified sell-through definition and marks margin as not yet agreed. HyperDelivery drafts the Brief with citations and three looks; Priya names Dana and the margin steward, and HyperDelivery sends each a Teams card. Priya, Luis and Maya read the full Brief and mockup and sign approval 1. The plan is drafted; Maya reads all of it and signs approval 2. The coding agent builds the prototype in the sandbox, the evidence agent runs every criterion, and the numbers check says "definitions match; numbers not checked on dev data" for margin. Priya and two merchandisers try it; Maya signs approval 3 on the evidence pack; the handoff package goes to the receiving engineering lead, who records the Construction decision with Maya.

**AI-driven (the north star, where Merchandising's Low-risk cells have earned it).** Suppose Research, finding related past work, meeting capture and questions to SMEs are promoted in Merchandising, while the Brief is still AI-assisted because its first-pass acceptance is 74%, below the bar.

- Tuesday's line-review prep meeting is part of an opted-in series. When it ends and its transcript and Copilot recap are available, HyperDelivery reads them (never the recording itself) and offers Priya a draft project: three people described cutting styles from Excel exports. It has found the Wholesale sell-through tracker, which reads the same sell-through views, and two approved specifications that define markdown handling, and cites both. Priya says yes.
- HyperDelivery asks Dana directly, because ownership records and her answer on the Wholesale tracker show she is the right person, and asks the margin steward to ratify the margin definition. It asks each meeting attendee to confirm the statements attributed to them; one correction comes back and is recorded as an SME correction.
- The Brief is drafted as at AI-assisted, and Priya reviews the whole of it because that cell has not earned more.
- At approval 1, Luis and Maya open a view that leads with three flagged items (margin still unratified, one attributed statement awaiting its author, a scope question about outlet styles), the differences from the Wholesale tracker's approved Brief, and the evidence. Each answers the flagged items before signing. This approval carries a seeded item, a sell-through definition swapped for a non-certified one, which Maya flags.
- In Requirements, the AI elicits and reconciles. Whether to rank cuts by sell-through or by margin dollars reaches Maya as a decision card with options, a recommendation and evidence; Maya decides.
- The build, checks and evidence run as in the Final MVP. For Try it, HyperDelivery invites the merchandisers who were in the meeting and groups their notes; they use the prototype themselves.
- Approval 3 and the Construction decision are people's decisions, exactly as before. Because the cell is in its first 20 promoted runs, an analyst audits this project's Brief and data map against the sources afterwards.

| | Human-led | AI-assisted | AI-driven |
|---|---|---|---|
| What Priya does | Writes the request, attends meetings, chases answers, checks screenshots | Types the idea, points at sources, names people, reviews drafts, tries the prototype | Says yes to a proposed project, reviews the Brief, answers decision cards, tries the prototype |
| What Maya does | Reads documents and approves by email | Reads the full Brief, plan and evidence pack and signs three approvals | Answers flagged items and decision cards, reads the evidence, signs the same three approvals |
| What Dana does | Answers an email when she can | Answers a Teams card Priya asked for | Answers a Teams card HyperDelivery sent her, and confirms her own quoted words |
| Decisions made by people | All | All | All |

## 8. What to prepare now (Final MVP), without building ahead

The Final MVP builds none of the north-star behavior: no meeting watcher, no proactive SME messages, no shadow runner, no seeding, no Autonomy page and no automatic promotion. What it must do is record the data a promotion will need, because these records cannot be reconstructed later. Friendly users start in week 8; the records should start with them.

1. **Keep the AI's first draft of every section.** Each artifact version records whether it is the AI's draft, a person's edit or the signed version, and the AI's original is never overwritten. Edit distance at each approval is then a calculation that can run later.
2. **Section-level authorship.** Each section carries an author kind (AI, person, AI then person), the person's id, and the model, prompt and skill versions that produced the AI text.
3. **Reason codes.** "Send Back" requires one reason from a fixed list (missing context, wrong or uncertified definition, wrong scope, missing stakeholder, factual error, quality of writing, changed business need, other). The same list applies when a person overrides a reviewer finding or chooses against a decision card's recommendation. An optional "wording or substance" tag on edits.
4. **SME corrections as events.** When a contributor or steward corrects an attributed statement or a definition, record the correction linked to the original statement, its source (meeting, page, AI inference) and the step that produced it.
5. **Escapes as links.** Any later finding, problem report, tester note or receiving-team comment can be linked to the step and approval that let the error through, with a severity. This is the escape count.
6. **AI questions and human corrections as separate events,** extending the receipt's human-corrections field ([platform-architecture.md section 8](../platform-architecture.md#8-telemetry-and-traces)).
7. **Review interaction.** Per approval: evidence opened (already a measure), which flagged items were opened, and time on the review. Reserve a field for seeded items, unused in the pilot.
8. **Cell keys and the level on every run event:** step, workspace, risk tier, path, depth, the level it ran at, and the versions in force, so cells can be computed later without guessing.
9. **Consent language.** The pilot's notice to users says review interactions are recorded to evaluate the process, not to rate people, and HR and Privacy check it before week 15.
10. **Words.** Adopt the definitions in section 2 and the fixed list in section 1 in [operating-model.md](../operating-model.md), so "AI-driven" means one thing on every slide.

## 9. Long-lead requests

| Request | Owning team | Why | Needed by phase |
|---|---|---|---|
| Clear the notice that review interactions are recorded to evaluate the process, reported per cell | HR, Privacy, Legal | The telemetry in section 8 starts with friendly users and covers reviewers in Baltimore, Amsterdam and Bengaluru | Final MVP (before week 15) |
| Agree seeded challenge items and sampled audits, reported per cell and never as individual ratings | HR, Privacy, EMEA works council | Seeding measures how people review; it needs agreement before it runs | Enterprise (hardening, by week 36) |
| Send handoff outcomes back: accepted without rewrite, sent back, and defects found in Construction, each traced to a step | Engineering (receiving teams) | Construction is where many escapes surface; without this feed the escape count is incomplete | Final MVP pilot (week 15) |
| Record steward rulings and definition corrections as structured events | Data governance (stewards) | The SME correction rate depends on it | Final MVP pilot (week 15) |
| Name a line owner and a workspace admin for each pilot workspace | Sponsor, EDM leadership | Promotions need two named signers | Enterprise (week 23) |
| Endorse the rule: autonomy rises per cell on evidence, never by date, and High risk waits for the scale decision | Director of AI and Analytics, sponsor | Leadership will be asked for dates; the answer must already be agreed | Enterprise (week 23) |
| Treat the autonomy policy (what a promotion may change, the triggers) as a policy-owned rule with a signer | InfoSec, Governance Admin | A promotion changes how work is governed, like any policy | Enterprise (hardening) |
| Opt-in for recurring meeting series and for SMEs to receive proactive questions, with the Teams and Graph permissions those need | Microsoft 365 and Teams administration, Privacy | The AI-driven cross-cutting rows depend on consent and tenant settings; the permissions themselves are outside this report | Enterprise (rollout, after week 36) |

## 10. Risks

- **Rubber-stamping makes acceptance numbers lie.** Mitigated by making seeded-item catch rates, audits and evidence-opened rates part of the promotion criteria.
- **Low volume.** Few runs per cell means slow promotions and wide uncertainty; pooling is allowed only for workspace-independent steps, and audits continue after promotion.
- **Measurement read as surveillance.** Per-cell reporting, disclosure and works council agreement before any seeding.
- **"AI-driven" heard as "no humans".** Always paired with "people make the decisions"; the fixed list in section 1 goes into the operating model.
- **Proactive asks overload SMEs.** Opt-in, the notification caps and "Not me, suggest who" apply at every level, and the SME's rating of whether a question was worth their time is tracked.
- **A model change silently degrades a promoted cell.** Re-run golden cases on every change and demote automatically on regression.
- **Engineering's meaning of AI-driven Construction diverges from this one.** Confirm with engineering alongside the open `--require-context` question ([operating-model.md](../operating-model.md#how-this-lines-up-with-engineerings-variant)).
- **Analysts lose the skills they need to review.** Analyst-first runs and rotating audits.
- **Gaming.** A team that wants promotion edits less. Audits by people outside the team and the escape count catch it.

## 11. Open questions

- Who is the line owner beyond the pilot: EDM alone, or jointly with engineering?
- Does the workspace admin become an Entra app role, or is it the sponsor or Governance Admin by another name?
- Are the proposed bars (20 and 40 runs, 80% first pass, 5% SME corrections, 90% eval floor, 1 in 10 seeded) right? They should be set from pilot data, not from this report.
- Is a material edit best decided by the computed distance, the editor's tag or both?
- Should path or depth be part of a cell? A Fix path may earn trust faster than a New idea path.
- Will reviewers, HR and works councils accept seeded challenge items at all, and with what disclosure?
- Does engineering accept that its two Construction modes are the AI-assisted and AI-driven levels applied to Construction?
- Should the Portfolio show leadership each workspace's grid of levels, or only the trend?
- When a workspace's data envelope widens, does every cell re-earn its level, or only the data-dependent ones?

## 12. Not verified, or could not access

- **Microsoft 2026 collaboration patterns.** Secondary sources describe four patterns named Author, Editor, Director and Orchestrator. Microsoft's report page names four modes (delegation, collaboration, asking, exploration) along human and agent intensity, without definitions. Not verified, so not used.
- **The 2025 Frontier Firm phase labels** were confirmed from the alt text of the report's graphic on the Microsoft Cloud blog, not from the report PDF; the WorkLab article describes the phases in prose.
- **SAE J3016 full text** was not accessed (paywalled). The two principles cited were confirmed in the 2018 edition text; the rest rests on SAE's listing and the ANSI summary, which returned 403 when re-fetched on 2026-10-27. SAE's listing shows a newer revision, J3016_202609 (20 Sep 2026); its content, and whether the levels changed, are not verified.
- **Parasuraman and Manzey (2010)** and **Romeo and Conti (2025)**: abstracts and summaries only. The count of 35 studies in Romeo and Conti comes from a secondary summary of the full text; a conference abstract by the same authors gives 17 studies from 2014 to 2024. **Bainbridge (1983)** and **Parasuraman, Sheridan and Wickens (2000)**: bibliographic details confirmed through Crossref; the paraphrases follow each paper's well-known argument and were not re-read in full for this report.
- **GitHub first-party material on measuring agent autonomy**: none found beyond usage-metrics changelogs.
- **The amplifying.ai figures** were fetched on 2026-10-27 and replace an earlier search-summary reading (44.3% with no reviewer, May to June 2026) that the page does not support: 44% is its human-reviewed share. The page does not define a human reviewer (for example, whether the author counts), shows no update date, and rests on 268 pull requests.
- **A reported 2026 Berkeley study** in which human reviewers approved agent commands with hidden threats about a third of the time: no primary source found, so it was dropped.
- **Swarmia's five levels of coding-agent autonomy** (Miikka Holkeri, Swarmia blog, 19 Mar 2026; a vendor post) was read: it ranks levels by how much work the agent does before returning for feedback and says higher is not always better. Not used, because the Knight Institute levels cover the same ground.

## Sources

Frameworks and levels:

- Feng, McDonald and Zhang, [Levels of Autonomy for AI Agents](https://knightcolumbia.org/content/levels-of-autonomy-for-ai-agents-1), Knight First Amendment Institute, 28 Jul 2025; [arXiv 2506.12469](https://arxiv.org/abs/2506.12469v1)
- SAE, [J3016_202104 Taxonomy and Definitions for Terms Related to Driving Automation Systems](https://saemobilus.sae.org/content/j3016_202104), April 2021 (SAE's listing shows a newer revision, J3016_202609, 20 Sep 2026, not accessed); [J3016_201806 text](https://mixed.de/wp-content/uploads/2021/04/J3016_201806.pdf); [ANSI blog summary](https://blog.ansi.org/ansi/defining-automated-driving-systems-sae-j-3016-2021/) (secondary)
- Parasuraman, Sheridan and Wickens, A model for types and levels of human interaction with automation, IEEE Transactions on Systems, Man, and Cybernetics Part A, 30(3), 2000 (automation applied per function and per level; cited for background, [DOI 10.1109/3468.844354](https://doi.org/10.1109/3468.844354), abstract read through bibliographic records)
- Microsoft WorkLab, [2025: The year the Frontier Firm is born](https://www.microsoft.com/en-us/worklab/work-trend-index/2025-the-year-the-frontier-firm-is-born), 23 Apr 2025; Smyers and Alexander, [Leading the AI revolution: Insights from Microsoft's Work Trend Index](https://www.microsoft.com/en-us/microsoft-cloud/blog/2025/04/25/leading-the-ai-revolution-insights-from-microsofts-work-trend-index/), 25 Apr 2025 (phase labels)
- Microsoft WorkLab, [2026 Work Trend Index: Agents, human agency, and the opportunity for every organization](https://microsoft.com/en-us/worklab/work-trend-index/agents-human-agency-and-the-opportunity-for-every-organization), 5 May 2026
- Raja SP, [AI-Driven Development Life Cycle: Reimagining Software Engineering](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/), AWS DevOps blog, 31 Jul 2025; Workflows 2.0 principles via [aws-aidlc.md](aws-aidlc.md)

Measuring autonomy in practice:

- Anthropic, [Measuring AI agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy), 18 Feb 2026
- GitHub changelog, [Pull request throughput and time to merge in the Copilot usage metrics API](https://github.blog/changelog/2026-02-19-pull-request-throughput-and-time-to-merge-available-in-copilot-usage-metrics-api/), 19 Feb 2026; [Copilot-reviewed pull request merge metrics](https://github.blog/changelog/2026-04-08-copilot-reviewed-pull-request-merge-metrics-now-in-the-usage-metrics-api), 8 Apr 2026; [Repository-level Copilot usage metrics GA](https://github.blog/changelog/2026-07-17-repository-level-github-copilot-usage-metrics-generally-available/), 17 Jul 2026
- Amplifying, [Coding Agent Autonomy](https://amplifying.ai/coding-agents/autonomy), Coding Agents Index (secondary; fetched 2026-10-27)
- [Rule of three (statistics)](https://en.wikipedia.org/wiki/Rule_of_three_(statistics)) (secondary)

Human factors, skills and oversight:

- Parasuraman and Manzey, [Complacency and Bias in Human Use of Automation: An Attentional Integration](https://journals.sagepub.com/doi/10.1177/0018720810376055), Human Factors 52(3), 2010; abstract confirmed on the [TU Berlin repository record](https://depositonce.tu-berlin.de/items/0c787d91-6021-480b-a333-009e0d1d0092/full)
- Romeo and Conti, [Exploring automation bias in human-AI collaboration: a review and implications for explainable AI](https://doi.org/10.1007/s00146-025-02422-7), AI & Society, 2025
- Lee et al., [The Impact of Generative AI on Critical Thinking](https://advait.org/files/lee_2025_ai_critical_thinking_survey.pdf), CHI 2025
- Bainbridge, [Ironies of automation](https://doi.org/10.1016/0005-1098(83)90046-8), Automatica 19(6), 1983
- Shen and Tamkin, [How AI assistance impacts the formation of coding skills](https://www.anthropic.com/research/AI-assistance-coding-skills), Anthropic, 29 Jan 2026
- Buser, Schwaninger, Rehor and Sterchi, [Reliability and validity of threat image projection data as a measure of performance in X-ray baggage screening](https://ideas.repec.org/a/eee/transa/v200y2025ics096585642500268x.html), Transportation Research Part A 200, 2025
- European Commission AI Act Service Desk, [Article 14: Human oversight](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-14)

Repository context: [operating-model.md](../operating-model.md), [enterprise-plan.md](../enterprise-plan.md), [platform-architecture.md](../platform-architecture.md), [ux-direction.md](../ux-direction.md), [anthropic-playbook.md](anthropic-playbook.md), [harness-engineering.md](harness-engineering.md), [governance-collaboration.md](governance-collaboration.md).
