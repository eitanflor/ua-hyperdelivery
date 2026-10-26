<!-- Point-in-time research, retrieved 2026-10-26 for the UA-DLC plan (round 6: the coding agent runs in HyperDelivery's sandbox). Claims carry source links; vendor features, limits and prices change quickly, so verify before acting. Branch facts come from origin/coding_agent_harness_test at e41f13a (2026-10-22). See README.md in this folder. -->
<!-- cspell:words Dalal Evandro Fargate Kimi Kosti METR Qwen Richey Vasilakakis Vivek -->

# The AgentCore harness as HyperDelivery's sandboxed, swappable coding engine

> Stage numbers here predate the three-phase plan (2026-10-26): Stages 1 to 3 are now the Final MVP and its pilot; Stages 4 and 5 are Enterprise.

Research key: `agentcore-harness-coding`. Date: 2026-10-26. Prompted by the owner's ask to consider
the Amazon Bedrock AgentCore harness for the coding agent, to know exactly where the coding agent
runs, and to replace per-issue autopilot pull requests with one holistic build. Reads the
[GA post](https://aws.amazon.com/blogs/machine-learning/amazon-bedrock-agentcore-harness-is-now-generally-available-go-from-idea-to-production-grade-agent-in-minutes/)
(June 18, 2026), the harness documentation it links, the Step Functions integration, the API
references and pricing, and the unmerged `origin/coding_agent_harness_test` branch. Builds on
[delegation-coco-coding.md](delegation-coco-coding.md),
[factory-sources-round4.md](factory-sources-round4.md) and
[harness-engineering.md](harness-engineering.md), and is checked against
[platform-architecture.md](../platform-architecture.md) sections 2, 3, 9 and 10.

## Bottom line

1. **Make the AgentCore harness the Stage 1 coding engine, in the sandbox AWS account, behind the
   `Builder` port.** It is generally available (June 18, 2026), runs each session in its own
   Firecracker microVM with our own toolchain image, sets the model per call, and has no harness
   fee. The branch already proves the shape: one session, one branch `hyperdelivery/<id>`, one pull
   request per project, with the API rather than the model running Git.
2. **"Where it runs" becomes a short, checkable list:** the sandbox account in `us-east-1`; one
   microVM per project session (at most 2 vCPU and 8 GB, at most 8 hours); the golden-path image
   pinned by digest; VPC mode with no internet route (Bedrock, ECR, S3 and a package proxy through
   endpoints only); per-session storage at `/mnt/workspace`; an execution role that can call one
   model and nothing else; a named harness endpoint pinned to a version. No GitHub credential ever
   enters the microVM.
3. **One session with the whole plan beats per-issue autopilot pull requests for prototypes,** on
   mechanism and on the evidence we have. Per-issue tasks split the plan across sessions that cannot
   see each other's code, so integration, tests and previews happen after the fact, and each task
   is capped at 59 minutes, one branch and one pull request. Fully autonomous agent pull requests
   succeeded 55.1% of the time on `dotnet/runtime` against 86.2% with a human commit, and about
   half of grader-passing pull requests would not have been merged. No public study compares the
   two shapes head to head; the claim rests on mechanism plus these numbers.
4. **Three facts in the round 6 brief need correcting.** The harness gained lifecycle hooks on
   Sep 21, 2026, so per-tool hooks are no longer a reason to switch engines. The Step Functions
   `InvokeHarness` state stops waiting at 15 minutes and returns only the final text, so it does not
   replace the 15-minute Lambda; Step Functions should wait on a worker instead. The quoted Runtime
   prices are the v1 rates; v2 rates are higher per hour (section 9).
5. **One defect on the branch should be fixed before any real use.** The GitHub token travels inside
   the shell command sent through `InvokeAgentRuntimeCommand`, and AWS documents that the service
   writes each command's input to CloudWatch Logs. Move clone and push to Git bundles that cross the
   boundary without a credential, and rotate the token if the logs confirm it (section 7).
6. **What is missing for Stage 1 is mostly plumbing, not research:** the sandbox account and a
   cross-account role, a per-piece Step Functions loop around a worker, short-term memory so an idle
   microVM swap does not erase the conversation, evidence computed outside the microVM, a
   per-session budget, per-piece commits, and a conformance suite every engine must pass.
7. **Identity gets simpler.** Copilot's cloud agent accepts only a seated user's token; the harness
   path needs only the API's own GitHub credential, so a GitHub App installation token (one hour,
   one repository, named permissions) works and Copilot seats leave the long-lead track.

## 1. What the harness is

- **A managed agent loop on AgentCore Runtime.** `CreateHarness` declares the model, system prompt,
  tools, skills, memory, limits and environment; `InvokeHarness` runs a turn and streams it back;
  every `UpdateHarness` creates an immutable version. The loop is Strands Agents, operated by AWS
  ([harness overview](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness.html),
  [harness vs. Runtime](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-vs-runtime.html)).
  Previewed in April 2026 (2026-04-22 per [delegation-coco-coding.md](delegation-coco-coding.md)),
  generally available June 18, 2026, in every Region where AgentCore is generally available
  ([GA post](https://aws.amazon.com/blogs/machine-learning/amazon-bedrock-agentcore-harness-is-now-generally-available-go-from-idea-to-production-grade-agent-in-minutes/)).
- **Where a session runs.** Each session is a Firecracker microVM with its own kernel, filesystem
  and shell, and "no shared state, no shared filesystem" between sessions
  ([security](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-security.html)).
  The default environment has Python and bash; a custom image from ECR (linux/arm64, at most 2 GB)
  replaces it, and the harness overrides the image's `ENTRYPOINT` and `CMD`
  ([environment](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-environment.html),
  [quotas](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/bedrock-agentcore-limits.html)).
- **Two doors into the same microVM.** `InvokeHarness` runs the model loop. `InvokeAgentRuntimeCommand`
  runs one shell command with no model in between: 1 to 3,600 seconds (default 300), command text up
  to 64 KB, run as root, while a Dockerfile `USER` applies only to the agent process
  ([API reference](https://docs.aws.amazon.com/bedrock-agentcore/latest/APIReference/API_InvokeAgentRuntimeCommand.html),
  [environment](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-environment.html)).
  Commands and agent turns can run concurrently on one session
  ([execute command](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-execute-command.html)).
  An interactive shell API (`InvokeAgentRuntimeCommandShell`) allows up to 10 terminals per session
  ([shells](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-command-shell.html)).
- **Models per call, even mid-session.** Bedrock (Claude, Nova, Llama, DeepSeek, Qwen, Kimi, MiniMax,
  Cohere, Mistral, OpenAI GPT-5.5 and GPT-5.4), OpenAI direct, Gemini and LiteLLM; switching provider
  between turns keeps the conversation. Bedrock uses the execution role; other providers' keys sit
  in the AgentCore Identity token vault. If a harness is created without a model, the service
  default is `global.anthropic.claude-sonnet-4-6`, not Sonnet 5.5, so set it explicitly
  ([models](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-models.html)).
- **Tools.** Built-in `shell` and `file_operations` (about 900 input tokens of definitions per model
  request), Gateway targets, remote MCP, Browser, Code Interpreter, and `inline_function` tools that
  hand the call back to our code, which is how `ask_user` works. `allowedTools` narrows the set per
  call but does not govern `InvokeAgentRuntimeCommand`, which has its own IAM action
  ([tools](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-tools.html)).
- **Lifecycle hooks (new since the branch was written).** `before_invocation`, `before_tool_call`,
  `after_tool_call` and `after_invocation` events go to Lambda (synchronous allow or deny, 1 to
  900 seconds, failing closed by default), SNS or EventBridge (notification only). Up to 20 hooks per
  harness, set on the harness and not per call; hook context is capped at 64 KiB
  ([lifecycle hooks](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-lifecycle-hooks.html)).
  They shipped in botocore 1.43.99 on Sep 21, 2026
  ([botocore changelog](https://github.com/boto/botocore/blob/develop/CHANGELOG.rst),
  [PyPI](https://pypi.org/project/botocore/1.43.99/)).
- **Limits a build meets** ([cost controls](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-operations.html),
  [quotas](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/bedrock-agentcore-limits.html)):

| Limit | Value |
|---|---|
| `maxIterations` per invocation | default 75 |
| `timeoutSeconds` per invocation | default 3,600 |
| `maxTokens` | "per invocation" in the cost-controls guide, "per iteration" in the API reference (conflict, open question) |
| `idleRuntimeSessionTimeout` | default 900 s; on expiry the microVM is replaced |
| `maxLifetime` | default 28,800 s (8 hours), the documented maximum session duration |
| Response streaming | at most 60 minutes per connection |
| Hardware per session | at most 2 vCPU and 8 GB, not adjustable |
| Managed session storage | 1 GB and about 100,000 to 200,000 files per session |
| Active sessions per account | 5,000 in `us-east-1` and `us-west-2` |
| New sessions | 25 per second per account |
| Dollar cap | none; budgets are ours to enforce (section 5.7) |

- **Versions and endpoints.** Each version captures the full configuration; `DEFAULT` advances on
  every update, named endpoints stay pinned until promoted, and rollback is pointing an endpoint at
  an earlier version
  ([versioning](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-versioning.html)).
- **Observability.** Every model call, tool call, memory operation and shell command is traced to
  CloudWatch with timing and payload; the console has a Harnesses tab; token usage arrives in
  `metadata` events in the stream. CloudTrail records harness data events as `InvokeAgentRuntime` and
  `InvokeAgentRuntimeCommand` under the `AWS::BedrockAgentCore::Runtime` type. Tags propagate to the
  managed Runtime and Memory, so they attribute cost per harness, not per session
  ([cost controls](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-operations.html)).
  AgentCore Evaluations can score traces online, on demand or in batch
  ([GA post](https://aws.amazon.com/blogs/machine-learning/amazon-bedrock-agentcore-harness-is-now-generally-available-go-from-idea-to-production-grade-agent-in-minutes/)).
- **Export to code.** `agentcore export harness` writes a Python Strands agent (CodeZip) that runs on
  AgentCore Runtime or anywhere Python 3.12 runs. It carries the model, limits, mounts, remote MCP,
  inline and built-in tools, S3 and Git skills; it omits Gateway, Browser and Code Interpreter tools
  and AWS skills, rejects path skills, and lists the gaps in `EXPORT_NOTES.md`
  ([export](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-export.html)).
  The GA post says a Claude Agent SDK target is "coming soon"; the export guide lists only Strands
  as of today.

## 2. Knowing where the coding agent runs

The owner's requirement is that the coding agent runs in a predefined sandbox, not on someone
else's autopilot. With the harness, every item below is a setting HyperDelivery owns, can print on
the plan page, and can test.

| Question | Answer for the Stage 1 build | How it is enforced or checked |
|---|---|---|
| Which account | The sandbox AWS account, never the account that runs HyperDelivery; fallback a named non-production account with no HyperDelivery resources or data credentials | The harness stack deploys there; HyperDelivery's build worker assumes a role in it allowed only `InvokeHarness`, `InvokeAgentRuntime`, `InvokeAgentRuntimeCommand` and `StopRuntimeSession` on one harness ARN and endpoint. Cross-account calls count against the sandbox account's quotas ([quotas](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/bedrock-agentcore-limits.html)) |
| Which Region | `us-east-1`, as HyperDelivery's stacks (`infra/stacks/naming.py`) | Stack setting |
| What compute | One Firecracker microVM per project build session, at most 2 vCPU and 8 GB, replaced after the idle timeout, ended at 8 hours | AgentCore Runtime; the session id is derived from the project id |
| What software | The golden-path toolchain image (today `infra/harness-image`: Python 3.12, Git, Node 22, pnpm 10, uv), built for arm64, stored in the sandbox account's ECR, referenced by digest, rebuilt on the 7-day patch rule | The digest goes into every `BuildResult` receipt; the image runs the agent as a non-root `USER` |
| What network | VPC mode, private subnets, no NAT. Interface endpoints for `bedrock-runtime`, `ecr.api`, `ecr.dkr` and the package proxy (CodeArtifact or the artifact proxy section 10 names), an S3 gateway endpoint; no GitHub or general internet route | AWS documents the ECR, S3 and Bedrock endpoints VPC mode needs ([security](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-security.html)); a conformance test proves a non-allowlisted host is unreachable |
| What storage | Managed session storage at `/mnt/workspace`, isolated per session | No EFS or S3 Files mounts: they are configured on the harness, so every project's session would share them ([environment](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-environment.html)) |
| What identity inside | An execution role that can invoke the one pinned inference profile, pull the image and write logs; nothing else | The branch's spike found the metadata service reachable from the shell, so whatever the role can do, a prompt-injected agent can do (`infra/stacks/harness_stack.py` docstring) |
| What credentials inside | None. Bedrock uses the role; no third-party model keys in Stage 1 (if added, they go in the AgentCore Identity token vault); GitHub credentials stay with the API worker | Git crosses the boundary as bundles (section 7); a canary token test proves it never appears in a transcript or log |
| Which version | A named harness endpoint (`BUILD`) pinned to a version and promoted only between builds; the model id set on each call | Receipt fields: harness version, image digest, model id, system-prompt hash |
| What is recorded | CloudWatch traces with payloads, command inputs in CloudWatch Logs, CloudTrail data events, our turn and cost ledger | Log retention and access set for code content; synthetic data only in sandboxes, as `BuildUnit` already requires |

Two consequences follow. First, the sandbox account has to exist by week 3, which is already the
long-lead item in the brief. Second, because hooks, filesystems and limits are harness-level, one
harness per environment serves every project, and isolation comes from sessions, as the branch
decided for its image.

## 3. Why one session with the whole plan beats per-issue autopilot pull requests

**The mechanism.** Per-issue autopilot gives each issue its own session, branch and pull request.
GitHub's cloud agent works in one repository and one branch per task, opens one pull request per
task, and stops at 59 minutes, a cap that "cannot be extended or bypassed"
([GitHub](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent)). Piece 4
is built without seeing pieces 1 to 3, so integration, the full test run and the preview happen only
after several pull requests merge, and conflicts are found late. One session that works through the
signed plan's pieces in order sees the whole workspace, runs every test and the preview build after
each piece, and asks one recorded question when two readings would build different things.

**The evidence already gathered.**

- **Autonomy without steering costs about 30 points.** On 878 agent pull requests in
  `dotnet/runtime`, agent pull requests succeeded 67.9% of the time against 87.1% for humans; with a
  human commit 86.2%, fully autonomous 55.1% ([factory-sources-round4.md](factory-sources-round4.md#3-nuggets),
  nugget 6). Per-issue autopilot is the fully autonomous mode; the harness session keeps a person one
  `ask_user` away and a platform engineer able to step in.
- **Passing checks is not the same as acceptable.** About half of the pull requests that passed
  SWE-bench's grader would not have been merged by maintainers (METR, nugget 9), and Spotify's judge
  vetoed about a quarter of sessions, mostly for going out of scope (nugget 7). Integration and
  evidence on the whole build, before review, catch what per-issue checks miss.
- **Review capacity is the constraint.** Two reviewers wrote 36% of all human feedback on those 878
  pull requests, and agent pull requests drew 43% more comments (nugget 12). One pull request per
  project with a commit per piece asks a reviewer for one coherent review, not one per issue.
- **What the agent cannot see does not exist** (OpenAI), and long-running work succeeds when each
  session reads the progress notes and Git log, checks the app still works, builds one feature, and
  ends with a commit and a note (Anthropic). Both are properties of one workspace that persists
  across pieces ([harness-engineering.md](harness-engineering.md#3-what-the-primary-sources-add)).
- **The branch reached the same conclusion from the inside.** Its 2026-10-01 decision rejects one
  pull request per delivery group because groups exist so parallel coding agents do not collide,
  and calls a second coding-agent session from the same base "the colliding-pull-request failure the
  delivery plan exists to prevent" (`docs/decisions.md` on the branch).

**Where per-issue pull requests still fit.** Small, independent, well-specified changes do well:
agent pull requests of 1 to 50 lines succeeded 76 to 80% of the time (nugget 5), and the proven
factory workload is mechanical change at scale (nugget 24). That is a receiving engineering team's
backlog after a T3 handoff, or a scheduled patch sweep, which is where the brief keeps GitHub's
cloud agent.

**The risks of one long session, and their answers.** A long conversation degrades and a dead
session could lose work. Section 5 answers both: one harness turn per piece, a progress note and a
commit after each, the plan and decisions as files in the workspace rather than only in the prompt,
and Git as the record when a microVM is replaced.

## 4. Engine comparison

All five can sit behind the same `Builder` port (`BuildUnit` in, `BuildResult` out). Cost lines
exclude model tokens, which are the same for the same model and dominate (section 9).

| Engine | Where it runs | Who holds credentials | Swap options | Observability | Limits | Maturity | Cost |
|---|---|---|---|---|---|---|---|
| **AgentCore harness** (default) | Sandbox account, one microVM per session, our image, VPC mode | Execution role for Bedrock; Identity vault for other model keys; GitHub only in the API worker | Model, tools, skills and limits per call; any Bedrock, OpenAI, Gemini or LiteLLM model; export to Strands | CloudWatch Harnesses tab, per-step traces with payloads, CloudTrail data events, token `metadata` in the stream, Evaluations | Section 1 table; no dollar cap; Lambda hooks only; no choice of loop framework | Preview Apr 2026, GA Jun 18, 2026; hooks Sep 21, 2026; session storage still preview | No harness fee; Runtime v1 $0.0895 per vCPU-hour of active CPU and $0.00945 per GB-hour |
| **Claude Agent SDK on AgentCore Runtime** | Same account and microVM; our container with a `BedrockAgentCoreApp` entrypoint | Same; Claude through Bedrock (`CLAUDE_CODE_USE_BEDROCK`) | Claude models only; we own the loop | Runtime traces plus Claude Code's OpenTelemetry export, which we wire | Runtime limits; adds in-process `PreToolUse` hooks, `--max-budget-usd`, schema-checked output ([delegation-coco-coding.md](delegation-coco-coding.md)) | SDK and Runtime generally available; harness export to it announced, not shipped | Same Runtime rates; more code to own |
| **GitHub Copilot cloud agent** | GitHub's ephemeral cloud environment, outside UA's AWS; self-hosted only on ephemeral runners with the agent firewall off | A Copilot-seated user's token; the tasks API rejects GitHub App installation tokens ([GitHub](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-via-the-api)); the agent pushes | Copilot, Claude or Codex on the same surface; models per plan | Session logs on GitHub, not in our traces | 59 minutes, one repository, one branch and one pull request per task | Cloud agent generally available; tasks API in public preview | Seats, AI credits and Actions minutes |
| **Codex or another CLI in the same image** | Inside the harness or Runtime microVM, started as a command | Bedrock through the AWS SDK chain or a Bedrock API key; GitHub as above | The CLI's models; GPT-5.5 on Bedrock was in `us-east-2` only and GPT-5.4 in `us-east-2` and `us-west-2` as of June 2026 ([AWS](https://aws.amazon.com/blogs/aws/get-started-with-openai-gpt-5-5-gpt-5-4-models-and-codex-on-amazon-bedrock/)) | The harness sees one shell call; the CLI's own JSON or telemetry is the only view inside | One command runs at most 3,600 s unless run in the background and polled; the CLI's own hooks | Codex on Bedrock since mid-2026 | Tokens only, no seats |
| **Strands-exported harness** | Same account and microVM on Runtime, or Lambda, ECS or EKS | Same as the harness | Any loop change and Strands hook; same model providers | Strands OpenTelemetry plus AgentCore Observability | Runtime limits; export drops Gateway, Browser, Code Interpreter tools and AWS skills | Export available since GA; Python only | Same Runtime rates; more code to own |

**Reading the table.** The harness wins on time to value and on the "where it runs" list, because
every row of section 2 is configuration. The Claude Agent SDK image is the second engine to build
when a hard dollar cap inside a turn, in-process hooks or schema-checked output matter more than
managed plumbing. The Strands export is the cheapest escape hatch, since it starts from the same
configuration. Copilot's cloud agent fails the owner's requirement on two rows: it runs outside the
sandbox, and it needs a seated user's token.

## 5. What the branch already does, and what the Final MVP still needs

### 5.1 Already built on `origin/coding_agent_harness_test` (latest commit 2026-10-22)

| Area | On the branch | Source |
|---|---|---|
| Harness | `CfnHarness` with Sonnet 5.5 (`global.anthropic.claude-sonnet-5-5`), 32,000 max tokens, 200 iterations, 1,800 s turns, 30-minute idle timeout, 8-hour lifetime, session storage at `/mnt/workspace`, memory disabled, optional VPC and image; a model-only role; deployed by an administrator because PowerUser cannot pass the role | `infra/stacks/harness_stack.py` |
| Image | Python 3.12, Git, curl, make, Node 22, pnpm 10, uv, corporate CA support, arm64 | `infra/harness-image/Dockerfile` |
| Session | One session, one branch `hyperdelivery/<id>`, one pull request per project; a DynamoDB lease serializes turns; the API clones, tests, commits, pushes and opens the pull request through the command door | `src/orchestration/build_session.py`; decision 2026-10-01 |
| Prompt | Build the plan's units in order, one at a time, test after each; never edit an existing test; no push, no remote changes, no network beyond dependencies | `BUILD_SYSTEM_PROMPT` in `src/core/prompting.py` |
| Questions | `ask_user` inline tool; the pending call is kept on the build session and answered with a `toolResult` | decision 2026-10-01 |
| Stop | `StopRuntimeSession` keeps files, loses the conversation; the next turn re-sends the brief and a recap note | decision 2026-10-01 |
| Deployed runs | A worker Lambda (15 minutes) runs one turn with a 14-minute limit and streams over the WebSocket API; secrets in one Secrets Manager secret | decision 2026-10-01 (Proposed) |
| Previews | One Amplify app builds every pushed `hyperdelivery/*` branch; the API only reads it | decision 2026-10-01 update |
| Fix loop | Review's blocker and major findings go back to the same session at most twice | decision 2026-10-22 |
| Provenance and cost | `produced_with` (model, config hash, Git SHA), `graded_sha`, cost per turn | decisions 2026-10-22 and 2026-09-30 |

### 5.2 Missing for it to be the Final MVP default

1. **Place it in the sandbox account.** Today the harness stack is part of the same CDK app as
   HyperDelivery. Move it to the sandbox account, add the cross-account invoke role (section 2), turn
   on VPC mode with endpoints only, and route package installs through a proxy.

2. **Step Functions waits on a worker; it does not call `InvokeHarness` directly for builds.** The
   optimized `InvokeHarness` state supports only Request Response (no `.sync`, no task token), stops
   waiting at 900 seconds whatever `TimeoutSeconds` says, returns only the final assistant text with
   tool-use blocks omitted, and stopping the execution does not stop the harness
   ([Step Functions](https://docs.aws.amazon.com/step-functions/latest/dg/connect-bedrockagentcore.html)).
   So it has the Lambda's ceiling, and an `ask_user` question cannot even be read from its output.
   Recommended shape: a build sub-machine that prepares the workspace, then loops over the signed
   plan's pieces in order (a Map with concurrency 1). Each piece is one harness turn run by a small
   Fargate build worker that Step Functions starts with `ecs:runTask.sync`; the worker holds the
   stream (at most 60 minutes, so turns get a 50-minute `timeoutSeconds` and continue if they hit
   it), relays events to the WebSocket, tallies cost, and returns `done`, `needs_input`, `timed_out` or
   `over_budget`. `needs_input` parks the execution on a task token until the person answers, as
   approvals already do. After each piece a Lambda checks the diff, pushes the work branch and writes
   the receipt. An `after_invocation` hook to EventBridge gives a second, durable completion signal.
   This also gives Layer 1 its "Building piece 4: filters" for free.

3. **Survive the idle timeout.** With memory disabled, the conversation lives only in the microVM, so
   the idle replacement (30 minutes on the branch) or the 8-hour lifetime erases it; the branch notes
   that an `ask_user` answer after a long wait is unverified. When memory is on, the harness reloads
   a session's history from AgentCore Memory on the next invocation
   ([memory](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-memory.html)).
   Attach a memory resource with short-term events only (no long-term strategies, so nothing crosses
   projects), the actor id set to the project id, and an expiry longer than the longest gate. Also:
   pin builds to the `BUILD` endpoint, because session storage resets when the runtime version changes
   and after 14 days without an invocation, and is still a preview
   ([filesystems](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-filesystem-configurations.html)).
   Every turn starts by reading the progress note and Git log and running the smoke check (H5 in
   [harness-engineering.md](harness-engineering.md#5-the-recommendations)), so a replaced microVM
   costs at most one piece. A conformance test covers a question answered after a replacement and
   after 24 hours.

4. **Commit per piece, with the map in the repository.** The branch makes one commit ("Build from the
   approved plan") at publish and passes the spec and blueprint as JSON in the first message. Write
   the signed Brief, plan, decisions, data contract and a short `AGENTS.md` map into the workspace,
   commit after each piece with an `Assisted-by:` trailer naming the engine, model and `BuildUnit`,
   and keep the progress note on the branch.

5. **Separate the evidence from the builder.** Anything computed inside the microVM is the builder's
   claim: the branch's publish runs `BUILD_TEST_COMMAND` in the same session the agent controls, and
   its protected-test check matches test file names, not `package.json` scripts, test configuration
   or CI files. Evidence comes from outside: the API's own diff checks on the bundle (protected files
   including test configuration, touchpoint drift), the repository's CI on the pushed branch, and the
   evidence agent running the acceptance checks against the preview in its own session and role,
   never the build session's filesystem. A `before_tool_call` hook can deny `file_operations` writes
   to protected paths as an early guard; the diff check stays the backstop, because shell commands
   are free text.

6. **Upgrade the SDKs.** Both `dev` and the branch pin boto3 and botocore 1.43.78 (Aug 21, 2026),
   which predates hooks; the branch's "the harness configuration has no hook field" (2026-10-01) was
   true of that SDK, not of the service. Move to 1.43.99 or later and a CDK release with hook support.

7. **A per-session budget.** The harness offers iteration, time and token caps, not dollars. The
   worker prices each `metadata` usage event with `config/model_pricing.yaml` (Sonnet 5.5 at $2.00
   input, $10.00 output, $0.20 cache read and $2.50 cache write per million tokens, from the repo's
   2026-09-30 rates) and calls `StopRuntimeSession` when the project's build budget is spent. A
   `before_invocation` Lambda hook refuses a new turn once the ledger says the budget is gone, so a
   caller that skips the worker cannot overspend. Set defaults from the p90 of the first ten builds,
   per tier and depth.

8. **The `Builder` port and a conformance suite.** Map the branch's `BuildSession` onto `BuildUnit`
   and `BuildResult` (status `done`, `needs_input`, `failed`, `timed_out`, `over_budget`). Every engine,
   and every model change, must pass the same suite before it is the default:

| Test | Passes when |
|---|---|
| Golden intake | A reference T0 web app and a Streamlit app build from their signed plans, and the evidence agent's acceptance checks pass in the preview |
| Contract | Every result validates against `BuildResult`; status matches what happened |
| No credentials | A canary token placed in the push step never appears in the transcript, traces or logs |
| Egress | A request to a non-allowlisted host fails |
| Protected tests | An attempt to edit an existing test or its configuration is blocked or refused at publish |
| Questions | An `ask_user` round trip works within a turn, after an idle replacement and after 24 hours |
| Resume | A build killed mid-piece resumes from the progress note without redoing finished pieces |
| Budget | The build stops at its cap and reports `over_budget` |
| Scope | An out-of-scope change is flagged by the scope check |
| Injection | An instruction planted in a repository file (to push, exfiltrate or edit tests) is not carried out |
| Receipts | Each piece leaves a commit with its trailer and a receipt with engine, harness version, image digest, model id, tokens and cost |

9. **Naming and defaults.** The branch calls the harness path `build_mode: copilot` and the Copilot
   path `autopilot`, the opposite of what the names suggest to a reader now. Rename the harness path
   (for example `session`) and make it the default for every business prototype; keep the Copilot
   hand-off only behind a T3 flag for receiving teams.

10. **A repository per project.** The branch builds into one test repository (`BUILD_REPOSITORY`).
    Stage 1 needs the prototype organization and a repository created per project from the golden
    path.

## 6. Identity simplification

- **Copilot's path needed a person.** The Agent tasks API "only supports user-to-server tokens", and
  "server-to-server tokens, such as GitHub App installation access tokens, are not supported"
  ([GitHub](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-via-the-api)).
  That is why the earlier lane design needed a Copilot-seated service user unlocked by a gate token;
  platform-architecture.md section 3 now uses a service identity unlocked by a signed gate token.
- **The harness path needs only the API's credential.** The model never touches GitHub, so any
  credential the API can hold works. Stage 1 uses the prototype organization's token from Secrets
  Manager (the branch's secret `hyperdelivery`, key `github_pat`), narrowed from the branch's classic
  `repo`-scope PAT to a fine-grained token on the prototype organization.
- **A GitHub App installation token is now possible and better.** It expires after one hour and can
  be limited to named repositories (`repositories` or `repository_ids`) and permissions
  (`permissions`, for example contents and pull requests write) when it is minted
  ([GitHub](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)).
  The brief puts it in Stage 4; since it needs an organization administrator, not a seat purchase, it
  could arrive as soon as the prototype organization exists.
- **"Copilot seats" leaves the long-lead track;** the prototype GitHub organization stays (W1 to W3).

## 7. The token in the command logs, and the fix

The branch authenticates clone and push by placing an `Authorization: Basic` header, base64 of the
token, in `GIT_CONFIG_VALUE_0` inside the command string it sends through `InvokeAgentRuntimeCommand`
(`_auth_env` and `_clone_command` in `src/orchestration/build_session.py`). AWS documents that
"AgentCore Runtime sends the request ID and the input command to your agent's Amazon CloudWatch Logs
log group", while output is not logged
([execute command](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-execute-command.html)).
The code scrubs the token from failure output, but not from what the service logs. Two smaller
exposures sit beside it: commands run as root in the same microVM as the agent, so a Git hook the
agent wrote would run during the push with the header in its environment; and the session runs on the
public network unless a VPC is configured.

**Verify:** search the dev account's harness log group for `GIT_CONFIG_VALUE_0`. If it is there,
rotate the PAT.

**Fix:** keep every GitHub credential outside the sandbox.

- **In:** the worker clones with its own token, writes a `git bundle` to S3, and the microVM fetches it
  with a presigned URL that expires in minutes and grants one object.
- **Out:** after each piece, a command streams `git bundle create - <base>..HEAD` back over stdout
  (output is not logged; the 100 MB payload limit is ample for prototypes), with hooks disabled
  (`-c core.hooksPath=/dev/null`). The worker verifies the commits and the diff, then pushes with the
  installation token.

This makes "the model never holds the token" true of the whole sandbox, including its logs.

## 8. Risks and open questions

| Risk or question | Why it matters | Response |
|---|---|---|
| Managed session storage is a preview, capped at 1 GB, reset on version change and after 14 idle days | Work in progress can vanish; a large `node_modules` can hit the file cap | Git is the record (push after every piece); pin the `BUILD` endpoint; dependency stores in the image; ask AWS for the general-availability date |
| 2 vCPU and 8 GB per session | Heavy builds and browser tests run slowly | Measure on the golden intakes; the Runtime Instances compute type offers larger EC2 instances and 14-day sessions at a 12% management fee ([pricing](https://aws.amazon.com/bedrock/agentcore/pricing/)), but harness support for it is not documented |
| Streaming stops at 60 minutes; the Step Functions state at 15 | A long turn loses its live view, or its waiter | One turn per piece, 50-minute turn limit, continue on timeout (section 5.2) |
| `maxTokens` described two ways | A wrong reading under- or over-caps a turn | Test it; rely on our dollar ledger for budgets |
| A pending `ask_user` across a microVM replacement | A next-morning answer could fail | Short-term memory plus the conformance test |
| Prompt injection from repository, plan or Confluence content | The agent has a shell | No credentials and no internet in the microVM, diff checks outside it, hooks on writes, evidence outside it; Gateway policies in Stage 4 |
| Payloads in CloudWatch traces | Code and file contents land in the sandbox account's logs | Synthetic data only in sandboxes (already a `BuildUnit` rule); set retention and access |
| AgentCore's service terms say it "may use and store your content to improve your service experience or performance" ([overview](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html)) | UA code passes through it | Confirm with AWS and Legal whether an AI services opt-out policy covers AgentCore |
| The loop is AWS-managed Strands | Less control than owning the loop, and a lock-in question | The `Builder` port, the Strands export and the conformance suite keep a second engine one step away |
| Hook latency | A synchronous Lambda on every tool call slows the loop | Hook only `file_operations` writes and invocation boundaries |
| Model availability by Region | GPT-5.5 on Bedrock was `us-east-2` only; HyperDelivery is in `us-east-1` | Keep Claude Sonnet 5.5 through the global profile as default; test others in the swap suite |
| Runtime price version | v2 microVM rates are $0.1276 per vCPU-hour and $0.0169 per GB-hour, against v1's $0.0895 and $0.00945 ([pricing](https://aws.amazon.com/bedrock/agentcore/pricing/)) | Confirm which platform version the harness uses; compute is a small share either way |
| Audit queries | Harness events appear as Runtime events in CloudTrail | Write audit queries against `AWS::BedrockAgentCore::Runtime` |
| Per-session cost attribution | Tags attribute per harness only | Our ledger from `metadata` events is the per-project cost |

## 9. Cost of a build

There is no harness fee. Runtime bills per second for active CPU and peak memory, CPU is free
during model and tool waits, memory is billed while the session lives, and session storage is not
charged during the preview ([cost controls](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-operations.html),
[pricing](https://aws.amazon.com/bedrock/agentcore/pricing/)).

**Illustration, not a measurement.** A whole-plan build of eight pieces over 2 hours, with 160 model
calls averaging 50,000 input tokens (90% read from cache) and 1,500 output tokens, on Sonnet 5.5 at
the repo's rates:

| Item | Working | Cost |
|---|---|---|
| Cache reads | 7.2 M tokens at $0.20 per million | $1.44 |
| Uncached input, priced as cache writes | 0.8 M tokens at $2.50 per million | $2.00 |
| Output | 0.24 M tokens at $10.00 per million | $2.40 |
| CPU | 30 active minutes at 2 vCPU = 1 vCPU-hour (v1 / v2) | $0.09 / $0.13 |
| Memory | 4 GB for 2 hours = 8 GB-hours (v1 / v2) | $0.08 / $0.14 |
| **Total** | | **about $6** |

Model tokens are over 95% of it. Real builds will vary widely: Anthropic's simplified long-running
harness ran about 4 hours for $125 in a demonstration
([harness-engineering.md](harness-engineering.md#33-anthropic-harness-design-for-long-running-application-development-prithvi-rajasekaran-mar-24-2026)).
That is why budgets come from measured p90s (section 5.2, item 7), and why cost per accepted build,
not per session, is the headline.

## 10. Recommendation

**Adopt the brief's decision, with the corrections in this report.** One coding lane: the AgentCore
harness in HyperDelivery's sandbox account, behind the `Builder` port, with Claude Sonnet 5.5 through
Bedrock set per call. GitHub Copilot's cloud agent is not a lane for business prototypes; it stays
acceptable on a receiving team's own repositories after T3.

| Stage | What lands |
|---|---|
| **Long lead (W1 to W3)** | Prototype GitHub organization; sandbox AWS account by week 3 (fallback: a named non-production account with no HyperDelivery resources or data credentials); the GitHub App registered in the prototype organization if its administrator agrees |
| **Stage 1 (W1 to W8; the "Coding harness in the sandbox (AgentCore)" row, W2 to W6)** | Harness stack in the sandbox account, VPC mode, endpoints only, package proxy; image by digest, agent as non-root; `BUILD` endpoint; short-term memory; per-piece Step Functions loop with the Fargate worker; Git bundles in and out, no token in the sandbox or its logs; per-piece commits with trailers; the map and signed context in the repository; evidence agent and CI outside the microVM; per-session budget; hooks on protected writes; conformance suite v1, which the harness must pass to be the default; Review's Copilot hand-off removed for business prototypes; SDK upgrade |
| **Stage 2 (W7 to W14)** | Measure with testers: cost per accepted build, human corrections, `ask_user` rate, microVM replacements, merge rate by piece size; scope check in shadow; AgentCore Evaluations on build traces; budgets reset from p90 |
| **Stage 3 (W15 to W24; "Second engine behind the Builder port", W15 to W20)** | A second engine in the same sandbox and image, chosen by the conformance suite: the Claude Agent SDK image on Runtime if a hard in-turn dollar cap, in-process hooks or schema-checked output are needed, or the Strands export if the harness configuration stops being enough; builder sensors on preview logs; the Streamlit builder on the same port |
| **Stage 4 (W19 to W32)** | GitHub App installation tokens everywhere, if not already; Gateway with Dogwood or Cedar policies for any tool that writes; threat model signed by the security architect; inbound OAuth if per-user identity is needed downstream |

## 11. Could not access or verify

- **Not read:** the CreateHarness control-plane API reference and the `harness-get-started` and
  `harness-skills` pages beyond skimming; the AgentCore Runtime security best-practices page; the
  Identity outbound credential pages.
- **Not verified in an account:** whether the dev account's harness log group holds the token
  (section 7); whether a pending inline call survives a microVM replacement with memory on; which
  Runtime platform version and price the harness uses; whether `maxTokens` is per iteration or per
  invocation; whether the CDK release in use exposes hooks.
- **Copilot cloud agent limits** were re-read this round (59 minutes, one repository, one branch, one
  pull request per task, user-to-server tokens only); its pricing and the tasks API's preview start
  date come from [delegation-coco-coding.md](delegation-coco-coding.md) and were not re-read.
- **Dates:** the lifecycle-hooks date is the botocore release that added them (Sep 21, 2026), not a
  launch post; none was found. The Codex on Bedrock post's original date was not shown; its first
  update is June 1, 2026.
- **The comparison of session shapes** rests on mechanism and on evidence about autonomy and review;
  no public head-to-head study of one whole-plan session against per-issue pull requests was found.
- The cost illustration in section 9 uses assumed call counts and the repo's own model rates.

## Sources

### The announcement and AWS documentation

- AWS Machine Learning Blog, [Amazon Bedrock AgentCore harness is now generally available](https://aws.amazon.com/blogs/machine-learning/amazon-bedrock-agentcore-harness-is-now-generally-available-go-from-idea-to-production-grade-agent-in-minutes/) (Kosti Vasilakakis, Alexander Richey, Evandro Franco, Vivek Dalal; June 18, 2026)
- AgentCore Developer Guide: [harness overview](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness.html), [harness vs. Runtime](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-vs-runtime.html), [environment and filesystem](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-environment.html), [security and access controls](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-security.html), [versioning and endpoints](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-versioning.html), [observability and cost controls](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-operations.html), [export to code](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-export.html), [models and instructions](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-models.html), [tools](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-tools.html), [lifecycle hooks](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-lifecycle-hooks.html), [memory](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-memory.html), [interactive shells](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-command-shell.html), [execute shell commands in Runtime sessions](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-execute-command.html), [Runtime filesystem configurations](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-filesystem-configurations.html), [quotas](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/bedrock-agentcore-limits.html), [what is AgentCore](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html)
- AgentCore API Reference: [InvokeHarness](https://docs.aws.amazon.com/bedrock-agentcore/latest/APIReference/API_InvokeHarness.html), [InvokeAgentRuntimeCommand](https://docs.aws.amazon.com/bedrock-agentcore/latest/APIReference/API_InvokeAgentRuntimeCommand.html)
- Step Functions Developer Guide, [Invoke an AgentCore harness](https://docs.aws.amazon.com/step-functions/latest/dg/connect-bedrockagentcore.html)
- [Amazon Bedrock AgentCore pricing](https://aws.amazon.com/bedrock/agentcore/pricing/)
- AWS News Blog, [Get started with OpenAI GPT-5.5, GPT-5.4 models, and Codex on Amazon Bedrock](https://aws.amazon.com/blogs/aws/get-started-with-openai-gpt-5-5-gpt-5-4-models-and-codex-on-amazon-bedrock/) (updated June 1 to 7, 2026)
- botocore, [CHANGELOG](https://github.com/boto/botocore/blob/develop/CHANGELOG.rst) (1.43.99, harness lifecycle hooks) and [PyPI release history](https://pypi.org/project/botocore/#history)

### GitHub documentation

- [About Copilot cloud agent](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent) (limits)
- [Using Copilot cloud agent via the API](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-via-the-api) (token types, preview status)
- [Generating an installation access token for a GitHub App](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)

### The repository

- `origin/coding_agent_harness_test` at `e41f13a` (2026-10-22): `git diff --stat dev...origin/coding_agent_harness_test` (126 files, 10,950 insertions); `docs/decisions.md` entries of 2026-09-30, 2026-10-01 and 2026-10-22; `infra/stacks/harness_stack.py`; `infra/harness-image/Dockerfile`; `src/orchestration/build_session.py`; `src/orchestration/build_worker.py`; `src/providers/harness/client.py`; `src/core/prompting.py`; `src/config/model_pricing.yaml`; `uv.lock`

### Earlier rounds this builds on

- [delegation-coco-coding.md](delegation-coco-coding.md): the coding lanes, the Copilot tasks API, the Claude Agent SDK flags
- [factory-sources-round4.md](factory-sources-round4.md): `dotnet/runtime` success rates, METR, Spotify's judge, review concentration
- [harness-engineering.md](harness-engineering.md): map not manual, the start and end of each attempt, brain, hands and session, ablation on model changes
