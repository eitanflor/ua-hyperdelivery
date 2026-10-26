<!-- cspell:words pandoc -->

# UA-DLC: planning HyperDelivery's next phase

The Under Armour AI Delivery Lifecycle (UA-DLC) is the process; HyperDelivery is the platform
that runs it. This folder holds the plan for taking HyperDelivery from an Enterprise Data
Management pilot to a platform several departments can use safely, and the evidence behind it.

| Document | Read it when |
|---|---|
| [enterprise-plan.md](enterprise-plan.md) | You want the proposal: the narrative, where HyperDelivery fits beside other tools (a complexity matrix and a use-case matrix), the ask in three tranches, the three phases (Current State, Final MVP, Enterprise) with an architecture diagram for each, the milestones, measures, cost and risks |
| [operating-model.md](operating-model.md) | You need how UA-DLC works: the four-phase line, each step's inputs and outputs, how artifacts are shown, where projects start, tier contract, who signs, roles, time budgets, support, handoff, glossary |
| [platform-architecture.md](platform-architecture.md) | You are building it: how it connects, the orchestrator and its specialists, delegation contracts, identity, authorization, Snowflake and Cortex Code, resources and per-project memory, telemetry, sandboxes, generated-code security, what lands in which phase |
| [ux-direction.md](ux-direction.md) | You are designing or reviewing the experience: information architecture, key screens, help behind the "?", tool chips, trace, data tables, decision timeline, architecture canvas, UI Arc mapping. Desktop and laptop only, light theme only |
| [design-system.md](design-system.md) | You are building or reviewing the look: HyperDelivery on UA Baselayer, with light-theme tokens, type, spacing, the app shell, components, icons and the red rule |
| [Concept canvas](https://claude.ai/artifact/BUcEKzAz1CXa27EY398sAF) | You want to see it: 22 concept artboards on UA Baselayer with the UA logo, in rows by phase, each titled with the phase it belongs to. They include the generic Start, Inbox and Projects, the trace, a project's own architecture, HyperDelivery's platform architecture by phase, the lifecycle map and three design-system boards; desktop and light only, with help behind the "?" in the top bar (private until the owner shares it). Every name, project and number on it is invented to show the design; none is a measured result |
| [Plan page](https://claude.ai/artifact/FTURRJS2HcSGEDT7QQYowh) | You want to share the plan as a page: rendered from enterprise-plan.md, which stays the source (private until shared) |
| [Concept site](site/) | You want both without a claude.ai account: `make site` serves `docs/ua-dlc/site/` at http://localhost:8766/, with the plan page (`plan/index.html`, rebuilt from enterprise-plan.md with `make site-plan`, which needs pandoc) and the concept canvas (`concepts/`), which pans and zooms like a design canvas and opens each board live. Static HTML with no build step; the site's README says how to open, rebuild and publish it |
| [current-state.md](current-state.md) | You need an honest, file-referenced picture of what the repo does today |
| [research/](research/README.md) | You want the sourced research behind a recommendation |

**How these were made.** Six parallel reads of the repository produced the current-state brief.
Nine researchers covered AWS AI-DLC, Anthropic's AI-native SDLC playbook, GitHub Next's Chopin,
the software-factory landscape, agent traces, UI references, Under Armour's public context,
enterprise integration options, and governance and collaboration; a critic then checked them. The
first draft of the plan was reviewed from six seats: the sponsor, engineering, data platform,
analytics and business users, a fact-checker and a senior product designer, and v2 addressed that
review. A second research round then covered the full UI Arc component inventory, tool chips,
traces, tables and diagrams, brand marks, Strands Box and orchestration, delegation to Cortex Code
and coding agents, pointing at resources with per-project memory, and reconciling UA-DLC with
engineering's proposed variant. v3 adds the orchestrator design, the unified line, the
working-version-first roadmap and the color system. A fourth round read four more factory write-ups,
UA engineering's own AI-DLC tooling and UA's Baselayer design system; six independent design audits
then set the Baselayer-based design system and the redesigned concept screens. A fifth round placed
Step Functions against LangGraph, read the harness-engineering write-up, split each project's own
architecture from HyperDelivery's platform architecture, and brought in the UA logo. A sixth round
moved the coding agent into HyperDelivery's sandbox: one AgentCore harness session per build behind a
swappable `Builder` port, in place of GitHub Copilot's per-issue cloud agent
([research/agentcore-harness-coding.md](research/agentcore-harness-coding.md)). A seventh round
reorganized the plan into the owner's three phases: Current State, the Final MVP (built to MVP
ready in week 14, then a real testing pilot through week 22) and Enterprise, with an architecture
diagram for each and a rule that enterprise work never holds up the Final MVP or its pilot. It moved
the "which tool" guidance out of the app and into the plan's complexity and use-case matrices
([research/tool-landscape.md](research/tool-landscape.md)), narrowed the design to desktop and
laptop browsers in the light theme only, moved help behind a "?" in the top bar, made Start generic,
added Inbox and Projects screens, and put a standalone copy of the plan page and the concept canvas
in the repo ([site/](site/)).

**Status:** draft v3 for leadership review, October 2026. Until the decisions in the plan are made,
[docs/hyperdelivery-plan.md](../hyperdelivery-plan.md) remains the MVP plan of record and
[docs/design/](../design/README.md) remains the design library of record.
