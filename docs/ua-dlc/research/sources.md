<!-- Point-in-time research, retrieved 2026-10-25 and 2026-10-26 for the UA-DLC plan. Claims carry source links; vendor features and dates change quickly, so verify before acting. See README.md in this folder. -->
<!-- cspell:words aidlc awslabs beautifului bencho flohoeller fluidfunctionalism fxtwitter gabriell githubnext haaarshsingh rafalwilinski tasteskill uiarc BHolmesDev Einy Firecrawl Zohar ZoharEiny Baselayer xwhrrari Kiro Snowsight merill -->
<!-- cspell:ignoreRegExp D6U8sFNGDbbzNtSE39RLvN -->

# Sources the owner shared, and where each one is used

Every link the owner pointed at while the UA-DLC plan was being written, grouped by the round
it arrived in, with the report that read it. Each report also keeps its own full source list;
this page is the index, so nothing the owner shared is lost.

## Round 1: the AI delivery lifecycle and software factories

| Source | What it is | Read in |
|---|---|---|
| [AWS: AI-Driven Development Life Cycle](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/) | AWS's AI-DLC method | [aws-aidlc.md](aws-aidlc.md), [ua-dlc-reconcile.md](ua-dlc-reconcile.md) |
| [awslabs/aidlc-workflows](https://github.com/awslabs/aidlc-workflows) | AI-DLC workflow rules and the 2.x engine | [aws-aidlc.md](aws-aidlc.md), [ua-dlc-reconcile.md](ua-dlc-reconcile.md) |
| [Anthropic: The AI-native SDLC playbook](https://claude.com/resources/articles/the-ai-native-sdlc-playbook) | Anthropic's lifecycle playbook | [anthropic-playbook.md](anthropic-playbook.md) |
| [GitHub Next: Chopin](https://githubnext.com/projects/chopin/) and [githubnext/chopin](https://github.com/githubnext/chopin) | A multiplayer spec-to-build prototype | [github-next-chopin.md](github-next-chopin.md) |
| [Rafal Wilinski on Runlayer's software factory](https://x.com/rafalwilinski/status/2109940991868252302) | A reference factory described in an X post | [software-factories.md](software-factories.md) |

## Round 1: UI and UX references

| Source | What it is | Read in |
|---|---|---|
| [flohoeller: decision trees](https://x.com/flohoeller/status/2113565484469686342) | Agent decision-tree UI | [agent-traces-observability.md](agent-traces-observability.md) |
| [haaarshsingh: traces](https://x.com/haaarshsingh/status/2113295780450587049) | Agent trace UI | [agent-traces-observability.md](agent-traces-observability.md), [chips-tables-diagrams.md](chips-tables-diagrams.md) |
| [flohoeller: agent tree](https://x.com/flohoeller/status/2112150373565612534) | Agent tree UI | [agent-traces-observability.md](agent-traces-observability.md) |
| [gabriell_lab: animation variants](https://x.com/gabriell_lab/status/2107443057805476100) | Motion variants | [ui-ux-references.md](ui-ux-references.md), [critique.md](critique.md) |
| [Taste skill](https://www.tasteskill.dev/) | Anti-template design skill | [ui-ux-references.md](ui-ux-references.md) |
| [21st.dev](https://21st.dev) | Component community | [ui-ux-references.md](ui-ux-references.md) |
| [Ponytail](https://ponytail.dev/) | Interface reference | [ui-ux-references.md](ui-ux-references.md) |
| [Fluid Functionalism](https://www.fluidfunctionalism.com/) | Design philosophy | [ui-ux-references.md](ui-ux-references.md) |
| [Bencho](https://bencho.dev/) | UI building blocks | [ui-ux-references.md](ui-ux-references.md) |
| [Beautiful UI](https://www.beautifului.dev/) | Tool-chip and component reference | [ui-ux-references.md](ui-ux-references.md), [chips-tables-diagrams.md](chips-tables-diagrams.md) |

## Round 2: components, sandboxes and orchestration

| Source | What it is | Read in |
|---|---|---|
| [UI Arc components](https://uiarc.dev/components/) | Full component inventory, free and Pro | [uiarc-inventory.md](uiarc-inventory.md) |
| [AWS: Introducing Strands Box](https://aws.amazon.com/blogs/opensource/introducing-strands-box-ai-agent-sandboxes-powered-by-dogwood/) and [strands-agents/box](https://github.com/strands-agents/box) | Agent sandboxes and Dogwood policies | [strands-box-orchestration.md](strands-box-orchestration.md) |
| A trace screenshot from an X post (attached in chat, no link) | The reference trace for Layer 3 | [chips-tables-diagrams.md](chips-tables-diagrams.md), Appendix A |

## Round 4: more factories, UA's own tooling and UA's brand

| Source | What it is | Read in |
|---|---|---|
| [Firecrawl: the AI software factory](https://www.firecrawl.dev/blog/ai-software-factory) | A factory write-up | [factory-sources-round4.md](factory-sources-round4.md) |
| [Cloudflare: Astro issue triage](https://blog.cloudflare.com/astro-issue-triage) | Agent-driven issue triage | [factory-sources-round4.md](factory-sources-round4.md) |
| [Atlassian: Building your AI work factory](https://www.atlassian.com/blog/ai-at-work/building-your-ai-work-factory) | Atlassian's factory framing | [factory-sources-round4.md](factory-sources-round4.md) |
| [Uber: An efficient software factory](https://www.uber.com/us/en/blog/efficient-software-factory/) | Uber's factory at scale | [factory-sources-round4.md](factory-sources-round4.md) |
| [Zohar Einy on X](https://x.com/ZoharEiny/status/2112480184595063070) | High-level alignment | [factory-sources-round4.md](factory-sources-round4.md) |
| [Ben Holmes on X](https://x.com/BHolmesDev/status/2110406463059636235) | High-level alignment | [factory-sources-round4.md](factory-sources-round4.md) |
| underarmour/ua-ai-marketplace (internal repository, shared as a local folder) | UA engineering's plugins, including its UA-DLC ideation and construction skills | [ua-marketplace-alignment.md](ua-marketplace-alignment.md) |
| UA Baselayer design system (Figma library [`00_UA_Baselayer_Library_Web`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web), internal access) and its `baselayer-design-system` skill in underarmour/ua-ai-marketplace | Under Armour's web design system | [baselayer-for-hyperdelivery.md](baselayer-for-hyperdelivery.md) |

## Round 5: harness engineering and UA's brand files

The owner shared the X article and the UA Brand Logos file. The other web sources are the primary
posts the article draws on, read in full to check it. Both Figma files are internal; assets were
copied from them as exports, and nothing in Figma was modified.

| Source | What it is | Read in |
|---|---|---|
| [@0xwhrrari: Harness Engineering: How to Build AI Agents That Don't Fall Apart](https://x.com/0xwhrrari/status/2093685107534000560) | An X article (Aug 29, 2026), read through the [fxtwitter API](https://api.fxtwitter.com/0xwhrrari/status/2093685107534000560); a synthesis with no data of its own | [harness-engineering.md](harness-engineering.md) section 2 |
| [OpenAI: Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/) | OpenAI's account of building a product with Codex and no hand-written code (Feb 11, 2026) | [harness-engineering.md](harness-engineering.md) section 3.1 |
| [Anthropic: Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) | Session start and end routines for agents that work across many sessions (Nov 26, 2025) | [harness-engineering.md](harness-engineering.md) section 3.2 |
| [Anthropic: Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) | Planner, generator and evaluator, and removing harness parts one at a time as models improve (Mar 24, 2026) | [harness-engineering.md](harness-engineering.md) section 3.3 |
| [Anthropic: Scaling Managed Agents: decoupling the brain from the hands](https://www.anthropic.com/engineering/managed-agents) | Session log, harness and sandbox as separate interfaces (Apr 8, 2026) | [harness-engineering.md](harness-engineering.md) section 3.4 |
| [Anthropic: Building effective agents](https://www.anthropic.com/research/building-effective-agents) | The original source of a line the article credits to the harness design post (Dec 2024) | [harness-engineering.md](harness-engineering.md) section 2 |
| UA Brand Logos (Figma, internal; file key `D6U8sFNGDbbzNtSE39RLvN`, [node `1:5`](https://www.figma.com/design/D6U8sFNGDbbzNtSE39RLvN/UA-Brand-Logos?node-id=1-5)) | UA's logo, lockups, monogram, signatures, tag, echo and colors. Copied, never modified: the small UA logo in black and in white, and the horizontal small UNDER ARMOUR lockup, as SVG exports | [baselayer-for-hyperdelivery.md](baselayer-for-hyperdelivery.md#11-figma-exploration-round-5), [design-system.md](../design-system.md#8-brand-the-ua-logo) |
| `00_UA_Baselayer_Library_Web` (Figma, internal; [file](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web)) | Re-read for the product lockup: its Token Reference header (the UA logo, then "Baselayer Design System - WEB") is the precedent for HyperDelivery's. Copied from, never modified | [baselayer-for-hyperdelivery.md](baselayer-for-hyperdelivery.md#11-figma-exploration-round-5), [design-system.md](../design-system.md#8-brand-the-ua-logo) |

## Round 6: the coding agent in HyperDelivery's sandbox

The owner shared the AWS announcement. The other sources are the documentation, API references and
pricing it links, the GitHub pages behind the comparison with Copilot's cloud agent, and the unmerged
branch that already builds on the harness, read to check the announcement against the plan.

| Source | What it is | Read in |
|---|---|---|
| [AWS: Amazon Bedrock AgentCore harness is now generally available](https://aws.amazon.com/blogs/machine-learning/amazon-bedrock-agentcore-harness-is-now-generally-available-go-from-idea-to-production-grade-agent-in-minutes/) | The harness's general-availability announcement (June 18, 2026) | [agentcore-harness-coding.md](agentcore-harness-coding.md) |
| AgentCore Developer Guide: [harness overview](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness.html), [harness vs. Runtime](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-vs-runtime.html), [environment and filesystem](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-environment.html), [security and access controls](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-security.html), [versioning and endpoints](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-versioning.html), [observability and cost controls](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-operations.html), [export to code](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-export.html), [models and instructions](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-models.html), [tools](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-tools.html), [lifecycle hooks](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-lifecycle-hooks.html), [memory](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-memory.html), [interactive shells](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-command-shell.html) | How the harness is defined, run, versioned, isolated, observed and extended | [agentcore-harness-coding.md](agentcore-harness-coding.md) sections 1, 2 and 5 |
| AgentCore Developer Guide: [execute shell commands in Runtime sessions](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-execute-command.html), [Runtime filesystem configurations](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-filesystem-configurations.html), [quotas](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/bedrock-agentcore-limits.html), [what is AgentCore](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html) | Command logging, session storage, limits and service terms | [agentcore-harness-coding.md](agentcore-harness-coding.md) sections 2, 7 and 8 |
| AgentCore API Reference: [InvokeHarness](https://docs.aws.amazon.com/bedrock-agentcore/latest/APIReference/API_InvokeHarness.html), [InvokeAgentRuntimeCommand](https://docs.aws.amazon.com/bedrock-agentcore/latest/APIReference/API_InvokeAgentRuntimeCommand.html) | The calls that run a turn and a shell command | [agentcore-harness-coding.md](agentcore-harness-coding.md) sections 1 and 7 |
| [Step Functions: Invoke an AgentCore harness](https://docs.aws.amazon.com/step-functions/latest/dg/connect-bedrockagentcore.html) | The optimized state and its limits | [agentcore-harness-coding.md](agentcore-harness-coding.md) section 5.2 |
| [Amazon Bedrock AgentCore pricing](https://aws.amazon.com/bedrock/agentcore/pricing/) | Runtime rates, v1 and v2 | [agentcore-harness-coding.md](agentcore-harness-coding.md) section 9 |
| [AWS: Get started with OpenAI GPT-5.5, GPT-5.4 models, and Codex on Amazon Bedrock](https://aws.amazon.com/blogs/aws/get-started-with-openai-gpt-5-5-gpt-5-4-models-and-codex-on-amazon-bedrock/) | Codex and other models on Bedrock, by Region | [agentcore-harness-coding.md](agentcore-harness-coding.md) section 4 |
| botocore [CHANGELOG](https://github.com/boto/botocore/blob/develop/CHANGELOG.rst) and [PyPI release history](https://pypi.org/project/botocore/#history) | The release that added harness lifecycle hooks (1.43.99, Sep 21, 2026) | [agentcore-harness-coding.md](agentcore-harness-coding.md) sections 1 and 5.2 |
| GitHub Docs: [GitHub Copilot on GitHub.com](https://docs.github.com/en/copilot/concepts/copilot-surfaces/copilot-on-github) (formerly "About Copilot cloud agent"), [Using Copilot cloud agent via the API](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-via-the-api), [Generating an installation access token for a GitHub App](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app) | Copilot's task limits and token types, and GitHub App installation tokens | [agentcore-harness-coding.md](agentcore-harness-coding.md) sections 3, 4 and 6 |
| `origin/coding_agent_harness_test` at `e41f13a` (2026-10-22, this repository, unmerged) | The branch that already builds on a harness | [agentcore-harness-coding.md](agentcore-harness-coding.md) section 5 |

## Round 7: where HyperDelivery fits

The owner named the tools to compare against rather than sharing links: Snowflake, Cortex Code,
GitHub Copilot, Palantir Foundry and AIP, Factory, Claude Code, agentic IDEs as a group, and
Microsoft Copilot. Every source below was found for that comparison, read on 2026-10-26, and is
vendor documentation or an announcement unless marked secondary.

| Source | What it is | Read in |
|---|---|---|
| [Snowflake CoWork product page](https://www.snowflake.com/en/product/snowflake-cowork/) | CoWork, formerly Snowflake Intelligence: what it does, connectors, governance | [tool-landscape.md](tool-landscape.md) sections 4.1 and 7 |
| [Snowflake CoWork Powers the Agentic Enterprise](https://www.nasdaq.com/press-release/snowflake-cowork-powers-agentic-enterprise-personal-agent-knowledge-workers-work) | The June 2, 2026 announcement (Business Wire, read through Nasdaq): the renaming, feature status labels, and Under Armour named as a CoWork customer | [tool-landscape.md](tool-landscape.md) sections 4.1, 6 and 7 |
| Snowflake documentation: [Overview of Snowflake CoWork](https://docs.snowflake.com/user-guide/snowflake-cortex/snowflake-cowork), [Build agents](https://docs.snowflake.com/en/user-guide/snowflake-cortex/snowflake-cowork/build-agents), [CoWork shared resource budgets](https://docs.snowflake.com/en/user-guide/snowflake-cortex/snowflake-cowork/cowork-shared-budgets), [Snowflake AI pricing](https://docs.snowflake.com/user-guide/snowflake-cortex/pricing), [Snowsight dashboards](https://docs.snowflake.com/en/user-guide/ui-snowsight-dashboards), [About Streamlit in Snowflake](https://docs.snowflake.com/developer-guide/streamlit/about-streamlit) | How CoWork reaches data, its controls and billing; Snowsight dashboards; Streamlit in Snowflake | [tool-landscape.md](tool-landscape.md) sections 4.1 and 4.2 |
| [Snowflake CoCo product page](https://www.snowflake.com/en/product/snowflake-coco/), [Overview of Snowflake CoCo](https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code), [Cortex Code in Snowsight general availability](https://docs.snowflake.com/release-notes/2026/other/2026-03-09-cortex-code-snowsight-ga) | Cortex Code's new name, surfaces, controls, status and pricing | [tool-landscape.md](tool-landscape.md) section 4.2 |
| GitHub: [GitHub Copilot on GitHub.com](https://docs.github.com/en/copilot/concepts/copilot-surfaces/copilot-on-github) (formerly "About Copilot cloud agent"), [Copilot plans](https://docs.github.com/en/copilot/get-started/plans), [GitHub Copilot is moving to usage-based billing](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/), [GitHub Copilot app generally available](https://github.blog/changelog/2026-06-17-github-copilot-app-generally-available), [GitHub Copilot app available to all](https://github.blog/changelog/2026-07-07-github-copilot-app-available-to-all/), [Upcoming deprecation of GitHub Spark](https://github.blog/changelog/2026-08-04-upcoming-deprecation-of-github-spark-on-github-com) | Copilot's agents, plans, AI Credits billing, the Copilot app (generally available June 17, 2026; on every plan since July 7), and Spark's end | [tool-landscape.md](tool-landscape.md) section 4.3 |
| Palantir Foundry documentation: [Ontology](https://www.palantir.com/docs/foundry/ontology/overview), [Workshop](https://www.palantir.com/docs/foundry/workshop/overview), [AIP Logic](https://www.palantir.com/docs/foundry/logic/overview), [AIP Chatbot Studio](https://www.palantir.com/docs/foundry/chatbot-studio/overview), [AI FDE](https://www.palantir.com/docs/foundry/ai-fde/overview), [Developer Console](https://www.palantir.com/docs/foundry/developer-console/overview/), [Usage types](https://www.palantir.com/docs/foundry/resource-management/usage-types) | What Foundry and AIP build, how changes are proposed, and how usage is metered | [tool-landscape.md](tool-landscape.md) section 4.4 |
| Factory: [home page](https://factory.com/), [pricing](https://factory.com/pricing), [docs index](https://docs.factory.com/llms.txt), [Welcome](https://docs.factory.com/welcome/index.md), [Missions](https://docs.factory.com/missions/overview.md) | Droid's surfaces, Missions, enterprise controls and plans; the Under Armour logo, checked 2026-10-26 | [tool-landscape.md](tool-landscape.md) section 4.5 |
| Claude Code documentation: [Overview](https://code.claude.com/docs/en/overview), [Use Claude Code in the cloud](https://code.claude.com/docs/en/claude-code-on-the-web); [Claude pricing](https://claude.com/pricing) | Claude Code's surfaces, cloud sessions, controls and plans | [tool-landscape.md](tool-landscape.md) section 4.6 |
| Agentic IDEs: [Cursor pricing](https://cursor.com/pricing), [Cursor is now part of SpaceX](https://cursor.com/blog/joining-spacex), [Devin Desktop](https://devin.ai/desktop), [Kiro is generally available](https://kiro.dev/blog/general-availability/), [Kiro blog](https://kiro.dev/blog/), [Kiro pricing](https://kiro.dev/pricing/) | Cursor, Devin Desktop (formerly Windsurf), Kiro and others: plans, ownership and status | [tool-landscape.md](tool-landscape.md) section 4.7 |
| Microsoft: [Get started with Copilot Cowork](https://learn.microsoft.com/copilot/microsoft-365/cowork/get-started), [What is Microsoft Copilot Managed Runtime (preview)](https://learn.microsoft.com/microsoft-365/managed-apps/), [Copilot Managed Runtime overview for admins (preview)](https://learn.microsoft.com/en-us/microsoft-365/admin/manage/apps/), [Migrate apps created from Power Apps Vibe](https://learn.microsoft.com/power-apps/vibe/migrate-apps) ("You can access your Vibe apps until November 30, 2026"), [Copilot Studio overview](https://learn.microsoft.com/en-us/microsoft-copilot-studio/fundamentals-what-is-copilot-studio), [Build apps in Copilot Cowork and Copilot Studio](https://www.microsoft.com/microsoft-copilot/blog/copilot-studio/build-apps-in-copilot-cowork-and-copilot-studio/), [Copilot Cowork is now generally available](https://www.microsoft.com/en-us/copilot/blog/2026/06/16/copilot-cowork-is-now-generally-available/) (June 16, 2026), [Microsoft 365 Copilot pricing](https://www.microsoft.com/en-us/microsoft-365-copilot/pricing), [Microsoft 365 Copilot for enterprise](https://www.microsoft.com/en-us/microsoft-365-copilot/enterprise), [MC1505609](https://mc.merill.net/message/MC1505609) (Message Center, read through merill.net mirror) | What business users and makers can build, under which license, how Cowork is billed, and the App Builder retirement | [tool-landscape.md](tool-landscape.md) section 4.8 |

## Round 8: who else is building toward UA-DLC, and a simpler app

The owner shared factory.com, to take Factory's actual logo, and named the rest: Cursor's logo with a
generic mark for the other agentic IDEs; Chopin, Claude's AIDLC and AWS's AIDLC as the comparisons to
prepare; ChatGPT, Claude Desktop and Gemini as the bar for simplicity; and a full pass over UA's Figma
resources and libraries. Everything else below was found for those asks and read on 2026-10-26 without
signing in. Each report keeps its full source list.

| Source | What it is | Read in |
|---|---|---|
| [Factory home page](https://factory.com/) | The symbol the site inlines, taken as Factory's mark | [logo-assets.md](logo-assets.md#7-tool-comparison-marks-added-2026-10-26) |
| [Cursor brand page](https://cursor.com/brand) and simple-icons `cursor` | Cursor's cube, shown beside a generic mark for the other agentic IDEs | [logo-assets.md](logo-assets.md#7-tool-comparison-marks-added-2026-10-26) |
| GitHub Next Chopin: [project page](https://githubnext.com/projects/chopin/), [README](https://github.com/githubnext/chopin/blob/main/README.md), [implementation lifecycle](https://github.com/githubnext/chopin/blob/main/docs/implementation-lifecycle.md) | "Chopin": status re-checked and placed on the UA-DLC phases | [dlc-landscape.md](dlc-landscape.md) section 3, building on [github-next-chopin.md](github-next-chopin.md) |
| [The AI-native SDLC playbook](https://claude.com/resources/articles/the-ai-native-sdlc-playbook), [Claude Design](https://claude.com/product/design), [Claude Tag](https://claude.com/product/tag) | "Claude's AIDLC": Anthropic's method (Aug 21, 2026) and the Claude products behind it | [dlc-landscape.md](dlc-landscape.md) section 3, building on [anthropic-playbook.md](anthropic-playbook.md) |
| AWS AI-DLC: [aidlc-workflows](https://github.com/awslabs/aidlc-workflows), its [releases](https://github.com/awslabs/aidlc-workflows/releases) and [phases and stages](https://github.com/awslabs/aidlc-workflows/blob/main/docs/guide/04-phases-and-stages.md); [Kiro workflows](https://kiro.dev/blog/introducing-workflows/) | "AWS's AIDLC": the rules engine's current release, its mockup stages, and Kiro | [dlc-landscape.md](dlc-landscape.md) section 3, building on [aws-aidlc.md](aws-aidlc.md) |
| Spec Kit and Copilot, Factory, Devin, Microsoft's Copilot apps, Rovo Dev, Google, Lovable, v0, Bolt, Replit, Snowflake apps and 8090 | The other products compared, from vendor pages and announcements | [dlc-landscape.md](dlc-landscape.md#sources) |
| ChatGPT: [ChatGPT Work and Codex](https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex), [desktop app](https://learn.chatgpt.com/docs/app), [long-running work](https://learn.chatgpt.com/docs/long-running-work) | Sidebar, the artifacts viewer beside the chat, the goal progress row, approvals | [ai-app-layouts.md](ai-app-layouts.md) section 2.1 |
| Claude: [Claude Cowork and chat are one Claude](https://support.claude.com/en/articles/16761823), [artifacts](https://support.claude.com/en/articles/9487310), [Claude Desktop and Cowork changelog](https://claude.com/docs/cowork/changelog) | One conversation, artifacts beside it, in-app approval cards | [ai-app-layouts.md](ai-app-layouts.md) section 2.2 |
| Gemini: [Canvas](https://support.google.com/gemini/answer/16047321), [Deep Research](https://support.google.com/gemini/answer/15719111) | Canvas on the right of the chat; a plan before long work | [ai-app-layouts.md](ai-app-layouts.md) section 2.3 |
| Microsoft Copilot: [the Copilot app](https://support.microsoft.com/en-us/microsoft-365-copilot/what-is-microsoft-copilot-app), [Cowork approvals](https://support.microsoft.com/en-us/microsoft-365-copilot/cowork-take-control-actions), [Copilot Pages](https://support.microsoft.com/en-us/microsoft-365-copilot/get-started-with-microsoft-365-copilot-pages) | The app UA's people will compare HyperDelivery with first | [ai-app-layouts.md](ai-app-layouts.md) section 2.4 |
| Builders: [Lovable editor](https://docs.lovable.dev/features/projects/editor), [v0 Design mode](https://v0.app/docs/design-mode), [Replit Plan vs. Build](https://docs.replit.com/learn/plan-vs-build-mode), [GitHub Copilot app](https://github.blog/news-insights/product-news/github-copilot-app-the-agent-native-desktop-experience/) | Chat left, preview right; plans approved before building | [ai-app-layouts.md](ai-app-layouts.md) sections 2.5 to 2.8 |
| `00_UA_Baselayer_Library_Web` (Figma, internal; [file](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web)) | Read again for an app shell: the account side nav, preview sections, the three-dot loader, snackbar, messages, toggle, tooltips, dialogs, Action Cards and the icon system. Read-only; nothing in Figma was modified | [figma-libraries.md](figma-libraries.md) section 2.1 |
| `00_Baselayer Ignite - Design System App` (Figma, internal; library key only), the four organization libraries and eight community kits listed by `get_libraries` | Searched for shell components; the Ignite file itself needs its link from the owner | [figma-libraries.md](figma-libraries.md) sections 1, 2.2 and 2.3 |

Concept screens and the plan page are published separately: the
[concept canvas](https://claude.ai/artifact/BUcEKzAz1CXa27EY398sAF) and the
[plan page](https://claude.ai/artifact/FTURRJS2HcSGEDT7QQYowh), both private until shared.
