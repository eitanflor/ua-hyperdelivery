<!-- Point-in-time research, retrieved 2026-10-27 for the UA-DLC north star (round 9). Claims carry source links; vendor features and dates change quickly, so verify before acting. See README.md in this folder. -->
<!-- cspell:words Alation Atlan BetrVG CONFCLOUD Cann Collibra DPDP DPIA Futurum Houthoff Moveworks Praxikon Scytale Slackbot Slackbot's TOCHI Xiao artificialintelligenceact chatbots inferencing ondernemingsraden -->

# Proactive SME outreach in Microsoft Teams (as of 2026-10-27)

Key: `proactive-sme-outreach`. Builds on [operating-model.md](../operating-model.md) section 5
(roles: contributor, data owner, data steward), section 7 (async asks) and section 11 (notification
policy); [enterprise-integration-platform.md](enterprise-integration-platform.md) sections 1.2 (Teams
app surfaces) and 6(c) (where HyperDelivery meets users in Teams);
[governance-collaboration.md](governance-collaboration.md) R3 (async 1:1 context interviews, definition
disputes routed to the data steward); and the question card in
[TeamsCards.dc.html](../site/concepts/project/TeamsCards.dc.html). It does not repeat their detail.

HyperDelivery is the tool; UA-DLC is the process it runs. Asking people for business logic,
clarifications, definitions and feedback is a HyperDelivery capability that serves UA-DLC's Discover
and Plan stretches. It is the third of the owner's north-star asks (round 9) and lands after the
Final MVP. Every rule below keeps the gates: the answers inform decisions, and named people still
make and sign those decisions.

## 0. Bottom line

1. **The Teams mechanics are generally available and fit the Python backend.** The Teams SDK sends a
   proactive 1:1 message to anyone the app is installed for, using a conversation ID stored at
   install ([proactive messages, updated 2026-10-13](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)).
   An admin installs the app for a group through an app setup policy, or the app installs itself for
   a user through Graph with `TeamsAppInstallation.ReadWriteSelfForUser.All`
   ([Graph proactive install, 2026-06-19](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/proactive-bots-and-messages/graph-proactive-bots-and-messages)).
   People answer inside the card with `Action.Execute`. Nothing in this design needs a preview
   feature.
2. **Send from the HyperDelivery bot, and name the requester and the AI on every card.** "HyperDelivery,
   an AI assistant, asking for Maya Chen" is honest, works today, and keeps the card answerable.
   Agents with their own user identity (Agent 365) are in Microsoft's Frontier preview
   ([Agent 365, 2026-04-28](https://learn.microsoft.com/en-us/microsoft-agent-365/share)), and posting
   as the requester through Graph puts AI-written words under a person's name. Neither is needed.
3. **Targeted messages are for nudges, not asks.** They went GA on 30 Jul 2026 but disappear from
   clients 24 hours after sending
   ([targeted messages](https://learn.microsoft.com/en-us/MicrosoftTeams/platform/agents-in-teams/targeted-messages)),
   so a question with a two-day deadline lives in the 1:1 chat.
4. **Route on ownership first, inference second, and ask the requester when unsure.** Owners of
   record (Snowflake `STEWARD` and `ACCESS_APPROVAL` contacts, the approvers of past FSDs, the
   Confluence page owner) outrank inferred signals (People search, skills inferred by Microsoft).
   HyperDelivery's own record of who answered and who said "Not me, ask X" becomes the best signal
   over time, and it is UA-specific data a competitor cannot copy. Below a confidence threshold,
   HyperDelivery asks the requester who to ask; it never guesses. It never cold-messages a senior
   leader.
5. **Attention is the limit, not throttling.** Teams allows 60 messages per 30 seconds per
   conversation and 50 requests per second per app per tenant
   ([rate limits](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/rate-limit)).
   The average Microsoft 365 user already gets 153 Teams messages a weekday
   ([Work Trend Index, Jun 2025](https://microsoft.com/en-us/worklab/work-trend-index/breaking-down-infinite-workday)).
   Keep today's one batched card per project per day, and add a weekly cap per person across all
   projects, working-hours delivery, one reminder only, and escalation through the requester.
6. **The legal floor is disclosure, works councils and a no-evaluation rule.** EU AI Act Article
   50(1) has required AI systems that interact with people to say so since 2 Aug 2026
   ([Art. 50](https://artificialintelligenceact.eu/article/50/)). UA hires EDMA analysts in Amsterdam, and a
   tool that records who answered what, and how fast, is very likely a consent matter for a Dutch
   works council ([Praxikon, Jul 2026](https://www.praxikon.com/en/posts/works-council-consent-ai-in-the-workplace), secondary).
   Answers are never used to evaluate people, and response metrics are reported by function only.
7. **The ladder runs in this order: human-led, then AI-assisted, then AI-driven.** In the Final MVP,
   HyperDelivery drafts the questions and picks the people, and the requester sends them with one
   click. AI-driven sending, where HyperDelivery sends within a written policy, starts in Enterprise
   once the pilot meets the gate metrics (section 7) and Privacy and the works council have reviewed
   it. At every rung, approvals, definition rulings and access grants stay with people.
8. **No vendor publishes answer rates for agent-initiated SME asks.** Stack Overflow, Guru, Glean,
   Rovo, Moveworks and Copilot Studio all route questions or reminders to named owners, but they
   publish volumes, not response rates (section 6). UA has to measure its own baseline, so the ask
   record should capture the right fields from the first pilot card.

## 1. What this adds to the current plan

The operating model already has the core of this: async asks as Teams cards that say why the person
was asked, "Not me, suggest who" and "I don't know" on every card, a check of the per-project index
(and the Library, from Enterprise) before asking anyone, one batched card per person per project per
day, a reminder after 1 business day, and email deep links until the Teams app ships in week 10. Steward
requests have a 2-business-day target with escalation to the domain's data owner.

This report adds six things:

- How the message is sent and who it is from (section 2).
- How HyperDelivery picks the person, how sure it is, and what it does when it is not sure (section 3).
- Rules that keep people from muting the agent: a weekly cap across projects, working hours,
  reminders and escalation that go through the requester, and closing the loop (section 4).
- Disclosure, works councils, retention and opt-out (section 5).
- What other products do, and the little they publish about results (section 6).
- The human-led to AI-driven ladder with metrics and gate criteria (section 7).

One change to the notification policy follows from it. The "Question for you" row escalates to a
"suggested alternative after 3". The alternative should go to the requester as a suggestion, not to
the alternative person automatically (section 4, rule 8).

## 2. Teams mechanics

### 2.1 Proactive messages

- **What counts.** Any message the agent sends that is not a reply: notifications, scheduled messages,
  welcome messages. The app must already be installed for the user (personal scope) or in the group
  chat or team. Teams cannot create a new group chat or channel proactively
  ([proactive messages](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)).
- **How.** Store the `conversation.id` when the install event arrives (`@app.on_install_add` in the
  Python SDK), then call `app.send(conversation_id, activity)` later. A 1:1 conversation can also be
  created from the user's Entra object ID (`aadObjectId`). If the app is not installed in personal
  scope, the call fails with `403 ForbiddenOperationException`. Teams does not accept an email address
  or UPN as the address (same source).
- **Blocked or uninstalled.** A `403` with `subCode: MessageWritesBlocked` means the person blocked or
  removed the agent (same source). HyperDelivery should record that as an opt-out and tell the
  requester, not retry.
- **Update and delete.** Keep each sent activity ID. When a question is answered elsewhere (in the
  console, by another person, or by a decision), update the card into a receipt so nobody answers a
  closed question (same source).
- **Microsoft's own guidance** says a proactive notification should state what happened, who or what
  triggered it, what the person can do, and how to opt out. Scheduled messages should respect the
  recipient's time zone (same source). The Graph terms add that apps should send only messages people
  will read ([send chat message](https://learn.microsoft.com/en-us/graph/api/chat-post-messages?view=graph-rest-1.0)).
- **SDK version.** Python went GA on 1 May 2026 ([enterprise-integration-platform.md 1.2](enterprise-integration-platform.md)),
  and Teams SDK 2.1.0 for TypeScript and Python (28 Sep 2026) adds agentic identity with helpers for
  reactive and proactive messages ([Teams what's new](https://learn.microsoft.com/en-us/microsoftteams/platform/whats-new)).

### 2.2 What must be installed first

| Route | What it takes | Fits |
|---|---|---|
| App setup policy | A Teams admin adds HyperDelivery to the installed apps (and optionally pins it) for a policy assigned to a group. If UA's tenant uses app centric management, the install is done on the Manage apps page instead. Changes take a few hours. Users cannot uninstall an app an admin added ([setup policies, 2026-05-12](https://learn.microsoft.com/en-us/microsoftteams/teams-app-setup-policies)) | Pilot users and, later, each workspace's members |
| Graph proactive install | Application permission `TeamsAppInstallation.ReadWriteSelfForUser.All` with admin consent, a `webApplicationInfo` entry in the manifest, and the app in UA's org catalog. `POST /users/{id}/teamwork/installedApps` installs it; `GET` with a filter checks first ([Graph proactive install](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/proactive-bots-and-messages/graph-proactive-bots-and-messages)) | A contributor outside every policy group, installed just before the first ask the requester sends |

Two consequences. First, when an admin installs the app, a person cannot remove it, so the opt-out
must live in the product (section 5.8), not in Teams. Second, the Graph route lets HyperDelivery
reach anyone in the tenant. That reach should be gated by the requester's action and by policy, not
switched on for every user.

### 2.3 1:1, group chat, channel and targeted messages

| Surface | Use for | Limits that matter |
|---|---|---|
| 1:1 chat with HyperDelivery | Every individual ask, reminder and loop-closing note; definition disputes to a steward | Needs the personal-scope install |
| Project group chat | Questions where the group benefits from seeing the answer; approval receipts | The requester creates the chat and adds the app (the consent signal in [enterprise-integration-platform.md 6(a)](enterprise-integration-platform.md)); Teams cannot create it |
| Targeted message in the project chat | A short private nudge ("You have 2 questions from HyperDelivery in your chat") | GA 30 Jul 2026. Visible only to the recipient; expires from clients after 24 hours but may be kept in retention storage; not in 1:1 chats; clicks on a card inside one can still create activity others see ([targeted messages, 2026-07-17](https://learn.microsoft.com/en-us/MicrosoftTeams/platform/agents-in-teams/targeted-messages)) |
| Channel post | The weekly digest only | Never an individual ask |

### 2.4 Answering inside the card

- `Action.Execute` (Universal Actions) sends the click to the bot, which can return a new card in
  place. That makes a short sequence possible inside one card: pick an answer, then confirm, or pick
  "Not me, suggest who" and then a person
  ([Universal Actions, 2026-09-30](https://learn.microsoft.com/en-us/microsoftteams/platform/task-modules-and-cards/cards/universal-actions-for-adaptive-cards/overview)).
- **Up-to-date views.** A card refreshes for listed users when it is shown, so an answered card turns
  into a receipt for everyone ([up-to-date views](https://learn.microsoft.com/en-us/microsoftteams/platform/task-modules-and-cards/cards/universal-actions-for-adaptive-cards/up-to-date-views)).
  Automatic refresh works in chats of 60 people or fewer
  ([Universal Actions for message extensions](https://learn.microsoft.com/en-ca/microsoftteams/platform/messaging-extensions/how-to/search-commands/universal-actions-for-search-based-message-extensions)),
  which is not a constraint in a 1:1 chat.
- **Outlook.** The same `Action.Execute` card can render in Outlook, which suits the email fallback
  before the Teams app lands (same Universal Actions source). Outlook's own registration steps for
  actionable messages were not checked (section 11).

### 2.5 Throttling

| Scope | Limit ([rate limits, updated 2026-07-27](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/rate-limit)) |
|---|---|
| One bot, one conversation | 7 sends per second, 8 per 2 seconds, 60 per 30 seconds, 1,800 per hour |
| All bots, one conversation | 14 sends per second, 16 per 2 seconds |
| One app, whole tenant | 50 requests per second |

Retry `429`, `412`, `502` and `504` with exponential backoff and jitter (same source). Because the
per-conversation limit applies to each 1:1 chat separately, sending one card to each of 50 SMEs is
nowhere near a limit. The binding constraint is human attention (section 4).

### 2.6 Who the message is from

| Option | How it appears | Status, 2026-10-27 | Use |
|---|---|---|---|
| A. The HyperDelivery bot, with the requester named in the card | "HyperDelivery" in the chat list; the card header says it is an AI assistant asking for Maya Chen | GA; already the plan's single persona | **Recommended for every rung** |
| B. An agent with its own Entra user account (agentic user) | A teammate-like account with its own presence, created from an agent identity blueprint | Teams SDK 2.1.0 supports it ([Teams what's new](https://learn.microsoft.com/en-us/microsoftteams/platform/whats-new); [SDK guide](https://microsoft.github.io/teams-sdk/typescript/in-depth-guides/agent-365/)). Agent 365's own-identity agents are in a Frontier preview that started in May 2026, and Microsoft notes their access persists and accumulates over time ([Agent 365](https://learn.microsoft.com/en-us/microsoft-agent-365/share)). A license per agent user is reported (not verified) | Not for outreach. Revisit at the scale decision |
| C. The requester's own account through Graph | The message appears as written by Maya | Delegated `ChatMessage.Send` only; the application permission exists only for migration ([send chat message](https://learn.microsoft.com/en-us/graph/api/chat-post-messages?view=graph-rest-1.0)) | Not recommended: it puts AI-drafted text under a person's name, and whether the bot could handle actions on such a card was not verified |

Separately from how messages appear, register HyperDelivery's agent identity in Entra Agent ID, with
the platform owner as its sponsor. Sponsors are required for agent identities, so every agent has a
named business owner ([owners, sponsors and managers](https://learn.microsoft.com/en-us/entra/agent-id/agent-owners-sponsors-managers)).
That puts HyperDelivery in UA's agent inventory without changing what recipients see. The Agent 365
registry sync with Bedrock is covered in
[enterprise-integration-platform.md 1.4](enterprise-integration-platform.md).

## 3. Who to ask: SME routing

### 3.1 Signals available at UA

| Signal | Where it lives | What it says | Strength | Access | From |
|---|---|---|---|---|---|
| Snowflake contacts | `CONTACT` objects with purposes `STEWARD`, `ACCESS_APPROVAL`, `SUPPORT` and `SECURITY_COMPLIANCE`, inherited down from account to schema to table; read with `SNOWFLAKE.CORE.GET_CONTACTS` or `ACCOUNT_USAGE.CONTACTS` and `CONTACT_REFERENCES` ([Snowflake contacts](https://docs.snowflake.com/en/user-guide/contacts-using)) | The steward and access approver of record for the exact table, view or schema the question is about | High for definitions and data questions | Any privilege on the object for `GET_CONTACTS`; the `ACCOUNT_USAGE` views need a grant on the `SNOWFLAKE` database | Enterprise, if data platform populates them [confirm] |
| A catalog's owners and stewards | Atlan, Collibra or Alation, if UA runs one [confirm] | Glossary term owners | High for definitions | Catalog MCP ([governance-collaboration.md B4](governance-collaboration.md)) | Enterprise |
| Authors and approvers of related past FSDs | The approved FSD corpus (the round 9 moat work): the sign-off block and revision history | Who decided the business rules in this domain before | High, but it fades with age and job changes; check the person is still in the role | The corpus index | Enterprise, with the corpus |
| Confluence page owner and editors | `ownerId` on the page; one owner at a time; owner changes are not in the audit log ([CONFCLOUD-83342](https://jira.atlassian.com/browse/CONFCLOUD-83342), [CONFCLOUD-84300](https://jira.atlassian.com/browse/CONFCLOUD-84300)) | Who maintains the process or standard the question cites | Medium | Today's Atlassian service token for the allowlisted spaces | Final MVP for pointed pages |
| Jira reporter, assignee and watchers | Related issues and the requester's ticket | Who raised or worked on this before | Medium | Same as above | Final MVP for pointed tickets |
| Entra manager chain, department, title | `GET /users/{id}?$expand=manager($levels=max)` with `ConsistencyLevel: eventual`; `User.Read.All` ([list manager](https://learn.microsoft.com/en-us/graph/api/user-list-manager?view=graph-rest-1.0)) | Guardrails (seniority, same team as the requester) more than expertise | Used for blocking, not ranking | Existing Entra registration | Final MVP |
| Microsoft Search for people | `POST /search/query` with `entityTypes: ["person"]`; the People API is in maintenance mode ([list people](https://learn.microsoft.com/graph/api/user-list-people)) | People the requester works with | Low as expertise evidence | Delegated, as the requester | Enterprise, as a tiebreaker |
| Skills Microsoft infers | People Skills, built by an LLM from documents, mail, chats and meetings; Microsoft says they are not a full picture of anyone's capabilities ([People Skills](https://learn.microsoft.com/en-us/microsoft-365/copilot/people-skills-ai-inferencing)); the Graph `skillProficiency` API is beta | Inferred expertise | Low; it is also profiling, which raises the works-council question | Copilot licensing; beta API | Not planned |
| Rovo and the Teamwork Graph | Rovo Chat answers "who is the SME on [topic]" across Atlassian content ([Rovo use cases](https://www.atlassian.com/software/rovo/use-cases/chat-relevant-information)) | Experts in Jira and Confluence | Medium | Rovo delegate (Enterprise) | Enterprise, through the Rovo delegate already planned |
| HyperDelivery's own history | Who answered questions on the same term, metric, table or domain; who re-routed to whom; "I don't know" answers; which answers survived Confirm what we heard and approval | Demonstrated, UA-specific expertise | Highest over time | HyperDelivery's store | Capture from the Final MVP; use from Enterprise |
| The requester's suggestion | Asked in the conversation | Local knowledge no system holds | High | None | Always |

Note that Snowflake object `OWNERSHIP` belongs to a role, not a person, so it is not an SME signal. A
Snowflake contact can be a distribution list or a URL instead of named users (same Snowflake source).
In that case HyperDelivery asks the requester to pick a person from the list, or posts to the list's
channel through the requester.

### 3.2 Scoring confidence

Use an additive score that can be explained, not a learned model, until the pilot has enough answers
to evaluate one. Each candidate gets evidence items, each item has a type and a date, and the card's
"Why you" line is the strongest item in plain words.

| Level | Rule (proposed, to tune in the pilot) | What happens |
|---|---|---|
| High | The owner of record for the exact object or term (a Snowflake `STEWARD` contact, catalog steward or FSD approver for that rule), still in the role per Entra; or the person whose answer on the same term was accepted in the last 12 months | AI-assisted: preselected, and the requester sends. AI-driven (Enterprise): may be sent within policy |
| Medium | Two independent weaker signals agree (for example, Confluence owner of the cited standard and assignee on a related Jira issue) | The requester confirms the person before anything is sent |
| Low | One weak signal, or none | HyperDelivery asks the requester "Who should answer this?" and shows what it found. It never guesses |

Adjustments: lower a person's score for a term when they answer "I don't know" or "Not me, ask X";
raise X's score for that term; decay evidence older than about two years; drop anyone who has left
the role or the company. Store every routing decision with its evidence, so a requester or a reviewer
can see why a person was asked.

Worked example from the concept card. HyperDelivery asks Dana Ortiz whether marked-down units count
toward margin dollars per door. The evidence: Dana is the `STEWARD` contact on the margin golden
report's schema, and Dana approved two past margin FSDs. Two owner-of-record items give High
confidence. The card's line reads "Why you: data steward for Margin in Snowflake; approved the FW25
margin FSD."

### 3.3 Guardrails that never bend

- **Senior leaders are never cold-messaged.** Define the group with HR, for example vice president and
  above, held as an Entra group or attribute [confirm], and back it with manager-chain depth. When the
  best answer sits with a senior leader, HyperDelivery tells the requester: "This needs Pat's view.
  Ask Pat yourself, or name a delegate." AI-driven sending never reaches this group.
- **Delegates are respected.** When a person answers "ask my delegate for definitions", store it as a
  routing preference for that person and topic. Outlook's delegate settings describe meeting
  messages, not who answers questions, so HyperDelivery keeps its own preference record.
- **Out of office holds the ask.** Mailbox settings expose automatic replies and working hours
  (`MailboxSettings.Read`, application or delegated;
  [mailbox settings](https://learn.microsoft.com/en-us/graph/api/user-get-mailboxsettings?view=graph-rest-1.0)).
  If the person is away past the deadline, the requester picks someone else.
- **No guests and no people outside UA**, ever.
- **People and Finance projects stay private.** Outreach goes only to members, unless the requester
  sends it.
- **The requester's own manager is not an escalation path for the agent.** Only the requester decides
  to involve a manager.

## 4. Interaction design that people do not learn to ignore

The card competes with 153 Teams messages a weekday, 117 emails a day, and an interruption every two
minutes ([Work Trend Index](https://microsoft.com/en-us/worklab/work-trend-index/breaking-down-infinite-workday)).
These rules come from that, from Microsoft's notification guidance (section 2.1) and from the prior art
in section 6. Numbers marked "proposed" are starting values to test in the pilot.

1. **Batch per person.** One card per person per project per day, as the notification policy already
   says, with at most 3 questions (proposed), ordered by what blocks the next approval. The card says
   "Question 1 of 2".
2. **Label the role and give the reason.** "As data steward for Margin" and the decision the answer
   feeds ("This sets the margin rule in the plan Maya approves next").
3. **Give a real deadline.** Tie it to the plan ("Needed by Thursday, before the plan approval"). Never
   invent urgency.
4. **Make answering one click.** Domain options, "Other", "I don't know" and "Not me, suggest who" with
   a people picker, plus a short free-text box. The card names what HyperDelivery already checked
   ("Not settled in the Margin reporting standard, section 4"), so people see it did its homework.
5. **Treat "I don't know, ask X" as an answer.** It is recorded as a routing edge (section 3.2) and
   thanked like any other answer. A re-route is useful information, not a failure.
6. **Respect working hours and time zones.** Deliver inside the recipient's working hours from mailbox
   settings, never on their non-working days. Fall back to the site's standard hours (Baltimore,
   Amsterdam, Bengaluru) when the mailbox has none. Presence (`Presence.Read.All`, up to 650 users per
   request; [presence](https://learn.microsoft.com/en-us/graph/api/cloudcommunications-getpresencesbyuserid))
   can defer delivery during Do not disturb. That is optional, and Privacy should weigh it, because
   reading presence looks like monitoring.
7. **Cap each person's week.** At most 5 cards per person per week across all HyperDelivery projects
   (proposed). Stewards get a separate agreed allowance, since the operating model already budgets
   2 to 5 definition questions and about 2 steward hours per project. When the cap is reached,
   HyperDelivery queues the question and tells the requester.
8. **Send one reminder, then hand back to the requester.** One reminder after 1 business day (today's
   policy). After that, the requester sees "Dana hasn't answered" with three choices: nudge Dana
   personally, ask someone else, or decide without the answer and record it as an assumption. The
   agent never sends a third message to the same person about the same question, and never escalates
   to anyone's manager.
9. **Close the loop.** When an answer changes the plan, the person gets one short note: "Your answer
   set the markdown rule in the plan. Maya approved it on Oct 16." The weekly digest credits
   contributors by name (operating model section 7). The loop-closing note is the main reason people
   answer the next card.
10. **Record attribution.** Each answer becomes a fact with the person's name and role, the time, the
    question version and the card ID. It appears in "What we heard", where each person can correct
    their own statements (operating model section 8).
11. **Send conflicting definitions to the steward as a dispute.** When two answers disagree, or an
    answer contradicts a certified definition, HyperDelivery does not pick one. It opens a definition
    dispute for the domain's data steward with both statements and their sources, with the
    2-business-day target and escalation to the data owner from operating model section 5
    ([governance-collaboration.md R3](governance-collaboration.md)).
12. **Offer a pause and an opt-out on every card.** "Pause questions for 2 weeks", "Don't ask me about
    this topic" and "Why am I getting this?" sit in the card's footer (section 5.8).
13. **Ask neutrally.** Options carry no default and no "we think" framing. A Stanford study in Science
    found chatbots affirmed users 49% more often than people did on social questions
    ([Fortune, Mar 2026](https://fortune.com/2026/03/31/ai-tech-sycophantic-regulations-openai-chatgpt-gemini-claude-anthropic-american-politics), secondary).
    An agent that leads the witness collects the requester's assumption back, with a name attached.

**Proposed revision of the question card in the concept.** The current card (to Dana Ortiz, "Should
marked-down units count toward margin dollars per door?") already has the reason ("You own the markdown
and margin policy"), the citation and the two routing answers. To match this report it should add:

- A header line: "HyperDelivery, an AI assistant, asking for Maya Chen", in place of "Maya Chen's
  project" alone.
- "Question 1 of 2 · Needed by Thu, Oct 15, before the plan approval."
- "Why you: data steward for Margin in Snowflake; approved the FW25 margin FSD."
- What was checked: "Not settled in the Margin reporting standard, section 4."
- What happens to the answer: "Cited in the brief with your name. The project team can see it."
- A footer with "Pause questions" and "Why am I getting this?".
- The answered state as a receipt ("Answered Oct 13. Used in the plan, version 3."), and later the
  loop-closing note.

## 5. Policy, HR and legal

### 5.1 Say it is an AI, acting for a named person

- **EU AI Act Article 50(1)** requires providers to make sure AI systems that interact directly with
  people inform them, unless it is obvious. Article 50(5) says this must happen "at the latest at the
  time of the first interaction", in a clear and distinguishable way. It has applied since
  2 Aug 2026 ([Art. 50](https://artificialintelligenceact.eu/article/50/)). The AI Omnibus
  (Regulation (EU) 2026/1744, in force 27 Jul 2026) left Article 50(1) unchanged; its only Article 50
  relief is a transition to 2 Dec 2026 for machine-readable marking of AI-generated content by systems
  already on the market ([Houthoff, Sep 2026](https://www.houthoff.com/insights/news/ai-act-transparency-obligations-and-the-ai-omnibus-regulation/);
  [Goodwin, Aug 2026](https://goodwinlaw.com/en/insights/publications/2026/08/alerts-technology-dpc-eu-ai-act-transparency-obligations-now-in-force);
  both secondary; see section 11).
- UA builds HyperDelivery and puts it into service for its own use, which likely makes UA the
  provider, not only the deployer. Legal should confirm this.
- **The disclosure on every card**, not only the first: "HyperDelivery is an AI assistant. It is
  asking for Maya Chen. Your answer is shared with the project team and cited with your name."
  Applying it everywhere is simpler than deciding per region who is in the EU.
- **There is always a named requester.** Even an AI-driven ask carries the project owner who set the
  policy that allowed it, so every message has a human who answers for it.

### 5.2 Employee-communication policies

- UA's internal communications and acceptable-use policies for Teams are not public [confirm].
  Internal Communications should sign off the tone, the caps and the disclosure text before the pilot
  sends its first card.
- Microsoft's guidance (section 2.1) already covers the basics: say why the person got the message,
  who triggered it, and how to opt out.

### 5.3 Works councils for EU staff

- **Netherlands.** UA hires EDMA analysts in Amsterdam
  ([under-armour-context.md](under-armour-context.md)). Article 27(1) of the Dutch Works Councils Act
  (Wet op de ondernemingsraden, WOR) requires works council consent for arrangements on processing
  employees' personal data (sub k) and for facilities aimed at, or capable of, observing employees'
  presence, behavior or performance (sub l). Without consent, the council can invoke nullity within a
  month and the decision is treated as never taken
  ([Praxikon, Jul 2026](https://www.praxikon.com/en/posts/works-council-consent-ai-in-the-workplace),
  secondary). A tool that records who was asked, who answered and how fast is capable of observation
  even if UA never uses it that way.
- **Germany**, if UA has a German works council [confirm]. Co-determination under section 87(1) no. 6
  of the Works Constitution Act (BetrVG) covers monitoring-capable systems before productive use.
  Employers should expect the section 80 information right and the section 87 co-determination
  rights in every AI project, and the information and consultation rights in section 90 apply at the
  planning stage
  ([Covington, Jul 2026](https://www.cov.com/-/media/files/corporate/publications/2026/07/works-council-rights-in-ai-implementation-projects.pdf)).
  The same overview says a general assistant that answers questions or drafts text does not usually,
  on its own, trigger section 95, which covers selection guidelines.
- **The high-risk line.** Annex III point 4(b) lists as high-risk AI that allocates tasks based on
  individual behavior or personal traits, or that monitors and evaluates performance and behavior
  ([Annex III](https://artificialintelligenceact.eu/annex/3/)). Routing questions on someone's past
  answers comes close to the first clause. Keep routing grounded in role and ownership, never rank
  people by responsiveness, and ask Legal to confirm that HyperDelivery stays outside point 4(b).
  If it did fall inside, Article 26(7) would require informing workers' representatives before use
  (same Covington overview). After the Omnibus, the Annex III high-risk obligations apply from
  2 Dec 2027 (Goodwin alert, section 5.1).
- **Sequencing.** Ask the Dutch works council before any EMEA employee receives an AI-assisted or
  AI-driven ask. Until then, the pilot reaches EMEA colleagues only through the requester.

### 5.4 Answers are never used to evaluate people

- Write it into the notice, and get HR's written commitment that answer data and response metrics
  stay out of performance and talent processes.
- No per-person answer-rate view for anyone except the person themselves. Report metrics by function,
  with a minimum group size of 5 (proposed).
- Do not compute "responsiveness" scores. The routing score (section 3.2) is about who knows a topic,
  is never shown as a ranking of people, and is deleted when the person leaves.

### 5.5 Retention

- The answer of record lives in HyperDelivery's project store, under the project's retention and
  deletion (the per-project index rules). The Teams card is a copy.
- UA's Teams chat retention policy most likely covers chats with bots too
  ([Practical365](https://practical365.com/deleting-teams-chat-files-automatically-using-purview/),
  secondary). Targeted messages may be kept in organizational retention storage after they expire
  from clients (section 2.3).
- Facts promoted to the Library (Enterprise) keep their attribution. A person who leaves UA stays
  credited on the facts they gave, but their routing evidence is deleted.

### 5.6 Nothing sensitive in chat

- Cards carry questions about definitions, rules and intent. They never carry data values above
  Internal, personal data or customer data. When a question needs a number, the card links to the
  console view, the same rule that keeps evidence screenshots out of Teams cards
  ([platform-architecture.md](../platform-architecture.md)).
- The free-text box says "Don't paste data or files here". Answers pass through the same Guardrails
  and secret scanning as other inputs before they are stored.

### 5.7 GDPR basics

Legitimate interest is the likely basis. Recipients get a short notice (what is asked, why, who sees
the answer, how long it is kept), and Privacy decides whether a data protection impact assessment
(DPIA) is needed, given the monitoring capability. India's DPDP Act for Bengaluru staff was not
researched (section 10).

### 5.8 Opt-out

- **Pause** (2 weeks) and **topic opt-out** on every card; **full opt-out** from AI-driven asks in the
  person's HyperDelivery settings.
- An ask that a named colleague sends in person through the AI-assisted rung remains possible after a
  full opt-out, because it is that colleague's request. The card says so.
- A blocked bot (`MessageWritesBlocked`) counts as a full opt-out until the person reverses it.
- Admin-installed apps cannot be uninstalled by users (section 2.2), which is why all of this has to
  live inside HyperDelivery.

## 6. Prior art and what it reports

| Product | How it asks people | Published results | What to take |
|---|---|---|---|
| Stack Overflow for Teams (Stack Internal) | Admins assign SMEs to tags; SMEs are subscribed to the tag's updates, sent daily by default ([assign SMEs](https://support.stackenterprise.co/support/solutions/articles/22000294391-assign-subject-matter-experts)) | Says SME coverage directly affects median time to answer, with no figure ([tags guide](https://stackoverflow.co/teams/resources/speed-up-time-to-answer-with-tags/), vendor) | Owner-of-record routing plus a digest cadence |
| Guru | Every knowledge card has a verifier (a person or a group) and a review interval from weekly to annual; reminders go through Slack or email; AI suggests the verifier from who created or last edited the card ([verification](https://www.getguru.com/features/verification), vendor) | None found | Periodic re-confirmation of canonical facts by named owners, a pattern for the Library |
| Glean | Expert search ranks people by document authorship and ticket assignments ([expert search](https://docs.glean.com/actions/glean/expert-search), read from the search summary); Slack agents decide when to reply and never reply inside existing threads or in channels with external people ([question detection](https://docs.glean.com/administration/platform/embedded-integrations/slackbot/admin-guide/customize-question-detection)) | None found for asks | Activity-based expertise signals; knowing when not to speak |
| Atlassian Rovo | Rovo in Teams and Microsoft 365 Copilot since Aug 2026 ([Atlassian](https://www.atlassian.com/blog/rovo/rovo-jira-microsoft-365)); Rovo Chat answers "who is the SME on [topic]" | Over 5 million monthly active users in Feb 2026 ([Atlassian Q2 FY2026 results, 5 Feb 2026](https://www.sec.gov/Archives/edgar/data/1650372/000165037226000008/ex991q2fy26.htm), vendor claim) | Use Rovo for "who knows this in Jira and Confluence"; do not rebuild it |
| Moveworks (ServiceNow) | Ambient agents watch systems such as approval tables and message the right people ([ambient agents](https://help.moveworks.com/docs/ambient-agents-overview)) | 165 million notifications to 5.5 million users in 2025, 14% of them approvals ([Moveworks, Dec 2025](https://moveworks.com/us/en/resources/blog/moveworks-rewind-2025-the-global-front-door-to-work), vendor); volume, not response rates | Proactive enterprise notifications at scale are normal; approvals inside the chat |
| Microsoft Copilot Studio | Proactive Teams messages through Power Automate, only to people who installed the agent, only in the personal chat, and not shown in the agent's transcripts or analytics ([Copilot Studio, 2026-09-24](https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-proactive-message)) | None | Log every proactive send in HyperDelivery itself |
| Teams Facilitator | Sends post-meeting tasks to their owners ([Inside Track, Apr 2025](https://www.microsoft.com/insidetrack/blog/transforming-meetings-how-were-using-the-new-microsoft-365-copilot-powered-facilitator-feature-at-microsoft), vendor); adding it to a meeting needs a Microsoft 365 Copilot license ([Facilitator support page](https://support.microsoft.com/en-US/teams/copilot/facilitator-in-microsoft-teams-meetings)) | None | Follow-ups go to named owners; HyperDelivery can read Facilitator's notes (meeting-capture research) rather than duplicate them |
| Slackbot (Salesforce) | A personal agent, GA 13 Jan 2026, with more than 30 more capabilities on 31 Mar 2026 ([Futurum](https://futurumgroup.com/insights/salesforces-slackbot-goes-ga-is-this-the-real-test-for-agentforce/), [The Next Web](https://thenextweb.com/news/slack-slackbot-30-ai-features-agentic), both secondary) | None for asks | Not UA's stack; reference only |
| AI interviewers (Listen Labs, Outset) | Structured async interviews moderated by AI | Volumes only, for example Outset's 500,000 interview hours ([Outset](https://outset.ai/almanac/outset-vs-listen-labs-best-ai-research-tool-in-2026), vendor); no completion rates | Async structured interviews work for research panels, which are paid and opted in, unlike SMEs |
| Research | A field study of about 600 people found a chatbot survey produced more informative, relevant, specific and clear free-text answers than a standard web survey ([Xiao et al., ACM TOCHI 2020](https://arxiv.org/abs/1905.10700)) | Peer-reviewed | Conversational follow-up improves answer quality; keep it short |

None of these publishes an answer rate or time to answer for agent-initiated questions to experts.
Vendor numbers measure reach. UA's own pilot is the only source of the metrics in section 7.

## 7. The ladder

| | Human-led | AI-assisted | AI-driven |
|---|---|---|---|
| Who finds the open question | HyperDelivery, from the conversation and the index | HyperDelivery | HyperDelivery |
| Who picks the person | The requester | HyperDelivery proposes people with evidence; the requester confirms | HyperDelivery, at High confidence, within policy |
| Who writes the question | The requester, from HyperDelivery's list | HyperDelivery drafts; the requester may edit | HyperDelivery |
| Who sends | The requester, in their own words and channel | The requester, with one click; the HyperDelivery bot delivers the card, which says "asking for Maya Chen" | HyperDelivery, inside the per-project and per-person policy; the requester sees a live log and can withdraw any ask |
| Allowed question types | Any | Definitions, clarifications, business rules, feedback on a draft | The same, on Internal-classified projects only; never approvals, access requests or anything to a senior leader |
| Decisions | People | People | People: approvals, definition rulings (steward), access grants (data owner) |
| Phase | Current State; the email fallback in the Final MVP | Final MVP, pilot users, from the Teams app in week 10 | Enterprise, after the gate below; EMEA only after the works council outcome |

**Gate from AI-assisted to AI-driven** (proposed, measured over at least 8 pilot weeks):

- At least 70% of asks answered within 2 business days.
- Re-routes ("Not me") under 20% of asks at High confidence.
- Pauses and opt-outs under 2% of distinct recipients.
- Requesters edit fewer than 1 in 5 drafted questions before sending.
- No senior leader reached, and no complaint upheld by Internal Communications or HR.
- Privacy and Legal have reviewed, and the works council has given consent where required.

These are the activity-specific bars for the "Questions to SMEs" row. They sit inside the promotion
rules in [autonomy-levels.md](autonomy-levels.md) section 5, not beside them: promotion is per cell
(one workspace at one risk tier), starts in shadow, also needs that report's common criteria
(minimum runs, no severe escapes, reviewers still read), and is a decision record signed by the
workspace admin and the line owner. It is never automatic.

**Metrics** (aggregated by function, never shown per person except to the person):

| Metric | Definition |
|---|---|
| Answer rate | Asks with an answer (including "I don't know" and a re-route) by the deadline, divided by asks sent |
| Time to answer | Median and 90th percentile, counted in the recipient's working hours |
| Re-route rate | "Not me, suggest who" answers, divided by asks; by confidence level |
| "I don't know" rate | By question type |
| Opt-outs | Pauses, topic opt-outs, full opt-outs and blocks, divided by distinct recipients |
| Distinct functions contributing | Per project, the number of departments whose people answered (governance-collaboration.md R3, measure 5) |
| Questions avoided | Open questions answered from the index or Library without asking anyone |
| Draft edit rate | Share of drafted questions the requester changed before sending (AI-assisted only) |
| Loop closure | Answers that changed the plan and whose author got the note |
| Dispute time | Days from a definition dispute to the steward's ruling |

## 8. What to prepare now (Final MVP), without building ahead

These are data-capture and schema choices, plus requests to file. They are not infrastructure for
the later rungs.

1. **Grow `OpenQuestion` into an ask record** (`src/core/domain/project.py`). Keep `question`,
   `options` and `multi_select`, and add: `requested_by` (the requester's object ID), `asked_of`,
   `role_label`, `reason`, `routing_evidence` (a list of type, source and date), `confidence`,
   `send_mode` (`human_led` or `ai_assisted`, with `ai_driven` reserved), `channel`, `batch_id`,
   `deadline`, `disclosure_version`, `status`, `answer`, `answered_by`, `answered_at`, `rerouted_to`,
   `feeds` (the decision or requirement IDs), and `loop_closed_at`. Record them in human-led mode too,
   so the baseline exists before AI-assisted starts.
2. **Capture re-routes and "I don't know" answers as edges** from the first pilot card. This is the
   routing data, and it is UA-specific (a moat input).
3. **Keep a small per-person preference record:** paused until, topics opted out, delegate per topic,
   full opt-out. A card's footer writes to it.
4. **Store the Teams conversation ID per person at install,** and the activity ID per sent card, so
   cards can turn into receipts.
5. **Write the disclosure text and the notice** and send them to Privacy and Legal with the
   meeting-capture review that starts in week 8.
6. **Put the caps in configuration, not code:** cards per person per project per day, questions per
   card, cards per person per week, reminder count. The Final MVP enforces the first two and logs the
   rest.
7. **Revise the question card concept** in TeamsCards.dc.html as listed at the end of section 4.
8. **Use a hand-maintained steward list per pilot domain** in place of Snowflake contacts, owned by
   the domain's data owner.
9. **Do not build:** automatic sending, a learned ranking model, People Skills or presence polling,
   agentic users, Rovo expert lookup, or Graph proactive install for the whole tenant.

## 9. Long-lead requests

| Request | Owning team | Why | Needed by phase |
|---|---|---|---|
| Add an app setup policy that installs (and optionally pins) the HyperDelivery Teams app for the pilot group, alongside the Teams app request already on the long-lead track | Microsoft 365 admins | Proactive 1:1 asks need the personal-scope install | Final MVP (week 10) |
| Senior-leader "do not contact directly" group, maintained by HR | HR (People team) and Entra admins | The hard guardrail in section 3.3 | Final MVP, before the first AI-assisted send |
| Internal Communications sign-off on tone, caps and disclosure text | Internal Communications | Employee-communication policy | Final MVP pilot |
| `TeamsAppInstallation.ReadWriteSelfForUser.All` (application, admin consent) | Entra and Microsoft 365 admins | Reach contributors outside the policy groups when a requester asks them | Enterprise hardening |
| `MailboxSettings.Read` (application) for working hours, time zone and automatic replies | Entra admins, with Privacy | Working-hours delivery and out-of-office holds | Enterprise hardening (the Final MVP uses site hours) |
| Snowflake `CONTACT` objects (`STEWARD`, `ACCESS_APPROVAL`) on certified data products, or the name of UA's catalog of record | Data platform; data governance | Owner-of-record routing for definitions | Enterprise hardening |
| Privacy and Legal review of outreach: notice, AI disclosure, UA's role under the AI Act, Annex III 4(b), retention, legitimate interest and DPIA | Privacy and Legal | Section 5 | Enterprise hardening (start with the week 8 meeting-capture review) |
| Works council consultation in the Netherlands, and in Germany if applicable | HR and Employee Relations EMEA; Legal | WOR article 27(1)(k) and (l); BetrVG section 87(1) no. 6 | Before any EMEA employee receives an AI-assisted or AI-driven ask |
| HR's written commitment that answer data stays out of performance processes | HR | Section 5.4, and the works council will ask | Enterprise hardening |
| Register HyperDelivery's agent identity in Entra Agent ID, with a sponsor | Entra admins; security architect | Agent inventory and governance | Enterprise hardening |

## 10. Risks and open questions

**Risks**

- **People mute or block the agent.** Watch for it: blocks (`MessageWritesBlocked`), pauses, and a
  falling answer rate. Mitigations: caps, working hours, one reminder, loop closure.
- **The wrong person is asked.** Watch the re-route rate at High confidence. Mitigations: confidence
  levels, requester confirmation below High, and a decay on stale evidence.
- **A senior leader is messaged.** The cost is reputational. Mitigation: the hard block in section 3.3,
  checked at send time and not only at routing time.
- **It is seen as monitoring.** Watch for works council or employee objections. Mitigations: no
  per-person metrics, the no-evaluation commitment, and routing on role and ownership.
- **A casual chat answer is treated as settled.** Answers become proposed facts. They are confirmed in
  "What we heard", definitions go to the steward, and only signed artifacts count.
- **Leading questions collect the requester's own assumption.** Mitigations: neutral options and no
  defaults (section 4, rule 13).
- **Someone pastes sensitive data into a free-text answer.** Mitigations: the warning on the box,
  scanning before storage, and the console for anything with data.
- **People think Maya wrote it.** Mitigation: the header and disclosure on every card.
- **Teams changes underneath.** Agent sessions were canceled on 22 Oct 2026 after a September preview
  ([Teams what's new](https://learn.microsoft.com/en-us/microsoftteams/platform/whats-new)).
  Mitigation: use only GA primitives.
- **Stewards are overloaded.** Mitigations: a separate steward allowance, the 2-hours-a-week agreement
  in operating model section 13, and dispute batching.

**Open questions**

1. Does UA have a catalog of record (Atlan, Collibra, Alation), and are Snowflake contacts in use?
2. Who counts as a senior leader for the do-not-contact group, and who maintains it?
3. Which UA entities in EMEA have works councils: the Amsterdam headquarters, and any German entity?
4. Is UA the provider of HyperDelivery under the AI Act, and does SME routing stay outside Annex III
   4(b)?
5. Is 5 cards per person per week the right cap? Should stewards have a different number?
6. Will HR commit in writing that answer data is excluded from performance processes?
7. Should AI-driven asks reach people outside the requester's workspace, or only inside it?
8. How long does UA's Teams retention policy keep chats with bots?
9. In AI-driven mode, does the requester want each ask in real time, or a daily summary?
10. Do Bengaluru staff need anything under India's Digital Personal Data Protection Act (not researched)?

## 11. Not verified, or could not access

- **Agent 365 status for own-identity agents.** The Learn page places them in a Frontier preview
  from May 2026, while the earlier research records Agent 365 as GA on 1 May 2026 for registry and
  governance. Both can be true. The license per agent user comes from a community sample.
- **Graph-posted cards.** Whether `Action.Execute` on a card posted by a user through Graph (option C
  in section 2.6) would reach HyperDelivery's bot was not tested.
- **People picker.** It was not re-checked in the 2026 Adaptive Cards docs.
- **Outlook actionable messages.** Their registration requirements were not checked.
- **Article 50 timing.** Houthoff, Goodwin and Scytale (a compliance software vendor) agree that
  Article 50 has applied since 2 Aug 2026 and that the Omnibus only added the Article 50(2) marking
  transition; the 2 Dec 2027 date in the Goodwin alert is for Annex III high-risk systems. The
  Omnibus text itself (Regulation (EU) 2026/1744) was not read on EUR-Lex, the Ropes & Gray analysis
  returned 403, and the McCann FitzGerald page redirected. Article 3's provider definition was not
  re-fetched.
- **Netherlands.** The WOR summary is from a vendor blog (Praxikon). The statute was not read in
  Dutch.
- **Bot chats in Teams retention.** This rests on Practical365, not Microsoft Learn.
- **Glean expert search.** The page returned an empty body, so how Glean ranks experts was read from
  a search summary. The question-detection rules were confirmed on the admin-guide page.
- **Vendor and press figures.** Moveworks, Outset and Rovo numbers are vendor claims; the Rovo figure
  comes from Atlassian's own results release, and the Stanford sycophancy result from Fortune (the
  Science paper was not read).
- **People Skills.** Its expansion to E3 and E5 users is from a secondary blog and is not used in this
  design.
- **UA facts.** Whether UA populates Snowflake contacts or runs a catalog of record, its internal
  communications policies, and its EMEA works councils are marked [confirm].

## Sources

Microsoft Teams and Graph

- [Send proactive messages (updated 2026-10-13)](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [Proactively install your bot with Graph (2026-06-19)](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/proactive-bots-and-messages/graph-proactive-bots-and-messages)
- [Rate limiting for agents (updated 2026-07-27)](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/rate-limit)
- [Targeted messages (2026-07-17)](https://learn.microsoft.com/en-us/MicrosoftTeams/platform/agents-in-teams/targeted-messages)
- [Teams platform what's new](https://learn.microsoft.com/en-us/microsoftteams/platform/whats-new)
- [Universal Actions overview (2026-09-30)](https://learn.microsoft.com/en-us/microsoftteams/platform/task-modules-and-cards/cards/universal-actions-for-adaptive-cards/overview)
- [Up-to-date views](https://learn.microsoft.com/en-us/microsoftteams/platform/task-modules-and-cards/cards/universal-actions-for-adaptive-cards/up-to-date-views)
- [Universal Actions for search-based message extensions (60-user refresh)](https://learn.microsoft.com/en-ca/microsoftteams/platform/messaging-extensions/how-to/search-commands/universal-actions-for-search-based-message-extensions)
- [App setup policies (2026-05-12)](https://learn.microsoft.com/en-us/microsoftteams/teams-app-setup-policies)
- [Send message in a chat (Graph)](https://learn.microsoft.com/en-us/graph/api/chat-post-messages?view=graph-rest-1.0)
- [List manager (Graph)](https://learn.microsoft.com/en-us/graph/api/user-list-manager?view=graph-rest-1.0)
- [List people (Graph), maintenance-mode note](https://learn.microsoft.com/graph/api/user-list-people)
- [Get mailbox settings (Graph)](https://learn.microsoft.com/en-us/graph/api/user-get-mailboxsettings?view=graph-rest-1.0)
- [Get presences by user ID (Graph)](https://learn.microsoft.com/en-us/graph/api/cloudcommunications-getpresencesbyuserid)
- [People Skills AI inferencing](https://learn.microsoft.com/en-us/microsoft-365/copilot/people-skills-ai-inferencing)
- [Work Trend Index: Breaking down the infinite workday (Jun 2025)](https://microsoft.com/en-us/worklab/work-trend-index/breaking-down-infinite-workday)

Agent identity

- [How content is shared with agents in Microsoft 365, Agent 365 (2026-04-28)](https://learn.microsoft.com/en-us/microsoft-agent-365/share)
- [Entra Agent ID: owners, sponsors and managers](https://learn.microsoft.com/en-us/entra/agent-id/agent-owners-sponsors-managers)
- [Teams SDK Agent 365 guide](https://microsoft.github.io/teams-sdk/typescript/in-depth-guides/agent-365/)

Routing signals

- [Snowflake: using contacts](https://docs.snowflake.com/en/user-guide/contacts-using)
- [Atlassian tracker CONFCLOUD-84300: page owner history via API](https://jira.atlassian.com/browse/CONFCLOUD-84300)
- [Atlassian tracker CONFCLOUD-83342: audit trail for page owner changes](https://jira.atlassian.com/browse/CONFCLOUD-83342)
- [Rovo use case: find relevant information and experts](https://www.atlassian.com/software/rovo/use-cases/chat-relevant-information)

Policy and law

- [EU AI Act Article 50 (artificialintelligenceact.eu, secondary host of the official text)](https://artificialintelligenceact.eu/article/50/)
- [EU AI Act Annex III (same host)](https://artificialintelligenceact.eu/annex/3/)
- [Houthoff: AI Act transparency obligations and the AI Omnibus (Sep 2026, secondary)](https://www.houthoff.com/insights/news/ai-act-transparency-obligations-and-the-ai-omnibus-regulation/)
- [Goodwin: EU AI Act transparency obligations now in force (Aug 2026, secondary)](https://goodwinlaw.com/en/insights/publications/2026/08/alerts-technology-dpc-eu-ai-act-transparency-obligations-now-in-force)
- [Scytale: EU AI Act updates (Jul 2026, secondary, compliance vendor)](https://scytale.ai/resources/eu-ai-act-updates/)
- [Covington: works council rights in AI implementation projects (Jul 2026)](https://www.cov.com/-/media/files/corporate/publications/2026/07/works-council-rights-in-ai-implementation-projects.pdf)
- [Praxikon: works council consent for AI in the workplace (Jul 2026, secondary)](https://www.praxikon.com/en/posts/works-council-consent-ai-in-the-workplace)
- [Practical365: Teams chat retention (secondary)](https://practical365.com/deleting-teams-chat-files-automatically-using-purview/)

Prior art

- [Stack Internal: assign subject matter experts](https://support.stackenterprise.co/support/solutions/articles/22000294391-assign-subject-matter-experts)
- [Stack Overflow for Teams: speed up time to answer with tags (vendor)](https://stackoverflow.co/teams/resources/speed-up-time-to-answer-with-tags/)
- [Guru: verification (vendor)](https://www.getguru.com/features/verification)
- [Glean: expert search](https://docs.glean.com/actions/glean/expert-search)
- [Glean: Slack question detection](https://docs.glean.com/administration/platform/embedded-integrations/slackbot/admin-guide/customize-question-detection)
- [Atlassian: Rovo in Microsoft 365 and Teams (Aug 2026)](https://www.atlassian.com/blog/rovo/rovo-jira-microsoft-365)
- [Atlassian: Q2 FY2026 results, 8-K exhibit 99.1 (5 Feb 2026, vendor)](https://www.sec.gov/Archives/edgar/data/1650372/000165037226000008/ex991q2fy26.htm)
- [Moveworks: ambient agents](https://help.moveworks.com/docs/ambient-agents-overview)
- [Moveworks: Rewind 2025 (vendor)](https://moveworks.com/us/en/resources/blog/moveworks-rewind-2025-the-global-front-door-to-work)
- [Copilot Studio: send proactive Teams messages (2026-09-24)](https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-proactive-message)
- [Microsoft Inside Track: Facilitator (Apr 2025, vendor)](https://www.microsoft.com/insidetrack/blog/transforming-meetings-how-were-using-the-new-microsoft-365-copilot-powered-facilitator-feature-at-microsoft)
- [Microsoft Support: Facilitator in Teams meetings (license requirement)](https://support.microsoft.com/en-US/teams/copilot/facilitator-in-microsoft-teams-meetings)
- [Futurum: Slackbot GA (secondary)](https://futurumgroup.com/insights/salesforces-slackbot-goes-ga-is-this-the-real-test-for-agentforce/)
- [The Next Web: Slackbot's new capabilities (secondary)](https://thenextweb.com/news/slack-slackbot-30-ai-features-agentic)
- [Outset: Outset vs Listen Labs (vendor)](https://outset.ai/almanac/outset-vs-listen-labs-best-ai-research-tool-in-2026)
- [Xiao et al., Tell Me About Yourself, ACM TOCHI 2020](https://arxiv.org/abs/1905.10700)
- [Fortune: Stanford sycophancy study (Mar 2026, secondary)](https://fortune.com/2026/03/31/ai-tech-sycophantic-regulations-openai-chatgpt-gemini-claude-anthropic-american-politics)
