# Pattern: bot personas

The crew is the console's best adoption asset - named, faced teammates are easier to trust and
talk about than "the pipeline". Today they are a well-drawn mark and a name. This pattern turns
them into characters with a consistent job, voice and set of expressions, without letting the
persona leak into the work itself.

## What exists

- **Names and metadata** in [pipeline.ts](../../../ui/console/src/lib/pipeline.ts#L45-L90):
  Scout, Coach, Ref and Host, each with a job title, jersey number, role sentence, output name,
  model and identity hue. The naming is the 2026-09-28 entry "Plain stage names around a named
  crew" in [docs/decisions.md](../../decisions.md), which superseded 2026-08-28.
- **Faces** in [AgentFace.tsx](../../../ui/console/src/components/agents/AgentFace.tsx): one head
  shape, four crests (tick, X, tally marks, mic), eyes that blink only while working. Three
  states: idle, working, done. Faces need about 18px to read.
- **One voice, attributed output.** The conversation reads as one assistant; every turn and
  artifact is stamped with the agent that produced it (adjudication 4 in
  [docs/console-redesign.md](../../console-redesign.md)).

## Gaps

| Gap | Effect on non-technical users |
|---|---|
| The crew is explained only on the landing page | Once inside a project, "Coach starts when you approve" assumes you remember who Coach is |
| Three expressions | The face cannot say "I need you" or "something went wrong" - the two states that matter most |
| Identity hues collide with status hues | Ref's amber equals the warning color and Host's green equals success ([index.css](../../../ui/console/src/index.css#L39-L56)), so a Host chip reads as "all good" and a Ref chip as "careful" |
| No personality outside the name | Nothing in the product's copy sounds like a scout or a coach |
| The human is not on the team | The person signing a gate - the most important role - has no presence beyond an email address |

## Character bible

Each bot gets one card in this format. The persona shows up in greetings, status keywords and
the player card. **Artifacts and gates stay plain** - nobody should sign a document written in
character.

| | Scout | Coach | Ref | Host |
|---|---|---|---|---|
| Plain job title | Requirements analyst | Build planner | Quality reviewer | Demo producer |
| Number | 01 | 02 | 03 | 04 |
| One-line job | Turns your idea or FSD into a clear, cited list of what is needed | Turns the signed requirements into a build plan and an order to build it in | Checks what got built against the requirements and flags what falls short | Prepares the walkthrough and sample data to show it working |
| Hands over | Requirements brief | Build plan | Quality report | Demo script |
| Voice | Curious, precise, asks before assuming | Calm, structured, thinks in steps | Fair, direct, worst problems first | Warm, audience-aware |
| Looks at | Your brief, uploaded documents, Confluence, Jira, Snowflake, reference FSDs | The signed brief, GitHub repositories | Pull requests, builds, the brief and the plan | The brief and the quality report |
| Never does | Changes anything outside the conversation | Writes code | Merges code - people do that at Gate 3 | Invents features that were not built |
| Crest | Tick | X on a board | Tally marks | Microphone |
| Silence keywords | See [agent-states.md](agent-states.md) | | | |

Job titles and output names are the chosen Option A in [../vocabulary.md](../vocabulary.md)
and match `AGENT_META`; change them there first.

## Expressions

Extend `FaceState` from three to seven. Each is a small change to eye shape or position, so
the family stays recognizable at 18px.

| State | Eyes | When |
|---|---|---|
| idle | Open, still | Not running |
| working | Open, blinking (today) plus a slow left-right scan | A run is active |
| thinking | Glancing up | `thinking` heartbeat with no tool running |
| needs you | Wide, turned toward the gate or composer | Questions asked, or its output is at a gate |
| done | Closed arcs (today) | Output handed over |
| blocked | Flat line | Error or stopped |
| handoff | Turned toward the next bot | The moment a gate is signed - the authored handoff moment |

Reduced motion keeps the shape change and drops the blink and scan.

## Player cards

A card per bot, reusing the sports vocabulary the crew already carries.

- **Front:** dithered or halftone portrait (see [visual-language.md](visual-language.md)), the
  jersey number in the stencil lockup, the name, plain job title and one-line job.
- **Back (flip):** what it looks at (source marks for Confluence, Jira, GitHub, Snowflake and
  uploaded files), what it hands over, and what it never does.
- **Stats, only if real.** Projects handled, average completeness at its gate, median run
  time - computed from data we already store. Do not invent numbers to fill the card.
- **Where it appears:** the crew section on the landing page and Home; a hover card on any
  avatar in the thread (Kobra `hover-card`); the onboarding tour's first screen.
- Asset brief: [../asset-briefs.md](../asset-briefs.md).

## The human on the team

At a gate, the signer is the fifth player. Show their Entra photo or initials in the same
circle treatment as the bots, their name in the stencil lockup, and "Your call" as the
station label. The signed checkpoint carries their mark the way a turn carries a bot's.

## Guests

GitHub Copilot does the building between Gate 2 and Gate 3. It is not crew: give it its own
neutral mark (the GitHub glyph from Simple Icons, monochrome) and the label "Copilot (GitHub)",
never a face.

## Hue fix

**Done 2026-09-28.** Identity colors must not equal a status color. Scout teal and Coach
indigo stay; Ref moved to violet (`#6b3fa0`, dark `#b995f0`) and Host to magenta (`#a3287f`,
dark `#f07ac8`). Magenta beat copper because copper sat 16-20 degrees of hue from danger
and warning; magenta is 31 degrees from UA red and at least 51 from everything else. Worst
case contrast is 5.74:1 across own background, surface, canvas and sunken in both themes;
the ratios are recorded in [index.css](../../../ui/console/src/index.css).

## Rules

- Persona voice in greetings, status keywords, empty states and player cards only.
- Never in errors, gate copy, artifacts or anything a person signs.
- A bot never jokes about a failure (detail.design `easter-egg` skip rule).
- The persona does not change what the bot is allowed to do. Tool permissions live in
  `src/tools/` and are not a design decision.
