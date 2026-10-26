<!-- cspell:words Baselayer Firecrawl Snowsight -->
# UA-DLC research library

Twenty-two research reports, a completeness critique and an index of every source the owner shared,
gathered on 2026-10-25 and 2026-10-26 in six rounds to inform the
[enterprise plan](../enterprise-plan.md), the [platform architecture](../platform-architecture.md),
the [operating model](../operating-model.md) and the [UX direction](../ux-direction.md). Each report was
written by a separate researcher with one brief. In the first round, the critique read all nine
reports, resolved contradictions, spot-checked the most decision-relevant claims, and filled gaps.
The second round answered the owner's review of v2. The third round, labeled Round 4 to match
[sources.md](sources.md), read the owner's next set of sources: four more factory write-ups and two
factory definitions, UA engineering's own AI-DLC tooling, and UA's Baselayer design system. The
fourth, labeled Round 5, checked an X article on harness engineering against the OpenAI and
Anthropic posts it draws on, and added a read-only Figma exploration of UA's brand libraries to the
Baselayer report (its section 11). The fifth, labeled Round 6, read the Amazon Bedrock AgentCore
harness announcement and the documentation behind it, checked the unmerged
`coding_agent_harness_test` branch, and recommended one coding lane: the harness in HyperDelivery's
sandbox account, behind a swappable `Builder` port. The sixth, labeled Round 7, compared HyperDelivery
with the other tools UA teammates can use and placed each on the plan's complexity and use-case
matrices.

These are point-in-time notes. Vendor products, prices and dates in this space change monthly.
Every non-obvious claim carries a source link; claims from secondary sources are marked in the
reports. Verify before acting on one. Reports written before the three-phase plan that use the old stage
numbers, or describe phone or dark-theme screens, carry a note under the title that maps the
stages to the three phases (Current State, Final MVP, Enterprise) or marks those screens out of scope.

| Report | Covers |
|---|---|
| [aws-aidlc.md](aws-aidlc.md) | AWS AI-DLC: the method, the Workflows v1 rules and the 2.x engine, phases, gates, adaptive depth, brownfield reverse engineering, rituals, and a step-by-step mapping to HyperDelivery |
| [anthropic-playbook.md](anthropic-playbook.md) | Anthropic's AI-native SDLC playbook and related material (code review, security, harness design, subagents), translated into factory practices and UX lessons |
| [github-next-chopin.md](github-next-chopin.md) | GitHub Next's Chopin and the GitHub lineage (SpecLang, Copilot Workspace, Spark, Spec Kit, Agent HQ, agentic workflows) |
| [software-factories.md](software-factories.md) | The 2025-2026 software-factory landscape, the Runlayer reference factory, citizen builders, mechanisms worth adopting, and the moat analysis |
| [agent-traces-observability.md](agent-traces-observability.md) | Agent trace and decision-tree UI patterns, the OpenTelemetry GenAI conventions, AgentCore Observability, the observability product landscape, and the three-layer disclosure model |
| [ui-ux-references.md](ui-ux-references.md) | The named UI references (taste-skill, Fluid Functionalism, Bencho, 21st.dev, Ponytail, Beautiful UI) and how AI-native products design for outcomes |
| [under-armour-context.md](under-armour-context.md) | UA's public brand identity, strategy, technology and data landscape, culture and vocabulary, and example use cases by domain |
| [enterprise-integration-platform.md](enterprise-integration-platform.md) | Microsoft 365, Atlassian, AWS AgentCore, sandbox and Snowflake options, with a reference architecture |
| [governance-collaboration.md](governance-collaboration.md) | Authorization and tenancy models, agent identity, risk tiering, approvals and audit, cost, collaboration and context capture |
| [critique.md](critique.md) | Contradictions between reports, spot-checks, gaps, and the fifteen cross-cutting insights |
| **Second round** | |
| [delegation-coco-coding.md](delegation-coco-coding.md) | Delegating to specialists: Cortex Code as the data specialist, the coding agent's two lanes (one lane since Round 6), Rovo and Work IQ, the data and build contracts, and phasing |
| [strands-box-orchestration.md](strands-box-orchestration.md) | Strands Box and Dogwood, their security lessons, orchestration options (Strands, LangGraph, Claude Agent SDK) and the recommended orchestrator |
| [resources-collab-memory.md](resources-collab-memory.md) | Pointing at Microsoft 365 and Atlassian resources instead of uploading, starting from a Jira ticket, Confluence as the collaborative space, and a per-project index and memory on AWS |
| [ua-dlc-reconcile.md](ua-dlc-reconcile.md) | Reconciling UA-DLC with engineering's proposed variant, AWS, Anthropic, Microsoft and other factories into one line, with inputs and outputs per step |
| [uiarc-inventory.md](uiarc-inventory.md) | The complete UI Arc inventory (299 items, free and Pro), its license terms for a software factory, and a mapping onto HyperDelivery's screens |
| [chips-tables-diagrams.md](chips-tables-diagrams.md) | Tool and model chips, the reference trace, modern data tables, gantt components for the decision timeline, and interactive architecture diagrams |
| [logo-assets.md](logo-assets.md) | The brand-mark pack for chips and diagrams, where each mark came from, and what each owner allows |
| **Round 4** | |
| [factory-sources-round4.md](factory-sources-round4.md) | Firecrawl, Cloudflare (Astro triage), Atlassian and Uber factory write-ups and two factory definitions from X, checked against the plan, with 27 nuggets and corrections to earlier research |
| [ua-marketplace-alignment.md](ua-marketplace-alignment.md) | UA engineering's AI-DLC tooling in the internal underarmour/ua-ai-marketplace repository (ideation research, the Jira-to-PR pipeline, AI-DLC context files), where it matches and differs from the UA-DLC line, and what to reuse or raise |
| [baselayer-for-hyperdelivery.md](baselayer-for-hyperdelivery.md) | Applying UA's Baselayer design system to a dense internal app: color roles, the red rule, type and font stand-ins, grid, shape, components, icons and what needs Brand review; section 11 (Round 5) records the Figma exploration and the UA logo files copied from it |
| **Round 5** | |
| [harness-engineering.md](harness-engineering.md) | Harness engineering, from an X article and the OpenAI and Anthropic posts behind it, checked against the plan: why Step Functions stays, 11 nuggets (H1 to H11) with when each lands, the article's checklist, and what was not adopted |
| **Round 6** | |
| [agentcore-harness-coding.md](agentcore-harness-coding.md) | The AgentCore harness as the sandboxed, swappable coding engine: what it is, where the coding agent runs, why one session with the whole plan beats per-issue autopilot pull requests, an engine comparison, what the unmerged branch already does and what the Final MVP still needs, identity, the token in the command logs, risks and cost |
| **Round 7** | |
| [tool-landscape.md](tool-landscape.md) | Where HyperDelivery fits among the tools UA teammates can use (Snowflake CoWork and Snowsight, Cortex Code, GitHub Copilot, Palantir Foundry and AIP, Factory, Claude Code, agentic IDEs, Microsoft 365 Copilot and Copilot Studio): the complexity matrix, the use-case matrix, each tool's audience, data access, governance, path to production, status and pricing, and the 2026 name changes the plan should pick up |
| [sources.md](sources.md) | The index of every link the owner shared, across all rounds, and the report that read each one |

Re-check the reports each quarter, or before any decision that depends on a product's status.
