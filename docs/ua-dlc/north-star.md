<!-- cspell:words Betriebsrat Manzey Parasuraman SKOS commentable -->

# HyperDelivery north star

**Where HyperDelivery goes from the Enterprise phase on, and what the Final MVP records now so the
door stays open without building ahead**

| | |
|---|---|
| Status | Proposal, 2026-10-27, revised the same day after a six-seat review. No north-star capability is in the Enterprise ready criteria or the Enterprise staffing: each is a candidate that enters a phase only by a decision at the pilot readout or at Enterprise ready, on the evidence in [section 10](#10-horizons-and-the-evidence-that-moves-us-between-them). What it adds to the Final MVP is the recording work in [section 8](#8-what-the-final-mvp-records-now), sized with the build team in week 1. It does not move MVP ready (week 14) or the pilot readout (week 22), and if the build runs long it is cut in the order the plan's cut list gives, before anything the plan never cuts |
| Owner | Eitan Flor, Enterprise Data Management |
| Builds on | [enterprise-plan.md](enterprise-plan.md) (the three phases and the exit ramp), [operating-model.md](operating-model.md) (the line, approvals, notifications), [platform-architecture.md](platform-architecture.md) (the per-project index, and the north-star design in section 11) |
| Research | Round 9: [autonomy-levels.md](research/autonomy-levels.md), [meeting-capture-automation.md](research/meeting-capture-automation.md), [proactive-sme-outreach.md](research/proactive-sme-outreach.md), [fsd-corpus-index.md](research/fsd-corpus-index.md), [context-moats.md](research/context-moats.md). Vendor facts were checked against primary sources as of 2026-10-27; legal points rest partly on secondary sources and are for Privacy and Legal to confirm |
| Concept screens | The **North Star** page of the concept canvas (`site/concepts/`): after a linked meeting, a question in Teams, approved precedent in the plan, and autonomy by step in Admin. Every name, project and number on them is invented |
| Context | An internal team note ("AIDLC alignment v2", October 2026) was read as context, not a source of truth. Its vision line, "AI does the work and humans make the decisions it surfaces", is adopted in section 3 |

## The one-page version

1. **What it is.** HyperDelivery is Under Armour's AI delivery platform. It runs UA-DLC, our
   framework for building with AI, from an idea to a working prototype grounded in UA's own data and
   decisions, and hands the work to engineering ready to build. UA-DLC is the playbook; HyperDelivery
   is the platform that runs it (section 1).
2. **The north star.** Every tool UA builds through HyperDelivery starts from what UA already knows,
   is shaped by the people who know the business without the requester having to chase them, and
   reaches a working version in days rather than months. AI does the work between the approvals;
   people make every decision.
3. **Shift one: who does the work.** UA-DLC moves from human-led to AI-assisted to AI-driven one
   step at a time, for one department at one risk level, and only on evidence. The three approvals,
   the Construction decision and every confirmation stay with named people at every level;
   AI-driven never means auto-approval (sections 3 and 4).
4. **Shift two: context comes to HyperDelivery.** Teams meetings that their organizer links to a
   project are read once they end, from the transcript, and each speaker confirms what they said;
   anyone can keep their words out. HyperDelivery asks the person who owns an answer, in Teams,
   saying it is an AI asking for the requester, instead of the requester chasing them (sections 5
   and 6).
5. **Shift three: an advantage that stays UA's.** Any tool pointed at UA's SharePoint, Confluence,
   Jira and Snowflake can read the same documents, so documents, approved FSDs included, are a head
   start. The lasting advantage is the record UA-DLC produces as the work runs: decisions with the
   options rejected, what people changed before they signed, who answered which question, how
   definition questions were settled, and what engineering did with each handoff. It is kept in open
   formats in UA's own systems, so it stays UA's whichever tool reads it; HyperDelivery's claim is
   narrower, being where that record is made (section 7).
6. **What the pilot gets, and what the Final MVP adds.** Pilot users point at a meeting's transcript
   and get back the statements to confirm instead of writing notes, and from about week 10
   HyperDelivery drafts each open question to the person who owns the answer for the requester to
   send with one click. Behind that, the Final MVP adds ten records and notices it cannot backfill
   later, about 40 hours of EDM analyst time plus 10 hours of owner review to label 20 approved FSDs,
   and two pilot practices (section 8). Approved specs in drafting, automatic meeting capture and
   automatic questions are not built before the Enterprise phase.
7. **What is honestly hard.** Loop and Facilitator notes have no automatic path yet. The Dutch works
   council's consent (and a German one's, if it applies) covers HyperDelivery itself, because it
   records who drafted, edited, reviewed and answered, so until it is given no EMEA employee is a
   pilot signer, reviewer or question recipient and no meeting with an EMEA attendee is read;
   Bengaluru staff need Privacy's view under India's DPDP Act before the pilot. The Copilot recap
   may need a Copilot license for every user of the app that reads it. And with 8 to 12 pilot users
   and about 10 accepted prototypes by the scale decision, few steps will have the evidence a
   promotion needs before about week 52 (section 12).
8. **What we ask of you now.** Endorse the rule that autonomy rises per step on evidence, never by
   date. Ask EDM leadership to name the owner of the approved-FSD rule by week 2 and release the
   analyst hours. Ask HR to commit, before the pilot, that how people work in HyperDelivery is not
   used in talent decisions. Decide by the pilot readout who owns UA-DLC beyond the pilot: EDM alone,
   or jointly with engineering (section 13).

**Plain words.** *A step's level*: how much of that step the AI does (human-led, AI-assisted,
AI-driven). *Workspace*: a department's space in HyperDelivery. *Approved spec*: one of UA's past
FSDs (functional specification documents) that an owner confirms was approved. *Certified
definition*: the official definition of a number in Snowflake, such as margin. *Data steward*: the
person who owns a data definition. *Copilot recap*: the AI summary Teams makes after a meeting.
*Linked meeting*: a meeting its organizer connected to a project before it started. *Construction
decision*: engineering's decision, after the handoff, on how to build the real version. *Sandbox,
dev data*: a safe test area with test data, not live data. *Scale decision*: the go or no-go on
expanding, about a year in.

---

## 1. What HyperDelivery is, and what UA-DLC is

If you are a business teammate, you need one name: **HyperDelivery**, the app you open. UA-DLC is
the playbook it follows.

- **UA-DLC** is the framework: UA's lifecycle for building with AI. It names the phases (Ideation,
  Inception, Construction, Operations), the steps, the three approvals, what each phase hands over,
  and who signs. It would exist on paper too. Its owner today is the plan owner in EDM; its
  Construction steps are engineering's, run with AWS's AI-DLC in engineering's own tools, and whether
  ownership becomes joint is decided by the pilot readout (section 13).
- **HyperDelivery** is the platform people open. It runs UA-DLC's Ideation and Inception phases, from
  an idea to a working prototype and a handoff package, and records the Construction decision, with
  its agents, its integrations into UA's systems, its record of decisions and what UA already knows.
  Engineering runs Construction in its own tools.

For technical readers, the nearest outside pair is AWS's: AI-DLC is the method, and it installs into
tools such as Kiro and Claude Code
([research](research/dlc-landscape.md#aws-ai-dlc-the-method-aidlc-workflows-and-kiro)).

### The summary to use

**Today** (the plan's subtitle; true until Construction is in HyperDelivery's scope):

> HyperDelivery is Under Armour's AI delivery platform. It runs UA-DLC, our framework for building
> with AI, from an idea to a working prototype grounded in UA's own data and decisions, and hands the
> work to engineering ready to build. AI does the work between the approvals; people make every
> decision.

**North star** (for the pitch):

> HyperDelivery is Under Armour's AI delivery platform. It runs UA-DLC, our own framework for
> building with AI, so teams can build what the business needs on UA's own systems and data in days
> rather than months, with people making every decision.

**One line:** UA-DLC is the playbook; HyperDelivery is the platform that runs it, from idea to
handoff.

The owner's phrasing was "the tool, powered by the UA-DLC framework, that lets us build internally
on all of our production systems at hyperspeed". The north-star line keeps the idea and holds one
claim back: until Construction is in scope, HyperDelivery *reads* UA's production systems (certified
definitions in Snowflake, Jira, Confluence, Microsoft 365) and *builds* on dev data, and production
versions are built in Construction. Say "production systems" only with that caveat.

### Which name to use

A test anyone can use: if you can open it, click it or get a message from it, it is HyperDelivery.
If it is a rule about the steps, the approvals or who signs, it is UA-DLC.

| Say | When you mean | Not |
|---|---|---|
| HyperDelivery | The app people open, its assistant, its messages, integrations, data and record | "HyperDelivery has three approvals" (UA-DLC has them; HyperDelivery routes and records them) |
| UA-DLC | The steps, phases, approvals, outputs and roles | "Open UA-DLC", "UA-DLC built it" |
| AI-DLC | AWS's method, and engineering's tooling built on it | "AIDLC" for UA's own lifecycle |
| Discover, Plan, Prototype, Handoff | What business teammates see on the line | Ideation and Inception in business-facing screens |

**For readers of the team note.** It uses "AIDLC" for the whole vision; in this plan that is UA-DLC.
It calls FSD, TSD and BRD legacy names that are not required; that fits, because the approved FSDs
are knowledge to learn from, not an output format (section 7.2). Its "agent-ready artifacts" are the
typed, commentable artifacts the Final MVP already produces, and its MCP server for tools such as
Factory or GitHub Copilot is how other tools would read HyperDelivery's record once a named team
needs it (section 7.3).

## 2. The north star

> Every tool UA builds through HyperDelivery starts from what UA already knows, is shaped by the
> people who know the business without the requester having to chase them, and reaches a working
> version in days rather than months. AI does the work between the approvals; people make every
> decision.

What a project looks like there, using the canvas's invented SKU productivity workbench:

1. Maya Chen, a merchandising business owner, starts a project in one sentence and links the "Line
   review prep" meeting she organizes. That lets HyperDelivery read that one meeting's transcript
   after it ends. The invite and the meeting itself tell attendees, and any of them can ask that
   their words not be used.
2. The meeting ends. HyperDelivery proposes seven statements from the transcript and sends each to
   the person who said it to confirm. One conflicts with the certified margin definition, so it goes
   to Luis Romero, the data steward who owns that definition, to check, instead of into the plan.
3. While drafting, HyperDelivery finds three approved specs from earlier Merchandising work, cites the
   sections it drew on, and turns what they had and this plan lacks into questions ("4 of 5 approved
   Merchandising specs say who gets access; this plan doesn't yet").
4. HyperDelivery asks Dana Ortiz one question in Teams, because she owns how Finance reports margin
   per door, says it is an AI asking for Maya, and two days later tells her that her answer changed
   the plan.
5. Maya signs "what we're building" and "the plan" reading what changed and the evidence, with every
   flagged item answered before she can sign. The prototype is built in the sandbox on dev data, and
   testers try it.
6. At the handoff, the package goes to the receiving engineering team in its own format. What that
   team keeps, changes or rejects comes back as a record, and the next merchandising project starts
   from all of it.

None of the six removes a decision. Every one of them removes chasing, copying and re-explaining.
Whether that chasing is a large enough share of today's delay to pay for shifts one and two is
something the pilot measures (section 8, row 13).

## 3. What never moves

The team note's vision line, AI does the work and humans make the decisions it surfaces, already
contains the rule. At every level, for every step:

- The three approvals ("what we're building", "the plan", "the working prototype"), each bound to an
  exact version, with no bulk approve; and the signer matrix, so a promotion never removes a signer
  ([who signs](operating-model.md#4-who-signs)).
- The Construction decision, a named person's record after approval 3.
- Decisions inside a project are saved only by a person. A statement is confirmed only by the person
  it is attributed to, checked by their Entra identity on the server.
- Every write outside the conversation names what authorizes it: an approval for repositories,
  builds and the handoff; the requester's signed outreach policy for a question HyperDelivery sends
  on its own; the organizer's link for confirmation cards after a meeting, sent only to attendees who
  have not opted out; the decision owner's own Publish for a copy of a decision in an allowlisted
  Confluence space. HyperDelivery writes nothing to a production system.
- Whatever HyperDelivery reads from people or documents (transcripts, Copilot recaps, Loop notes,
  answers in Teams, approved FSDs, pages and comments) is data, never instructions. Extraction from
  those sources runs without tools and returns only proposed, typed records; instruction-like text
  becomes a flagged item the signer must answer; and no recipient, message, write or tool call is
  ever chosen from that text.
- HyperDelivery never links a meeting by itself, never reads a meeting's audio or video, and never
  sends a message that does not say it comes from an AI acting for a named person.
- Measures built from individual actions (evidence opened, time on review, edit distance, answer
  rate and time, corrections) are shown only for groups of at least five people, never per person.

What moves is who does the work between those decisions, who starts it, how much people assemble by
hand, and what a signer reads: the whole document, or what changed, the evidence and the items
flagged for them, with the whole document one click away
([research](research/autonomy-levels.md#1-what-never-moves-and-what-does)).

## 4. From human-led to AI-driven

| | Human-led | AI-assisted | AI-driven |
|---|---|---|---|
| Who does the work | People; AI answers when asked | AI drafts each artifact; people edit and complete it | AI does the stage's work, including finding sources and asking the people who know, within an agreed policy |
| Who starts it | A person | A person, step by step | The AI, on a signal the policy allows (a linked meeting ended, a question is open); a person can always pause it |
| Who decides | People | People | People. The AI brings each decision as a card with options, a recommendation and evidence |
| What a signer reads | Their own work | The whole draft | What changed since the last signed version or the closest approved spec, the evidence, and every flagged item, which must be answered before signing |

"AI-driven" means what AWS means by it: AI starts and directs the work, defers the critical decisions
to people and acts only after they validate. It is not "AI-autonomous", which is out of scope for any
step that ends in a decision ([research](research/autonomy-levels.md#2-the-three-levels-defined)). In
the Construction decision the same words already mean the same thing applied to Construction.

**A level belongs to a step, not to the product.** A level is set for one **cell**: one step, in one
workspace, at one risk tier. The Final MVP is designed to run most of the prototype stage at
AI-driven (tickets, the build inside the signed plan, checks, evidence, the comparison with the
mockup, the handoff package), bounded by approvals 2 and 3 and the sandbox. Those cells start there
by design, not by evidence, so from the first pilot project they carry the same measures and demotion
triggers as any promoted cell. Discover and Plan are AI-assisted, and Try it is human by design. The
largest human share is in the cross-cutting work (meetings, questions to the people who know, finding
related past work), and the owner's north-star asks are the AI-driven versions of exactly those
([step-by-step table](research/autonomy-levels.md#3-each-step-at-each-level-and-where-the-final-mvp-sits)).
The plan page draws this by stage ([enterprise-plan.md](enterprise-plan.md#the-north-star-enterprise-and-beyond)).

**Earned, never scheduled.** A cell moves up only through four stages
([research](research/autonomy-levels.md#5-earned-autonomy)):

1. **Shadow.** The higher level runs beside the current one and records what it would have done.
2. **Evidence**, against bars proposed now and calibrated in the pilot: at least 20 runs at Low risk
   (40 at Medium) from at least 3 requesters and 5 approvers, over at least 6 weeks; at least 80%
   passing their approval with no send-back and no material edit; at most 5% of attributed
   statements later corrected by the person or steward, none on a certified definition; the step's
   evaluation cases at or above a 90% floor on the models and prompts in force; no severe escapes;
   and evidence opened on at least 90% of the cell's approvals.
3. **Decision.** "Propose promotion" opens a decision record that the workspace admin and the line
   owner both sign. No bulk promotion.
4. **Audit.** A sample of promoted runs gets an independent review for as long as the cell stays
   promoted.

Demotion is automatic and logged with its trigger: a severe escape; first-pass acceptance below 70%
over 10 runs; corrections above 10% over the last 20 attributed statements; an incident that names
the cell; an evaluation regression after a model, prompt, tool or engine change; or a change to the
workspace's data envelope or the governing policy. Promotion always needs people.

The order follows risk: record the cells that start AI-driven so the measures and demotion apply to
them; then low-risk steps at Low risk (finding related past work, source discovery, data discovery
limited to certified definitions, stories, the test plan); then the cross-cutting activities at Low
risk, opt-in; then content steps (the brief, requirements, tech design on the golden path). High risk
stays AI-assisted at least until the scale decision. With the pilot's volume, few cells will meet the
bars before about week 52, and steps that run once per project come later still. The Admin
**Autonomy** board on the canvas shows the grid, the evidence against each bar and the decision
record behind every cell.

**The risk is the reviewer.** As steps automate, the failure that matters is a signer who stops
reading. Complacency and automation bias affect experts as well as novices; practice does not
overcome the first, and training or instructions do not prevent the second (Parasuraman and Manzey,
2010). So before any content step is promoted: approvals lead with what changed and the evidence,
every flagged item needs an answer before Sign is enabled, sampled audits run with rotating
reviewers, and the record shows what the AI did and what a person did, section by section. Seeded
challenge items (a known defect shown only in the review view, never in what is signed) are piloted
only after HR, Privacy and EMEA works councils agree; signers are told in advance, and a reviewer's
own result is shown only to them at the time and never stored with their identity
([research](research/autonomy-levels.md#6-failure-modes-and-mitigations)).

## 5. Meetings, captured once they end

The owner's idea was to notice when a meeting's recording lands in the organizer's OneDrive and pull
it, with the Copilot or Loop notes. The research found a better signal and a firmer line
([research](research/meeting-capture-automation.md#0-bottom-line); the mechanics are in
[platform-architecture.md](platform-architecture.md#the-north-star-linked-meetings-questions-to-experts-and-approved-precedent)):

- **Wait for the transcript, not the recording.** Teams says, usually within seconds, when a
  meeting's transcript is ready. Watching the OneDrive Recordings folder would mean reading the
  organizer's whole drive, with notifications that can lag by hours, to get a video HyperDelivery
  should never read. Recordings are read by their transcript, never their audio or video, and
  transcribing a recording ourselves to get around a disabled transcript setting is out of bounds.
- **The organizer decides; every attendee is told; anyone can keep their words out.** A meeting is
  read only if its organizer or a presenter linked it to a project before it started. Linking
  installs the HyperDelivery Teams app in that one meeting: it is the organizer's authorization for
  the app (Microsoft's resource-specific consent), not the attendees' consent. Attendees are told in
  the invite and when the meeting starts, and any attendee can say "don't use my statements" for that
  meeting or every meeting, before or after it; their words are dropped before anything is extracted.
  When a requester picks a meeting they do not organize, HyperDelivery asks the organizer to link it.
  The legal basis is Privacy's to set (in the EU, most likely legitimate interest, not consent).
- **Each speaker confirms their own words.** After the meeting, each person gets one card with what
  they said (Agree, Correct, Not Me, Don't Use), and only the attributed speaker can confirm, checked
  by Entra identity. Speech from a meeting-room device, a dial-in or a guest is unattributed: it goes
  to the organizer marked "speaker unknown", is never attributed to a named person, and cannot settle
  a definition. Silence never confirms. Until a statement is confirmed it is visible only in the
  confirmation flow and is not retrievable by HyperDelivery's agents, for linked and pointed meetings
  alike. A definition that conflicts goes to its steward.
- **The Copilot recap is optional.** It is readable on Graph v1.0 (Microsoft's resource page still
  shows a beta banner), not for channel meetings, and only with a Microsoft 365 Copilot license;
  Microsoft's pages say every user of an app that calls it needs one, which is a question for
  Microsoft (section 9). It has no per-meeting permission, so reading it automatically needs a
  tenant-wide permission limited by policy or the organizer's stored sign-in. Until InfoSec accepts
  one of those and Microsoft answers, the recap is read only when the organizer points at it, and
  the design runs on transcripts alone.
- **Loop and Facilitator notes have no automatic path yet.** There is no "ready" event and no
  documented link from a meeting to its notes, and any attendee can edit them. HyperDelivery reads
  them when someone points at them, as a dated snapshot and weaker evidence than the transcript.
  Microsoft is moving the notes to the organizer's OneDrive (roadmap item RM576194, November 2026);
  whether that allows a lookup is a question for Microsoft.

| Level | What happens | Earliest, if decided |
|---|---|---|
| AI-assisted, pointed | Someone points at a meeting, its recap or its notes, or drops the transcript file; HyperDelivery reads it once and proposes statements | Final MVP (already planned), within the interim Privacy scope |
| AI-assisted, suggested | HyperDelivery sees a likely project meeting on the owner's calendar (opt-in; titles and attendees only) and asks "Add this meeting?" before it starts | Enterprise hardening |
| AI-driven | Linked meetings and series are read automatically when their transcript is ready; each speaker confirms | Enterprise rollout, for meetings whose attendees are all US-based; others after Privacy (and, for EMEA, the works council) clears their location |

Governance is the long pole, not the code. The tenant setting that lets apps read transcripts is
tenant-wide, so least privilege comes from the per-meeting authorization (the recap is the exception
above). Automatic capture needs a privacy assessment; notice in the invite and at the start; Teams'
participant-agreement policy (`ExplicitRecordingConsent`) for organizers who link meetings, so each
attendee agrees before transcription captures them, with Legal confirming it for Maryland and other
all-party-consent states where attendees sit; deletion and "don't use" that reach every copy; and no
per-person metrics. India's DPDP Act, whose main duties take effect around May 2027 [confirm], needs
Privacy's view before the pilot. Never read: meetings with external attendees, HR or legal meetings,
anything above the project's tier, and, until Privacy clears their location (and the works council
agrees for EMEA), any meeting with an attendee based outside the US
([governance](research/meeting-capture-automation.md#3-consent-and-governance-for-automatic-capture)).

## 6. Questions to the people who know

Business logic and definitions live in people. Today the requester chases them; the north star has
HyperDelivery ask the person who owns the answer, in Teams, without becoming noise
([research](research/proactive-sme-outreach.md#0-bottom-line)).

- **Who sends.** The HyperDelivery bot, the org-published Teams app, registered in Entra Agent ID with
  the platform owner as its sponsor. Every message says "HyperDelivery, an AI assistant, asking for
  Maya Chen", links to the item in HyperDelivery behind single sign-on so the recipient can check it
  is real, and never asks for credentials, access or data extracts. Nothing is sent under a person's
  name.
- **Who gets asked.** Ownership of record: the data steward or owner of the object or term, the owner
  of the golden report, the approver of a related approved spec, the owner of the Confluence page,
  still in that role in Entra. A person can name someone else for a topic ("not me, ask Luis"), and
  HyperDelivery honors that as their own preference. Past answers are used to answer from the record
  instead of asking again, never to choose or rank people: HyperDelivery keeps no score of how often,
  how fast or how well anyone answers, and people can see and correct what it holds about them.
  Below a confidence bar it asks the requester who to ask; it never guesses, and it never messages a
  senior leader directly (an HR-maintained group, checked at send time).
- **What a card holds.** At most three questions, ordered by what blocks the next approval;
  "Question 1 of 2"; why you; what HyperDelivery already checked; a real deadline tied to the plan;
  what happens to the answer; "Not me, suggest who" and "I don't know" as real answers; and in the
  footer, Pause Questions and Why Am I Getting This? A card shows only what its recipient may read;
  People and Finance projects reach non-members only through the requester.
- **A short conversation, not just a card.** A card can open a 1:1 exchange in which HyperDelivery
  asks at most two clarifying questions, sees only that question and the evidence the requester marked
  shareable, and then shows the person a receipt of what it recorded in their name, which they can
  correct. Free text becomes a proposed statement, never a settled fact.
- **One reminder, then back to the requester.** After one reminder the requester chooses: nudge the
  person, ask someone else, or decide and record an assumption. Never a third message, never to
  anyone's manager. When an answer changes the plan, the person who gave it is told.

The ladder: **human-led** today. **AI-assisted** in the Final MVP: HyperDelivery drafts the questions
and proposes the people with its evidence, and the requester sends with one click from the Teams app,
from about week 10; questions to colleagues outside the US go from the requester directly until
Privacy (and, for EMEA, the works council) clears them. **AI-driven** is a candidate for Enterprise
rollout, after a gate measured over at least eight pilot weeks: at least 70% of questions answered
within two business days, re-routes under 20% where HyperDelivery was confident, pauses and opt-outs
under 2% of distinct recipients, requesters editing under 20% of drafted questions, no senior leader
reached, no complaint upheld by Internal Communications or HR, and Privacy and Legal signed off with
works council consent where required. HyperDelivery then sends on its own inside an outreach policy
the requester signs once per project, naming the roles or people it may ask, only to people who opted
in (recommended; decision 3), with a live log the requester can withdraw from. When the person who
owns the answer has not opted in, HyperDelivery drafts for the requester to send, as in the Final MVP,
and the first card a person gets ends with "Let HyperDelivery ask me directly next time". Replacing a
per-send approval with a signed policy is logged in the [decision log](../decisions.md).

**What HR is asked to commit to, before the pilot.** How people work in HyperDelivery (their edits,
review activity, response times, and which questions they answered or declined) is not used in
performance ratings, pay, promotion or other talent decisions. Signed approvals and decisions remain
accountable records, like any sign-off at UA, and all records stay subject to legal holds and to
investigations required by law or policy. The EU AI Act lists as high-risk any AI that allocates
tasks based on individual behavior or monitors performance (Annex III point 4(b)); routing on
ownership and stated referrals is meant to stay outside it, and Legal confirms that before Enterprise.

**One attention budget per person.** From the Final MVP, HyperDelivery enforces one card per project
per day and at most three questions per card, and counts every card that asks something of a person
(questions, confirmations, invitations to try a prototype) per person per week across projects. From
the Enterprise phase the count becomes a budget: at most 5 cards a week (proposed, calibrated on the
pilot's counts), with an agreed allowance for data stewards. Approvals and the Construction decision
are outside it. Over budget, HyperDelivery queues, batches or tells the requester; it never sends
anyway. Before asking anyone, it checks this project's record and the facts a steward has published to
the Library; an answer from another project is never shown to someone who cannot open that project.
One opt-out covers both questions and confirmation cards.

## 7. What UA keeps, and why HyperDelivery is where it is made

Other tools UA already uses (Microsoft 365 Copilot with Work IQ, Rovo with its Teamwork Graph,
Snowflake CoWork, engineering's coding agents) can read the same SharePoint, Confluence, Jira and
Snowflake. Anything that already sits there, the approved FSDs included, is a head start any of them
can index ([research](research/context-moats.md#0-bottom-line)).

### 7.1 Three kinds of advantage

| | UA's existing record | What running UA-DLC records | Where the work happens |
|---|---|---|---|
| Examples | Approved FSDs and their templates, golden reports and semantic views, Jira and Confluence history | Decisions with the options rejected, approval edits, answers on record, definition questions and how they were settled, handoff and delivered-tool outcomes | Where approvals are signed, the handoff format engineering's pipeline reads |
| Exists before HyperDelivery | Yes | No | No |
| Gets better with each project | Barely | Yes | While held |
| Another tool can get it | Yes, by indexing it | Only by running the process, and only for the decisions that run through it | Only if UA moves the work |
| What it is for | A cold start, and a yardstick | The lasting advantage | What produces the record |

The record of how UA decides is the strongest of the three because it is captured at the moment of
decision. Indexing transcripts, chats and page history later can recover some of the discussion, but
not which option a named person confirmed, against which signed version, and why the others lost. The
usual objection, that data advantages flatten out and models get cheaper every year, holds less for
small, human-confirmed records used for retrieval, evaluation, routing and guardrails, though its
staleness half still applies (7.2). HyperDelivery prefers those uses over fine-tuning, because they
carry over when the model changes. The corpus carries quality while there are few projects; the
records should overtake it once a domain has enough signed projects for precedent to recur, and 7.4
says how we will know.

Two cautions shape the record. First, the AI drafts most decision cards, so only reasoning a person
wrote or changed, or a choice against the recommendation, counts as precedent at full weight; AI
reasoning accepted unchanged is kept but marked. Second, decisions get made around the record (in
chat, email or another tool), so HyperDelivery proposes decision cards from what it reads and measures
how much of a project's decisions the record holds.

The ranked list, in brief (the full list of 37, with mechanisms and measures, is in
[research](research/context-moats.md#4-the-top-twelve-ranked)):

| Rank | Asset | First exists |
|---|---|---|
| 1 | Decision records with the options rejected and why, marked by who wrote them | Final MVP |
| 2 | Business terms mapped to certified definitions, and the definition questions with how they were settled | Final MVP |
| 3 | Approval edits: what people changed before they signed | Final MVP |
| 4 | Handoff outcomes and what engineering changed | Pilot readout |
| 5 | Answers on record, so nobody is asked the same thing twice | Final MVP |
| 6 | The approved FSD corpus and its templates | Today |
| 7 | Golden paths, with review outcomes encoded as checks | Final MVP (one), Enterprise |
| 8 | Known data caveats and incident memory | Final MVP |
| Added | The trail behind approved FSDs: draft versions, reviewer comments, sent-back drafts and the original demand text | Today, where version history survives |
| Added | Delivered-tool outcomes: used, kept, changed or retired, and whether it did what the business owner needed, joined to the decisions behind it | The success measure from the Final MVP; the outcome beyond Enterprise |
| Added | Business teams' Excel workbooks, with their formulas mapped to certified definitions | Final MVP, when pointed at |
| Added | Which certified objects and reports people actually query (Snowflake access history, BI usage) | Enterprise |

Settled mappings in rank 2 go through the steward into the semantic view's synonyms and verified
queries [confirm with data platform], so CoWork answers with them too; only the open questions and
their history are HyperDelivery's own.

### 7.2 The approved FSD corpus

The owner's first idea is the right first move and is already seeded in the code: Distill detects two
UA FSD template families by their headings (`src/tools/distill.py`), and an embedding index ranks the
reference FSDs from one vector per file, built from the first 20,000 characters, with no approval
status, version, date or outcome ([what exists](research/fsd-corpus-index.md#1-what-exists-today)).

**The documents are a head start; the labels and links are what UA adds**, and they stay UA's
whichever tool reads them:

- **An approval label per document**, from a rule a named owner signs: Tier A (approved, with
  evidence), Tier B (inferred, confirmed by the owner for a class of documents), Tier C (draft,
  rejected or unknown). Only Tier A becomes precedent; where the owner agrees, sent-back and rejected
  drafts with their reviewer comments become labeled negatives for gap questions and evaluation.
- **Typed records in the plan's own shape**, each with a verbatim quote: measures and dimensions,
  business rules, data sources, security access, success criteria, roles, level of effort.
- **Links** to the Snowflake objects and golden reports it used (still present, renamed or dropped),
  to the Jira epics and repositories built from it, and to how that turned out.
- **Intake-to-approved pairs**: the original request beside the FSD eventually approved.

**Uses, in order of value:** the evaluation set, which grades HyperDelivery, and any tool UA
considers, against UA's own approved work and survives every model change; drafting grounded in
approved specs with section citations; gap questions that are advisory, never preconditions; a
prior-work check at intake; definitions harvested into the Library, which only a steward makes
canonical; effort ranges checked against Jira actuals; and an FSD-format rendering of a signed plan
for a team that still wants one (one exists on the unmerged `sme-dev-rebuild` branch). Precedent shows
how UA did it before, never what this project needs, so it produces drafts, citations and questions,
and people answer the questions. At the pilot readout, plans for the evaluation intakes are drafted
with and without the 20 labeled FSDs and rated blind; the Enterprise ingestion waits on a difference.

**Access.** The corpus owner decides which approved FSDs a workspace's whole membership may read;
FSDs above the workspace's label or on restricted topics stay out, records derived from an FSD
inherit its label, and retrieval filters (tier, not superseded, the reader's permitted labels) are
set in `tools/` code, never by the model.

**What decays it:** renamed tables, changed definitions, reversed decisions reused as current,
approved builds that failed, people who left. Countermeasures: as-of dates, validity checks against
Snowflake, supersession links, outcome weighting. **Cost** is people, not compute: for an assumed
2,000 FSDs (the inventory replaces this number), a few hundred to about $1,300 of compute once and $10
to $50 a month, and about 100 hours of spot-checks in Enterprise on top of the Final MVP's labeling
([cost](research/fsd-corpus-index.md#54-rough-cost-for-2000-fsds)).

### 7.3 UA owns the schema; HyperDelivery writes first; any sanctioned tool reads

The advantage must belong to UA, not to HyperDelivery, or the plan's exit ramp is empty. So the record
schemas are part of UA-DLC, not of HyperDelivery: HyperDelivery is their first writer, canonical
copies live in UA's systems where other tools already read them, and a tool that replaces
HyperDelivery has to write the same records.

- **Published schemas and open formats** for every record: JSON Lines per record type, decisions also
  as Markdown decision records, golden paths as Agent Skills and `AGENTS.md`. Indexes and knowledge
  bases are rebuildable caches, never the asset.
- **Canonical copies in UA's systems of record:** decisions copied to a Confluence decision log when
  their owner publishes them, settled definitions in Snowflake through a steward, requirements in Jira
  and engineering's context files. HyperDelivery holds no catalog write access and never becomes a
  second semantic layer.
- **A read-only context server over MCP** serves only what has no canonical home elsewhere (approval
  edits, answers on record, handoff outcomes, redirected requests), as quoted data with its source,
  label and confirmation status, never as instructions. Each consumer, including a service identity,
  is scoped to the projects handed to it. It is built only when a named team needs it (engineering's
  Jira-to-PR pipeline is the likeliest first), not before.
- **Erasure, "don't use" and corrections reach every copy** HyperDelivery wrote, including the
  canonical copies in Confluence, Snowflake and Jira.
- **The exit test** at the scale decision exports the records, with people replaced by role unless
  Privacy approves otherwise, loads them into a second tool, reruns sample intakes, and checks that
  the second tool can write new records in the same schemas, not only read the old ones.

### 7.4 How we will know it is real

Volume will not prove it: the scale decision needs only 10 accepted prototypes across 2 departments.
One test will, run at the pilot readout as a dry run and at the scale decision for real, on at least
20 held-out intakes (the evaluation pairs plus completed projects, each held out with its drafts,
later versions and linked pages): **(A)** a sanctioned generic tool, as UA then licenses it, with its
own memory and the same documents; **(B)** the same tool plus HyperDelivery's exported records;
**(C)** HyperDelivery. Business experts who did not sign the originals rate the results blind. How to
read it, agreed now: if C is no better than A, the records add nothing yet, so keep recording, which
is cheap, and fund nothing cross-project on this claim. If B matches C and both beat A, the advantage
is the records and it is UA's; HyperDelivery stays on workflow and cost grounds, and the exit ramp is
real. If C beats B, part of the advantage is locked inside HyperDelivery: find it and publish it.
"Better" means experts prefer it on at least [60]% of pairs (set at the pilot readout). Removing one
asset at a time shows which record carries the difference. Alongside: edit distance at approval and
first-pass acceptance over time, decision coverage, questions answered from the record instead of
asked, and handoffs taken into Construction without a rewrite
([measures](research/context-moats.md#7-measures-that-would-show-each-advantage-is-real)).

## 8. What the Final MVP records now

**What a pilot user gets, and what it asks.** In the pilot you can point HyperDelivery at a meeting's
transcript or Copilot recap and get back the statements it heard to confirm, instead of writing up
notes. From about week 10, HyperDelivery drafts each open question to the person who owns the answer,
says why them, and you send it from Teams with one click. Approved specs in drafting come in the
Enterprise phase. What it asks of you: a one-click reason when you send something back, confirming
your own statements when a meeting you spoke in is used, and reading the notice in row 10. A
correction you make is kept, so the next project starts from it.

The five research reports proposed about 45 "prepare now" items, several overlapping. Deduplicated
and reviewed, the Final MVP adds the thirteen below: ten records and notices that cannot be backfilled
(rows 1 to 10), the FSD groundwork, which is cheaper now than later (row 11), and two pilot practices
(rows 12 and 13). Recording starts with the friendly users in week 8. If works council consent, the
pilot notice or the privacy assessment is not in place by week 15, rows 1, 2, 4, 8 and 13 are kept
without person identifiers (role and function only) until it is.

| # | Record or practice | Where | Owner | By |
|---|---|---|---|---|
| 1 | The AI's submitted draft and the signed version are both kept and hashed, never overwritten; section authorship (AI, person, AI then person) is derived by comparing them at signing, with the model, prompt and skill versions | Artifact store, `core/domain/` | Build team | Week 8 |
| 2 | A reason code on Send Back, on overriding a reviewer and on choosing against a recommendation, from one fixed list (missing context, wrong or uncertified definition, wrong scope, missing stakeholder, factual error, writing quality, changed business need, other); the gate `Decision` (`src/core/domain/project.py:106`) gains only this code | Approval and decision cards | Build team | Week 8 |
| 3 | Decision records, a new type for the Decisions tab beside the gate `Decision`: the options considered, who wrote each option and reason (AI, person, AI then person), whether the decider chose against the recommendation and, if so, why in their own words, precedent cited, any exception accepted and by whom, what it supersedes, its scope and a review-by date | A new module in `core/domain/`; a key prefix in `infrastructure/repositories/keys.py` | Build team | Week 8 |
| 4 | An ask record per question, a new type keyed to the `OpenQuestion` id and written only by the API from people's actions (`OpenQuestion` stays the model's question schema and gains no answer, recipient or outcome fields): who asked, of whom, why them, deadline, the answer, "not me, ask X" and "I don't know" as referrals, and a per-person preference record (paused until, full opt-out) that every card's footer writes to. "Changed the plan" is derived when a requirement or decision cites the ask. A human-led ask records the answer as the requester's account ("Maya reports Finance said...") until that person confirms it | `core/domain/`; `infrastructure/repositories/keys.py` (and `infra/stacks/orchestration_stack.py` if an index is needed, changed together) | Build team | Week 10 |
| 5 | Source references carry meeting anchors where they have them (meeting, transcript and cue ids, speaker or "unattributed", expiry) and provenance (AI-drafted or person-written, classification, scope, last confirmed, review-by) | `EvidenceLink` in `src/core/domain/spec.py`, plus the `SourceRef` proposed in platform-architecture.md section 11 | Build team | Week 8 |
| 6 | Corrections and rulings as events: a person correcting their attributed statement, a steward ruling on a definition, and any later finding linked to the step and approval that let it through, with a severity | Project events | Build team, stewards | Week 10 |
| 7 | Outcomes: at approval 1, the success measure the business owner will check and where its data lives; at the handoff, taken without a rewrite or sent back, and why; at intake, where each redirected request went and why a project closed early | Brief, handoff and intake | Build team, receiving engineering leads | Week 14 |
| 8 | Every run event stamped with its cell: step, workspace, risk tier, path, depth, level and the versions in force | Telemetry | Build team | Week 8 |
| 9 | A retention class and delete-by date on every record type, from Legal's schedule: transcripts and their cues at the earlier of source expiry and project end; a confirmed statement keeps the statement, who confirmed it and the date and drops the quote when its source goes; ask records and review interactions lose names after [12 months]; a legal hold suspends deletion | Every record type | Legal, Records Management, build team | Week 15 |
| 10 | A notice to everyone HyperDelivery records: pilot users at onboarding, and anyone else on the first card, question, confirmation or ruling request they receive, with a link to a "what HyperDelivery records" page. In plain words: "HyperDelivery keeps a record of the work so the next project can start from it: what you approved or sent back and why, what you changed in AI drafts, the questions you answered, and whether the evidence was opened before an approval was signed. Your name stays on what you said and decided so others can cite it. Signed approvals are accountable records, as any sign-off is. None of it is used in performance ratings, pay or promotion, and counts are reported only for groups of at least five people. Ask [owner] to see or correct anything attributed to you." Raw per-approval interaction data is readable only by the platform team and aggregated after [90 days] | Console, Teams app | Owner, HR, Privacy, Internal Communications | Week 15 |
| 11 | The FSD groundwork, as data, not infrastructure: an inventory of where approved FSDs live, with their version history, reviewer comments and the demand each answered (weeks 1 to 4); the approval rule signed by its owner (week 4); 20 hand-labeled Tier A FSDs (candidates from week 3, labeled weeks 4 to 8), with names in roles tables redacted until the Privacy review; a version-0 schema and template crosswalk; 10 to 20 intake-to-approved evaluation pairs (weeks 8 to 12); a metadata sidecar per reference FSD. About 40 analyst hours and 10 owner-review hours for the labeling, plus [N] hours for the inventory and the pairs, sized in week 1 | Restricted S3 prefix, not Git | EDM analysts, the rule's owner | Week 12 |
| 12 | A pilot working agreement: project working sessions are scheduled, non-channel Teams meetings with transcription on where the interim Privacy scope allows, under Teams' participant-agreement policy set with Privacy and Legal (channel meetings support none of the meeting features) | Pilot guide | Owner | Week 8 |
| 13 | Pilot measures that decide what comes next: projects with a relevant meeting; transcripts pointed per project; reads blocked by the tenant setting; confirmation rates of meeting statements; answer rate and time; re-routes; pauses and opt-outs; time each project spends waiting on an answer or a meeting's content, as a share of cycle time; decision coverage at approval 2 and the handoff; the share of decisions where a person added or changed an option or chose against the recommendation; edit distance by step across at least five signers; and plans for the evaluation intakes with and without the labeled FSDs | Pilot readout | Owner | Week 22 |

Cut on purpose, because nothing in the pilot uses them: a reserved field for seeded challenge items,
an "AI-driven" send mode, per-topic opt-outs, a slot for a 90-day change summary (added when the
first one is due), and any routing score learned from how people answered, which would rank staff on
their behavior and is not planned.

**Not built before the Enterprise phase:** meeting webhooks and the ingest pipeline, calendar
suggestions, automatic sending, the cross-project Library, a knowledge base for the FSD corpus, the
context server, the shadow runner, the Autonomy page, seeded challenge items and any fine-tuning.

## 9. Long-lead requests

The Final MVP's requests are on the plan's [long-lead track](enterprise-plan.md#the-long-lead-track),
which is the one list for them: the named FSD owner (needed by week 2) and read access (week 3), the
analyst hours, the steward roster, the senior-leader group, the pilot app setup policy, the transcript
tenant settings, the participant-agreement policy for pilot organizers, works council consultation,
the HR commitment, Privacy's DPDP view, the retention schedule, the pilot notice and the handoff
outcome agreement. The requests below are for the Enterprise phase and are filed when Enterprise
design starts.

| Request | Owning team | Why | Needed by |
|---|---|---|---|
| A Privacy review and DPIA of indexing names and roles from FSDs, and the personal data inside them | Privacy and Legal; HR; EMEA works council | Before role records and any map of whom to ask | Week 23 |
| Extend the threat model to Teams answers, Copilot recaps, Loop notes, the FSD corpus and context-server consumers | Security architect | New channels carry untrusted text to models | Week 26 |
| Leadership endorsement: autonomy rises per step on evidence, never by date, and High risk waits for the scale decision; a named line owner and workspace admins | Director of AI and Analytics; sponsor | Every promotion needs the rule and two named signers | Week 23 |
| Chat and meeting resource-specific consent enabled, and approval of the app version that requests meeting permissions | Microsoft 365 admins; InfoSec | Linking a meeting is installing the app with that consent | Week 30 |
| Admin consent for the app to be installed in a meeting from the console, and a decision on how the recap is read (a policy-limited application permission or a stored organizer sign-in) | Entra admins; InfoSec | Linking from the console; the recap | Week 30 |
| An app setup policy for every workspace that will use questions or linked meetings | Microsoft 365 admins | Proactive messages need the app installed for each person | Week 30 |
| A public HTTPS endpoint on AWS for Graph notifications, with the Graph IP allowlist | Cloud platform; InfoSec | The endpoint must acknowledge each notification within three seconds, or Graph throttles it and may drop notifications | Week 30 |
| Register the bot in Entra Agent ID with the platform owner as sponsor | Entra admins; security architect | Agent inventory in UA's tenant; recipients can check it is real | Week 30 |
| Copilot license inventory for likely meeting organizers | Microsoft 365 licensing | The recap needs a license | Week 30 |
| Questions to Microsoft through the account team: when the app-installed transcript scope reaches v1.0; how to find a meeting's Loop notes; whether the transcript setting also blocks the recap; whether every user of an app that reads the recap needs a Copilot license | Microsoft 365 admins, through the account team | Several choices rest on beta or undocumented behavior | Week 30 |
| The HR commitment extended to Enterprise, and works council consent for the Enterprise features | HR; EMEA HR and employee relations; Legal | Capture and automatic questions add new records | Week 36 |

## 10. Horizons, and the evidence that moves us between them

No column after the Final MVP is a commitment. Each north-star capability is a candidate that enters a
phase only by a decision at the pilot readout or at Enterprise ready, on the evidence in the last row;
none is in the Enterprise ready criteria or the Enterprise staffing.

| | Final MVP (weeks 1 to 22) | Earliest, if decided: Enterprise hardening (weeks 23 to 36) | Earliest, if decided: Enterprise rollout (week 37 on) | Beyond the scale decision (about week 52) |
|---|---|---|---|---|
| **Work** | Prototype stage AI-driven by design inside the signed plan; Discover and Plan AI-assisted | Approvals lead with changes and evidence; every cell recorded with its evidence | Promotions only where a cell meets the bars; few expected before the scale decision | Content steps at Medium risk where earned; whether to add a Construction lane |
| **Meetings** | Pointed meetings and transcript files, within the interim scope | "Add this meeting?" for opted-in owners | Linked meetings read automatically when all attendees are US-based | Other locations after Privacy and works councils clear them; live features only when Microsoft ships them |
| **Questions** | HyperDelivery drafts and proposes people; the requester sends; US recipients only | Ownership routing from stewards and owners; definition questions to stewards | Sending inside a signed policy, to opted-in people, after the gate | Re-confirmation of Library facts by their named owners |
| **What UA knows** | Records written in their final shape; 20 labeled FSDs; evaluation seed | Approved specs in drafting, if the with-and-without test showed a difference; the Library across projects | A read-only context server, for a named consumer | Outcome-weighted precedent; usage of delivered tools |
| **Evidence to move on** | The readout measures (row 13): automatic capture and questions go forward only if waiting on people is a material share of pilot cycle time [threshold set at the readout]; the dry run of the three-arm test | Privacy and Legal sign-off; works council consent where needed; the HR commitment extended | Promotion bars met per cell; the questions gate | The three-arm test (7.4), read as agreed; the exit test holds |

## 11. What it costs

Most of the cost is people:

- **Final MVP:** the records in section 8 are sized with the build team in week 1; about 40 analyst
  hours and 10 owner-review hours for the FSD labeling, plus the inventory and evaluation pairs.
- **The FSD corpus in Enterprise:** compute from a few hundred dollars to about $1,300 once and $10 to
  $50 a month, for an assumed 2,000 documents; about 100 hours of spot-checks.
- **Meeting capture:** small AWS running costs (not priced by the research [confirm]). Copilot
  licenses are needed at least by organizers who want the recap; if Microsoft confirms that every
  user of the reading app needs one, the recap stays off rather than licenses being bought for
  HyperDelivery.
- **Stewards and owners:** about 2 hours a week per steward, already budgeted in the operating model,
  plus re-confirming Library facts beyond Enterprise.

## 12. Risks

| Risk | Mitigation |
|---|---|
| Signers stop reading as steps automate | Approvals lead with changes and evidence; flagged items block signing; sampled audits; "evidence opened" is a promotion bar |
| A wrong confirmed fact is reused across many projects | Review-by dates, supersession links, a challenge action on every record, tracking where a record was cited, only stewards publish to the Library |
| It is, or feels like, monitoring staff | No per-person metrics and groups of at least five; the HR commitment before the pilot; organizer links with notice and "don't use my statements"; works council consent before any EMEA employee is recorded |
| Instructions hidden in a transcript, answer or document steer an agent | Read sources are data, never instructions; extraction runs without tools; instruction-like text becomes a flagged item; the threat model covers the new channels |
| Decisions are made around the record (chat, email, another tool), so precedent looks complete but is partial | Decision cards proposed from what HyperDelivery reads; coverage measured at approval 2 and the handoff; precedent shown with its project's coverage |
| Vendor churn (beta subscription scopes, preview notifications, roadmap slips) | Only generally available features for anything people rely on; fall back to pointing |
| Evidence accumulates slowly with 8 to 12 pilot users | Promotions wait; audits continue after promotion; the claim rests on the three-arm test, not volume |
| The wrong person is asked, or a senior leader is reached | Ownership of record and stated referrals; requester confirmation below the confidence bar; the HR-maintained block checked at send time |
| "AI-driven" is heard as "no humans" | Always paired with "people make every decision"; section 3 written into the operating model |
| Recording-consent law (all-party-consent Maryland and other states) | Teams' participant-agreement policy for organizers who link meetings or hold pilot sessions; HyperDelivery's own notice; "don't use my statements" at no cost to the attendee; text only and no model training, which address the biometric and vendor-use claims, not consent; Legal confirms by state |
| UA moves the work to another tool | Open schemas owned by UA-DLC; the exit test checks that a replacement can write them |

## 13. Decisions

**For the sponsor**

1. **Endorse the autonomy rule:** levels rise per step on evidence, never by date, and High risk
   waits for the scale decision.
2. **Who owns UA-DLC beyond the pilot:** EDM alone, or jointly with engineering, decided by the pilot
   readout.

**For the owner**

3. **Opt-in or opt-out for AI-driven questions and for meeting confirmation cards.** Recommended:
   opt-in for the first AI-driven cells, with Pause and opt-out on every card on top. The
   researchers disagreed, and no outside source settles it.
4. **Replace a per-send approval with a per-project outreach policy the requester signs**, once the
   gate in section 6 is met. Recommended: yes, as a logged decision.
5. **Capturing a meeting before a project exists** (a workspace-level intake series). Recommended:
   not now; every link names a project, so the notice can too.
6. **When the FSD-derived map of whom to ask starts.** Recommended: Enterprise rollout, after the
   week-23 Privacy review and once Tier A records exist; the research placed it beyond Enterprise.
7. **Adopt the summary in section 1** for the plan, the site and how the team talks about it.

## 14. Open questions to verify internally

- Where do approved FSDs live, how many are there by year and template, who can say which were
  approved in each era, and how many have a recoverable original intake and version history? That
  last number caps the evaluation set.
- What are UA's transcript, attribution, participant-agreement and Copilot meeting policies, and are
  Loop meeting notes and Facilitator turned on?
- Do UA's meeting rooms attribute speech to each person, or to the room's account?
- Does UA run a data catalog of record, and does it use semantic-view synonyms and verified queries?
- Which EMEA entities have works councils, and what does Privacy conclude for India?
- Will engineering report handoff outcomes for every handoff, or team by team?
- Does a confirmed statement survive deletion of the transcript it came from, and in what form?
- Will InfoSec accept inbound Graph notifications to AWS, or require an Azure landing point?
