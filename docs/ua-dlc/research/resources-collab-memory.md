<!-- Point-in-time research, retrieved 2026-10-25 for the UA-DLC plan (second research round: orchestrator, delegation, resources). Claims carry source links; vendor features and dates change quickly, so verify before acting. Section numbers cited for platform-architecture.md were checked against its v3 revision. See README.md in this folder. -->
<!-- cspell:words CONFCLOUD FGAC Firecrawl Hocuspocus Liveblocks flac itpros merill msgraph multimodal remotelink reranking unpadded wbtx workspaceid -->

# Pointing, collaborating and remembering: resources, collaboration and per-project memory (as of 2026-10-25)

> Stage numbers and names here (working version, tester loop, MVP, enterprise stage) predate the three-phase plan (2026-10-26): Stages 1 to 3 are now the Final MVP and its pilot; Stages 4 and 5 are Enterprise.

Key: `resources-collab-memory`. Builds on [platform-architecture.md](../platform-architecture.md) sections 3, 7 and 11, [enterprise-integration-platform.md](enterprise-integration-platform.md) section 1, and the Context Capture proposal (R3) in [governance-collaboration.md](governance-collaboration.md). It does not repeat what those already cover (the Teams SDK, Work IQ, the RSC subscription idea, Cedar, tiers); it goes one level deeper on the four questions the owner raised.

## 0. Bottom line

1. **Pointing works today for files and Atlassian items; meetings are the hard case.** A OneDrive or SharePoint link resolves through `/shares/{u!base64url}` with a delegated token, Jira and Confluence items resolve through the Rovo MCP server or REST as the user, and Loop pages can be read as HTML. Teams transcripts need an admin-consented scope, a tenant control that is off by default, and must be fetched before the meeting expires.
2. **Facts the current plan docs should absorb:**
   - Delegated transcript reads work for **invitees**, not just organizers, so "point at a meeting I attended" needs no application access policy ([Get callTranscript](https://learn.microsoft.com/en-us/graph/api/calltranscript-get?view=graph-rest-1.0)).
   - Since the end of July 2026 there is an **unattributed transcript format** and a separate `SpeakerAttributionNotAllowed` error (same source).
   - Transcript subscriptions fire only if created **before** transcription starts, so pointing at a past meeting is always a pull, never a subscription ([Graph notifications for transcripts](https://learn.microsoft.com/en-us/graph/teams-changenotifications-callrecording-and-calltranscript)). The Graph overview table marks the "app installed in meeting" scope as beta-only, while the scenario page shows v1.0 examples ([overview](https://learn.microsoft.com/en-us/graph/api/resources/change-notifications-api-overview?view=graph-rest-1.0)). Test before relying on it.
   - **Bedrock Managed Knowledge Base is GA** (17 Jun 2026) and allows **10,000 knowledge bases per account per Region**, so a knowledge base per project is affordable and practical ([AWS What's New](https://aws.amazon.com/es/about-aws/whats-new/2026/06/amazon-bedrock-managed-knowledge-base/), [quotas](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-quotas.html)).
   - **Rovo MCP "V2"** (docs updated 30 Sep 2026) adds version history, unified diffs between versions, comment resolution, attachment downloads and Loom transcripts, and a flat tool list for gateways ([supported tools](https://developer.atlassian.com/cloud/rovo-mcp/guides/supported-tools/)).
   - **AgentCore Memory** gained custom namespace variables, metadata filters and a direct `IngestData` path (August and September 2026), and short-term memory moved to per-GB pricing on 6 Oct 2026 ([pricing](https://aws.amazon.com/bedrock/agentcore/pricing/)).
3. **Recommendations in one line each:**
   - *Pointing:* a URL resolver in `providers/`, reading as the pointing user.
   - *Index:* a per-project Bedrock Managed Knowledge Base fed by direct ingestion from the S3 corpus HyperDelivery already writes.
   - *Memory:* AgentCore Memory only for conversation memory. Confirmed facts and decisions stay in DynamoDB as the system of record.
   - *Collaboration:* Confluence as the shared space for the working version, with HyperDelivery holding decisions and signatures. A self-hosted Yjs editor later, only if specific triggers appear.

---

## 1. Pointing instead of uploading (Microsoft 365)

### 1.1 Link resolver: what each link becomes

| User pastes | Resolve with | Read with | Delegated permission (admin consent?) | Notes |
|---|---|---|---|---|
| OneDrive or SharePoint **sharing link** (file or folder) | `GET /shares/u!{unpadded base64url of the URL}/driveItem` (folder: `?$expand=children`) | `GET /drives/{driveId}/items/{itemId}/content` (302 to a short-lived pre-authenticated URL) | Docs list `Files.ReadWrite` as least privileged for `/shares` ([shares-get](https://learn.microsoft.com/en-us/graph/api/shares-get?view=graph-rest-1.0)); `Files.Read.All` delegated needs no admin consent ([merill](https://graphpermissions.merill.net/permission/Files.Read.All)) | Send `Prefer: redeemSharingLinkIfNecessary` so peeking does not add a durable grant. `redeemSharingLink` is equivalent to the user accepting the share. Test whether `Files.Read.All` suffices so HyperDelivery need not request a write scope for a read. |
| A plain file URL or a Stream `stream.aspx?id=` recording link | Not guaranteed through `/shares`. Community reports say encoding arbitrary URLs is unreliable ([MS Q&A](https://learn.microsoft.com/en-us/answers/questions/1855033/unable-to-get-file-drive-item-via-shares-((encoded)) | Parse the server-relative path, then use `/sites/{host}:/{site-path}` and `/drive/root:/{path}` | as above | Fall back to asking for "Copy link". Unverified for Stream links. |
| A Teams **meeting join link** (or the calendar event that carries it) | `GET /me/onlineMeetings?$filter=JoinWebUrl eq '{url}'` | `GET /me/onlineMeetings/{id}/transcripts`, then `/transcripts/{tid}/content` | `OnlineMeetings.Read` (no admin consent); `OnlineMeetingTranscript.Read.All` (admin consent required) ([merill](https://graphpermissions.merill.net/permission/OnlineMeetingTranscript.Read.All)) | Lookup accepts organizer and invitee tokens ([onlineMeeting get](https://learn.microsoft.com/en-us/graph/api/onlinemeeting-get?view=graph-rest-1.0)). One tester found older join-URL formats fail ([office365itpros](https://office365itpros.com/2026/09/21/teams-meeting-graph-api/)). |
| A Teams **recording** | `GET /me/onlineMeetings/{id}/recordings/{rid}/content`, or the `.mp4` driveItem | same | `OnlineMeetingRecording.Read.All` | Recordings top out at 4 hours or 1.5 GB per file ([Teams limits](https://learn.microsoft.com/en-us/microsoftteams/limits-specifications-teams)) |
| A **Loop** page or component link | `/shares` → driveItem | `/content?format=html` (also `pdf`) | `Files.Read` | Conversion is capped at **2 MB**. HTML is supported only for `loop`, `fluid`, `wbtx` and `whiteboard` sources ([convert](https://learn.microsoft.com/en-us/graph/api/driveitem-get-content-format?view=graph-rest-1.0)). |
| A Teams chat or channel message ("send this thread") | Parse the `teams.microsoft.com/l/message/...` link | chatMessage APIs | Chat or channel read scopes | Already planned as a message extension. Listed only so the resolver treats it as a resource too. |

### 1.2 Transcripts: the governance gates, in order

1. **Tenant control (MC1393806, 16 Jun 2026), off by default.** An admin enables it with `Set-CsTeamsMeetingConfiguration -EnableGraphTranscriptAccess $true`. A separate setting, `-EnableAttributedTranscripts`, controls speaker names ([office365itpros](https://office365itpros.com/2026/09/21/teams-meeting-graph-api/)).
   - When the control is off, every transcript call returns `403 GraphAccessToTranscriptsDisabled`, and there is no request-side workaround.
   - When speaker attribution is off, `text/vtt` returns `403 SpeakerAttributionNotAllowed`. Retry with `Accept: application/vnd.microsoft.graph.transcript+text`, which returns timestamped utterances without names ([Get callTranscript](https://learn.microsoft.com/en-us/graph/api/calltranscript-get?view=graph-rest-1.0)).
   - Branch on `innerError.code`, not on the message text.
2. **Which permission path to use:**
   - *Delegated:* needs admin consent for `OnlineMeetingTranscript.Read.All`. It works for anyone on the calendar invite, in both private chat meetings and channel meetings.
   - *App-only:* also needs an **application access policy** granted per user.
   - *RSC* (`OnlineMeetingTranscript.Read.Chat`): applies only to scheduled private-chat meetings, never channel meetings (same source).
3. **Meeting expiry.** Teams lists a 60-day expiry for one-time scheduled meetings, extended by 60 days whenever the meeting is joined or updated. The page labels this regime public preview for newly created links ([Teams limits](https://learn.microsoft.com/en-us/microsoftteams/limits-specifications-teams)). The transcript API works only while the meeting has not expired. **Ingest at point time**, because a pointer to a three-month-old meeting may resolve to nothing.
4. **Subscriptions are for future meetings only.**
   - The maximum lifetime is 4,320 minutes, and a `lifecycleNotificationUrl` is required past one hour.
   - All Teams subscriptions share an organization-wide quota of 10,000 ([subscription](https://learn.microsoft.com/en-us/graph/api/resources/subscription?view=graph-rest-1.0), [overview](https://learn.microsoft.com/en-us/graph/api/resources/change-notifications-api-overview?view=graph-rest-1.0)).
5. **Recordings are not covered by the transcript control** ([Graph doc](https://learn.microsoft.com/en-us/graph/teams-changenotifications-callrecording-and-calltranscript)). It is technically possible to download the recording and transcribe it with Amazon Transcribe or the knowledge base's audio extraction. Doing that to get around a disabled transcript control would defeat the admin's intent. Treat self-transcription as the same governance decision, owned by Privacy, Legal and the M365 admins.

**Working-version fallback:** Teams lets attendees download the transcript (`.vtt` or `.docx`) from the meeting recap. Accept that file through the same "point or drop" box, so the feature does not block on the tenant control.

### 1.3 Keeping a pointed folder in sync

- **Delta query is documented only at the drive root** for work and school drives: `/drives/{id}/root/delta`, `/sites/{id}/drive/root/delta` and so on ([driveItem delta](https://learn.microsoft.com/en-us/graph/api/driveitem-delta?view=graph-rest-1.0)). A community answer reports that folder-level delta does not work in business drives ([MS Q&A](https://learn.microsoft.com/en-us/answers/questions/1188329/how-to-get-list-of-moved-files-in-onedrive-using-a)). Not verified by us.
  - Delta does not return `path`, so track items by id.
  - A stale token returns `410` with a resync code.
  - `?token=latest` skips the initial enumeration.
  - A timestamp token is accepted on OneDrive for Business and SharePoint.
- **Webhooks for work and school drives fire only on the drive root**, and only with `changeType: updated` ([overview](https://learn.microsoft.com/en-us/graph/api/resources/change-notifications-api-overview?view=graph-rest-1.0), [subscription](https://learn.microsoft.com/en-us/graph/api/resources/subscription?view=graph-rest-1.0)).
  - The maximum lifetime is 42,300 minutes (just under 30 days).
  - Latency is usually under a minute but can reach 6 hours.
- **Microsoft's scanning guidance:** subscribe, call delta right after subscribing, call delta on each notification after returning `202`, run a safety delta at most once a day, and honor `Retry-After` on `429` or `503` ([scan guidance](https://learn.microsoft.com/en-us/onedrive/developer/rest-api/concepts/scan-guidance)). Use `cTag` to skip re-downloading unchanged content.

**What this means for HyperDelivery:**

- **Folders in a project SharePoint site** (the write-back site the plan already proposes) can be *watched*.
  - Grant HyperDelivery `Sites.Selected` on the site.
  - Subscribe to the library root.
  - Run root delta on each notification and keep only items whose ancestor chain includes a pointed folder.
- **A folder in someone's OneDrive shared by link** cannot be watched this way. A share recipient cannot subscribe to, or run delta on, another user's drive root. Instead:
  - Re-list it on a schedule as the pointing user, through the vaulted delegated token (platform-architecture section 3).
  - Refresh on read: send `if-none-match: {eTag}` and get `304` when nothing changed. The conversion endpoint documents the header ([convert](https://learn.microsoft.com/en-us/graph/api/driveitem-get-content-format?view=graph-rest-1.0)).
  - Show the item as "Snapshot from {date}" rather than "Live".

### 1.4 Permissions model for pointed M365 content

- **Read as the pointing user** for interactive work (Entra on-behalf-of through AgentCore Identity, as planned). For background refresh days later, read as the same user from the token vault, and mark the resource "access lost" when a refresh fails with `403`.
- **Selected scopes** now support delegated and application modes at four levels: `Sites.Selected`, `Lists.SelectedOperations.Selected`, `ListItems.SelectedOperations.Selected` and `Files.SelectedOperations.Selected` ([Selected permissions](https://learn.microsoft.com/en-us/graph/permissions-selected-overview)).
  - Access needs three things: consent, an explicit per-resource grant, and a token carrying the scope.
  - Delegated access is the intersection of the app's grant and the user's rights.
  - Granting on items breaks permission inheritance, which counts against SharePoint's unique-permission limits.
  - Managing grants on files needs owner or full-control rights.
  - In practice, per-file app grants suit a project site, not ad hoc personal files.
- **The sharing consequence of pointing.** Once HyperDelivery indexes a file the pointer could read, every project member can ask about it. The UI must say so when the user points ("Project members will be able to ask about this file"). Enterprise hardening adds a per-reader check at query time (section 4.4).

### 1.5 File types and limits

- **Parsers.** HyperDelivery's parsers already handle `.txt .md .pdf .docx .pptx .xlsx .png .jpg` (`src/tools/documents.py`). To add:
  - `.vtt` and the unattributed transcript text, keeping cue timestamps and speakers as citation anchors.
  - Loop pages, through `format=html`.
  - `.msg` and `.eml`, through `format=pdf`.
  - `.csv`.
- **Video.** Index the transcript, not the video. The managed knowledge base can extract audio (`.mp3 .wav .m4a .flac .ogg`) and video (`.mp4 .mov .m4v`) ([connect data source](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-connect-ds.html)). It bills $5 per GB of raw data per month ([Bedrock pricing](https://aws.amazon.com/bedrock/pricing/)), so a 1.5 GB recording would cost about $7.50 a month to keep indexed.
- **In-place alternative: the Microsoft 365 Copilot Retrieval API.** It returns permission-trimmed text chunks from SharePoint, OneDrive and Copilot connectors without copying anything, scoped with KQL path filters ([Retrieval API](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/api/ai-services/retrieval/overview)).
  - Limits: at most 25 results per call, 200 requests per user per hour, and one data source per call.
  - Licensing: free with a Copilot license, or pay-as-you-go (preview), which excludes OneDrive.
  - It cannot be the moat, because nothing accumulates. It is a good complement for "search beyond what was pointed at", and it keeps M365 data inside Microsoft's trust boundary.

---

## 2. Starting from a Jira ticket or Confluence page

### 2.1 What to fetch, and with which tool

Atlassian now documents a **V2 tool catalog**:

- A few *primary* tools appear in `tools/list`. The rest are found through `discover` and run through `executeRead`, `executeWrite` or `executeDestructive`, which act as risk tiers.
- Gateways that need a complete list can use `https://mcp.atlassian.com/v2/mcp?tools=all`.
- The delete and manage groups are off by default ([supported tools](https://developer.atlassian.com/cloud/rovo-mcp/guides/supported-tools/)).

A live Rovo MCP connector in this environment still exposes the older names (inspected schemas only, nothing called). Both columns are therefore listed below.

| Need | V2 catalog | Older name seen live | REST fallback |
|---|---|---|---|
| Issue fields, description | `getJiraIssue` (`fields: ["*all"]`, `expand: names,renderedFields`, markdown or ADF) | same | `GET /rest/api/3/issue/{key}` |
| Comments | `listJiraIssueComments` | `getJiraIssue` with `fields: ["comment"]` | `GET /rest/api/3/issue/{key}/comment` |
| Attachments | `downloadJiraIssueAttachment` (short-lived URL) | none | `GET /rest/api/3/attachment/content/{id}` |
| Linked Confluence pages | `listJiraIssueRemoteIssueLinks` | `getJiraIssueRemoteIssueLinks` | `GET /rest/api/3/issue/{key}/remotelink` |
| Scope history | `listJiraIssueChangelogs` | none | `GET /rest/api/3/issue/{key}/changelog` |
| Linked PRs, designs, Loom videos | `getTeamworkGraphContext` (up to 10 Rovo credits) | same | none |
| Page body (pages, live docs, whiteboards, databases) | `getConfluenceContent` | `getConfluencePage` (accepts tiny-link ids; HTML format is round-trip safe and keeps inline-comment markers) | `GET /wiki/api/v2/pages/{id}?body-format=...` |
| Comments and replies | `listConfluenceComments`, `getConfluenceComment` | `getConfluencePageInlineComments` (status `open`, `reopened`, `resolved` or `dangling`), `...FooterComments`, `getConfluenceCommentChildren` | `/wiki/api/v2/pages/{id}/inline-comments`, `/footer-comments` |
| Versions and diffs | `listConfluenceContentVersions`, `getConfluenceContentVersion`, `diffConfluenceContentVersions` (unified diff) | none | `/wiki/api/v2/pages/{id}/versions`, then compute the diff ourselves |
| Attachments, tasks | `listConfluenceAttachments`, `downloadConfluenceAttachment`, `listConfluenceTasks` | none | REST v2 |
| Loom walkthroughs | `getLoomVideo` (transcript, comments, AI action items) | none | none |

**Freshness for Atlassian items:**

- *Polling (working version).* JQL `key in (...) AND updated >= -10m`, plus a cheap check of each pointed page's version number.
- *Jira webhooks.* Webhooks registered through REST expire after 30 days unless refreshed ([Jira webhooks API](https://developer.atlassian.com/cloud/jira/platform/rest/v2/api-group-webhooks/)).
- *Confluence events* come only through a Forge app (Connect is being retired):
  - `avi:confluence:created|updated:page`.
  - `avi:confluence:created|updated|deleted:comment`, with `content.extensions.location` set to `inline` or `footer`.
  - Live-doc events: `initialized`, `started`, `snapshotted` and `published`.
  - A `selfGenerated` flag filters out HyperDelivery's own writes.
  - There is **no comment-resolved event** ([Forge Confluence events](https://developer.atlassian.com/platform/forge/events-reference/confluence/)).
  - An Atlassian admin must install the app, so it belongs in the MVP or enterprise stage, not the working version.

### 2.2 From ticket to Brief

Everything below lands as a **Draft** Brief that the requester agrees to (operating-model.md: "A confirmation is not an approval"). Every line carries a source reference.

| Source element | Becomes in HyperDelivery | Status until a person acts |
|---|---|---|
| Summary and description | Brief "in your words" text. The ticket *is* the requester's words, so quote it rather than rewriting. | Draft |
| Issue type, priority, labels, components, epic or parent | Suggested path (new, change, report to app, fix), depth and workspace | Suggested |
| Reporter, assignee, watchers | Requester candidate (confirm if it is not the signed-in user); people to ask, labeled by role | Suggested |
| Acceptance-criteria custom field (found with `getJiraIssueTypeMetaWithFields`) | Seed acceptance criteria | Proposed |
| Each comment | A "What we heard" statement attributed to its author, with a permalink (`?focusedCommentId=`) | Proposed; the author may correct it |
| Attachments | Pointed resources, ingested and indexed (section 4) | Indexed |
| Remote links to Confluence | Pointed resources. Open inline comments on those pages become open-question candidates. | Indexed |
| Issue links ("duplicates", "relates to") | Input to the intake triager's duplicate check ("join as one more voice") | Advisory |
| Changelog edits to the description | Scope-change history shown beside the Brief | Context |

**Code consequences:**

- `EvidenceLink` (`src/core/domain/spec.py:40-56`) records a `source` kind and free text, but no location. Add a `SourceRef` with these fields: resource id, kind, canonical URL, anchor (heading path, page number, VTT cue, comment id), source version (eTag, page version, Jira `updated`), content SHA-256 and retrieval time.
- Writing back to the ticket (a comment or a remote link to the HyperDelivery project) is an external side effect. Make it an explicit user button, or tie it to approval 1, per AGENTS.md's rule on gating writing tools.

**Identity caveat.** Atlassian may hide a user's email when their profile privacy setting restricts it (general Atlassian behavior; not re-verified here). Capture each user's Atlassian `accountId` when they connect Atlassian (`atlassianUserInfo`), so comment authors map to Entra identities without relying on email.

---

## 3. A collaborative space

### 3.1 The options

| | Native, self-hosted (Tiptap OSS + Yjs + Hocuspocus on AWS) | Native, hosted (Liveblocks or Tiptap Cloud) | Confluence as the space | Microsoft Loop | Word in a SharePoint site |
|---|---|---|---|---|---|
| Build effort | High: editor, comments, anchors, presence, persistence | Medium | **Low**: write pages, read comments and versions | Low to write by hand; no way to write by API | Low |
| Where people already are | Console only | Console only | Engineering, yes. **Business users: depends on Confluence licenses (open question)** | Business users (Teams, Copilot Pages, Facilitator notes) | Business users |
| Comments by API | Ours (Chopin anchors cards with Yjs relative positions) | Liveblocks: comments on all plans. Tiptap: comments need Tiptap Cloud documents | **Yes**: inline and footer comments, replies, resolution states | **No** | Only by parsing the `.docx` |
| Versions and diffs by API | Ours | Liveblocks: 24 hours to 90 days of history by plan. Tiptap: "compare versions" from Team up | **Yes**, including a unified diff (Rovo V2) | **No** | Version list yes; diff is ours |
| Change events | Ours | Webhooks | Forge app events, or polling | None | Graph webhook (drive root) |
| Agent edits that keep human edits | Structural block operations against a revision (Chopin) | Liveblocks lets agents apply JSON Patch and join with presence | Granular `updateConfluenceContent` edits; HTML round-trip preserves inline comments | n/a | Risky |
| Data stays in UA's AWS or M365 | Yes | No (Liveblocks self-hosting is an Enterprise add-on; Tiptap on-prem is Enterprise only) | Stays in Atlassian Cloud (UA's tenant) | Stays in M365 | Stays in M365 |
| Price signal | Infrastructure only | Liveblocks Team from $600/mo with SSO and SOC 2 ([pricing](https://liveblocks.io/pricing)). Tiptap Start $59/mo, Team $179, Business $1,199; AI Toolkit and Tracked Changes are custom-priced add-ons ([pricing](https://tiptap.dev/pricing)) | Existing licenses | Existing | Existing |

**Microsoft Loop:**

- Loop workspaces live in SharePoint Embedded containers.
- Graph converts `.loop` files to HTML or PDF up to 2 MB, but exposes no comments, versions or content-editing API.
- Community reports put Microsoft's planned "Graph APIs for Loop" on workspace management, not page content ([MS Q&A](https://learn.microsoft.com/en-us/answers/questions/5760312/can-ms-provide-a-microsoft-loop-api-for-programmat)). Not verified with Microsoft.
- Use Loop as a **pointed resource** (Facilitator notes live on Loop pages), not as HyperDelivery's collaborative surface.

**Confluence specifics that matter:**

- **Inline comments anchor to text.**
  - Creating one needs `textSelection`, `textSelectionMatchCount` and `textSelectionMatchIndex`.
  - A comment whose text was deleted shows the status `dangling`.
  - So when HyperDelivery rewrites a paragraph, the comments attached to it are orphaned.
- **Suggestions.** The V2 catalog lists `getConfluenceContentSuggestions` and `addConfluenceContentSuggestions`. I found no Confluence product documentation for a suggestions feature, and an older public request for Google-Docs-style suggestions is still open ([CONFCLOUD-82676](https://jira.atlassian.com/browse/CONFCLOUD-82676)). Treat it as unverified until tested.
- **Live docs** version differently from classic pages: a new version appears after an editing session ends. Use classic pages for anything an approval binds to.

### 3.2 Recommendation

**Working version: Confluence as the space; HyperDelivery as the system of record.**

1. **One page per project.** HyperDelivery creates one Confluence page per project, the "living project document", in a HyperDelivery space or the team's space, as the service identity. It carries the sections from operating-model.md section 8: Brief, What we heard, Decisions, Plan, Evidence, What it skips.
2. **Section ownership, so nothing is clobbered.**
   - The Brief is human-owned and edited directly.
   - Generated sections carry a panel saying to comment, or edit in HyperDelivery.
   - Each publish records the page version HyperDelivery wrote. Any later version written by someone else is diffed. A human edit inside a generated section becomes a **suggested change** in HyperDelivery, and the next publish does not overwrite it silently.
   - Prefer granular edits over whole-body replacement, to keep inline comments anchored.
3. **The ingest loop.**
   - Working version: poll pointed and owned pages every 2 to 5 minutes for a new version or new comments.
   - MVP: move to Forge events.
4. **Agent participation.** The orchestrator may reply in comment threads and resolve them **only on pages HyperDelivery owns**. That is enforced in the `tools/` wrapper by page id, not in the prompt.
5. **Approvals stay in HyperDelivery.** A signature records the page id, version and a hash of the stored body. "N changes since approval" comes from the version list and diff.
6. **Known risks:**
   - Business users may lack Confluence licenses.
   - Comment anchors are fragile.
   - Everything on the page is visible to everyone who can see the page.
   - Teamwork Graph calls consume Rovo credits.

**Later: a native editor in the console**, self-hosted inside UA's AWS account:

- Tiptap OSS (MIT) with Yjs and Hocuspocus on ECS, signed in with Entra, persisted to S3 and DynamoDB.
- It adopts the Chopin patterns already in the plan: structural agent edits against a revision, anchored decision cards, author marks, suggested edits accepted top to bottom, and approvals bound to a revision.
- Confluence then becomes a one-way publish target for the engineering handoff.

Build it only when one of these triggers appears:

- Business users cannot get Confluence.
- Decision cards need anchors that survive edits.
- The Teams meeting stage needs a live co-edited document.
- Agent edits keep breaking human cursors or comments.

Prefer self-hosting over Liveblocks or Tiptap Cloud, so document content never leaves UA's tenancy.

### 3.3 How comments and revisions become decision records and confirmed facts

Every new comment, reply or human-authored version diff on a pointed or owned page goes through one pipeline:

1. Fetch.
2. Map the author to Entra.
3. Flag instruction-like text. Comments are untrusted input, per the plan's threat model.
4. Classify.
5. Create a HyperDelivery record in a **proposed** state, with a `SourceRef` to the comment id and page version.
6. Route it to the right person.

| Classified as | HyperDelivery record | Who settles it | Write-back on an owned page |
|---|---|---|---|
| Reply to a question HyperDelivery asked | Answer on `OpenQuestion`, evidence kind `stakeholder_answer`, attributed to the author | The author's own words count; the requester accepts the answer into the Brief or Plan | Reply: "Recorded, thank you", then resolve the thread |
| A statement of how things are ("net demand excludes returns") | A proposed **Fact** (context atom). Certified definitions are checked first; a conflict becomes a definition dispute | The person it is attributed to confirms, and a steward ratifies when it is a metric | Reply linking the fact |
| A proposal ("let's go with weekly grain") | A **Decision** in the Open or Exploring state, with alternatives | Settled only when the named owner presses Save in HyperDelivery or a Teams card. A Confluence decision item marked DECIDED by that owner is evidence, not the signature | After settling: "Recorded as Decision D-12 by {name}", then resolve |
| An objection or risk | Decision reopened, or an open issue | Owner | Reply |
| A human edit to the Brief | A new Brief version | Requester (direct) | None |
| A human edit to a generated section | Suggested change, accepted or rejected in HyperDelivery | Section owner | Next publish |
| Thanks, reactions, resolved without a reply | Nothing | n/a | n/a |

Never auto-settle anything. Regenerating a draft must not change a settled decision (the Chopin lesson already in the plan).

---

## 4. A per-project knowledge index on AWS

### 4.1 What each AWS piece is for

| Piece | Use it for | Not for |
|---|---|---|
| **AgentCore Memory, short-term** | Orchestrator chat history per project and session; replaying context into specialists | Documents |
| **AgentCore Memory, long-term** | LLM-extracted *candidates*: session summaries, user preferences, proposed facts, episodic lessons | Anything signed or confirmed (consolidation can merge or rewrite records) |
| **Bedrock Managed Knowledge Base** | Indexing pointed documents, transcripts, pages and attachments per project; hybrid and agentic retrieval with citations | Row-level Snowflake data (platform-architecture section 7 keeps rows in Snowflake) |
| **DynamoDB** | Resource registry, decisions, confirmed facts, signatures: the system of record | Similarity search |
| **S3** | The normalized corpus HyperDelivery already writes at `projects/{pid}/normalized/distill/{source_type}/{source_id}/{sha256}.md` (`src/providers/storage/s3.py:96-118`), today written and never read back | |

### 4.2 AgentCore Memory, in detail

- **Strategies** ([strategies](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory-strategies.html), [built-in](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/built-in-strategies.html)):
  - Built-in strategies: semantic, summary, user preference and episodic.
  - Built-in *overrides*: your own prompts and model, run by the managed pipeline.
  - *Self-managed*: your own pipeline, writing with the batch APIs.
  - **Episodic** memory detects finished episodes and produces *reflections* across them. Reflections can span actors, and AWS itself flags the privacy implications ([episodic](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/episodic-memory-strategy.md)).
- **Namespaces** are templates with `{actorId}`, `{sessionId}` and `{memoryStrategyId}`, normalized with leading and trailing slashes ([organization](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/specify-long-term-memory-organization.html)).
  - **Custom namespace variables** exist: up to 5 lowercase keys per memory, supplied per event in `extractionConfig.namespaceVariables`.
  - If a variable is missing, extraction for that strategy is **silently skipped**. Monitor the `NamespaceResolutionFailure` metric.
  - IAM condition keys `bedrock-agentcore:namespace` and `bedrock-agentcore:namespacePath` restrict callers by namespace.
- **Metadata** ([metadata](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/long-term-memory-metadata.md)):
  - Up to 10 indexed keys, which can never be removed.
  - Up to 3 `STRICTLY_CONSISTENT` keys per strategy. These copy exact values and keep records with different values from ever merging.
  - Up to 5 filters per query.
  - String values are capped at 256 characters.
  - AWS warns against metadata-only tenant isolation: use namespaces for *who*, metadata for *what*.
- **Ingestion paths.** `IngestData` (8 Sep 2026) feeds the long-term strategies without storing a short-term event ([What's New](https://aws.amazon.com/about-aws/whats-new/2026/09/agentcore-memory-direct-ingest)). `BatchCreateMemoryRecords` bypasses extraction.
- **Fine-grained access through a gateway.** A Gateway Memory connector with Cedar can bind `actorId` to the JWT `sub`, or a namespace to a token claim. Batch operations cannot be governed per record there ([FGAC](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory-gateway-fgac.html)).
- **Event retention** is configurable up to 365 days. AWS pages disagree on whether the minimum is 1 or 3 days.
- **Pricing** ([pricing](https://aws.amazon.com/bedrock/agentcore/pricing/)):
  - *Short-term, from 6 Oct 2026:* $1.00 per GB ingested, $0.20 per GB retrieved, $0.10 per GB-month stored. Each event is billed at 12 KB minimum and 64 KB maximum.
  - *Long-term storage:* $0.75 per 1,000 records a month for built-in strategies; $0.25 for overrides or self-managed.
  - *Long-term retrieval:* $0.50 per 1,000 retrievals.
  - *Example:* a 50-project pilot at 2,000 events per project per month costs about $1.20 a month to ingest.

### 4.3 Bedrock Managed Knowledge Base, in detail

- **Status and features.** GA on 17 Jun 2026. Bedrock manages the store, embeddings, hybrid search, reranking and agentic retrieval ([managed KB](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-build-managed.html)).
- **Connectors:** SharePoint, OneDrive, Confluence (Cloud and Data Center), S3, Custom, Web Crawler, Google Drive, Salesforce, ServiceNow, Box and Zendesk.
- **SharePoint connector** ([SharePoint](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-ds-sharepoint.html)):
  - Supports `Sites.Selected` (read role for content; full control per site for ACLs).
  - Item-path inclusion filters.
  - Exclusion by Purview sensitivity label.
  - A user-managed (3LO) setup that cannot do ACLs.
- **Sync** runs on demand, daily, weekly or monthly, and is incremental ([sync](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-sync.html)). Deletion protection stops a sync that would delete more than a threshold (default 15%).
- **The Custom connector** takes `IngestKnowledgeBaseDocuments` and `DeleteKnowledgeBaseDocuments` directly, with no sync job ([custom](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-ds-custom.html), [direct ingestion](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-direct-ingestion.html)).
- **ACL-aware retrieval** ([ACL](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-acl.html)):
  - It matches users by exact email and fails closed.
  - It re-verifies access live for SharePoint, OneDrive and Confluence.
  - The S3 and Custom connectors get no live verification.
  - AWS says plainly that it filters results and is not authorization.
- **Quotas** ([quotas](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-quotas.html)):
  - 10,000 knowledge bases per account per Region (not adjustable).
  - 200 data sources per knowledge base.
  - 10 TB of raw data per knowledge base.
  - 600 Retrieve calls per minute per knowledge base.
  - 300 agentic calls per minute per account.
- **Pricing:** $5 per GB of raw data per month, $1 per 1,000 Retrieve calls, and $4 per 1,000 agentic calls plus the underlying Retrieve calls. Managed parsing, embeddings and reranking cost nothing extra ([Bedrock pricing](https://aws.amazon.com/bedrock/pricing/)).
- **Gateway target** ([Gateway connector](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-target-connector-managed-kb.html)):
  - Exposes `Retrieve` and `AgenticRetrieveStream`.
  - The knowledge base id is bound to the target; the agent sends only a query.
  - Results carry `location` (S3, SharePoint, Confluence, Custom), `metadata` and a score. Agentic answers carry citation spans.
  - `userContext` must come from the application, never the model.
- **Customer-managed alternatives.** S3 Vectors (GA Dec 2025; 10,000 indexes per bucket; 2 KB of filterable metadata per vector) or OpenSearch Serverless. Keep these in reserve for cases where the managed citation anchors prove too coarse.

### 4.4 Recommended design

```
point (chat, Teams, Brief from a ticket)
  -> resolve (providers/msgraph, providers/atlassian): canonical id, kind, version
  -> register RESOURCE# item under PROJECT# (keys in infrastructure/repositories/keys.py)
  -> authorize at point time: pointer can read; label and classification allowed for the project tier;
     user told "project members will be able to ask about this"
  -> fetch as the pointer (OBO / vaulted token) -> normalize -> flag instruction-like text
  -> S3 corpus (existing key scheme) + metadata sidecar {project, workspace, resource_id, source_uri,
     source_version, anchor map, pointed_by, label}
  -> IngestKnowledgeBaseDocuments into the PROJECT knowledge base (Custom data source; doc id = resource_id)
  -> console resource chip: Indexed | Stale | Snapshot | Access lost | Blocked by tenant setting
serve
  -> tools/knowledge.py search_project_sources(query): KB id bound from server state, never model-supplied
  -> Retrieve (specialists) / AgenticRetrieveStream (orchestrator), then the workspace KB as a second tier
  -> per-reader source re-check (cached Graph / Atlassian access check as the asking user; fail closed)
  -> chunks + SourceRef -> answer cites chips that deep-link to the page version, comment or timestamp
```

**Design decisions:**

1. **One managed knowledge base per project** for pointed resources, plus the planned **workspace knowledge base** with native connectors for department knowledge.
   - Per project gives hard isolation and a one-call deletion when the project expires.
   - It fits well inside the 10,000 quota.
   - At pilot scale it costs pennies to a few dollars a month per project (300 MB of text is about $1.50 a month).
2. **Retrieval is a per-agent tool, not a Gateway target, until the enterprise stage.** The Gateway connector binds one knowledge base per target. HyperDelivery's provider/tool split already puts the "which corpus may this agent read" policy in `tools/`, which suits a per-project id.
3. **Specialists get context packs, not credentials.**
   - The orchestrator hands the coding agent's sandbox a `context/` folder of cited excerpts (Brief, decisions, relevant chunks).
   - It hands Cortex Code only the data-relevant excerpts.
   - Neither ever receives Graph or Atlassian tokens.
   - This mirrors the owner's "return only what is needed" model in the other direction.
4. **Freshness by kind:**

| Kind | Working version | Later |
|---|---|---|
| Confluence page | Poll the version number every 2 to 5 minutes; re-ingest on change | Forge events |
| Jira issue | JQL poll on `updated` | Dynamic webhooks, refreshed every 30 days |
| SharePoint file or folder in the project site | Refresh on read with eTag | Root webhook plus delta, filtered by ancestry |
| OneDrive file or folder shared by link | Snapshot plus refresh on read as the pointer | Same; never "live" |
| Teams meeting | One-time pull at point time | App-installed subscription for future meetings, once tested |
| Deletion at the source | Delta `deleted` facet or `404`, then delete from the knowledge base and mark the chip | Same, audited |

5. **Memory layout.**
   - One Memory resource per environment, with namespace keys `workspaceid` and `projectid`.
   - *Summary:* `/ws/{workspaceid}/project/{projectid}/session/{sessionId}/`, for handoffs.
   - *Semantic:* `/ws/{workspaceid}/project/{projectid}/proposed/`. Its records feed the "What we heard" confirmation queue and are never treated as true.
   - *User preference:* `/user/{actorId}/`, with `actorId` set to the Entra oid.
   - *Episodic:* off for T1 and above, or reflections scoped to the project namespace.
   - `STRICTLY_CONSISTENT` keys `projectid` and `classification`.
6. **Confirmed facts and decisions live in DynamoDB** with signer, hash and citations, and are served by a direct `get_confirmed_facts(project)` tool. A project holds tens to hundreds of them, so no vector search is needed yet. The Library's cross-project reuse queries confirmed facts by workspace in DynamoDB. If semantic lookup across thousands is ever needed, mirror them as self-managed Memory records (no consolidation).
7. **Governance work for the enterprise stage.**
   - The AWS copy of M365 content sits outside Purview retention, eDiscovery and legal hold.
   - Map the project retention to the source label, propagate source deletions, and get Legal's sign-off on transcript copies (already a plan risk).

---

## 5. Phasing: working version, testers, MVP, enterprise

As the plan adopted it ([platform-architecture.md](../platform-architecture.md#what-lands-in-which-phase)):

| Stage | Pointing | Collaboration | Index and memory | Admin asks |
|---|---|---|---|---|
| Stage 1 Working version | Paste-a-link for OneDrive and SharePoint (delegated `Files.Read.All`, user consent where the tenant allows it). Jira and Confluence through the existing client. Transcripts by `.vtt` drop. | Confluence page per project, polled | Per-project managed knowledge base with direct ingestion; Memory short-term and summary only; SourceRef in evidence | None beyond an Entra app registration |
| Stage 2 Tester loop | Meeting join links (admin consent for `OnlineMeetingTranscript.Read.All`; request the tenant control); vaulted tokens for refresh | Same page, polled | Stale and snapshot states; citation chips with logos | M365 admins (consent, tenant control) |
| Stage 3 MVP | Rovo MCP V2 through the Gateway (writes by service account after approval 2); project SharePoint site with `Sites.Selected` and webhooks | Comment pipeline and proposed records feeding Confirm what we heard; Teams confirmation cards; Forge app for Confluence events | Semantic memory feeding "What we heard"; workspace knowledge base | Atlassian admins (Rovo client, Forge app); SharePoint admins (site grant); M365 admins (Teams app) |
| Stage 4 Enterprise hardening | Purview label checks at point time | Native editor if a trigger fires | Per-reader re-check; Cedar and AgentCore Policy on retrieval; Memory FGAC through the Gateway; retention and legal-hold mapping | InfoSec, Privacy and Legal |

## 6. Not verified, or could not access

- Whether `/shares` works with `Files.Read.All` instead of the documented `Files.ReadWrite`, and whether Stream `stream.aspx` URLs resolve through `/shares`.
- Folder-level delta on business drives (documented root-only; one community report).
- Whether the app-installed transcript and recording subscription scope is v1.0 or beta-only (two Microsoft pages disagree).
- Confluence "suggestions" (only seen as V2 tool names).
- Whether managed knowledge base citation `location` for Custom documents carries our own anchor (we planned for it in metadata either way).
- AgentCore Memory's minimum event retention (1 or 3 days).
- The S3 Vectors price sheet (secondary sources only).
- The Firecrawl rate limit blocked one scrape of the Rovo changelog. WebFetch covered it instead.

## Sources

Microsoft:
- [shares-get](https://learn.microsoft.com/en-us/graph/api/shares-get?view=graph-rest-1.0)
- [driveItem delta](https://learn.microsoft.com/en-us/graph/api/driveitem-delta?view=graph-rest-1.0)
- [change notifications overview](https://learn.microsoft.com/en-us/graph/api/resources/change-notifications-api-overview?view=graph-rest-1.0)
- [subscription](https://learn.microsoft.com/en-us/graph/api/resources/subscription?view=graph-rest-1.0)
- [transcript and recording notifications](https://learn.microsoft.com/en-us/graph/teams-changenotifications-callrecording-and-calltranscript)
- [Get callTranscript](https://learn.microsoft.com/en-us/graph/api/calltranscript-get?view=graph-rest-1.0)
- [Get onlineMeeting](https://learn.microsoft.com/en-us/graph/api/onlinemeeting-get?view=graph-rest-1.0)
- [Teams limits](https://learn.microsoft.com/en-us/microsoftteams/limits-specifications-teams)
- [Selected permissions](https://learn.microsoft.com/en-us/graph/permissions-selected-overview)
- [scan guidance](https://learn.microsoft.com/en-us/onedrive/developer/rest-api/concepts/scan-guidance)
- [format conversion](https://learn.microsoft.com/en-us/graph/api/driveitem-get-content-format?view=graph-rest-1.0)
- [Copilot Retrieval API](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/api/ai-services/retrieval/overview)
- [office365itpros on MC1393806](https://office365itpros.com/2026/09/21/teams-meeting-graph-api/)
- [merill: OnlineMeetingTranscript.Read.All](https://graphpermissions.merill.net/permission/OnlineMeetingTranscript.Read.All)
- [merill: Files.Read.All](https://graphpermissions.merill.net/permission/Files.Read.All)

Atlassian:
- [Rovo MCP supported tools](https://developer.atlassian.com/cloud/rovo-mcp/guides/supported-tools/)
- [Rovo MCP changelog](https://developer.atlassian.com/cloud/rovo-mcp/changelog/)
- [Forge Confluence events](https://developer.atlassian.com/platform/forge/events-reference/confluence/)
- [Jira webhooks API](https://developer.atlassian.com/cloud/jira/platform/rest/v2/api-group-webhooks/)
- [CONFCLOUD-82676](https://jira.atlassian.com/browse/CONFCLOUD-82676)

AWS:
- [AgentCore pricing](https://aws.amazon.com/bedrock/agentcore/pricing/)
- [Memory strategies](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory-strategies.html)
- [Episodic memory](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/episodic-memory-strategy.md)
- [Namespaces](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/specify-long-term-memory-organization.html)
- [Memory metadata](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/long-term-memory-metadata.md)
- [Memory FGAC](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory-gateway-fgac.html)
- [IngestData announcement](https://aws.amazon.com/about-aws/whats-new/2026/09/agentcore-memory-direct-ingest)
- [Managed KB](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-build-managed.html)
- [Managed KB quotas](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-quotas.html)
- [sync](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-sync.html)
- [ACL](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-acl.html)
- [SharePoint connector](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-ds-sharepoint.html)
- [Custom connector](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-ds-custom.html)
- [direct ingestion](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-direct-ingestion.html)
- [connect data source](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-connect-ds.html)
- [native multimodal](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-managed-native-multimodal.html)
- [Gateway KB connector](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-target-connector-managed-kb.html)
- [Bedrock pricing](https://aws.amazon.com/bedrock/pricing/)
- [Managed KB GA](https://aws.amazon.com/es/about-aws/whats-new/2026/06/amazon-bedrock-managed-knowledge-base/)
- [S3 Vectors GA](https://aws.amazon.com/blogs/aws/amazon-s3-vectors-now-generally-available-with-increased-scale-and-performance)

Collaboration vendors:
- [Liveblocks pricing](https://liveblocks.io/pricing)
- [Tiptap pricing](https://tiptap.dev/pricing)
