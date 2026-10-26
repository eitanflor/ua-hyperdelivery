<!-- Point-in-time research, retrieved 2026-10-25 for the UA-DLC plan (second research round: orchestrator, delegation, resources). Claims carry source links; vendor features and dates change quickly, so verify before acting. Section numbers cited for platform-architecture.md were checked against its v3 revision. See README.md in this folder. -->
<!-- cspell:words BYOC Brooker Checkpointing Daytona Fargate Landlock bubblewrap checkpointed checkpointer ciphertext exfiltration fsyncs langgraph linearizes redb seccomp strandsagents syscall syscalls traceparent -->

# Strands Box, Dogwood, and orchestration for HyperDelivery

> Stage numbers here predate the three-phase plan (2026-10-26): Stages 1 to 3 are now the Final MVP and its pilot; Stages 4 and 5 are Enterprise.

Research key: `strands-box-orchestration`. Date: 2026-10-25. Builds on
[platform-architecture.md](../platform-architecture.md) (sections 2, 4, 8, 9, 10) and
[enterprise-integration-platform.md](enterprise-integration-platform.md) (section 4), and does not repeat
their sandbox and preview tables.

## Bottom line

- **Strands Box is the wrong unit to adopt now, and the right ideas to adopt now.** It is a
  v0.1.0 developer preview (released 7 Oct 2026), stable only on macOS with Apple silicon, with
  Linux ARM64 behind an explicit experimental opt-in. It is a local sandbox, not a hosted one.
  AWS's own guidance is to put it inside a per-session microVM such as AgentCore Runtime for
  multi-tenant cloud use, and "bring Box to deployed agents" is still on the roadmap.
- **Dogwood is usable today through AgentCore Policy**, which now accepts Dogwood temporal
  policies on Gateway tool calls. Use it for rate limits, ordering ("no push unless tests
  passed") and taint rules ("no outbound call after reading restricted data"). Do not use it for
  the human gates: windows are capped at 24 hours, history is per policy session, and the
  session ID is supplied by the caller. The plan's signed gate tokens stay.
- **The Box security model validates the plan's direction** and makes explicit six rules the plan
  only partly states: enforce outside the agent process; the agent never holds a secret; a credential
  binding is not an authorization; anything sharing a sandbox shares its credentials; deny cloud
  metadata explicitly; and record every decision with the rule that made it.
- **Orchestrator:** one voice and one loop. Keep the current Strands per-request agent as the
  main session's orchestrator, and delegate only where context, trust domain or independence
  demands it: Snowflake work to Cortex Code, coding to a sandboxed coding agent, heavy resource
  reading to a reader, and checking to fresh-context verifiers. Every delegation crosses a typed,
  versioned contract owned by `core/`, not by a framework.
- **Do not move from Strands to LangGraph now.** LangGraph's main advantage, durable checkpointed
  human-in-the-loop, is already provided one layer up by Step Functions and the signed decision
  record. Revisit on stated triggers. If LangGraph or Deep Agents is wanted for one specialist,
  host it behind the same contract on its own runtime.

## 1. What Strands Box and Dogwood are

### Dogwood and its engines

- **Dogwood** (Apache-2.0, announced August 2026) is a policy language that accepts all Cedar
  and adds `when temporal { ... }` clauses over a history of tool-call request and response events:
  `formerly within`, `since within`, and counts, distinct counts and sums over a window, built on
  metric first-order temporal logic. Cedar's deny-by-default and forbid-overrides-permit semantics
  carry over. Temporal clauses lose Cedar's automated-reasoning analysis
  ([AWS blog](https://aws.amazon.com/blogs/opensource/introducing-dogwood-runtime-verification-for-ai-agents/),
  [repo](https://github.com/dogwood-policy/dogwood)). The repo's interpreter is a reference
  implementation, not for production.
- **Dogwood Local Engine** (Apache-2.0, released around 30 Sep 2026, v1.1.0 on 9 Oct 2026) is an
  embeddable Rust library that linearizes events under a lock, fsyncs each to a redb log, keeps
  per-clause summaries, snapshots and prunes, and applies a policy update only to events after the
  update. Evaluation time grows with the number of events in a window: in AWS's benchmark a 24-hour
  window reached about 6 ms per decision after 12 hours, while a 15-minute window plateaued. The
  wrapping application owns event capture, event provenance, enforcement and protection of the
  engine's state files
  ([AWS blog](https://aws.amazon.com/blogs/opensource/introducing-the-dogwood-local-engine-temporal-governance-for-agent-actions/),
  [repo](https://github.com/dogwood-policy/dogwood-local-engine)). There is no Python binding.
- **AgentCore Policy temporal policies** run Dogwood on Gateway tool calls. History is scoped to a
  *policy session* identified by the `x-amzn-bedrock-agentcore-policy-session-id` header, which the
  caller generates; AgentCore propagates identity across Gateway and Runtime hops within one
  account and Region. Quotas are 20 temporal policies per engine, 3 temporal operators per policy
  and a 24-hour maximum window. Changing a temporal policy invalidates open sessions (HTTP 409),
  and rate limits apply per session, not per caller. LOG_ONLY mode is supported
  ([temporal policies](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-temporal.html),
  [policy sessions](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-session-based-temporal.html)).

### Strands Box

Box is a harness-agnostic sandbox, written in Rust, that pairs operating-system containment with
Dogwood policy ([launch post](https://aws.amazon.com/blogs/opensource/introducing-strands-box-ai-agent-sandboxes-powered-by-dogwood/),
[repo](https://github.com/strands-agents/box),
[Marc Brooker's overview](https://strandsagents.com/blog/strands-box-the-big-picture)).

- **Two tiers.** `box.toml` sets direct grants that the OS enforces for the workload's own system
  calls. `policy.dw` decides every request the workload sends through Box's *trusted process*.
  Direct grants are standing access: policy never sees those reads or writes, and they never enter
  the history ([architecture](https://github.com/strands-agents/box/blob/main/docs/design/architecture.md)).
- **Four enforcement points** share one engine and one durable history per box: Strands Shell and
  Monty (Pydantic's Python interpreter), both running *outside* the sandbox and reached through
  alias binaries (`bash`, `python3`) over a local socket; an egress gateway that is the only route
  out; and an MCP broker. A shell command becomes `shell:exec` on the resolved command plus one
  `fs:*` decision per file it touches, so `rm -rf build/` is refused file by file before anything
  is deleted. External programs (`git`, compilers) and stdio MCP servers run in their own wider
  "leaf" sandboxes after a `shell:spawn` permit, with no route back to Box.
- **Isolation.** Seatbelt on macOS; on Linux, namespaces, a mount view and a syscall permit filter,
  ARM64 only, with Landlock rejected because it cannot deny all network. No VM, no container. A
  kernel escape defeats it; tenant isolation, resource limits and side channels are explicit
  non-goals ([security model](https://github.com/strands-agents/box/blob/main/docs/design/security.md),
  [limitations](https://github.com/strands-agents/box/blob/main/docs/design/limitations.md)).
- **Lifecycle.** `box run` hardens its own process, validates configuration once and then acts on
  file identities, takes an exclusive lock on the box directory, opens the decision collector,
  refuses a policy that does not validate (or contains a rule it can prove never fires), resolves
  secrets, starts the gateway with a per-box certificate authority, prints every direct grant to
  stderr, then starts the agent through a trampoline. Teardown reaps the workload first. There is
  no daemon and no stop verb; the caller ends the process and deletes the directory.
- **Interfaces.** A frozen CLI (`run`, `policy generate-schema`), a Rust library
  (`strands_box::run`, one box per host process), nine `box.toml` keys, and an action vocabulary
  (`shell:exec`, `shell:spawn`, `fs:*`, `net:connect`, `http:request`, `mcp:call`). A refusal is an
  HTTP 403 or tool error naming the rule's `@id` and `@description`, so the agent can adapt rather
  than retry.
- **Networking and secrets.** The gateway terminates TLS, raises `net:connect` and `http:request`
  with host, port, method and path, and attaches credentials. The workload gets a random phantom
  token; the gateway swaps in the real value only on a permitted TLS request to the bound
  destination, redacts the secret from responses, and refuses compressed responses it cannot scan.
  `aws://` routes sign with SigV4 from a named profile and never fall back to ambient credentials.
  Binding a secret permits nothing, every process in one box shares every route, and the gateway
  has no built-in metadata block, so 169.254.169.254 must be denied in policy
  ([credentials](https://github.com/strands-agents/box/blob/main/docs/design/credentials.md)).
- **Observability.** Every effective decision is written as both an OTLP span and log record, by
  default to a JSONL file the workload cannot reach; the box also relays the agent's own OTel data,
  strips a reserved namespace, and ignores the not-sampled flag for its own decisions. Shell records
  keep only literal arguments so command substitution cannot leak secrets. Records are not signed
  or chained, and delivery is best effort
  ([telemetry](https://github.com/strands-agents/box/blob/main/docs/design/telemetry.md)).
- **Use by agents.** The agent runs unmodified; its shell and Python calls hit the aliases. The
  repo ships examples for Claude Code, Codex CLI, pi, the Strands CLI and a Strands SDK agent, plus
  an LLM skill for writing policies.
- **Maturity.** Apache-2.0, v0.1.0 only, repo created 2 Oct 2026, about 470 stars and 66 open
  issues at the time of reading, Linux ARM64 packaging added 23 Oct 2026 behind
  `EXPERIMENTAL_LINUX_SUPPORT=TRUE`. Performance targets (under 1 ms per decision, under 50 ms
  startup) are stated as asserted, not benchmarked. The interpreters sit in the trusted process,
  so a memory bug in either is code execution with the box's secrets in reach; AWS calls this a
  wider trusted computing base and mitigates it with Rust, fuzzing and testing.

### How it compares

| Option | Boundary | Policy depth | Secrets | Fit for HyperDelivery |
|---|---|---|---|---|
| Strands Box | OS sandbox (Seatbelt, Linux namespaces) | Semantic and temporal per file, command, HTTP path and MCP tool | Phantom token, gateway injection | Developer laptops now; inside a microVM later |
| AgentCore Code Interpreter | Managed containerized sandbox; 15 min default up to 8 h; Sandbox, Public or VPC network | Network mode and IAM role; no per-command policy ([docs](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/code-interpreter-tool.html)) | Execution role | Short analysis on documents, never data extracts |
| AgentCore Runtime | Firecracker microVM per session, 8 h maximum, 15 min idle, memory sanitized at end ([docs](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-how-it-works.html)) | Tool policy on Gateway (Cedar and Dogwood) | Identity vault, Gateway outbound auth | Orchestrator and specialist runtimes; host for a future Box |
| E2B | Firecracker microVM; BYOC on AWS for enterprise | None built in | Your code | Live coding sandboxes if AgentCore falls short |
| Daytona | Containers by default, VMs optional | None built in | Your code | Riskier than earlier research assumed: the open repo was archived and development moved private in June 2026 ([repo notice](https://github.com/daytonaio/daytona)) |
| Plain containers or Fargate | Namespaces and seccomp (shared kernel for Docker) | None unless you add a proxy | Your code | Previews (ECS Express Mode), as planned |
| Anthropic sandbox-runtime | bubblewrap or sandbox-exec plus a domain allowlist proxy | Domain-level only; no TLS inspection, so domain fronting is possible ([docs](https://code.claude.com/docs/en/agent-sdk/secure-deployment)) | Proxy | Same niche as Box, less policy |

Box's niche is the gap the others leave: microVMs isolate well but see only ciphertext and block
I/O, and containers see syscalls but not MCP calls or HTTP paths. Box sees semantic actions but is
only as strong as the host kernel. Brooker's recommendation is layering: Box for fine policy, a
per-session microVM for the hard boundary, and AgentCore Policy for tool calls.

## 2. Security lessons for an enterprise HyperDelivery

1. **Containment and policy are separate layers, and both are needed.** AgentCore Runtime gives
   the boundary; AgentCore Policy gives tool semantics; a Strands intervention gives an in-process
   floor. Ship all three, in that order of trust.
2. **A check inside the agent's process is a floor, never a wall.** The Stage 1 before-tool-call hook
   (the do-no-harm floor, platform-architecture section 2) is the floor. The wall is Gateway policy plus a service
   identity that only a signed gate token unlocks, which the plan already has. Write that
   distinction into the threat model.
3. **The agent never holds the secret.** No GitHub, Atlassian or Snowflake token inside any agent
   or sandbox environment. Use AgentCore Identity and Gateway outbound auth, or a credential-
   injecting egress proxy for a self-built coding sandbox.
4. **A credential binding is not an authorization.** Each destination needs its own permit;
   holding a token for `api.github.com` must not imply every path on it.
5. **Whatever shares a sandbox shares its credentials.** Box cannot give one process a credential
   and deny it to another in the same box. Specialists with different credential domains
   (Snowflake, GitHub, Atlassian writes) must run in separate runtime sessions with separate IAM
   roles, never as tools inside one process.
6. **An allowed destination is an exfiltration channel.** Allowlists need path-level rules and
   TLS termination to mean much; domain allowlists alone are weak.
7. **Deny cloud metadata explicitly.** Neither Box nor a typical proxy blocks 169.254.169.254 or
   container metadata endpoints by default.
8. **Temporal rules catch what point-in-time rules cannot:** at most N Jira writes per session,
   no push unless tests passed since the last change, no outbound request after a restricted read.
   Write them as `::request` counts, not `::response`, or concurrent calls slip past the cap
   (a pitfall the Dogwood post demonstrates). Have trusted code, not the model, set the policy
   session ID, or a compromised agent can reset its own counters.
9. **Log the decision, with the rule.** Every allow and deny should carry the rule ID and a
   description the agent can read. This feeds the trace's failed and retry markers and the Layer 2
   ledger. Box's own records are not tamper-evident, so HyperDelivery still needs the planned
   hash-chained audit (Stage 4).
10. **Disclose the effective grants at start.** Record, per runtime session, what the agent could
    reach: identity, tools, destinations, data envelope. It answers the reviewer's first question.
11. **Code the agent writes escapes the sandbox's policy when it runs elsewhere.** Previews and CI
    need their own controls, as platform-architecture section 10 already requires.
12. **Fail closed and refuse degraded modes.** A sandbox that cannot apply its policy should not
    start; a policy that cannot fire should not load.

## 3. Orchestration options

### Strands (strands-agents 1.62.0; HyperDelivery pins 1.53.0)

- **Agents as tools:** pass an `Agent` in `tools`, or `.as_tool(name, description,
  preserve_context, delegate)`. Context resets per call by default; `delegate=True` returns the
  specialist's answer, structured or not, without another orchestrator model call (one delegated
  tool per turn); `structured_output_model` gives a Pydantic result
  ([docs](https://github.com/strands-agents/sdk-python/blob/main/site/src/content/docs/user-guide/sdk/multi-agent/agents-as-tools.mdx)).
- **Graph** (developer-defined edges, LLM picks the path, cycles allowed), **Swarm** (agents hand
  off autonomously over a shared transcript), and **Workflow** (a fixed DAG, as a pattern).
  `invocation_state` passes context to tools and hooks without exposing it to the model.
- **Interrupts** from hooks (`BeforeToolCallEvent`, `BeforeToolsEvent`, `BeforeNodeCallEvent`) or
  tools, persisted by a session manager so a person can answer later; sub-agent interrupts surface
  at the orchestrator. In Graph and Swarm only the orchestrator may have a session manager.
- **Interventions** (Proceed, Deny, Guide, Confirm, Transform) and a vended **Cedar authorization**
  handler at the tool-call boundary, fail-closed when identity is unknown. These are the natural
  implementation of the floor's write rule.
- **A2A** client and server, but pinned to `a2a-sdk>=0.3,<0.4`, the pre-1.0 protocol.
- **Strands harness** (0.3.x) adds a `generalist` subagent that inherits the parent's
  interventions and sandbox, so delegation cannot bypass an approval gate.

### LangGraph, LangChain, Deep Agents, LangSmith

- **Checkpointing** per super-step into threads, with pending writes, time travel and optional
  encryption ([docs](https://docs.langchain.com/oss/python/langgraph/checkpointers)).
  `langgraph-checkpoint-aws` provides AgentCore Memory and DynamoDB-with-S3 savers.
- **Interrupts**: `interrupt()` anywhere in a node, resumed with `Command(resume=...)` on the same
  thread; typed `response_schema` since 1.2.12; the node re-runs from its start on resume, so side
  effects before the interrupt must be idempotent
  ([docs](https://docs.langchain.com/oss/python/langgraph/interrupts)).
- **Subgraphs** with per-invocation (default), per-thread or stateless persistence; per-thread
  subagents cannot take parallel calls.
- **Deep Agents** (0.7.32, still pre-1.0): subagents in `isolated` (task only) or `fork` mode, with
  their own tools, permissions, `interrupt_on` and `response_format`; **async subagents** expose
  start, check, update and cancel against an Agent Server
  ([docs](https://docs.langchain.com/oss/python/deepagents/async-subagents)).
- **LangSmith**: tracing, evaluation, deployment. Self-hosting is an Enterprise add-on on
  Kubernetes ([docs](https://docs.langchain.com/langsmith/self-hosted)). LangChain's own comparison
  page favors Deep Agents over the Claude Agent SDK; read it as vendor material.

### Claude Agent SDK and OpenAI Agents SDK

- **Claude Agent SDK** (0.2.174): subagents through the Agent tool; only the prompt string goes in
  and only the final message comes back; per-subagent tools, model, `maxTurns`, background mode
  and resume by agent ID. The agent runs inside its sandbox and you build the server
  ([docs](https://code.claude.com/docs/en/agent-sdk/subagents)). Good fit for a coding specialist
  inside one runtime session.
- **OpenAI Agents SDK** (0.24.0): agents as tools keep the manager in control; a **handoff**
  transfers the conversation, and by default the receiver sees the whole history unless an
  `input_filter` trims it ([docs](https://openai.github.io/openai-agents-python/handoffs/)). For
  HyperDelivery, handoffs are the wrong default: they move the voice and leak context.

### Protocols as boundaries

- **MCP 2026-07-28** is stateless (no initialize handshake or session header), adds
  `server/discover`, moves tasks to an extension with `tasks/get`, `tasks/update` and
  `tasks/cancel`, replaces server-initiated requests with `input_required` results, allows full
  JSON Schema in `outputSchema` and any JSON in `structuredContent`, and documents `traceparent`
  in `_meta` ([changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)).
  That makes "specialist as an MCP tool with a typed result" a clean wire contract, and AgentCore
  Gateway can put Policy in front of it.
- **A2A 1.0** (March 2026) adds signed Agent Cards, multi-tenancy, modern OAuth flows and breaking
  renames ([what's new](https://a2a-protocol.org/latest/whats-new-v1/)). Strands and the AgentCore
  Runtime A2A samples still use the 0.3 SDK. Use A2A at the organization edge (Atlassian's Rovo A2A
  gateway, Microsoft's Work IQ) once SDKs catch up, not for internal calls.
- **AG-UI** is supported by AgentCore Runtime as an agent-to-user streaming protocol; worth
  evaluating as the console's event contract next to `protocol.ts`.

### Design guidance

Anthropic's October 2026 advice: one loop with skills and tool search usually beats specialist
subagents; split by *context*, not by team; give each subagent work that needs little from the
rest and have it return a compact result; keep a full handoff only when the specialist must talk to
the user; tool choice degrades past roughly 30 to 50 tools; one customer saw about 2x faster runs
from a single loop ([article](https://claude.com/resources/articles/building-agents-when-to-fold-subagents-into-your-main-agent-loop)).
Anthropic's research system shows the orchestrator-worker case where it pays: parallel, breadth-first
work returning condensed findings ([post](https://www.anthropic.com/engineering/multi-agent-research-system)).
Cognition's counterpoint: decisions hide in actions, so split agents that do not share context make
conflicting choices ([post](https://cognition.ai/blog/dont-build-multi-agents)). Snowflake work and
coding meet the "split by context" test: each is context-heavy, runs in a different trust domain,
and can return a small typed answer.

## 4. Recommendation: the HyperDelivery orchestrator

### Shape

The orchestrator is the existing per-request Strands agent, promoted to own the main chat session:
one system prompt owned by the platform team, station procedures as skills, thin read tools
through Gateway, and a handful of delegation tools. Session state persists per project
(Strands `SnapshotSessionManager` on S3, or AgentCore Memory short-term).

| Specialist | Why it is separate | Runs where | Returns |
|---|---|---|---|
| Snowflake (Cortex Code) | Data gravity: rows stay in Snowflake | Snowflake-managed coding conversation, or Cortex Code through the Cortex Agent SDK with `output_format` | `DataFindings`: objects, certified views, definitions, grain, counts, query IDs, caveats |
| Coding agent | Long-running, needs a workspace and a different credential domain | Copilot coding agent today; later an AgentCore Runtime session (Claude Agent SDK or Strands harness) | `BuildResult`: repo, branch, PR, checks, tests, files changed |
| Resource reader | Large inputs (recordings, folders, spaces) would flood the main context | Fresh-context agent with read-only, on-behalf-of identity | `ResourceDigest`: statements with locators, decisions, questions, people |
| Verifiers (brief critic, security, review finders) | Independence from the author | Fresh context, read-only | `Findings` with severity and evidence |

Station agents stop being chat personas. They remain artifact producers with typed outputs that
the server re-scores, invoked at gates as today.

### The contract

Put it in `src/core/domain/delegation.py`, Pydantic, framework-free, versioned, exported as JSON
Schema and mirrored in the console, with a drift test like `test_protocol_constants.py`.

- **`DelegationRequest`**: delegation ID, project, station, specialist (an `AgentName`-style
  constant), objective, resource references (`jira:KEY`, `confluence:page@version`,
  `graph:driveItem`, `teams:recording`, `s3:key`, `snowflake:object`) rather than content,
  constraints (tier, data envelope, read-only), budget (turns, cost, deadline), output schema ID and
  version, acting identity, optional gate token, and the W3C `traceparent`.
- **`SpecialistResult`**: status (`completed`, `needs_input`, `partial`, `failed`, `refused`), a
  bounded summary, a typed payload, evidence references with locators (query ID, page anchor,
  file and line, PR URL), declared side effects (empty unless a gate token was presented),
  questions, usage and cost, provenance (specialist, prompt and model versions) and policy
  refusals. Large payloads go to S3 and travel as references.

Rules: specialists start isolated (no transcript) and fetch referenced resources with their own
least-privilege identity; results are validated at the boundary, including a grain check that
rejects row-level Snowflake data; specialist output is untrusted input to the orchestrator, and
instruction-like text is flagged; budgets and the 2-CI-round, 3-review-round limits apply.

### Transports, behind one interface

A `Specialist` port with `run()` for short work and `start/get/update/cancel` for long work, and
adapters in `providers/`: an in-process Strands agent wrapped in a `@tool` that returns the
validated model; a separate AgentCore Runtime per credential domain, reached through Gateway as an
MCP target so the same Cedar and Dogwood policy applies; the Cortex Agent SDK; and a GitHub adapter
that turns Copilot issue and PR events into `BuildResult`. Long work never blocks chat: the
delegation starts, Step Functions or EventBridge waits, the result lands in the project timeline
and the orchestrator picks it up next turn or notifies in Teams. Each delegation is an
`invoke_agent` span carrying the specialist name, status, retries and cost, linked to its parent,
which is exactly what the planned trace view needs for lanes, handoff connectors and failure
markers.

### Policy layers per write

Strands intervention (Cedar) as the floor, AgentCore Policy on Gateway (Cedar plus Dogwood
temporal rules) as the wall, and a service identity unlocked only by the signed gate token for
every external write.

### Strands or LangGraph

Stay on Strands through Stage 4: the code already builds per-request agents with structured output and
hooks; Strands is AgentCore-native; interventions, Cedar, interrupts and delegate mode now cover
what the orchestrator needs; and cross-day durability belongs to Step Functions, where the signed
decision record lives. Reconsider if any of these hold: the in-session plan becomes a stateful
graph that must resume mid-run after crashes and needs time travel; long-running specialists need
steering and cancellation that Strands cannot express; Strands lags on standards that matter (watch
A2A 1.0); or the team standardizes on LangSmith evaluation. The low-risk path is to build one
specialist (for example a Deep Agents coding agent with a sandbox backend and the AWS checkpointer)
on its own runtime behind the contract.

### Keep it framework-agnostic

No framework types in `core/`; contracts as Pydantic plus JSON Schema; MCP `outputSchema` as the
default wire; OTel GenAI conventions for traces; a conformance test suite every adapter must pass;
and prompts, skills and golden evaluations stored as data, so a framework swap replaces adapters,
not the product.

## 5. Box adoption sequence

As the plan adopted it (platform-architecture section 2):

1. **Stage 1 (the do-no-harm floor):** upgrade Strands and use interventions plus Cedar for the
   floor's write rule.
2. **Stage 3:** replay real traces with the `dogwood` CLI in CI as policy tests for three rules (Jira
   write rate per session, push only after green tests, no egress after restricted reads). Offer Box
   to engineers who run coding agents on their Macs against HyperDelivery repositories; low risk and
   builds policy-writing skill.
3. **Stage 4:** run the same three rules through AgentCore Policy in LOG_ONLY, then enforcing.
4. **Later:** when Linux support is stable, test Box inside an AgentCore Runtime session (both are
   ARM64) for the self-built coding sandbox, keeping the microVM as the boundary.

## Open questions and limits

- Whether Box's Linux namespace launcher works inside AgentCore Runtime microVMs (user namespaces,
  seccomp availability) is untested and undocumented.
- General-availability status of AgentCore Policy temporal policies should be confirmed with AWS;
  the documentation does not label it preview.
- Whether the Cortex Agent SDK's managed coding conversation can run under HyperDelivery's
  External OAuth workspace roles (platform-architecture section 6) needs a Snowflake spike.
- Daytona's archive notice was read from the repository; I found no public announcement.
- Not accessed: the Strands Box getting-started page on strandsagents.com (the repo copy was
  read), the AgentCore temporal policy examples page, and the full Dogwood guide. Version numbers
  come from PyPI and GitHub on 2026-10-25.
