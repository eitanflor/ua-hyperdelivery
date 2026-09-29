# Detail

| | |
|---|---|
| Source | <https://detail.design/> - curated by Rene Wang. The same catalog ships as an agent skill: <https://github.com/detaildotdesign/skill> (`npx skills add detaildotdesign/skill`) |
| Retrieved | 2026-09-28 (skill snapshot plus the newest site entries) |
| What it is | 120+ small, real-world interface decisions - "the extra considerations that separate software that works from software that feels right". |
| License | Skill content is MIT. Site entries link to their original products. |

## Why it is in the library

Hyperdelivery's structure is sound; what non-technical users feel is the finish. This catalog
is the checklist for that finish, and its rule IDs give reviews a shared shorthand
(`motion-21`, `copywriting-7`).

## The decision gate

A detail you *can* add is not one you *should*. Run every candidate through these, in order,
and drop it at the first failure:

1. **Serve the user, not the ego.** If it only impresses designers, it is decoration.
2. **Frequency of exposure.** The more often it fires, the quieter it must be. High-frequency
   actions get little or no animation; rare or first-run moments can carry delight.
3. **Respect the user.** Reduced motion, keyboard, touch targets and screen readers. A detail
   that breaks one is a regression dressed as polish.
4. **Consistency.** A detail on one surface but not its siblings is worse than none.
5. **"Need confirm" rules** are opinionated - ask before applying.

Core philosophy: craft over decoration, ambient over obvious, physics over magic, intent over
input, consistency over novelty.

## How to read the tables

- **Rule** is the catalog ID. Cite it in reviews.
- **Fit** is relevance to Hyperdelivery: **H** (apply), **M** (apply where the surface exists),
  **L** (low value), **-** (no matching surface), **pass** (already honored).
- **Where** names the console surface it lands on.

## Motion (25)

| Rule | Detail, paraphrased | Fit | Where |
|---|---|---|---|
| motion-1 | Let an action button's motion preview its result (plus rotates into close). | H | Sign button morphing into the signed seal |
| motion-2 | Interpolate icon color through intermediate hues instead of snapping. | L | - |
| motion-3 | Reveal a signature by drawing its stroke, not fading it in. | H | Signed gate checkpoint |
| motion-4 | State icons mirror what they control (sidebar icon opens like the panel). | M | Rail and inspector toggles |
| motion-5 | ASCII spinner frames where no graphical loader fits. | M | Dither/ASCII working cards |
| motion-6 | Blurred fade edges must bleed to the container boundary. | L | Thread scroll edges |
| motion-7 | Cross-fade through a brief blur rather than a hard swap. | M | Skeleton to finished artifact |
| motion-8 | Pin a minimap to long transcripts; glide the marker; flash the landing point. | H | Thread station minimap |
| motion-9 | Close a modal back to its origin, even if the page scrolled. | M | Diagram expand dialog |
| motion-10 | Lock the cursor style while a surface morphs. | L | - |
| motion-11 | Animations must be interruptible; retarget from the current value. | H | Every panel and sheet |
| motion-12 | Choreograph layout shifts; slide neighbors instead of jumping. | M | Inspector open/close, plan panel |
| motion-13 | Reserve bold width so hover weight changes do not reflow. | M | Tabs, rail rows |
| motion-14 | Drop heavy backdrop blur during fast scroll. | L | - |
| motion-15 | Reduce animation on features used many times a day. | H | The frequency rule in [../principles.md](../principles.md) |
| motion-16 | A short shake marks a dead end. | M | Invalid intake, blocked actions |
| motion-17 | Slide the selection highlight between items. | H | Detail-level switch, tabs, the line indicator (already springs) |
| motion-18 | Stagger simultaneous reveals in reading order. | M | Home bento, artifact sections |
| motion-19 | Move one tooltip between adjacent targets instead of hide/show. | M | Line indicator stations |
| motion-20 | Morph a trigger button into the input it reveals. | M | Rail search, inline rename |
| motion-21 | Shake a disabled button when clicked so it reads "not yet", not broken. | H | Sign button before criteria are confirmed |
| motion-22 | One ambient indicator that morphs through a process's lifecycle. | H | Status mark for stations, plan steps, builds |
| motion-23 | Loading that explains its cause (a bar fills, then the view switches). | H | Undo window as a filling bar before dispatch |
| motion-24 | Shake on disabled click (duplicate of motion-21 in the catalog). | H | As above |
| motion-25 | Blur the scroll edge instead of fading it (Need confirm). | L | - |

## Interactivity (38)

| Rule | Detail, paraphrased | Fit | Where |
|---|---|---|---|
| interactivity-1 | Enter is context-aware: send in single-line intent, newline inside code. | H | Composer, landing |
| interactivity-2 | Auto-convert `->` and `--` as people type (Need confirm). | L | - |
| interactivity-3 | Hit area larger than the visual element (24px desktop floor). | H | Small icon buttons in the top bar and rail |
| interactivity-4 | Reserve the pointer cursor for navigation. | M | Global |
| interactivity-5 | Contextual cursor over special targets. | L | - |
| interactivity-6 | Single-key shortcuts in high-frequency, non-text views. | M | Home and portfolio (never in the composer) |
| interactivity-7 | Collapse instead of close, so the way back is one click. | H | Inspector, plan panel, "What's new" |
| interactivity-8 | Delay the close button on promotional popups. | - | No promotions |
| interactivity-9 | Snap crop handles to component edges. | - | - |
| interactivity-10 | Fix doubled spaces on cut and paste. | L | - |
| interactivity-11 | Transform a paste only when the landing surface makes intent clear. | M | Pasting a Confluence or Jira link into intake becomes a source chip |
| interactivity-12 | Live-sync the page title to the identifier being edited. | M | Project rename |
| interactivity-13 | Re-tapping the active tab resets it. | M | Home, rail |
| interactivity-14 | `overscroll-behavior-x: none` on horizontal scrollers. | M | Line indicator, canvas |
| interactivity-15 | Let nested scrollers bounce with `overscroll-behavior: contain`. | M | Inspector, thread |
| interactivity-16 | A discoverable way back to the top of long pages. | M | Long artifacts |
| interactivity-17 | Pre-fill fields with realistic, editable examples. | H | Guided intake |
| interactivity-18 | Accept natural-language dates. | L | Future: due dates on gates |
| interactivity-19 | Tolerate overflow; let people finish their thought before trimming. | M | Project names, comments |
| interactivity-20 | One login field for magic link or password (Need confirm). | - | Entra ID owns sign-in |
| interactivity-21 | Guard duplicate clicks on submit. | H | Sign, send back, start project |
| interactivity-22 | Double opt-in for subscriptions. | - | Revisit with notifications |
| interactivity-23 | Turn completion into presence: finished work moves to a "recently done" list. | H | Home "Recently shipped", signed receipts |
| interactivity-24 | Validate content before an irreversible send. | H | Send-back comment, intake pre-flight |
| interactivity-25 | Name files from their context (`Project - Requirements brief.pdf`). | H | Artifact export |
| interactivity-26 | Auto-segment video chapters. | - | - |
| interactivity-27 | Pre-flight for missing pieces ("I've attached" with no file). | H | Intake; Gate 3 with open work-in-progress builds |
| interactivity-28 | Make detected addresses, links and numbers actionable. | M | Jira keys and URLs inside artifacts |
| interactivity-29 | Inline unit conversion. | - | - |
| interactivity-30 | Tap an amount in a photo to convert it. | - | - |
| interactivity-31 | Search by intent, not keyword. | M | Command palette ("approve", "questions for me") |
| interactivity-32 | Interpret "tomorrow" against the human day. | - | - |
| interactivity-33 | Three-phase scroll anchoring in keyboard-driven lists. | M | Command palette |
| interactivity-34 | Keep the originating list row visible and highlighted. | H | Rail row for the open project |
| interactivity-35 | Highlight the table of contents by visibility, not last anchor. | H | Artifact viewer minimap |
| interactivity-36 | Reflect live status in the favicon. | H | Agent working / needs you |
| interactivity-37 | Serialize UI state into the URL. | H | Inspector tab, artifact, section; portfolio filters |
| interactivity-38 | Serve from the apex domain (Need confirm). | - | CloudFront default domain today |

## Design (11)

| Rule | Detail, paraphrased | Fit | Where |
|---|---|---|---|
| design-1 | Inner radius = outer radius minus padding. | H | Cards in cards, bento tiles |
| design-2 | Blur-test optical alignment. | M | Agent faces, icon-in-circle marks |
| design-3 | Inset ring instead of a border on images. | M | Avatars, illustrations |
| design-4 | Show alignment guides on hover; hide them on click. | M | Records tables |
| design-5 | Own the video player, not just its toolbar. | - | - |
| design-6 | Thin scrollbar that matches the surface. | M | Global |
| design-7 | Fade masks must not cover the scrollbar. | M | Thread, inspector |
| design-8 | Sync `theme-color` with the page background. | M | Light and dark themes |
| design-9 | Light and dark favicon variants. | M | Pairs with interactivity-36 |
| design-10 | Swap media per theme. | H | Every illustration ships light and dark |
| design-11 | PNG or JPEG for Open Graph images. | L | Links are behind Entra ID |

## Copywriting (14)

| Rule | Detail, paraphrased | Fit | Where |
|---|---|---|---|
| copywriting-1 | Name the object before asking for action. | H | Every button and prompt |
| copywriting-2 | One noun per concept. | H | [../vocabulary.md](../vocabulary.md) |
| copywriting-3 | The verb matches the mutation (create, add, remove, delete, revoke). | H | Delete project, send back, undo |
| copywriting-4 | Failures: what failed, why, then the recovery step last. | pass | `lib/errors.ts` mostly does this |
| copywriting-5 | Route permission denials to whoever can resolve them. | M | Future: "You are not the approver - ask Priya" |
| copywriting-6 | Prompts ask for one concrete concept. | H | Scout's questions |
| copywriting-7 | Status copy describes the current phase, not a promise. | H | Working states |
| copywriting-8 | Replace blame with the rule the value must satisfy. | M | Validation |
| copywriting-9 | Empty states name what is absent and the next action. | H | Home, inspector, portfolio |
| copywriting-10 | Cut filler and hype ("just", "seamlessly", "powerful"). | H | All copy |
| copywriting-11 | Write a real "What's new". | M | Release notes in the console |
| copywriting-12 | Human-readable IDs (`HD-042`) instead of UUIDs. | H | Project URLs and references |
| copywriting-13 | Tailor CTA copy to the moment. | L | - |
| copywriting-14 | Pluralize labels to match the count. | H | Enforce everywhere (several places already do) |

## Accessibility (13)

| Rule | Detail, paraphrased | Fit | Where |
|---|---|---|---|
| accessibility-1 | Visible focus ring on every focusable element. | pass | `:focus-visible` in `index.css` |
| accessibility-2 | Reduce animation on frequent features; honor reduced motion. | pass | Global reduced-motion rule exists |
| accessibility-3 | Links say what they do ("opens in new tab"). | M | GitHub pull request links |
| accessibility-4 | Email addresses clickable and copyable. | L | Signer email |
| accessibility-5 | Collapsed content findable with Cmd+F (`hidden="until-found"`). | H | Plan panel, tool trace, artifact sections |
| accessibility-6 | Bind shortcuts to the owning window. | L | - |
| accessibility-7 | 24px desktop / 44px touch targets. | H | Small icon buttons |
| accessibility-8 | Truncation keeps the meaningful parts. | H | File paths in tool rows |
| accessibility-9 | Single-key alternatives to chorded shortcuts. | M | Home, portfolio |
| accessibility-10 | Natural language as an accessible input path. | L | - |
| accessibility-11 | Link every label to its input. | pass | `Field.tsx` |
| accessibility-12 | Every interaction keyboard-reachable. | H | Especially the future canvas |
| accessibility-13 | Ignore Enter while an IME composition is active. | H | Landing and composer send on Enter without checking composition |

## Typography (7)

| Rule | Detail, paraphrased | Fit | Where |
|---|---|---|---|
| typography-1 | Trim the text box so chips center optically. | M | Badges, chips |
| typography-2 | Fade plus ellipsis on overflow. | M | Tabs, rail names |
| typography-3 | Truncate file paths from the middle. | H | Tool rows, build files |
| typography-4 | Respect brand capitalization (GitHub, macOS). | H | `lib/toolLabels.ts` already maps some; extend to Confluence, Snowflake |
| typography-5 | Brand the text selection. | pass | `::selection` uses the accent |
| typography-6 | Preview color strings inline. | - | - |
| typography-7 | Give generated documents real typography. | H | Artifact export |

## Easter egg (6)

Skip rule: never during recovery from a failure, urgent work, or high-stakes flows. Gates are
high-stakes.

| Rule | Detail, paraphrased | Fit | Where |
|---|---|---|---|
| easter-egg-1 | Turn 404 and error pages into a small moment. | H | Unknown routes silently render the landing page today |
| easter-egg-2 | Carry the active state into the footer nav. | - | No footer |
| easter-egg-3 | Reward explorers in overlooked corners. | M | Empty states, crew cards |
| easter-egg-4 | Hide a real, verifiable detail where people look closely. | M | Crew jersey numbers match their stage order |
| easter-egg-5 | Make throwaway tokens memorable. | H | Human-readable project IDs and share codes |
| easter-egg-6 | Semantic icons by name (Need confirm). | M | Artifact icons by kind |

## Newer site entries (not yet in the skill snapshot)

The site moves faster than the skill. Seen on 2026-09-28: *Smarter Word Break* (line breaking
that survives translation), *Human-generated em dash*, *Smart Corner Morph Animation*, and
*Photo response to theme mode*. Re-check the site when this file is next reviewed.
