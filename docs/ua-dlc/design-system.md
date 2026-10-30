<!-- cspell:words Baselayer Baselayer's Chivo Demi NeuePlakUAText rgba tnum nowrap tablist radiogroup sparklines keycap keycaps Haddad Rina wireframes -->

# HyperDelivery on Baselayer

| | |
|---|---|
| Status | Proposal for review, updated 2026-10-27 (the side nav, the project workspace and the stop at Inception arrived 2026-10-26; the review fixes followed on 2026-10-27). Values marked (proposed) are HyperDelivery extensions that need UA Brand review (section 15) |
| What it is | The design system the console adopts: tokens, type, space, shape, the app shell, component specs and icons. It is the visual source of truth. Where [ux-direction.md](ux-direction.md) and this document disagree on a visual value, this document wins; ux-direction.md still governs the experience, the screens and the copy |
| Scope | Desktop and laptop browsers, 1280 px wide and up, in the light theme (section 11) |
| Built on | Baselayer, Under Armour's internal web design system (the Figma library `00_UA_Baselayer_Library_Web` and its `baselayer-design-system` skill). The evidence, the Baselayer conflicts and the font research are in [baselayer-for-hyperdelivery.md](research/baselayer-for-hyperdelivery.md) |
| Concept screens | [HyperDelivery concepts canvas](https://claude.ai/artifact/BUcEKzAz1CXa27EY398sAF) (private until shared), with a standalone copy in the repo under `docs/ua-dlc/site/concepts/`. Every board uses this system; three are its galleries: The line, Brand and foundations, and Components |
| Figma | [HyperDelivery · Variant B](https://www.figma.com/design/TvkJQitUv5BjF9YmgTMGut), the polished Variant B in the owner's personal Figma team: this system's tokens as variables, its type as text styles, its components, and the screens. The screens' source and its status are in `docs/ua-dlc/site/variant-b/README.md` |
| Adopted in | `ui/console/src/index.css` (tokens), the shell, and the components in section 9, as part of the Final MVP console look ([ux-direction.md section 13](ux-direction.md#13-what-changes-in-todays-console)) |

Labels: **(proposed)** marks a HyperDelivery extension that Baselayer does not publish. Values without a label
are published Baselayer values, or a direct use of one.

## 1. Why this exists

Six independent audits of the round-three concept screens, and the owner's own words ("not spaced or sized
correctly", "something missing that ties it together"), found the same five problems:

1. **Every screen was built as its own page, not as a screen of one product.** Four content widths, four left
   edges, six navigation sets, four search fields, six tab styles and five page-header shapes. Moving between
   screens felt like switching products.
2. **Baselayer values were borrowed but not followed.** 30 font sizes (88 uses below 11 px), six weights, 70
   tracked ALL CAPS eyebrows, 148 hex values (63 of them grays, `#e6e6e6` alone 261 times), 19 radii and black
   buttons in 10 heights. Each screen was reasonable alone; no two used the same set of values.
3. **No color had a single meaning, and the color that was there was a stock palette.** The same Build, Plan
   and Discover data was three blues on one screen and indigo, sky and violet on another. Selection used blue
   tints, agent hues leaked into Layer 1, and five sparklines came in five hues.
4. **There was no depth.** White boxes on white with pale hairlines, nested three or four deep, read as
   documents rather than an app.
5. **Trust broke on contact.** Broken logos, the same placeholder chart in six places, ids and statuses that
   wrapped ("AC- / 1", "Waiting on / you"), and labels with missing spaces ("Start with6facts").

The shipping console has its own drift: `#e4002b`, which is not UA red, as the accent and the focus ring;
Geist; three text tiers; and separate danger, warning and info colors with tinted backgrounds.

The opposite failure is just as real. The owner called version 2 "too black and white and grayish" and said the
round-three color "makes it look much better". So the bar is **more consistent and no less colorful**: fewer
values, used the same way everywhere, with color that comes from what is real (section 3.4).

## 2. Principles

1. **One shell, one workspace.** Every screen uses the same side nav and the same slim 56 px top bar (section
   7). List screens use Baselayer's 12-column grid (24 px margins, 16 px gutters) inside the main area; every
   project screen is the same workspace, the conversation beside the artifact panel (section 7.4).
2. **Baselayer, used literally.** Baselayer role tokens, its type scale, two weights, Title Case UI labels, the
   8/16/24/32/56 rhythm, 4 and 8 px radii plus pills, and the `#0096FA` focus ring. When density needs a value
   Baselayer lacks, add it as a named, flagged proposal. Never improvise a value.
3. **Three planes, one level of nesting.** The main surface is white. The side nav and the backdrop behind the
   artifact panel are `#F9F9F9`. Panels on white take a 1px `#D0D0D0` edge; the white artifact panel on its
   `#F9F9F9` backdrop takes `#F0F0F0`. Floating layers get Baselayer elevation. A surface never contains
   another bordered surface; use a divider or a band inside it.
4. **One meaning per color.** Chrome is ink and neutrals. Red means only "waiting on you" (HD-R1, section 3.3).
   Green means passed or accepted. Brand marks, people and systems carry the rest of the color (section 3.4).
   Selection is weight in the side nav and an ink outline elsewhere, never a tint.
5. **UA's logo leads; the line is HyperDelivery's own.** The side nav opens with the UA logo, so the product reads
   as a UA offering (section 8). The three-notch line is HyperDelivery's product mark. One line component, in two
   sizes, appears identically everywhere. The approval card and the decision bar, with the red notch, are the
   single key moment on any screen.
6. **Everything real, nothing broken.** Marks come from one registry with a monogram fallback. Real product
   frames, never placeholder charts. Ids and statuses never wrap, and every label with a value inside it is built
   whole. Every grid is sized to its item count.
7. **States are part of the design.** Focus, hover, selected, disabled, loading, success, empty and error are
   specified for every component. Once a state is done it becomes a status ("Confirmed", with an Undo link),
   never a primary button.

### 2.1 Rulings

The audits and the owner's reviews settled these. Each ruling is binding and is logged as a decision (section 16).

| Question | Ruling | Why |
|---|---|---|
| Side nav or top bar (2026-10-26; replaces "Top bar, 56 px") | **A 248 px side nav, collapsible to a 64 px rail (⌘B), plus a slim 56 px top bar** that holds only the page name or breadcrumb, page actions and Help | The owner asked for an app as simple as ChatGPT, Claude Desktop or Gemini, which all navigate from a left sidebar; Baselayer's own Account Navigation (`9286:10835`) is a left list with weight-only selection; the rail gives the line, tables and canvases their width back |
| Page background (2026-10-26) | **White main surface; `#F9F9F9` for the side nav and behind the artifact panel** | The nav and the artifact backdrop are the second level that makes it read as an app; the conversation and lists read best on white |
| Panel edge | **`#D0D0D0` for panels and cards on white; `#F0F0F0` for dividers, the shell's rules and the white artifact panel on its `#F9F9F9` backdrop** | On white a `#F0F0F0` edge disappears, so panels there keep `#D0D0D0`; the artifact panel is carried by white against `#F9F9F9`; `#E6E6E6` is not a UA value |
| Page title size | **Heading XL 32/40 for a page's one title** (Home's question, a list page's title); project pages have none (the top bar's breadcrumb names the project, the artifact header is Heading MD); Heading 2XL 40/50 only for the first-run hero | One size by role keeps titles identical across screens |
| Radius | **8 for surfaces, 4 for controls, pills for buttons** | A clear difference between surfaces and controls |
| Right rail width | **9 + 3 columns of the main area where a screen keeps a right rail** (854 + 274 at 1440 with the side nav open); Home and project screens have none | A 3-column rail keeps the main column wide for tables; at full width it was 336, Baselayer's form-field width |
| Search (2026-10-26) | **A Search row in the side nav with a ⌘K keycap**, opening the command palette | It is a launcher, not a form field; the top bar no longer has room or need for one |
| Control heights | **44 for page and gate actions; 40 for New Project and Home's send button; 36 compact and side nav rows; 32 for segmented controls, chips, Recent rows and the Help button; never below 32, at least 8 px apart** (side nav rows sit 2 px apart, inside one list) | Baselayer's own toggle and PDP chip are 32; WCAG 2.5.8 needs 24 |
| Text floor | **12 px, no exceptions** | Baselayer's floor; avatar initials and `+N` counts fit at 12 |
| Condensed type | **Banned.** Durations are tabular figures with lowercase units ("5d 2h") | Condensed caps imitate UA's display cut and break Baselayer's no-condensed rule |
| Case | **Title Case for the UI's own words; sentence case for content; project names as typed** | Baselayer core rule (section 4.3) |
| Data color | **Stages, statuses and counts on the ink ramp; systems in their brand hue; people in their fill** | Ink is unmistakably UA; the rest of the color is real (section 3.4); `#0096FA` is reserved for focus |
| Avatars | **One fill per person, from a deeper, less saturated set** | Identity is data and drives the decision-timeline lanes; stock indigo and violet read as a template |
| Caution and danger | **Retired.** Long waits are Bold ink age plus a clock glyph; failures are an X glyph plus words in ink | Baselayer has neither role, and a second warm color competes with red |
| Colored left rules | **Removed everywhere** | A common template trope; identity comes from the mark and the name |
| Red commit button | **Never.** "Sign and Accept" is the black primary | A red commit would make approving the favored answer over sending back |
| Inbox row actions | **In the Inbox the first (oldest) row gets the 44 black primary and the others the 36 secondary; on Home every row gets the 36 outlined secondary** | One clear next step; on Home the composer's Start is the page's one black button |
| New Project (2026-10-26; replaces the top bar's "Start a Project") | **An outlined 40 px pill at the top of the side nav**, on every screen | Always one click away, as New Chat is; the page's own action stays the only black pill on a screen |
| Where help lives | **A "?" button at the right end of the top bar**, opening a small menu | Help is not an area; one path to it from every screen, and the Library keeps only what UA knows |
| Screen sizes and themes | **Desktop and laptop at 1280 px and up; light only** (section 11) | HyperDelivery is used at a desk; one layout and one theme keep the system small while the Final MVP is built |
| Orchestrator hue | **Ink** | HyperDelivery's own color is its black mark |
| Where approvals happen (2026-10-26; replaces "Approval header") | **An approval card in the conversation and the decision bar at the foot of the artifact panel**, beside the evidence; no separate approval page | The decision moment sits where the evidence is, inside the project's one workspace |
| Running work and waits (2026-10-26) | **UA's three-dot loader for system work; a clock glyph and the age for a person's wait** | Baselayer's loading vocabulary is the three-dot loader (`1975:18969`); a rotating ring clipped in the trace playback and is not a UA pattern |
| Mono family | **Chivo Mono 400 and 600**; Geist Mono if 0 and O, or 1, l and I, fail at 12 px | Same designer as Archivo, a true 600 for badges, and not another company's voice |

## 3. Color

### 3.1 Role tokens

Tokens are named by Baselayer role, so a Figma `get_variable_defs` result maps straight onto the console's CSS.
In `index.css` each role is `--color-<role>` (for example `--color-surface-container-high`); HyperDelivery
meanings are `--hd-*` aliases that point at a role (section 3.2). Components use roles and aliases, never hex.

| Token | Baselayer source | Value | Use |
|---|---|---|---|
| `background` | `color/background/primary` | `#F9F9F9` | The side nav and the backdrop behind the artifact panel (since 2026-10-26; the main surface is `surface`) |
| `surface` | `Surface/surface` | `#FFFFFF` | The main surface, the top bar, the line strip, the conversation, the artifact panel, cards, tables, menus, dialogs |
| `surface-container` | `surface container` | `#F9F9F9` | Bands inside a surface: table toolbar, provenance strip, a card's thumbnail band, Home's one-line empty note, row and tool-call hover |
| `surface-container-high` | `surface container high` | `#F0F0F0` | The requester's message bubble, selected row and option fill, tags, side nav and menu-row hover, the rail's current item, read-only fields, segmented hover, icon-button hover, skeletons |
| `inverse-surface` | `inverse surface` | `#1D1D1D` | Decision card strip, toast, tooltip, product mark tile |
| `on-surface` | `on surface` | `#1D1D1D` | All primary text and icons, and links (hover `#444444`) |
| `on-surface-variant` | `on surface variant`, `color/foreground/secondary` | `#5F5F5F` | Secondary text, meta, placeholders, table headers, inactive tabs and nav |
| `on-inverse-variant` (proposed) | none | `#D0D0D0` | Secondary text on the inverse strip |
| `primary` / `on-primary` | `primary` / `on primary` | `#1D1D1D` / `#FFFFFF` | Primary button (hover `#444444`, pressed `#5F5F5F`), selected segment, selected filter chip |
| `secondary` / `on-secondary` | `secondary` / `on secondary` | `#FFFFFF` / `#1D1D1D` | Secondary button fill and label |
| `tertiary` | `tertiary` | `#F9F9F9` | Object chip fill |
| `outline` | `outline` | `#1D1D1D` | Secondary button ring, selected card (2px), selected option row (1px), Decision card edge |
| `outline-field` | the `Outline` variable | `#5F5F5F` | Text input and textarea stroke at rest (3:1 non-text contrast) |
| `outline-variant` | `outline variant` | `#D0D0D0` | Panel and card edge on white, chip and starter ring, logo tile ring, segmented border, menu ring |
| `stroke-tertiary` | `color/stroke/tertiary` | `#F0F0F0` | The side nav's right rule, the top bar's and line strip's bottom rules, the conversation's right rule, the artifact panel's edge, row dividers, dividers inside a panel or menu, stat-strip separators |
| `disabled` / `on-disabled` | `button/disabled` | `#D0D0D0` / `#FFFFFF` | Disabled button fill and label (exempt from contrast) |
| `icon-disabled` | gray `#949494` | `#949494` | Disabled icons, dashed future line segments, the upcoming notch, the composer's 1px stroke (3.03:1, enough for a non-text edge). **Never text**, except the label of a locked artifact tab, which is an inactive control |
| `critical` / `on-critical` | `critical` / `on critical` | `#DC0019` / `#FFFFFF` | The red notch, the Inbox marker, the side nav's Inbox count and Recent-row notch, the Waiting on You capsule, a field error stroke |
| `status-error` | `status/error` | `#DC0019` | Red text that names the viewer ("Your Approval: The Plan"), field error messages |
| `status-success` | `status/success` | `#00834B` | "Met", "Passed", "Accepted", "Confirmed" as glyph plus word on a surface; never a tinted pill |
| `status-accent` | `Color/Secondary/accent orange` | `#FE9000` | The NEW badge fill (ink text) and the provenance strip's 2px top rule. **Never text** |
| `focus` | Focus stroke | `#0096FA` | The focus ring (section 6.4) |
| `scrim` (proposed) | none | `rgba(29,29,29,0.4)` | Behind dialogs and the Teams task module |

Baselayer's light neutrals are `#1D1D1D`, `#444444`, `#5F5F5F`, `#949494`, `#D0D0D0`, `#F0F0F0`, `#F9F9F9` and
`#FFFFFF`. No other gray exists in this system.

Every concept board loads one shared style block that applies these values: `color-scheme: light`, the white
body, ink links with a `#444444` hover, the `#0096FA` focus ring and its variants (section 6.4), button, chip and
row hovers, the 32 px icon button and the menu (section 9.23). Product boards add the `hd-shell` rules (the side
nav, the rail and the three-dot loader, section 7.1) and project boards the `hd-workspace` rules (section 7.4),
copied verbatim from the two reference boards, `Main.dc.html` and `Start.dc.html`. Board-specific rules come
after them.

### 3.2 HyperDelivery aliases

| Alias | Points at | Value | Use |
|---|---|---|---|
| `--hd-decision` | `critical` | `#DC0019` | Every red fill that means "waiting on you" |
| `--hd-decision-text` | `status-error` | `#DC0019` | Red text that names the viewer |
| `--hd-data-1` | `on-surface` | `#1D1D1D` | First series of stages, statuses or counts (Prototype); sparklines; bar-in-cell |
| `--hd-data-2` | `on-surface-variant` | `#5F5F5F` | Second series (Plan) |
| `--hd-data-3` | the `#949494` primitive | `#949494` | Third series (Discover); 3.03:1, the minimum for a value mark |
| `--hd-data-track` | neutral primitives | `#D0D0D0` | The remainder of a capped bar (a budget). Never a value mark |
| `--hd-agent-orchestrator` | `on-surface` | `#1D1D1D` | The orchestrator in Layers 2 and 3 |
| `--hd-agent-cortex` | none | `#0EA5E9`, tint `#E7F6FD` | Cortex Code data specialist |
| `--hd-agent-reader` | none | `#0D9488`, tint `#E6F6F4` | Resource reader |
| `--hd-agent-coding` | none | `#7C3AED`, tint `#F3EDFF` | Coding agent ("AgentCore harness, in the sandbox"), shown by the `terminal` glyph in this hue's tile, never the Copilot mark; a "Second engine (swap test)" is dashed as arriving in Enterprise |
| `--hd-agent-review` | none | `#475569`, tint `#EEF1F5` | Reviewers and the prototype's checks |
| `--hd-agent-atlassian` | none | `#1868DB` (brand) | Atlassian delegate |
| `--hd-agent-m365` | none | `#5B5FC7` (brand) | Microsoft 365 delegate; also Teams-native controls inside Teams chrome |
| `--hd-series-<system>` (proposed) | none | Section 3.5 | A data series that is a system |
| `--hd-person-1` to `--hd-person-10`, `--hd-person-other` (proposed) | none | Section 3.6 | Avatar fills and decision-timeline lanes |

Agent hues are for Layers 2 and 3 only: trace bars, lanes, delegation markers and architecture zone edges. A
label beside an agent hue stays in `on-surface`; agent hues are never text.

### 3.3 The red rule, HD-R1

**Red is `critical`, and critical means waiting on the viewer.** Baselayer gives `#DC0019` two jobs, `critical`
(transaction buttons such as Place Order) and `status/error` (a wrong password). `critical` is defined as
high-emphasis attention, and a field error is literally waiting on the person typing, so HyperDelivery narrows
both to one meaning without inventing a token.

- **Allowed:**
  1. A solid "waiting on you" marker: the 8 px square in an Inbox row or a Recent row in the side nav, or the notch
     on the line.
  2. The Inbox count, a pill with a white tabular numeral.
  3. One filled capsule per view region ("Waiting on You"): white text on `#DC0019`.
  4. Errors in a form field the viewer is filling in: red stroke, red 12/20 message, alert icon.
  5. Red text, only where it names the viewer ("Your Approval: The Plan"), at most one red label per view
     region; repeats are ink.
- **Never:** buttons, charts, deltas, diff deletions, links, selection, focus, avatar fills or rings, destructive
  actions, decoration, brand moments, halos or tints around a red shape, a project card's status line that does
  not name the viewer, a budget, a failure that waits on someone else, and failures the platform handles itself.
- **Signer lists** show the viewer as Bold ink "You, now", not a red capsule or a red ring on the avatar.
- **Buttons.** HyperDelivery does not use Baselayer's `Btn/Tertiary/Red-Critical`. A gate's commit ("Sign and
  Accept") is the black primary, with "Send Back" beside it as a secondary. Destructive actions ("Revoke
  Access", "Archive") use the secondary button with a leading X and a confirmation that states the consequence.
- **Failures.** A failure the platform will retry or report shows in ink: an X glyph and plain words with the
  next step ("Build failed at step 4", "Retry From This Step"). When the failure needs the viewer to decide
  (retry, stop, or tell the platform team), it gains the red marker, because now it is waiting on them.
- **A person's wait.** Ink plus age, never a loader. In the conversation and on the line strip it carries a
  14 px clock glyph and the age in Regular ("Waiting on Dana, 4m"). In dense rows (tables, cards, the line column
  of Projects and Portfolio) a short wait is Regular text with no glyph ("Waiting on Dana in Finance, 1d"). At two
  business days or more in the waited-on person's time zone, everywhere, the age turns Bold and carries the clock.
  No amber, and no red unless the viewer is the one being waited on.
- **Form.** Red is always a solid shape with a label, never color alone.
- **Test.** Hide everything on the screen except red. Each remaining red element must answer "what do I need to
  do?" At most one filled capsule per region.

### 3.4 Color from what is real

The owner's two reactions set the color bar together: version 2 was too gray, and the round-three color made
the screens look much better. This system keeps that color and gives each kind one meaning. It wins over every
other color rule in this document.

1. **Brand marks in full color** wherever a system is named: object chips, logo stacks, Sources, Connectors, the
   side-effect ledger, trace rows, architecture nodes and Inbox chips. The one-color `#444444` variant is allowed
   only for red-heavy marks (Claude, Streamlit) in a dense Layer 1 row within 24 px of a red notch, so they never
   compete with it. Everywhere else, marks keep their colors.
2. **Data series that are systems take the system's brand hue;** series that are people take the person's fill;
   series that are stages, statuses or counts use the ink ramp (section 3.5).
3. **People keep their fills** on avatars and on their decision-timeline lanes (section 3.6).
4. **Layer 2 and 3 views keep the agent hues vividly:** Activity's Decisions and Trace views, the architecture
   canvas, the Lifecycle map and the lanes.
5. **Status color stays:** the green glyph plus word for passed and accepted, red for waiting on you, and the
   `#FE9000` NEW badge and provenance rule.
6. **Thumbnail check.** Every Layer 1 screen shows brand marks in color and colored avatars. If a screen reads as
   grayscale at thumbnail size, add the real marks or people it is missing, never decoration.

### 3.5 Data and charts

Baselayer has no data palette, so this is a HyperDelivery extension.

| A series that is | Takes | Values |
|---|---|---|
| A stage, status or count | The ink ramp | `--hd-data-1` `#1D1D1D`, `--hd-data-2` `#5F5F5F`, `--hd-data-3` `#949494`; `--hd-data-track` `#D0D0D0` only for a remainder |
| A system | Its brand hue, `--hd-series-<system>` (proposed) | Snowflake `#29B5E8`, Amazon Bedrock `#3D8FFF`, GitHub `#181717`, Atlassian `#1868DB`, Microsoft Teams `#6264A7`, SharePoint and OneDrive `#0078D4`, Excel `#217346`, Tableau `#E97627` |
| A person | The person's fill | Section 3.6 |

- **Never red** in a chart, and green only for "passed" or "accepted".
- **Every series is directly labeled,** with one marker per legend item, so color never stands alone. Six series
  at most; the rest group into "Other" in `--hd-data-3`.
- **Single-series micro-visuals are ink.** A sparkline is a 1.5 px `--hd-data-1` polyline with a 2 px radius end
  dot and no area fill. A bar-in-cell is a 64 × 8 ink bar with a 1 × 12 `#5F5F5F` target tick and no track.
- **Deltas** are an ink arrow glyph plus words ("−14 pts"), never red and never green.
- **Stacked bars** are 6 px tall with 2 px gaps in the surface color and direct labels underneath.
- **A capped value** (a budget) is an ink bar over a `--hd-data-track` remainder, with an alert tick at the
  threshold.

### 3.6 People

One fill per person, with white 12 px Bold initials. Every fill passes AA with white. Fills are never red, green
or amber. The console assigns a fill from this set by a stable hash of the person's directory id, so a person
keeps one color everywhere (proposed).

| Token | Fill | White on fill | On the canvas |
|---|---|---|---|
| `--hd-person-1` | `#3D4B8C` | 8.13:1 | Maya Chen |
| `--hd-person-2` | `#2F6B5E` | 6.20:1 | Jordan Lee |
| `--hd-person-3` | `#6A4C8C` | 6.94:1 | Dana |
| `--hd-person-4` | `#2E6A8E` | 5.89:1 | Luis Romero |
| `--hd-person-5` | `#4A5560` | 7.61:1 | Omar Haddad |
| `--hd-person-6` | `#2F6F78` | 5.73:1 | Sam |
| `--hd-person-7` | `#3F5FA0` | 6.26:1 | Priya Nair |
| `--hd-person-8` | `#6B5A4E` | 6.57:1 | Rina |
| `--hd-person-9` | `#3F4A55` | 9.04:1 | Kim Patel |
| `--hd-person-10` | `#2D6470` | 6.63:1 | Ana Ruiz |
| `--hd-person-other` | `#444444` | 9.74:1 | Anyone else |

In the decision timeline a person's span uses the same fill: solid for deciding, a 1px outline for asked, and
hatched gray for waiting on them.

### 3.7 What retires, and what each old token becomes

| ux-direction v3 | Console `index.css` today | Becomes |
|---|---|---|
| `ink` `#1d1d1d` | `--color-fg` `#101010` | `on-surface` `#1D1D1D` |
| `canvas` `#ffffff` | `--color-canvas` `#fafafa` | `background` `#F9F9F9` |
| `surface` `#f9f9f9` | `--color-surface`, `--color-overlay` `#ffffff` | `surface` `#FFFFFF` for panels; `surface-container` for bands inside them |
| `field` `#f0f0f0` | `--color-sunken` `#f1f1f2` | `surface-container-high` `#F0F0F0`; object chips use `tertiary` |
| `line` `#e6e6e6` | `--color-line` `#dcdce0`, `--color-line-subtle` `#eaeaec` | `outline-variant` `#D0D0D0` for edges and rings; `stroke-tertiary` `#F0F0F0` for dividers |
| `control-border` `#8a8a8a` | `--color-line-strong` `#c2c2c8` | `outline-field` `#5F5F5F` |
| `muted` `#5f5f5f` | `--color-fg-muted` `#5a5a5e`, `--color-fg-subtle` `#6a6a6f` | `on-surface-variant` `#5F5F5F`. Two text tiers, not three |
| `focus`: ink ring | the accent (red) ring | `focus` `#0096FA` |
| `decision` `#dc0019` | `--color-accent`, `--color-ua-red` `#e4002b`, `--color-accent-text` `#c2001f` | `critical` `#DC0019`. It is 5.18:1 on white, so no darker text variant is needed |
| `on-decision` | `--color-fg-on-accent` | `on-critical` `#FFFFFF` |
| `decision-tint` | `--color-accent-bg`, `--color-accent-line` | Retired: the solid marker carries the meaning |
| `danger` `#8e1b12` | `--color-danger`, `--color-danger-bg` | Retired: ink, an X glyph and words (HD-R1) |
| `success` `#00834b` | `--color-success` `#0e7a4d` | `status-success` `#00834B` |
| `success-tint` | `--color-success-bg` | Retired: the green glyph and word sit on the surface |
| `caution` `#8a5a00` | `--color-warning` | Retired: Bold ink age plus a clock glyph |
| `caution-tint` | `--color-warning-bg` | The provenance strip: `surface-container` with a 2px `status-accent` top rule |
| `selected` `#f5f7ff` | none | `surface-container-high` plus a 2px `outline` |
| none | `--color-info`, `--color-info-bg` | Retired: Baselayer has no info blue, and `#0096FA` is focus only |
| v3's dark value for each token above | the dark theme block and its theme switch | Retired for now: light only (section 11) |
| Agent hues, indigo orchestrator, tints and text shades | `--color-distill`, `--color-blueprint`, `--color-review`, `--color-showroom` and their `-bg` | `--hd-agent-*`, Layers 2 and 3 only; the orchestrator is ink |
| Data palette: sequential blues and a categorical set | none | The ink ramp, system brand hues and person fills (section 3.5) |
| Archivo with a width axis; Geist Mono | `--font-sans` Geist, `--font-mono` Geist Mono | Archivo 400 and 700 at normal width; Chivo Mono (section 4.1) |
| Headings 18 to 32, chip text 11.5 to 12.5 | `--text-2xs` to `--text-2xl` (12, 13, 14, 15, 18, 22, 28) | The app type scale (section 4.2) |

### 3.8 Contrast of the pairs that matter

WCAG 2.2 ratios, computed:

| Pair | Ratio | Rule |
|---|---|---|
| `#1D1D1D` on `#FFFFFF` / `#F9F9F9` / `#F0F0F0` | 16.86 / 16.01 / 14.79 | Body text |
| `#5F5F5F` on `#FFFFFF` / `#F9F9F9` / `#F0F0F0` | 6.39 / 6.07 / 5.60 | The lightest text, and the field stroke |
| `#949494` on `#FFFFFF` | 3.03 | The lightest value mark. Never text |
| `#D0D0D0` on `#FFFFFF` | 1.54 | Decorative edges only, so never a field stroke |
| `#DC0019` on `#FFFFFF`; white on `#DC0019` | 5.18; 5.18 | Red text; the red capsule |
| `#00834B` on `#FFFFFF` | 4.83 | Success text, never on a tint |
| `#FE9000` on `#FFFFFF`; `#1D1D1D` on `#FE9000` | 2.28; 7.39 | Never orange text; ink on the NEW badge |
| `#0096FA` on `#FFFFFF` / `#F9F9F9` / `#1D1D1D` | 3.11 / 2.96 / 5.41 | Focus ring; needs a white separator on gray containers, none on the inverse surface (a toast's Undo) |
| `#D0D0D0` on `#1D1D1D` | 10.93 | Secondary text on the inverse strip (`on-inverse-variant`) |

## 4. Type

### 4.1 Families

| Role | Production | Stand-in until Brand licenses UA type | Stack |
|---|---|---|---|
| UA Text | `NeuePlakUAText`, the face ua.com self-hosts, most likely the cut Baselayer calls "UA Text" (confirm with Brand) | **Archivo** at normal width, weights 400 and 700 only. Its average width is 0.987× Arial against UA Text's 0.985×, the closest of six candidates, so copy that fits now still fits later | `Archivo, Arial, sans-serif` |
| UA Technical and identifiers | UA Technical, a Demi Mono | **Chivo Mono** 400 for identifiers, 600 for badges | `'Chivo Mono', ui-monospace, monospace` |

- **The canvas** loads both stand-ins in one Google Fonts request:
  `https://fonts.googleapis.com/css2?family=Archivo:wght@400;700&family=Chivo+Mono:wght@400;600&display=swap`.
  No width axis and no other weights.
- **The console** self-hosts the same four styles in place of Geist; the font package is a new dependency and is
  logged as one. If Brand licenses UA Text, swap to it with UA's own metric-matched Arial fallback
  (`size-adjust: 98.54%`, `ascent-override: 104.93%`, `descent-override: 24.96%`, `line-gap-override: 0%`), so
  nothing shifts on load, and check optical centering in 44 px buttons and 24 px chips: UA Text's line box is
  about 1.28 em against Archivo's 1.09 em.
- **Never upload UA fonts to a published canvas** without Brand's approval; a published artifact redistributes
  the files.
- **Root.** `font-family` from the stack above, `color: on-surface`, and `font-variant-numeric: tabular-nums`.
  Confirm Archivo's `tnum` in a browser specimen; if it is missing, set changing numbers in the mono.
- **Mono check.** Before Chivo Mono ships, check 0 against O and 1 against l and I at 12 px; Jira keys and hashes
  depend on it. If it fails, Geist Mono does both mono jobs.

### 4.2 The app type scale

Seven sizes (12, 14, 16, 20, 24, 32, 40), plus one proposed for dense rows (13, Label Dense), and two
weights (400, 700). There is no 15 px text. Every role is a Baselayer style unless marked. The role names follow
Baselayer Ignite's new `NEW UA Styles` naming (the web library's components still bind its `(Old)` styles); Label
SM and the roles marked proposed are HyperDelivery's own. In `index.css` each role becomes a `--text-<role>` pair,
size and line height, in rem (proposed naming).

| Role | Size / line height | Weight | Case | Used for |
|---|---|---|---|---|
| Heading 2XL | 40 / 50 | 700 | Title Case | Reserved; no product screen uses it now that first run opens with Home's Heading XL question |
| Heading XL | 32 / 40 | 700 | Title Case for UI titles; project names as typed | A page's one title: Home's question ("What Do You Want to Make?"), a list page's title |
| Heading LG | 24 / 30 | 700 | Title Case | Working-session stage title, dialog title |
| Figure (proposed alias of Heading LG) | 24 / 30 | 700, tabular, unit at 16/20 Regular | n/a ("9 days", "12d 1h", "3 of 8") | Stat-strip figures everywhere |
| Heading MD | 20 / 24 | 700 | Title Case | Section headings on a page ("Waiting on You", "Pick Up Where You Left Off"), the artifact panel's title, Lifecycle phases, the Decision card title |
| Heading SM | 16 / 20 | 700 | Title Case for UI headings; project names as typed | Card titles, rail panel headings, group headers in lists, section headings inside the artifact panel ("Evidence, Criterion by Criterion", "What It Skips"; the panel's title is its one 20 px line), the wordmark in the side nav |
| Heading XS | 14 / 18 | 700 | Title Case | Every former eyebrow: rail sub-sections, labels above field groups, the decision label |
| Body MD | 16 / 24 | 400 | Sentence | Reading text: the brief and other artifact text in the panel (measure at most 640 px), plans on their own page, criteria, statements to confirm, the Home composer, any paragraph over two lines. Measure at most 680 px |
| Body SM | 14 / 20 | 400 (700 for emphasis) | Sentence | Default UI text, table cells, list rows, card text, meta lines that carry facts, the top bar's page name and breadcrumb, the requester's message bubble, the workspace composer. Multi-line sentences in a Message banner or an empty block take 14/24 (Baselayer `Body/Regular`) |
| Body XS | 12 / 18 | 400 | Sentence | Metadata, helper text, timestamps, footnotes, system notes in the conversation, the line strip's note, version lines |
| Label SM | 14 / 18 | 400; 700 when selected | Title Case | Side nav items, page tabs, field labels, menu items, filter chip labels, Home's starters |
| Label XS | 12 / 16 | 400; 700 for headers and status words | Title Case for UI words; data as written | Table headers (700, `on-surface-variant`), tags, object chips, status words, segment names, gate labels and split times on the line, the side nav's Recent heading and the account row's workspace |
| Label Dense (proposed) | 13 / 18 | 400; 700 when selected or as a card title | Title Case for UI words; data as written | Recent rows in the side nav, artifact tabs, tool-call rows, answer and suggestion chips, artifact-card and look titles, the artifact header's ghost buttons, a project card's status line, the progress row |
| Body Chat (proposed) | 14 / 22 | 400 | Sentence | HyperDelivery's turns in the conversation |
| Button | 14 / 20 (12 / 16 on 32 px controls) | 700 | Title Case | Every button and button-styled link |
| Duration | The size of its row (12/18 in Home's and the Inbox's rows, 12/16 on the line) | 400, tabular; 700 for elapsed totals and for waits of two business days or more | Lowercase units, no caps ("1d 4h", "3h 10m", "42m") | Inbox waits ("Waiting 1d 4h", Regular), elapsed totals, and the line's split times (Regular). A person's wait turns Bold, with the clock, at two business days or more (section 3.3) |
| Mono (proposed; a Baselayer gap) | 12 / 16 | Chivo Mono 400 | As written | Jira keys, SHAs, query ids, table and view names, repository paths, keycaps |
| Badge (proposed dense size) | 12 / 16 | Chivo Mono 600 | ALL CAPS, no tracking | Type codes and a few states only (section 9.5) |

Form helper and error text use Baselayer's `FormField` metric, 12/20.

### 4.3 Case

**Title Case for the UI's own words:** page, section and card headings, buttons, tabs, navigation, menu items,
field labels, column headers, dialog titles and status labels. Capitalize major words. Lowercase a, an, the,
and, but, for, or, nor, yet, so, and prepositions of three letters or fewer (at, by, for, in, of, on, to, up,
via), unless they come first or last. Capitalize the first word after a colon. Keep acronyms and ids as written
(SKU, UA, T1, AC-1).

Examples: "What Do You Want to Make?", "Pick Up Where You Left Off", "Recently Handed Off", "Your Approval: The
Plan", "Review and Sign", "Sign and Accept", "Send Back", "Ask Someone", "Open Inbox", "Who Signs, in Order",
"New Project", "Send for Approval", "Retry From This Step", "Waiting on You", "Partly Met".

**Sentence case for content:** body text, helper and error messages, status sentences, toasts, assistant
messages, questions a person or agent asked ("Which level counts as one style for duplicate checks?") and
anything a person typed. Project names show as typed ("SKU productivity workbench"); a new project may suggest
Title Case when someone names it.

### 4.4 Numbers, dates and identifiers

- Tabular figures on every number that changes.
- Durations use lowercase units and no caps ("1d 4h", never "1D 4H"); they are Bold only for elapsed totals and
  for a person's wait of two business days or more (section 3.3).
- Dates read "Oct 25, 14:02" and "Oct 9", never "OCT 25 · 14:02" or "OCT 09".
- Counts use real plurals ("Used in 1 project", "Used in 3 projects").
- Mono is for machine identifiers only. Prose such as "token vault", "4 steps" or "Rovo MCP server" stays in
  UA Text.
- Every label that carries a value is built whole ("Start With 6 Facts"), never assembled around an inline value
  that can lose its spaces.

### 4.5 Banned

- Any `letter-spacing` (Tailwind `tracking-*`), including the `-0.01em` on headings. Both faces ship with their
  spacing designed in.
- `text-transform: uppercase` outside the Badge role.
- Any `font-stretch` or width axis value. Weights 500, 600 (in UA Text), 800 and 900.
- Font sizes outside 12, 14, 16, 20, 24, 32 and 40, including half pixels and anything below 12. The proposed 13
  is allowed only in the Label Dense role of section 4.2; 15 is not allowed.
- Tracked eyebrows over sections. Delete a label when its position already says what it is.
- More than one middle dot per line, and a line that starts with a separator. Split meta into labeled pairs,
  or into a primary line in `on-surface` and a secondary line in `on-surface-variant`.
- Text in `#949494` or lighter, and `opacity` on text.
- Line heights below 1.25 for headings and below 1.4 for body.

Baselayer's own web components use SemiBold 600 (text links, status words, badge numbers, empty-state titles)
and 0.5 px tracking on large Bold (dialog titles at 24/32, the search query at 32/40). The two bans above hold
for the stand-in fonts, which ship without a 600; whether the production font follows Baselayer is Brand review
items 10 and 11 (section 15).

## 5. Space, grid and control sizes

### 5.1 Spacing

| Value (px) | Baselayer name | Use |
|---|---|---|
| 4, 6, 10, 12 | component-scoped (R-001) | Inside components only: chip insets, the icon-to-text gap, input insets, table cell padding |
| 8 | 2XS | Between related controls; icon to label in buttons |
| 16 | XS | Within a group; the gutter; dense panel padding; between stacked fields |
| 24 | SM | Between groups; comfortable panel padding; the page margin |
| 32 | MD | Page header to content when there are no tabs (24 when tabs end the header) |
| 56 | LG | Between major sections; below the last element on a page |
| 64, 80 | XL, 2XL | Empty states |

Retire 2, 3, 5, 7, 9, 14, 18, 20, 26 and 28 px as gaps. Control heights such as 44 are geometry, not spacing
tokens.

### 5.2 Grid

Screens are designed at 1440: 12 columns, 24 px margins and 16 px gutters. Since 2026-10-26 the grid lives in the
main area, to the right of the side nav: 1192 px at 1440 with the nav open, 1376 px with the 64 px rail. A span of
n columns measures n × column + (n − 1) × 16:

| Span | 3 | 4 | 6 | 8 | 9 | 12 |
|---|---|---|---|---|---|---|
| Main area, nav open (column 80.67) | 274 | 370.7 | 564 | 757.3 | 854 | 1144 |
| Main area, rail (column 96) | 320 | 432 | 656 | 880 | 992 | 1328 |
| Full width, no shell (column 101.33; Teams task module, spec pages) | 336 | 453.3 | 688 | 922.7 | 1040 | 1392 |

- **Home and the project workspace do not use spans:** Home is two centered columns (section 7.3) and project
  pages are the workspace split (section 7.4).
- **Full layout:** a 12-column span of the main area for tables, maps and canvases.
- **Rail layout,** where a screen keeps a right rail: 9 + 3 of the main area. The main column and the rail stretch
  to one bottom edge.
- **Reading text** in any layout is capped at 680 px (640 in the artifact panel).
- **Wider than 1440,** columns stay fluid: tables fill the width while reading text keeps its cap.
- **From 1440 down to 1280,** the narrowest supported width, the same 12 columns shrink: at 1280 with the nav open
  the main area is 1032 px and a full span 984. Wide tables scroll inside their panel with the first column
  pinned, toolbars wrap with 8 px between rows, and maps and canvases keep zoom and fit. Nothing is designed below
  1280.
- The content box is a 12-column grid with 24 px padding, a 16 px column gap and a 24 px row gap. Grids of cards
  use `align-items: start`, and their column count divides the item count.

### 5.3 Control sizes

| Height | Use |
|---|---|
| 44 | Page and gate actions; the decision bar's primary and secondary; dialog actions; the first Inbox row's action; text inputs at Large size; radio option rows and checkbox rows |
| 40 (proposed) | New Project in the side nav; Home's send button (a circle) |
| 36 | Compact: side nav rows, the top bar's page actions (Share), toolbars, card footers, row actions, Home's starters and Waiting on You actions, the composer's "+", workspace picker and workspace send button, the artifact tabs, compact inputs, row icon buttons |
| 32 | Segmented segments, filter chips, answer chips, suggestion chips, Recent rows, the Help button and the rail toggle, the artifact header's Versions and full-screen buttons, table-footer controls, zoom and fit controls, menu rows |

Never below 32 for a control, and at least 8 px between targets, except rows of one list (the side nav, a menu),
which sit 0 to 2 px apart and are separated by their own height. Object chips (24 px) are links that open
something, not controls, and meet WCAG 2.5.8's 24 px minimum. This relaxes the concept canvas's 44 px target
rule for dense screens (logged as a decision).

## 6. Shape, depth and focus

### 6.1 Radii

| Radius | Use |
|---|---|
| 0 | Media, table cells, line notches and trace bars. Square is the brand motif |
| 1 px | The checkbox mark |
| 4 | Inputs, chips, answer chips, tags, badges, segmented controls, logo tiles, tooltips, toasts, keycaps, the product mark tile, the composer's attached chips |
| 8 (proposed) | Panels, cards, popovers, menus, dialogs, preview frames, side nav rows, the tool-call group, question and approval cards; the artifact tabs round their top corners only |
| 16 | The composer (Home and workspace), the requester's message bubble (4 at its tail, the bottom-right corner), the switch track |
| Pill | Buttons (New Project, Home's starters and the conversation's suggestion chips are buttons), icon buttons, avatars, the Waiting on You capsule and the Inbox count, and nothing else |

Filter chips, answer chips and segments are 4, not pills. Nested curves stay concentric: the inner radius is the outer radius
minus the padding.

### 6.2 Borders

- **Panel and card:** 1px `outline-variant`.
- **Chips and tiles:** an inset 1px `outline-variant` ring, so the size does not change.
- **Dividers inside a surface:** 1px `stroke-tertiary`.
- **Selected card:** an inset 2px `outline` on `surface-container-high` (on `surface` for a large card),
  replacing the 1px border. **Selected option row** (a radio option row, as in the Decision card): `surface` with
  an inset 1px `outline` ring (section 9.13).
- **No colored side stripes** anywhere. Baselayer's Message `accentEdge` (a 4 px left bar) stays off; the
  provenance strip keeps its top rule.
- **Dashed** in the UI chrome only for future segments of the line, a draft project's mark in Recent, Construction
  and Operations wherever they appear ("Outside HyperDelivery", "After Handoff"), and parts marked "Arrives in
  Enterprise" on the two help pages. Layer 2 and 3 diagrams may dash asynchronous edges, trust boundaries and the coding agent's
  "Second engine (swap test)", which arrives in Enterprise.

### 6.3 Planes and elevation

Three planes: `surface` (white) for the main area, the conversation and the panels; `background` (`#F9F9F9`)
for the side nav and the backdrop behind the artifact panel; and floating layers above both. One level of
nesting: a surface never holds another bordered surface. The exceptions are the evidence and preview tray
(section 12, Approval) and the cards in the conversation, which sit on the white column without a panel.

| Level | Baselayer effect | Value | Use |
|---|---|---|---|
| Flat | none | No shadow; the 1px edge | Page, panels, cards, tables |
| Medium | `Floating Button/Medium` | `0 0 4px rgba(29,29,29,0.15)` | Tooltips; a sticky table header while scrolled |
| Large | `Floating Button/Large` | `0 0 10px rgba(29,29,29,0.15)` plus a 1px `outline-variant` ring | Menus (Help, account, the composer's sources), popovers, dialogs, toasts |
| Soft (proposed) | none | `0 4px 16px rgba(29,29,29,0.06)` under the 1px stroke | Home's composer only, so the page's one input reads as the start |

A modal always has the `scrim` behind it.

### 6.4 Focus

- `:focus-visible` only: a 2px `#0096FA` outline at a 2px offset.
- On `#F9F9F9` and `#F0F0F0` containers the ring is only 2.96:1, so draw a white separator first:
  `box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #0096FA`. On the inverse surface the ring is 5.41:1 and needs no
  separator.
- An element that draws its own inset ring keeps it under the focus ring: a chip its 1px `outline-variant` ring,
  a secondary button its 1px `outline` ring, a selected card its 2px `outline`. The shared style block names
  these `hd-ring`, `hd-ring-edge`, `hd-ring-ink`, `hd-ring-sel` and, for an element with a 1px outer ink ring,
  `hd-ring-outer`.
- Inputs get the ring plus an `outline` stroke; the composer takes it on the whole box (`:focus-within`). Table
  rows, list items and menu rows get an inset ring (`outline-offset: -2px`, `hd-ring-in`).
- Never remove an outline without drawing this ring instead (no bare `outline: none` or Tailwind
  `outline-none`).
- This replaces ux-direction v3's ink ring and the console's red ring.

## 7. The app shell

Every product screen has the shell: Home, First run, Inbox, Projects, every project screen (the workspace in each
stretch, with its approval, Confirm What We Heard, timeline, architecture and trace views), Needs attention,
Handoff, Library, Portfolio, Admin, and the two help pages. It does not appear inside Teams (cards, the task
module and the meeting side panel), where the host supplies the chrome.

The shell is two pieces: the side nav on the left and a slim top bar over the main area. The reference boards are
`Main.dc.html` (Home) and `Start.dc.html` (a new project in Discover). Every product board copies their `hd-shell`
markup, style rules and script verbatim and changes only what this section says may differ.

### 7.1 Side nav and top bar

This section documents Variant B's shell (Side Nav and Chat), the reference build, while the shells of
Variant A (Top Bar) and Variant C (Guided Path) live on the concept canvas's A and C pages until the team
vote ([ux-direction.md section 3](ux-direction.md#three-ui-directions-for-the-team-vote)).

**Side nav.** The nav is identical on every screen except the current item, the Inbox count, the viewer, the
Recent list and the role-gated rows. It follows Baselayer's Account Navigation (`Account Navigation / Desktop`,
`9286:10835`): a calm vertical list where selection is weight only.

| Zone | Spec |
|---|---|
| Panel | 248 px, `background` `#F9F9F9`, a 1px `stroke-tertiary` `#F0F0F0` right rule, `aria-label="HyperDelivery"`. Its content is sticky to the top of the window and one window tall, with the account row at its foot, so the account sits at the same place on every screen however long the page (the rows above it stay within 900 px): one column with 12 px padding and 2 px between rows |
| Rail | ⌘B, or the toggle, collapses the nav to a 64 px rail. Labels, the wordmark, the Recent list, the Library tag, Search's keycap and the account text hide (the Inbox count stays); rows center their 18 px icon, and New Project keeps only its plus; the current row gains a `surface-container-high` fill, because weight cannot show without a label; the lockup stacks the logo over the toggle, 12 px apart. Rows keep their accessible names and a `title` on hover. The choice is remembered per viewer (proposed) |
| Lockup row | 40 px tall, 8 px left and 2 px right padding, 10 px above New Project: the UA logo 17 px tall (28 wide) in `on-surface`, then, 10 px after it, "HyperDelivery" in Heading SM 16/20 Bold. Both are one link to Home with no `aria-label` of its own, so it reads "Under Armour HyperDelivery" (section 8.2). At the right, the rail toggle: a 32 px icon button with the 18 px sidebar glyph, named "Hide the sidebar" or "Show the sidebar", with `aria-expanded` |
| New Project | A 40 px outlined pill: `surface` fill, an inset 1px `outline` ring, 14 px side padding, an 18 px plus glyph 8 px before "New Project" in 14/18 Bold, 6 px above Search; hover `surface-container-high`. It opens Home with the composer focused (⌘⇧O). It is the only start control on any screen |
| Search | A side nav row (section 9.25) that is a button: the 18 px search glyph, "Search", and at the right a ⌘K keycap (Chivo Mono 12/16 `on-surface-variant` on `surface`, an inset 1px `outline-variant` ring, radius 4, 1 × 6 px padding). Named "Search projects and facts, Command K"; it opens the command palette |
| Primary items | Home, Inbox, Projects and Library, in that order, in a `<nav aria-label="Primary">` 6 px below Search. Inbox carries the red count (section 9.7) only when something waits on the viewer, and its accessible name includes it ("Inbox, 4 waiting on you"); a requester with nothing to sign, a new user and a leadership viewer see a plain "Inbox". Library carries the word "Enterprise" at the right in 12/16 Regular `on-surface-variant` until it ships |
| Recent | 18 px below the primary items: a "Recent" heading (Label XS 12/16 Regular `on-surface-variant`, 10 px side and 6 px bottom padding), up to five Recent rows (section 9.25) by last activity, then an "All Projects" row in `on-surface-variant` that opens Projects. The project on screen is the current row: Bold, with `aria-current="page"` |
| Role-gated items | Pinned to the bottom, above the account row: Portfolio (sponsors and leads) and Admin (Platform and Governance admins), as primary rows. Absent, not disabled, for everyone else, so a business owner or a requester never sees them |
| Account and workspace | The last row, 10 px below the rest: a 48 px disclosure with 8 px side padding holding a 28 px avatar in the viewer's fill, the name (14/18 Bold) over the workspace (12/16 `on-surface-variant`), and a 16 px up-and-down chevron. Named "Maya Chen, Merchandising, account and workspace". It opens the account menu upward (section 9.23), which also holds the workspace switcher |

Selection is weight only, as in Baselayer's account nav: the current item is Bold `on-surface` with
`aria-current="page"`, every other item Regular `on-surface-variant`, with no fill, bar or tint. Hover fills
`surface-container-high` (radius 8) on every row except the current one; focus is the inset ring (`hd-ring-in`).
Baselayer's 219 px list with 24 px gaps (a 48 px pitch) is tightened to 36 px rows 2 px apart, so the places,
Recent and the account fit in one window height.

**Top bar.** The bar over the main area carries only what belongs to the page.

| Zone | Spec |
|---|---|
| Bar | 56 px, `surface`, 24 px side padding, 16 px between items, a 1px `stroke-tertiary` bottom rule (Home has none, so its question sits on open white) |
| Left | The page name in Body SM 14/20 `on-surface-variant` ("Home", "Inbox", "Projects"), or a breadcrumb. Never a search box, the workspace, the logo or a start button |
| Breadcrumb | A `<nav aria-label="Breadcrumb">` in 14/20 with 8 px gaps: earlier crumbs are `on-surface-variant` links with no underline, separated by an `aria-hidden` "/"; the last crumb is Bold `on-surface` with `aria-current="page"`, cut with an ellipsis when long, and never links to the page it names. A tag may follow it (the "Draft" tag on a new project, or a target-tier chip, section 9.29): 20 px tall, 6 px side padding, radius 4, `surface-container-high`, Label XS Regular |
| Right | A flexible spacer, then the page's actions (on project screens the avatar stack of 28 px avatars and "Share" as a 36 px secondary), then Help |
| Help | A 32 px ghost icon button with the 18 px help glyph, named "Help": no fill and no ring at rest, `surface-container-high` on hover, while open and on the two help pages. It opens the Help menu (section 9.23), right-aligned under it, and is the last item of the bar on every screen |

The breadcrumb takes Baselayer's 14/20 size (`Breadcrumb`, `10927:6`) but keeps Regular weight for the earlier
crumbs (the stand-in font has no SemiBold) and 8 px gaps against Baselayer's 4, with the current page Bold.

Shortcuts, listed in the Help menu: ⌘K Search, ⌘⇧O New Project, ⌘B hide or show the sidebar, @ mention a person
or source, ⌘/ show the shortcuts, Esc close. Signing has no shortcut: the attestation and the named button are
the signature.

### 7.2 Page header

There is no page header band: the top bar names the page, and what the band used to hold moves into the page
or the workspace. Four variants:

- **Home:** none. The top bar reads "Home" with no bottom rule, and the page opens with its question (Heading XL,
  centered).
- **List screens** (Inbox, Projects, Needs attention, Library, Portfolio, Admin): the top bar names the page or
  carries its breadcrumb ("Projects / Needs Attention", "Admin / Merchandising"). Counts and scope open the content
  as one meta line of labeled pairs (Body SM `on-surface-variant`) or a toolbar band at the top of the list panel,
  where filter chips go. Nothing repeats the page name in a second band; a page that needs a title sets it in
  Heading XL at the top of the content. Admin's tabs (Guardrails, Audit Log, Usage) open its content.
- **Project screens** (every view of the workspace): the breadcrumb "Projects / `<Project>`" ("Inbox /
  `<Project>`" when opened from the Inbox), an optional tag, the avatar stack and "Share" in the top bar; then the
  **line strip** across the full main width: 12 × 24 px padding, `surface`, a 1px `stroke-tertiary` bottom rule,
  the full line (section 9.21) at most 760 px wide on the left and, on the right, one Body XS `on-surface-variant`
  note naming what the current stretch outputs ("Discover outputs a **brief and a mockup**", the output Bold
  `on-surface`). No title, meta line or tab row: the line is the map and the artifact panel carries the tabs.
- **Help** (How Work Moves, How HyperDelivery Is Built): the breadcrumb "Help / `<Page>`", with "Help" as plain
  text, no current side nav item and the "?" selected. The page's title and one meta line open the content, with
  its controls in a toolbar row 24 px below; no actions.

**Where each screen lives.** The side nav's current item, the top bar's left side and the page's one primary
action, board by board, as the boards now stand:

| Screen (board) | Side nav | Top bar | Page primary |
|---|---|---|---|
| Home (`Main`) | Home | "Home" | The composer's send button, "Start the project" |
| First run (`FirstRun`) | Home | "Home" | The composer's send button |
| Inbox (`Inbox`) | Inbox | "Inbox" | "Review and Sign" in the selected item's detail |
| Projects (`Projects`) | Projects | "Projects" | none; New Project is in the side nav |
| New project in Discover (`Start`) | Projects, with the project's Recent row current | Projects / `<Project>`, then the "Draft" tag | "Send for Approval" in the decision bar |
| Project workspace (`Project`) | Projects, with the project's Recent row current | Projects / `<Project>` | The decision bar's sign action when a decision waits on the viewer ("Sign and Accept"); else none |
| Approval, a workspace view (`Gate`) | Inbox when opened from the Inbox, else Projects; the project's Recent row current | Inbox / `<Project>` or Projects / `<Project>` | The decision bar's "Sign and Accept", the same decision bar as `Project` |
| Confirm what we heard, a workspace view (`ContextReview`) | Projects, with the project's Recent row current | Projects / `<Project>` | "Finish Review" |
| Timeline and trace, under More (`Activity`) | Projects, with the project's Recent row current | Projects / `<Project>` | none |
| Project architecture, under More (`Architecture`) | Projects, with the project's Recent row current | Projects / `<Project>` | none |
| Needs attention (`Failures`) | Projects | Projects / Needs Attention | The first row's action |
| Handoff, Final MVP (`Graduation`) | Inbox when opened from the Inbox, else Projects | Inbox / `<Project>` or Projects / `<Project>` | "Sign Decision" on the Construction decision |
| Library, Enterprise (`Library`) | Library | "Library" | none |
| Facts for a new idea (the Library, reached from a project) | Projects | Projects / `<Project>` / Facts for This Idea | "Start With 6 Facts" |
| Portfolio, Enterprise (`Portfolio`) | Portfolio, for sponsors and leads | "Portfolio" | none |
| Admin, Enterprise (`Admin`) | Admin, for admins | Admin / `<Workspace>`, with "Admin" as plain text | "Review and Sign" on a policy change |
| How Work Moves (`Lifecycle`) | none; "?" selected | Help / How Work Moves | none |
| How HyperDelivery Is Built (`PlatformArchitecture`) | none; "?" selected | Help / How HyperDelivery Is Built | none |

Crumbs link "Projects" to Projects, "Inbox" to the Inbox and a project to its workspace.

### 7.3 Content and bottom

- **Content** sits on the white main surface. On list screens it starts 24 px below the top bar, on the main
  area's 12-column grid (section 5.2), at its 24 px margin.
- **Home** is two centered columns: the question, the composer and the starters at most 760 px wide, 72 px below
  the top bar, with 16 px between them (24 under the question); then, 64 px below the starters, the sections at
  most 880 px wide and 48 px apart. A section header is the title in Heading MD, an optional Body SM
  `on-surface-variant` summary 12 px after it ("2 approvals, 1 question and 1 confirmation, oldest first"), and at
  the right an underlined 14/20 link with a 3 px offset ("Open Inbox (4)", "All 7 Projects"), 12 px above the
  content. It is
  Baselayer's Page Preview Section (`11161:102657`) without the icon: a title, a count and View All.
- **Every block earns its place.** A section with nothing to show is hidden or a compact empty state (section
  9.19); it never holds open a column of whitespace. Working screens have no feed, showcase or KPI-tile cards.
- **Section titles** on list screens are Heading MD on white, 16 px above their panel.
- **A right rail,** where a screen keeps one (span 3 of the main area): one `surface` panel, radius 8, an
  `outline-variant` edge, 16 px padding, sections divided by `stroke-tertiary` and titled in Heading SM. The rail
  and the main column end on one bottom edge.
- **Sticky action bar** (the Library reached from a project): 72 px, `surface`, a 1px `outline-variant` top rule,
  24 px side padding, 16 px gaps: the Large primary, the Large secondary and a Body SM summary in
  `on-surface-variant`.
- **The bottom:** 56 px of white below the last element.

### 7.4 The project workspace

Every project screen is one workspace: the conversation on the left and the artifact panel on the right, under
the top bar and the line strip (section 7.2). It is what ChatGPT, Claude and Gemini do with the things they make:
the brief, the mockup, the plan and the prototype sit beside the conversation that made them. Approvals, Confirm
What We Heard, the timeline, the architecture and the trace are views of this workspace, not separate pages. The
reference is `Start.dc.html` (`<!-- hd-workspace:line -->` and `<!-- hd-workspace:split -->`, with the
`/* hd-workspace */` style rules).

| Zone | Spec |
|---|---|
| Split | A grid of 440 px and the rest, filling the height under the line strip. The workspace behaves like an app window: one window tall (about 1200 px on the 1440 canvas; the Timeline and Architecture views up to 1400). The conversation and the artifact panel each scroll inside themselves, and the composer, the progress row and the decision bar stay pinned and visible. A workspace that grows with its content is a defect |
| Conversation | 440 px, `surface`, a 1px `stroke-tertiary` right rule. The stream is `role="log"` with `aria-live="polite"`, 24 px top and side padding and 16 px at the bottom, items 20 px apart, oldest first (section 9.26 for each item) |
| Progress row | While system work runs, one row pinned above the composer (section 9.26) |
| Composer | Sticky to the bottom of the conversation on `surface`: 12 px top, 24 px side and 20 px bottom padding, with suggestion chips 8 px above the box (section 9.24) |
| Artifact backdrop | The rest of the width in `background` `#F9F9F9`, with 24 px of backdrop below the panel |
| Tabs | A `role="tablist"` named "Artifacts", 12 px from the top of the backdrop, 24 px side padding, 4 px between tabs (section 9.27). A tab exists only for an artifact that exists, or that the line produces next (shown locked) |
| Artifact panel | A white `role="tabpanel"` 24 px in from both sides of the backdrop, an inset 1px `stroke-tertiary` edge, the top-right corner at radius 8 (the top-left meets the first tab). Its header, body and decision bar stack inside it (section 9.27) |
| Decision bar | At the foot of the panel when a decision belongs to the viewer: sending a stretch's output for approval, or signing it (section 9.28) |
| Full view | The header's full-screen button folds the conversation to a 56 px strip on the left (`surface`, a 1px `stroke-tertiary` right rule) holding one 44 px "Ask" button, a 20 px chat glyph over the word, named "Ask HyperDelivery: show the conversation"; that button or Esc brings the conversation back, and the panel and its decision bar keep working at full width. `Activity.dc.html` opens folded and `Architecture.dc.html` folds below 1366 px, where the reopened conversation overlays the panel |

- **One conversation, one artifact panel.** Anything else is a tab in the panel or an item in the conversation;
  there is no third pane.
- **Approvals.** An approval card in the conversation (section 9.26) opens the artifact it signs with the
  decision bar in its sign state. The Inbox row, the red notch on the line and the Teams card open the same state,
  and answering in one place clears the item everywhere.
- **After Handoff.** Construction and Operations items, where a panel lists them, read "After Handoff" in
  `on-surface-variant`, dashed where drawn, never "Live".
- **At 1280** with the nav open the panel is about 544 px wide; the rail or the full view gives a prototype its
  room.
- **Voice.** HyperDelivery says "I" only inside its own turns, sparingly; status lines, notes and the progress row
  never do. No item explains the screen to the person looking at it.

## 8. Brand: the UA logo

HyperDelivery is a UA product offering, so its chrome starts with UA's own logo. The three-notch line stays as
HyperDelivery's own glyph. The choice and the alternatives it rejected are logged in
[docs/decisions.md](../decisions.md) (2026-10-26, "HyperDelivery carries the UA logo").

### 8.1 Assets, and where they came from

Copied from the internal Figma file
[UA Brand Logos](https://www.figma.com/design/D6U8sFNGDbbzNtSE39RLvN/UA-Brand-Logos?node-id=1-5) as SVG exports.
Nothing in Figma was modified, and no path was redrawn or traced. The libraries the exploration found are listed in
[baselayer-for-hyperdelivery.md section 11](research/baselayer-for-hyperdelivery.md#11-figma-exploration-round-5).

| Asset | File | What it is | Where it goes |
|---|---|---|---|
| UA logo, black | `logos/ua-logo.svg` | The small cut of the UA logo, `viewBox` 232.5 × 137 (about 1.7:1) | Light surfaces. The side nav inlines this path |
| UA logo, white | `logos/ua-logo-white.svg` | The same cut in white | Kept with the brand assets for UA material on dark backgrounds. No product screen uses it |
| UNDER ARMOUR lockup | `logos/ua-lockup.svg` | The UA logo plus the UNDER ARMOUR wordmark, horizontal small, `viewBox` 267.8 × 20.6 | Spec pages, print and the About page. Never the side nav or a bar: it is too wide and competes with the product name |

The concept canvas uploads all three as assets and references them through each board's logo map. In the side nav the
logo is an inline `<svg viewBox="0 0 232.5 137" role="img" aria-label="Under Armour">` whose one path is the export's
path, unchanged, with `fill="currentColor"`. It takes `on-surface`, so it is black. Inlining the exported path is a
copy; editing, simplifying or retracing it is not allowed.

### 8.2 The product lockup

The lockup has two forms. Every product screen uses the side nav form (since 2026-10-26); the plan page and spec pages keep
the page-header form.

| Part | Side nav (every product screen) | Page header (the plan page, spec pages) |
|---|---|---|
| UA logo | 17 px tall (28 wide), `on-surface` | 20 px tall (34 wide), `on-surface` |
| Separator | None: the name sits 10 px after the logo, in a 40 px row | A 1 × 20 hairline in `outline-variant`, 12 px from the logo and 12 px from the name |
| Name | "HyperDelivery" in Heading SM 16/20 Bold (UA Text Bold; Archivo Bold as the stand-in). Not condensed, not uppercase, no letter spacing | The same |
| Behavior | One link to Home with no `aria-label` of its own: the logo keeps `role="img"` and `aria-label="Under Armour"`, so the link reads "Under Armour HyperDelivery", as on `Main.dc.html`. In the 64 px rail the name hides and the logo stays, above the rail toggle | One link to Home. The logo carries `aria-label="Under Armour"` and the hairline is `aria-hidden`, so the link reads "Under Armour HyperDelivery" |

It mirrors the header of Baselayer's own Token Reference, which opens with the UA logo and then "Baselayer Design
System - WEB". The lockup never adds the three-notch mark, a tagline or a second product name.

### 8.3 The three-notch mark

**The product mark** is the three-notch line on an inverse tile, and it is not an icon. A 24 px tile with a 4 px
radius in `inverse-surface`; a 1.5 px rule across its middle and three 3.5 px square notches in `surface` (paths in
appendix A). It is HyperDelivery's own glyph and is not part of the lockup or the side nav.
It appears:

- as the assistant's avatar on HyperDelivery's turns in the conversation, and the HyperDelivery owner chip (20);
- as the Teams bot, the Teams app icon and its icon in the Teams rail;
- on app tiles, and as the app icon at 24, 40 and 64;
- as the favicon and the app-level loading state.

Those are the places the UA logo does not go: a favicon, an avatar or a 20 px tile is too small for the logo's clear
space, and a Teams icon is HyperDelivery's identity inside someone else's chrome.

### 8.4 Clear space, size and cuts

- **Clear space:** at least half the logo's height on every side: 8.5 px at 17 px in the side nav, where the name
  sits 10 px away and the 40 px row leaves 11.5 px above and below; 10 px at 20 px in a page header, where the
  hairline sits 12 px away.
- **Minimum size:** 16 px tall on screen.
- **Cuts:** the small cut (the copied files) for anything under 40 px tall, which covers the side nav and every
  in-product use. At 40 px and above, take the standard cut from the same Figma file.
- **Registered cut:** the cut with the registered (R) symbol only where Legal asks, which means external material.
  HyperDelivery's screens are internal and use the cut without it.

### 8.5 Do not

- Recolor it. In the product it is black; the white cut is for UA material on dark backgrounds. No red, even
  though red is UA's color: in this product red means "waiting on you" (section 3.3). No brand hue, gradient, tint
  or reduced opacity.
- Stretch, squash, rotate or outline it.
- Crowd it inside its clear space, or set it below 16 px.
- Redraw, trace or edit its path. Copy the export.
- Put the full UNDER ARMOUR lockup in the side nav, or pair the logo with the three-notch mark.
- Place it in generated prototypes, charts, avatars, project icons, favicons, loading states, Teams cards or emails
  without UA Brand approval.

### 8.6 Approval

The concept canvas and the plan page carry the lockup now, as the owner asked. Production use still goes through UA
Brand: the product lockup and the product name are item 2 of the Brand review (section 15), and the console ships
the lockup only after that review.

## 9. Components

Specs below are anatomy, sizes and states. Every component draws its colors from section 3 tokens, its type
from section 4.2, and its focus from section 6.4.

### 9.1 Buttons

| Hierarchy | Baselayer component | Anatomy | Use |
|---|---|---|---|
| Primary | `Btn/Primary/Black` | `primary` fill, `on-primary` label | The one next step in a view region: "Review and Sign", "Sign and Accept", "Start the Project" |
| Secondary | `Btn/Secondary/Black` | `secondary` fill, an inset 1px `outline` ring, `on-secondary` label | "Send Back", "Invite", "Confirm", "Share" in the top bar, Home's Waiting on You actions, later Inbox rows; New Project is its 40 px form in the side nav |
| Tertiary | `Btn/TextLink/General` | An underlined `on-surface` link (3 px underline offset) with a 44 px hit area | "Open Inbox", "Ask Someone", "Reassign", "Undo" |
| Ghost (proposed) | none | No fill and no ring; hover fills `surface-container-high` | A quiet in-panel action: "Export", "Not Right", "Export SVG" |
| Icon button | the circle form of each | A circle with a 16 px glyph (18 px in the shell: the rail toggle, Help, the composer's "+"); always an `aria-label` that names the object ("Actions for Shell run jacket") and a tooltip | Row actions, pagination controls, "Remove <name>" on a pointed resource, "Open full screen" |
| Send (proposed) | none | A `primary` circle with an 18 px (16 px at 36) up arrow in `on-primary`; `disabled` fill until there is something to send | 40 px on Home, named "Start the project"; 36 px in the workspace composer, named "Send" |
| Help (proposed) | none | A 32 px ghost circle with the 18 px help glyph: no fill and no ring at rest, `surface-container-high` on hover, while open and when selected; the focus ring with its white separator | The "?" in the top bar only |
| Destructive | the secondary | The secondary with a leading 16 px X, and a confirmation that states the consequence | "Revoke Access", "Archive". Never red (HD-R1) |

| Size | Height | Side padding | Label | Icon | Use |
|---|---|---|---|---|---|
| Large | 44 | 20 | 14/20 Bold | 16, 8 px from the label | Page, gate and dialog actions; the sticky action bar; the decision bar (section 9.28) |
| Compact (proposed) | 36 | 16 (12 for ghost) | 14/20 Bold | 16 | Toolbars, card footers, row actions, the top bar |
| Small (proposed) | 32 | 12 | 12/16 Bold | 16 | Table-footer controls and zoom controls only; icon buttons are 32 circles |

All buttons are pills with a minimum width of 96 px (icon buttons excepted), labels in Title Case, nowrap, and
width that hugs the label.

**States.** Default; hover (primary `#444444`, secondary and ghost fill `surface-container-high`); pressed
(primary `#5F5F5F`); focus (the ring); disabled (`disabled` fill and `on-disabled` label, with the reason linked
by `aria-describedby`, never a pale imitation of an active button); loading (the label becomes the three-dot
loader of section 9.19 in the label color, while the width holds); success (the label becomes "Signed" with a check for two
seconds, then the page settles into a status).

**Rules.** At most one primary per view region. A done action becomes a status with an Undo link, never a
primary button.

### 9.2 Filter chip

Baselayer's `Chip/FilterWithLabel` at 32 px. A button with `aria-pressed`, radius 4, 12 px side padding, 6 px
gaps, Label SM label, and a tabular count.

- **Default:** `surface` fill, an inset 1px `outline-variant` ring, the count in `on-surface-variant`.
- **Selected:** `primary` fill, a Bold `on-primary` label with a leading 16 px check, the count Regular in
  `#D0D0D0`.
- **Status filters** carry their 12 px status glyph (X, lock, clock, alert).
- **Answer chips** (a question's answers in an Inbox row or a question card) are filter chips in a `radiogroup`; in
  the conversation they use Label Dense 13/18 and show the choice by the fill alone, with no check (section 9.26).
- **In a 440 px list column** (the Inbox's list): 10 px side padding, 6 px between chips and the selection shown by
  the fill alone, as answer chips show it, so All, Approvals, Questions and Confirmations keep one row.
- **No dashed "+ Add" chips:** use a solid chip with a plus glyph, or a single "Filter" button with a count.

### 9.3 Object chip

The chip for something a person can open: a tool, a resource, a model, a Jira key, a view (proposed component).

- **Anatomy:** 24 px tall, radius 4, `tertiary` fill, an inset 1px `outline-variant` ring, 8 px side padding (6
  on the mark's side), a 16 px brand mark in full color, a 6 px gap, and a Label XS label in `on-surface`.
  Identifiers inside use the Mono role. At most 240 px wide, with an ellipsis and a tooltip holding the full
  value.
- **States:** hover fills `surface-container-high`; focus is the ring; it is a link, so it always opens
  something.
- **Color** comes only from the mark, never from a fill.
- **Resource states** sit beside the chip as a status (section 9.6): Indexed and Snapshot quiet; Reading with the
  running shimmer; Stale with a clock glyph; Access Lost and Needs Access with an alert glyph and "Ask" plus the
  owner's name; Blocked by a Microsoft 365 Setting with a lock glyph and "Ask an Admin". All ink, with the red marker only
  when the viewer is the one who must act.

### 9.4 Tag

An attribute (target tier, risk, depth, draft, read or write), not clickable. 24 px tall, radius 4, 8 px side
padding, Label XS, nowrap; in the top bar beside the breadcrumb, 20 px tall with 6 px padding. **Neutral:**
`surface-container-high` fill, no border ("Draft", "Risk: Medium", the target-tier chip of section 9.29).
**Emphasis:** `surface` with an inset 1px `outline` ring ("Write"). Never colored: risk is a word, not amber.

### 9.5 Badge

The HyperDelivery analog of Baselayer's product-tile badge, in the UA Technical role (proposed dense size). 20 px
tall, radius 4, 6 px side padding, the Badge role (Chivo Mono 600, 12/16, ALL CAPS, no tracking), nowrap.

- **Neutral:** an inset 1px `outline` ring, ink text. For type codes (METRIC, RULE, SCOPE, TERM, ASSUMPTION,
  CONSTRAINT, DECISION, QUESTION), DRAFT, and RECOMMENDED with a leading 12 px check.
- **Accent:** `status-accent` fill with ink text (7.39:1). NEW only.
- Never red, and never a sentence.

### 9.6 Status

Status is a glyph plus a word, never a tinted pill. A 12 px glyph, a 4 px gap, Label XS Bold, nowrap. Fixed status
columns are 120 px.

| Status | Glyph | Color |
|---|---|---|
| Met, Passed, Accepted, Confirmed, Canonical | check | `status-success` (green glyph and word on the surface) |
| Working: system work running ("Building the prototype, piece 3 of 8") | the three-dot loader (section 9.19) | `on-surface` Regular |
| Handoff package ready; Handed off Oct 23; Construction: AI-assisted (or AI-driven) | none | `on-surface` Regular; the line's ink notches say it is done |
| Invited | check | `on-surface` |
| Partly Met, partly co-signed | half-filled circle | `on-surface` |
| Failed | X | `on-surface` |
| Blocked | lock | `on-surface` |
| Stalled, a long wait, overdue | clock | `on-surface`, Bold |
| Over a cap, a flag ("Bottom 20%") | alert | `on-surface`, Bold |
| Someone else's wait in the conversation or on the line strip, under two business days | a 14 px clock | `on-surface` Regular ("Waiting on Dana, 4m") |
| Someone else's wait in a dense row (a table, a card, a line column), under two business days | none | `on-surface` Regular ("Waiting on Dana in Finance, 1d") |
| Someone else's wait, two business days or more, anywhere | clock | `on-surface` Bold ("Waiting on Dana in Finance, 2d") |
| Waiting on you | the capsule, or red text naming the viewer | Section 9.7 |

### 9.7 The capsule, the Inbox count and the decision label

- **Waiting on You capsule:** 24 px pill, 10 px side padding, `critical` fill, Label XS Bold `on-critical`,
  nowrap. At most one per view region.
- **Inbox count:** in the side nav's Inbox row, at its right edge: a pill at least 18 px wide and 18 px tall, 5 px
  side padding, `critical` fill, a white 12/18 Bold tabular numeral, `aria-hidden`, with the count in the row's
  accessible name ("Inbox, 4 waiting on you"). It counts only what waits on the viewer and is absent at zero.
- **Other counts** are inline text in `on-surface-variant` ("Sources 3", "Open Inbox (4)"). Where a count needs a
  badge, it is Baselayer's black badge (`ic/Misc/Alert`): a 16 px `#1D1D1D` circle 8 px after the label, with a
  white 12/16 Bold numeral (Baselayer's 10/16 SemiBold sits below the 12 px floor). Red stays for waiting on you.
- **Decision label:** a 12 px solid `critical` square, an 8 px gap, then Heading XS in `status-error` naming the
  viewer's decision ("Your Approval: The Working Prototype"). On the inverse strip the text is white and the square
  stays red.

### 9.8 Avatar and stacks

- **Avatar:** a 24 px circle (28 in the side nav's account row, the top bar's avatar stack and people lists), the
  person's fill, white 12/16 Bold initials, and a `title` with the full name.
- **Avatar stack:** at most three avatars plus a `+N` disc (`surface-container-high`, ink 12/16 Bold), touching
  with no overlap (a 6 px overlap clipped the 12 px initials, so "MC" read as "MO"), each with a 2px ring in the
  surface color. The stack has `role="img"` and an `aria-label` naming
  everyone ("Maya Chen, Luis Romero, Priya Nair and 3 others").
- **Logo stack:** logo tiles never overlap. They sit 4 px apart, at most three, then `+N`.

### 9.9 Logo tile

The container for a brand mark, resolved from the `brands.ts` registry ([ux-direction.md section
7](ux-direction.md#7-logos-tool-chips-and-model-chips)).

| Size | Mark | Use |
|---|---|---|
| 24 tile | 16 | Chips, rows, traces |
| 40 tile | 24 | List headers, Connectors, Sources |
| No tile | 16 bare mark (18 or 20 where noted) | Inside a 24 px object chip or an attached chip, tool-call rows; 18 in the composer's source menu, 20 in the Sources list |

- **Anatomy:** radius 4, `surface` fill, an inset 1px `outline-variant` ring. Atlassian marks that carry their own
  tile are not nested in a second one.
- **Fallback:** if the mark fails to load, the tile shows the system's initial in 12/16 Bold `#444444`. Generic
  resources (a browser, a file, a terminal, a folder) use the matching icon glyph instead of an image.
- **Color:** full color, never recolored. The one-color variant follows section 3.4.
- **Solid tile (proposed):** for a one-color mark whose vendor icon is white on a colored tile (Amazon Bedrock),
  the tile takes the system's series hue from section 3.5 (`#3D8FFF`) with no ring, and the mark draws in white,
  as the vendor's own icon does. Same sizes as the outlined tile. Admin's connectors and How HyperDelivery Is
  Built use it.
- **Name:** a mark always sits next to its name, or the stack has `role="img"` and an `aria-label` ("Sources:
  Snowflake, Confluence, Jira").

### 9.10 Tabs

Baselayer has no tabs component, so this is proposed, drawn from the active state of `Navigation - Top`. These
are page tabs (Admin's Guardrails, Audit Log and Usage; a help page's views); the artifact panel's tabs are
section 9.27.

- **Anatomy:** 44 px tall, Label SM, 24 px apart, no padding. Unselected Regular `on-surface-variant`; selected
  Bold `on-surface` with a 2px `outline` bar on the bottom edge. Counts inline at 12/16 with a 4 px gap. The row
  sits on a 1px `outline-variant` rule. A tab may lead with a 16 px glyph 8 px before its label.
- **Keyboard:** tab lists, like every radio group (segmented controls, radio cards, answer chips), move with the
  arrow keys, Home and End, with one tab stop on the selected item.
- **Use** `role="tablist"` only when the control switches panels. To switch a view of the same data (period,
  density, the architecture phase, path, depth), use the segmented control.
- **Never** black pill tabs or gray-track tabs.

### 9.11 Segmented control

Baselayer's `Controls/Toggle` (`109:8205`), taken as published. A `radiogroup` of 32 px segments inside a 1px
`outline-variant` `#D0D0D0` border (34 px overall), with `outline-variant` dividers, radius 4, `surface` segments
with 16 px side and 6 px vertical padding and 12/20 labels, Regular on every segment as in Baselayer. The selected
segment is `primary` with an `on-primary` label, so the fill carries the selection; hover fills
`surface-container-high`; focus is the ring (Baselayer's 40 px Focus variant draws it outside the frame).
Arrow keys, Home and End move the selection, with one tab stop.

### 9.12 Panel and card

- **Anatomy:** `surface`, a 1px `outline-variant` edge, radius 8, 24 px padding (16 dense), 16 px between parts,
  `min-width: 0`. The title is Heading SM; meta is Body XS `on-surface-variant`. Inner groups are separated by a
  `stroke-tertiary` divider or a `surface-container` band, never by another bordered box.
- **Sizing:** cards hug their content. Cards in a set share one anatomy (all have a media band or none do), and a
  grid's column count divides its item count, so there are no orphans.
- **Selected:** `surface-container-high` (or `surface` for a large card) plus an inset 2px `outline`, dropping the
  1px edge.
- **Project card** (Home's "Pick Up Where You Left Off", three across with 16 px gaps): a link, radius 8, an inset
  1px `outline-variant` ring that turns `outline` on hover, `surface`, clipped. A 128 px thumbnail band on
  `surface-container` with a 1px `stroke-tertiary` bottom rule shows the latest mockup or prototype frame (14 px
  top and 16 px side padding; the concept board draws a sketch of each); then the body (14 px top, 16 px sides and
  bottom, 10 px gaps): the name in Body SM Bold with an ellipsis over the meta in Body XS `on-surface-variant`
  ("Sourcing, edited 3h ago"), the mini line across the card's width, and one status line in Label Dense 13/18 that
  never wraps. The status leads with the three-dot loader while work runs ("Building the prototype, piece 3 of 8"),
  turns Bold `status-error` when it names the viewer ("Your approval: The Plan", the region's one red label), and
  reads "Construction decision pending" once handed off, in Regular `on-surface` with no glyph. The card's
  accessible name is the name plus the status.

### 9.13 Decision card

The single key moment on a screen outside the workspace: an Admin policy change, the Handoff screen's
Construction decision and the Teams approval card body. Inside the workspace the approval card (section 9.26) and
the decision bar (section 9.28) carry the moment instead.

- **Edge:** `surface`, a 1px `outline` edge, radius 8, clipped.
- **Strip:** 40 px of `inverse-surface`, 16 px side padding: a 12 px `critical` square, the decision label in
  Heading XS (white), and a Body XS line in `on-inverse-variant` ("Decide by Nov 6").
- **Body:** 24 px padding: the title in Heading MD ("Your Decision"), a Body SM line in
  `on-surface-variant` saying what happens next, then a Large primary and a Large secondary 8 px apart, with
  tertiary links after them.
- **On the Handoff screen** the decision label reads "Your Decision: Construction" and the body holds the three
  options as radio option rows (AI-Driven, AI-Assisted With Engineers, Not Now; selected is `surface` with an inset
  1px `outline` ring, with a visible radio), the default from risk and the target tier marked "(Recommended)", a
  reasons textarea across the options, and "Sign Decision". The chosen option shows in the record, never in the
  button. It records a decision; it is not a fourth approval.

### 9.14 Data table

Baselayer has no data table, so this is proposed. Logic comes from TanStack Table
([ux-direction.md section 8](ux-direction.md#data-tables)).

- **Header row:** 40 px, Label XS Bold in `on-surface-variant`, Title Case, no caps; a 1px `outline-variant` bottom
  rule; sticky on `surface`, gaining Medium elevation while scrolled; a 12 px sort glyph.
- **Body rows:** three densities that move together: 44 and 36 px rows with Body SM text, 32 px rows with 12/18
  text.
- **Cells:** 12 px side padding, 16 px in the first and last cell. Numbers right-aligned and tabular. Identifiers
  in the Mono role. A two-line cell is a Bold name over a mono id in `on-surface-variant`. Ids, statuses and
  durations never wrap; names take `min-width: 0` with an ellipsis.
- **Selection:** a 16 px checkbox centered in a 40 px first column, each with an `aria-label` naming the row. The
  selection bar is `surface-container-high` and never offers approve.
- **Row states:** divider `stroke-tertiary`; hover `surface-container`; selected `surface-container-high`; focus
  an inset ring.
- **Pinned first column:** a 1px `outline-variant` right edge.
- **Micro-visuals** (section 3.5): a 64 × 16 sparkline, a bar-in-cell with a target tick, a delta with an ink
  arrow, status as glyph plus word.
- **Footer:** 52 px: a Body XS summary in `on-surface-variant` ("Rows 1 to 8 of 1,284, 212 flagged"), a
  rows-per-page native select at 32 px, and previous and next icon buttons at 32 px that use real `disabled`.
- **Loading** is skeleton rows (`surface-container-high` bars). **Empty** keeps the frame and offers one secondary
  action. **Error** shows inside the table with "Last good at 09:14". A real zero prints "0"; missing data is a
  dash in `on-surface-variant`.

### 9.15 Inbox row

The row for something waiting on the viewer, on Home and in the Inbox. Rows sit in one panel (`surface`, a 1px
`outline-variant` edge, radius 8, clipped), divided by `stroke-tertiary`, oldest first.

- **On Home** (Waiting on You, at most four rows): each row is one link, a grid of an 8 px marker, the content, the
  wait and a 152 px action column, with 16 px gaps and 16 × 20 px padding; hover fills `surface-container`, focus is
  the inset ring. Line 1 is the title in Body SM Bold with an ellipsis ("Your Approval: The Plan"); line 2, 2 px
  below, is Body XS `on-surface-variant` with the project name in `on-surface` and what it unblocks ("SKU
  productivity workbench unblocks the prototype"). The wait reads "Waiting" in Body XS `on-surface-variant` with
  the duration in Body XS Regular `on-surface` on the same line ("Waiting 1d 4h"); at two business days or more
  the age turns Bold and carries the clock. The action is drawn as a 36 px
  outlined pill (16 px side padding, Button 14/20 Bold), right-aligned, on every row, so the composer's send button
  stays the page's one black control.
- **Marker:** an 8 px `critical` square, centered on the row.
- **On Home** a question row's action reads "Answer" and opens it.
- **In the Inbox** the rows are the list on the left: no panel edge, 2 px apart, 12 px padding, each a button that
  selects its item. The title (Body SM Bold, at most two lines) sits over the project and what it unblocks (Body
  XS), and on the right the kind ("Approval", "Question", "Confirmation") sits over the age, both Body XS Regular
  with no glyph while the wait is short. Rows carry no action; the selected row (`aria-current`, a
  `surface-container-high` fill) shows its item in the detail pane, where the one primary lives (section 12).
- **On the Inbox screen** the filter chips (All, Approvals, Questions, Confirmations, with counts) sit above the
  list with no band, and a closed disclosure row, "Done in the Last 7 Days (5)", follows it; its rows are ink with
  a green check and a project link.

### 9.16 Stat strip

Replaces rows of KPI cards. One `surface` panel, radius 8, an `outline-variant` edge, with equal cells divided by
`stroke-tertiary`. Each cell has 16 × 24 px padding and 4 px gaps: a Body XS label in `on-surface-variant` ("Idea
to Accepted, Median"), the figure in the Figure role with its unit in 16/20 Regular, an optional 96 × 24 ink
sparkline, and a Body XS line saying what changed in words ("Down from 14 last quarter").

### 9.17 Form fields

| Control | Large | Compact (proposed) |
|---|---|---|
| Text input (`FormField/SB`) | 44 px, radius 4, 16 px insets, 16/24 text | 36 px, 12 px insets, 14/20 text |
| Textarea | 16/24 text, 16 px side and 10 px vertical insets, a 12/20 counter 10 px below | none |
| Select | A native select where it fits; 44 px trigger with a 16 px caret 16 px from the right. A custom listbox has 8 px padding, Large elevation, radius 4 (Baselayer's dropdown), 32 px option rows with Body SM, hover `surface-container-high` with Bold text, and a 16 px check when selected | 36 px trigger, the same rows |
| Checkbox, radio | A 16 px mark with a 1px `outline` stroke (1 px radius on the checkbox), checked in `primary`, 16 px to a Body SM label, in a 44 px row where it stands alone | The 16 px mark in a 40 px table column |
| Radio option row | 44 px, radius 4, a visible 16 px radio, an inset 1px `outline-variant` ring at rest; selected is `surface` with an inset 1px `outline` ring, as in the Decision card (section 9.13) | none |
| Switch | A 56 × 32 track inside a 56 × 40 wrapper, a 28 px thumb, radius 16, `primary` when on | none |

- **Label:** a static Label SM label above the field, or an `aria-label` in a toolbar. A placeholder is never the
  label.
- **Colors:** `surface` fill; `outline-field` stroke at rest; `outline` on hover; the focus ring plus an
  `outline` stroke on focus. Placeholders in `on-surface-variant`.
- **Error:** a `critical` stroke and a 12/20 message with an alert glyph in `status-error`, linked with
  `aria-describedby` and `aria-invalid`. This is HD-R1 item 4: fixing the field is waiting on the viewer.
- **Disabled:** `surface-container-high` fill with `on-surface-variant` text. **Read-only:** no stroke, on
  `surface-container`.
- Never ARIA `menu` for choosing a value.

### 9.18 Overlays and toasts

- **Tooltip:** `inverse-surface`, 12/18 text, radius 4, Medium elevation. Baselayer's light tooltip with an arrow
  (`Misc/Tooltip`, `119:9300`) is the first-run coach mark: one per step, at most three (the side nav, the
  composer, the artifact panel), shown once (proposed).
- **Menu and popover:** `surface`, radius 8, Large elevation with its ring, 8 px vertical padding, 32 px rows. The
  shell's menus are specified in section 9.23 and the composer's source menu in section 9.24.
- **Lists of choices that lead somewhere** (First run's starters, an "All Artifacts" list) use Baselayer's Action
  Card (Outline, 76 px, `9284:10703`) or Menu Stack (Compact: 56 px rows with a 16/24 Bold title and a 16 px caret,
  radius 8, `9284:10737`), not 32 px menu rows. Dropdown menus keep 32 px rows.
- **Dialog:** `surface`, radius 8, Large elevation, the scrim behind it, the title in Heading LG, Large actions,
  and a size that hugs its content (Baselayer's desktop dialogs are 448 to 560 px wide). Baselayer draws its
  desktop dialogs square; whether HyperDelivery follows is Brand review item 12.
- **Toast:** Baselayer's `Snackbar` (`9192:25593`, spec sheet `9505:91665`): 344 px fixed wide, 56 px tall for one
  or two lines, `inverse-surface`, radius 4, 8 px top and bottom and 16 px side padding, 16 px between items. An
  optional 32 × 40 thumbnail leads; then Body SM text in white, in sentence case ("Signed version 4. Recorded in
  12s."); one underlined text action ("Undo", "Open") with 8 px vertical padding; and an optional 16 px close X.
  Bottom-left of the main area, 24 px from its edges, Large elevation, `role="status"`.
  - **Loading state:** for background work the person may leave ("Building the prototype in the sandbox"), the
    three-dot loader in white leads the text; when the work finishes the toast turns to its default state with
    "Open".
  - **Undo timer:** a 4 px bar along the bottom edge that shrinks while the undo window runs. Baselayer draws it
    red; HyperDelivery draws it in the toast's ink, which is white on the inverse surface, because red means
    waiting on you (HD-R1). It holds still under reduced motion.

### 9.19 Empty, loading and error states

- **Empty, in a section or panel** (Baselayer's `Page Preview Section` Empty, `11161:102657`, and `_Empty Account
  Section`, `11142:41025`): the section keeps its header and shows one of two compact forms, never a column of
  whitespace.
  - **One line,** when there is nothing to do (Home's Waiting on You): a `surface-container` band, radius 8,
    20 × 24 px padding, Body SM `on-surface-variant` with a Bold `on-surface` lead: "**Nothing waiting on you.** New
    approvals and questions also arrive in Teams."
  - **Block,** when there is one thing to do: 144 px, centered, 16 px vertical padding, no glyph: a title at 16/24
    Bold (Baselayer sets it SemiBold), 4 px, one 14/24 sentence in `on-surface-variant`, 16 px, at most one 44 px
    secondary (Baselayer's is 212 px wide). With its header the whole section is 192 px.
  - A section that has never had content, or that the viewer cannot use, is hidden instead.
- **Empty, a whole page** (an empty Inbox, nothing needing attention): centered, 64 × 24 px padding, 8 px gaps: a
  48 px glyph in `on-surface-variant`, a Heading SM title in Title Case ("Nothing Waiting on You"), one Body SM line
  in `on-surface-variant` at most 360 px wide ("New approvals and questions also arrive in Teams."), and at most one
  Compact secondary action.
- **System work running:** UA's three-dot loader (`Animation/3Dot_Loader`, `1975:18969`), never a ring or a
  spinner. Inline (status lines, Recent rows, project cards, the progress row, trace rows, a button's label) it is
  three 5 px round dots 4 px apart in `#444444`, each pulsing from 30% to full opacity over 1.2 s, 0.2 s apart, so
  the dark dot travels left to right as in Baselayer's three frames. For a panel or app load it is Baselayer's
  full size: 10 px dots 12 px apart, 54 × 10, centered. It is `aria-hidden`; the words beside it carry the meaning.
  Under reduced motion the dots hold still at 60%, and motion stops when the work stops. The markup is
  `<span class="hd-dots" aria-hidden="true"><i></i><i></i><i></i></span>`.
- **Content loading:** skeleton blocks in `surface-container-high` at the size of what they stand for (an Inbox row
  skeleton is 72 px tall, a table row 44 px); the product mark for app-level loading (section 8.3).
- **A person's wait:** never a loader. In the conversation and on the line strip, a 14 px clock glyph and the age
  in Regular ("Waiting on Dana, 4m"); in dense rows a short wait is Regular text with no glyph; at two business days
  or more, everywhere, the age turns Bold and carries the clock (section 3.3).
- **Error in a block:** inside the failed block, never a page-level red banner, drawn as Baselayer's Message
  (`Message/Desktop`, `11289:1816`, Default Gray with fill): `surface-container-high`, radius 4, 16 px padding, a 16
  px X or alert glyph 8 px before one 14/24 sentence ("Couldn't read the margin report."), a "Last good 09:12" stamp
  in Body XS, and one action, a Compact secondary or a Bold link at the right ("Reconnect Snowflake"). The Mini
  size (12/18 text, 36 px tall) fits dense rows. No `accentEdge`, never an HTTP code, and red only when the viewer
  must act (HD-R1).

### 9.20 Provenance strip

Every mockup, preview, screenshot and recording carries a strip that cannot be dismissed: a `surface-container`
band with a 2px `status-accent` top rule, a 16 px alert glyph in ink, and Body SM text that says where the data
comes from: "Synthetic data" on a mockup, "Sandbox, dev data" on a prototype ("Sandbox, dev data. Definitions
match the golden report; numbers not checked on dev data."). Never red, and never orange text.

### 9.21 The line

**The stretches.** Four stretches and three approvals, in this order: **Discover** (Ideation: intake, research,
data discovery, the brief and the mockup), the approval **What We're Building** (it signs the brief and the
mockup together), **Plan** (Inception's documents: requirements, stories, tech design, test plan, tickets), the
approval **The Plan**, **Prototype** (Inception's output, built in the sandbox on dev data), the approval **The
Working Prototype**, then **Handoff** (the handoff package, the demo and the Construction decision), with no notch
after it. HyperDelivery stops at the end of Handoff. Construction and Operations are never stretches of this
line; where a help page or a diagram shows them, they are dashed `#949494` and marked "Outside HyperDelivery" or
"After Handoff".

**Full line** (the line strip on every project screen, section 7.2): a three-row grid at most 760 px wide, four
equal stretches with a 12 px column for each notch. Stretch names sit above the track (Label XS 12/16, centered:
the current stretch Bold `on-surface`, the others Regular `on-surface-variant`), then the track, then the approval
labels under their notches (Label XS Bold, centered on the notch, nowrap; `on-surface-variant` while upcoming),
with a second line underneath in Regular `on-surface-variant`: the split time once signed, a first name for one
signer, "4d 2h, Maya", and a count for several, "3d 2h, 3 signers", never initials; or, while the approval waits, the
wait with a 14 px clock ("Waiting 1d 4h", never "Open 1d 4h"). Rows are 6 px apart and labels never touch the rule.
Notches are 12 px squares, radius 0; the track is 2 px.

| State | Mark |
|---|---|
| Signed | Ink notch, solid stretch before it, the split time under the label |
| In progress | A 4 px solid ink stretch, its name Bold |
| Upcoming | A 2px dashed `#949494` stretch and a 2px `#949494` outline notch on `surface` |
| Waiting on you | A solid `critical` notch with no halo, the label in `status-error` ("Your Approval: The Plan"), and under it a 14 px clock and "Waiting 1d 4h" in Regular ink |
| Waiting on someone else | An ink outline notch, with a 14 px clock and the person and the wait underneath in Regular ("Dana, 1d") |
| Waiting two business days or more | The same notch, with the age Bold beside the clock |
| Partly co-signed | A half-filled notch, "1 of 2" |
| Sent back | "Round 2" at the stretch's end; the earlier split struck through and kept |
| Changes since approval | A 6 px ink dot after the notch, plus "3 changes" |
| Handed off | All three notches signed and Handoff solid; the track ends at Handoff, followed by a short 2px dashed `#949494` stub labeled "Construction" in Body XS `on-surface-variant` |

**Mini line** (project cards, Projects and Portfolio rows, the timeline's header): 8 px notches and a 2 px track
(4 px for the stretch in progress), no stretch names, at most 280 px wide (the card's width on Home). Upcoming
notches take a 2px `#949494` outline and someone else's wait a 2px ink outline; the Recent rows in the side nav use
the same marks at 8 px with a 1.5 px outline (section 9.25). On Home's cards the status line under the line says
where the project stands; where a table row has room, labels sit below with split times only (12/16
`on-surface-variant`), with "You" in 12/16 Bold `status-error` under the red notch.

Both have `role="img"` and an `aria-label` that reads the whole line ("Discover done. What we're building signed
by 3 people after 5d 2h. The plan is waiting on you, 1 day 4 hours. Prototype and Handoff upcoming."; at the start,
"Discover in progress. What we're building, the plan and the working prototype are upcoming."). On the inverse
strip, such as the Teams card header, ink becomes white and the red notch stays `#DC0019`. The plain black square
is reserved for notches and the Recent marks: never a bullet, a section marker or a row glyph. List bullets are
4 px round `#5F5F5F` dots.

### 9.22 Trace bars and lanes

Layer 3 trace rows are 32 px: a 288 px label column (a 24 px logo tile, the step in Bold, the detail in
`on-surface-variant` with an ellipsis), the timeline, and a 112 px value column ("9.8s · $0.04"). Bars are 16 px
tall with radius 0. Layer 2 lanes use 10 px bars on 24 px rows.

| Variant | Bar |
|---|---|
| Working | The agent's hue, solid |
| Waiting on a tool | The agent's tint with an inset 1px ring in its hue |
| Waiting on a person | Hatched gray: 45° stripes of `#D0D0D0` 2 px and `surface` 4 px |
| Failed | `surface` with an inset 1.5 px `outline` ring, a 12 px X glyph at the left, and "Failed" in the label column |
| Retry | The hue, solid, with a 12 px retry glyph, linked to its failed attempt |
| Orchestrator | Ink |

Every bar's row carries the agent's mark and name, so hue never stands alone. The coding agent's row is the
`terminal` glyph in its violet tile, "Coding agent" with the subtitle "AgentCore harness, in the sandbox", and the
model chip "Claude Sonnet 5.5 · via Amazon Bedrock" beside an engine chip naming what ran
([ux-direction.md section 7](ux-direction.md#7-logos-tool-chips-and-model-chips)); where a vendor mark is shown,
it is the Amazon Web Services mark, never Copilot's. Its build is one session band (the agent tint with a 1 px violet ring) holding a tick per turn and a hatched `ask_user` pause.

A step still running shows the three-dot loader (section 9.19) in its value column and in the playback, never a
rotating ring. Agent-to-agent passes are **delegations**: the Layer 2 view is "Decisions and Delegations" and the
trace draws delegation connectors, so "Handoff" means only the end of Inception.

### 9.23 Help menu and account menu

The shell's two menus share one anatomy (proposed): Help, from the "?" at the right end of the top bar, and the
account menu, from the account row at the foot of the side nav, which also holds the workspace switcher. Each is
a native disclosure (`<details>` and `<summary>`), so Enter and Space toggle it, Tab moves through its rows and the
browser exposes the expanded state. Links sit in a plain list and choices are buttons: never ARIA `menu` and never
`aria-haspopup`.

- **Panel:** `surface`, radius 8, Large elevation with its 1px `outline-variant` ring, 8 px vertical padding. Help
  is 256 px wide, 44 px below the top of its button and right-aligned to it. The account menu is 248 px wide and
  opens upward, its bottom 56 px above the bottom of the account row, left-aligned.
- **Rows:** 32 px, 16 px side padding, 8 px gaps, Label SM 14/18 in `on-surface`, no leading glyphs; a trailing
  keycap, badge, state word, check or mark sits at the right edge. Hover fills `surface-container-high`; focus is
  the inset ring.
- **Dividers:** 1px `stroke-tertiary` with 8 px above and below.
- **Closing:** a mouse-down outside closes every open menu; Escape closes it and returns focus to its button. A
  choice that changes state (a workspace) closes the menu.

**Help menu**, from the "?" button:

| Row | Behavior |
|---|---|
| How Work Moves | Opens the Lifecycle map |
| How HyperDelivery Is Built | Opens the platform architecture |
| (divider) | |
| Keyboard Shortcuts, with a ⌘/ keycap | Expands in place to a two-column key list in Body XS `on-surface-variant` (4 × 16 px padding, 8 by 12 px gaps): ⌘K Search; ⌘⇧O New Project; ⌘B Hide or Show the Sidebar; @ Mention a Person or Source; ⌘/ Show Shortcuts; Esc Close |
| What's New, with the NEW badge | Expands in place to the last three changes, each a Bold date and one Body XS line ("Oct 26 A sidebar, and every project's work in one place") |
| (divider) | |
| Ask the Platform Team, with the 16 px Teams mark | Opens the platform team's Teams channel |

On the two help pages the "?" button shows selected, and the row for the current page is Bold with
`aria-current="page"`. Keycaps are Chivo Mono 12/16 in `on-surface-variant` on `surface`, with an inset 1px
`outline-variant` ring, radius 4 and 2 × 6 px padding. In the menu the NEW badge is 12/16 Bold ink on
`status-accent` with 4 px side padding and radius 4.

**Account menu**, from the account row: a block with the name in 14/18 Bold over the role in Body XS
`on-surface-variant` ("Business owner, Merchandising"), padded 8 px at the top, 16 px at the sides and 12 px at the
bottom; a divider; a "Workspace" label in Label XS `on-surface-variant` over the viewer's workspaces as buttons with
`aria-pressed`, the current one Bold with a 16 px check; a divider; "Show Technical Detail", a button with
`aria-pressed` and its state ("Off" or "On") in Body XS `on-surface-variant` at the right; a divider; "Sign Out".
Show Technical Detail brings back Layer 3 detail in place (engine and model names, query ids, commit hashes,
schema paths, run ids); it starts from the viewer's role.

### 9.24 Composer

The box where work starts and continues (proposed component; Baselayer has none, and its 58 px search results
bar, `3734:21360`, is the nearest pattern). Two forms share one anatomy, Home's, which starts a project, and the
workspace's, which continues one. Both are radius 16 with a 1px `#949494` stroke (`icon-disabled`, 3.03:1, enough
for a non-text edge), and focus draws the ring on the whole box (`:focus-within`: a 2 px white separator, then
2 px `#0096FA`).

**Home** (`Main.dc.html`):

- **Box:** `surface`, the width of the 760 px column, with the soft elevation (section 6.3).
- **Text:** a textarea at Body MD 16/24 with 20 px top and side padding and 8 px at the bottom, at least 96 px tall,
  no border of its own, labeled by the page's question and described by the hint, with the placeholder "Describe
  the problem, who has it, and what would help." in `on-surface-variant`.
- **Attached:** only when something is pointed at, a row of 28 px chips 8 px apart, 20 px from the sides: radius
  4, `tertiary` fill, an inset 1px `outline-variant` ring, 8 px left and 4 px right padding, a 16 px brand mark,
  the kind in Bold and the title ("**Jira** MERCH-1182"), the state in `on-surface-variant` ("Indexed", "Reading",
  "Schema only"), and a 24 px icon button named "Remove Jira MERCH-1182".
- **Footer:** one row, 12 px padding, 8 px gaps, with no band: the "+" (a 36 px icon button with an inset 1px
  `outline-variant` ring, named "Point at what you have"); the workspace picker (a 36 px ghost pill with a 16 px
  folder glyph, "Merchandising" and a 14 px chevron; it sets the new project's workspace and starts from the
  viewer's); a spacer; the hint in 12/16 `on-surface-variant` ("Paste links to Teams, OneDrive, Confluence or
  Jira", then "You can add people and data next"); and the 40 px send button, "Start the project", disabled until
  there is text or a source.
- **Source menu,** from the "+": a disclosure panel with section 9.23's anatomy, 296 px wide and left-aligned,
  opening with one 12/16 `on-surface-variant` note ("Read with your access. Nothing is copied out of
  Snowflake.") over 40 px rows, each an 18 px brand mark, the label and a 12/16 hint at the right: Teams
  Recording (Meetings you attended), OneDrive or SharePoint (Files and folders), Confluence Page (With its
  comments), Jira Ticket (With linked pages), Snowflake Report (Certified views), Upload a File (Still works).
  Choosing one adds its chip and closes the menu. Nothing is uploaded unless the person picks Upload a File.
- **Starters as chips:** 16 px below the box, centered and wrapping, 8 px apart, in a group named "Starting points":
  36 px pill buttons (`surface`, an inset 1px `outline-variant` ring, 14 px side padding, Label SM 14/18, a 16 px
  glyph in `on-surface-variant` or a brand mark 8 px before the label; hover `surface-container`). Home shows four:
  Track a Weekly Measure, Spreadsheet to App, Compare Scenarios and From a Jira Ticket. A pick fills the box with
  that starter's sentence (From a Jira Ticket also attaches the ticket) and never submits; starters are not
  toggles, so they carry no `aria-pressed`.
- **After Start,** the new project's workspace opens, and the follow-on choices (what kind of project, who should
  weigh in, how thorough) arrive as one question card in its conversation (section 9.26), not as a form.

**Workspace** (`Start.dc.html`), pinned to the foot of the conversation (section 7.4):

- **Suggestion chips:** 8 px above the box, 6 px apart: 32 px pill buttons, `surface`, an inset 1px
  `outline-variant` ring, 12 px side padding, Label Dense 13/18 ("Make It Simpler", "What Data Will It Use?").
- **Box:** one row with 8 px padding (16 on the left) and 8 px gaps: a textarea at Body SM 14/20 with 8 px vertical
  padding, at least 36 px tall and growing, named "Reply to HyperDelivery", with the placeholder "Reply, or point at
  another file"; a 36 px ghost "+" named "Point at a file or page", opening the same source menu; and the 36 px send
  button, named "Send", disabled until there is text.

**First run:** Home's composer, with the starters as Baselayer Action Cards (Outline, `9284:10703`) instead of
chips, because a first-time viewer needs a line under each starter: a 2 × 2 grid of 76 px cards with 16 px gaps,
each `surface`, an inset 1px `outline-variant` ring, radius 8 and 16 px padding, holding a 24 px glyph, a 16 px gap,
a 16/24 Bold title ("Flag Late Vendor Invoices") over a 12/20 `on-surface-variant` line ("Finance, from the AP
aging report"), and a 16 px caret. A pick fills the box, as on Home.

### 9.25 Side nav item and Recent row

The rows of the side nav (section 7.1), drawn by the shell's `.hd-sn` rule (proposed; Baselayer's account nav,
`9286:10835`, gives the type and the weight-only selection).

- **Item:** a link (Search is a button) 36 px tall, 10 px side padding, radius 8, with an 18 px glyph (stroke 2,
  so 1.5 px rendered) 10 px before the label in Label SM 14/18, nowrap with an ellipsis. The current item is Bold
  `on-surface` with `aria-current="page"`; every other item is Regular `on-surface-variant`, and the glyph takes the
  label's color. Hover fills `surface-container-high` except on the current item; focus is the inset ring.
  Trailing content sits at the right edge: Inbox's count (section 9.7), Library's "Enterprise", Search's keycap.
- **Glyphs:** home, inbox, folder (Projects), book (Library), chart (Portfolio) and settings (Admin), drawn from the
  shell's own `ICON` map (appendix A, side nav glyphs), simpler cousins of section 10's set.
- **Recent row:** a link 32 px tall in Label Dense 13/18, Regular `on-surface` (Bold and `aria-current="page"` for
  the project on screen), with the item's padding, radius and hover: a 14 px slot holding the status mark, 10 px,
  then the project name as typed with an ellipsis and the full name in its `title`. "All Projects", the last row,
  is `on-surface-variant` with an empty slot.

| Mark | Means | Row's accessible name ends |
|---|---|---|
| An 8 px solid `critical` square | Waiting on you | "waiting on you" |
| An 8 px `surface` square with a 1.5 px ink outline | Waiting on someone else | "waiting on someone else" |
| The three-dot loader | System work running | "working" |
| An 8 px solid ink square | Prototype accepted, handoff underway or done | "prototype accepted" |
| An 8 px `surface` square with a 1.5 px dashed `#949494` outline | Draft | "draft" |

The marks are the mini line's own (section 9.21), so a project reads the same in the nav, on its card and on its
line. Red is never alone: the name says "waiting on you" (HD-R1). In the 64 px rail items center their glyph and
the current one fills `surface-container-high`; Recent rows hide.

### 9.26 Conversation items

The items of the conversation (section 7.4), oldest first and 20 px apart (proposed components). Values are from
`Start.dc.html` unless an item says it is not yet drawn on a reference board.

| Item | Spec |
|---|---|
| Requester's message | Right-aligned, at most 344 px wide, its parts 8 px apart: a bubble with 12 × 16 px padding, radius 16 with a 4 px tail corner at the bottom right, `surface-container-high`, Body SM 14/20; under it, right-aligned and 6 px apart, the sources it pointed at as 24 px chips (radius 4, `surface`, an inset 1px `outline-variant` ring, 6 px left and 8 px right padding, a 16 px mark, Label XS); then the byline in Label XS `on-surface-variant` ("Priya Nair, Oct 13, 09:10", section 4.4) |
| HyperDelivery's turn | Left-aligned, its parts 10 px apart: a header (the 20 px product mark, 8 px, "HyperDelivery" in Body SM Bold, then 8 px on the time in Label XS `on-surface-variant`, "Oct 13, 09:12"), then the turn's text in Body Chat 14/22 and its tool-call groups, artifact cards and question cards. Teammates' messages take the same header with their 20 px avatar and name (proposed) |
| Tool-call group | One frame, radius 8, an inset 1px `stroke-tertiary` ring, clipped, rows divided by `stroke-tertiary`. Each row is a `<details class="hd-tool">` whose summary is at least 40 px tall with 12 px side padding and 8 px gaps: a 12 px chevron in `on-surface-variant` that turns 90° when open, the system's 16 px mark, the action in Label Dense 13/18 with an ellipsis ("Read MERCH-1182 and 2 linked pages") and the result at the right in `on-surface-variant` ("12 passages", "2 certified views"); hover `surface-container`, focus the inset ring. Open, it lists plain outcome lines in Body XS `on-surface-variant`, 4 px apart, indented 48 px. Rows start closed; engine, model and query chips show only with Show Technical Detail on. A Snowflake row says what was read ("Layout and counts only; no values left Snowflake"), never rows of data |
| Artifact card | A button in a two-up grid (8 px gaps) that opens its artifact in the panel: 10 × 12 px padding, radius 8, `surface`, an inset 1px `outline-variant` ring (2px `outline`, with `aria-pressed="true"`, while its artifact is open), 10 px gaps: a 32 px `surface-container-high` tile (radius 4) holding the artifact's 16 px glyph, the name in Label Dense Bold over a Label XS `on-surface-variant` version line ("Draft 1, 5 sections", "3 starting looks"), and a 14 px chevron. Named "Open the brief in the panel"; hover `surface-container` |
| Question card | A frame of 16 px padding, radius 8 and an inset 1px `outline-variant` ring, holding one to three numbered questions 12 px apart, divided by `stroke-tertiary` rules. Each question is Body SM Bold ("1. What kind of project is this?") over its answers, 8 px below: answer chips (32 px, radius 4, 12 px side padding, Label Dense; chosen is a `primary` fill with a Bold `on-primary` label, the rest `surface` with an inset 1px `outline-variant` ring) in a `radiogroup` with a roving tab stop; people rows (a 28 px avatar, the name in Label Dense Bold over why in Label XS `on-surface-variant`, and an "Invite" toggle, a 32 px outlined pill with `aria-pressed` that turns `surface-container-high` with a check and "Invited"); or option cards for a choice with a cost, chosen like an answer chip (radius 4, 8 × 10 px padding, the name in Label Dense Bold over when it is ready in Label XS: "Standard", "Ready in 2 weeks"), with the requester's time on one Body XS line under the group ("Your time: about 3 hours, for answers and reviews."). A question asked of someone else adds "Not Me, Suggest Who" and "I Don't Know" as text links |
| Approval card | The question card's frame around a decision that waits on the viewer, ringed by a 1px inset `outline` while it waits (values from `Project.dc.html`): a header with the decision label (section 9.7: a 12 px `critical` square, 8 px, "Your Approval: The Plan" in Heading XS 14/18 `status-error`) over, 2 px below and in line with the label's words, a 14 px clock glyph and the wait in Label XS Regular `on-surface-variant` ("Waiting 1d 4h"; section 3.3), the pair the line's gate label draws, so a long label never crowds the wait; the Handoff's decision card ("Your Decision: Construction", "Waiting 1d") takes the same header; one Body SM line with the approval's position and what signing starts ("Second of three signers. When all three sign, the prototype build starts in the sandbox."); a "Who signs" list (`aria-label`), rows 6 px apart, each a 24 px avatar, the name in Label Dense and the state at the right: "Signed Oct 23" in `on-surface`, the viewer in Bold `on-surface` ("You, now", never red, HD-R1), later signers "After you" in `on-surface-variant`; then "Review and Sign" as a Compact secondary that opens the artifact with the decision bar in its sign state. Once the viewer signs, the ring drops to `outline-variant`, the notch becomes the ink outline and the label names who signs next ("The Plan: Waiting on Dana") |
| System note | One line with no frame: a 14 px glyph (a check in `on-surface` for a signature, a clock in `on-surface-variant` for a wait), 8 px, then Body XS `on-surface-variant` ("Priya, Luis and you signed what we're building, Oct 21. 5d 2h."). A person's wait uses the clock glyph and the age ("Asked Dana Ortiz in Teams how markdowns count. Waiting on Dana, 4m."), never a loader. Never the black square, which is kept for notches and Recent marks (section 9.21) |
| Progress row | Pinned above the composer while system work runs, one line: the three-dot loader, the step and the count in Label Dense 13/18 ("Building the prototype: 3 of 8 pieces, about 2 hours left"), and a Compact ghost "Pause" at the right. Never a percentage. It leaves when the work stops, and a system note records the result (proposed; not yet drawn on a reference board) |

### 9.27 Artifact panel and tabs

The right side of the workspace (section 7.4): tabs on the `#F9F9F9` backdrop over one white panel (proposed
component; values from `Start.dc.html`).

| Part | Spec |
|---|---|
| Tabs | Buttons with `role="tab"` and `aria-controls` naming the panel, 36 px tall, 12 px side padding, radius 8 8 0 0, 6 px gaps: a 16 px glyph, the name in Label Dense 13/18, and an optional state or count in Regular `on-surface-variant` ("Draft", "3 looks", "3"). The selected tab is `surface`, joined to the panel by a 1px `stroke-tertiary` edge on its top and sides, Bold, with `aria-selected="true"` and the one tab stop; the others are transparent, Regular `on-surface`, hover `surface-container-high`. The left and right arrow keys move between open tabs |
| Which tabs | In this order: Brief, Mockup, Plan, Prototype, Data, Sources, Decisions, then "More" for Timeline, Architecture and Trace (Trace with Show Technical Detail on). A tab appears when its artifact exists. When the open tabs do not fit the row, the last ones move into More in the same order (at 1440 px with the side nav, Decisions moves there from the Plan stage on), so the row never wraps or scrolls. The line's next outputs (Plan and Prototype during Discover) show **locked** after the open tabs: glyph and label in `#949494` (an inactive control), `aria-disabled="true"`, a not-allowed cursor, skipped by the arrow keys, and a tooltip saying when it appears ("The plan is drafted after Maya approves what we're building"). Construction artifacts are never tabs |
| Header | 16 × 24 px padding, a 1px `stroke-tertiary` bottom rule, 12 px gaps: the artifact's title in Heading MD 20/24 (the page's `h1`) over its version line in Body XS `on-surface-variant` ("Draft 1, written 2 min ago from 3 sources"); at the right a 32 px ghost "Versions" (a 16 px clock glyph, Label Dense) and a 32 px "Open full screen" icon button |
| Body | 24 px padding, scrolling inside the panel. A document (the brief) is an article at most 640 px wide: sections 20 px apart, each a Label XS Bold `on-surface-variant` heading 6 px above Body MD 16/24 text with citation chips inline (20 px, radius 4, `tertiary` fill, an inset 1px `outline-variant` ring, a 12 px mark and Label XS, the full source in a `title`: "14:02", "MERCH-1182", "Playbook §3"). An open question sits in a `surface-container` band (radius 8, 12 × 16 px padding). Every statement cites where it came from |
| Mockup | The starting looks as a three-up radio group (12 px gaps) of look cards (8 px padding, 10 at the bottom, radius 8, an inset 1px `outline-variant` ring, 2px `outline` when chosen; a 72 px `surface-container` sketch over the title in Label Dense Bold), then the mockup in a radius 8 frame with an inset 1px `outline-variant` ring and a `role="img"` label that describes it, with its provenance under it (`Start.dc.html` draws a Body XS caption, "A mockup shows the shape, not the final app. Numbers are invented; the prototype uses dev data from the golden report."; section 9.20 asks for the strip) |
| Sources | One list (radius 8, an inset 1px `outline-variant` ring): rows of 12 × 16 px padding, a 20 px mark, the title in Body SM Bold over the kind in Body XS `on-surface-variant` ("Snowflake golden report, layout and counts only"), and the state at the right in Label XS Regular `on-surface`, with no glyph or color ("Indexed", "Checked") |
| The other tabs | Plan: requirements, stories and criteria, the tech design summary, the test plan, the tickets and the clickable mock. Prototype: the sandbox preview under its provenance strip ("Sandbox, dev data"). Data: the data map (objects, definitions, query ids; counts and aggregates, never rows) and who ratified each definition. Decisions: decision records and the signed approvals with split times. Timeline, Architecture and Trace: section 12 |
| Decision bar | Section 9.28 |

### 9.28 Decision bar

The foot of the artifact panel when a decision belongs to the viewer (proposed component). It is the workspace's
key moment and holds the page's one black button.

- **Bar:** `surface`, a 1px `stroke-tertiary` top rule, 16 × 24 px padding, 16 px gaps: on the left the decision's
  title in Body SM Bold over one Body XS `on-surface-variant` line saying what happens next; on the right the
  actions.
- **Send for approval** (the requester, at the end of Discover; `Start.dc.html`): the title "Approval 1: What We're
  Building" over "You, Luis and Maya sign the brief and the workbench table mockup together."; the Large primary
  "Send for Approval" (44 px, 20 px side padding), disabled (`disabled` fill, `aria-describedby` its reason, "Choose
  what kind of project this is to send it.") until the open question is answered. Once sent the title reads "Sent
  for Approval: What We're Building" over "Luis and Maya sign next. You will hear back in Teams.", and the primary
  gives way to an "Undo" text link.
- **Sign** (an approval waiting on the viewer; `Project.dc.html`): a title row with the 12 px `critical` square,
  the decision label ("Your Approval: The Plan", section 9.7) and, 8 px after it, the approval's position and who
  else signs in Body XS `on-surface-variant` ("Second of three. Luis signed Oct 23; Dana signs after you."); then
  the attestation checkbox in a 44 px row, "Ask Someone" as an underlined 14/20 Regular text link (3 px offset, 44
  px tall), "Send Back" as the Large secondary and "Sign and Accept" as the Large primary, disabled until the
  attestation is checked; under them the reason in Body XS `on-surface-variant` ("Check the box to sign.", then
  "Signing records your name, version 3 and the time."), linked by `aria-describedby` from the checkbox and the
  button. The button reads "Sign and Accept" on every approval (`Project` and `Gate` alike); the decision label
  names what is signed. No modal, no bulk approve and no shortcut. Once signed it becomes a status ("Signed
  version 4"), with Undo for the toast's window (proposed; not yet drawn on a reference board).
- **Never red** as a fill or a button (HD-R1): the red is the decision label's square and words.

The Construction decision on the Handoff screen is not a decision bar: it is a Decision card (section 9.13) for the
Construction owner, and it records a decision rather than a fourth approval (section 12).

### 9.29 Target-tier chips

A project's target tier is the kind of production app Construction would build: proposed in the brief, confirmed
with the plan, built in Construction. It sets who signs and what the handoff package's Construction checklist
holds. Inside HyperDelivery every project produces the same thing, a prototype in the sandbox on dev data, so the
chip names a target, never something that exists (proposed component).

- **Anatomy:** a neutral tag (section 9.4): `surface-container-high`, radius 4, Label XS Regular, nowrap; 24 px with
  8 px padding in content and rows, 20 px with 6 px padding beside the breadcrumb in the top bar.
- **Words:** "Target: T1 Team App", "Target: T2 Department App", "Target: T3 Engineering-Owned". Its `title` says
  where the tier stands: "Proposed in the brief" until approval 2, then "Confirmed with the plan; built in
  Construction".
- **Where:** beside the project name in the top bar, in the brief's scope, on the plan, in the "Target" column of
  Projects and Portfolio, and on the Handoff screen, where it sets the Construction checklist and the default
  Construction mode.
- **Never** colored, a control, or a claim about use ("Live", "22 people"). A handed-off project shows its status
  beside the chip as words ("Handed off Oct 23", "Construction: AI-assisted").

## 10. Icons

- **One stroke set** on a 24 px grid: no fill, `currentColor` strokes with round caps and joins, and
  `aria-hidden="true"` unless the icon is the only label (then the button carries the name).
- **The rendered stroke is always 1.5 px.** For the inline set, `stroke-width` is 1.5 × 24 / size: 3 at 12 px,
  2.5 at 14, 2.25 at 16, 2 at 18, 1.5 at 24 and 0.75 at 48.
- **Sizes:** Baselayer's `ic` steps 12 (status beside 12 px text), 16 (the default: buttons, chips, tabs, inputs,
  cells, the artifact header), 24 (header actions) and 48 (empty states), plus two the shell uses (proposed): 18
  for the side nav's items, New Project, the rail toggle, Help and the composer's "+" and send, and 14 for small
  chevrons and checks inside 32 to 36 px controls and the system note's clock. Retire 13, 20 and 22. Baselayer's
  `Icon / Sized` slot (`13872:244`) defaults to MD 24 and is the swap target if the shell moves to UA's own glyphs
  (`ic/sm-black/Chat`, `Attachment`, `Upload`, `Menu`, `settings`).
- **Color:** `currentColor` from `on-surface` or `on-surface-variant`. Only status glyphs take a status color.
- **The console** keeps Phosphor, its adopted set (`docs/decisions.md`, 2026-08-27), holding the 1.5 px stroke by
  weight: Bold at 14 to 18, Regular at 24, Thin at 48; at 12, Bold renders 1.125 px, which is accepted (proposed). Map to
  Baselayer's own `ic` assets if a code library or Code Connect mapping appears.
- **Brand marks are not icons.** They keep their own colors and live in logo tiles (section 9.9).
- **Sparkle is banned,** as a glyph and as an idea (no sparkle icons, per the copy rules).

| # | Name | Use | Nearest Phosphor glyph |
|---|---|---|---|
| 1 | home | Home in the side nav | House |
| 2 | folder | Projects in the side nav, the composer's workspace picker, pointed resources | Folder |
| 3 | inbox | Inbox in the side nav, its empty state | Tray |
| 4 | book | Library in the side nav, golden paths | BookOpen |
| 5 | chart | Portfolio in the side nav, metrics | ChartBar |
| 6 | settings | Admin in the side nav, view options | SlidersHorizontal |
| 7 | search | Search in the side nav, table search | MagnifyingGlass |
| 8 | plus | New Project, the composer's "+", add | Plus |
| 9 | chevron-right | Row disclosure, expanders, breadcrumb (optional) | CaretRight |
| 10 | chevron-down | The composer's workspace picker, selects, expanded groups | CaretDown |
| 11 | check | Met, Confirmed, Invited, selected chip | Check |
| 12 | x | Failed, close, destructive | X |
| 13 | alert | Flags, budget over cap, provenance | Warning |
| 14 | info | Help text, tooltips | Info |
| 15 | clock | A person's wait, long waits, stalled, timestamps, the artifact header's Versions | Clock |
| 16 | user | Unassigned signer, people fields | User |
| 17 | users | Teammates, Entra groups | Users |
| 18 | link | Paste a link, Sources | Link |
| 19 | file | Documents; the Brief tab and artifact card add two text lines | File |
| 20 | play | Evidence clips, Replay, walkthrough | Play |
| 21 | pause | Trace and replay playback | Pause |
| 22 | filter | Filter button | Funnel |
| 23 | sort | Sortable column headers (12 px) | ArrowsDownUp |
| 24 | download | Export, Export SVG | DownloadSimple |
| 25 | external | Open in Confluence, CloudWatch | ArrowSquareOut |
| 26 | more | Row actions | DotsThree |
| 27 | lock | Blocked by a Microsoft 365 setting, permissions | Lock |
| 28 | shield | Reviewers and QA, guardrails | Shield |
| 29 | bolt | Automated steps | Lightning |
| 30 | undo | Send Back, Undo | ArrowUUpLeft |
| 31 | partly | Partly Met, partly co-signed | CircleHalf |
| 32 | arrow-right | Flow arrows, in place of text arrows | ArrowRight |
| 33 | retry | Retry From This Step, retry bars | ArrowClockwise |
| 34 | terminal | The coding agent (AgentCore harness, in the sandbox) and its build sessions | TerminalWindow |
| 35 | browser | Browser checks, previews opened as a test viewer | Browser |
| 36 | arrow-up | Increase in a table delta; the composer's send button | ArrowUp |
| 37 | arrow-down | Decrease in a table delta | ArrowDown |
| 38 | help | The Help button in the top bar | Question |
| 39 | sidebar | The rail toggle in the side nav | SidebarSimple |
| 40 | mockup | The Mockup tab and artifact card | Layout |
| 41 | plan | The Plan tab and artifact card | ListBullets |
| 42 | prototype | The Prototype tab and artifact card | Play inside a square (no direct glyph; keep the inline path) |
| 43 | expand | Open full screen in the artifact header | CornersOut |
| 44 | chevrons-up-down | The account row in the side nav | CaretUpDown |

The inline paths, for the canvas and for any surface that cannot load Phosphor, are in appendix A.

## 11. Screen sizes and theme

HyperDelivery is a desktop and laptop tool: browsers 1280 px wide and up, plus Teams on the desktop. Phone
layouts are out of scope. Screens are designed at 1440 and checked at 1280 × 800; section 5.2 says what gives way
between the two. Nothing in the system depends on touch, and controls keep the desktop sizes in section 5.3.

The system has one theme, light. Dark is out of scope for now: no dark tokens, no dark variants of components or
marks, no `prefers-color-scheme: dark` rules and no theme switch. Pages set `color-scheme: light`. The
`inverse-surface` strip (the Decision card, toasts, tooltips, the Teams card header) is part of the light theme,
not a dark mode. If a dark theme returns, it starts from Baselayer's dark primitives and gets its own Brand review.

## 12. Per-screen notes

What matters for each console screen. Screen content, roster and copy live in
[ux-direction.md section 4](ux-direction.md#4-key-screens).

Every screen below arrives in the Final MVP unless it is marked Enterprise. Each has at most one primary action,
and section 7.2 says where it lives. Every screen has the side nav and the top bar of section 7.1; the notes say
only what differs. `Main.dc.html` and `Start.dc.html` are the reference boards; the others follow them.

**Home.**
- No page header: the top bar reads "Home" with no rule. The page is the question "What Do You Want to Make?"
  (Heading XL, centered), the composer (section 9.24) and four starter chips, in the 760 px column.
- "Waiting on You" (section 7.3's header, with "2 approvals, 1 question and 1 confirmation, oldest first" and "Open
  Inbox (4)"): up to four Inbox rows (section 9.15), each with the outlined action. When nothing waits it is the
  one-line note (section 9.19).
- "Pick Up Where You Left Off", with "All 7 Projects": three project cards (section 9.12) with their mockup or
  prototype thumbnails, the mini line and one status line ("Building the prototype, piece 3 of 8", "Your approval:
  The Plan", "Construction decision pending"). The Activation scorecard card opens its Handoff screen
  (`Graduation.dc.html`).
- Nothing else. The "Shipped Across UA This Week" rail is gone (handed-off work lives in the Library's Recently
  Handed Off), with no KPI tiles and no right rail. The composer's send button is the page's one black control.

**First run** (`FirstRun.dc.html`; the viewer is Nadia Flores, a Merchandise Planner, on her first visit).
- Home is the current item and the top bar reads "Home"; the Inbox shows no count, and the side nav hides Recent
  until there is a project. The page opens with Home's question, "What Do You Want to Make?", in Heading XL.
- One coach mark (section 9.18) points at the composer: "**Start here:** describe the problem, or paste a Teams,
  OneDrive, Confluence or Jira link", with a "Got It" ghost button. It shows once.
- The composer (section 9.24) with its starters as four Action Cards (Track a Weekly Measure, Flag Late Vendor
  Invoices, Watch Late Purchase Orders, Plan Weekly Labor by Store), each with its function and source on a second
  line; its send button opens the new project's workspace with the idea carried over.
- Two text links close the page: "See How It Works (2 min)", which plays the walkthrough, and "Browse Projects". No
  showcase of teammates' projects: recently handed-off work lives in the Library.

**Inbox.**
- Inbox is current and the top bar reads "Inbox". A list and a detail, like a mail client: the list on the left
  (440 px, `surface`, a 1px `stroke-tertiary` right rule), the selected item's detail on the right on
  `background`.
- The list opens with "Waiting on You" in Heading MD and the meta "4, oldest first" (Body XS), then the filter chips
  All, Approvals, Questions and Confirmations with their counts, then the rows of section 9.15 (title, project and
  what it unblocks, kind and age; no action on the row), then the closed "Done in the Last 7 Days" row. The oldest
  item opens selected; arrow keys move the selection.
- The detail is a white panel: the kind tag, the project link and "Open Project" where it helps; the title in
  Heading MD; one Body XS meta line with the viewer's red label ("Your approval", the region's one red label), the
  wait with a 14 px clock ("Waiting 1d 4h", Regular ink), the position ("Second of three signers") and what it
  unblocks. An approval then shows a Body MD summary, What You're
  Signing (object chips with counts), Where It Stands (the mini line with split times) and Who Signs, in Order
  (28 px avatars; the viewer as Bold ink "You, now", signed states in `on-surface`, section 3.3), and ends with
  "Review and Sign", the Large primary and the page's one primary, which opens the project's workspace with the
  decision bar in its sign state, beside "Also sent to you in Teams". A question shows its context, its cited
  sources and Your Answer (answer chips as a radio group, an optional reason, "Send Answer", and "Not Me, Suggest
  Who" and "I Don't Know" as text links). A confirmation lists what was heard, To Review first.
- The empty state: "Nothing Waiting on You" and one line in the detail panel, with "Open Projects".

**Projects.**
- Projects is current and the top bar reads "Projects". One toolbar row opens the content: "Search projects"
  (36 px, with a `/` keycap), five filter chips with counts (All 7, Waiting on Me 3, Building 1, Handed Off 3,
  Needs Attention 2) and, on the right, a Gallery and Table segmented control (Gallery by default). The footer
  reads "7 projects, 3 waiting on you".
- Gallery: project cards (section 9.12) in an auto-fill grid of at least 256 px, each with its latest mockup or
  prototype as the thumbnail (with its provenance tag, and a flag such as "Waiting 2 Days" where one applies), the
  name and meta, the mini line, one status line, and who it waits on with the wait in a footer row.
- Table: Project (a 24 px owner avatar, the name in Body SM Bold as the link, "owner, workspace" in Body XS), Target
  (the target-tier chip, section 9.29, at least 184 px, nowrap), The Line (mini), Waiting On, Last Activity,
  Elapsed, Cost, Status ("Handed Off", with "Construction: AI-assisted" once decided). No checkboxes and no row
  menus. Below 1440 the Cost and Elapsed columns drop, so Status stays in view without a sideways scroll.

**New project in Discover** (`Start.dc.html`).
- The workspace at its first stretch. Projects is current and the new project is the current Recent row, with the
  dashed draft mark; the top bar reads "Projects / SKU productivity workbench" with the "Draft" tag, Priya's avatar
  and "Share". The requester has nothing to sign, so the Inbox shows no count.
- The line strip: Discover in progress, three upcoming notches, and "Discover outputs a brief and a mockup".
- The conversation: Priya's request with the two sources she pointed at; HyperDelivery's turn with three
  tool-call rows (Jira, Teams, Snowflake), one sentence and two artifact cards (Brief, Mockup); one question card
  with three questions (what kind of project, who should weigh in, how thorough); a system note for the question
  asked of Dana in Teams; then the suggestion chips and the composer.
- The panel: Brief (Draft), Mockup (3 looks) and Sources (3), then Plan and Prototype locked. The Brief is five
  cited sections and an open question; the Mockup is the three starting looks and the chosen mockup; Sources is
  three rows with their states.
- The question card's depth choice is three option cards, "Light", "Standard" and "Thorough", over "Ready in 3
  days", "Ready in 2 weeks" and "Ready in 4 weeks", with the requester's time on one line under them ("Your time:
  about 3 hours, for answers and reviews.").
- The decision bar: "Approval 1: What We're Building", with "Send for Approval" disabled until the kind of project
  is chosen, and Undo after sending. Priya, Luis and Maya sign the brief and the mockup together; once sent, the
  note reads "Luis and Maya sign next."

**Project workspace** (`Project.dc.html`).
- The same workspace further along: SKU productivity workbench in Plan, with The Plan waiting on Maya (1d 4h,
  second of three signers). The top bar adds "Target: T1 Team App", the avatar stack and "Share". No red capsule:
  the line's notch, the approval card and the decision bar carry the red.
- The conversation holds the approval card ("Your Approval: The Plan"), the tool-call groups and system notes for
  what was signed ("Priya, Luis and you signed what we're building, Oct 21. 5d 2h."). "Review and Sign" opens the
  Plan tab with the decision bar in its sign state.
- The Plan tab: What You'll Get, What It Skips and What Data It Uses as three columns split by `stroke-tertiary`
  rules with Heading XS headings; the clickable mock with its provenance strip; then the work breakdown. The
  decision bar: the attestation, "Sign and Accept" (disabled with its reason until checked), "Send Back" and "Ask
  Someone". The Data tab's summary reads "Target tier this data allows: T1 Team App, built in Construction".
- In the Prototype stretch the progress row reads "Building the prototype: 3 of 8 pieces, about 2 hours left" with
  Pause, and the Prototype tab shows the sandbox preview under "Sandbox, dev data". Branch, pull request and the
  check strip sit in a closed "Technical Detail" row of the build's tool-call group.

**Approval, a workspace view** (`Gate.dc.html`).
- Wholesale sell-through tracker with The Working Prototype waiting on Maya (3h 10m, the last of three signers).
  Opened from the Inbox, the top bar reads "Inbox / Wholesale sell-through tracker" with "Target: T1 Team App". The
  Prototype tab is open on version 4; its header says who requested it and who can open it ("Project members and 6
  named testers").
- "Evidence, Criterion by Criterion" (Heading SM, as every section heading inside the panel) with summary statuses ("5 Met", "1 Partly Met"). Each criterion
  row has a 128 × 80 real crop in a `surface-container-high` tray (4 px padding, radius 8 outside and 4 inside; a
  different crop per criterion), the criterion number, the status, the criterion in Body MD, an object chip, and a
  36 px ghost play button with its length ("0:24") whose `aria-label` names the criterion. Advice from checks is
  the last row, with the alert glyph ("Fine for a prototype. Construction fixes it before anyone relies on it.").
- "Numbers Check" says what dev data allows: "Definitions match the golden report; numbers not checked on dev data
  (checked in Construction)". It never claims numbers match on dev data.
- What This Prototype Skips (with "Not needed for a prototype; listed for Construction"), and Who Signs, in Order
  (a 120 px status column, the viewer as Bold ink "You, now"). Repository and hash chips show only with Show
  Technical Detail on.
- The decision bar is `Project`'s: the attestation in a 44 px row, "Sign and Accept" disabled with its reason
  directly under it until the attestation is checked, "Send Back" as the Large secondary, and "Ask Someone" and
  "Reassign" as links.
- Once Maya signs, the line's last notch turns ink, the conversation records what the handoff filed ("Filed Jira
  epic WHSL-430", 7 issues, filed at the handoff after approval 3; the AI-DLC context files, "7 of 7 valid") and a
  Package tab lists the handoff package's 10 items, the same as the Handoff screen.

**Confirm what we heard, a workspace view** (`ContextReview.dc.html`).
- Opened from its Inbox row or a card in the conversation: the What We Heard view of the Sources tab. "Finish
  Review" is the primary, disabled with "5 left to review" until every item is handled. The counts live in the
  meta and the filter chips (All, To Review, Confirmed), not in boxed stats.
- Rows: a type badge in a fixed 112 px column, the statement in Body MD, attribution on its own Body XS line.
  Proposed rows get "Confirm" (Compact secondary) and "Not Right" (ghost), each with an `aria-label` naming the
  statement. Confirmed rows show the status "Confirmed by you" and an "Undo" link, never a button.
- The dispute, "Pick This Project's Level", carries an alert glyph, one status line, both positions under a closed
  "Show Both Positions" disclosure, and the resolutions as radio option rows with the certified level marked
  "(Recommended)".

**Timeline and trace** (`Activity.dc.html`, under More).
- The workspace with More open on Timeline. "What Happened / Decisions and Delegations / Trace" is a segmented
  control alone on a row at the top of the panel body, right-aligned.
- A failure that waits on the viewer is the panel's top band (`surface-container`): the 8 px red marker, one plain
  sentence, "Last good" and one Compact secondary that jumps to the failed step. The conversation shows the same
  failure as a card with that action.
- The event list: dates in Body SM Bold tabular; one 24 px glyph column (an avatar for people, a logo tile for
  systems, an 8 px ink notch for approvals, a hatched 12 px square for waits); a fixed 120 px column of Bold
  durations, with notes on a Body XS second line; waits on `surface-container`, never yellow.
- "Who Held the Work" is the decision timeline by person: 32 px rows in each person's fill, hatched waits,
  and an Approvals rail on top whose notches carry their names ("What We're Building, 3d 2h", "The Plan, 5d 4h",
  "The Working Prototype"), a today line, and a legend row under the chart (Waiting, Deciding, Asked). Waits in the
  event list name the approval and its signers ("Waited for plan approval from Rina, Luis and Omar").
- Decisions and Delegations and Trace are Layers 2 and 3, so agent hues are vivid there. Running steps show the
  three-dot loader, never a ring (section 9.22).

**Project architecture** (`Architecture.dc.html`, under More).
- The diagram fills the panel body with 32 px zoom and fit; the toolbar holds the "Edge Labels" switch, a Body XS
  provenance line ("Version 4, signed with the plan Oct 21"), the count of components and flows, and a ghost
  "Export SVG". The canvas splits "Prototype (sandbox, dev data)" from "Production target (built in
  Construction)", the second dashed.
- A side column of the panel holds "Replay a Flow" (scenario chips, numbered steps, play, previous and next) and
  then a closed "Legend". A node click swaps it to that node's details, with "Back to Replay". "Decisions Behind
  This Design" follows across the full width.

**Needs attention** (`Failures.dc.html`).
- Projects is current and the top bar reads "Projects / Needs Attention"; the counts open the content. Filter chips
  (All, Failed, Blocked, Stalled, Budget) carry their status glyphs and sit in a toolbar band at the top of the
  list panel.
- The list is one panel grouped by project: a Heading SM group header with an "Open Project" link whose
  `aria-label` names the project. Rows have a 24 px system tile, the title in Heading SM, one plain status line
  ("Couldn't run the query"), labeled pairs in Body XS ("Last good 09:12 today", "Notified Noah Park"), at most two
  lines of explanation in a middle column no wider than 480 px, and actions on the right. Codes, test names and
  the repository sit behind "Open Trace". The red 8 px marker, with "Waiting on You" in ink Bold, appears only
  where the failure waits on the viewer. The most severe row gets the Compact primary. Only work inside
  HyperDelivery appears; nothing here is a live app.
- A workspace budget reaching its cap (Enterprise, when budgets are enforced) is a "Budget" section below the
  project groups: a stage bar on the ink ramp with direct labels ("Prototype $140, Plan $60, Discover $40"; "$240 of
  $300, 80%") and "Ask Maya to Raise the Cap" as a Compact secondary.
- Empty: a 48 px check glyph, "Nothing Needs Attention" and one line, with no button.

**Handoff** (Final MVP; `Graduation.dc.html`).
- The project's workspace as the Construction owner sees it after approval 3 (Kim Patel, Retail Systems). The top
  bar reads "Projects / `<Project>`" ("Inbox / `<Project>`" when opened from the Inbox), with the "Handoff Package
  Ready" tag, the avatar stack and "Try the Prototype". The line strip shows all three approvals signed (split
  times and 2 signers each) and a short dashed Construction stub marked "Outside HyperDelivery".
- The conversation: the three signatures as system notes; HyperDelivery's turn with four tool rows (Filed Jira
  epic MKTG-418, 9 issues; Wrote the AI-DLC context files, 9 of 9 valid, checked with engineering's validator;
  Prepared the repository transfer; Mapped dev data to production, 4 sources), one sentence and the Package,
  Prototype, Mockup and Decisions cards; the business owner's message; the viewer's question and HyperDelivery's
  answer; and a decision card, "Your Decision: Construction", whose "Review and Decide" opens the Construction tab.
- The panel's tabs are Construction, Package (10), Prototype (v5) and Decisions. The Construction tab holds the
  decision of section 9.13: the recommendation from risk and the target tier in a `surface-container-high` band,
  "Build It in Construction" with AI-Driven (marked Recommended) and AI-Assisted With Engineers (with "Rebuild From
  the Plan" as a checkbox under it) as option rows, then "or" and Not Now, and a note for the business owner. One
  line under the heading says engineering's gates on push, merge and release apply in both modes and a pipeline,
  never a model, deploys. "What Construction Adds" lists what the prototype lacks (production data connections,
  tests in CI, scans, runbook, monitoring), each "Added in Construction" in Regular `on-surface-variant` with no
  glyph. Who Decides shows the viewer as "Kim Patel, you", then the business and data owners.
- The decision bar (section 9.28) reads "Your Decision: Construction" with the chosen option in its position line,
  "Ask Theo" and "Sign Decision". The chosen option shows in the record, never on the button.

**Teams cards and the task module.**
- Teams chrome stays, and Teams purple appears only on Teams-native controls. The bot avatar is the product mark.
- Adaptive Cards render in the host's type and colors, so carry what survives: the line as an image on the inverse
  strip (white ink, red notch), Title Case labels, lowercase durations ("1d 6h"), dates as "Oct 25, 14:02", and
  statuses as glyph plus word. The weekly digest ("This Week Across UA") carries one "3 Handed Off" row naming the
  projects, never "Went Live".
- The task module has a full-window scrim, a dialog sized to its content, the rows in the Plan tab's order (What
  You'll Get, What It Skips, What Data It Uses), the checkbox directly under the list, and "Pending Signature" in
  Heading XS. The receipt ends with an "Open Project" link.

**Working session (Enterprise).**
- Teams' light chrome around the meeting; the shared stage and the HyperDelivery side panel use this system.
- The stage title is Heading LG with items in Body MD; its tabs sit under the title as 44 px tabs.
- The side panel has the product mark and "HyperDelivery", "Now Asking" as a plain section and "Captured
  (Proposed)" in Heading XS, type badges in a fixed 72 px column, and a "Confirm What We Heard" link under the
  captured list. Attribution chips never wrap. Nothing below 12 px.

**Library (Enterprise).**
- Library is current and the top bar reads "Library"; meta pairs (Workspace, Confirmed Facts, Reused This Quarter,
  Disputes Resolved) open the content. No page primary.
- The facts table under a toolbar band ("Search facts" with `/`, type chips): type badges in a 112 px column, Fact
  and Source, Confirmed By, Used In and Status, with "Canonical" as a green check plus word and reuse counts with
  correct plurals.
- The rail is one panel: Golden Paths (rows with a 40 px logo tile, the name in Heading SM with "Recommended" as a
  badge above it, two lines of Body SM; the selected row is the 2px ink outline on `surface-container-high`) and
  Recently Handed Off ("Across UA, last 14 days", with owners' avatars; each row reads "owner, workspace, handed
  off Oct 23" over its Construction state, "Construction decision: Kim Patel, 1d" or the chosen mode, and "built
  in Construction, now in production" only where Construction has shipped it).
- Reached from a project, the top bar reads "Projects / `<Project>` / Facts for This Idea", Projects stays current,
  a Use column labels each checkbox "Use: <fact>", and the sticky action bar ends in "Start With 6 Facts" (Large
  primary, built whole) and "Back".

**Portfolio (Enterprise).**
- Portfolio is current, for sponsors and leads only, and the top bar reads "Portfolio". The scope goes in meta pairs
  (Period, Workspaces), and Month, Quarter and Year sit as a segmented control at the top of the content.
- A stat strip replaces the KPI cards, with ink sparklines and deltas in words; one cell is "Requesters Who Came
  Back" ("11 of 19 started a second project"), and "Construction Decisions Pending" sits beside "Accepted
  Prototypes".
- The table keeps solid filter chips ("Status: Open or Handed Off"), mini lines with split times, ink elapsed bars
  with no track, logo stacks of three plus `+N`, a Target Tier column at least 184 px wide, statuses that name the
  Construction mode once decided, and pagination with real `disabled`. It scrolls inside its panel below 1440 with
  Project pinned.
- Bottom cards in a 2 × 2 grid: waits by person in their fills, spend by system in brand hues, "Use Cases Tried" as
  ink bars on a `--hd-data-track` track, and what it is worth so far, all labeled directly.

**Admin (Enterprise).**
- Admin is current, for admins only; the top bar reads "Admin / Merchandising" with "Admin" as plain text; the
  title "Workspace Guardrails" and the tabs Guardrails, Audit Log and Usage open the content. Rail layout, 56 px
  between sections.
- "Prototype Contract" is one row (project members and named testers, dev data, the sandbox, an expiry), with
  "Target Tiers, Built in Construction" as a read-only reference beside it. Connectors: a 40 px tile, the name, a
  Body XS description (not mono) and the target tiers it serves; the state as a status word ("Connected" with a
  green 8 px dot, "Paused" in ink) and a 36 px "..." icon button per row ("Actions for <connector>") with Pause
  Connector, Reconnect and View in Audit Log. Only the exception row is loud (Bold, alert glyph). Mono only for
  real identifiers.
- Read and "Write, After Approval" as tags, Write in the emphasis variant. "Pre-Approved Data" lists what needs no
  separate data approval ("Prototype: dev data; the production envelope applies in Construction"). Jira reads
  "Issues created at the handoff". "Who Can Do What" keeps right-aligned tabular counts, with no bars.
- Usage holds the budget (an ink bar with an alert tick at 80%, a `--hd-data-track` remainder, the forecast in Bold
  ink with an alert glyph) and spend by project. Audit Log is a table of When, Who and What.
- The rail holds the policy change as a Decision card ("After" on `surface-container-high` with the changed words
  in Bold, "Before" struck through on `surface-container`; its "Review and Sign" is the page primary) and Models
  Allowed. "Suggested Rules (3)" closes the main column, each with "Promote" (Compact secondary) and "Dismiss"
  (ghost).

**How Work Moves (help).**
- The Help variant: the top bar reads "Help / How Work Moves", no side nav item is current and the "?" is selected.
  The title and meta pairs ("Steps on This Path", "Approvals 3 at every depth") open the content, over a toolbar
  row: Path and Depth as segmented controls on the left, a 36 px ghost "Legend" on the right that opens both legends
  (step types, with no tag meaning a step runs on its own; and who owns each step, including "Outside
  HyperDelivery").
- Phases in Heading MD with a Body SM subtitle and a Body XS count (not mono): Ideation "Shape the idea and the
  look", Inception "Agree what and how, then prove it", then Construction "Build for production" and Operations
  "Deploy, promote and run", both dashed and marked "Outside HyperDelivery", with engineering's step names in
  engineering's order (Code, Review, Manual QA, Visual QA, Deploy). Step cards hug their content: the step id in
  mono, the owner with a 24 px tile, selection as `surface-container-high` plus the 2px ink outline, no agent left
  rules. Agent hues stay vivid. A Construction-decision rule sits after Handoff.
- Approval tiles keep their numbered ink notches, approval 1 at the end of Ideation. A selected step's detail opens
  inline under its phase row, full width, with at most four Heading XS groups and a 36 px close button.

**How HyperDelivery Is Built (help).**
- The Help variant: the top bar reads "Help / How HyperDelivery Is Built", no side nav item is current and the "?" is
  selected. One meta line opens the content (where it runs, where it builds, the systems it connects to as four
  logo tiles, the part count).
- The toolbar holds a segmented control, Today, MVP and Enterprise (MVP by default), with the note "Dashed:
  arrives in Enterprise". Today lights only what runs now; MVP dims the Enterprise parts and includes the handoff
  package; Enterprise shows all, including HyperDelivery Production and the Construction intake. Jira issues are
  filed at the handoff, after approval 3.
- The rail holds the replay; a node click swaps it to that part's details, including the phase it lands in, with
  "Back to Replay".

**Both architecture canvases.**
- Zones are `surface-container` with a 1px edge in the system's hue plus its mark; the HyperDelivery zone edge is
  ink. Nodes are `surface`, radius 8, with a 24 px tile, a Body SM label and a Body XS sublabel (mono only for
  identifiers). Replay dims only borders and icons; text stays at `on-surface-variant` or darker.
- Edge labels are 12 px ink on `surface` chips (radius 4, an `outline-variant` ring) at the midpoints, never
  colliding. Zoom and fit are 32 px. The legend names the ink orchestrator and each agent hue.

**The line.** The specimen of section 9.21: every state, Handed off included, and the scales (the line strip, the
project card, a table row, the Recent marks, the Teams card header on the inverse strip, the app icon at 24, 40 and
64, the lanes rail).

## 13. Checking a screen

Run these before a screen ships.

**Source scans** over `ui/console/src`, each returning nothing:

- `letter-spacing` or Tailwind `tracking-*`; `font-stretch`; `uppercase` outside the Badge component.
- Weights other than 400 and 700 (Tailwind `font-medium`, `font-semibold`, `font-extrabold`, `font-black`).
- Font sizes outside the scale, half pixels, or anything below 12.
- Hex literals outside `index.css` and brand-mark files, and any of the retired values in section 3.7 (`#e4002b`, `#e6e6e6`,
  `#8a8a8a`, `#f5f7ff`, `#4f46e5`, `#8a5a00`, `#8e1b12`, `#fff4e0`, `#e6f4ed`).
- Radii other than 0, 1, 4, 8, 16 and pill.
- `outline: none` or `outline-none` without the focus ring drawn in its place.

**Visual checks:**

1. **Shell:** the side nav is identical across screens except the current item, the Inbox count, the viewer, the
   Recent list and the role-gated rows, and it collapses to the rail and back. The top bar holds only the page name
   or breadcrumb, the page's actions and Help. The only black pill on a screen is the page's own action; New
   Project is outlined. The screen has exactly one `<main>` landmark, around its content and never around the side
   nav; menus that list links or buttons carry no ARIA `menu` or `menuitem` roles, and `aria-controls` names only
   elements that exist.
2. **Planes:** the main surface is white; the side nav and the artifact backdrop are `#F9F9F9`; panels on white
   have a `#D0D0D0` edge. No bordered box inside a panel except the evidence tray. No colored side stripes. No
   card holds open a column of whitespace.
3. **Red test:** hide everything but red. Each red element answers "what do I need to do?" At most one filled
   capsule per region. No red buttons, charts, deltas or halos.
4. **Color meaning:** stages are the same ink ramp on every screen; no agent hues in Layer 1; selection is weight
   in the side nav, `#F0F0F0` plus the 2px ink outline on a selected card, and white with a 1px ink ring on a
   selected option row.
5. **Thumbnail test:** at thumbnail size, Layer 1 screens show brand marks in color and colored avatars.
6. **Type:** no ALL CAPS except badges, no condensed figures, lowercase durations, Title Case UI words.
7. **Wrapping:** no id, status, duration or name split across lines; no line starts with a separator.
8. **States:** every interactive element shows the `#0096FA` ring on keyboard focus; done actions are statuses.
9. **Contrast:** text is at least 4.5:1 (`#5F5F5F` is the lightest text); value marks are at least 3:1
   (`#949494` is the lightest); green text is never on a tint.
10. **Marks:** no broken images; every mark sits in a tile beside its name; at most three per stack.
11. **Size and theme:** the screen renders at 1280 × 800 with nothing clipped and no page-level horizontal scroll;
    it sets `color-scheme: light` and carries no dark rules or theme switch.
12. **Copy:** no sentence explains the screen to the person looking at it, and nothing advises which other tool to
    use.
13. **Motion and waits:** running work shows the three-dot loader, never a ring or a spinner, and nothing clips it;
    a person's wait shows the age (a 14 px clock in the conversation and on the line strip, no glyph in dense rows
    until two business days, Bold with the clock after); progress is step and count, never a percentage; under
    reduced motion nothing animates.
14. **Scope words:** nothing reads "Live", "Go Live" or "Graduate"; Construction and Operations appear only dashed,
    as "Outside HyperDelivery" or "After Handoff"; agent-to-agent passes are "delegations"; a prototype always
    carries "Sandbox, dev data" or "Synthetic data".

## 14. Adopting it in the console

1. **Tokens and fonts.** Replace the `@theme` block in `ui/console/src/index.css` with the role tokens, aliases,
   type pairs, spacing names, radii and elevation in this document, light only (the dark block goes), and
   self-host Archivo and Chivo Mono in place of Geist. Components move from today's names to roles in the same change, so no old token
   survives (section 3.7 is the map).
2. **The red remap** finishes here: primary buttons become black pills, the focus ring becomes `#0096FA`, and
   selection, the account avatar and the hazard stripe stop using red
   ([ux-direction.md section 6](ux-direction.md#6-visual-language)).
3. **The shell and the workspace** (section 7): the side nav, the slim top bar and the project workspace, replacing
   the eight-step top bar. Once Brand has reviewed the lockup, the side nav takes the product lockup (section 8.2)
   from the copied SVG in place of today's `ui/console/public/ua-logo.png` in `TopBar.tsx` and `Answer.tsx`. That
   PNG is a 512 px red "Enterprise Data Management, Data & Analytics" team badge, not the UA logo: at 24 px its red
   reads as "waiting on you" (section 3.3).
4. **Components** in the order the Final MVP screens need them: buttons, chips, status and the three-dot loader,
   avatar, logo tile, the side nav item and Recent row, the shell's menus, the composer, the conversation items, the
   artifact panel and tabs, the decision bar, the line, target-tier chips, tabs and segmented control, panel and
   Decision card, data table, Inbox row, form fields, overlays.
5. **Screens,** each checked against section 13.

## 15. Brand review

These go into the dated Brand review that runs in the long-lead track
([ux-direction.md section 6](ux-direction.md#6-visual-language)):

1. Whether internal tools may license UA Text and UA Technical, whether the console may self-host them, and
   whether a published canvas may embed them.
2. The product lockup in its two forms (section 8.2: the UA logo and "HyperDelivery" at the top of the side nav;
   the logo, hairline and name in a page header), the product name's setting, and whether the console's Enterprise
   Data Management badge stays on its sign-in page (`AuthGate.tsx`). The concept screens already carry the
   lockup; the console waits for this item.
3. HD-R1: using `critical` red to mark attention rather than a transaction button, with no red buttons.
4. The color extensions: agent hues, system brand hues for data series, the ink data ramp and the people fills.
5. `on-inverse-variant` (`#D0D0D0` on the inverse strip), a value Baselayer does not publish.
6. The proposed component sizes: 36 and 32 px buttons, the 40 px New Project and send buttons, the 32 px Help
   button, 24 px object chips and tags, 20 px badges at 12/16 in the UA Technical stand-in, the 8 px surface radius,
   the 248 px side nav and 64 px rail, 18 and 14 px icons, the 16 px composer and bubble radius and the composer's
   soft shadow, the two workspace type roles (13/18 and 14/22, outside Baselayer's scale), the three-dot
   loader's 5 px inline size, and the tab, table, ghost-button, menu, composer, conversation, artifact panel,
   decision bar, target-tier chip and stat-strip specs.
7. Title Case as the product's UI copy rule.
8. Third-party marks in product chips (already a long-lead item in ux-direction.md).
9. Conflicts inside Baselayer that were resolved provisionally: `on surface variant` (`#5F5F5F`, against the
   skill's `#444444`), the light container fills (labels against rendered swatches), one black (`#1D1D1D` against
   `#151515`), the `outline` value, and the green hex (`#00834B` against `#008850`).
10. Weight 600 in the production font. Baselayer's own components use SemiBold 600 for text links
    (`Btn/TextLink/General`), status words, badge numbers and empty-state titles; section 4.5 bans 600 because the
    Archivo stand-in ships only 400 and 700. If Brand licenses UA Text, may the console use 600 where Baselayer
    does?
11. The 0.5 px tracking on large Bold. Baselayer's dialog titles (24/32) and its search query (32/40) carry 0.5 px of
    letter-spacing; section 4.5 bans any tracking for the stand-in fonts. Does the production font follow
    Baselayer?
12. Square dialogs. Baselayer's desktop dialogs render with square corners (its header is 560 px wide with 40 px
    padding), which matches "square is the brand motif"; this system draws dialogs at radius 8 (section 9.18) and
    keeps 8 for menus and cards, as Baselayer's Menu Stack and Action Card do. Should dialogs go to 0?

## 16. Decisions to log

Each of these chooses between real alternatives, so each gets an entry in
[docs/decisions.md](../decisions.md) through the
[log-decision](../../.github/skills/log-decision/SKILL.md) skill:

1. **Baselayer is the visual source of truth,** and this document replaces ux-direction.md section 6's reading of
   UA's public brand.
2. **Baselayer role names are the console's CSS token names,** with `--hd-*` aliases for product meaning.
3. **HD-R1, the red rule.** It retires `danger`, `caution` and every status tint, and rejects a red commit button.
4. **Title Case for the UI's own words,** reversing the sentence-case rule in ux-direction.md sections 6 and 10 and
   in the concept canvas's copy rules.
5. **Type:** no condensed widths, no letter spacing, weights 400 and 700 only, a 12 px floor; Archivo and Chivo
   Mono as stand-ins, with Geist Mono as the mono fallback. The console moves from Geist, and the font package is a
   new dependency.
6. **The `#F9F9F9` canvas with white surfaces** and the `#D0D0D0` panel edge. Amended by 19: the main surface is
   white, and `#F9F9F9` holds the side nav and the artifact backdrop.
7. **Radii 0, 4, 8 and pill** (plus 1 and 16), replacing 3, 6 and 8 px surfaces and 5 to 6 px chips.
8. **Compact control sizes,** 36 and 32 with a 32 px floor, relaxing the 44 px target rule.
9. **Color from what is real:** the ink ramp for stages, statuses and counts; brand hues for systems; person
   fills for people; full-color marks; the orchestrator in ink. This rejects a single blue data ramp and the
   categorical palette.
10. **The people fills,** remapped to the deeper set.
11. **The `#0096FA` focus ring,** replacing the ink ring and the console's red ring.
12. **A top bar shell and one page header,** rejecting a left rail. Superseded by 19.
13. **No colored left rules and no tinted surfaces.**
14. **Chivo Mono** for identifiers and badges, rejecting Geist Mono as the primary mono.
15. **The UA logo leads the top bar** as the product lockup, with the three-notch line kept as HyperDelivery's own
    glyph. This rejects the three-notch mark alone in the chrome and the full UNDER ARMOUR lockup in the bar
    (logged 2026-10-26). Amended by 19: the lockup now opens the side nav, without the hairline.
16. **Desktop and laptop only, light theme only, for now** (section 11). This rejects responsive layouts and a dark
    theme before the pilot shows a need (logged 2026-10-26).
17. **Help behind a "?" in the top bar,** not a Library section, as a native disclosure rather than an ARIA menu
    (logged 2026-10-26).
18. **The top bar's "Start a Project" as a compact secondary,** so the page's own action is the only black pill.
    This rejects a black primary in the bar. Superseded by 19: New Project is an outlined pill in the side nav.
19. **A side nav shell** (2026-10-26): a 248 px side nav on `#F9F9F9`, collapsible to a 64 px rail with ⌘B, holding the
    lockup, New Project, Search with ⌘K, Home, Inbox, Projects and Library, Recent projects with status marks,
    role-gated Portfolio and Admin, and the account and workspace at its foot, with weight-only selection from
    Baselayer's Account Navigation (`9286:10835`); a slim 56 px top bar for the page name or breadcrumb (Baselayer's
    14/20, with 8 px gaps), page actions and Help; a white main surface. Alternatives: keep the top bar (the owner
    found the flow complicated for a business user, with five areas, search, start, help and the avatar competing
    in one row); an icon-only rail by default (labels are what make it simple); Baselayer's 24 px item gap (the
    places, Recent and the account would not fit one window height). It supersedes 12 and 18 and amends 6 and 15.
20. **Every project is one workspace** (2026-10-26): the conversation, 440 px, on the left and the artifact panel on
    the right, with artifacts as tabs that appear when they exist (Brief, Mockup, Plan, Prototype, Data, Sources,
    Decisions; Timeline, Architecture and Trace under More), approvals as cards in the conversation and the
    decision bar in the panel. The Approval, Confirm What We Heard, Activity and Architecture screens become views of
    it. Alternatives: a page per step (the earlier boards); a third pane; the artifact on the left (every reference
    product puts the conversation on the left); signing inside the conversation (signing belongs beside the
    evidence, with the attestation and the named button).
21. **UA's three-dot loader for running work** (2026-10-26), from Baselayer's `Animation/3Dot_Loader` (`1975:18969`),
    and a clock glyph with the age for a person's wait. Alternatives: the rotating ring the trace playback used
    (not a UA pattern, and it rendered clipped); percentage bars (progress is step and count).
22. **Target-tier chips** (2026-10-26): "Target: T1 Team App", "Target: T2 Department App" and "Target: T3
    Engineering-Owned" as neutral tags that name what Construction would build, replacing the tier tags ("T1 Team
    Prototype", "T3 Production Handoff"). Alternatives: tiers as what HyperDelivery deploys (it stops at Inception,
    and every project ends as a sandbox prototype on dev data); colored tier chips (a tier is an attribute, not a
    status). It follows the 2026-10-26 decision that prototypes run only in the sandbox on dev data.

## Appendix A. Icon and mark paths

Each body goes inside `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"
stroke-linejoin="round" aria-hidden="true">`, with `stroke-width` set by section 10.

| Name | Body |
|---|---|
| home | `<path d="M3.5 10.5L12 3.5l8.5 7"/><path d="M5.5 9v11h4.5v-6h4v6h4.5V9"/>` |
| folder | `<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.4l2 2.5h8.6A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>` |
| inbox | `<path d="M3 13.5h5l1.5 2.5h5l1.5-2.5h5"/><path d="M5.6 5h12.8L21 13.5V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5.5z"/>` |
| book | `<path d="M12 6.5c-1.6-1.3-4-2-7-2H3v14h2c3 0 5.4.7 7 2 1.6-1.3 4-2 7-2h2v-14h-2c-3 0-5.4.7-7 2z"/><path d="M12 6.5v14"/>` |
| chart | `<path d="M4 20h16M7 17v-6M12 17V6M17 17v-9"/>` |
| settings | `<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>` |
| search | `<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.4-4.4"/>` |
| plus | `<path d="M12 5v14M5 12h14"/>` |
| chevron-right | `<path d="M9.5 6l6 6-6 6"/>` |
| chevron-down | `<path d="M6 9.5l6 6 6-6"/>` |
| check | `<path d="M5 12.5l4.5 4.5L19 7.5"/>` |
| x | `<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>` |
| alert | `<path d="M12 4L2.8 19.5h18.4z"/><path d="M12 10v4"/><circle cx="12" cy="16.75" r="0.9" fill="currentColor" stroke="none"/>` |
| info | `<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.75" r="0.9" fill="currentColor" stroke="none"/>` |
| clock | `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>` |
| user | `<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c.9-3.7 3.9-6 7.5-6s6.6 2.3 7.5 6"/>` |
| users | `<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20c.7-3.3 3.3-5.5 6.5-5.5s5.8 2.2 6.5 5.5"/><path d="M15.5 5.2a3.5 3.5 0 0 1 0 6.6M17.5 14.8c2 .7 3.5 2.6 4 5.2"/>` |
| link | `<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>` |
| file | `<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3v5h5"/>` |
| play | `<path d="M7.5 4.8v14.4L19 12z"/>` |
| pause | `<path d="M8.5 5v14M15.5 5v14"/>` |
| filter | `<path d="M3.5 5h17l-6.5 8v5.5l-4 2V13z"/>` |
| sort | `<path d="M8 4v16M4.5 7.5L8 4l3.5 3.5M16 20V4M12.5 16.5L16 20l3.5-3.5"/>` |
| download | `<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14"/>` |
| external | `<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>` |
| more | `<circle cx="5.5" cy="12" r="1.25" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.25" fill="currentColor" stroke="none"/>` |
| lock | `<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5v-3a4 4 0 0 1 8 0v3"/>` |
| shield | `<path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.2-7.5 9.5-4.4-1.3-7.5-4.9-7.5-9.5V6z"/>` |
| bolt | `<path d="M13 3L5 13.5h6l-1 7.5 8-10.5h-6z"/>` |
| undo | `<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>` |
| partly | `<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none"/>` |
| arrow-right | `<path d="M5 12h14M13 6l6 6-6 6"/>` |
| retry | `<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v4.5h-4.5"/>` |
| help | `<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.9-1.1 1.6v.3"/><path d="M12 16.8v.2"/>` |
| arrow-up (send) | `<path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/>` |
| sidebar | `<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9.5 4.5v15"/>` |
| mockup | `<path d="M4 4.5h16v15H4zM4 9h16M9 9v10.5"/>` |
| plan | `<path d="M5 5h14M5 12h14M5 19h9"/>` |
| prototype | `<path d="M4.5 4.5h15v15h-15zM10 9.5l4.5 2.5L10 14.5z"/>` |
| expand | `<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>` |
| chevrons-up-down | `<path d="M8 9.5l4-4 4 4M8 14.5l4 4 4-4"/>` |

**Side nav glyphs,** the shell's `ICON` map, drawn at 18 px with `stroke-width` 2 (one path each):

| Item | Path `d` |
|---|---|
| Home | `M4 10.5L12 4l8 6.5V20h-5.5v-6h-5v6H4z` |
| Inbox | `M3 13.5h5l1.5 2.5h5l1.5-2.5h5M5.6 5h12.8L21 13.5V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5.5z` |
| Projects | `M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z` |
| Library | `M5 4.5h5.5a2 2 0 0 1 2 2V20a1.5 1.5 0 0 0-1.5-1.5H5zM19 4.5h-5.5a2 2 0 0 0-2 2V20a1.5 1.5 0 0 1 1.5-1.5H19z` |
| Portfolio | `M5 20v-8M12 20V4M19 20v-11` |
| Admin | `M4 7h9M17 7h3M4 17h3M11 17h9M15 4.5v5M9 14.5v5` |

**Product mark,** shown in light-theme values (in code, the tile takes `inverse-surface` and the rule and notches
take `surface`):

```html
<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
  <rect width="24" height="24" rx="4" fill="#1D1D1D"/>
  <path d="M3 12h18" stroke="#FFFFFF" stroke-width="1.5"/>
  <rect x="4.75" y="10.25" width="3.5" height="3.5" fill="#FFFFFF"/>
  <rect x="10.25" y="10.25" width="3.5" height="3.5" fill="#FFFFFF"/>
  <rect x="15.75" y="10.25" width="3.5" height="3.5" fill="#FFFFFF"/>
</svg>
```
