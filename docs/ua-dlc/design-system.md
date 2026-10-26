<!-- cspell:words Baselayer Baselayer's Chivo Demi NeuePlakUAText rgba tnum nowrap tablist radiogroup sparklines keycap keycaps Haddad Rina wireframes -->

# HyperDelivery on Baselayer

| | |
|---|---|
| Status | Proposal for review, updated 2026-10-26. Values marked (proposed) are HyperDelivery extensions that need UA Brand review (section 15) |
| What it is | The design system the console adopts: tokens, type, space, shape, the app shell, component specs and icons. It is the visual source of truth. Where [ux-direction.md](ux-direction.md) and this document disagree on a visual value, this document wins; ux-direction.md still governs the experience, the screens and the copy |
| Scope | Desktop and laptop browsers, 1280 px wide and up, in the light theme (section 11) |
| Built on | Baselayer, Under Armour's internal web design system (the Figma library `00_UA_Baselayer_Library_Web` and its `baselayer-design-system` skill). The evidence, the Baselayer conflicts and the font research are in [baselayer-for-hyperdelivery.md](research/baselayer-for-hyperdelivery.md) |
| Concept screens | [HyperDelivery concepts canvas](https://claude.ai/artifact/BUcEKzAz1CXa27EY398sAF) (private until shared), with a standalone copy in the repo under `docs/ua-dlc/site/concepts/`. Every board uses this system; three are its galleries: The line, Brand and foundations, and Components |
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

1. **One shell, one grid, one page header.** Every screen uses the same 56 px top bar, Baselayer's
   12-column grid (24 px margins, 16 px gutters) and the same page header. Content always starts at the left
   margin, aligned with the UA logo that opens the top bar.
2. **Baselayer, used literally.** Baselayer role tokens, its type scale, two weights, Title Case UI labels, the
   8/16/24/32/56 rhythm, 4 and 8 px radii plus pills, and the `#0096FA` focus ring. When density needs a value
   Baselayer lacks, add it as a named, flagged proposal. Never improvise a value.
3. **Three planes, one level of nesting.** The canvas is `#F9F9F9`. White surfaces sit on it with a 1px
   `#D0D0D0` edge. Floating layers get Baselayer elevation. A surface never contains another bordered surface;
   use a divider or a band inside it.
4. **One meaning per color.** Chrome is ink and neutrals. Red means only "waiting on you" (HD-R1, section 3.3).
   Green means passed or live. Brand marks, people and systems carry the rest of the color (section 3.4).
   Selection is an ink outline, never a tint.
5. **UA's logo leads; the line is HyperDelivery's own.** The top bar opens with the UA logo, so the product reads
   as a UA offering (section 8). The three-notch line is HyperDelivery's product mark. One line component, in two
   sizes, appears identically everywhere. The Decision card, with its black strip and red notch, is the single key moment
   on any screen.
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
| Top bar or left rail | **Top bar, 56 px** | Five areas fit in about 520 px; Baselayer's own navigation is a top bar; a left rail would take 200 to 240 px from the line, the tables and the architecture canvas |
| Page background | **`#F9F9F9` canvas, white panels** | Baselayer's `color/background/primary` is `#F9F9F9`; two levels are what make it read as an app |
| Panel edge | **`#D0D0D0` panel edge, `#F0F0F0` dividers inside** | `#F0F0F0` on `#F9F9F9` is about 1.05:1 and disappears; `#E6E6E6` is not a UA value |
| Page title size | **Heading XL 32/40 on every page title**; Heading 2XL 40/50 only for the first-run hero | One size by role keeps titles identical across screens |
| Radius | **8 for surfaces, 4 for controls, pills for buttons** | A clear difference between surfaces and controls |
| Rail width | **9 + 3 columns: 1040 main, 336 rail** | 336 is Baselayer's form-field width (a 3-column span), and the main column keeps tables wide |
| Search | **A 240 × 36 launcher button that opens ⌘K** | It is a launcher, not a form field |
| Control heights | **44 for page and gate actions; 36 compact; 32 for segmented controls, filter chips and the Help button; never below 32, at least 8 px apart** | Baselayer's own toggle and PDP chip are 32; WCAG 2.5.8 needs 24 |
| Text floor | **12 px, no exceptions** | Baselayer's floor; avatar initials and `+N` counts fit at 12 |
| Condensed type | **Banned.** Durations are Bold tabular figures with lowercase units ("5d 2h") | Condensed caps imitate UA's display cut and break Baselayer's no-condensed rule |
| Case | **Title Case for the UI's own words; sentence case for content; project names as typed** | Baselayer core rule (section 4.3) |
| Data color | **Stages, statuses and counts on the ink ramp; systems in their brand hue; people in their fill** | Ink is unmistakably UA; the rest of the color is real (section 3.4); `#0096FA` is reserved for focus |
| Avatars | **One fill per person, from a deeper, less saturated set** | Identity is data and drives the decision-timeline lanes; stock indigo and violet read as a template |
| Caution and danger | **Retired.** Long waits are Bold ink age plus a clock glyph; failures are an X glyph plus words in ink | Baselayer has neither role, and a second warm color competes with red |
| Colored left rules | **Removed everywhere** | A common template trope; identity comes from the mark and the name |
| Red commit button | **Never.** "Sign and Accept" is the black primary | A red commit would make approving the favored answer over sending back |
| Inbox row actions | **The first (oldest) row gets the 44 black primary; the others get the 36 secondary** | One clear next step |
| Top-bar "Start a Project" | **Compact secondary**, hidden on First run and Start | The page's own action is the only black pill on a screen |
| Where help lives | **A "?" button in the top bar**, just left of the avatar, opening a small menu | Help is not an area; one path to it from every screen, and the Library keeps only what UA knows |
| Screen sizes and themes | **Desktop and laptop at 1280 px and up; light only** (section 11) | HyperDelivery is used at a desk; one layout and one theme keep the system small while the Final MVP is built |
| Orchestrator hue | **Ink** | HyperDelivery's own color is its black mark |
| Approval header | **The same white page header as every page**, with the red decision label above the title; the sign panel is the Decision card | One header everywhere; the decision moment sits where the decision happens |
| Mono family | **Chivo Mono 400 and 600**; Geist Mono if 0 and O, or 1, l and I, fail at 12 px | Same designer as Archivo, a true 600 for badges, and not another company's voice |

## 3. Color

### 3.1 Role tokens

Tokens are named by Baselayer role, so a Figma `get_variable_defs` result maps straight onto the console's CSS.
In `index.css` each role is `--color-<role>` (for example `--color-surface-container-high`); HyperDelivery
meanings are `--hd-*` aliases that point at a role (section 3.2). Components use roles and aliases, never hex.

| Token | Baselayer source | Value | Use |
|---|---|---|---|
| `background` | `color/background/primary` | `#F9F9F9` | The app canvas behind every surface |
| `surface` | `Surface/surface` | `#FFFFFF` | Top bar, page header band, panels, cards, tables, rails, menus, dialogs |
| `surface-container` | `surface container` | `#F9F9F9` | Bands inside a surface: table toolbar, composer footer, provenance strip, rail sub-blocks, row hover |
| `surface-container-high` | `surface container high` | `#F0F0F0` | Selected row and option fill, tags, the search launcher, read-only fields, segmented hover, menu-row and icon-button hover, skeletons |
| `inverse-surface` | `inverse surface` | `#1D1D1D` | Decision card strip, toast, tooltip, product mark tile |
| `on-surface` | `on surface` | `#1D1D1D` | All primary text and icons, and links (hover `#444444`) |
| `on-surface-variant` | `on surface variant`, `color/foreground/secondary` | `#5F5F5F` | Secondary text, meta, placeholders, table headers, inactive tabs and nav |
| `on-inverse-variant` (proposed) | none | `#D0D0D0` | Secondary text on the inverse strip |
| `primary` / `on-primary` | `primary` / `on primary` | `#1D1D1D` / `#FFFFFF` | Primary button (hover `#444444`, pressed `#5F5F5F`), selected segment, selected filter chip |
| `secondary` / `on-secondary` | `secondary` / `on secondary` | `#FFFFFF` / `#1D1D1D` | Secondary button fill and label |
| `tertiary` | `tertiary` | `#F9F9F9` | Object chip fill |
| `outline` | `outline` | `#1D1D1D` | Secondary button ring, selected card or option (2px), Decision card edge |
| `outline-field` | the `Outline` variable | `#5F5F5F` | Text input, textarea and composer stroke at rest (3:1 non-text contrast) |
| `outline-variant` | `outline variant` | `#D0D0D0` | Panel and card edge, chip ring, logo tile ring, segmented border, top bar and header rules, menu ring |
| `stroke-tertiary` | `color/stroke/tertiary` | `#F0F0F0` | Row dividers, dividers inside a panel or menu, stat-strip separators |
| `disabled` / `on-disabled` | `button/disabled` | `#D0D0D0` / `#FFFFFF` | Disabled button fill and label (exempt from contrast) |
| `icon-disabled` | gray `#949494` | `#949494` | Disabled icons and dashed future line segments. **Never text** |
| `critical` / `on-critical` | `critical` / `on critical` | `#DC0019` / `#FFFFFF` | The red notch, Inbox marker and count, the Waiting on You capsule, a field error stroke |
| `status-error` | `status/error` | `#DC0019` | Red text that names the viewer ("Your Approval: The Plan"), field error messages |
| `status-success` | `status/success` | `#00834B` | "Met", "Passed", "Live", "Confirmed" as glyph plus word on a surface; never a tinted pill |
| `status-accent` | `Color/Secondary/accent orange` | `#FE9000` | The NEW badge fill (ink text) and the provenance strip's 2px top rule. **Never text** |
| `focus` | Focus stroke | `#0096FA` | The focus ring (section 6.4) |
| `scrim` (proposed) | none | `rgba(29,29,29,0.4)` | Behind dialogs and the Teams task module |

Baselayer's light neutrals are `#1D1D1D`, `#444444`, `#5F5F5F`, `#949494`, `#D0D0D0`, `#F0F0F0`, `#F9F9F9` and
`#FFFFFF`. No other gray exists in this system.

Every concept board loads one shared style block that applies these values: `color-scheme: light`, the
`#F9F9F9` body, ink links with a `#444444` hover, the `#0096FA` focus ring and its variants (section 6.4),
button, chip and row hovers, the 32 px icon button and the menu (section 9.23). Board-specific rules come after it.

### 3.2 HyperDelivery aliases

| Alias | Points at | Value | Use |
|---|---|---|---|
| `--hd-decision` | `critical` | `#DC0019` | Every red fill that means "waiting on you" |
| `--hd-decision-text` | `status-error` | `#DC0019` | Red text that names the viewer |
| `--hd-data-1` | `on-surface` | `#1D1D1D` | First series of stages, statuses or counts (Build); sparklines; bar-in-cell |
| `--hd-data-2` | `on-surface-variant` | `#5F5F5F` | Second series (Plan) |
| `--hd-data-3` | the `#949494` primitive | `#949494` | Third series (Discover); 3.03:1, the minimum for a value mark |
| `--hd-data-track` | neutral primitives | `#D0D0D0` | The remainder of a capped bar (a budget). Never a value mark |
| `--hd-agent-orchestrator` | `on-surface` | `#1D1D1D` | The orchestrator in Layers 2 and 3 |
| `--hd-agent-cortex` | none | `#0EA5E9`, tint `#E7F6FD` | Cortex Code data specialist |
| `--hd-agent-reader` | none | `#0D9488`, tint `#E6F6F4` | Resource reader |
| `--hd-agent-coding` | none | `#7C3AED`, tint `#F3EDFF` | Coding agent ("AgentCore harness, in the sandbox"), shown by the `terminal` glyph in this hue's tile, never the Copilot mark; a "Second engine (swap test)" is dashed as arriving in Enterprise |
| `--hd-agent-review` | none | `#475569`, tint `#EEF1F5` | Reviewers, QA and the ops monitor |
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
  1. A solid "waiting on you" marker: the 8 px square in an Inbox row, or the notch on the line.
  2. The Inbox count, a pill with a white tabular numeral.
  3. One filled capsule per view region ("Waiting on You"): white text on `#DC0019`.
  4. Errors in a form field the viewer is filling in: red stroke, red 12/20 message, alert icon.
  5. Red text, only where it names the viewer ("Your Approval: The Plan"), at most one red label per view
     region; repeats are ink.
- **Never:** buttons, charts, deltas, diff deletions, links, selection, focus, avatar fills or rings, destructive
  actions, decoration, brand moments, halos or tints around a red shape, a project card's status line, a
  budget, a failure that waits on someone else, and failures the platform handles itself.
- **Signer lists** show the viewer as Bold ink "You, now", not a red capsule or a red ring on the avatar.
- **Buttons.** HyperDelivery does not use Baselayer's `Btn/Tertiary/Red-Critical`. A gate's commit ("Sign and
  Accept") is the black primary, with "Send Back" beside it as a secondary. Destructive actions ("Revoke
  Access", "Archive") use the secondary button with a leading X and a confirmation that states the consequence.
- **Failures.** A failure the platform will retry or report shows in ink: an X glyph and plain words with the
  next step ("Build failed at step 4", "Retry From This Step"). When the failure needs the viewer to decide
  (retry, stop, or tell the platform team), it gains the red marker, because now it is waiting on them.
- **Other people's waits.** Ink plus age ("Waiting on Dana in Finance, 2d"). After two business days in the
  waited-on person's time zone, the age turns Bold and gains a clock glyph. No amber, and no red unless the viewer
  is the one being waited on.
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
5. **Status color stays:** the green glyph plus word for passed and live, red for waiting on you, and the
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

- **Never red** in a chart, and green only for "passed" or "live".
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

Seven sizes (12, 14, 16, 20, 24, 32, 40) and two weights (400, 700). Every role is a Baselayer style unless
marked. In `index.css` each role becomes a `--text-<role>` pair, size and line height, in rem (proposed naming).

| Role | Size / line height | Weight | Case | Used for |
|---|---|---|---|---|
| Heading 2XL | 40 / 50 | 700 | Title Case | The first-run hero only |
| Heading XL | 32 / 40 | 700 | Title Case for UI titles; project names as typed | Every page title in the page header |
| Heading LG | 24 / 30 | 700 | Title Case | Working-session stage title, dialog title |
| Figure (proposed alias of Heading LG) | 24 / 30 | 700, tabular, unit at 16/20 Regular | n/a ("9 days", "12d 1h", "3 of 8") | Stat-strip figures everywhere |
| Heading MD | 20 / 24 | 700 | Title Case | Section headings ("My Projects", "Evidence, Criterion by Criterion", "Numbers Check"), form steps, Lifecycle phases, the Decision card title |
| Heading SM | 16 / 20 | 700 | Title Case for UI headings; project names as typed | Card titles, Inbox item titles, rail panel headings, group headers in lists, the wordmark |
| Heading XS | 14 / 18 | 700 | Title Case | Every former eyebrow: rail sub-sections, labels above field groups, the decision label |
| Body MD | 16 / 24 | 400 | Sentence | Reading text: briefs, plans, assistant messages, criteria, statements to confirm, any paragraph over two lines. Measure at most 680 px |
| Body SM | 14 / 20 | 400 (700 for emphasis) | Sentence | Default UI text, table cells, list rows, card text, meta lines that carry facts |
| Body XS | 12 / 18 | 400 | Sentence | Metadata, helper text, timestamps, the breadcrumb, footnotes, segment names on the line |
| Label SM | 14 / 18 | 400; 700 when selected | Title Case | Nav items, tabs, field labels, menu items, filter chip labels, starters |
| Label XS | 12 / 16 | 400; 700 for headers and status words | Title Case for UI words; data as written | Table headers (700, `on-surface-variant`), tags, object chips, status words, gate labels and split times on the line |
| Button | 14 / 20 (12 / 16 on 32 px controls) | 700 | Title Case | Every button and button-styled link |
| Duration | The size of its row (16/20 in the Inbox, 12/16 on the line) | 700, tabular | Lowercase units, no caps ("1d 4h", "3h 10m", "42m") | Inbox waits, split times, elapsed time |
| Mono (proposed; a Baselayer gap) | 12 / 16 | Chivo Mono 400 | As written | Jira keys, SHAs, query ids, table and view names, repository paths, keycaps |
| Badge (proposed dense size) | 12 / 16 | Chivo Mono 600 | ALL CAPS, no tracking | Type codes and a few states only (section 9.5) |

Form helper and error text use Baselayer's `FormField` metric, 12/20.

### 4.3 Case

**Title Case for the UI's own words:** page, section and card headings, buttons, tabs, navigation, menu items,
field labels, column headers, dialog titles and status labels. Capitalize major words. Lowercase a, an, the,
and, but, for, or, nor, yet, so, and prepositions of three letters or fewer (at, by, for, in, of, on, to, up,
via), unless they come first or last. Capitalize the first word after a colon. Keep acronyms and ids as written
(SKU, UA, T1, AC-1).

Examples: "Needs You", "My Projects", "Shipped Across UA This Week", "Your Approval: The Plan", "Review and
Sign", "Sign and Accept", "Send Back", "Ask Someone", "Open Inbox", "Who Signs, in Order", "Start a
Project", "Start From MERCH-1182", "Retry From This Step", "Waiting on You", "Partly Met".

**Sentence case for content:** body text, helper and error messages, status sentences, toasts, assistant
messages, questions a person or agent asked ("Which level counts as one style for duplicate checks?") and
anything a person typed. Project names show as typed ("SKU productivity workbench"); the Start flow may suggest
Title Case when someone names a project.

### 4.4 Numbers, dates and identifiers

- Tabular figures on every number that changes.
- Durations are Bold with lowercase units and no caps: "1d 4h", never "1D 4H".
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
- Font sizes outside 12, 14, 16, 20, 24, 32 and 40, including half pixels and anything below 12.
- Tracked eyebrows over sections. Delete a label when its position already says what it is.
- More than one middle dot per line, and a line that starts with a separator. Split meta into labeled pairs,
  or into a primary line in `on-surface` and a secondary line in `on-surface-variant`.
- Text in `#949494` or lighter, and `opacity` on text.
- Line heights below 1.25 for headings and below 1.4 for body.

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
| 64, 80 | XL, 2XL | Empty states and the first-run hero |

Retire 2, 3, 5, 7, 9, 14, 18, 20, 26 and 28 px as gaps. Control heights such as 44 are geometry, not spacing
tokens.

### 5.2 Grid

Screens are designed at 1440: 12 columns, 24 px margins and 16 px gutters, so each column is 101.33 px. A span
of n columns measures n × 101.33 + (n − 1) × 16:

| Span | 3 | 4 | 6 | 8 | 9 | 12 |
|---|---|---|---|---|---|---|
| px | 336 | 453.3 | 688 | 922.7 | 1040 | 1392 |

- **Workspace layout:** a 12-column span for tables, maps and canvases.
- **Rail layout:** 9 + 3 (main 1040, rail 336). The main column and the rail stretch to one bottom edge.
- **Reading text** in either layout is capped at 680 px.
- **Wider than 1440,** columns stay fluid: tables fill the width while reading text keeps its cap.
- **From 1440 down to 1280,** the narrowest supported width, the same 12 columns shrink: at 1280 a column is
  88 px, so the rail layout is 920 + 296 and a full span is 1232. The search launcher collapses to a 36 px
  square below 1440, wide tables scroll inside their panel with the first column pinned, toolbars wrap with 8 px
  between rows, and maps and canvases keep zoom and fit. Nothing is designed below 1280.
- The content box is a 12-column grid with 24 px padding, a 16 px column gap and a 24 px row gap. Grids of cards
  use `align-items: start`, and their column count divides the item count.

### 5.3 Control sizes

| Height | Use |
|---|---|
| 44 | Page and gate actions; dialog actions; the first Inbox row's action; the composer's Continue; text inputs at Large size; radio option rows and checkbox rows |
| 36 | Compact: toolbars, card footers, row actions, the top bar's search and Start a Project, compact inputs, the composer's footer actions, row icon buttons |
| 32 | Segmented controls, filter chips, answer chips, starters, table-footer controls, zoom and fit controls, menu rows, the Help button and the avatar in the top bar |

Never below 32 for a control, and at least 8 px between targets. Object chips (24 px) are links that open
something, not controls, and meet WCAG 2.5.8's 24 px minimum. This relaxes the concept canvas's 44 px target
rule for dense screens (logged as a decision).

## 6. Shape, depth and focus

### 6.1 Radii

| Radius | Use |
|---|---|
| 0 | Media, table cells, line notches and trace bars. Square is the brand motif |
| 1 px | The checkbox mark |
| 4 | Inputs, the search launcher, chips, tags, badges, segmented controls, logo tiles, tooltips, toasts, keycaps, the product mark tile |
| 8 (proposed) | Panels, cards, popovers, menus, dialogs, preview frames |
| 16 | The switch track |
| Pill | Buttons, icon buttons, avatars, the Waiting on You capsule and the Inbox count, and nothing else |

Filter chips and segments are 4, not pills. Nested curves stay concentric: the inner radius is the outer radius
minus the padding.

### 6.2 Borders

- **Panel and card:** 1px `outline-variant`.
- **Chips and tiles:** an inset 1px `outline-variant` ring, so the size does not change.
- **Dividers inside a surface:** 1px `stroke-tertiary`.
- **Selected card or option:** an inset 2px `outline` on `surface-container-high` (on `surface` for a large card),
  replacing the 1px border.
- **No colored side stripes** anywhere.
- **Dashed** in the UI chrome only for future segments of the line and parts marked "Arrives in Enterprise" on
  the two help pages. Layer 2 and 3 diagrams may dash asynchronous edges, trust boundaries and the coding agent's
  "Second engine (swap test)", which arrives in Enterprise.

### 6.3 Planes and elevation

Three planes: the `background` canvas, `surface` panels on it, and floating layers above both. One level of
nesting: a surface never holds another bordered surface. The one exception is the evidence and preview tray
(section 12, Approval).

| Level | Baselayer effect | Value | Use |
|---|---|---|---|
| Flat | none | No shadow; the 1px edge | Page, panels, cards, tables |
| Medium | `Floating Button/Medium` | `0 0 4px rgba(29,29,29,0.15)` | Tooltips; a sticky table header while scrolled |
| Large | `Floating Button/Large` | `0 0 10px rgba(29,29,29,0.15)` plus a 1px `outline-variant` ring | Menus (Help, account, workspace), popovers, dialogs, toasts |

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

Every product screen has the shell: Home, Inbox, Projects, First run, Start a project, Project (with its
Activity and Architecture tabs), Approval, Confirm what we heard, Needs attention, Library, Portfolio, Admin,
Graduation, and the two help pages. It does not appear inside Teams (cards, the task module and the meeting side
panel), where the host supplies the chrome.

### 7.1 Top bar

The bar is identical on every screen except the active area, the Inbox count, the avatar, whether "Start a
Project" shows, and the Help button's selected state on the two help pages. The Inbox count shows only when
something waits on the viewer, so a new user (First run) and a leadership viewer (Portfolio) see a plain "Inbox".

| Zone | Spec |
|---|---|
| Bar | 56 px, `surface`, a 1px `outline-variant` bottom rule, 24 px side padding, 24 px between zones |
| Product lockup | First in the bar: the UA logo 20 px tall (34 wide) in `on-surface`, a 12 px gap, a 1 × 20 `outline-variant` hairline, a 12 px gap, then "HyperDelivery" in Heading SM 16/20 Bold (section 8.2). The whole lockup links to Home. The three-notch product mark is not in the bar |
| Workspace switcher | A 1 × 20 `outline-variant` divider, then a disclosure whose button is 36 tall, 8 px side padding, radius 4: the workspace name in Label SM plus a 16 px chevron-down, named "Workspace: Merchandising". It opens a menu (section 9.23) of the workspaces the viewer belongs to, the current one Bold with a check; choosing one closes it |
| Primary navigation | Home, Projects, Inbox, Library, Portfolio, then a 1 × 20 divider, then Admin (role-gated). Label SM; inactive Regular `on-surface-variant`, active Bold `on-surface` with a 2px `outline` bar on the bar's bottom edge and `aria-current="page"`. 24 px between items. Inbox carries the red count, and its accessible name includes it ("Inbox, 4 waiting on you"). The order is fixed; role-gated items are appended after the divider and never replace an area. The two help pages show no active item |
| Right cluster | A flexible spacer, then four items 16 px apart, in this order: the search launcher; "Start a Project"; Help; the avatar |
| Search launcher | 240 × 36, `surface-container-high` fill, radius 4, a 16 px search glyph, "Search projects and facts", a ⌘K keycap; it opens the command palette. Below 1440 it collapses to a 36 px square with the glyph only, keeping its accessible name |
| Start a Project | A Compact secondary: a 36 px pill, `secondary` fill, an inset 1px `outline` ring, a 16 px plus glyph 8 px before the label, nowrap. Shown only to roles that can start, and not on First run or Start, where the page's own composer is the way in. The page's own action stays the only black pill on a screen |
| Help | A 32 px ghost icon button: no fill and no ring at rest, a 16 px circled question mark (icon 38), `surface-container-high` on hover, while open and on the two help pages; named "Help". It opens the Help menu (section 9.23) just left of the avatar |
| Avatar | A 32 px avatar button in the person's fill, named "<Name>, account". It opens the account menu (section 9.23): the name and role, "Show Technical Detail" with its Off or On state, and "Sign Out" |

The bar starts with the UA logo, so HyperDelivery reads as a UA product. The concept screens and the plan page
carry the lockup now; the console ships it after UA Brand reviews the lockup (section 8.6).

### 7.2 Page header

| Zone | Spec |
|---|---|
| Band | `surface`, a 1px `outline-variant` bottom rule, padding 24 px top and sides. Without tabs it closes with 24 px bottom padding; with tabs, the 44 px tab row sits on the band's bottom rule |
| Breadcrumb | Body XS, `on-surface-variant`, " / " separators with 8 px gaps, links underlined on hover only. None on the top-level areas. The last segment is plain text with `aria-current="page"`; a crumb never links to the page it sits on |
| Title row | 8 px below the breadcrumb, at least 40 px tall, 16 px gaps: the title (Heading XL, nowrap), then at most one tag (the tier), then a spacer, then status, the avatar stack and actions (36 compact; a 44 primary only when the page's one action lives here). Everything centers on the title |
| Decision label | When the page is a decision waiting on the viewer, the red decision label (section 9.7) sits directly above the title |
| Meta line | 8 px below the title row, Body SM `on-surface-variant`, labeled pairs ("Owner Maya Chen", "Jira MERCH-1182") 24 px apart, on one line, no middle-dot chains and no sentences. A sentence that explains the page is cut, not moved here |
| The line | Project pages only: 24 px below the meta, the full 12-column width, the full line (section 9.21) |
| Tabs | 24 px below the line, or the meta. One project tab set, in this order: Document, Plan, Preview, Data, Sources, Memory, Activity, Architecture (counts inline) |

Four variants:

- **Standard** (Home, Inbox, Projects, Confirm what we heard, Needs attention, Library, Portfolio, Admin): the
  breadcrumb if any, the title row and the meta line, then 24 px of bottom padding. Admin adds the tabs
  Guardrails, Audit Log and Usage. Filter chips never sit in the title row; they go in a toolbar band at the top
  of the list panel.
- **Project** (Project and its Activity and Architecture tabs): every zone. Breadcrumb "Projects /
  `<Workspace>`".
- **Decision** (Approval, Graduation): breadcrumb "Inbox / `<Project>`", the red decision label directly above
  the title, a meta line of at most three pairs, then the line and no tabs. The Decision card is the last block
  of the main column.
- **Help** (How Work Moves, How HyperDelivery Is Built): breadcrumb "Help / `<Page>`", with "Help" as plain
  text, the title and one meta line, and no actions. The page's controls sit in a toolbar row 24 px below the
  band.

**Where each screen lives.** The active area, the breadcrumb and the page's one primary action, screen by screen:

| Screen | Active area | Breadcrumb | Page primary |
|---|---|---|---|
| Home | Home | none | The oldest Inbox row's action ("Review and Sign") |
| First run | Home | none | "Continue" in the composer |
| Inbox | Inbox | none | The oldest row's action |
| Projects | Projects | none | none |
| Start a project | Projects | Projects / Start a Project | "Continue", then "Start the Project" |
| Project, every tab | Projects | Projects / `<Workspace>` | The Decision card's action when one waits on the viewer; else none |
| Confirm what we heard | Projects | Projects / `<Project>` | "Finish Review" |
| Needs attention | Projects | Projects / Needs Attention | The first row's action |
| Approval | Inbox | Inbox / `<Project>` | "Sign and Accept" |
| Graduation | Inbox | Inbox / `<Project>` | "Sign Decision" |
| Library | Library | none | none |
| Facts for a new idea (the Library, reached from Start) | Projects | Projects / Start a Project / Facts for This Idea | "Start With 6 Facts" |
| Portfolio | Portfolio | none; the scope goes in the meta | none |
| Admin | Admin | Admin / `<Workspace>`, with "Admin" as plain text | "Review and Sign" on a policy change |
| How Work Moves | none; "?" selected | Help / How Work Moves | none |
| How HyperDelivery Is Built | none; "?" selected | Help / How HyperDelivery Is Built | none |

Crumbs link "Projects" and any workspace to Projects, "Inbox" to the Inbox, a project to its Project page and
"Start a Project" to Start.

### 7.3 Content, rail and bottom

- **Content** starts 24 px below the band (32 px when there are no tabs), on the 12-column grid, on the
  `background` canvas. The breadcrumb, the title and the first panel all start at the left margin, aligned with
  the UA logo.
- **The right rail** is span 3 (336): one `surface` panel, radius 8, an `outline-variant` edge, 16 px padding,
  sections divided by `stroke-tertiary` and titled in Heading SM; no rail heading floats on the canvas. The rail
  and the main column end on one bottom edge. The assistant rail stretches to the main column's height, with the
  composer pinned to the bottom.
- **Section titles** in the main column are Heading MD on the canvas, 16 px above their panel.
- **Sticky action bar** (Start, and the Library reached from Start): 72 px, `surface`, a 1px `outline-variant`
  top rule, 24 px side padding, 16 px gaps: the Large primary, the Large secondary and a Body SM summary in
  `on-surface-variant`.
- **The bottom:** 56 px of canvas below the last element.

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
| UA logo, black | `logos/ua-logo.svg` | The small cut of the UA logo, `viewBox` 232.5 × 137 (about 1.7:1) | Light surfaces. The top bar inlines this path |
| UA logo, white | `logos/ua-logo-white.svg` | The same cut in white | Kept with the brand assets for UA material on dark backgrounds. No product screen uses it |
| UNDER ARMOUR lockup | `logos/ua-lockup.svg` | The UA logo plus the UNDER ARMOUR wordmark, horizontal small, `viewBox` 267.8 × 20.6 | Spec pages, print and the About page. Never the top bar: it is too wide for 56 px and competes with the product name |

The concept canvas uploads all three as assets and references them through each board's logo map. In the top bar the
logo is an inline `<svg viewBox="0 0 232.5 137" role="img" aria-label="Under Armour">` whose one path is the export's
path, unchanged, with `fill="currentColor"`. It takes `on-surface`, so it is black. Inlining the exported path is a
copy; editing, simplifying or retracing it is not allowed.

### 8.2 The product lockup

| Part | Spec |
|---|---|
| UA logo | 20 px tall (34 wide), `on-surface` |
| Hairline | 1 × 20 in `outline-variant`, 12 px from the logo and 12 px from the name |
| Name | "HyperDelivery" in Heading SM 16/20 Bold (UA Text Bold; Archivo Bold as the stand-in). Not condensed, not uppercase, no letter spacing |
| Behavior | The whole lockup is one link to Home. The logo carries `aria-label="Under Armour"` and the hairline is `aria-hidden`, so the link reads "Under Armour HyperDelivery" |

It mirrors the header of Baselayer's own Token Reference, which opens with the UA logo and then "Baselayer Design
System - WEB". The lockup never adds the three-notch mark, a tagline or a second product name.

### 8.3 The three-notch mark

**The product mark** is the three-notch line on an inverse tile, and it is not an icon. A 24 px tile with a 4 px
radius in `inverse-surface`; a 1.5 px rule across its middle and three 3.5 px square notches in `surface` (paths in
appendix A). It is HyperDelivery's own glyph and no longer sits in the top bar.
It appears:

- as the assistant's avatar and the HyperDelivery owner chip (20);
- as the Teams bot, the Teams app icon and its icon in the Teams rail;
- on app tiles, and as the app icon at 24, 40 and 64;
- as the favicon and the app-level loading state.

Those are the places the UA logo does not go: a favicon, an avatar or a 20 px tile is too small for the logo's clear
space, and a Teams icon is HyperDelivery's identity inside someone else's chrome.

### 8.4 Clear space, size and cuts

- **Clear space:** at least half the logo's height on every side, so 10 px at 20 px. In the top bar the hairline sits
  12 px away and the bar leaves 18 px above and below.
- **Minimum size:** 16 px tall on screen.
- **Cuts:** the small cut (the copied files) for anything under 40 px tall, which covers the top bar and every
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
- Put the full UNDER ARMOUR lockup in the top bar, or pair the logo with the three-notch mark.
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
| Secondary | `Btn/Secondary/Black` | `secondary` fill, an inset 1px `outline` ring, `on-secondary` label | "Send Back", "Invite", "Confirm", later Inbox rows, "Start a Project" in the top bar |
| Tertiary | `Btn/TextLink/General` | An underlined `on-surface` link (3 px underline offset) with a 44 px hit area | "Open Inbox", "Ask Someone", "Reassign", "Undo" |
| Ghost (proposed) | none | No fill and no ring; hover fills `surface-container-high` | A quiet in-panel action: "Export", "Not Right", "Export SVG" |
| Icon button | the circle form of each | A circle with a 16 px glyph; always an `aria-label` that names the object ("Actions for Shell run jacket") and a tooltip | Row actions, pagination controls, "Remove <name>" on a pointed resource |
| Help (proposed) | none | A 32 px ghost circle with the 16 px help glyph: no fill and no ring at rest, `surface-container-high` on hover, while open and when selected; the focus ring with its white separator | The "?" in the top bar only |
| Destructive | the secondary | The secondary with a leading 16 px X, and a confirmation that states the consequence | "Revoke Access", "Archive". Never red (HD-R1) |

| Size | Height | Side padding | Label | Icon | Use |
|---|---|---|---|---|---|
| Large | 44 | 16 | 14/20 Bold | 16, 8 px from the label | Page, gate and dialog actions; the sticky action bar |
| Compact (proposed) | 36 | 16 (12 for ghost) | 14/20 Bold | 16 | Toolbars, card footers, row actions, the top bar |
| Small (proposed) | 32 | 12 | 12/16 Bold | 16 | Table-footer controls and zoom controls only; icon buttons are 32 circles |

All buttons are pills with a minimum width of 96 px (icon buttons excepted), labels in Title Case, nowrap, and
width that hugs the label.

**States.** Default; hover (primary `#444444`, secondary and ghost fill `surface-container-high`); pressed
(primary `#5F5F5F`); focus (the ring); disabled (`disabled` fill and `on-disabled` label, with the reason linked
by `aria-describedby`, never a pale imitation of an active button); loading (the label becomes three 6 px squares
4 px apart in the label color, while the width holds); success (the label becomes "Signed" with a check for two
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
- **Answer chips** (a question's answers in an Inbox row) are filter chips in a `radiogroup`.
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

An attribute (tier, risk, depth, read or write), not clickable. 24 px tall, radius 4, 8 px side padding, Label XS,
nowrap. **Neutral:** `surface-container-high` fill, no border ("T1 Team Prototype", "Risk: Medium").
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
| Met, Passed, Live, Confirmed, Canonical | check | `status-success` (green glyph and word on the surface) |
| Invited | check | `on-surface` |
| Partly Met, partly co-signed | half-filled circle | `on-surface` |
| Failed | X | `on-surface` |
| Blocked | lock | `on-surface` |
| Stalled, a long wait, overdue | clock | `on-surface`, Bold |
| Over a cap, a flag ("Bottom 20%") | alert | `on-surface`, Bold |
| Someone else's wait, under two business days | none | `on-surface` Regular ("Waiting on Dana in Finance, 2d") |
| Someone else's wait, two business days or more | clock | `on-surface` Bold |
| Waiting on you | the capsule, or red text naming the viewer | Section 9.7 |

### 9.7 The capsule, the Inbox count and the decision label

- **Waiting on You capsule:** 24 px pill, 10 px side padding, `critical` fill, Label XS Bold `on-critical`,
  nowrap. At most one per view region.
- **Inbox count:** a pill at least 16 px wide and 16 px tall, 4 px side padding, `critical` fill, a white 12/16
  Bold tabular numeral, and an accessible name ("4 waiting on you"). It counts only what waits on the viewer.
- **Decision label:** a 12 px solid `critical` square, an 8 px gap, then Heading XS in `status-error` naming the
  viewer's decision ("Your Approval: The Working Prototype"). On the inverse strip the text is white and the square
  stays red.

### 9.8 Avatar and stacks

- **Avatar:** a 24 px circle (32 in the top bar and people lists), the person's fill, white 12/16 Bold initials,
  and a `title` with the full name.
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
| 24 tile | 16 | Chips, rows, traces, the assistant rail |
| 40 tile | 24 | List headers, Connectors, Sources |
| No tile | 16 bare mark | Inside a 24 px object chip |

- **Anatomy:** radius 4, `surface` fill, an inset 1px `outline-variant` ring. Atlassian marks that carry their own
  tile are not nested in a second one.
- **Fallback:** if the mark fails to load, the tile shows the system's initial in 12/16 Bold `#444444`. Generic
  resources (a browser, a file, a terminal, a folder) use the matching icon glyph instead of an image.
- **Color:** full color, never recolored. The one-color variant follows section 3.4.
- **Name:** a mark always sits next to its name, or the stack has `role="img"` and an `aria-label` ("Sources:
  Snowflake, Confluence, Jira").

### 9.10 Tabs

Baselayer has no tabs component, so this is proposed, drawn from the active state of `Navigation - Top`.

- **Anatomy:** 44 px tall, Label SM, 24 px apart, no padding. Unselected Regular `on-surface-variant`; selected
  Bold `on-surface` with a 2px `outline` bar on the bottom edge. Counts inline at 12/16 with a 4 px gap. The row
  sits on a 1px `outline-variant` rule. A tab may lead with a 16 px glyph 8 px before its label (Start's three
  ways in).
- **Keyboard:** tab lists, like every radio group (segmented controls, radio cards, answer chips), move with the
  arrow keys, Home and End, with one tab stop on the selected item.
- **Use** `role="tablist"` only when the control switches panels. To switch a view of the same data (period,
  density, the architecture phase, path, depth), use the segmented control.
- **Never** black pill tabs or gray-track tabs.

### 9.11 Segmented control

Baselayer's `Controls/Toggle`. A `radiogroup` 32 px tall overall: a 1px `outline-variant` border and dividers,
radius 4, `surface` segments with 16 px side padding and 12/16 labels. The selected segment is `primary` with a
Bold `on-primary` label; hover fills `surface-container-high`.

### 9.12 Panel and card

- **Anatomy:** `surface`, a 1px `outline-variant` edge, radius 8, 24 px padding (16 dense), 16 px between parts,
  `min-width: 0`. The title is Heading SM; meta is Body XS `on-surface-variant`. Inner groups are separated by a
  `stroke-tertiary` divider or a `surface-container` band, never by another bordered box.
- **Sizing:** cards hug their content. Cards in a set share one anatomy (all have a media band or none do), and a
  grid's column count divides its item count, so there are no orphans.
- **Selected:** `surface-container-high` (or `surface` for a large card) plus an inset 2px `outline`, dropping the
  1px edge.
- **Project card** (Home and First run): title, meta, the mini line, one status, "Next:" in Body XS, a divider,
  then up to three logo tiles on the left and the avatar stack on the right.

### 9.13 Decision card

The single key moment on a screen: the Project page when an approval waits on the viewer, the Approval sign
panel, Graduation, an Admin policy change and the Teams approval card body.

- **Edge:** `surface`, a 1px `outline` edge, radius 8, clipped.
- **Strip:** 40 px of `inverse-surface`, 16 px side padding: a 12 px `critical` square, the decision label in
  Heading XS (white), and a Body XS line in `on-inverse-variant` ("Second of three approvals").
- **Body:** 24 px padding: the title in Heading MD ("Approve the Plan and Start Building"), a Body SM line in
  `on-surface-variant` saying what happens next, then a Large primary and a Large secondary 8 px apart, with
  tertiary links after them.
- **On the Approval page** it is sticky to the bottom of the main column and holds the attestation checkbox.

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

The row on Home and in the Inbox. A grid of an 8 px marker, the content, a 72 px wait column and a 184 px action
column, with 16 px gaps, 16 × 24 px padding and a `stroke-tertiary` divider.

- **Marker:** an 8 px `critical` square, aligned with the title.
- **Content:** line 1, the title in Heading SM ("Your Approval: The Plan"); line 2, Body SM with the project name
  and what it unblocks in `on-surface-variant`; line 3, Body XS meta (the viewer's role and the approval's
  position, "Business owner, second of three approvals") followed by object chips.
- **Wait:** a Body XS "Waiting" label in `on-surface-variant` over the Duration role at 16/20, right-aligned, every
  row at one x.
- **Action:** the first (oldest) row gets the Large primary; later rows get the Compact secondary, right-aligned.
- **Question rows** keep the meta on line 3 like every row and put the answers on line 4, 8 px below, as 32 px
  answer chips; "Not Me, Suggest Who" is a text link in the action column.
- **On the Inbox screen** the rows sit in one full-width panel under a toolbar band of filter chips (All,
  Approvals, Questions, Confirmations), followed by a closed disclosure row, "Done in the Last 7 Days (5)", whose
  rows are ink with a green check and a project link.

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
| Radio option row | 44 px, radius 4, a visible 16 px radio; selected is `surface-container-high` plus an inset 2px `outline` | none |
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

- **Tooltip:** `inverse-surface`, 12/18 text, radius 4, Medium elevation.
- **Menu and popover:** `surface`, radius 8, Large elevation with its ring, 8 px vertical padding, 32 px rows. The
  top bar's menus are specified in section 9.23.
- **Dialog:** `surface`, radius 8, Large elevation, the scrim behind it, the title in Heading LG, Large actions,
  and a size that hugs its content.
- **Toast:** `inverse-surface`, radius 4, at least 44 px tall, 16 px left and 8 px right padding, 16 px gaps, a 16
  px glyph, Body SM text in sentence case ("Signed version 4. Recorded in 12s."), and an underlined 36 px "Undo"
  text button. Bottom-left, 24 px from the edges, Large elevation, `role="status"`.

### 9.19 Empty, loading and error states

- **Empty:** centered, 64 × 24 px padding, 8 px gaps: a 48 px glyph in `on-surface-variant`, a Heading SM title in
  Title Case ("Nothing Waiting on You"), one Body SM line in `on-surface-variant` at most 360 px wide ("New
  approvals and questions also arrive in Teams."), and at most one Compact secondary action.
- **Loading:** skeleton blocks in `surface-container-high` at the size of what they stand for (an Inbox row
  skeleton is 72 px tall, a table row 44 px), with no spinner; the product mark for app-level loading; a status
  line with loading dots for a wait on another system ("Waiting for Microsoft Authenticator").
- **Error in a block:** inside the failed block, never a page-level red banner: an X glyph, plain words
  ("Couldn't read the margin report."), a "Last good 09:12" stamp in Body XS and one Compact secondary action
  ("Reconnect Snowflake"). Never an HTTP code.

### 9.20 Provenance strip

Every preview, screenshot and recording carries a strip that cannot be dismissed: a `surface-container` band with
a 2px `status-accent` top rule, a 16 px alert glyph in ink, and Body SM text ("Synthetic data, not real sales.
Clickable mock in the look you picked: Workbench table."). Never red, and never orange text.

### 9.21 The line

**Full line** (the project page header): a three-row grid. Segment names above the track (Body XS
`on-surface-variant`, centered on their segment), then the track, then gate labels below (Label XS Bold, centered
on the notch, nowrap, with the split time underneath in Regular `on-surface-variant`: a first name for one signer,
"5d 2h, Maya", and a count for several, "3d 2h, 3 signers", never initials). Rows are 8 px
apart and labels never touch the rule. Notches are 12 px squares, radius 0; the track is 2 px.

| State | Mark |
|---|---|
| Signed | Ink notch, solid segment before it, the split time under the label |
| In progress | A 4 px solid segment, with the shimmer while work runs ([ux-direction.md section 9](ux-direction.md#9-motion)) |
| Upcoming | A 2px dashed `#949494` segment and a 2px `#949494` outline notch on `surface` |
| Waiting on you | A solid `critical` notch with no halo, the label in `status-error` ("Your Approval: The Plan", "Open 1d 4h") |
| Waiting on someone else | An ink outline notch, with the person and the wait underneath ("Dana, 1d") |
| Waiting two business days or more | The same notch with a Bold age and a 12 px clock glyph |
| Partly co-signed | A half-filled notch, "1 of 2" |
| Sent back | "Round 2" at the segment's end; the earlier split struck through and kept |
| Changes since approval | A 6 px ink dot after the notch, plus "3 changes" |
| Graduated | The track extends past Live |

**Mini line** (cards, Projects and Portfolio rows, the Activity header): 8 px notches and a 2 px track, at most 280 px wide.
Labels sit below and show split times only (12/16 `on-surface-variant`), with "You" in 12/16 Bold `status-error`
under the red notch.

Both have `role="img"` and an `aria-label` that reads the whole line ("Discover done. What we're building signed
by Maya Chen after 5d 2h. The plan is waiting on you, open 1d 4h. Build and Live upcoming."). On the inverse strip,
such as the Teams card header, ink becomes white and the red notch stays `#DC0019`. The plain black square is
reserved for notches: never a bullet, a section marker or a row glyph. List bullets are 4 px round `#5F5F5F` dots.

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

### 9.23 Help menu and account menu

The top bar's three menus (workspace, Help and account) share one anatomy (proposed). Each is a native
disclosure (`<details>` and `<summary>`), so Enter and Space toggle it, Tab moves through its rows and the browser
exposes the expanded state. Links sit in a plain list and choices are buttons: never ARIA `menu` and never
`aria-haspopup`.

- **Panel:** 256 px wide, `surface`, radius 8, Large elevation with its 1px `outline-variant` ring, 8 px vertical
  padding, 52 px below the top of its button so it opens just under the bar, right-aligned to its button (the
  workspace menu left-aligned).
- **Rows:** 32 px, 16 px side padding, Label SM in `on-surface`, no leading glyphs; a trailing keycap, badge,
  state word or mark sits at the right edge. Hover fills `surface-container-high`; focus is the inset ring.
- **Dividers:** 1px `stroke-tertiary` with 8 px above and below.
- **Closing:** a click outside closes every open menu; Escape closes it and returns focus to its button. A choice
  that changes state (a workspace) closes the menu.

**Help menu**, from the "?" button:

| Row | Behavior |
|---|---|
| How Work Moves | Opens the Lifecycle map |
| How HyperDelivery Is Built | Opens the platform architecture |
| (divider) | |
| Keyboard Shortcuts, with a `?` keycap | Expands in place to a two-column key list in Body XS: ⌘K Search; / Search This Table; J and K Next and Previous Item; @ Mention Someone; Esc Close; ? Show Shortcuts |
| What's New, with the NEW badge | Expands in place to the last three changes, each a Bold date and one line ("Oct 24 Start from a Jira ticket or your files") |
| (divider) | |
| Ask the Platform Team, with the 16 px Teams mark | Opens the platform team's Teams channel |

On the two help pages the "?" button shows selected, and the row for the current page is Bold with
`aria-current="page"`. Keycaps are Chivo Mono 12/16 in `on-surface-variant` on `surface`, with an inset 1px
`outline-variant` ring, radius 4 and 2 × 6 px padding.

**Account menu**, from the avatar: a block with the name in Heading XS and the role in Body XS `on-surface-variant`
("Business owner, Merchandising"); a divider; "Show Technical Detail", a button with `aria-pressed` and its state
("Off" or "On") in Body XS `on-surface-variant` at the right, plus a 16 px check when on; a divider; "Sign Out".
Show Technical Detail brings back Layer 3 detail in place (engine and model names, query ids, commit hashes,
schema paths, run ids); it starts from the viewer's role.

### 9.24 Composer

The box where an idea starts, on Start (span 9) and First run (span 7) (proposed component; Baselayer has none).

- **Box:** `surface`, a 1px `outline-field` stroke, radius 8. Focus draws the ring on the whole box
  (`:focus-within`, 2 px `#0096FA` at a 2 px offset).
- **Text:** a textarea at 16/24, 16 px insets (12 px at the bottom), at least 160 px tall, no border of its own,
  labeled by the page title, with a calm placeholder in `on-surface-variant` ("Describe the problem, who has it,
  and what would help.").
- **Attached:** only when something is attached, a row of 24 px object chips 8 px apart, 16 px from the sides.
- **Footer band:** 60 px, `surface-container`, a 1px `stroke-tertiary` top rule, 8 × 16 px padding, the bottom
  corners at radius 8. Left, 8 px apart: the workspace picker (a 36 px ghost "Workspace Merchandising" with a
  chevron, opening the workspace menu; it sets this project's workspace only and starts from the top bar's),
  "Add a Link" and "Add Files" (36 px ghosts with the link and file glyphs). Right: while the box is empty, the
  Body XS hint "Describe your idea to continue." (linked by `aria-describedby`) and a disabled 44 px "Continue";
  with text, an "@ People" keycap hint and the Large primary "Continue".
- **Starters:** 16 px below the box, 32 px buttons 8 px apart that wrap: `surface`, an inset 1px
  `outline-variant` ring, radius 4, Label SM, a 16 px plus glyph. Each names a function and a job ("Finance: Flag
  late vendor invoices"). A click replaces the box's text with that starter's sentence and reveals the follow-on
  choices; starters are not toggles, so they carry no `aria-pressed`.
- **Reveal:** once there is an idea, Continue hides and the box stays editable; focus stays where it was, and a
  visually hidden polite live region says "Choices added below".

## 10. Icons

- **One stroke set** on a 24 px grid: no fill, `currentColor` strokes with round caps and joins, and
  `aria-hidden="true"` unless the icon is the only label (then the button carries the name).
- **The rendered stroke is always 1.5 px.** For the inline set, `stroke-width` is 1.5 × 24 / size: 3 at 12 px,
  2.25 at 16, 1.5 at 24 and 0.75 at 48.
- **Sizes:** Baselayer's `ic` steps 12 (status beside 12 px text), 16 (the default: buttons, chips, navigation,
  inputs, cells), 24 (header actions, rail toggles) and 48 (empty states). Retire 13, 14, 18, 20 and 22.
- **Color:** `currentColor` from `on-surface` or `on-surface-variant`. Only status glyphs take a status color.
- **The console** keeps Phosphor, its adopted set (`docs/decisions.md`, 2026-08-27), holding the 1.5 px stroke by
  weight: Bold at 16, Regular at 24, Thin at 48; at 12, Bold renders 1.125 px, which is accepted (proposed). Map to
  Baselayer's own `ic` assets if a code library or Code Connect mapping appears.
- **Brand marks are not icons.** They keep their own colors and live in logo tiles (section 9.9).
- **Sparkle is banned,** as a glyph and as an idea (no sparkle icons, per the copy rules).

| # | Name | Use | Nearest Phosphor glyph |
|---|---|---|---|
| 1 | home | Navigation fallback, empty Home | House |
| 2 | folder | Pointed resources, Sources | Folder |
| 3 | inbox | Inbox empty state | Tray |
| 4 | book | Library, golden paths | BookOpen |
| 5 | chart | Portfolio, metrics | ChartBar |
| 6 | settings | Admin, view options | SlidersHorizontal |
| 7 | search | Search launcher, table search | MagnifyingGlass |
| 8 | plus | Start a Project, add | Plus |
| 9 | chevron-right | Row disclosure, expanders, breadcrumb (optional) | CaretRight |
| 10 | chevron-down | Workspace switcher, selects, expanded groups | CaretDown |
| 11 | check | Met, Confirmed, Invited, selected chip | Check |
| 12 | x | Failed, close, destructive | X |
| 13 | alert | Flags, budget over cap, provenance | Warning |
| 14 | info | Help text, tooltips | Info |
| 15 | clock | Long waits, stalled, timestamps | Clock |
| 16 | user | Unassigned signer, people fields | User |
| 17 | users | Teammates, Entra groups | Users |
| 18 | link | Paste a link, Sources | Link |
| 19 | file | Documents, the brief | File |
| 20 | play | Evidence clips, Replay, walkthrough | Play |
| 21 | pause | Trace and replay playback | Pause |
| 22 | filter | Filter button | Funnel |
| 23 | sort | Sortable column headers (12 px) | ArrowsDownUp |
| 24 | download | Export, Export SVG | DownloadSimple |
| 25 | external | Open in Confluence, CloudWatch | ArrowSquareOut |
| 26 | more | Row actions | DotsThree |
| 27 | lock | Blocked by a Microsoft 365 setting, permissions | Lock |
| 28 | shield | Reviewers and QA, guardrails | Shield |
| 29 | bolt | Automated steps, Live | Lightning |
| 30 | undo | Send Back, Undo | ArrowUUpLeft |
| 31 | partly | Partly Met, partly co-signed | CircleHalf |
| 32 | arrow-right | Flow arrows, in place of text arrows | ArrowRight |
| 33 | retry | Retry From This Step, retry bars | ArrowClockwise |
| 34 | terminal | The coding agent (AgentCore harness, in the sandbox) and its build sessions | TerminalWindow |
| 35 | browser | Browser checks, previews opened as a test viewer | Browser |
| 36 | arrow-up | Increase in a table delta | ArrowUp |
| 37 | arrow-down | Decrease in a table delta | ArrowDown |
| 38 | help | The Help button in the top bar | Question |

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
and section 7.2 says where it lives.

**Home.**
- Page header "Needs You", with a meta line counting what waits ("2 approvals, 1 question, 1 confirmation,
  oldest first"); "Open Inbox" as a text link on the title row; no breadcrumb.
- Rail layout. The main column holds the Inbox panel (no inner title) of Inbox rows; only the first row's action
  is the Large primary.
- "My Projects" (Heading MD) 56 px below, with "All 7 Projects" (to Projects) on the right: project cards in a
  2-column grid, one anatomy, hugging their content, no chart bands. Every card opens its project. On a card the
  red stays on the notch and the "You" under it; the status line ("Your Approval: The Plan") is ink Bold, and the
  "Next:" line drops when the status is the viewer's own decision.
- The rail is one panel with one section, "Shipped Across UA This Week", whose items carry their owners' avatars.
  The panel hugs its content.

**Inbox.**
- Standard header: no breadcrumb, title "Inbox", meta "4 waiting on you, oldest first".
- One full-width panel: a toolbar band (`surface-container`, a `stroke-tertiary` bottom rule, 12 × 24 px padding)
  with filter chips All, Approvals, Questions and Confirmations; then the Inbox rows of section 9.15, exactly as on
  Home; then the closed "Done in the Last 7 Days" row.
- The empty state is Home's: the inbox glyph, "Nothing Waiting on You" and one line, with no button.

**Projects.**
- Standard header: no breadcrumb, title "Projects", meta "7 projects, 2 waiting on you".
- One full-width table panel in the Portfolio table's look. The toolbar band holds "Search projects" (36 px, with
  a `/` keycap), the chips All, Waiting on Me and Live, and a right-aligned "Needs Attention" text link.
- Columns: Project (a 24 px owner avatar, the name in Body SM Bold as the link, "owner, workspace" in Body XS),
  Tier (at least 152 px, nowrap), The Line (mini), Waiting On, Elapsed, Cost, Status. No checkboxes and no row
  menus; the footer counts the projects. Below 1440 the table scrolls inside its panel with Project pinned.

**First run.**
- Home is the active area, with no breadcrumb and no top-bar "Start a Project". The hero is Heading 2XL, at most
  two lines, over one or two lines of Body MD at most 680 px wide.
- The composer (section 9.24) spans 7 columns with the six starters under it; its "Continue" goes to Start with
  the idea carried over.
- "See It Work First" fills the other 5 columns: the walkthrough poster is a real product frame (16:9, radius 8,
  an `outline-variant` edge) with a Large secondary "Play, 2:04"; chapters are rows with mono timestamps on the
  right.
- "What Teammates Have Brought" starts 56 px below the hero: project cards in a 3-up grid.

**Start a project.**
- Projects is the active area and the top-bar "Start a Project" is hidden. Breadcrumb "Projects / Start a
  Project", title "What Do You Want to Make?", no meta line. Rail layout; the main column keeps its width in every
  state.
- Three tabs on the band's bottom rule, each with a 16 px leading glyph: Describe It (file, the default), From a
  Jira Ticket (the Jira mark) and Point at What You Have (link). They change the panel, so they are tabs, with
  arrow keys, Home and End and a roving tab stop.
- **Empty first.** Describe It opens with only the composer (section 9.24) and six starters from different
  functions (Finance, Sourcing, Marketing, Stores, Supply Chain, Merchandising): no rail panel, no follow-on
  sections, no action bar.
- **Revealed after the idea.** Continue, a starter, a read ticket or a pointed resource adds the follow-on choices
  in the main column, 56 px apart, with no helper lines under the first two: What Kind of Project (2 × 2 radio
  cards, each with a 40 px glyph tile and never a brand mark; "Recommended" on Build Something New), How Thorough
  (3 × 336, Standard recommended, with the time cost) and Pick a Starting Look (4-up quiet wireframes in
  `#D0D0D0` with one ink line, helper "You can change it later."). Selection is the 2px ink outline.
- The rail then shows one panel: Draft Brief (Heading SM with a DRAFT badge, at most three lines restating the
  idea, an "Edit" link), Who Should Be Involved (32 px avatars, name and role, a Compact secondary "Invite" each)
  and What Happens Next (three 24 px numbered circles).
- The sticky action bar (section 7.3): "Start the Project" (Large primary), "Save as Draft" (Large secondary) and a
  summary ("Standard, Workbench table, 2 people invited"). From a ticket the primary reads "Start From
  MERCH-1182"; from pointed resources, "Start With 3 Sources".
- **From a Jira Ticket** holds the canvas's only worked example: the link field with the status "Read with your
  access", the ticket card with its description as plain Body MD (no gray box), linked pages, attachments and
  comments in columns, and an "Add a link to this project on MERCH-1182" checkbox. Jira keys are ink mono, never
  link blue. Its Draft Brief adds "What We Heard, From Comments" and "Done When" as plain bullets, with no AC
  codes.
- **Point at What You Have:** a 44 px field and a Compact secondary "Add", then one row per pointed resource: a 24
  px logo tile, the name, its source in Body XS, and a 32 px icon button "Remove <name>".

**Project.**
- The project page header: breadcrumb "Projects / `<Workspace>`", the title as typed, one tag (the tier), the
  avatar stack and "Share" as a Compact secondary, then the full line and the project tabs. No red capsule in the
  header; the notch and the Decision card carry it.
- Main column at the plan step: What You'll Get, What It Skips and What Data It Uses as one white panel in three
  columns split by `stroke-tertiary` rules, with Heading XS headings; then the Decision card, the sign panel in
  place (attestation checkbox, "Approve the Plan" disabled with its reason until checked, "Send Back", "Ask
  Someone", "Reassign"); then the clickable mock with its provenance strip; then the work breakdown.
- The preview is one surface: the provenance strip, a one-row toolbar (search, filter chips that fold into one
  "Filters 3" button below 1440, a ghost "View" with Density and Columns, a ghost "Export"), then the table.
  Selecting rows swaps the toolbar for the selection bar in place.
- The assistant rail runs full height with the composer pinned; its header has the 20 px product mark,
  "HyperDelivery" and the assistant's status on a second Body XS line that never truncates ("Waiting on you",
  "Building, about 2 hours left"). Each tool-call group is collapsed to one row with one 24 px tile; expanded, it
  shows plain outcome lines indented 32 px, with no value boxes. Engine, model and query chips show only with
  Show Technical Detail on. Suggestion chips are 32 px.
- At the build step the build session keeps a five-figure row and "Open Preview"; branch, pull request and the
  check strip sit in a closed "Technical Detail" row.

**Approval.**
- The Decision header: breadcrumb "Inbox / Wholesale sell-through tracker", the decision label above the title
  "Accept the Working Prototype", one tag (the tier), and three meta pairs (Requested by, Version, Who Can Open
  It).
- "Evidence, Criterion by Criterion" (Heading MD) with summary statuses ("5 Met", "1 Partly Met"). Each criterion
  row has a 128 × 80 real crop in a `surface-container-high` tray (4 px padding, radius 8 outside and 4 inside; a
  different crop per criterion), the criterion number, the status, the criterion in Body MD, an object chip, and a
  36 px ghost play button with its length ("0:24") whose `aria-label` names the criterion. Advice from checks is
  the last row, with the alert glyph.
- "Numbers Check" as a table; variance as a green check plus "0.0 pts", with no tint.
- The sign panel is the Decision card across the main column, sticky 16 px from the bottom: what happens when you
  sign, the attestation checkbox in a 44 px row, "Sign and Accept" disabled with its reason directly under it
  until the attestation is checked, "Send Back" as the Large secondary, and "Ask Someone" and "Reassign" as
  links.
- The rail has two sections: What This Prototype Skips, and Who Signs, in Order (a 120 px status column, the
  viewer as Bold ink "You, now"). Repository and hash chips show only with Show Technical Detail on.

**Teams cards and the task module.**
- Teams chrome stays, and Teams purple appears only on Teams-native controls. The bot avatar is the product mark.
- Adaptive Cards render in the host's type and colors, so carry what survives: the line as an image on the
  inverse strip (white ink, red notch), Title Case labels, lowercase durations ("1d 6h"), dates as "Oct 25,
  14:02", and statuses as glyph plus word.
- The task module has a full-window scrim, a dialog sized to its content, the rows in the Project page's order
  (What You'll Get, What It Skips, What Data It Uses), the checkbox directly under the list, and "Pending
  Signature" in Heading XS. The receipt ends with an "Open Project" link.

**Working session (Enterprise).**
- Teams' light chrome around the meeting; the shared stage and the HyperDelivery side panel use this system.
- The stage title is Heading LG with items in Body MD; its tabs sit under the title as 44 px tabs.
- The side panel has the product mark and "HyperDelivery", "Now Asking" as a plain section and "Captured
  (Proposed)" in Heading XS, type badges in a fixed 72 px column, and a "Confirm What We Heard" link under the
  captured list. Attribution chips never wrap. Nothing below 12 px.

**Confirm what we heard.**
- Breadcrumb "Projects / `<Project>`", title "Confirm What We Heard"; the avatar stack and a 36 px primary "Finish
  Review" on the title row, disabled with "5 left to review" until every item is handled. The counts live in the
  meta and the filter chips (All, To Review, Confirmed), not in boxed stats.
- Rows: a type badge in a fixed 112 px column, the statement in Body MD, attribution on its own Body XS line.
  Proposed rows get "Confirm" (Compact secondary) and "Not Right" (ghost), each with an `aria-label` naming the
  statement. Confirmed rows show the status "Confirmed by you" and an "Undo" link, never a button.
- The dispute panel in the rail: "Pick This Project's Level" with an alert glyph, one status line, both positions
  under a closed "Show Both Positions" disclosure, and the resolutions as radio option rows with the certified
  level marked "(Recommended)".

**Library (Enterprise).**
- Opened from the navigation: Library is active, no breadcrumb, title "Library", meta pairs (Workspace, Confirmed
  Facts, Reused This Quarter, Disputes Resolved). No page primary.
- The facts table under a toolbar band ("Search facts" with `/`, type chips): type badges in a 112 px column, Fact
  and Source, Confirmed By, Used In and Status, with "Canonical" as a green check plus word and reuse counts with
  correct plurals.
- The rail is one panel: Golden Paths (rows with a 40 px logo tile, the name in Heading SM with "Recommended" as a
  badge above it, two lines of Body SM; the selected row is the 2px ink outline on `surface-container-high`) and
  Recently Accepted (with owners' avatars).
- Reached from Start, the breadcrumb reads "Projects / Start a Project / Facts for This Idea", Projects stays
  active, a Use column labels each checkbox "Use: <fact>", and the sticky action bar ends in "Start With 6 Facts"
  (Large primary, built whole) and "Back".

**Activity.**
- The project header with the Activity tab selected and one tag. "What Happened / Decisions and Handoffs /
  Trace" is a segmented control alone on a row 24 px below the tabs, right-aligned.
- A failure that waits on the viewer is the event panel's top band (`surface-container`): the 8 px red marker,
  one plain sentence, "Last good" and one Compact secondary that jumps to the failed step.
- The event list: dates in Body SM Bold tabular; one 24 px glyph column (an avatar for people, a logo tile for
  systems, an 8 px ink notch for approvals, a hatched 12 px square for waits); a fixed 120 px column of Bold
  durations, with notes on a Body XS second line; waits on `surface-container`, never yellow.
- "Where the Time Went" is the decision timeline by person: 32 px rows in each person's fill, hatched waits,
  approvals as notches on a top rail, a today line, and a legend row under the chart (Waiting, Deciding, Asked).
- Decisions and Handoffs and Trace are Layers 2 and 3, so agent hues are vivid there.

**Portfolio (Enterprise).**
- Title "Portfolio", no breadcrumb; the scope goes in meta pairs (Period, Workspaces), and Month, Quarter and Year
  sit as a segmented control on the title row.
- A stat strip replaces the KPI cards, with ink sparklines and deltas in words; one cell is "Started a Second
  Project" ("11 of 19").
- The table keeps solid filter chips, mini lines with split times, ink elapsed bars with no track, logo stacks of
  three plus `+N`, a Tier column at least 152 px wide, and pagination with real `disabled`. It scrolls inside its
  panel below 1440 with Project pinned.
- Bottom cards in a 2 × 2 grid at 688 px: waits by person in their fills, spend by system in brand hues, "Use Cases
  Tried" as ink bars on a `--hd-data-track` track, and what it is worth so far, all labeled directly.

**Admin (Enterprise).**
- Title "Workspace Guardrails", breadcrumb "Admin / Merchandising" with "Admin" as plain text, tabs Guardrails,
  Audit Log and Usage. Rail layout, 56 px between sections.
- Connectors: a 40 px tile, the name, a Body XS description (not mono) and the tier; the state as a status word
  ("Connected" with a green 8 px dot, "Paused" in ink) and a 36 px "..." icon button per row ("Actions for
  <connector>") with Pause Connector, Reconnect and View in Audit Log. Only the exception row is loud (Bold, alert
  glyph). Mono only for real identifiers.
- Read and "Write, After Approval" as tags, Write in the emphasis variant. "Pre-Approved Data" lists what needs no
  separate data approval. "Who Can Do What" keeps right-aligned tabular counts, with no bars.
- Usage holds the budget (an ink bar with an alert tick at 80%, a `--hd-data-track` remainder, the forecast in Bold
  ink with an alert glyph) and spend by project. Audit Log is a table of When, Who and What.
- The rail holds the policy change as a Decision card ("After" on `surface-container-high` with the changed words
  in Bold, "Before" struck through on `surface-container`; its "Review and Sign" is the page primary) and Models
  Allowed. "Suggested Rules (3)" closes the main column, each with "Promote" (Compact secondary) and "Dismiss"
  (ghost).

**Graduation (Enterprise).**
- The Decision header: breadcrumb "Inbox / Store labor and traffic planner", the decision label "Your Decision:
  Engineering Intake" above the title "Hand Off to Retail Systems", meta pairs Business Owner, Decide By and
  Intake ("1 of 2 places left this quarter"), and the full line with "Graduate" as the red notch's label.
- "In the Package": a 160 px label column, mono only for repository and file names, with a middle ellipsis and a
  `title` when long. The signed records sit in a closed "4 Signed Records" row; hashes show only when it opens.
- The readiness table shows "Passed" as a green check plus word, and "Not Needed" in Regular `on-surface-variant`
  with no glyph. The decision is a Decision card titled "Your Decision" with three options as a radio group
  (selected is `surface` plus the 2px ink outline, with a visible radio), a reasons textarea across the options,
  and "Sign Decision". Who Signs Graduation shows the viewer as Bold ink "You, now".

**Needs attention.**
- Breadcrumb "Projects / Needs Attention", title "Needs Attention", the counts in the meta. Filter chips (All,
  Failed, Blocked, Stalled, Budget) carry their status glyphs and sit in a toolbar band at the top of the list
  panel, not in the title row.
- The list is one panel grouped by project: a Heading SM group header with an "Open Project" link whose
  `aria-label` names the project. Rows have a 24 px system tile, the title in Heading SM, one plain status line
  ("Couldn't run the query"), labeled pairs in Body XS ("Last good 09:12 today", "Notified Noah Park"), at most two
  lines of explanation in a middle column no wider than 480 px, and actions on the right. Codes, test names and
  the repository sit behind "Open Trace". The red 8 px marker, with "Waiting on You" in ink Bold, appears only
  where the failure waits on the viewer. The most severe row gets the Compact primary.
- A workspace budget reaching its cap (Enterprise, when budgets are enforced) is a "Budget" section below the
  project groups: a stage bar on the ink ramp with direct labels ("$240 of $300, 80%") and "Ask Maya to Raise the
  Cap" as a Compact secondary.
- Empty: a 48 px check glyph, "Nothing Needs Attention" and one line, with no button.

**How Work Moves (help).**
- The Help header: breadcrumb "Help / How Work Moves", the title, meta pairs ("Steps on This Path", "Approvals 3 at
  every depth"), no active area and the "?" selected. A toolbar row 24 px below the band: Path and Depth as 32 px
  segmented controls on the left, a 36 px ghost "Legend" on the right that opens both legends (step types, with
  no tag meaning a step runs on its own; and who owns each step).
- Phases in Heading MD with a Body SM subtitle and a Body XS count (not mono). Step cards hug their content: the
  step id in mono, the owner with a 24 px tile, selection as `surface-container-high` plus the 2px ink outline, no
  agent left rules. Agent hues stay vivid. Graduate, the one step that arrives in Enterprise, is dashed with
  "Arrives in Enterprise".
- Approval tiles keep their numbered ink notches. A selected step's detail opens inline under its phase row, full
  width, with at most four Heading XS groups and a 36 px close button.

**Project architecture.**
- The project header with the Architecture tab. The diagram fills the 9-column main column with 32 px zoom and fit;
  the toolbar holds the "Edge Labels" switch, a Body XS provenance line ("Version 4, signed with the plan Oct 21"),
  the count of components and flows, and a ghost "Export SVG".
- The 336 px rail panel holds "Replay a Flow" (scenario chips, numbered steps, play, previous and next) and then a
  closed "Legend". A node click swaps the rail to that node's details, with "Back to Replay". "Decisions Behind
  This Design" follows across the full width.

**How HyperDelivery Is Built (help).**
- The Help header: breadcrumb "Help / How HyperDelivery Is Built", one meta line (where it runs, where it builds,
  the systems it connects to as four logo tiles, the part count), no active area and the "?" selected.
- The toolbar holds a 32 px segmented control, Today, MVP and Enterprise (MVP by default), with the note "Dashed:
  arrives in Enterprise". Today lights only what runs now; MVP dims the Enterprise parts; Enterprise shows all.
- The rail holds the replay; a node click swaps it to that part's details, including the phase it lands in, with
  "Back to Replay".

**Both architecture canvases.**
- Zones are `surface-container` with a 1px edge in the system's hue plus its mark; the HyperDelivery zone edge is
  ink. Nodes are `surface`, radius 8, with a 24 px tile, a Body SM label and a Body XS sublabel (mono only for
  identifiers). Replay dims only borders and icons; text stays at `on-surface-variant` or darker.
- Edge labels are 12 px ink on `surface` chips (radius 4, an `outline-variant` ring) at the midpoints, never
  colliding. Zoom and fit are 32 px. The legend names the ink orchestrator and each agent hue.

**The line.** The specimen of section 9.21: every state, and the scales (project header, card, table row, Teams
card header on the inverse strip, app icon at 24, 40 and 64, lanes rail).

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

1. **Shell:** the top bar is identical across screens except the active item, the avatar, the count, whether "Start
   a Project" shows and the Help button's selected state. The UA logo, the breadcrumb or title, and the first panel
   share one left edge. The only black pill on a screen is the page's own action.
2. **Planes:** the canvas is `#F9F9F9` and panels are white with a `#D0D0D0` edge. No bordered box inside a panel
   except the evidence tray. No colored side stripes.
3. **Red test:** hide everything but red. Each red element answers "what do I need to do?" At most one filled
   capsule per region. No red buttons, charts, deltas or halos.
4. **Color meaning:** stages are the same ink ramp on every screen; no agent hues in Layer 1; selection is always
   `#F0F0F0` plus the 2px ink outline.
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

## 14. Adopting it in the console

1. **Tokens and fonts.** Replace the `@theme` block in `ui/console/src/index.css` with the role tokens, aliases,
   type pairs, spacing names, radii and elevation in this document, light only (the dark block goes), and
   self-host Archivo and Chivo Mono in place of Geist. Components move from today's names to roles in the same change, so no old token
   survives (section 3.7 is the map).
2. **The red remap** finishes here: primary buttons become black pills, the focus ring becomes `#0096FA`, and
   selection, the account avatar and the hazard stripe stop using red
   ([ux-direction.md section 6](ux-direction.md#6-visual-language)).
3. **Shell and page header** (section 7), replacing the eight-step top bar. Once Brand has reviewed the lockup, the
   top bar takes the product lockup (section 8.2) from the copied SVG in place of today's `ui/console/public/ua-logo.png`
   in `TopBar.tsx` and `Answer.tsx`. That PNG is a 512 px red "Enterprise Data Management, Data & Analytics" team
   badge, not the UA logo: at 24 px its red reads as "waiting on you" (section 3.3).
4. **Components** in the order the Final MVP screens need them: buttons, chips, status, avatar, logo tile, tabs and
   segmented control, panel and Decision card, the top bar's menus, the composer, data table, Inbox row, form
   fields, overlays, the line.
5. **Screens,** each checked against section 13.

## 15. Brand review

These go into the dated Brand review that runs in the long-lead track
([ux-direction.md section 6](ux-direction.md#6-visual-language)):

1. Whether internal tools may license UA Text and UA Technical, whether the console may self-host them, and
   whether a published canvas may embed them.
2. The product lockup (UA logo, hairline, "HyperDelivery", section 8.2), the product name's setting, and whether the
   console's Enterprise Data Management badge stays on its sign-in page (`AuthGate.tsx`). The concept screens
   already carry the lockup; the console waits for this item.
3. HD-R1: using `critical` red to mark attention rather than a transaction button, with no red buttons.
4. The color extensions: agent hues, system brand hues for data series, the ink data ramp and the people fills.
5. `on-inverse-variant` (`#D0D0D0` on the inverse strip), a value Baselayer does not publish.
6. The proposed component sizes: 36 and 32 px buttons, the 32 px Help button, 24 px object chips and tags, 20 px
   badges at 12/16 in the UA Technical stand-in, the 8 px surface radius, and the tab, table, ghost-button, menu,
   composer and stat-strip specs.
7. Title Case as the product's UI copy rule.
8. Third-party marks in product chips (already a long-lead item in ux-direction.md).
9. Conflicts inside Baselayer that were resolved provisionally: `on surface variant` (`#5F5F5F`, against the
   skill's `#444444`), the light container fills (labels against rendered swatches), one black (`#1D1D1D` against
   `#151515`), the `outline` value, and the green hex (`#00834B` against `#008850`).

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
6. **The `#F9F9F9` canvas with white surfaces** and the `#D0D0D0` panel edge.
7. **Radii 0, 4, 8 and pill** (plus 1 and 16), replacing 3, 6 and 8 px surfaces and 5 to 6 px chips.
8. **Compact control sizes,** 36 and 32 with a 32 px floor, relaxing the 44 px target rule.
9. **Color from what is real:** the ink ramp for stages, statuses and counts; brand hues for systems; person
   fills for people; full-color marks; the orchestrator in ink. This rejects a single blue data ramp and the
   categorical palette.
10. **The people fills,** remapped to the deeper set.
11. **The `#0096FA` focus ring,** replacing the ink ring and the console's red ring.
12. **A top bar shell and one page header,** rejecting a left rail.
13. **No colored left rules and no tinted surfaces.**
14. **Chivo Mono** for identifiers and badges, rejecting Geist Mono as the primary mono.
15. **The UA logo leads the top bar** as the product lockup, with the three-notch line kept as HyperDelivery's own
    glyph. This rejects the three-notch mark alone in the chrome and the full UNDER ARMOUR lockup in the bar
    (logged 2026-10-26).
16. **Desktop and laptop only, light theme only, for now** (section 11). This rejects responsive layouts and a dark
    theme before the pilot shows a need (logged 2026-10-26).
17. **Help behind a "?" in the top bar,** not a Library section, as a native disclosure rather than an ARIA menu
    (logged 2026-10-26).
18. **The top bar's "Start a Project" as a compact secondary,** so the page's own action is the only black pill.
    This rejects a black primary in the bar.

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
