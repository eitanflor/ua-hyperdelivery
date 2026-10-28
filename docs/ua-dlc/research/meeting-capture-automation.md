<!-- Point-in-time research, retrieved 2026-10-27 for the UA-DLC north star (round 9). Claims carry source links; vendor features and dates change quickly, so verify before acting. See README.md in this folder. -->
<!-- cspell:words Basich Betriebsrat BetrVG BIPA CIPA confirmer diarization DPIA itpros merill ondernemingsraden paywalled Silkin subpoints subprocessors thoughtstuff unattributed WOR -->

# Automatic meeting capture from Microsoft Teams (as of 2026-10-27)

Key: `meeting-capture-automation`. Builds on [enterprise-integration-platform.md](enterprise-integration-platform.md)
sections 1.1 to 1.4 (the transcript tenant control, subscription scopes, Teams app surfaces, Work IQ
and Agent 365), [resources-collab-memory.md](resources-collab-memory.md) sections 1 and 4 (pointing at
a meeting, the transcript gates in order, per-project index and memory), the Context Capture
proposal in [governance-collaboration.md](governance-collaboration.md) (B3 and R3: typed context
atoms, citations, the human confirmation gate), [platform-architecture.md](../platform-architecture.md)
section 11, and the Privacy and Legal rows of the long-lead track in
[enterprise-plan.md](../enterprise-plan.md#the-long-lead-track). It does not repeat what those
settle: the off-by-default transcript control and its `403` codes, the unattributed transcript
format, delegated reads by invitees, meeting expiry, the `.vtt` drop fallback, the Loop HTML
conversion limit, and the rule that self-transcribing a recording to get around a disabled control
is out of bounds. It answers one new question: how HyperDelivery could notice and ingest project
meetings **without someone pointing at them**, and what that needs.

HyperDelivery is the tool; UA-DLC is the process it runs. Meeting capture is a HyperDelivery feature
that feeds UA-DLC's Requirements step ("What we heard"). Everything here is post-MVP (Enterprise and
beyond) except the preparation in section 6.

## 0. Bottom line

1. **Trust Graph change notifications for "ready", not the OneDrive folder.** A transcript
   notification (`callTranscript`, average under 10 seconds and at most 60 minutes after the
   transcript exists) is the trigger to ingest. The Copilot recap arrives separately through the
   AI insights notification, up to four hours after the meeting. A bot's meeting-end event says the
   meeting is over, not that anything is ready. Call records are tenant-wide diagnostics that take
   up to 150 minutes, and OneDrive webhooks work only at the drive root with up to 6 hours of delay,
   so neither fits ([latency table](https://learn.microsoft.com/en-us/graph/change-notifications-overview),
   [Meeting Insights limits](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/meeting-transcripts/meeting-insights)).
2. **Linking a meeting means installing the HyperDelivery Teams app into it.** The organizer or a
   presenter grants resource-specific consent (RSC) for that one meeting. A per-meeting transcript
   subscription that uses only RSC is documented on v1.0 today; the "every meeting where the app is
   installed" scope is still beta-only. Both need the subscription to exist **before**
   transcription starts, so a meeting has to be linked before it begins
   ([transcript and recording notifications](https://learn.microsoft.com/en-us/graph/teams-changenotifications-callrecording-and-calltranscript),
   [supported resources](https://learn.microsoft.com/en-us/graph/api/resources/change-notifications-api-overview?view=graph-rest-1.0)).
3. **The Copilot recap is now readable on v1.0, with conditions.** The Meeting AI Insights API
   (`/v1.0/copilot/users/{userId}/onlineMeetings/{id}/aiInsights`) returns notes, action items and
   mentions with speaker and timestamp. It supports application permissions through an application
   access policy, but it needs a Microsoft 365 Copilot license (the API pages say every user of an
   app that calls it needs one), it does not cover channel meetings, and its change notifications are labeled
   preview. This corrects the earlier "still documented under /beta" reading in governance-collaboration.md B3
   ([List aiInsights](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/api/ai-services/meeting-insights/onlinemeeting-list-aiinsights),
   [Copilot APIs overview](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/copilot-apis-overview)).
4. **Loop and Facilitator notes have no "ready" event and no documented Graph link from the
   meeting.** They are a `.loop` file in someone's OneDrive (moving to the organizer's OneDrive,
   roadmap GA November 2026), editable by every attendee after the meeting. Read them only when
   pointed at, as a dated snapshot, and treat them as a weaker source than the transcript
   ([RM576194](https://mc.merill.net/message/RM576194)).
5. **Real time is still not here.** Work IQ real-time transcripts (RM570651) are still "in
   development" with a November 2026 GA target; Work IQ MCP has no transcript tool; Microsoft's
   interactive agents for meetings were delayed and reportedly dropped. Design for after-the-meeting
   capture only ([RM570651](https://mc.merill.net/message/RM570651),
   [Work IQ MCP tools](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/mcp/tool-reference)).
6. **The transcript tenant control is tenant-wide, all or nothing.** `Set-CsTeamsMeetingConfiguration`
   accepts only the `Global` identity, so turning on `EnableGraphTranscriptAccess` opens Graph
   transcript access to every app that already holds a transcript permission. Least privilege has to
   come from RSC and narrow consents, not from the control. UA's admins will reasonably ask for that
   argument in writing ([cmdlet reference](https://learn.microsoft.com/en-us/powershell/module/teams/set-csteamsmeetingconfiguration)).
7. **Governance is the long pole, not the code.** Automatic capture needs a lawful basis and a
   privacy assessment, attendee notice, an explicit consent policy for linking organizers, label and
   retention alignment, deletion that reaches HyperDelivery's index, and, for EMEA, works council
   consent (Dutch WOR article 27(1)(k) and (l); German BetrVG §87(1) no. 6). The 2025-2026 notetaker
   litigation (Otter in California, and an Illinois biometric privacy suit against Teams
   transcription) argues for reading only Microsoft's text output, never audio, and never using a notetaker bot
   ([WOR](https://wetten.overheid.nl/BWBR0002747/), [Otter ruling summary](https://www.bairdholm.com/blog/core-privacy-claims-against-ai-note-taking-platform-survive-dismissal/)).
8. **The ladder**, with the level names defined in [autonomy-levels.md](autonomy-levels.md) section 2.
   Human-led is someone taking notes by hand and sharing them. AI-assisted comes in two forms:
   pointed (someone points at a meeting and HyperDelivery pulls it; already in the Final MVP plan)
   and suggested (HyperDelivery spots a likely project meeting on the owner's calendar and asks "Add
   this?"). AI-driven: linked meetings ingest automatically, facts are proposed, each speaker
   confirms their own. At every level a human decides which meetings are linked and which facts are true; the AI
   never links a meeting on its own, and no unconfirmed fact grounds a plan.

---

## 1. Knowing a meeting is over and its artifacts are ready

### 1.1 The signals compared

| Signal | What it tells you | Scope and permission | Latency | Verdict |
|---|---|---|---|---|
| Bot `meetingStart` / `meetingEnd` events | Actual start and end time, title, join URL, meeting type | App installed in the meeting; RSC `OnlineMeeting.ReadBasic.Chat` (scheduled) and `ChannelMeeting.ReadBasic.Group` (channel). Scheduled and channel meetings only ([meeting apps APIs, updated 22 Oct 2026](https://learn.microsoft.com/en-us/microsoftteams/platform/apps-in-teams-meetings/meeting-apps-apis)) | Real time (not quantified by Microsoft) | **Use** to start the "waiting for artifacts" clock and post the in-meeting notice. Not proof that a transcript exists |
| `callTranscript` created | A transcript is available: ids, `meetingId`, `endDateTime`, `contentCorrelationId`, organizer | Per meeting (`communications/onlineMeetings/{id}/transcripts`, v1.0, RSC `OnlineMeetingTranscript.Read.Chat` allowed); per organizer; tenant-wide (application only); per installed app (beta). Blocked by the tenant control | Average under 10 s, maximum 60 min after availability | **Use** as the ingest trigger |
| `callRecording` created | The `.mp4` is stored | Same scopes; RSC `OnlineMeetingRecording.Read.Chat`. Not blocked by the transcript control | Average under 10 s, maximum 60 min | **Do not request.** HyperDelivery indexes the transcript, never the video (platform-architecture section 11) |
| `aiInsights` created | The Copilot recap (notes, action items, mentions) exists | Per meeting or per user (`/copilot/users/{id}/onlineMeetings/getAllAiInsights`); `OnlineMeetingAiInsight.Read.All`; the user in the path needs a Copilot license ([AI insights notifications](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/api/ai-services/change-notifications/aiinsights-changenotifications)); marked preview in the [Copilot APIs overview](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/copilot-apis-overview) | Not in Microsoft's latency table; the recap itself takes up to 4 h | **Use** when the recap is in scope; poll with backoff as a backstop |
| `onlineMeeting` `meetingCallEvents` | Call started or ended for one meeting by join URL | Beta only | Average under 10 s | Skip: the bot events give the same on v1.0 |
| `callRecord` | Usage and diagnostics after a call ends; can filter by participant | Application `CallRecords.Read.All`, tenant-wide; 100 subscriptions per organization ([call records notifications](https://learn.microsoft.com/en-us/graph/changenotifications-for-callrecords)) | Average under 30 min, maximum 150 min, for the first version | **Avoid.** Hands HyperDelivery every call's metadata in the tenant for a signal it gets elsewhere |
| OneDrive `driveItem` webhook or delta on the organizer's drive | Some file under the drive root changed | Root only for work drives; app-only `Files.Read.All` (every OneDrive in the tenant) or the organizer's delegated token | Average under 1 min, maximum 6 h | **Avoid.** See 1.2 |

Sources for the latency and quota columns: Microsoft's [change notifications overview](https://learn.microsoft.com/en-us/graph/change-notifications-overview)
(updated 7 Apr 2026) and the [supported resources table](https://learn.microsoft.com/en-us/graph/api/resources/change-notifications-api-overview?view=graph-rest-1.0),
which marks the app-installed transcript and recording scopes and `meetingCallEvents` as beta-only.
The scenario page for transcripts shows v1.0 examples for the app-installed scope, the same
disagreement resources-collab-memory.md recorded; the overview's asterisk is the one to trust until
tested.

### 1.2 Where recordings land, and why watching the folder is the wrong signal

- **Meetings and events:** the recording saves to the **organizer's** OneDrive `Recordings` folder,
  even if the organizer did not attend; if the organizer has no OneDrive it goes to the first
  co-organizer with one, then to whoever started recording, then to temporary storage that is deleted
  after 21 days ([storage and permissions, updated 16 Oct 2026](https://learn.microsoft.com/en-us/microsoftteams/tmr-meeting-recording-change)).
- **Channel meetings:** a `Recordings` folder in the team's SharePoint document library, with
  channel permissions. **1:1 and group calls:** the OneDrive of whoever pressed Record (same source).
- **Transcripts** travel with the recording for retention purposes: Microsoft documents deleting
  "recordings along with their accompanying transcripts" with one auto-apply retention label policy
  (storage and permissions page, same source), and both expire after 120 days by default unless UA
  changed it ([recording options](https://learn.microsoft.com/en-us/microsoftteams/manage-meeting-recording-options)).
- **What a watcher could see.** Webhooks for work and school drives fire only on the root, and delta
  is root-only (resources-collab-memory.md 1.3). To see one organizer's `Recordings` folder,
  HyperDelivery would read the change feed of that person's whole drive, with either tenant-wide
  app-only file access or their vaulted delegated token, and wait up to 6 hours. It would learn that
  a video landed, not that the transcript or the Copilot recap is ready, and the recap is not a file
  at all. The transcript notification answers the real question with a meeting-scoped permission.

### 1.3 Which signal to trust for which question

| Question | Signal to trust | Backstop | Typical delay |
|---|---|---|---|
| Is the meeting over? | Bot `meetingEnd` | Scheduled end time plus a margin | Seconds |
| Is the recording uploaded? | `callRecording` created (not requested; see 1.1) | n/a | Under 10 s after storage, at most 60 min |
| Is the transcript ready? | `callTranscript` created | List `/onlineMeetings/{id}/transcripts` 30, 90 and 240 minutes after `meetingEnd`, then a nightly reconciliation | Under 10 s after availability; time from meeting end to availability is not documented (not verified) |
| Is the Copilot recap ready? | `aiInsights` created (preview) | List `aiInsights` with backoff until 5 hours after `meetingEnd` | Up to 4 h after the call ends ([Meeting Insights](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/meeting-transcripts/meeting-insights)) |
| Are the Loop or Facilitator notes final? | None exists | The organizer points at them, or confirms "notes are done" on the confirmation card | n/a: attendees can keep editing |

### 1.4 Rules that shape the design

- **Subscribe before transcription starts.** A transcript notification "is sent only if the
  subscription happens before the transcription starts" (scenario page). Linking therefore happens
  before the meeting, and every after-the-fact link is a pull.
- **Subscriptions last at most 3 days** (4,320 minutes) for transcripts, recordings and other Teams
  resources, and need a `lifecycleNotificationUrl` beyond one hour. A linked weekly series needs its
  subscription renewed continuously.
- **One shared quota.** All Teams subscriptions in the tenant, from every app, share 10,000; per
  meeting, one subscription per app ([supported resources](https://learn.microsoft.com/en-us/graph/api/resources/change-notifications-api-overview?view=graph-rest-1.0)).
- **The webhook must answer in 3 seconds.** Graph retries for up to 4 hours, throttles slow
  endpoints, and can drop notifications that "can't be recovered", so the endpoint queues and returns
  `202` at once ([webhook delivery](https://learn.microsoft.com/en-us/graph/change-notifications-delivery-webhooks)).
- **Calendar meetings only.** The transcript API does not support meetings created with the
  standalone create-onlineMeeting API that have no calendar event; if HyperDelivery ever schedules a
  working session, it creates a calendar event ([Get callTranscript](https://learn.microsoft.com/en-us/graph/api/calltranscript-get?view=graph-rest-1.0)).
- **Prefer scheduled, non-channel meetings for captured work.** Channel meetings get no transcript
  RSC, no AI insights API, no Facilitator, and no app-installed subscription (sources in 1.1 and 2.2).
- **Expiry now favors series.** A recurring meeting with no end date expires one year after it was
  last joined or updated; a one-time meeting 60 days after its scheduled time (public preview regime,
  [Teams limits, updated 7 Oct 2026](https://learn.microsoft.com/en-us/microsoftteams/limits-specifications-teams)).

## 2. Where the AI notes live and how to read them

### 2.1 Intelligent recap and the Meeting AI Insights API

- **Status.** The List and Get pages (updated 3 Apr 2026) show a v1.0 endpoint beside beta, and the
  Copilot APIs overview lists "Meeting Insights API" without a preview tag while "AI Insights Change
  Notifications API" carries one. The resource type page still shows a beta banner from August 2025
  ([callAiInsight](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/api/ai-services/meeting-insights/resources/callaiinsight)).
  A December 2025 secondary report called it GA ([thoughtstuff](https://blog.thoughtstuff.co.uk/2025/12/weekly-update-22-december-2025-aicontextprovider-copilot-ai-insights-api-ga-vs2026-debugging/), secondary).
- **What it returns.** `meetingNotes` (title, text, subpoints), `actionItems` (title, text,
  `ownerDisplayName`), and `viewpoint.mentionEvents` (speaker identity, `eventDateTime`,
  `transcriptUtterance`). `contentCorrelationId` ties each insight to the transcript it came from, and
  each transcript event of a meeting creates its own insight object
  ([Get callAiInsight](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/api/ai-services/meeting-insights/callaiinsight-get),
  [Meeting Insights](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/meeting-transcripts/meeting-insights)).
- **Permissions.** `OnlineMeetingAiInsight.Read.All`, delegated or application; application use
  needs an application access policy granted to the user in the path. A chat-scoped application
  permission, `OnlineMeetingAiInsight.Read.Chat`, is listed as "read all aiInsights for online meetings where the
  Teams-app is installed", but no Graph methods use it yet
  ([merill](https://graphpermissions.merill.net/permission/OnlineMeetingAiInsight.Read.Chat.html), secondary),
  and Microsoft's [RSC permission list](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
  does not include it.
  The access-policy page does not list the AI insights permission among those it governs, a gap to
  test ([application access policy](https://learn.microsoft.com/en-us/graph/cloud-communication-online-meeting-application-access-policy)).
- **License.** Every user of an app that uses the API needs a Microsoft 365 Copilot license; there is
  no pay-as-you-go or evaluation path. For notifications, the user in the resource path needs one.
  Secondary sources put Copilot at about USD 30 per user per month, or included in Microsoft 365 E7
  at about USD 99 ([TrustedTech](https://www.trustedtechteam.com/blogs/microsoft-365/how-much-is-microsoft-365-e7-pricing-2026), secondary).
- **Coverage.** Private scheduled meetings, town halls, webinars and Meet now; not channel meetings.
  Transcription or recording must be on. Insights exist only after the meeting, up to four hours later
  ([Meeting Insights](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/meeting-transcripts/meeting-insights)).
- **Recap without a transcript.** RM558286 (rolling out, GA October 2026) lets organizers produce an
  intelligent recap without saving the transcript; chapters, topics and mentions "may not be
  available" ([RM558286](https://mc.merill.net/message/RM558286)). Since the API requires
  transcription or recording, such meetings probably give HyperDelivery nothing to read (not verified).

### 2.2 Facilitator and Loop collaborative notes

- **Facilitator** writes live AI notes, decisions and open questions to a **Loop page**; adding it
  needs a Copilot license; it works only in scheduled meetings (not channel, instant or calls); any
  participant can edit the page before, during and after; notes appear in the meeting's Recap under
  Notes ([Microsoft Support](https://support.microsoft.com/en-US/teams/copilot/facilitator-in-microsoft-teams-meetings)).
- **Where the file is.** Today a `.loop` file in a `Meetings` folder of whoever started the notes
  (Microsoft Q&A, secondary). Roadmap item RM576194, added 14 Oct 2026 and "in development", moves
  collaborative and Facilitator notes for non-channel meetings to the **organizer's** OneDrive, GA
  November 2026 ([RM576194](https://mc.merill.net/message/RM576194)). Loop meeting notes reached
  instant meetings in April and May 2026, get a company-shareable link by default, and are governed
  by `Set-SPOTenant -IsCollabMeetingNotesFluidEnabled` ([MC1218712](https://mc.merill.net/message/MC1218712)).
- **Reading.** Once someone points at the link, `/shares` then `/content?format=html` (2 MB cap), as
  resources-collab-memory.md 1.1 describes. **Finding** it automatically is the gap: I found no
  documented Graph property linking an `onlineMeeting` to its notes file. Reading the meeting chat
  for the Loop card would need `ChatMessage.Read.Chat`, which exposes the whole meeting chat, so it is
  not recommended.
- **Provenance.** The page mixes AI text and edits by anyone, with no transcript anchors. Facts drawn
  from it are proposals that must be matched to a transcript cue or confirmed by a named person.

### 2.3 Real-time transcripts and Work IQ

- **RM570651, "Work IQ: Real Time Transcripts"**: still "In development", preview target September
  2026 (passed) and GA target November 2026 ([RM570651](https://mc.merill.net/message/RM570651)). The
  Enterprise "Working session" side panel in [ux-direction.md](../ux-direction.md) ("Now Asking",
  "Captured (Proposed)") should not depend on it.
- **Interactive agents in meetings.** Microsoft delayed "Interactive agents for meetings and calls"
  in September 2025 with no new date ([MC1087634](https://mc.merill.net/message/MC1087634)); a search
  summary of the roadmap archive says RM490564 was updated on 17 Aug 2026 to "not move forward"
  (not verified: the page would not open).
- **Work IQ MCP** (GA as part of the Work IQ API) exposes generic entity tools (`fetch`,
  `call_function` and others over `/me/`, `/users/` and `/sites/` v1.0 paths, as the signed-in user,
  writes blocked by default), Copilot tools (`ask`, and `retrieve` in preview with a `Meetings`
  capability), and schema discovery. It has no transcript or recap tool
  ([tool reference, 13 Oct 2026](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/mcp/tool-reference)).
  The workload-specific Microsoft MCP servers (Teams, Calendar, Mail and others) are now "legacy" and
  "shouldn't be used in production" ([Agent 365 MCP options, 23 Oct 2026](https://learn.microsoft.com/en-us/microsoft-agent-365/tooling-servers-overview)).
  Work IQ stays where the plan puts it: "what did we decide about X" questions, not capture.

### 2.4 Tenant controls, beyond what earlier research covered

- The Teams platform changelog lists the transcript admin controls as preview on 30 Jun and GA on
  30 Jul 2026 ([what's new](https://learn.microsoft.com/en-us/microsoftteams/platform/whats-new)).
- `-EnableGraphTranscriptAccess` and `-EnableAttributedTranscripts` sit on
  `Set-CsTeamsMeetingConfiguration`, whose only valid identity is `Global`: there is no per-app,
  per-user or per-group scoping
  ([cmdlet reference](https://learn.microsoft.com/en-us/powershell/module/teams/set-csteamsmeetingconfiguration)).
- The control blocks transcript metadata, `metadataContent` and content alike, with "no request-side
  workaround"; with attribution off, `text/vtt` fails and the unattributed format still works
  ([Get callTranscript](https://learn.microsoft.com/en-us/graph/api/calltranscript-get?view=graph-rest-1.0)).
- Whether the control also blocks the AI insights API, which is derived from the transcript, is not
  documented (not verified). Ask Microsoft before relying on the recap as a fallback.
- **Copilot meeting policy decides whether there is anything to read.** Under the default,
  "On with saved transcript required", Copilot works only once someone starts a transcript, which is
  saved, and organizers can't change the option; "Only during the meeting" keeps no transcript; turning Copilot off for a meeting also turns off recording and transcription
  ([Copilot in meetings, updated 26 Oct 2026](https://learn.microsoft.com/en-us/microsoftteams/copilot-teams-transcription)).

### 2.5 Which artifact counts as evidence

| Artifact | Kind | Anchor for a citation | Use |
|---|---|---|---|
| Transcript (`text/vtt` or unattributed text) | Primary record | Cue start and end; speaker id when attributed | Every proposed fact cites cues here when it can |
| AI insights `mentionEvents` | Derivative, but quotes an utterance with speaker and time | `eventDateTime`, `transcriptUtterance`, speaker | Re-ground to the transcript cue by time and text |
| AI insights `meetingNotes`, `actionItems` | Derivative summary | `contentCorrelationId` to the transcript only | Candidate open questions and decisions; never cited alone |
| Loop or Facilitator notes | Mixed AI and human, editable | Page version and heading | Candidates; "Snapshot from {date}"; needs a cue match or a named confirmer |

## 3. Consent and governance for automatic capture

### 3.1 Which meetings are in scope

A meeting is in scope only through an explicit human act that HyperDelivery records:

- **Invite the app.** The organizer adds HyperDelivery to the meeting (Apps in the meeting, or
  HyperDelivery adds itself on the organizer's click from the project). RSC for a meeting can be
  granted only by its organizer or a presenter
  ([RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)).
  Installing an app that needs RSC through Graph requires the `...AndConsent...` variants such as
  `TeamsAppInstallation.ReadWriteAndConsentSelfForChat`; installing into a meeting chat installs into
  the meeting ([Add app to chat](https://learn.microsoft.com/en-us/graph/api/chat-post-installedapps?view=graph-rest-1.0)).
- **Link from the project.** The requester picks a meeting from their calendar in the console; this
  is the same install, done for them.
- **Link a series.** One decision covers the future occurrences of a recurring meeting; every
  occurrence still shows the notice, and the organizer can unlink at any time.

Exclusion rules, applied by the ingest before it reads anything:

- Only scheduled, non-channel meetings with a calendar event.
- No external or guest attendees (they get no automatic recording access and are outside UA's
  notice and policies; [storage and permissions](https://learn.microsoft.com/en-us/microsoftteams/tmr-meeting-recording-change)).
- No EMEA attendees until the works council and privacy reviews in 3.5 land; the Final MVP's
  interim scope already excludes them ([enterprise-plan.md](../enterprise-plan.md#the-do-no-harm-floor-weeks-1-and-2), item 9).
- No meeting labeled above the project's tier (the Final MVP floor already refuses files above
  Internal).
- Never HR, disciplinary, health, legal-privilege or works council meetings, whatever the link says.
- Any attendee can say "don't use my statements" for a meeting or for all meetings; their utterances
  are dropped before extraction.

### 3.2 Notice to attendees

- **Before:** the invite carries one line, "Linked to HyperDelivery project {name}: its transcript and
  Copilot notes are read to propose facts each speaker confirms", and the project page lists linked
  meetings.
- **During:** HyperDelivery posts a meeting notification at `meetingStart`
  (`OnlineMeetingNotification.Send.Chat`) and the ux-direction capture indicator ("Notes Only: Not
  Recording", or "Transcript On, Organizer Consented 14:02").
- **Policy:** Teams can show UA's own privacy URL on recordings and transcripts
  ([recording options](https://learn.microsoft.com/en-us/microsoftteams/manage-meeting-recording-options)), and can require
  participant agreement: with `-ExplicitRecordingConsent Enabled`, everyone except the person who
  started it is muted, with camera and content sharing off, once recording or transcription starts,
  until they answer Yes or No; "No" means view-only; choices
  land in the attendance report and the Purview audit log; default Off
  ([participant agreement, May 2026](https://learn.microsoft.com/en-us/microsoftteams/participant-agreement-recording-transcription)).
  Recommend this policy for every organizer who links meetings to HyperDelivery.

### 3.3 Labels, retention, Purview and eDiscovery

- **Labels.** A meeting label can enforce who records and transcribes, auto-record, and "prevent
  copying and forwarding of meeting chat, live caption, and transcripts", which "also extends to
  AI-generated meeting recap content". That setting "doesn't apply to developer tools or third-party
  apps", so HyperDelivery has to read and enforce labels itself. The policy setting "Apply meeting
  label to artifacts" (preview) labels recordings with transcripts (`.mp4`) and meeting notes
  (`.loop`) when they are saved ([labels for meetings, Jul 2026](https://learn.microsoft.com/en-us/purview/sensitivity-labels-meetings)).
  Copilot itself does not yet recognize labels that protect Teams meetings and chat
  ([Purview Copilot considerations](https://learn.microsoft.com/en-us/purview/ai-m365-copilot-considerations)).
- **Retention.** Teams expiration (120 days by default) saves storage and "doesn't enforce compliance
  requirements"; Purview retention labels do ([recording options](https://learn.microsoft.com/en-us/microsoftteams/manage-meeting-recording-options)).
  If transcripts are off, Copilot in Teams has no auditing, eDiscovery or retention support (Purview
  considerations, same source).
- **HyperDelivery's copy sits outside Purview** (resources-collab-memory.md 4.4). The rule: it never
  outlives its source. Each ingested transcript records the source's expiry and label; the project
  index deletes it at the earlier of that expiry and project end.
- **eDiscovery and holds** reach the M365 originals, not the AWS copy. HyperDelivery's own decision
  records and confirmed facts are business records in their own right, and Legal should give them a
  retention schedule.

### 3.4 Deletion propagating into HyperDelivery

The documented transcript and recording subscriptions use `changeType: created`; I found no deletion
notification for either (not verified). So deletion is pulled:

- A nightly reconciliation reads the metadata of every ingested transcript and insight as the same
  identity that ingested it. `404`, `403` or an expired meeting removes the document from the project
  knowledge base (`DeleteKnowledgeBaseDocuments`) and marks the source chip.
- A per-item deletion is also scheduled at ingest for the source's expiry date.
- Proposed facts whose only source is gone are withdrawn. Confirmed facts keep the confirmed
  statement, the confirmer and the date, and drop the quoted utterance; whether that is enough is a
  question for Legal (section 9).
- A person's erasure or objection request covers their quotes in HyperDelivery too.

### 3.5 EU employees and works councils

- **Netherlands.** UA runs EMEA from Amsterdam (critique.md). The works council's consent right
  covers arrangements for "the processing and protection of personal data" of staff (art. 27(1)(k))
  and for facilities "aimed at or suitable for" observing or monitoring their attendance, behavior or
  performance (art. 27(1)(l)) ([WOR, current text in force since 18 Feb 2023](https://wetten.overheid.nl/BWBR0002747/)).
  Without consent the employer needs a cantonal court's substitute consent
  ([Randstad](https://www.randstad.nl/werkgevers/werkpocket/wet-en-regelgeving/medezeggenschap-ondernemingsraad/rechten-van-de-ondernemingsraad), secondary).
- **Germany.** If UA has German employees with a Betriebsrat (not verified), BetrVG §87(1) no. 6 gives
  a co-determination right over technical systems that can monitor behavior or performance, read
  broadly by the Federal Labor Court, and §90 requires early consultation on AI
  ([Mayer Brown, 5 Oct 2026](https://www.mayerbrown.com/en/insights/publications/2026/10/internal-investigations-role-and-rights-of-employee-representatives), secondary).
- **GDPR.** Notice under article 13 and very likely a data protection impact assessment under
  article 35 for systematic processing of employee meetings ([GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj)).
- **EU AI Act.** Systems intended to monitor and evaluate the performance and behavior of people in
  work relationships are high-risk under Annex III point 4(b)
  ([Annex III](https://artificialintelligenceact.eu/annex/3/)); the Digital Omnibus on AI, published
  in the Official Journal on 24 Jul 2026 and in force from 27 Jul 2026, moves those obligations to
  2 Dec 2027 ([Lewis Silkin, 27 Jul 2026](https://www.lewissilkin.com/insights/2026/07/27/the-digital-omnibus-on-ai-enters-into-force-today-102nedo), secondary;
  the [EUR-Lex text](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202601744) did not render for this check).
  Design rule: meeting capture never produces per-person scores, rankings, talk-time or
  participation metrics. Department-level counts only.

### 3.6 US recording-consent and biometric law

- UA is headquartered in Maryland, an all-party consent state (Courts and Judicial Proceedings
  §10-402, [statute](https://mgaleg.maryland.gov/2024RS/Statute_Web/gcj/10-402.pdf)); California's
  CIPA is too.
- In *In re Otter.AI Privacy Litigation* (N.D. Cal.), CIPA, federal Wiretap Act and Illinois
  biometric claims survived dismissal because the vendor allegedly used conversations for its own
  purposes, including model training ([Baird Holm, 24 Aug 2026](https://www.bairdholm.com/blog/core-privacy-claims-against-ai-note-taking-platform-survive-dismissal/), secondary).
- *Basich v. Microsoft* (W.D. Wash., filed 5 Feb 2026) alleges that Teams' speaker diarization creates
  BIPA voiceprints ([UC Today](https://www.uctoday.com/unified-communications/microsoft-teams-lawsuit-bipa-voice-data/), secondary).
  Microsoft moved to dismiss in May 2026, and in July 2026 asked the court to stay the case, compel
  some plaintiffs to arbitrate, or dismiss the revised complaint
  ([Law360, 26 May 2026](https://www.law360.co.uk/articles/2481987), [Law360, 24 Jul 2026](https://www.law360.com/articles/2505609), secondary,
  paywalled); I found no ruling.
- What follows for HyperDelivery: read only the text Microsoft produces under UA's settings and
  notices; never touch audio; never train or tune a model on meeting content; process in UA's AWS
  account, where Bedrock model providers have no access to prompts or completions
  ([Bedrock data protection](https://docs.aws.amazon.com/bedrock/latest/userguide/data-protection.html)).

### 3.7 Copilot licensing

| Capability | License | Needed for |
|---|---|---|
| Transcripts through Graph | None beyond Teams | All levels |
| Meeting AI Insights API and its notifications | Microsoft 365 Copilot for the user read (the organizer); the List and Get pages say every user of an app that calls the API needs one, so confirm with Microsoft whether that covers HyperDelivery's own users | Recap as a source |
| Facilitator | Copilot for whoever adds or turns it on | Loop AI notes |
| Intelligent recap in the Teams client | Teams Premium or Copilot ([schneider.im](https://www.schneider.im/microsoft-teams-intelligent-recap-audio-recap/), secondary) | Humans reading the recap |
| Agent 365, Work IQ consumption | Not needed for capture | n/a |

The design must work with transcripts alone. Recap and Facilitator notes improve it where the
organizer is licensed.

### 3.8 Out of bounds

- Self-transcribing a recording, or capturing audio any other way, to get around a disabled
  transcript control (existing research; kept). That includes a real-time media bot: the RSC
  permissions `Calls.JoinGroupCalls.Chat` and `Calls.AccessMedia.Chat` exist, and HyperDelivery must
  not request them.
- Tenant-wide transcript, recording, call record or OneDrive subscriptions.
- Linking meetings automatically, or ingesting a meeting nobody linked.
- Any fact from a meeting grounding a Brief, plan or approval before the person it is attributed to
  confirms it.

### 3.9 What Privacy and Legal must sign

1. The lawful basis and the assessment (DPIA for EMEA, UA's US privacy review) for automatic capture
   of linked meetings, separately from the Final MVP's interim scope for pointed transcripts.
2. The notice text (invite line, in-meeting notification, privacy URL) and whether
   `ExplicitRecordingConsent` is mandatory for linking organizers.
3. The scope rules in 3.1, including meeting types never captured and the rule for external attendees.
4. Retention and deletion: copy never outlives source, the reconciliation interval, what survives of
   a confirmed fact after source deletion, legal-hold handling, and erasure requests.
5. Whether Copilot-generated notes may be used as a source at all, and how they are labeled to
   readers.
6. The works council plan for EMEA, before any EMEA attendee's meeting is captured.
7. The processing terms: Bedrock region for EMEA data, no training, subprocessors.
8. Whether a human dropping a `.vtt` they downloaded is acceptable while the tenant control is off.
   The control governs apps, not people, but it reads as a policy statement and should be answered
   explicitly rather than assumed.

## 4. Reference design on AWS

### 4.1 Flow

```
Teams and Graph                                  AWS, HyperDelivery account
--------------------------------------------------------------------------------------------------
Organizer links a meeting (app installed, RSC)  ->  console API: MEETING_LINK item (DynamoDB),
                                                    consent record (who, when, notice version)
                                                ->  subscription manager (Lambda): per-meeting
                                                    transcripts?useResourceSpecificConsentBasedAuthorization=true,
                                                    and aiInsights when the organizer is licensed;
                                                    EventBridge Scheduler renews every ~60 h
Bot meetingStart  ------------------------------>  Teams bot (existing app): in-meeting notice
Bot meetingEnd    ------------------------------>  event "meeting.ended" -> EventBridge bus
Graph: callTranscript created  --+
Graph: aiInsights created      --+--> API Gateway /graph/notify -> notify Lambda:
Graph: lifecycle events        --+    echo validationToken; check clientState; queue; 202 in < 3 s
                                       SQS -> EventBridge Pipes -> bus "meetings"
                                       rule -> Step Functions Standard "MeetingIngest" (one per meeting)
Lifecycle: reauthorizationRequired, missed, subscriptionRemoved -> renew, or run a reconciliation pull
```

The webhook can be locked to Microsoft Graph's published IP ranges. Notifications without resource
data avoid managing an encryption certificate; the ingest fetches content itself with RSC or the
organizer's vaulted token.

### 4.2 The `MeetingIngest` state machine

1. **Scope check** against section 3.1, using the attendee list at end time. Out of scope stops with
   a recorded reason ("Skipped: external attendee") that the organizer can see.
2. **Fetch the transcript.** Ask for `text/vtt`; on `SpeakerAttributionNotAllowed` retry with the
   unattributed format; on `GraphAccessToTranscriptsDisabled` mark the chip "Blocked by tenant
   setting", tell the organizer their options, and stop. Branch on `innerError.code`.
3. **Normalize** into cues (id, start, end, speaker id or "unattributed", text), drop the utterances
   of anyone who opted out, flag instruction-like text, and write to the S3 corpus with a sidecar
   (meeting id, transcript id, `contentCorrelationId`, source expiry, label, attendee-list hash).
4. **Wait for the recap** in a parallel branch: the `aiInsights` notification, or polling with
   backoff, until 5 hours after the end. Optional.
5. **Loop notes** only if someone pointed at them; snapshot as HTML.
6. **Index** into the project's knowledge base (`IngestKnowledgeBaseDocuments`, document id = resource id).
7. **Extract** typed atoms (section 4.3) with a Bedrock model, grounded per cue.
8. **Propose** the atoms where Confirm what we heard reads proposed records
   (platform-architecture section 11).
9. **Route and wait** (section 4.4) with `.waitForTaskToken` per person batch; Standard workflows can
   wait up to a year, with a heartbeat timeout so nothing hangs
   ([Step Functions callback](https://docs.aws.amazon.com/step-functions/latest/dg/connect-to-resource.html)).
10. **Schedule deletion** at the source's expiry, and register the item for nightly reconciliation.

A one-hour meeting is roughly 9,000 spoken words at about 150 words a minute (estimate), so storage
is negligible at the managed knowledge base's USD 5 per GB of raw data a month
([Bedrock pricing](https://aws.amazon.com/bedrock/pricing/)); the cost drivers are one
extraction call per meeting and the organizers' Copilot licenses.

### 4.3 From transcript to typed context atoms

Atom types and statuses follow governance-collaboration.md R3 (Term, Metric, BusinessRule, Decision,
Assumption, Constraint, OpenQuestion, Persona/Job, ProcessStep/DomainEvent, DataSourceRef; proposed,
confirmed, canonical, superseded). Meeting-specific fields:

| Field | Example | Why |
|---|---|---|
| `source_kind` | `transcript`, `ai_insight`, `loop_notes`, `vtt_file` | Readers see what kind of evidence it is |
| `meeting_id`, `occurrence_date` | | Series produce many transcripts |
| `transcript_id`, `cue_ids`, `start`, `end` | `00:41:12` to `00:41:40` | Citation chip opens the moment |
| `speaker_id` or `unattributed` | Entra object id | Routes the confirmation |
| `quote` | One or two sentences | Shown beside the fact; dropped if the source is deleted |
| `grounded` | `true` when matched to a transcript cue | Ungrounded atoms are flagged "From AI notes" |
| `confidence` | model score | Ordering only, never a gate |

Recap content is mapped, not trusted: `mentionEvents` are matched to cues by time and text,
`actionItems` become OpenQuestion or Decision candidates owned by the named person, and
`meetingNotes` only help find cues. Metric and definition atoms are checked first against certified
definitions (Snowflake semantic views); a conflict becomes a definition dispute for the steward.

### 4.4 The confirmation gate

- **Each speaker confirms their own statements.** One Teams card per person per meeting, a few
  statements each, with Agree, Correct, "Not Me" and "Don't Use", and a link to the console view.
  Decisions go to their named owner, metrics to the steward, unattributed statements to the organizer.
- **A confirmation is not an approval** ([operating-model.md](../operating-model.md)); approvals 1 to
  3 stay where they are, and show how many meeting facts are still unconfirmed.
- **Silence never confirms.** One reminder after two business days, then the atom stays "not yet
  agreed" and never grounds anything.
- **Sending cards is proactive messaging**, which needs the app installed in each person's personal
  scope; admins can pre-install it for pilot users through an app setup policy
  ([proactive messages](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)).

### 4.5 Fallbacks when a control is off

| Condition | What HyperDelivery does |
|---|---|
| Transcript Graph access off | Chip "Blocked by tenant setting"; offer Loop notes by link and the `.vtt` drop if Legal allows it (3.9 item 8); never self-transcribe |
| Speaker attribution off | Unattributed format; all statements go to the organizer to confirm, marked "speaker unknown" |
| Copilot "Only during the meeting", or recap without saved transcript | "No transcript was saved for this meeting"; notes by link only |
| Organizer has no Copilot license | Transcript only; no recap branch |
| Channel meeting | Not captured automatically; a pointed pull with the delegated token |
| Meeting linked after transcription started | One pull after the meeting (the subscription cannot fire) |
| Subscription lapsed, or notification dropped | Lifecycle event or the scheduled list calls catch it; nightly reconciliation |
| An attendee answered "No" under explicit consent | Nothing to do: Teams leaves them out of the record |
| Label above the project tier | Skip with reason; the organizer may move the work to a higher-tier project |

## 5. The ladder: human-led, AI-assisted, AI-driven

Level names follow [autonomy-levels.md](autonomy-levels.md) section 2. Human-led (notes taken and
shared by hand) needs nothing from HyperDelivery, so the table starts at AI-assisted.

| Level | What happens | Human decisions | Permissions | Admin and consent | Licenses | Phase |
|---|---|---|---|---|---|---|
| **AI-assisted, pointed** | Someone points at a meeting, recap or Loop link, or drops a `.vtt`; HyperDelivery pulls once and proposes facts | What to point at; each fact | Delegated `OnlineMeetings.Read`, `OnlineMeetingTranscript.Read.All` (admin consent), `Files.Read.All`; optionally delegated `OnlineMeetingAiInsight.Read.All` | Transcript control on (or `.vtt` only); Privacy and Legal interim scope | Copilot only to read the recap | Final MVP (already planned, platform-architecture section 11) |
| **AI-assisted, suggested** | HyperDelivery reads the project owner's calendar, spots a likely project meeting (project or Jira key in the subject, attendee overlap, created from the project) and asks "Add this meeting?" before it starts; yes links it | Each link | Adds delegated `Calendars.ReadBasic` for opted-in owners (no event bodies; [merill](https://graphpermissions.merill.net/permission/Calendars.ReadBasic), secondary), vaulted refresh; the app in the owner's personal scope | Same, plus Privacy and Legal's meeting-capture review (weeks 8 to 20) | Same | Enterprise hardening (weeks 23 to 36) |
| **AI-driven** | Linked meetings and series ingest automatically; facts proposed; each speaker confirms | Linking (once per meeting or series), each fact, disputes, approvals | RSC `OnlineMeeting.ReadBasic.Chat`, `OnlineMeetingTranscript.Read.Chat`, `OnlineMeetingNotification.Send.Chat`; delegated `TeamsAppInstallation.ReadWriteAndConsentSelfForChat` to link from the console; recap via the organizer's vaulted delegated token, or application `OnlineMeetingAiInsight.Read.All` with an access policy per linking organizer | Custom app allowed with meeting RSC; chat and meeting RSC enabled; public webhook endpoint; `ExplicitRecordingConsent` for linking organizers; signed Privacy and Legal scope; works councils before EMEA | Copilot for organizers who want the recap | Enterprise rollout for US-only workspaces after Enterprise ready (week 36); EMEA beyond Enterprise |

AI-driven means HyperDelivery does the noticing, fetching, extracting and routing; humans still make
every decision it surfaces. The one decision it never makes is the link itself, because the link is
the consent.

## 6. What to prepare now (Final MVP), without building ahead

1. **Make the pointed path capture-ready.** The `.vtt` parser and `SourceRef` are already planned;
   give the transcript anchor the fields in 4.3 (`source_kind`, meeting, transcript and cue ids,
   speaker id or `unattributed`, source expiry, label), so automatic ingestion later writes the same
   records.
2. **Write down, do not build, the `MEETING_LINK` and consent record** (who linked, when, notice
   version, attendee-list hash, EMEA and external flags, opt-outs), so the decision can be reviewed
   with Privacy before code exists. Its key goes in `src/infrastructure/repositories/keys.py` when it
   is built.
3. **Handle the codes and formats now** in the resource reader: `GraphAccessToTranscriptsDisabled`,
   `SpeakerAttributionNotAllowed`, the unattributed format, an expired meeting, and the "Blocked by
   tenant setting" chip (platform-architecture section 11).
4. **Show the trajectory in the week-1 Teams app request.** Ship only the Final MVP's permissions, but
   list the Enterprise RSC set from section 5 in the same request so M365 admins review the direction
   once.
5. **Ask pilot users to hold project working sessions as scheduled, non-channel meetings** with
   transcription on. It costs nothing and keeps every later option open.
6. **Measure during the pilot:** share of projects with a relevant meeting, pointed transcripts per
   project, how often the tenant control blocked a read, confirmation and rejection rates of
   meeting-derived facts, and time to confirm. These decide whether the suggested form of
   AI-assisted is worth the next review.
7. **Draft the notice text and the "what we capture" page with Privacy** alongside the interim scope.
8. **List the Enterprise spikes, do not run them yet:** v1.0 status of the app-installed scope;
   whether a recurring series keeps one `onlineMeetingId`; whether the transcript control blocks AI
   insights; how to find a meeting's Loop notes; RSC for AI insights.

## 7. Long-lead requests

| Request | Owning team | Why | Needed by phase |
|---|---|---|---|
| Decide `EnableGraphTranscriptAccess` and `EnableAttributedTranscripts`, knowing both are tenant-wide | Microsoft 365 and Teams admins, with Privacy | No transcript reaches any app until it is on; attribution decides who confirms | Final MVP pilot (pointed links); Enterprise (automatic) |
| Admin consent for delegated `OnlineMeetingTranscript.Read.All` and `OnlineMeetingAiInsight.Read.All` | Entra and Microsoft 365 admins | Pointed meetings and recaps read as the pointer | Final MVP pilot |
| Teams app version with meeting RSC, and chat and meeting RSC enabled in the tenant | Microsoft 365 admins | Linking a meeting is installing the app with RSC | Enterprise |
| Meeting policy with `ExplicitRecordingConsent` and UA's privacy URL for linking organizers | Teams admins, Privacy | Explicit attendee consent and notice | Enterprise |
| Application access policy for linking organizers, if the recap is read app-only | Teams admins | AI insights with application permissions needs it | Enterprise |
| Copilot license inventory for likely organizers | Microsoft 365 licensing | Recap and Facilitator need it | Enterprise |
| Automatic-capture privacy review: DPIA or US assessment, notice, retention, deletion, erasure, confirmed-fact survival | Privacy and Legal | Extends the existing week 8 to 20 meeting-capture review to automatic capture | Enterprise, before AI-driven |
| Works council consultation (Dutch OR; German Betriebsrat if one exists) | EMEA HR and employee relations, Legal | Consent rights over monitoring-capable systems | Beyond Enterprise, before any EMEA meeting |
| Purview: label for project meetings, "Apply meeting label to artifacts", MP4 labeling, retention policy for linked meetings | Compliance and Purview admins | HyperDelivery enforces labels itself and mirrors retention | Enterprise |
| Public HTTPS endpoint for Graph notifications on AWS, with IP allowlist and WAF | Cloud platform, InfoSec | Graph webhooks must reach AWS within 3 seconds | Enterprise |
| Microsoft account team questions (section 9) | Microsoft 365 admins via the account team | Beta scopes, undocumented RSC and control interactions | Enterprise hardening |

## 8. Risks

- **People speak less freely** once meetings feed a tool. Mitigation: opt-in links, visible notice,
  per-person "don't use my statements", notes-only default, deletion on request.
- **AI summaries are wrong in plausible ways.** Mitigation: transcript cues as the citation of
  record, "From AI notes" flags, and the confirmation gate.
- **M365 admins decline the tenant-wide control.** Fallback: human-led notes and pointed files; the
  owner keeps the argument from 0.6 ready.
- **Vendor churn.** The app-installed scope is beta, AI insights notifications are preview, RM570651
  slipped, interactive meeting agents were delayed, agent sessions were canceled. Every Microsoft
  dependency sits behind `providers/` with a named fallback.
- **Missed transcripts.** Subscriptions expire in 3 days, notifications can be dropped, and a link
  made after transcription starts never fires. Mitigation: lifecycle handling, scheduled list calls,
  nightly reconciliation.
- **Copilot license dependency** makes the recap uneven across organizers; the design never needs it.
- **Unattributed transcripts** break "each speaker confirms their own" and load the organizer.
- **Legal trend.** Wiretap and biometric suits against notetakers and Teams itself; mitigated by
  text-only, no audio, no training, explicit consent and UA's notice, but Legal owns the call.
- **EMEA consent rights** can block or delay capture for EMEA staff entirely.
- **AI Act creep.** Any per-person metric from meetings could move the feature toward Annex III;
  rule in 3.5.
- **The AWS copy drifts from Purview** (retention, holds, erasure); mitigated by expiry scheduling and
  reconciliation, not eliminated.
- **Confirmation fatigue.** Batch per person per meeting, one reminder, a weekly digest.

## 9. Open questions for UA's Microsoft 365 admins (and Privacy)

1. What are UA's current values for `EnableGraphTranscriptAccess`, `EnableAttributedTranscripts`,
   `-AllowTranscription`, the `-Copilot` meeting policy, recording expiration days, and
   `ExplicitRecordingConsent`?
2. Would you enable Graph transcript access tenant-wide, given it applies to every consented app? Which
   apps already hold transcript permissions?
3. Is chat and meeting RSC enabled? What is the review bar for a custom app requesting meeting RSC?
4. Can an application access policy be granted to a group of organizers, or only per user or
   globally?
5. Do meetings use sensitivity labels and Teams Premium? Is MP4 labeling and "Apply meeting label to
   artifacts" on?
6. Which Purview retention policies and holds cover recordings, transcripts and Copilot interactions?
7. Are Loop meeting notes and Facilitator enabled, and what is the default sharing link type?
8. How many likely organizers have Copilot licenses?
9. Will InfoSec accept inbound Graph webhooks to an AWS endpoint, or require Azure Event Hubs or Event
   Grid as the landing point?
10. Do older-format join URLs still circulate (they fail lookup;
    [office365itpros](https://office365itpros.com/2026/09/21/teams-meeting-graph-api/), secondary)?
11. For Microsoft: does the transcript control block the AI insights API? When does the app-installed
    scope reach v1.0? Will `OnlineMeetingAiInsight.Read.Chat` get methods? Is there a Graph path from a
    meeting to its Loop notes? What is the current date for RM570651? Does the AI insights license
    rule cover every HyperDelivery user, or only the user in the request path?
12. For Privacy: does a confirmed fact survive deletion of its source transcript, and in what form?

## 10. Not verified, or could not access

- The time from meeting end to transcript availability; Microsoft documents only notification
  latency after availability.
- Whether the app-installed transcript and recording scopes work on v1.0 (the overview says beta).
- Whether a recurring series keeps one `onlineMeetingId` with one transcript per occurrence.
- Whether the transcript tenant control also blocks the AI insights API, and whether a recap made
  without a saved transcript (RM558286) is readable through it.
- The meaning of `OnlineMeetingAiInsight.Read.Chat` in practice (listed, no methods), and whether the
  application access policy governs `OnlineMeetingAiInsight.Read.All` (the policy page omits it).
- Any documented way to find a meeting's Loop or Facilitator notes from the meeting; the current
  `Meetings` folder location comes from a Microsoft Q&A answer.
- Deletion notifications for transcripts, recordings or insights; I found only `created`.
- How to read a meeting's sensitivity label through Graph (applying one through Graph is unsupported).
- RM490564's reported withdrawal on 17 Aug 2026 (the roadmap page would not open; MC1087634 shows only
  the 2025 delay).
- Whether UA has German employees with a works council; the Covington July 2026 alert on works
  council rights in AI projects was a teaser only.
- The Digital Omnibus on AI text: its 24 Jul 2026 Official Journal publication and the 2 Dec 2027
  Annex III date come from secondary sources; the EUR-Lex page did not render.
- Whether the Meeting AI Insights license rule ("all users of applications that use this API")
  reaches HyperDelivery's own users or only the user in the request path.
- The Microsoft 365 meeting insights overview page returned 404; facts came from the List, Get and
  Teams platform pages instead.

## Sources

Microsoft Graph and the Teams platform:
- [Change notifications for transcripts and recordings](https://learn.microsoft.com/en-us/graph/teams-changenotifications-callrecording-and-calltranscript) (updated 29 Jun 2026)
- [Change notifications: supported resources](https://learn.microsoft.com/en-us/graph/api/resources/change-notifications-api-overview?view=graph-rest-1.0) (updated 7 Apr 2026)
- [Change notifications overview: lifetimes and latency](https://learn.microsoft.com/en-us/graph/change-notifications-overview)
- [Receive change notifications through webhooks](https://learn.microsoft.com/en-us/graph/change-notifications-delivery-webhooks) (updated 22 Apr 2026)
- [Change notifications for call records](https://learn.microsoft.com/en-us/graph/changenotifications-for-callrecords)
- [Call records API overview](https://learn.microsoft.com/en-us/graph/api/resources/callrecords-api-overview?view=graph-rest-1.0)
- [Get callTranscript](https://learn.microsoft.com/en-us/graph/api/calltranscript-get?view=graph-rest-1.0) (updated 1 Oct 2026)
- [Add app to chat](https://learn.microsoft.com/en-us/graph/api/chat-post-installedapps?view=graph-rest-1.0)
- [Application access policy](https://learn.microsoft.com/en-us/graph/cloud-communication-online-meeting-application-access-policy)
- [Meeting apps APIs: meeting start and end events](https://learn.microsoft.com/en-us/microsoftteams/platform/apps-in-teams-meetings/meeting-apps-apis) (updated 22 Oct 2026)
- [Resource-specific consent](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent) (updated 12 Oct 2026)
- [Send proactive messages](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages) (updated 13 Oct 2026)
- [Teams platform what's new](https://learn.microsoft.com/en-us/microsoftteams/platform/whats-new)

Microsoft 365 Copilot, Work IQ and Agent 365:
- [Meeting AI Insights API (Teams platform)](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/meeting-transcripts/meeting-insights) (updated 20 Jul 2026)
- [List aiInsights](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/api/ai-services/meeting-insights/onlinemeeting-list-aiinsights) and [Get callAiInsight](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/api/ai-services/meeting-insights/callaiinsight-get) (updated 3 Apr 2026)
- [callAiInsight resource](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/api/ai-services/meeting-insights/resources/callaiinsight)
- [AI insights change notifications](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/api/ai-services/change-notifications/aiinsights-changenotifications)
- [Microsoft 365 Copilot APIs overview](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/copilot-apis-overview) (updated 11 Aug 2026)
- [Work IQ MCP tool reference](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/mcp/tool-reference) (13 Oct 2026)
- [MCP server options in Agent 365](https://learn.microsoft.com/en-us/microsoft-agent-365/tooling-servers-overview) (updated 23 Oct 2026)
- [Facilitator in Teams meetings](https://support.microsoft.com/en-US/teams/copilot/facilitator-in-microsoft-teams-meetings)

Teams administration and Purview:
- [Recording and transcript storage and permissions](https://learn.microsoft.com/en-us/microsoftteams/tmr-meeting-recording-change) (updated 16 Oct 2026)
- [Recording and transcription options for sensitive meetings](https://learn.microsoft.com/en-us/microsoftteams/manage-meeting-recording-options) (updated 18 Aug 2026)
- [Participant agreement for recording and transcription](https://learn.microsoft.com/en-us/microsoftteams/participant-agreement-recording-transcription) (May 2026)
- [Copilot in Teams meetings and events](https://learn.microsoft.com/en-us/microsoftteams/copilot-teams-transcription) (updated 26 Oct 2026)
- [Set-CsTeamsMeetingConfiguration](https://learn.microsoft.com/en-us/powershell/module/teams/set-csteamsmeetingconfiguration) (updated 15 Jul 2026)
- [Teams limits and meeting expiration](https://learn.microsoft.com/en-us/microsoftteams/limits-specifications-teams) (updated 7 Oct 2026)
- [Sensitivity labels for meetings](https://learn.microsoft.com/en-us/purview/sensitivity-labels-meetings) (updated 21 Jul 2026)
- [Purview considerations for Copilot](https://learn.microsoft.com/en-us/purview/ai-m365-copilot-considerations) (30 Jun 2026)

Roadmap and message center (mc.merill.net mirrors Microsoft's roadmap and message center):
- [MC1393806, transcript access controls](https://mc.merill.net/message/MC1393806)
- [RM570651, Work IQ real-time transcripts](https://mc.merill.net/message/RM570651)
- [RM576194, Loop notes in the organizer's OneDrive](https://mc.merill.net/message/RM576194)
- [RM558286, recap without a saved transcript](https://mc.merill.net/message/RM558286)
- [MC1218712, meeting notes for instant meetings](https://mc.merill.net/message/MC1218712)
- [MC1087634, interactive agents for meetings and calls](https://mc.merill.net/message/MC1087634)

Law and regulation:
- [Wet op de ondernemingsraden, article 27](https://wetten.overheid.nl/BWBR0002747/) (consulted 27 Oct 2026)
- [GDPR, Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [EU AI Act, Annex III](https://artificialintelligenceact.eu/annex/3/)
- [Maryland Courts and Judicial Proceedings §10-402](https://mgaleg.maryland.gov/2024RS/Statute_Web/gcj/10-402.pdf)
- [Digital Omnibus on AI, Official Journal L 2026/1744](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202601744) (did not render for this check)

AWS:
- [Step Functions integration patterns and callbacks](https://docs.aws.amazon.com/step-functions/latest/dg/connect-to-resource.html)
- [Bedrock data protection](https://docs.aws.amazon.com/bedrock/latest/userguide/data-protection.html)
- [Bedrock pricing: Managed Knowledge Base storage](https://aws.amazon.com/bedrock/pricing/)

Secondary:
- [office365itpros on Graph transcript access](https://office365itpros.com/2026/09/21/teams-meeting-graph-api/) (Sep 2026)
- [thoughtstuff on the AI insights API](https://blog.thoughtstuff.co.uk/2025/12/weekly-update-22-december-2025-aicontextprovider-copilot-ai-insights-api-ga-vs2026-debugging/) (Dec 2025)
- [merill: OnlineMeetingAiInsight.Read.Chat](https://graphpermissions.merill.net/permission/OnlineMeetingAiInsight.Read.Chat.html) and [Calendars.ReadBasic](https://graphpermissions.merill.net/permission/Calendars.ReadBasic)
- [TrustedTech on Microsoft 365 E7 and Copilot pricing](https://www.trustedtechteam.com/blogs/microsoft-365/how-much-is-microsoft-365-e7-pricing-2026)
- [schneider.im on intelligent recap licensing](https://www.schneider.im/microsoft-teams-intelligent-recap-audio-recap/)
- [Baird Holm on the Otter ruling](https://www.bairdholm.com/blog/core-privacy-claims-against-ai-note-taking-platform-survive-dismissal/) (24 Aug 2026)
- [UC Today on Basich v. Microsoft](https://www.uctoday.com/unified-communications/microsoft-teams-lawsuit-bipa-voice-data/)
- [Mayer Brown on German employee representatives](https://www.mayerbrown.com/en/insights/publications/2026/10/internal-investigations-role-and-rights-of-employee-representatives) (5 Oct 2026)
- [Randstad on works council consent rights](https://www.randstad.nl/werkgevers/werkpocket/wet-en-regelgeving/medezeggenschap-ondernemingsraad/rechten-van-de-ondernemingsraad)
- [Lewis Silkin on the Digital Omnibus on AI entering into force](https://www.lewissilkin.com/insights/2026/07/27/the-digital-omnibus-on-ai-enters-into-force-today-102nedo) (27 Jul 2026)
- [Law360 on Microsoft's motion to dismiss](https://www.law360.co.uk/articles/2481987) (26 May 2026) and [on its motion to stay, compel arbitration or dismiss](https://www.law360.com/articles/2505609) (24 Jul 2026), paywalled
