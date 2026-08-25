# Hyperdelivery Architecture

## High-level

Four independently-deployed agents, one per delivery gate, each running as its own
AgentCore Runtime container. A client (Streamlit tester locally, or a future
orchestrator/control plane) calls one agent at a time through the AgentCore Runtime HTTP
contract; nothing here calls another agent directly today - handoff between gates is
manual (a human moves the artifact from one gate to the next).

```mermaid
flowchart LR
    client["Client\n(curl / Streamlit tester)"]

    subgraph G1["Distill (G1)"]
        distill["Strands Agent\nFSD -> StructuredSpec"]
    end
    subgraph G2["Blueprint (G2)"]
        blueprint["Strands Agent\nStructuredSpec -> Blueprint"]
    end
    subgraph G3["Review (G3)"]
        review["Strands Agent\nCode + FSD/Blueprint -> ReviewReport"]
    end
    subgraph G4["Showroom (G4)"]
        showroom["Strands Agent\nReviewed FSD -> DemoPackage"]
    end

    bedrock[("Amazon Bedrock\n(Claude)")]
    s3[("S3\nedma-ai-test")]
    atlassian[("Atlassian Cloud\nConfluence + Jira")]

    client -->|"POST /invocations"| distill
    client -->|"POST /invocations"| blueprint
    client -->|"POST /invocations"| review
    client -->|"POST /invocations"| showroom

    distill --> bedrock
    blueprint --> bedrock
    review --> bedrock
    showroom --> bedrock

    distill -->|"s3_get_document_text"| s3
    distill -->|"confluence_* (read-only)"| atlassian
    blueprint -->|"jira_* (issue lifecycle)"| atlassian

    distill -.->|"human moves signed-off spec"| blueprint
    blueprint -.->|"human moves approved blueprint"| review
    review -.->|"human clears gate"| showroom
```

No shared orchestrator, agent registry, or Step Functions control plane exists yet -
Strands owns each agent's own tool-use loop, and gate-to-gate progression is a human
action. See [docs/decisions.md](./decisions.md) for why.

## Low-level (per-agent composition)

Every agent container is built from the same composition root shape. Distill (the most
built-out agent, with two external tools) is shown below; Blueprint/Review/Showroom follow
the identical shape with fewer tools (see the table after the diagram).

```mermaid
flowchart TD
    main["agent_runtime/distill/main.py\n(entrypoint)"]
    factory["agent_runtime/factory.py\ncreate_app()"]
    loader["config/loader.py\nload_agent_config()"]
    yaml["config/agents/distill.yaml"]
    agentconfig["core/domain/agent_config.py\nAgentConfig\n(model_id, system_prompt, max_tokens)"]
    strandsfactory["providers/agents/strands_factory.py\nbuild_agent()"]
    bedrockmodel["strands.models.BedrockModel"]
    agent["strands.Agent\n(tool-use loop)"]
    settings["config/settings.py\nSettings (env/.env)"]

    subgraph tools["tools/ (policy layer, per-agent gating)"]
        scorecheck["tools/distill.py\nscore_completeness"]
        docs["tools/documents.py\ns3_document_tool()\n(gated on S3_BUCKET/S3_REGION)"]
        atl["tools/atlassian.py\nconfluence_mcp_client()\n(gated on ATLASSIAN_*)"]
    end

    subgraph providers["providers/ + mcp_clients/ (generic, reusable, no policy)"]
        s3provider["providers/storage/s3.py\nget_document_text() / parse_document()"]
        mcpclient["mcp_clients/atlassian.py\nconfluence/jira session builders"]
    end

    subgraph obs["infrastructure/observability/"]
        logging["logging.py\nconfigure_logging()\nsession-id-aware"]
        tracing["tracing.py\nconfigure_tracing()\nregisters real TracerProvider"]
    end

    main --> factory
    factory --> loader --> yaml
    loader --> agentconfig
    factory --> strandsfactory
    strandsfactory --> agentconfig
    strandsfactory --> bedrockmodel --> agent
    factory --> agent
    factory --> logging
    factory --> tracing

    main --> docs
    main --> atl
    docs --> s3provider
    atl --> mcpclient
    docs --> settings
    atl --> settings
    factory --> settings

    agent -->|"tool calls"| scorecheck
    agent -->|"tool calls"| docs
    agent -->|"tool calls"| atl
```

| Agent | Deterministic validator tool | External tools | Output model |
|---|---|---|---|
| Distill | `score_completeness` | `s3_get_document_text`, Confluence MCP (read-only) | `StructuredSpec` |
| Blueprint | `validate_units_of_work` | Jira MCP (issue lifecycle) | `Blueprint` |
| Review | `validate_review_report` | none | `ReviewReport` |
| Showroom | `validate_talk_track_coverage` | none | `DemoPackage` |

**Standing convention**: for any new external integration, split it into a generic,
policy-free provider/client (`providers/` or `mcp_clients/`) plus a per-agent `@tool`
wrapper in `tools/` that pulls config from `Settings` and enforces least-privilege
(e.g. the LLM can only ever supply an S3 object *key*, never a bucket). This generalizes
beyond MCP - the S3 tool has no MCP protocol involved at all and still follows the split.
