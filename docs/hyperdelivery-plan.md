# Hyperdelivery Run Stage MVP – Build Plan

**Under Armour | Data and AI | Hyperdelivery**

## Purpose

This is a starting plan for building the Hyperdelivery factory to a working MVP: a single
project traveling the full line from stakeholder conversation to a demonstrable deliverable,
with agents doing the work and humans approving at each handoff.

The target is not the complete factory. It is the shortest path to proving the line works end
to end, with enough governance that the output can be trusted and enough measurement that we
can tell whether it is faster than what we do today.

## At a glance

| Phase | Focus | Timing |
| --- | --- | --- |
| Phase 1 | The Agent Suite | Weeks 1 to 2 |
| Phase 2 | Front End and Orchestration Layer | Weeks 3 to 4 |
| Phase 3 | Memory, MCP and Integrations | Weeks 5 to 6 |
| Phase 4 | Polish, Pilot and Harden | Weeks 7 to 8 |

## Phase 1: The Agent Suite

*Sprint 1, two weeks*

Build the four reasoning agents that carry a project from a stakeholder conversation to a demo
ready deliverable. Each agent owns one station on the line and produces one named artifact that
the next agent consumes.

### Distill Agent

The agent responsible for requirements mining from stakeholders and SMEs. It asks structured
questions about the project across business processes, business logic, data requirements, data
sources, and success measures, then drafts what it understands and surfaces what it does not.

- **Input**: meeting transcripts, existing documents, and direct answers from SMEs
- **Behavior**: it plans and asks before it drafts, so gaps get closed by structured elicitation
  rather than by agent guesswork
- **Deliverable**: a Functional Specification Document (FSD) in which every requirement carries
  a citation back to its source

### Blueprint Agent

The agent responsible for translating the signed FSD into a Technical Design Document (TDD) and
the technical tasks required for development, sized for seamless pass off to an AI coding agent.

- Covers architecture, data model, component breakdown, and integration points
- Selects the golden path template so every project starts from the same shape rather than a
  fresh opinion
- Decomposes the design into tasks small enough for one coding agent run to complete, each
  linked to the FSD requirement it implements
- **Deliverable**: a TDD plus an ordered task list ready for assignment

### Review Agent

The agent responsible for reviewing the current state of the deliverable against the FSD and the
TDD. Identifies gaps, mistakes, and deviations from standards.

- Runs against the built application and the code, not only the latest change
- Reports severity and traces every finding back to the requirement or design element it
  violates
- **Deliverable**: a gap report the developer works from, plus a coverage view showing which
  requirements are actually met

### Showroom Agent

The agent responsible for creating and preparing the demo of the deliverable, whether a video, a
slide deck, an animation, or the built application prepared for the developer to demo to the
team.

- Seeds the application with realistic data so the demo shows the real thing rather than an
  empty shell
- Writes the talk track against the FSD acceptance criteria, so the demo shows what was actually
  asked for
- **Deliverable**: a demo package the team can present without building slides by hand

**Acceptance criteria**: Each of the four agents can be invoked manually by hand against a
sample project and produces its artifact in the agreed format.

## Phase 2: Front End and Orchestration Layer

*Sprint 2, two weeks*

Give people somewhere to work with the agents and give the agents a controller that sequences
them, so a human is no longer triggering each step by hand.

### Front end

- **Project console**: create a project, see where it sits on the line, and open its artifacts
- **Structured intake**: one template for either initiator, capturing scope, success measures,
  the data involved, and whether an application is the right answer at all
- **Artifact review surface**: read the FSD and TDD with citations that resolve to their
  source, comment inline, and request changes
- **Approval surface**: approve or reject at each handoff, with the decision, the signer, and
  the artifact version recorded
- **Notifications**: who owes a decision, and how long it has been waiting

### Orchestration

- A state machine per project, one state per station, so the line advances on its own
- **Human hold pattern**: pause at an approval, survive a multi-day wait, and resume cleanly on
  the decision
- **Clean handoffs**: each agent receives one bounded artifact rather than an accumulated
  conversation, which is what keeps quality stable across a long project
- **Audit trail**: FSD version, prompt version, model version, and signer recorded on every
  decision
- **Iteration loop**: a defined return path from Showroom back to Blueprint, with a pass counter
  and an agreed stopping point

**Exit criteria**: A project moves through Distill, Blueprint, build, and Showroom under
orchestration, with approvals holding the line and every decision recorded.

## Phase 3: Memory, MCP and Integrations

*Sprint 3, two weeks*

Replace hand supplied inputs with live enterprise sources and give the agents durable memory so
the factory accumulates knowledge instead of starting fresh every project.

### Memory

- **Project corpus**: source documents normalized and stored with provenance, so a citation can
  always be resolved
- **Retrieval**: an index the Distill Agent queries while mining, rather than being handed a
  folder
- **Specification store**: versioned FSDs and TDDs with a traceability record running from
  requirement to task to built change
- **Working state**: session and project memory, so an agent resumes correctly after a review
  that took days

### MCP and connections

- A single outbound tool boundary, with every system behind its own connector, so a better
  vendor tool can be swapped in without touching agent logic
- Least privilege credentials scoped to the project rather than the whole tenant
- **Microsoft 365** for Teams transcripts and SharePoint documents
- **Atlassian** for Confluence pages and Jira tickets
- **GitHub** for repositories, issues, and pull requests
- **Snowflake** for live schema metadata and the project development schema

### Integrations

- **Coding agent hand off**: approved tasks become issues and are assigned automatically, one
  pull request per task
- **Continuous integration**: lint, tests, build, and security scanning on every push
- **Environments**: a preview per pull request, and a sandbox deployment for the demo

**Acceptance criteria**: The Distill Agent mines real Teams and SharePoint content, the
Blueprint Agent reads live Snowflake metadata, and approved tasks reach the coding agent without
anyone copying them across.

## Phase 4: Polish, Pilot, and Harden

*Sprint 4, two weeks*

Make the line trustworthy enough to put a real project through it, and hand it to someone who
did not build it.

- **Quality bar**: golden evaluation sets per agent, and a regression check that blocks any
  change which lowers output quality
- **Security close out**: threat model resolved, prompt injection and data handling reviewed and
  signed off
- **Pilot run**: one real project through the full line, with the team watching
- **Measurement**: the manual baseline recorded before the pilot, then cycle time and
  intervention counts after, so the speed claim is evidence rather than assertion
- **Documentation and runbook**: how to operate the line, what fails, and who to call
- **Handover**: a named owner and a support path
- **Buffer**: this phase is deliberately lighter than the others, so slippage from phases one to
  three has somewhere to go

**Acceptance criteria**: A real project has been through the line, measured against the
baseline, with security signed off and the runbook handed over.
