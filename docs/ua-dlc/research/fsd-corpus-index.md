<!-- Point-in-time research, retrieved 2026-10-27 for the UA-DLC north star (round 9). Claims carry source links; vendor features and dates change quickly, so verify before acting. See README.md in this folder. -->
<!-- cspell:words Tesseract Xiang actuals misbounds reranked reranking worklogs -->

# Approved FSDs as a precedent corpus: sourcing, structure and uses (as of 2026-10-27)

> HyperDelivery is the tool; UA-DLC is the process it runs. A recent internal team note lists FSD, TSD
> and BRD as "legacy names, not required" for what UA-DLC produces. This report agrees: the approved FSD
> corpus is knowledge HyperDelivery learns from, and an FSD-format rendering of a HyperDelivery plan is
> an optional export for teams that still want one, never a required output.

Key: `fsd-corpus-index`. Builds on [current-state.md](../current-state.md) (the "Historical FSD index"
row and the UA-specific moat row), [platform-architecture.md](../platform-architecture.md) sections 11
(per-project index and memory) and 14 (quality and evaluation),
[resources-collab-memory.md](resources-collab-memory.md) section 4,
[operating-model.md](../operating-model.md) section 8 (artifacts, certified definitions first), the two
FSD decisions in `docs/decisions.md` (lines 2140-2166, `EvidenceLink.source`; lines 2475-2502, the FSD
embedding index), and the code in `src/tools/distill.py` and `src/tools/documents.py`. It does not repeat
the per-project knowledge base design; it adds a second, workspace-level corpus of approved precedent.

## 0. Bottom line

1. **Today HyperDelivery has a seed, not a corpus.** It recognizes two UA FSD template families by their
   headings, flags sections left as Word placeholders, parses three field-constraint phrasings, and ranks
   files in the `fsds/` bucket by one Titan embedding per file (`src/tools/distill.py:12-163`,
   `src/tools/documents.py:104-130`). It cannot tell an approved FSD from a draft, a current one from a
   superseded one, or one that led to a good build from one that did not, and it embeds only the first
   20,000 characters of each file.
2. **The documents are not the moat. The labels and links are.** Microsoft 365 Copilot already grounds
   on any SharePoint file a user can open, reads a library's columns when a user scopes a question to that
   library, and since August 2026 admins can mark sites as authoritative for Copilot Search. What another
   tool cannot get by reading the same files: an owner's rule for what counted
   as approved, applied to each document; each FSD broken into typed records in the same shape as
   HyperDelivery's plan; links from those records to Snowflake objects, golden reports, Jira epics and what
   happened after delivery; and a graded set of intake-to-approved-FSD pairs. Each of these costs UA
   people's time to create, which is why it is hard to copy.
3. **Store it so it outlives any vendor.** Keep typed records as versioned JSON in S3 (the canonical copy,
   which survives the "exit ramp" in [enterprise-plan.md section 5](../enterprise-plan.md#5-why-hyperdelivery-and-not-a-generic-tool)).
   Index each FSD section as its own document in one workspace-level Bedrock Managed Knowledge Base with
   metadata (approval tier, superseded, domain, template, year), and set those filters in tool code, not
   in the prompt.
4. **Precedent shows how UA did it before. It never says what this project needs.** The existing rule that
   reference material cannot be a requirement's only evidence (`src/core/domain/spec.py:40-56`) extends to
   everything here. Precedent produces drafts, citations and questions; people answer the questions.
5. **Uses, roughly in order of value:** drafting grounded in approved precedent with section-level
   citations; gap questions ("9 of the 10 approved inventory FSDs specify Security Access; this plan does
   not"); an evaluation set of intake-to-approved-FSD pairs that grades the Plan step with the target FSD
   held out; a prior-work check at intake; definitions harvested into the Library for steward
   confirmation; effort ranges from Level of Effort history checked against Jira actuals; a map of whom to
   ask; and an optional rendering in the EDMA FSD format.
6. **On AWS:** the Managed Knowledge Base (hybrid search, reranking, metadata filters, ACL-aware
   filtering) for retrieval; Bedrock Data Automation standard output for PDFs and scans, with Word files
   read by their own structure; an LLM pass for typed records with verbatim quotes. Not OpenSearch
   Serverless (classic collections bill about $175 to $350 a month whatever the corpus size; the
   scale-to-zero generation shipped in May 2026, but its use as a knowledge base store is not verified),
   not a graph database (typed link records answer the multi-hop questions at this size), and not
   AgentCore Memory (its long-term strategies consolidate and rewrite records).
7. **The cost is people, not compute.** For 2,000 FSDs, parsing and extraction cost a few hundred dollars
   to about $1,300 once, and the index costs tens of dollars a month. Labeling and owner review take
   hundreds of hours.
8. **What decays it:** object names and definitions that changed, reversed decisions reused as if
   current, approved FSDs whose builds failed treated as good examples, and people in the SME map who have
   moved on. Every record carries an as-of date, a validity check against today's Snowflake, a supersession
   link and, where known, an outcome.
9. **The Final MVP prepares data, not infrastructure:** an inventory, a written approval rule signed by an
   owner, 20 hand-labeled approved FSDs, the typed schema and template crosswalk, an eval seed of 10 to 20
   pairs, and provenance sidecars for what already sits in `fsds/`. The two long-lead asks are read access
   to wherever approved FSDs live and a named owner who can say what counts as approved.
10. **How it serves the north star.** AI-driven drafting and AI-driven questioning both need UA-specific
    grounding and a way to measure quality. This corpus provides both. Its golden set is the evidence for
    moving a step from AI-assisted to AI-driven, while people keep making the decisions the step surfaces.

---

## 1. What exists today

| Piece | Where | What it does | Limit |
|---|---|---|---|
| Template detection | `src/tools/distill.py:12-39`, `:58-87` | Two families keyed by headings found verbatim (case-insensitive) in extracted text. `edm_fsd`: EDM Request Roles, User Story, Success Criteria, Functional Area, Value Add, The Ask, Measures & Dimensions, Security Access, Level of Effort. The older `servicenow_idea`: SECTION 1: HIGH LEVEL REQUIREMENTS, SECTION 2: SMALL REQUESTS, SECTION 3: LARGE REQUESTS, Data Mapping. Needs 3 matching headings, then slices the text between them | Uses the first occurrence of each heading (`lower_text.index`, `:82`), so a table of contents, or a heading mentioned earlier in the body, misbounds every section (not yet tested on real FSDs). Records no template version. The third layout on the unmerged export (last row) has headings neither family lists |
| Placeholder scoring | `:40-46`, `:90-114` | Counts a section as unanswered if it still holds the Word template's placeholder text ("Click here to enter text.", "Choose an item.") | Per document only. Never aggregated across the corpus, which is what gap detection needs |
| Field constraints | `:47-55`, `:131-163` | Three patterns from real "Error Handling Fields" sections: "should never exceed n", "should be the FORMAT date format", "should be n or n" | Three phrasings only. Everything else is left to the model |
| Listing reference FSDs | `src/tools/documents.py:18-26`, `:63-93` | Lists `fsds/` keys; the category is the folder in `fsds/<category>/<ticket-id>-<slug>.pdf` | The folder is the only metadata. The runtime role gets `s3:GetObject` on `fsds/*` (`infra/stacks/storage_stack.py:108-118`), and I found no `s3:ListBucket` grant there or in `scripts/iam/agentcore-execution-policy.json`, so listing on deployed runtimes is not verified |
| Similarity search | `src/tools/documents.py:104-130`; `src/providers/storage/embeddings.py:18-96` | One Titan Text Embeddings V2 vector per file in `fsds/_index.json`; cosine similarity computed in the tool; returns the top 3 keys | Embeds only the first 20,000 characters (`embeddings.py:22`, `:49`), about six or seven pages. One vector per file dilutes section-level matches. No keyword matching, so a search for a table name or a demand number relies on semantics. The index records neither the model id nor the build time. The whole JSON file loads on every call |
| Index build | `scripts/build_fsd_index.py:1-47`; `make build-fsd-index` | An operator rebuilds it by hand with their own credentials | No trigger, and staleness is invisible. The decision (docs/decisions.md:2475-2502) says to revisit with S3 events |
| Parsing | `src/providers/documents/parsing.py:45-77` | pypdf text per page; python-docx paragraphs and tables; images through Tesseract | PDF tables flatten into lines. A scanned PDF yields empty text. Word heading styles and content controls are not used |
| Reading a reference | `src/tools/documents.py:29-48` | Returns Markdown and, inside a project, writes it into that project's normalized corpus | A past FSD lands in the project corpus next to the project's own inputs with source type `s3`, so storage alone cannot tell precedent from input |
| Provenance in the plan | `src/core/domain/spec.py:40-56`; docs/decisions.md:2140-2166 | `EvidenceLink.source = "reference_material"` marks a past FSD; G1 flags a requirement whose only evidence is reference material | Records the kind of source, not the file, section or version |
| Prompt | `src/config/agents/distill.yaml:98-129` | Distill always looks for related FSDs before drafting, similarity search first | Distill only. Blueprint and Review never see precedent |
| FSD-format export (unmerged) | Branch `sme-dev-rebuild`, commit `e3c2d28` (2026-09-25), `ui/console/src/components/inspector/views.tsx` | Renders the plan as a PDF in the "EDMA Request - FSD Template v5.1.1" layout. Cover: an Armour Desk table (Demand Number, Demand Description) and EDM Request Roles (Requestor, SME(s), Users, Business Process Owner (BPO), IT Application Resource(s)). Body headings: New Data, Data Models, Business Constraints, Analytical Layer, Additional Documentation. Ends with a requirement traceability appendix | Not merged. It shows a third layout and a version number (5.1.1) that implies a version history the repo does not record |

In short, the repo can recognize, score and find FSDs. It cannot tell approved from draft, current from
superseded, or a good outcome from a bad one, and it searches whole files rather than sections. One
documentation fix is needed: [current-state.md](../current-state.md) cites `docs/decisions.md:1885-1912`
for the index decision, but that entry now sits at lines 2475-2502. Both FSD entries in the decision
log also lack a dated heading.

---

## 2. Sourcing at UA

### 2.1 Where approved FSDs probably live

Each row is a hypothesis drawn from the repo and the templates. None of it is confirmed.

| Likely location | Why we think so | How HyperDelivery would read it | Approval signal there | Confirm with |
|---|---|---|---|---|
| `fsds/` in the documents bucket | It exists, and its key convention carries a ticket id | Already read | None recorded | Whoever loaded it: where each file came from, and whether it is the approved version |
| EDM SharePoint team sites and Teams channel files (which are stored in SharePoint) | The FSD template is a Word file with content controls ("Click here to enter text"), which is the usual SharePoint workflow | Microsoft Graph, or the managed SharePoint connector with `Sites.Selected` | Content approval status, major versions, an "Approved" folder, and a sign-off table inside the document | EDM leads and SharePoint admins: which sites and libraries, and whether content approval or versioning is on |
| Armour Desk demand records, with attachments | The v5.1.1 cover's Armour Desk table holds a Demand Number, and the older template's name, `servicenow_idea`, suggests a ServiceNow idea form | ServiceNow Table and Attachment APIs (a custom reader) | The demand state. ServiceNow's demand workflow moves a qualified demand to Approved or Deferred ([ServiceNow docs](https://www.servicenow.com/docs/r/it-business-management/strategic-planning/demand-process-flow.html)) | The ServiceNow platform team: whether Armour Desk is a ServiceNow instance (no public source says so; not verified), which tables, and how long attachments are kept |
| Jira issue attachments and linked Confluence pages | Keys like ADVA-2011 in the decision log, and the `<ticket-id>` in the key convention | The existing Atlassian client; Rovo MCP later | Issue status, an approval transition, a comment | Atlassian admins and EDM leads: which projects, and whether FSDs are attached or linked |
| Confluence EDM space | Distill already reads Confluence; some teams write specifications as pages | The existing client, or the managed Confluence connector | Content status ("Ready for review", or "Verified" if the space adds it) or an approvals app | Space admins: pages or attachments, and the status conventions |
| Outlook | Approval by email reply is common, and the only evidence of approval may be in mail | Graph mail, delegated, much later | An "approved" reply from the named approver | EDM leads and Privacy: whether email approval was the norm |
| Personal OneDrive | Drafts in progress | Not indexed | Mostly drafts | Excluded by default |

### 2.2 Telling approved from draft

Use three tiers, and let a person assign the rule that maps signals to tiers for each location.

- **Tier A, approved with evidence.** A filled sign-off table with names and dates; an e-signature
  envelope marked complete; an Armour Desk demand in an approved or completed state with this document
  attached at approval; a SharePoint item approved through a real approval step; a Confluence approval
  record pinned to the page version.
- **Tier B, approved by inference.** A delivered Jira epic linked to the document; the document is the
  latest version in an "Approved" or "Final" folder; the file name says "FINAL" or "signed".
- **Tier C, draft, rejected or unknown.** A minor version (0.x); placeholder text still present
  (`score_template_coverage` below a threshold the owner sets); a status of Pending, Draft or Rejected; no
  signal at all.

Four traps:

- When a library owner turns on SharePoint content approval, files already in the library are marked
  Approved automatically, so the status alone proves nothing for older files
  ([Microsoft Support](https://support.microsoft.com/en-us/sharepoint/lists/documents-and-library/require-approval-of-items-in-a-list-or-library)).
- A major version (1.0) means published, not approved
  ([versioning and approval planning](https://support.microsoft.com/en-gb/sharepoint/libraries/plan-document-versioning-content-approval-and-check-out-controls-in-sharepoint)).
- Confluence's "Verified" is a status a space may add, not a default. One developer thread (May 2024)
  reports that the REST API returned the status only for a page's latest version (secondary,
  [space help page](https://su-jsm.atlassian.net/wiki/spaces/Answers/pages/164430006/Content+Statuses+in+Answers),
  [developer thread](https://community.developer.atlassian.com/t/confluence-api-content-state-for-a-page-version/80333)).
- Delivered does not mean the document was approved, and approved does not mean it was built.

**Default rule:** only Tier A becomes precedent and gold data. Tier B joins once the owner confirms that
class of document. Tier C never becomes precedent; if the owner agrees, sent-back drafts with their
reviewer comments are kept as labeled negatives for gap detection and evaluation. The approved artifact
is often a PDF export while the Word file kept changing, so the version that carries the approval
evidence is the record, matched by hash or version label.

### 2.3 Template families and versions

| Family | Headings | Evidence | Open points |
|---|---|---|---|
| `servicenow_idea` (described as older) | SECTION 1: HIGH LEVEL REQUIREMENTS; SECTION 2: SMALL REQUESTS; SECTION 3: LARGE REQUESTS; Data Mapping | `src/tools/distill.py:27-32`, `:63-64` | Years in use; whether it came from a ServiceNow form or a Word template |
| `edm_fsd` | EDM Request Roles; User Story; Success Criteria; Functional Area; Value Add; The Ask; Measures & Dimensions; Security Access; Level of Effort; often an "Error Handling Fields" subsection | `src/tools/distill.py:16-26`, `:47-50` | Its version, and whether it is an earlier v5.x |
| "EDMA Request - FSD Template v5.1.1" | Cover: Enterprise Data Management & Analytics; Armour Desk (Demand Number, Demand Description); EDM Request Roles (five roles). Body: New Data; Data Models; Business Constraints; Analytical Layer; Additional Documentation | Commit `e3c2d28` on `sme-dev-rebuild` | Whether it is the current `edm_fsd` or a separate family; earlier versions and their dates |

The version on each document's cover or in its file properties should be recorded at ingestion. The
crosswalk from each version's headings to canonical sections (section 3.2) should come from the template
owner's version history, not from guesses. This repeats open question 11 in current-state.md: who owns
the template?

### 2.4 What must be confirmed with owners

1. Every location that holds approved FSDs, with a count by year and template version.
2. What counted as approved in each era, who could approve, and where that evidence lives.
3. Whether Armour Desk is ServiceNow, and whether FSDs are attached to demands there.
4. The template version history and its owner.
5. Whether approved FSDs may be readable by the whole EDM workspace (the default proposed in 3.6).
6. Which FSDs to exclude by sensitivity label or topic (HR, legal, security).
7. Whether sent-back drafts and reviewer comments may be kept as labeled negatives.
8. Which Jira projects hold the epics built from FSDs.

---

## 3. Structure-aware ingestion

### 3.1 The pipeline

```
inventory row (location, owner, approval tier, sensitivity label)   <- a person sets the tier rule
  -> fetch the original (Word preferred; PDF or scan otherwise); keep bytes, source version id, hash
  -> parse: Word by its own structure (heading styles, tables, content controls);
            PDF and scans by BDA standard output (Markdown, tables as CSV, page numbers)
  -> detect family and version (headings plus cover fields), map headings to canonical sections
  -> extract typed records with an LLM; each record carries a verbatim quote, section and page
  -> verify in code: quote present in parsed text, fields typed, placeholders flagged
  -> scan for personal data and secrets; redact sample rows; take classification from the source label
  -> link: Snowflake objects (do they exist today?), golden reports, demand and Jira keys, epics, repos
  -> write canonical JSON to S3 (document, sections, records, links), versioned
  -> ingest one knowledge base document per section, with metadata; recompute corpus statistics
  -> spot-check queue for an EDM analyst; each correction becomes an extractor test case
```

Word files are read directly because BDA converts DOCX to PDF before processing and loses page mapping
([BDA prerequisites](https://docs.aws.amazon.com/bedrock/latest/userguide/bda-limits.html)), while the
Word file itself carries heading styles, table cells and content controls (the placeholder fields)
exactly.

### 3.2 Canonical sections and the template crosswalk

"Not seen" means the repo does not show the heading, not that the template lacks it.

| Canonical section | `edm_fsd` | `servicenow_idea` | EDMA v5.1.1 | Typed records |
|---|---|---|---|---|
| Roles | EDM Request Roles | Not seen | EDM Request Roles | Role |
| The request | The Ask | SECTION 1 | Armour Desk: Demand Description | Requirement |
| User story | User Story | Not seen | Not seen | Requirement; business value (use case) |
| Success criteria | Success Criteria | Not seen | Not seen | Success criterion; acceptance criterion |
| Value | Value Add | Not seen | Not seen | Business value (return) |
| Functional area | Functional Area | Not seen | Not seen | Domain metadata |
| Data sources | Not seen | Data Mapping | New Data | Data source |
| Data model | Measures & Dimensions | Data Mapping | Data Models | Measure; dimension |
| Rules | Error Handling Fields | Not seen | Business Constraints | Business rule; field constraint |
| Workflows and non-functional needs | Not seen | Not seen | Analytical Layer | Requirement (non-functional) |
| Security | Security Access | Not seen | Not seen | Security access |
| Effort | Level of Effort | SECTION 2 or 3 (small or large) | Not seen | Level of effort |
| Open items | Not seen | Not seen | Additional Documentation | Open question |

### 3.3 Typed records

Every record carries the document id, canonical section, page, a verbatim quote, the extractor and model
version, a confidence, and a review state (machine, spot-checked, owner-confirmed).

| Record | Key fields | Maps to HyperDelivery |
|---|---|---|
| FSD document | Source URI and version, hash, family, template version, title, demand number, ticket keys, domain, approval tier and evidence (kind, who, when, pointer), approved date, supersedes and superseded-by, sensitivity label, access reference, ingested at | A resource with a `SourceRef` (platform-architecture section 11) |
| Section | Canonical id, original heading, text, page span, placeholder flag | One knowledge base document |
| Requirement | Text, intent, acceptance criteria | `Requirement`, `RequirementIntent`, `AcceptanceCriterion` |
| Business rule and field constraint | Field, rule text, kind (maximum, format, allowed values, derivation) | `MachineReadableRule`; `extract_field_rules` already yields the first three kinds |
| Measure | Name, definition text, formula, grain, filters, unit | A Library fact candidate, compared with the certified definition |
| Dimension | Name, hierarchy, source column | Data map |
| Data source | System, Snowflake fully qualified name, connector, refresh | `data_connectors`, `snowflake_connectors`, data map |
| Security access | Audience, groups or roles, row-level rule | Plan; target tier checklist |
| Success criterion | Text, measurable target | Test plan |
| Role | Role kind (requestor, SME, user, business process owner, IT application resource, approver), name as written, resolved Entra object id, date | People to ask (section 4.7) |
| Level of effort | Value, unit, who estimated, date | Handoff package estimate |
| Outcome (link record) | Jira epics, status, created and resolved dates, repositories, report or app names, follow-up demands | Precedent weighting |

Keeping these records a superset of `StructuredSpec` (`src/core/domain/spec.py:84-108`) lets precedent,
gold data and HyperDelivery's own output be compared field by field. The comparison already says
something: `StructuredSpec` has no field for security access, measures and dimensions, roles or effort,
the sections approved EDM FSDs consistently carry.

### 3.4 Links to Snowflake, golden reports and what was built

- **Snowflake objects.** Table and view names are extracted by pattern and by the model, then resolved by
  the data specialist against the account's metadata views: exists, renamed or dropped, with the check
  date. Classification tags read at the same time feed the record's sensitivity. Never rows
  (platform-architecture section 7).
- **Golden reports.** Matched by name against a list of golden reports and certified dashboards with
  their owners. That such a list exists is not confirmed.
- **What was built.** Demand number and ticket keys lead to Jira epics (status, created and resolved
  dates, issue count), then to repositories through Jira's development links, then to report or app names.
  After delivery: follow-up demands that cite the FSD, defects and, later, usage of the delivered report.
  Each link carries an as-of date. A missing link means "unknown", not "failed".

### 3.5 Supersession, staleness and de-duplication

- **Duplicates.** One FSD often sits in several places (SharePoint, a Jira attachment, an email, `fsds/`).
  Exact copies are caught by a hash of the normalized text. Near copies are caught by the same demand
  number, or by high similarity plus the same title. The copy with the approval evidence is the canonical
  one; the others are recorded as copies.
- **Versions.** The chain from 0.x to the approved version is kept. Only the approved version is
  precedent. The differences between versions are a separate signal (section 6.3).
- **Supersession.** A later approved FSD for the same demand, a change-request FSD that amends one, or a
  retired system. Candidates come from the same demand, the same objects and a later date; an owner
  confirms. Retrieval excludes superseded documents by default.
- **Staleness.** Each record carries its approved date and its last validity check. It is marked stale
  when its Snowflake objects no longer exist, when its measure conflicts with today's certified
  definition, or when an owner says so. Stale records stay searchable for history, labeled as stale.

### 3.6 Access control and classification

- **Default: a curated corpus readable by the whole EDM workspace.** This is the same rule the plan
  already sets for the workspace knowledge base: sync only sources the whole workspace may read
  (platform-architecture section 11). Which approved FSDs enter it is the corpus owner's decision,
  recorded per class of document. FSDs are excluded by sensitivity label (the managed SharePoint
  connector can exclude by Purview label,
  [AWS docs](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-ds-sharepoint.html)) and by
  topic.
- **If per-document permissions must hold,** the managed SharePoint connector crawls permissions and
  re-checks them live at query time, but it needs Entra app-only authentication and the full-control role
  on each selected site. AWS states that ACL awareness "is not authorization": it matches users by exact
  email and fails closed ([ACL-aware retrieval](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-acl.html)).
  S3 and Custom data sources take permissions from metadata we supply, with no live check, so the retrieval
  tool re-checks as the asking user (Cedar, in the Enterprise phase).
- **Derived records inherit** their document's permissions and label. A harvested definition stays
  restricted until a steward publishes it to the Library.
- **The knowledge base id and the default filters** (Tier A, not superseded, permitted labels) are set in
  the tool's code in `tools/`, never supplied by the model, following the provider/tool split in AGENTS.md.
- **Retention.** Copies in AWS sit outside Purview retention, eDiscovery and legal hold
  ([resources-collab-memory.md 4.4](resources-collab-memory.md#44-recommended-design), point 7). Deletions
  at the source propagate, and Records Management and Legal sign off.

### 3.7 Personal data and secrets inside FSDs

- **What turns up:** names and emails in the roles tables (expected, but personal data); sample rows or
  report screenshots containing customer or employee data; connection strings or credentials pasted into
  data sections; vendor terms.
- **How to handle it:**
  - Detect at ingestion. AWS's reference pattern redacts documents with an Amazon Comprehend PII job before
    indexing ([AWS blog](https://aws.amazon.com/blogs/machine-learning/protect-sensitive-data-in-rag-applications-with-amazon-bedrock/)).
    Bedrock Guardrails' sensitive-information filter at retrieval is probabilistic, and its masking does not
    reach model invocation logs ([Guardrails docs](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-sensitive-filters.html)).
  - Drop sample rows and the OCR text of screenshots from the index; the original stays at its source.
  - Run the repo's secret scanner over parsed text and quarantine any hit.
  - Keep names as structured Role records with restricted access, out of retrievable text if Privacy says
    so.

### 3.8 Extraction quality

Every record's quote must appear in the parsed text, or the record is dropped. Field-level agreement with
the 20 hand-labeled FSDs is the acceptance test for the extractor. An EDM analyst spot-checks 10% of
machine records, and each correction becomes a test case. A change of extractor or model re-extracts
everything and reports the differences before the new records replace the old ones.

---

## 4. Uses, and how each works

### 4.1 Drafting grounded in approved precedent, with citations (Enterprise)

- **Mechanism.** While drafting a plan section, a per-agent tool retrieves 3 to 5 sections from approved,
  current FSDs in the same domain and canonical section, filtered and reranked. The draft cites them as
  chips that name the document, year and section, for example "Approved FSD ADVA-2011 (2024), Security
  Access". The citation opens that section at the approved version.
- **Guardrail.** Adopted wording becomes a question to the requester, not a fact: "Last year's inventory
  FSDs limited access to the planning group. Same here?" The `reference_material` evidence rule keeps
  precedent from being a requirement's only evidence. The user-facing label ("Precedent", say) needs the
  usual glossary test with teammates (operating-model section 12).

### 4.2 Gap detection (Enterprise)

- **Mechanism.** Offline, compute how often approved FSDs in each domain and template answer each
  canonical section and record kind with real content (the `score_template_coverage` logic, run across
  the corpus). At plan time, when the plan lacks something that most approved peers have, HyperDelivery
  raises an open question that quotes the statistic and links two examples.
- **Guardrail.** Gap findings are questions, never approval preconditions, which keeps platform-architecture
  section 14's rule that preconditions are deterministic with a stated reason, "never a percentage
  threshold". Rejected drafts with reviewer comments, if kept, show which omissions approvers sent back
  most often.

### 4.3 An evaluation golden set from intake-to-approved pairs (seed in the Final MVP, CI in Enterprise)

- **Mechanism.** A pair is the intake as it arrived (the demand description, the ticket, the first email)
  and the FSD that was finally approved. Run the line on the intake and grade the Plan step's output (the
  plan signed at approval 2) against the FSD's typed records: recall of requirements, measures and
  dimensions, data sources, security access and success criteria. The approved FSD also acts as the answer
  key for a simulated stakeholder, who answers HyperDelivery's questions only with what the FSD says.
  Grading uses a rubric and an LLM judge, calibrated against two human graders on a subset, never text
  matching. These pairs join the 20 to 50 golden intakes the plan already calls for
  (platform-architecture section 14), and they exist before the pilot produces any.
- **Guardrails.** Hold the target FSD, its copies and its supersession chain out of the precedent index
  during the run, or retrieval leaks the answer. An approved FSD is one acceptable answer, not the only
  one: things the plan adds are reviewed by a person, not counted as errors. A simulated stakeholder is
  more cooperative than a real one, so the scores are an upper bound.

### 4.4 A prior-work check at intake (Enterprise)

- **Mechanism.** At intake, search the corpus for the same objects, measures and domain. "This looks
  like ADVA-2011, approved in 2024 and delivered as an inventory aging report" points the requester at
  existing work or makes the new project a change to something that exists (operating-model section 2,
  Path). The plan already uses issue links for a duplicate check
  ([resources-collab-memory.md section 2](resources-collab-memory.md#2-starting-from-a-jira-ticket-or-confluence-page));
  this adds approved history.

### 4.5 Definitions harvested into the Library (Enterprise, with the Library)

- **Mechanism.** Measures from "Measures & Dimensions" and "Data Models" are matched to certified
  definitions (semantic views and golden reports) by name and formula. Three outcomes:
  - The definition matches: cite the certified source.
  - It conflicts: flag it, for example "the 2023 FSD defines net sales without returns; the certified
    view includes them".
  - Nothing is certified: propose a steward request with the FSD as evidence.
- **Guardrail.** A steward confirms before anything becomes canonical. HyperDelivery holds no catalog write
  access (operating-model section 8).

### 4.6 Estimation from Level of Effort history (Enterprise, once actuals are linked)

- **Mechanism.** Level of Effort in an FSD is an estimate. Actuals come from the linked Jira epics
  (created to resolved, story points, worklogs where teams log them). The ratio of actual to estimate,
  by domain and size, gives a range. The handoff package's Construction estimate cites the 3 to 5 nearest
  approved precedents with both numbers.
- **Guardrail.** Historical actuals describe human-built work; AI-driven Construction will differ, so
  label the range "human-built precedent". The sample is small and the units may vary (an open question).

### 4.7 A map of whom to ask (beyond Enterprise, after Privacy review)

- **Mechanism.** The roles tables (Requestor, SME(s), Users, Business Process Owner, IT Application
  Resource(s)), the approvers and the Jira assignees become edges from people to domains, tables, measures
  and systems, with counts and recency. Each name is resolved to an Entra object id, and checks confirm the
  person is still active and in a related role. A new project gets ranked suggestions of whom to ask. This
  feeds the north-star goal of proactive Teams questions: a gap (4.2) becomes a question, the map suggests
  the person, and the question arrives as a Teams card under the notification policy (operating-model
  section 11, at most one card per project per day).
- **Guardrails.**
  - This is a profile of employees' expertise, so Privacy reviews it before it exists.
  - People can see and correct their own entries.
  - It is never shown as a ranking of experts.
  - Messaging a person is a side effect, so the requester approves the recipients once per project before
    HyperDelivery sends anything.

### 4.8 An optional FSD-format rendering (when a receiving team asks)

The unmerged export in commit `e3c2d28` already renders the plan in the "EDMA Request - FSD Template
v5.1.1" layout. Keep it as an export of the signed plan version, carrying that version's hash, for teams
that still file FSDs. The plan stays the record. Merging it is cheap, but it is not a Final MVP
deliverable unless a pilot team asks for it.

---

## 5. AWS options

### 5.1 Compared

| Option | What it offers this corpus | Fit | Notes |
|---|---|---|---|
| **Bedrock Managed Knowledge Base** (GA June 2026, [What's New](https://aws.amazon.com/about-aws/whats-new/2026/06/amazon-bedrock-managed-knowledge-base/)) | Managed store, embeddings and reranking at no extra charge; hybrid and agentic retrieval; native connectors; a Custom data source with direct ingest and delete; ACL-aware filtering; metadata filters ([overview](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-build-managed.html)) | **Recommended** for retrieval | Chunking is built-in or fixed size only, so section-aligned chunks mean ingesting each section as its own document. Managed filters support `equals`, `notEquals`, range, `in` and `notIn`, but not `startsWith` or `stringContains`, with up to 5 filters per group ([query configuration](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-test-config.html)). The ServiceNow connector (4 Sep 2026) crawls knowledge articles and catalog items with attachments, not demand or idea records ([connector](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-ds-servicenow.html), [What's New](https://aws.amazon.com/about-aws/whats-new/2026/09/amazon-bedrock-managed-knowledge-base-servicenow-native-data-source-connector/)), so FSDs attached to demands need the Custom path |
| **Bedrock Data Automation** | Standard output: Markdown, tables as CSV, OCR for scans, at $0.010 a page. Custom output: blueprints at $0.040 a page for up to 30 fields, plus $0.0005 per extra field ([pricing](https://aws.amazon.com/bedrock/pricing/)) | **Recommended for PDFs and scans**; blueprints only for form-like cover fields | Up to 3,000 pages with the splitter; 40 blueprints per project, 100 leaf fields and 30 list leaf fields per blueprint; DOCX converted to PDF with page mapping lost ([prerequisites](https://docs.aws.amazon.com/bedrock/latest/userguide/bda-limits.html)). Narrative sections with lists of requirements suit an LLM pass better than a blueprint |
| **Customer-managed knowledge base on S3 Vectors** | The cheapest vector storage; Bedrock parsers (BDA or a model); more chunking choices | Hold in reserve | Semantic search only. Hybrid search is supported only on RDS, OpenSearch Serverless and MongoDB stores with a filterable text field ([search type](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-test-config.html)). Up to 1 KB of custom metadata and 35 keys per vector through Bedrock ([S3 docs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-vectors-bedrock-kb.html)), below S3 Vectors' own limit of 2 KB filterable and 50 keys ([limits](https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-vectors-limitations.html)). GA on 2 Dec 2025 ([AWS blog](https://aws.amazon.com/blogs/aws/amazon-s3-vectors-now-generally-available-with-increased-scale-and-performance)). Storage $0.06 per GB-month in US East ([S3 pricing](https://aws.amazon.com/s3/pricing/)) |
| **Customer-managed knowledge base on OpenSearch Serverless** | Hybrid search, the full filter set, faceting | Not at this size | Classic collections bill at least 2 OCUs (1 in dev-test mode without standby replicas) at $0.24 per OCU-hour, about $350 or $175 a month whatever the corpus size ([pricing](https://aws.amazon.com/opensearch-service/pricing/)). The next-generation collections (28 May 2026) have no minimum and scale to zero after 10 idle minutes ([AWS Big Data blog](https://aws.amazon.com/blogs/big-data/amazon-opensearch-serverless-cost-effective-search-capabilities-at-any-scale)); whether a Bedrock knowledge base can use one is not verified |
| **GraphRAG with Neptune Analytics** | Graph built automatically from documents, traversed after vector search | Not now | S3 data sources only; no control over how the graph is built; 1,000 files per data source (10,000 on request); no autoscaling ([AWS docs](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-build-graphs.html)). Automatically extracted entities would not match the typed schema |
| **AgentCore Memory** | Conversation history, summaries, proposed facts | Not for the corpus | Long-term strategies consolidate and can merge or rewrite records ([strategies](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory-strategies.html); [resources-collab-memory.md 4.1](resources-collab-memory.md#41-what-each-aws-piece-is-for)). Precedent needs exact, versioned, cited text |
| **Snowflake Cortex Search** | Hybrid vector and keyword search with reranking and attribute filters, inside Snowflake ([overview](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-search/cortex-search-overview)); per-call dynamic filters for Cortex Agents since March 2026 ([release note](https://docs.snowflake.com/en/release-notes/2026/other/2026-03-12-recent-cortex-search)) | An alternative for typed records | Puts FSD records next to the catalog and lets analysts query them with SQL. The 2026-09 decision rejected Cortex for the first index because the repo had no SQL client; the Cortex Code delegation in the plan changes that. Decide in Enterprise |
| **Today's JSON index** | Works now | Keep until Enterprise | Fine for a few hundred files. Record the model id and build time (section 7) |

Two connector facts bear on the customer-managed rows. Since 30 Sep 2026, customer-managed knowledge
bases cannot add new Confluence, SharePoint, Salesforce or Web Crawler connectors; existing ones keep
working ([AWS notice on the SharePoint connector page](https://docs.aws.amazon.com/bedrock/latest/userguide/sharepoint-data-source-connector.html)).
This confirms the statement in platform-architecture section 11, which names only SharePoint and
Confluence. The managed side has grown past the seven connectors the overview table lists: the ACL page
also covers ServiceNow, Confluence Data Center, Box, Zendesk and Salesforce
([ACL-aware retrieval](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-acl.html);
[Confluence Data Center, What's New, 9 Sep 2026](https://aws.amazon.com/about-aws/whats-new/2026/09/amazon-bedrock-managed-knowledge-base-confluence-data-center-native-data-source-connector/)).

### 5.2 When a knowledge graph beats plain vector retrieval

Graphs help with multi-hop questions that connect facts across documents. A systematic comparison found
plain RAG better on single-hop and detail questions and GraphRAG better on multi-hop questions, by about
2 to 3 points with Llama-3.1-8B (NQ F1 64.8 against 63.0; HotpotQA F1 60.0 against 63.0; MultiHop-RAG
accuracy 67.0 against 70.3), with weaker graph variants scoring far lower
([Han et al., "RAG vs. GraphRAG: A Systematic Evaluation and Key Insights", arXiv:2502.11371, v3](https://arxiv.org/abs/2502.11371)).
A later analysis finds basic RAG enough for simple lookups, graphs ahead on complex reasoning, and much
longer prompts and higher token cost for some graph methods
([Xiang et al., arXiv:2506.05690](https://arxiv.org/abs/2506.05690)). Microsoft's GraphRAG targets global
questions over a whole corpus ([Edge et al., arXiv:2404.16130](https://arxiv.org/abs/2404.16130)).

HyperDelivery's multi-hop questions are known in advance: which approved FSDs used this table, who
approved them, and what was built and how it turned out. Typed records with explicit link records answer
these as joins, which a few thousand documents and tens of thousands of records do not strain. A graph
database earns its place only if open-ended multi-hop questions recur and the joins prove slow or awkward.
In effect, the typed links already are the graph.

### 5.3 Recommended combination

Canonical JSON in a versioned S3 prefix is the system of record for the corpus. One workspace-level
Managed Knowledge Base (Custom data source, one document per section, metadata for tier, superseded,
domain, template, version, year and label) serves retrieval. Corpus statistics for gap detection come
from a small offline job over the JSON. BDA standard output parses PDFs and scans, Word files are read
directly, and an LLM pass extracts typed records. All of this is Enterprise work (section 7 lists what
comes first).

### 5.4 Rough cost for 2,000 FSDs

Assumptions (mine, to be replaced by the inventory): 12 pages and about 8,000 tokens per FSD, so 24,000
pages and 16 million tokens; about 8 million output tokens for typed extraction; originals about 1 MB
each (2 GB); normalized text about 40 KB each (80 MB).

| Item | Unit price | Estimate |
|---|---|---|
| BDA standard output, every page | $0.010 a page | About $240 once |
| BDA blueprint for cover-page fields only (2 pages per FSD) | $0.040 a page | About $160 once |
| BDA blueprint on every page (the alternative) | $0.040 a page | About $960 once |
| Typed extraction with Claude Sonnet 5.5 (Anthropic list price; Bedrock's price not checked) | $2 in and $10 out per million tokens, half price with the Batch API ([pricing](https://platform.claude.com/docs/en/about-claude/pricing)) | About $56 batched, $112 not; roughly double with a verification pass |
| Embeddings, if self-managed (Titan Text Embeddings V2) | $0.02 per million tokens ([AWS launch post](https://aws.amazon.com/blogs/machine-learning/get-started-with-amazon-titan-text-embeddings-v2-a-new-state-of-the-art-embeddings-model-on-amazon-bedrock/)) | Under $1 per full re-embed |
| Managed Knowledge Base storage | $5 per GB of raw data a month | $0.40 a month (normalized text only) to $10 (originals) |
| Managed Knowledge Base retrieval | $1 per 1,000 Retrieve calls; $4 per 1,000 agentic calls plus their Retrieve calls | About $35 a month at 20,000 Retrieve and 2,000 agentic calls |
| S3 Vectors (the alternative) | $0.06 per GB-month of storage | Cents a month for about 80,000 vectors |
| OpenSearch Serverless, classic collections (the alternative) | $0.24 per OCU-hour, 1 to 2 OCU minimum | About $175 to $350 a month |
| Labeling 20 FSDs | About 2 hours each, plus 30 minutes of owner review | About 50 hours |
| Spot-checking 10% of 2,000 | About 30 minutes each | About 100 hours |

Compute comes to a few hundred dollars to about $1,300 once, and roughly $10 to $50 a month. People's
time costs more than all of it.

---

## 6. Why this is hard to copy, and what decays it

### 6.1 What a competitor or a general tool can and cannot copy

| Asset | Can Copilot, Rovo or a vendor tool get it? | Why it holds |
|---|---|---|
| The FSD files | Yes. Copilot's semantic index grounds on SharePoint files the user can open, and uses a library's column metadata when a user scopes a question to that library or folder on the web ([Microsoft](https://learn.microsoft.com/en-us/microsoftsearch/semantic-index-for-copilot)). The 11 Aug 2026 release notes added "Authoritative Sites", so admins can have Copilot Search prioritize up to 100 sites; it requires a Copilot license ([release notes](https://learn.microsoft.com/en-us/microsoft-365/copilot/release-notes); [docs](https://learn.microsoft.com/en-us/sharepoint/sharepoint-authoritative-sites)) | Not a moat on its own |
| Approval tiers per document, with the owner's rule | Partly. An authoritative site is a site-level setting, and an approval column would reach Copilot only in library-scoped questions; deciding each document's tier needs UA's evidence and an owner's judgment | Requires people who know what counted as approved in each era |
| Typed records aligned to HyperDelivery's plan | Only by rebuilding the schema, the crosswalk and the corrections | The corrections accumulate with each spot-check |
| Links to Snowflake objects, golden reports, epics and outcomes | No. They exist in no single document | Built from several systems, checked against today's Snowflake |
| The intake-to-approved golden set | No | Graded by UA approvers. It is also what lets HyperDelivery show, rather than claim, that a change made it better |
| The draft-to-approved edit trail | No | Shows what reviewers actually changed (6.3) |
| Steward-confirmed definitions in the Library | No | Each one needs a steward |
| New approved records from every HyperDelivery project | No | Each signed plan, decision record and handoff becomes a new linked record, so the corpus grows with use while a copy starts from documents |

### 6.2 What decays it, and the countermeasure

| Decay | Countermeasure |
|---|---|
| Tables renamed or retired, definitions changed | A validity check against Snowflake on ingestion and on a schedule; a "stale" label; conflicts with certified definitions raised to a steward |
| Old decisions reused as if they were current policy | An as-of date on every citation; supersession links; precedent framed as questions; security access always re-asked |
| Approved but failed or abandoned builds treated as good examples | Outcome links; precedent weighted by outcome; "approved" never shown alone as "good" |
| Template drift, where headings change meaning | Version recorded per document; a crosswalk maintained by the template owner |
| People who left or changed roles | Entra checks before any suggestion; date on every role edge |
| Permissions drifting at the source | Live re-check where the connector supports it; Cedar re-check as the asking user; deletions propagated |
| Copying precedent makes every plan look like the past | Grade plans on content, not headings; the team note already treats the old document names as optional |

### 6.3 Adjacent data that compounds with the corpus

These are FSD-adjacent sources that only UA has. Each is a candidate, not a plan.

- **The edit trail from draft to approved**, from SharePoint version history or e-signature rounds. The
  differences show what reviewers add or remove, which is exactly what the Plan step should anticipate.
- **Sent-back FSDs with reviewer comments**: why approvers said no.
- **The original intake text** (demand descriptions, first emails): how requests arrive before anyone
  shapes them, which is the input HyperDelivery actually sees.
- **Change requests after delivery**: what the approved FSD missed.
- **HyperDelivery's own decision records and signatures**: from the pilot on, every project adds a
  linked, approved record without anyone filing it.

---

## 7. Risks and open questions

### Risks

| Risk | Mitigation |
|---|---|
| Approval cannot be established for most files, so the corpus shrinks to a small Tier A set | The owner confirms by class of document; start with the most recent years; Tier B with confirmation |
| Precedent is copied as current policy (security access, definitions) | As-of dates, validity checks, questions instead of facts, the `reference_material` evidence rule |
| Content leaks across departments through the index | A curated, workspace-readable corpus; exclusion by label and topic; Cedar re-check |
| Personal data or credentials end up in the index | Scan, redact, quarantine; restricted Role records |
| Evaluation leakage inflates scores | Hold out the target FSD, its copies and its chain |
| Survivorship bias: approved is mistaken for good | Outcome links and weighting |
| The SME map raises privacy concerns or names people who have moved on | Privacy review first; Entra checks; suggestions only; the requester approves recipients |
| Labeling time never materializes | Keep the sample to 20; ask for analyst time as a long-lead request |
| Vendor features change monthly (the Managed Knowledge Base is four months old) | Canonical JSON in S3; the index can be rebuilt from it |
| Section slicing breaks on a table of contents | Test detection on the labeled sample before relying on it |

### Open questions

1. Where do approved FSDs live, and how many are there by year and template version?
2. What counted as approved in each era, and who can say so for each class of document?
3. Is Armour Desk a ServiceNow instance, and are FSDs attached to demands there?
4. Is `edm_fsd` an earlier version of "EDMA Request - FSD Template v5.1.1", or a separate family? Who owns
   the template history?
5. May approved FSDs be readable by the whole EDM workspace, and by other workspaces later?
6. May names and roles from FSDs be indexed for a map of whom to ask?
7. Is there a list of golden reports and certified dashboards, with owners, to link against?
8. What unit does Level of Effort use (hours, sizes, points), and are Jira actuals reliable enough to
   calibrate against?
9. May sent-back FSDs and their reviewer comments be kept as labeled negatives?
10. Do receiving teams want an FSD-format rendering of the plan at all?
11. How do the AWS copies map to Purview retention and legal hold?
12. When an approved FSD conflicts with today's certified definition, does the steward always decide, and
    is the conflict worth surfacing to the FSD's original owner?

---

## 8. What to prepare now (Final MVP), without building ahead

Data, rules and schemas only. No knowledge base, connectors, pipeline, graph or SME map until Enterprise.

1. **Inventory (weeks 1 to 4).** A spreadsheet, not a system: location, count, years, family and version,
   approval signal available, owner, access status, sensitivity label. An EDM analyst, with the plan
   owner.
2. **The approval rule (by week 4).** One page mapping each location's signals to Tiers A, B and C, signed
   by the named owner and logged in `docs/decisions.md` with the `log-decision` skill.
3. **A labeled sample (weeks 3 to 8).** 20 Tier A FSDs stratified by family, version, domain and year (at
   least three per family seen), hand-labeled into the typed schema with quotes and pages. Add up to five
   sent-back drafts if the owner agrees. Store them under a restricted prefix in the documents bucket, not
   in Git, because they are UA content.
4. **The typed schema and template crosswalk.** A reviewed document plus a version-0 JSON Schema, using
   `StructuredSpec` names where they fit. The Pydantic model goes into `core/domain/` only when its first
   consumer lands.
5. **An eval seed (weeks 8 to 12).** 10 to 20 intake-to-approved pairs from the sample, where the
   original intake can be recovered, with a written rubric and the hold-out rule. Run it on demand against
   Distill and the Plan step during the pilot, and keep the scores as the baseline.
6. **Small capture choices in today's code.**
   - A `.metadata.json` sidecar next to each file in `fsds/` (source URI, tier, approved date, family,
     version, demand number). This is the sidecar format the S3 data source of a Bedrock knowledge base
     reads ([query configuration](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-test-config.html)).
   - The embedding model id and build time recorded in `_index.json`.
   - Originals kept with their S3 version ids (the bucket is already versioned).
   - Reference reads labeled as reference in the project corpus.
7. **A one-off extraction trial on the 20, in HyperDelivery's own account** against the restricted
   prefix from item 3, not in the prototype sandbox account, which holds dev data only and no data
   credentials ([platform-architecture.md](../platform-architecture.md)). Today's parsers plus BDA
   standard output on the PDFs (a few dollars), scored by field-level agreement with the hand labels. The output is a
   decision record on parser and model for Enterprise, not a service.
8. **File the long-lead requests in weeks 1 and 2** (section 9), on the plan's long-lead track.

---

## 9. Long-lead requests

| Request | Owning team | Why | Needed by phase |
|---|---|---|---|
| Read access to the libraries, spaces and records where approved FSDs live, for the inventory | EDM leads; SharePoint and Microsoft 365 admins; Atlassian admins | The inventory and labeled sample depend on it | Final MVP (week 3) |
| A named owner who can say what counts as approved, and who signs the approval rule | EDM leadership or PMO | Without the rule, the corpus has no labels, and labels are the moat | Final MVP (week 2) |
| The template owner and the template's version history | EDM PMO | The crosswalk and version detection depend on it | Final MVP (week 4) |
| About 40 to 50 hours of EDM analyst time for labeling and owner review | EDM manager | The sample, schema and eval seed are people work | Final MVP (weeks 3 to 8) |
| Read access to the historical Jira projects that hold the epics built from FSDs (add their keys to the allowlist already requested) | Atlassian admins | Links to what was built, outcomes, and effort actuals | Final MVP (week 6) for the sample; Enterprise for all |
| A Privacy review of indexing names and roles from FSDs, and of personal data inside them | Privacy and Legal | Needed before Role records and any map of whom to ask | Enterprise (week 23) |
| Retention and legal-hold mapping for FSD copies in AWS | Records Management and Legal; Purview admins | The copies sit outside Purview retention | Enterprise (week 23) |
| `Sites.Selected` grants for the managed SharePoint connector (and the full-control role per site if per-document permissions are required) | SharePoint and Entra admins | Connector-based sync with permission checks | Enterprise (week 26) |
| API access to Armour Desk demand and idea tables and their attachments, if FSDs live there | ServiceNow platform team | The managed connector does not crawl demands | Enterprise (week 26) |
| Read access to Snowflake metadata and classification tags for validity checks (can ride on the data platform's existing request) | Data platform | Detecting stale objects and setting record sensitivity | Enterprise (week 26) |
| A list of golden reports and certified dashboards with owners, and a steward roster per domain | Data governance; EDMA BI | Linking, and steward confirmation of harvested definitions | Enterprise (week 28) |

---

## 10. Not verified, or could not access

- Where UA's approved FSDs live, how many there are, and how approval was recorded. Everything in section
  2.1 is a hypothesis.
- Whether "Armour Desk" is a ServiceNow instance. No public source mentions it.
- The relationship between `edm_fsd` and "EDMA Request - FSD Template v5.1.1", and the template's earlier
  versions.
- Whether `s3_list_reference_documents` works on deployed runtimes, given that only `s3:GetObject` is
  granted.
- How a Managed Knowledge Base's Custom data source takes per-document metadata, and its metadata size
  limits. The Custom page documents direct ingest and delete, not the metadata format; the S3 data source
  format is a `.metadata.json` sidecar.
- Whether a customer-managed Bedrock knowledge base can use a next-generation (scale-to-zero) OpenSearch
  Serverless collection. The Bedrock setup page describes only classic collections.
- Bedrock's price for Claude Sonnet 5.5. The Bedrock pricing page I read showed only an October 2026 cut
  to its cache-read price, so Anthropic's list price was used.
- When Copilot began using library column metadata for scoped questions (the semantic index page now
  describes it; one search summary said July 2026).
- Neptune Analytics pricing for GraphRAG (not priced here).

## Sources

All retrieved 2026-10-27.

**Repository.** `src/tools/distill.py`; `src/tools/documents.py`; `src/providers/storage/embeddings.py`;
`src/providers/documents/parsing.py`; `scripts/build_fsd_index.py`; `infra/stacks/storage_stack.py`;
`scripts/iam/agentcore-execution-policy.json`; `src/config/agents/distill.yaml`; `src/core/domain/spec.py`;
`docs/decisions.md` lines 2140-2166 and 2475-2502; commit `e3c2d28` on `sme-dev-rebuild`;
[current-state.md](../current-state.md); [platform-architecture.md](../platform-architecture.md);
[operating-model.md](../operating-model.md); [enterprise-plan.md](../enterprise-plan.md);
[resources-collab-memory.md](resources-collab-memory.md).

**AWS.** [Build a managed knowledge base](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-build-managed.html);
[Managed Knowledge Base GA (What's New, June 2026)](https://aws.amazon.com/about-aws/whats-new/2026/06/amazon-bedrock-managed-knowledge-base/);
[ACL-aware retrieval](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-acl.html);
[SharePoint connector](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-ds-sharepoint.html);
[ServiceNow connector](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-ds-servicenow.html);
[ServiceNow connector (What's New, Sep 2026)](https://aws.amazon.com/about-aws/whats-new/2026/09/amazon-bedrock-managed-knowledge-base-servicenow-native-data-source-connector/);
[Custom data source](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-ds-custom.html);
[Query configuration for managed knowledge bases](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-test-config.html);
[Bedrock pricing](https://aws.amazon.com/bedrock/pricing/);
[BDA prerequisites and limits](https://docs.aws.amazon.com/bedrock/latest/userguide/bda-limits.html);
[BDA custom output and blueprints](https://docs.aws.amazon.com/bedrock/latest/userguide/bda-custom-output-idp.html);
[S3 Vectors GA](https://aws.amazon.com/blogs/aws/amazon-s3-vectors-now-generally-available-with-increased-scale-and-performance);
[S3 Vectors with Bedrock knowledge bases](https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-vectors-bedrock-kb.html);
[S3 Vectors limits](https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-vectors-limitations.html);
[S3 pricing](https://aws.amazon.com/s3/pricing/);
[Knowledge base search type and filters](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-test-config.html);
[Customer-managed SharePoint connector and the 30 Sep 2026 notice](https://docs.aws.amazon.com/bedrock/latest/userguide/sharepoint-data-source-connector.html);
[Confluence Data Center connector (What's New, Sep 2026)](https://aws.amazon.com/about-aws/whats-new/2026/09/amazon-bedrock-managed-knowledge-base-confluence-data-center-native-data-source-connector/);
[OpenSearch Service pricing](https://aws.amazon.com/opensearch-service/pricing/);
[Next-generation OpenSearch Serverless (AWS Big Data blog, May 2026)](https://aws.amazon.com/blogs/big-data/amazon-opensearch-serverless-cost-effective-search-capabilities-at-any-scale);
[GraphRAG with Neptune Analytics](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-build-graphs.html);
[AgentCore Memory strategies](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory-strategies.html);
[Titan Text Embeddings V2](https://aws.amazon.com/blogs/machine-learning/get-started-with-amazon-titan-text-embeddings-v2-a-new-state-of-the-art-embeddings-model-on-amazon-bedrock/);
[Guardrails sensitive-information filters](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-sensitive-filters.html);
[Protect sensitive data in RAG applications](https://aws.amazon.com/blogs/machine-learning/protect-sensitive-data-in-rag-applications-with-amazon-bedrock/).

**Microsoft.** [Semantic indexing for Microsoft 365 Copilot](https://learn.microsoft.com/en-us/microsoftsearch/semantic-index-for-copilot);
[Microsoft 365 Copilot release notes](https://learn.microsoft.com/en-us/microsoft-365/copilot/release-notes);
[SharePoint Authoritative Sites in Copilot Search](https://learn.microsoft.com/en-us/sharepoint/sharepoint-authoritative-sites);
[Require approval of items in a list or library](https://support.microsoft.com/en-us/sharepoint/lists/documents-and-library/require-approval-of-items-in-a-list-or-library);
[Plan versioning, content approval and check-out](https://support.microsoft.com/en-gb/sharepoint/libraries/plan-document-versioning-content-approval-and-check-out-controls-in-sharepoint).

**Atlassian (secondary).** [Content statuses, a space help page](https://su-jsm.atlassian.net/wiki/spaces/Answers/pages/164430006/Content+Statuses+in+Answers);
[Developer thread on per-version status](https://community.developer.atlassian.com/t/confluence-api-content-state-for-a-page-version/80333).

**ServiceNow.** [Demand workflow](https://www.servicenow.com/docs/r/it-business-management/strategic-planning/demand-process-flow.html).

**Snowflake.** [Cortex Search overview](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-search/cortex-search-overview);
[Cortex Search updates, Mar 2026](https://docs.snowflake.com/en/release-notes/2026/other/2026-03-12-recent-cortex-search).

**Anthropic.** [Pricing](https://platform.claude.com/docs/en/about-claude/pricing).

**Research.** [Han et al., RAG vs. GraphRAG: A Systematic Evaluation and Key Insights](https://arxiv.org/abs/2502.11371);
[Xiang et al., When to use Graphs in RAG](https://arxiv.org/abs/2506.05690);
[Edge et al., From Local to Global: A Graph RAG Approach to Query-Focused Summarization](https://arxiv.org/abs/2404.16130).
