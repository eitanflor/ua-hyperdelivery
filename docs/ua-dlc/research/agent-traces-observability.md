<!-- Point-in-time research, retrieved 2026-10-25 for the UA-DLC plan. Claims carry source links; vendor features and dates change quickly, so verify before acting. See README.md in this folder. -->
<!-- cspell:words ADOT Arize Beamline Brainstore Braintrust GENAI Höller SEMCONV TTFT adriangalilea distro genai noeviction paywalled semconv traceparent unredacted -->

# Agent traces, inspection and decision visualization: research for HyperDelivery

Key: `agent-traces-observability`. Researched 2026-10-25. The web-search budget ran out partway through. After that, findings come from direct fetches of known URLs and from repos cloned locally. Anything I could not verify is marked.

## 1. The three posts and what they link to

**Flo Höller, "Agent tree component, see who started whom"** ([post](https://x.com/flohoeller/status/2112150373565612534), 19 Oct 2026, about 224k views and 3.8k likes). The post is a 23-second video. The thumbnail shows an "Agents" header with run counters ("1 agent · 1 running · $0.06") and one Orchestrator card. The card shows the model, a Running chip, tool logos (Slack, Notion, GitHub), a plain-language goal ("Launch the new pricing page by Friday"), and the cost and time elapsed. The [affectUI catalog](https://www.affectui.com/llms.txt) says the full component grows into a live tree of sub-agents. Each card shows status, cost and time, costs roll up each branch, and branches fold to one line. The [component page](https://www.affectui.com/components/agent-tree) suggests other components for nearby needs: Agent Lanes for "when things happened", and Agent Plan for a single agent's steps. Agent Tree is a paid Pro component. The replies are useful design input:
- One asks for **"waiting on" edges**, because a writer can be blocked on a researcher that neither of them started. Dependency is not the same as parentage.
- One asks whether a parent's cost includes its children. Rollup rules have to be stated explicitly.
- One finds it too big and suggests a compact DAG rail with cards attached. Another suggests a sideways tree with a **sticky parent** for runs with 50+ children.
- One prefers not to see sub-agents unless they ask, calling it "babysitting". This matches UA's early feedback.

**Flo Höller, decision tree** ([post](https://x.com/flohoeller/status/2113565484469686342), 23 Oct 2026). The thumbnail is fully legible. It reads "Decisions · 3 waiting for you · 1 of 3". On the left is a "High risk" card from an incident agent. It asks a plain-language question about checkout errors after a deploy and states the business impact (error count, and roughly $3.2k of orders per hour at risk). Four numbered branches follow: roll back (labeled **"Agent's pick"**), hotfix, flag off, and "Other…". Each branch opens into follow-up choices with their consequences. "Skips 1,284 tests" is highlighted as risky, and each choice shows logos of the systems it would touch. You pick with the 1–4 keys, then "next". The [component page](https://www.affectui.com/components/decision-tree) says to use it when an agent reaches a fork it shouldn't take alone. In those cases the consequences are the main content, and the agent has a preference but a person decides. For other cases it points to Review Center (finished work), Approval Card (yes/no), Decision Inbox (quick two-answer questions) and Permission Request. Flo confirmed in the replies that the branches are worked out up front, not generated as you go. Two replies ask for the **raw branch condition** to be logged, not just the chosen node, and for "stop requested" to be kept separate from "job stopped". The second shows the real tool result, so people know whether costs are still building up.

**Harsh Singh, "live agent trace waterfall"** ([post](https://x.com/haaarshsingh/status/2113295780450587049), 22 Oct 2026, about 53k views), linking to [kobra.systems/trace-waterfall](https://kobra.systems/trace-waterfall). The thumbnail shows a dark Trace panel:
- a summary strip with Duration, Cost, Tokens, LLM calls, Tool calls and Errors
- a steps column (Orchestrator → "Plan the launch") against a time axis, with bars labeled like "2.6s · $0.07" and a live "now" cursor
- a "Slowest" marker, ⌘F search, and **playback controls** (pause, restart, 0.5×–4× speed)
- a legend: Model call, Tool call, Waiting, Handoff, Failed

It is a shadcn-registry component (`npx shadcn@latest add @kobra/trace-waterfall`, props `spans: TraceSpan[]` and `now`), sold through Kobra Pro or for $19 on its own. One reply praises being able to click a failed step and see the rate-limit error right there. The thread also has an **attribution dispute**: Flo says it copies his affectUI Trace Waterfall from a screenshot. Harsh accepts that he used it as a visual reference but says the implementation is his own. He lists other examples of the pattern: Beamline run-trace, AI SDK Agents trace-viewer, pho-ui trace, adriangalilea trace, and Evil Martians' AgentPrism. **Takeaway:** trace waterfalls and agent trees are now a commodity UI. License and provenance matter more than looks when choosing one.

## 2. Components HyperDelivery could reuse

| Library | License | Relevant pieces | Fit |
|---|---|---|---|
| [AgentPrism](https://github.com/evilmartians/agent-prism) (Evil Martians) | MIT | `TraceViewer` (trace list, searchable tree with expand/collapse, details panel), `SpanCard` with inline timeline, and DetailsView tabs (I/O, attributes, thinking, context-window bar, errors, raw). Uses a normalized `TraceSpan` (category, status, `tokenUsage` with input/output/cache_read/cache_write tokens and cost, reasoning, todos, children, raw). Built-in adapters: `openTelemetrySpanAdapter` (reads `gen_ai.*` and OpenInference) and `langfuseSpanAdapter`. | Best open-source starting point for the engineer layer. Labeled alpha. Built for React 19 and **Tailwind 3**, while the console uses Tailwind v4, so expect some restyling. Last commit 8 Oct 2026. |
| [affectUI](https://github.com/flohoeller/affectui) | MIT (free) plus paid Pro ($199 one-off, commercial use) | Free: Tool Call Card (live timer, folding args/result, `ToolCallGroup` "Used 3 tools · 2.4s"), Decision Inbox, Change Summary, Progress Tracker. Pro: Agent Tree, Agent Lanes, Agent Graph, Trace Waterfall, Decision Tree, Agent Ledger (each change with undo, including what depends on it), Context Map (context-window treemap), Agent Inbox, Agent Steering. | Dependency-free single TSX files; has an MCP server. Pro source is not in the repo. |
| [Kobra](https://kobra.systems) | Paid | Trace Waterfall, Reasoning Steps, Plan Card, Question Card, Task List, File Diff | shadcn and Base UI. Source is paywalled. |

## 3. Standards and AWS-native plumbing

### OpenTelemetry GenAI semantic conventions
- The conventions **have moved** out of core semconv into [open-telemetry/semantic-conventions-genai](https://github.com/open-telemetry/semantic-conventions-genai), and the [opentelemetry.io page](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/) now says so. Last commit was 21 Oct 2026. Everything is still **Development** status.
- Agent operations ([agent spans](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-agent-spans.md)):
  - `create_agent`
  - `invoke_agent`: CLIENT for remote agents, INTERNAL for in-process ones. Span name `invoke_agent {gen_ai.agent.name}`.
  - `invoke_workflow`: for graphs or orchestrators that coordinate several agents. Not used for a single agent on its own.
  - `plan`: the LLM call that produces the plan is a child of it. Only emitted when instrumentation can reliably tell planning apart from ordinary inference.
  - `execute_tool {gen_ai.tool.name}`
- Key attributes:
  - `gen_ai.agent.{id,name,version,description}`
  - `gen_ai.conversation.id`: session or thread
  - `gen_ai.data_source.id`
  - `gen_ai.usage.{input,output,cache_read.input,cache_write.input}_tokens`
  - `gen_ai.tool.call.{id,arguments,result}`
  - new `gen_ai.skill.*` attributes and a `gen_ai.main_agent` entity
  - Opt-in: arguments and results, input and output messages, and system instructions.
- **Evaluation hook:** a `gen_ai.evaluation.result` event (`gen_ai.evaluation.name`, `score.value`, `score.label`, `explanation`), attached to the span it evaluates ([events](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-events.md)).
- There is no standard cost attribute. Vendors use their own, such as `gen_ai.usage.cost` (Langfuse, AgentPrism). HyperDelivery already works out cost in `src/core/domain/pricing.py`.

### Strands Agents tracing
From [`tracer.py`](https://github.com/strands-agents/sdk-python/blob/main/strands-py/src/strands/telemetry/tracer.py) and the [traces doc source](https://github.com/strands-agents/sdk-python/blob/main/site/src/content/docs/user-guide/sdk/observability-evaluation/traces.mdx):
- **Span tree:** `invoke_agent {name}` → `execute_event_loop_cycle` (`event_loop.cycle_id`) → model span (model, tokens including cache read/write, `gen_ai.server.time_to_first_token`, request duration) plus `execute_tool {tool}` (tool name, call id, `gen_ai.tool.status`, args/result).
- **Multi-agent:** swarms and graphs emit an `invoke_{instance}` CLIENT span.
- **`OTEL_SEMCONV_STABILITY_OPT_IN` tokens:**
  - `gen_ai_latest_experimental`
  - `gen_ai_tool_definitions`
  - `gen_ai_span_attributes_only`: for backends that can't read span events
  - `gen_ai_unredacted_attributes=<allowlist>`: redaction. If it is absent, **everything is unredacted**.
- **Custom attributes:**
  - `trace_attributes={"session.id", "user.id"}`
  - `baggage_attributes` plus `setup_baggage_processor(predicate)`. Without a predicate, every inbound baggage entry is stamped onto every span.
- **Strands Evals SDK** [trace providers](https://github.com/strands-agents/sdk-python/blob/main/site/src/content/docs/user-guide/evals-sdk/how-to/trace_providers.mdx) (`CloudWatchProvider`, `LangfuseProvider`, `OpenSearchProvider`) score production traces **without re-running them**.

### AgentCore Observability and CloudWatch GenAI Observability
- **Model:** Session (user↔agent context) > Trace (one request-response, which may call other agents) > Span ([concepts](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/observability-telemetry.html)).
- **Setup** ([configure](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/observability-configure.html)):
  - Enable CloudWatch Transaction Search once.
  - Add `aws-opentelemetry-distro>=0.18.0` and run under `opentelemetry-instrument`.
  - Session id comes from the `X-Amzn-Bedrock-AgentCore-Runtime-Session-Id` header or `session.id` baggage. Trace id comes from `traceparent`.
  - **Per-agent span log group** (`UNIFIED_TRACES_DESTINATION_ENABLED`) gives per-agent access control and KMS encryption.
  - `AWS_GENAI_CONTENT_EXTRACTION_OPT_OUT=true` keeps payloads on spans.
  - `DISABLE_ADOT_OBSERVABILITY=true` hands telemetry to another platform instead.
- **Console** ([agent view](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/agent-view.html), [sessions](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/session-view.html), [traces](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/traces-view.html)):
  - Agent view: sessions, traces, error and throttle rates, FM token usage by model, errors and latency by span, auth metrics, and an Evaluators panel showing the biggest score changes.
  - Session view: the traces in a session, errors and throttles.
  - Traces view: filters, Logs Insights, and export.
  - Metrics come from sampled spans. The docs show tokens, not dollar cost.
- **AgentCore Evaluations** went GA on 31 Mar 2026 ([announcement](https://aws.amazon.com/about-aws/whats-new/2026/03/agentcore-evaluations-generally-available)):
  - 13 built-in evaluators (quality, safety, task completion, tool use) at session and trace level
  - online sampling and on-demand runs, including in CI
  - custom LLM-judge and Lambda code evaluators
  - Ground Truth (reference answers and expected tool sequences)
  - nine regions
- **Pricing:** span ingestion is billed through Transaction Search and Logs. One AWS page lists $0.35/GB, falling to $0.15/GB with volume, with 1% of spans indexed free ([Omni pricing](https://aws.amazon.com/cloudwatch/omni/pricing/)). The [main pricing page](https://aws.amazon.com/cloudwatch/pricing/) presents it differently. **Verify.**

### HyperDelivery today (read-only repo check)
- `src/infrastructure/observability/tracing.py` registers a bare `TracerProvider` so AgentCore's BaggageSpanProcessor works. However:
  - `pyproject.toml` has no `aws-opentelemetry-distro`.
  - The `Dockerfile` runs `python -m agent_runtime.${AGENT}.main` without `opentelemetry-instrument`.
  - I found no exporter anywhere.
- **Strands spans are probably created and thrown away.** CloudWatch GenAI Observability likely shows only the runtime metrics AWS provides. Confirm this in the console.
- The console already has strong raw material for the upper layers:
  - `inspector/TraceView.tsx` is a *requirements* traceability view: requirement → Coach plan → Ref review → Host demo, with gaps first.
  - per-turn cost (`Turns.tsx`)
  - `ToolTile`, `ThoughtLine`, `StationBand`, `GateConsole`
  - `ChangesView` diffs

## 4. Product survey

| Product | Data model | Evals | Cost / latency | Replay / diff | UI | AWS-org fit |
|---|---|---|---|---|---|---|
| [LangSmith](https://docs.langchain.com/langsmith/observability-concepts) | Run ≈ span. Trace (max 25k runs). Thread (via `thread_id`). **Trajectory**: a flat, deduplicated list of human/AI/tool messages. Agent workspaces split by environment. | Feedback on runs. Insights Agent clusters traces. Polly assistant. | Tokens and cost per run | Playground. Experiments. | Run tree, waterfall, threads | SaaS (180-day retention per docs). Self-hosting is Enterprise. OTel ingest has caveats: UUID vs 8-byte parent ids, and silent drops ([OTel](https://docs.langchain.com/langsmith/trace-with-opentelemetry)). Per-trace pricing figures conflict. |
| [Langfuse](https://langfuse.com/changelog/2026-03-10-simplify-for-scale) | Since Mar 2026 the main table is **observations**, with trace, session, user and score as filter columns. Observation types include agent, tool, generation, guardrail and retriever. | Observation-level evals, datasets, annotation | `gen_ai.usage.*`, cost | Playground, datasets | Tree plus **agent graph**: *aggregated* (loops become cycles with counters) or *expanded* (a DAG in run order) ([docs](https://langfuse.com/docs/observability/features/agent-graphs)) | MIT core. Acquired by ClickHouse on 16 Jan 2026, license unchanged ([ClickHouse](https://clickhouse.com/blog/clickhouse-acquires-langfuse-open-source-llm-observability)). AWS Terraform module needs Postgres, ClickHouse, Redis with noeviction (no cluster mode) and S3 ([AWS](https://langfuse.com/self-hosting/deployment/aws)). OTLP over HTTP only, no gRPC. Trace-level attributes must be on every span ([OTel](https://langfuse.com/integrations/native/opentelemetry)). |
| [Arize Phoenix](https://arize.com/docs/phoenix/self-hosting/license) | OpenInference span kinds (AGENT, TOOL, LLM, CHAIN, RETRIEVER…) and sessions | Strong eval library | Tokens and cost | Experiments | Span tree | Elastic License 2.0: self-hosting is free, but it is not OSI open source |
| [Braintrust](https://www.braintrust.dev/docs/observe/examine-traces) | Spans, root span, threads | Scorers, online scoring, human review | **Cost rolls up from children.** Token breakdown (uncached, cache read/write, output), TTFT. | **Run** re-executes a prompt span. Experiment **diff mode** has score deltas, inline or side-by-side output diffs, and pairwise preference ([compare](https://www.braintrust.dev/docs/evaluate/compare-experiments)). | Spans, Timeline (scale by duration, tokens or cost), Thread, and **Loop-generated custom views and "Work" summaries** | Hybrid: self-hosted data plane in AWS (Terraform, Brainstore on NVMe instances) with a SaaS control plane ([deploy](https://braintrust.dev/docs/admin/self-hosting/deploy)) |
| [W&B Weave](https://docs.coreweave.com/weave/guides/tracking/trace-tree) | Calls (ops), traces, threads. Docs now live on CoreWeave. | Evaluations, scores, feedback | Toggle for cost, tokens and latency | Call comparison | Tree, **code composition**, **flame graph**, **graph**, and scrubbers (timeline, peers, siblings, stack) | SaaS or dedicated. OTLP endpoint. |
| [Datadog](https://www.datadoghq.com/blog/agentic-ai-llm-observability-bedrock-agentcore/) | Spans. AI Agent Monitoring execution graph. | LLM-as-judge, monitors | Tokens and latency per span | n/a | Span list, flame graph, interactive decision-path graph | Natively reads OTel GenAI v1.37+, including Strands with the opt-in flag. NTT DATA used it on AgentCore (Apr 2026). Ingestion takes 3–5 minutes. |

## 5. UI patterns, and who each is for

- **Waterfall/timeline** (affectUI, Kobra, Braintrust Timeline): shows where time and money went. Most useful with a slowest-step marker, cost per bar, and playback. *Engineer.*
- **Tree / who started whom** (Agent Tree, AgentPrism): structure plus cost rollup. Needs non-parent "waiting on" edges and folding. *Lead and engineer.*
- **Lanes** (Agent Lanes): one lane per actor, with handoffs and approvals drawn on the blocks. This fits a gated line where humans are lanes too. *Lead.*
- **Graph, aggregated vs expanded** (Langfuse, Datadog, Weave): aggregated shows the agent's overall shape and its loops. Expanded shows one exact run. *Engineer.*
- **Thread / trajectory** (LangSmith, Braintrust Thread): the conversation with tool calls folded into "Worked…" blocks. *Business user and lead.*
- **AI-summarized work view** (Braintrust Loop Work/Debugger, LangSmith Polly): an LLM explains a trace. This is the natural bridge from spans to plain English.
- **Decision tree / decision inbox:** the agent's options, consequences, and its own pick, with a person choosing. *Lead at gates.*
- **Ledger with undo dependencies** (Agent Ledger): every outside side effect, such as a repo created or a Jira issue filed, listed with what would also be undone. *Lead and admin.*
- **Requirement traceability** (HyperDelivery's `TraceView`): the business meaning of "trace". It answers whether everything asked for is covered, and should stay the top-level view.

## 6. Layered disclosure for HyperDelivery

One telemetry stream feeds **three projections**. The role comes from Entra ID group claims the console API already sees. Each layer offers one "show more" link to the next, and never forces it.

**Layer 1: business users ("what's happening with my idea").**
- A station progress band showing outcomes, not agents. Example: "Spec drafted, 14 requirements, 3 need your input".
- Live plain-language narration made from span *types*, not raw content:
  - `execute_tool search_confluence` ×3 becomes "Checked 3 Confluence pages".
  - A retry after a 429 becomes "Taking another pass".
- A "waiting on you / waiting on Dana" state taken from the Step Functions gate.
- Time-to-ready estimates, and requirement coverage (the existing TraceView, gaps first).
- No model names, token counts, or crew-member names unless asked for.

**Layer 2: project leads ("why").**
- A **decision record** for every significant fork: question, options, the agent's pick, rationale, evidence links (spec citations, span ids, sources), consequences, who chose, and when.
- At a gate, show it as a Decision Tree (affectUI's "when to use" fits gates exactly) or as a Decision Inbox for quick questions.
- A Lanes view of the line: Scout → you → Coach → you → build → Ref → you → Host. Show human wait time as lane blocks, because waiting on people is usually the biggest delay.
- A ledger of outside side effects (repos, pushes, Jira issues) with links.
- Diffs between drafts (the existing ChangesView), and evaluation scores as simple pass/flag badges.
- Because the ideathon showed that mixed teams produce the best context, let **several people comment on and weigh in on decision nodes**, and record who contributed.

**Layer 3: engineers and admins ("how, and how much").**
- The full span tree and waterfall: tool args and results, tokens including cache, dollar cost per span with rollup, model, latency, TTFT, errors, and retries.
- A trace-id deep link into the CloudWatch GenAI Observability trace, plus evaluator results.
- Search, and filters by project, station and unit of work.
- Content-bearing attributes visible only to this layer, and audit-logged.

**Telemetry contract to make this work:**
- `session.id` = `gen_ai.conversation.id` = the project id.
- **One trace per station turn.** Never keep a span open across a human gate. Link the next station's trace with an OTel span link and a `hd.gate.id`.
- Wrap each station in an `invoke_workflow hyperdelivery.<station>` span.
- Stamp custom `hd.project.id`, `hd.station`, `hd.unit_of_work.id` and `hd.decision.id` on every span, using the baggage processor with an explicit predicate.
- Emit decisions as a span event *and* persist them in DynamoDB. Emit evaluations as `gen_ai.evaluation.result`.
- Layers 1 and 2 read the console's **own DynamoDB projection**, filled from the existing stream events (`TOOL_CALL`, `USAGE`, `THINKING`) plus the new decision events. They should not query CloudWatch, which brings latency, cost, IAM issues, and sampling.

## 7. Trace backbone recommendation

**Use OTel GenAI semconv as the contract, ADOT → AgentCore Observability/CloudWatch as the system of record, and keep self-hosted Langfuse as an optional second destination.**

Reasons for this choice:
- It is AWS-native.
- Data stays in UA's accounts, with per-agent log groups, KMS and IAM.
- No new vendor or security review.
- AgentCore Evaluations (GA) and the Strands Evals `CloudWatchProvider` work on the same spans.
- CloudWatch's agent, session and trace views cover the engineer and admin layer well enough at first.

Gaps to accept or fill:
- CloudWatch shows tokens, not dollars.
- Its trace UI is generic, not agent-specific.
- It has no prompt or dataset workflow.

Fill the dollar gap with the console's own pricing math. Fill the UI gap with an AgentPrism-based inspector, fed by a console API endpoint that reads spans from the agent's log group by trace id.

**When to add Langfuse:** if prompt iteration, datasets and annotation queues become a daily need, deploy Langfuse with its AWS Terraform module and add it as a *second* OTLP exporter on the same `TracerProvider`. Strands supports adding exporters to an existing provider. This keeps the application on standard spans, so you are not locked in. Use LangSmith, Braintrust or Datadog only if UA already licenses them. Datadog is the easiest add-on if SRE already runs it, because it reads `gen_ai.*` natively.

**First step:** actually export the spans:
1. Add ADOT.
2. Run under `opentelemetry-instrument`.
3. Set `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`.
4. Pass the project id as the runtime session id.
5. Enable per-agent span log groups.
6. Then decide on content capture: keep it in UA's account, and set the Strands redaction allowlist before data goes to any third-party destination.
