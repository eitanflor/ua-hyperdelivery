# Personas

Who uses Hyperdelivery, what each of them is trying to get done, and what "working well"
looks like for them. The personas are **assumed from the product plan and the code**, not from
research - [docs/hyperdelivery-plan.md](../hyperdelivery-plan.md) names stakeholders, SMEs and
approvers, and the console was built for the developers who drove it first. Validate them with
the test plan at the end before treating any of this as fact.

## The cast

| Persona | Example | Comes to the console to... | Frequency |
|---|---|---|---|
| **Requester** | Riley, merchandising planning manager | Bring an idea or an FSD and find out what happens to it | A few times per project |
| **Approver (PM)** | Priya, product manager | Sign or send back a gate with confidence | Every gate, several projects at once |
| **SME** | Sam, supply-chain subject expert | Answer Scout's questions | Rarely, from a link |
| **Analyst** | Avery, business analyst | Read specs, trace requirements to builds and findings, export | Daily during a project |
| Developer (secondary) | Dev, engineer on the delivery team | Inspect the full trace, JSON, pull requests and diffs | Daily |
| Leadership viewer (secondary) | Lee, director | See the portfolio at a glance and watch demos | Weekly |

The console today serves the Developer by default
([useProjectsStore.ts](../../ui/console/src/store/useProjectsStore.ts#L551)). Everyone else has
to find the PM toggle, which is named after one of their jobs.

## Requester - Riley

**Job stories**

- When I have an idea but no spec, I want to describe it in my own words, so I can get it
  started without learning a template.
- When I already have an FSD, I want to drop it in and have it understood, so I do not retype it.
- After I submit, I want to know who is working on it and what happens next, so I can plan
  around it.

**Emotional job:** *"Don't make me feel like I need to be technical to ask for something."*

**Journey today**

| Stage | What happens | Friction |
|---|---|---|
| Arrive | Landing asks "What are we building?" | A blank box; the only example is the placeholder |
| Describe | Types a paragraph | No prompts for scope, users, data or success measure - the things the plan's structured intake calls for |
| Attach | Paperclip, one file at a time | No drag-and-drop, no multiple selection, no hint of which files help |
| Wait | Scout starts | In PM mode, dots and a timer; in Developer mode, a trace of tool names and raw JSON |
| Answer | Scout's questions appear above the composer | Several at once; no "I don't know, ask someone" |
| Follow | Returns later | Must find the project in the rail; no notification; "Gate 1" means nothing yet |

**Success:** submits a first project unaided; can say in one sentence what happens next.

## Approver - Priya

**Job stories**

- When a gate is waiting for me, I want to know what I am approving and what it commits us to,
  so I don't sign something wrong.
- When something is missing, I want to send it back with notes the agent will act on, so I
  don't have to chase anyone.
- When I am not the right person, I want to hand the decision to someone else.

**Emotional job:** *"Don't let me sign off on something I'll regret."*

**Journey today**

| Stage | What happens | Friction |
|---|---|---|
| Notice | "N need you" badge in the top bar | Counts every gate for everyone, not hers; no notification outside the console |
| Orient | Opens the project; reads the thread | Long thread; the gate card assumes she has read everything above it |
| Understand | Opens the artifact | Tab says "Requirements" even for a quality report; Developer mode shows JSON |
| Decide | Ticks criteria, signs | Criteria lead with IDs; Gate 3 talks about `[WIP]` pull requests and Copilot |
| Confirm | 12-second undo | A number counting down; afterwards a checkpoint row |

**Success:** signs with every criterion read; decision time from gate opening to signature.

## SME - Sam

**Job stories**

- When Scout needs my knowledge, I want to answer from a link in a minute, so I can get back to
  my work.
- When I only know part of the answer, I want to say so without blocking the project.

**Emotional job:** *"Respect my time; don't make me learn a tool to answer a question."*

**Journey today:** there is no SME path. Someone must forward the project link; Sam lands in
the full workspace, has to find the questions above the composer, and answers inside a
conversation that is not his.

**Success:** answers from a link without signing in to anything beyond Entra; response time.

## Analyst - Avery

**Job stories**

- When I review a spec, I want to see where every requirement came from, so I can defend it.
- When the build is reviewed, I want to know which requirements are met and which are not.
- When I report upward, I want to export a clean document.

**Emotional job:** *"Give me something I can trust and hand to someone else."*

**Journey today**

| Stage | Friction |
|---|---|
| Read | Citations are a badge and a quote; the source cannot be opened |
| Trace | Requirement, build task, finding and demo line live in four documents with no links between them |
| Compare | No view of what changed between drafts |
| Share | No export; no link to a section |

**Success:** finds the source of any requirement in two clicks; exports a document without
reformatting it.

## Developer - Dev (secondary)

Today's primary user, well served by Developer mode: the tool trace, raw JSON, token counts,
pull requests. Keep all of it one switch away. **Nothing in the redesign removes detail; it
changes the default.**

## Leadership viewer - Lee (secondary)

Wants the portfolio at a glance and the demo. Served by Home's bento and the portfolio board;
never asked to sign or answer.

## The role-aware home

The first-run question - *"What brings you here?"* - sets a role, which sets the default
detail level and what Home shows first. Anyone can change it in Settings.

| Role | Home leads with | Default detail |
|---|---|---|
| Requester | *Start something* (starters and guided intake), then *Your projects* with plain status | Simple |
| Approver | *Waiting for approval* - gates waiting, oldest first, with what each one commits to | Simple |
| SME | *Questions for you* | Simple (lands on the answer-only view from links) |
| Analyst | *In flight* with coverage and open questions, then recent artifacts | Simple, Detailed one click away |
| Developer | *In flight* with run status and builds | Detailed |
| Leadership | Portfolio summary and recently shipped demos | Simple |

"Needs you" becomes personal once gates have an assigned approver (backend). Until then, show
it as *Waiting for approval* rather than implying ownership.

## Adoption metrics

| Metric | Persona | Where it comes from |
|---|---|---|
| First project created in the first session | Requester | Project creation events |
| Intake abandonment (started typing, never sent) | Requester | Client analytics, if added |
| Time from gate opening to decision | Approver | Decision timestamps (needs the decisions endpoint) |
| Gates signed with every criterion expanded or viewed | Approver | Client analytics, if added |
| Time from question asked to answered | SME | Distill task-token wait duration |
| Weekly active users by role | All | Role preference plus sign-ins |
| Share of users on Detailed mode | All | Preference - a rising share means Simple is missing something |

Analytics are not instrumented today. Adding them is a separate decision with its own privacy
review; nothing here assumes they exist.

## Test plan

After Roadmap Phase 1, run a moderated session with 3-5 colleagues who have never used the
console (at least one each: requester, approver, SME). Tasks:

1. Start a project from a one-paragraph idea and one attached document.
2. Say, without help, which crew member is working on it and what happens next.
3. Answer a question Scout asked, from a link.
4. Find a project that is waiting for approval and explain what approving would commit to.
5. Find where one requirement came from.

Record where each person hesitates; update these personas and the audit with what was
actually observed.
