<!-- Point-in-time research, retrieved 2026-10-25 for the UA-DLC plan. Claims carry source links; vendor features and dates change quickly, so verify before acting. See README.md in this folder. -->
<!-- cspell:words Azeret Baselayer Baselayer's Chivo Demi Firecrawl Gatti Giftcard Héctor Hintz Omagari Renner's Snackbars Tosche Toshi Typestyles baselayer capsizecss demi opsz rgba snackbars tnum wdth wght -->

# Applying UA Baselayer to HyperDelivery: tokens, type, layout and components for a dense internal app

> Phone layouts and the dark theme described here are out of scope since 2026-10-26: HyperDelivery targets desktop and laptop browsers, light theme only.

Key: `baselayer-for-hyperdelivery`. Researched 2026-10-25. Scope: how HyperDelivery, a data-dense internal web
app, applies **Baselayer**, Under Armour's web design system, which was built for e-commerce
(`00_UA_Baselayer_Library_Web`). It answers the owner's ask that the concept screens be on brand for Under Armour
and that something "ties it together" the way a polished platform does. It builds on
[ux-direction.md](../ux-direction.md) section 6, whose visual language was written when "UA's public brand is the
only source; no internal guidelines are available". Baselayer is that internal source, so several section 6 rules
change (section 10 lists them).

**Access notes.**

- **Skill.** The `baselayer-design-system` skill in the internal underarmour/ua-ai-marketplace repository
  (`plugins/design/skills/baselayer-design-system/`): `SKILL.md` and all five references (`foundations.md`,
  `components.md`, `primitives.md`, `rules-log.md`, `figma-workflow.md`), read in full. Its source precedence is: the
  user's latest feedback, then the rules log (R-001, R-002), then the Figma library, then foundations and components.
- **Figma captures.** Screenshots of the Token Reference frame (`9560:281`, light and dark), the Typography Roles frame
  (`12094:46250`) and the `Btn/Primary/Black` states. The typography captures are too small to read every specimen
  line, so type values come from the skill.
- **One Figma call.** `get_variable_defs` on the Token Reference frame returned 28 variables and text styles, including the neutral
  ramp (`Color/Primary/dark-100` to `light-100`), `Outline`, `Error`, `Success` and `accent orange`. It did **not**
  return the dark error and success values. I sampled those from the swatch pixels in the captured frame. They are
  marked "sampled" below and need confirming in Figma.
- **Production.** ua.com's live stylesheet (chunk `087rj-x2_xf30.css`), read through Firecrawl because the site
  returns HTTP 418 to plain clients.
- **Font metrics.** From [Capsize's metrics package](https://www.npmjs.com/package/@capsizecss/metrics) 4.4.0. Capsize
  measures `xWidthAvg` the same way Next.js sizes fallback fonts, so its width ratios compare directly with the
  `size-adjust` that ua.com publishes. I did not download or open any font file.
- **The canvas today.** I counted values across the 18 artboards in the concept canvas and looked at the rendered Home
  and Gate screenshots.

Labels used below: **(Figma)** a library value or capture, **(sampled)** a pixel read from a capture, **(skill)** the
Baselayer references, **(production)** ua.com, **(proposed)** my recommendation, which is not a published Baselayer
value and needs design review.

## 0. Decisions in brief

1. **Use Baselayer's role names in code** (`surface`, `surface-container`, `on-surface-variant`, `outline-variant`,
   `critical` and the rest), with HyperDelivery meanings as aliases on top (`--hd-decision: var(--color-critical)`).
   Then a Figma `get_variable_defs` result maps straight onto the console's CSS.
2. **Eight neutrals, no others.** `#1D1D1D`, `#444444`, `#5F5F5F`, `#949494` (never text), `#D0D0D0`, `#F0F0F0`,
   `#F9F9F9`, `#FFFFFF`, plus the published dark primitives `#282828` and `#151515`. This retires 63 near-neutral hex
   values on the canvas, along with `#e6e6e6`, `#8a8a8a` and the console's `#e4002b`, which is not UA red.
3. **Red is `critical`, and critical means waiting on you.** The red stays on markers, counts, one status capsule, and
   errors in a field the viewer is filling in. It never goes on a button, so a gate's commit action stays a black pill.
   Retire `danger`, `caution` and the status tints; Baselayer has no equivalent for them (section 3).
4. **Type.** Six UA Text sizes from the published scale (32, 24, 20, 16, 14, 12), two weights (400, 700), Title Case
   headings and labels, no ALL CAPS headings, no letter spacing, and no condensed widths. UA Technical appears only on
   tile-style badges.
5. **Google Fonts stand-ins.** Keep **Archivo** for UA Text: its average width is 0.987× Arial and ua.com's font is
   0.985×, the closest match of six candidates. Use it at normal width, 400 and 700 only. Use **Chivo Mono** for UA
   Technical and for mono identifiers: same foundry and designer as Archivo, with a true demi weight. Geist Mono is the
   fallback.
6. **Layout.** The 12-column 1440 grid with 24 px margins and 16 px gutters (101.3 px columns). Spacing is Baselayer's
   8 to 120 rhythm, with 4, 6, 10 and 12 px allowed only inside components (R-001).
7. **Shape.** Four radii: 4 px for controls, chips and badges; 8 px for cards and overlays (proposed); pills for
   buttons, capsules and avatars; 0 for media. Elevation uses Baselayer's two floating shadows. The focus ring goes
   back to `#0096FA`.
8. **Density.** Baselayer's 44 px controls stay for primary and gate actions. Add proposed compact 36 px and mini
   28 px sizes, 24 px object chips, 12/16 badges and three table densities (44, 36, 32), each flagged as a
   component-scoped proposal under the R-001 pattern.
9. **Icons.** Baselayer `ic` sizes only: 12, 16, 24, and 48 for empty states. One stroke set across canvas and console:
   Phosphor, already the console's accepted choice, drawn at a 1.5 px rendered stroke in `currentColor`.
10. **UA logo.** Leave it off the product chrome until Brand approves a lockup. Never redraw it. Brand review covers the
    lockup, the font license (including uploading UA Text to a published canvas), the red rule, the color extensions,
    dark-mode deviations and the dense sizes (section 9). Updated 2026-10-26: at the owner's ask, the concept screens
    now open the top bar with the UA logo lockup; production use still waits for Brand (section 11).

## 1. What Baselayer is built for, and what changes in a dense app

Baselayer serves storefront pages: PLP, PDP, cart, checkout, account and CMS modules (skill). It assumes large hero
type (Heading 4XL at 56/70), product tiles, 44 px CTAs, 32 to 40 px selection chips, a light theme first, and a few
states per screen. HyperDelivery is the opposite workload. Screens are dense and full of states (an inbox, gates,
traces, tables, an architecture canvas). Sessions run long, the app needs a dark theme and keyboard use, and one red
already has a product meaning.

Four principles for the adaptation:

1. **Bind, don't invent.** Use a published value wherever one exists. Where density needs a size Baselayer lacks, add
   it as a **component-scoped proposal**, the way R-001 already treats primitive insets, and list it for design review.
2. **Keep Baselayer's vocabulary.** Name tokens by Baselayer role and component (`Btn/Primary/Black`,
   `FormField/SB`), so a designer and an engineer read the same words.
3. **One semantic overlay.** HyperDelivery's only meaning layered on Baselayer is "red means waiting on you". Every
   other status uses Baselayer roles as published, or ink plus a glyph.
4. **Fewer values, consistently.** This is the missing "tie it together". Section 1.1 measures the gap.

### 1.1 What the canvas has today versus what Baselayer allows

| Dimension | Concept canvas today (18 artboards) | Baselayer for HyperDelivery |
|---|---|---|
| Font sizes | 30 distinct (7 px to 40 px; 145 uses of 11 px, 88 below 11 px) | 6 UA Text sizes plus a 12 px mono |
| Weights and widths | 400, 500, 600, 700, 800, 900; `font-stretch` 68 to 75% in 78 places | 400 and 700, normal width |
| Letter spacing | 129 declarations (`0.08em` 70 times) | none |
| Uppercase | 110 `text-transform: uppercase` | badges only (UA Technical stand-in) |
| Colors | 148 distinct hex values, 63 of them near-neutral grays | 8 neutrals, 2 dark primitives, 4 status values, focus blue, plus scoped extensions |
| Radii | 18 pixel values from 1 to 26 px, plus pill | 0, 4, 8, pill (plus 1 px checkbox and 16 px switch track, both measured) |
| Gaps | 23 distinct values (5, 7, 9, 14, 18, 26 px…) | 8, 16, 24, 32, 56 for layout; 4, 6, 10, 12 inside components |
| Control heights | about 12 (22, 26, 28, 30, 32, 34, 36, 38, 40, 44, 50) | 44, 36, 28 for controls; 32 for option rows and segments |

The owner's comments "not spaced or sized correctly" and "something missing that ties it together" both trace to this
table. Each screen is reasonable alone, but no two use the same set of values.

## 2. Color

### 2.1 Baselayer roles, light and dark

Values come from the Token Reference frame (`9560:281`). The frame labels swatches by palette name (black, gray 1 to
gray 6, white, red). The hex is from the Figma variables or the swatch pixels.

| Role | Purpose (Figma description, shortened) | Light | Dark | Evidence |
|---|---|---|---|---|
| `surface` | Default background | `#FFFFFF` | `#1D1D1D` | Figma; `Surface/surface` |
| `surface container` | Cards and containers | `#F9F9F9` (label "gray 1") | `#444444` | Figma label; the light swatch renders `#F0F0F0` (sampled), see 2.2 |
| `surface container high` | High-emphasis containers | `#F0F0F0` (label "gray 2") | `#5F5F5F` | Figma label and `Surface/surface-container-high`; the light swatch renders `#D0D0D0` (sampled) |
| `inverse surface` | Fills that contrast with surface | `#1D1D1D` | `#FFFFFF` | Figma |
| `on surface` | Text and icons on any surface | `#1D1D1D` (label "black"); `color/foreground/primary` is `#151515` | `#FFFFFF` | Figma, see 2.2 |
| `on surface variant` | Lower-emphasis text and icons | `#5F5F5F` (label "gray 5"; `color/foreground/secondary`) | `#D0D0D0` | Figma; the skill's `Surface/on-surface-var` says `#444444`, see 2.2 |
| `primary` / `on primary` | FAB, high-emphasis buttons, active states | `#1D1D1D` / `#FFFFFF` | `#FFFFFF` / `#1D1D1D` | Figma |
| `secondary` / `on secondary` | Less prominent fills | `#FFFFFF` / `#1D1D1D` | `#1D1D1D` / `#FFFFFF` | Figma |
| `tertiary` / `on tertiary` | Contrasting accents "such as filter chips" | `#F9F9F9` / `#1D1D1D` | `#444444` / `#FFFFFF` | Figma |
| `critical` / `on critical` | High-emphasis attention: Add to Bag, Checkout, Place Order | `#DC0019` / `#FFFFFF` | `#DC0019` / `#FFFFFF` | Figma |
| `outline` | Important boundaries such as a button or text field outline | `#151515` | `#FFFFFF` | Figma swatch; a separate `Outline` variable is `#5F5F5F`, see 2.2 |
| `outline variant` | Decorative elements and dividers, "when other elements provide 4.5:1 contrast" | `#D0D0D0` | `#5F5F5F` | Figma |
| `button/disabled` | Disabled state for every button type | `#D0D0D0` (`light-60`) | `#5F5F5F` (`dark-40`) | Figma variables |
| `status/error` / `on error` | Error states, such as a wrong password | `#DC0019` / `#FFFFFF` | `#FF2A29` / `#FFFFFF` | Figma; dark value sampled ("accent red (dark)") |
| `status/success` / `on success` | Positive indicators in text and icons | `#00834B` / `#FFFFFF` | `#00AA52` / `#FFFFFF` | Figma; dark value sampled ("accent green (dark)") |
| `status/accent` | Feature tags such as "NEW"; never sentences or important text | `#FE9000` | `#FE9000` | Figma `Color/Secondary/accent orange` |
| Focus | Keyboard focus stroke | `#0096FA`, glow `#14A1FF` blur 4 spread 2 | same | skill (`826:17638`) |
| `color/stroke/tertiary` | Subtle dividers (product grid, PDP list items) | `#F0F0F0` | not published | skill |

Published neutral primitives that the roles draw on (Figma): `dark-100` `#151515`, `dark-80` `#1D1D1D`, `dark-60`
`#282828`, `dark-40` `#5F5F5F`, `light-60` `#D0D0D0`, `light-80` `#F0F0F0`, `light-100` `#FFFFFF`. The "fixed" roles
(`primary fixed` and the rest) are meant to stay constant across themes, but the frame shows several swapping between
light and dark. HyperDelivery does not need them.

### 2.2 Conflicts inside Baselayer to raise with design

Per the skill's rule ("don't pick one silently"), these are open, with the value I would use until design answers.

| Conflict | Values | Use until confirmed |
|---|---|---|
| `on surface variant` | Frame label and `color/foreground/secondary` say `#5F5F5F`; the skill's `Surface/on-surface-var` says `#444444` | `#5F5F5F` for secondary text (6.39:1 on white). `#444444` stays available for body text that needs AAA |
| `surface container` and `surface container high` light fills | Labels say gray 1 / gray 2 (`#F9F9F9` / `#F0F0F0`); the swatch fills render one step darker (`#F0F0F0` / `#D0D0D0`) | Labels and the published variable: `#F9F9F9` / `#F0F0F0` |
| `on surface` black | `#1D1D1D` (Black, `Surface/on-surface`) versus `#151515` (`color/foreground/primary`, `dark-100`) | `#1D1D1D` everywhere, so there is one black |
| `outline` | Swatch `#151515`; variable `Outline` `#5F5F5F`; `color/stroke/secondary` `#D0D0D0` is "default strokes and outlines" | `#1D1D1D` for button and selected boundaries; `#5F5F5F` for form-field strokes at rest (section 7.3) |
| `on success` in dark | White on `#00AA52` is 3.06:1, which fails AA for text | Dark success as text or icon only, or `#1D1D1D` on `#00AA52` (5.52:1) |
| `on error` swatches | Labeled "accent red" but filled white | White, matching `on critical` |
| Green | Swatch hex `#00834B` versus RGB label 0, 136, 80 (`#008850`), I-001 | `#00834B` (the variable) |

### 2.3 How HyperDelivery applies the roles

| HyperDelivery use | Role | Light | Dark |
|---|---|---|---|
| Page background, main work area | `surface` | `#FFFFFF` | `#1D1D1D` |
| Side rails, assistant rail, table toolbar band, page header band | `surface container` | `#F9F9F9` | `#282828` (proposed: published `dark-60`; the role's `#444444` is too heavy for large areas) |
| Cards and panels on the page | `surface` plus a 1px `outline variant` ring | `#FFFFFF`, `#D0D0D0` | `#1D1D1D`, `#5F5F5F` |
| Hover, selected row, read-only field, provenance bar, chrome selected item | `surface container high` | `#F0F0F0` | `#444444` (proposed: on the role's `#5F5F5F`, `#D0D0D0` text falls to 4.15:1) |
| Object chip and filter chip fill | `tertiary` | `#F9F9F9` | `#444444` |
| Text and icons | `on surface` | `#1D1D1D` | `#FFFFFF` |
| Secondary text, metadata, table headers, placeholders | `on surface variant` | `#5F5F5F` | `#D0D0D0` |
| Primary button | `primary` / `on primary` | `#1D1D1D` / `#FFFFFF` | `#FFFFFF` / `#1D1D1D` |
| Secondary button | `secondary` plus `outline` | `#FFFFFF`, 1px `#1D1D1D` | `#1D1D1D`, 1px `#FFFFFF` |
| Disabled button | `button/disabled` | `#D0D0D0` | `#5F5F5F` |
| Card rings, chip rings, group dividers | `outline variant` | `#D0D0D0` | `#5F5F5F` |
| Row dividers inside tables and lists | `color/stroke/tertiary` | `#F0F0F0` | `#444444` (proposed) |
| Form-field stroke at rest | `Outline` variable | `#5F5F5F` | `#949494` (proposed; 5.56:1 on `#1D1D1D`) |
| Snackbar, tooltip | `inverse surface` | `#1D1D1D` with white text | `#FFFFFF` with `#1D1D1D` text |
| Waiting on you: fills (marker, count, capsule) | `critical` / `on critical` | `#DC0019` / `#FFFFFF` | `#DC0019` / `#FFFFFF` |
| Waiting on you: text and thin strokes; field errors | `status/error` | `#DC0019` | `#FF2A29` (sampled) |
| Done, passed, live | `status/success` | `#00834B` | `#00AA52` (sampled) |
| "New" badge; provenance bar's 2px rule | `status/accent` | `#FE9000` with `#1D1D1D` text | same |
| Keyboard focus | focus | `#0096FA` | `#0096FA` |

### 2.4 Mapping today's tokens

Three token sets exist today: the v3 tokens in [ux-direction.md](../ux-direction.md), the shipping console's
`ui/console/src/index.css`, and the canvas's literal values.

| Today (ux-direction v3, light / dark) | Console `index.css` | Becomes | Note |
|---|---|---|---|
| `ink` `#1d1d1d` / `#f4f4f4` | `--color-fg` `#101010` / `#f5f5f6` | `on surface` `#1D1D1D` / `#FFFFFF` | Baselayer dark text is white, not `#f4f4f4` |
| `canvas` `#ffffff` / `#121212` | `--color-canvas` `#fafafa` / `#0d0d0f` | `surface` `#FFFFFF` / `#1D1D1D` | |
| `surface` `#f9f9f9` / `#1b1b1b` | `--color-surface` `#ffffff` | `surface container` `#F9F9F9` / `#282828` | Names swap: today's "surface" is Baselayer's "surface container" |
| `field` `#f0f0f0` / `#232323` | `--color-sunken` `#f1f1f2` | `surface container high` `#F0F0F0` / `#444444`; chips use `tertiary` | |
| `line` `#e6e6e6` / `#2c2c2c` | `--color-line` `#dcdce0`, `--color-line-subtle` `#eaeaec` | `outline variant` `#D0D0D0` for rings; `stroke/tertiary` `#F0F0F0` for row dividers | `#e6e6e6` is the canvas's second most used color (261 uses) and is not a UA value |
| `control-border` `#8a8a8a` / `#6b6b6b` | `--color-line-strong` `#c2c2c8` | `#5F5F5F` / `#949494` | |
| `muted` `#5f5f5f` / `#a3a3a3` | `--color-fg-muted` `#5a5a5e`, `--color-fg-subtle` `#6a6a6f` | `on surface variant` `#5F5F5F` / `#D0D0D0` | Retire the third text tier; Baselayer has two |
| `focus`: ink with a 2px offset | (red ring today) | `#0096FA` | Skill core rule 8: "Keep the #0096FA focus ring" |
| `decision` `#dc0019` / `#ff3b3f` | `--color-accent` and `--color-ua-red` `#e4002b` | `critical` `#DC0019`; dark text `#FF2A29` | `#e4002b` is not UA red. `--color-accent-text` `#c2001f` is no longer needed: `#DC0019` is 5.18:1 on white |
| `on-decision` `#ffffff` / `#121212` | `--color-fg-on-accent` | `on critical` `#FFFFFF` in both themes | |
| `decision-tint` `#fdecee` | `--color-accent-bg` | Retire | The solid marker carries the meaning; a pink halo dilutes it |
| `danger` `#8e1b12` / `#ff8a80` | `--color-danger` `#b3261e` | Retire (section 3) | No Baselayer role; a second red competes with `critical` |
| `success` `#00834b` / `#4cc38a` | `--color-success` `#0e7a4d` | `status/success` `#00834B` / `#00AA52` | |
| `success-tint` `#e6f4ed` | `--color-success-bg` | Retire | Green text or icon on surface |
| `caution` `#8a5a00` / `#f0b44c` | `--color-warning` `#8a5a00` | Retire as a status color | "Waiting long" becomes a bold age plus a clock glyph in ink |
| `caution-tint` `#fff4e0` | `--color-warning-bg` | `surface container high` with a 2px `status/accent` rule | The provenance bar |
| `selected` `#f5f7ff` / `#1f202b` | none | `surface container high` `#F0F0F0` / `#444444` | No blue tint |
| none | `--color-info` `#1a5fb4` | Retire | Baselayer has no info blue, and `#0096FA` is stroke only |
| Crew hues (`distill`, `blueprint`, `review`, `showroom`) | in `index.css` | Agent-hue extension (2.5) | Layers 2 and 3 only |

### 2.5 Colors outside Baselayer that HyperDelivery keeps

The owner liked the round-three color. Most of it can stay, but as **scoped extensions**, not as Baselayer tokens:

- **Brand marks** on tool, resource, model and system chips. Each keeps its own color, and chips stay neutral. This is
  already where most on-screen color comes from.
- **Agent hues** (indigo, teal, sky, violet, steel, plus the Atlassian and Microsoft brand blues) on trace bars, lanes,
  delegation cards and architecture zones, in Layers 2 and 3 only. Name them `--hd-agent-*` so nobody mistakes them
  for Baselayer.
- **Data palette.** Baselayer has none, which is a library gap. Single-series charts and table micro-visuals should use
  the neutral ramp (`#1D1D1D`, `#5F5F5F`, `#949494`, `#D0D0D0`), which is unmistakably UA. Multi-series charts use the
  categorical extension from ux-direction. Never red in charts.
- **Avatar fills** from the deep categorical set, with white initials.
- **Not used:** Baselayer's campaign colors (Neon Green `#64DC00`, Neon Orange `#FF682C`, HeatGear Elite `#FF2B1C`, SAE
  Neon Green `#D9FF0D`, DSG Green `#006554`). The skill reserves them for briefs that call for them, and an internal
  tool has none.

### 2.6 Contrast of the pairs that matter

WCAG 2.2 ratios, computed:

| Pair | Ratio | Use |
|---|---|---|
| `#1D1D1D` on `#FFFFFF` / `#F9F9F9` / `#F0F0F0` | 16.86 / 16.01 / 14.79 | Body text |
| `#5F5F5F` on `#FFFFFF` / `#F9F9F9` / `#F0F0F0` | 6.39 / 6.07 / 5.60 | Secondary text, field strokes |
| `#949494` on `#FFFFFF` | 3.03 | Never text (skill rule) |
| `#D0D0D0` on `#FFFFFF` | 1.54 | Decorative only, so not a form-field stroke |
| `#DC0019` on `#FFFFFF`; white on `#DC0019` | 5.18; 5.18 | Red text, red capsule |
| `#00834B` on `#FFFFFF` | 4.83 | Success text |
| `#FE9000` on `#FFFFFF`; `#1D1D1D` on `#FE9000` | 2.28; 7.39 | Never orange text; ink on an orange badge |
| `#0096FA` on `#FFFFFF` / `#F9F9F9` / `#1D1D1D` | 3.11 / 2.96 / 5.41 | Focus ring (section 6.3) |
| `#D0D0D0` on `#1D1D1D` / `#282828` / `#444444` | 10.93 / 9.56 / 6.31 | Dark secondary text |
| `#FF2A29` on `#1D1D1D` / `#282828` | 4.51 / 3.94 | Dark red text only on `#1D1D1D` |
| `#DC0019` on `#1D1D1D` | 3.26 | Red fills in dark are fine; red text in `#DC0019` is not |
| `#00AA52` on `#1D1D1D`; white on `#00AA52` | 5.52; 3.06 | Dark success as text, not as a white-on-green fill |
| `#949494` on `#1D1D1D` | 5.56 | Dark form-field stroke |

## 3. Red: a proposed rule that honors both Baselayer and "waiting on you"

Baselayer gives `#DC0019` two jobs: `critical` (transaction buttons such as Place Order) and `status/error` (a wrong
password). HyperDelivery reserves the same red for "waiting on you". These fit together better than they first look.
`critical` is defined as "high emphasis attention", and a field error is literally waiting on the person typing.
The one real collision is the red button.

**Proposed rule HD-R1 · Red is `critical`, and critical means waiting on the viewer**

- **Scope:** Global (HyperDelivery). **Type:** Rule.
- **Allowed:**
  1. A solid "waiting on you" marker: the 8 px square in an Inbox row, or the notch on the line.
  2. The Inbox count, as a pill with a white tabular numeral.
  3. One filled status capsule per view region, "Your Approval" or "Your Turn": white text on `#DC0019`.
  4. Errors in a form field the viewer is filling in, following `FormField/SB` (red stroke, red 12/20 message, icon).
     Fixing the field is waiting on the viewer.
  5. Red text such as "Waiting on You", only where it names the viewer.
- **Not allowed:** buttons, charts, deltas, diff deletions, links, selection, focus, avatars, destructive actions,
  decoration, brand moments, and failures the platform handles itself.
- **Buttons:** HyperDelivery does not use `Btn/Tertiary/Red-Critical`. A gate's commit ("Sign and Accept") is
  `Btn/Primary/Black`, with "Send Back" beside it as a secondary. A red commit would make approving the visually
  favored answer over sending back, which erodes the human decision the gates exist for. It would also put two reds on
  one screen. Destructive actions (revoke access, archive) use a secondary button and a confirmation that states the
  consequence.
- **Failures:** a system failure the platform will retry or report shows as ink, an X glyph and plain words with the
  next step ("Build failed at step 4 · Retry from This Step"). When the failure needs the viewer to decide (retry,
  stop, or tell the platform team), it gains the red marker, because now it is waiting on them. This replaces the
  `danger` token.
- **Other people's waits:** ink plus age ("Waiting on Dana in Finance · 2d"). After two business days in their time
  zone, the age turns bold and gains a clock glyph. There is no amber text and no red unless the viewer is the one
  being waited on.
- **Dark theme:** fills stay `#DC0019` with white text (5.18:1). Red text and thin strokes use `#FF2A29`, and only on
  `#1D1D1D` (4.51:1). On any lighter container, use the filled capsule instead of red text.
- **Test:** hide everything on the screen except red. Each remaining red element must answer "what do I need to do?"
- **Why:** Baselayer's `critical` already means high-emphasis attention, so this narrows its use without inventing a
  token. Keeping red off buttons protects the gates.
- **Status:** Proposed. Brand review should confirm that `critical` may mark attention rather than a transaction CTA in
  an internal tool.

## 4. Typography

### 4.1 How production uses UA type

From ua.com's live stylesheet, retrieved 2026-10-25 (production):

- The site self-hosts two families through Next.js `next/font/local`. `NeuePlakUA` (400, 600, 700, and `CompBlack` at
  800 to 900) is exposed as `--font-base`. `NeuePlakUAText` (400, 600, 700) is exposed as `--font-text`. Both are set
  as CSS variables on `<body>`.
- `NeuePlakUAText` 400 points at the **same file** as `NeuePlakUA` Regular. Only the Text SemiBold and Bold are separate
  cuts.
- Fonts use `font-display: swap`, and NeuePlakUA Regular, SemiBold, Bold and CompBlack are preloaded.
- The fallback is metric-matched Arial: `size-adjust: 98.54%`, `ascent-override: 104.93%`,
  `descent-override: 24.96%`, `line-gap-override: 0%`. The stack is
  `"NeuePlakUAText", "NeuePlakUAText Fallback", ARMOUR, Helvetica, Arial, sans-serif`, so a proprietary face called
  ARMOUR also exists. These overrides tell us the face's proportions: its average character width is about 0.985×
  Arial's, and its line box (ascent plus descent) is about 1.28 em.
- UA Technical is not loaded on the home page.

**What "UA Text" is (inference).** Baselayer calls its primary face "UA Text" and labels the legacy styles "Neue Plak
UA". The Token Reference frame's own table text uses a style whose family is "Neue Plak UA Text" (Figma variables).
So "UA Text" is most likely the Baselayer name for the Neue Plak UA Text family that production serves as
`NeuePlakUAText`, a cut of Monotype's 2018 Neue Plak by Linda Hintz and Toshi Omagari. Toshi Omagari calls Paul
Renner's 1928 Plak a "mechanical grotesque" ([Tosche](https://tosche.net/fonts/neue-plak)). Confirm with Brand.
Production loads a 600 weight, but Baselayer specifies Regular and Bold for new work and says not to assume a 600, so
HyperDelivery uses two weights.

**Licensing.** If Brand allows internal tools to use UA Text, the console should self-host it the way ua.com does:
`@font-face` with WOFF2, `font-display: swap`, Regular and Bold preloaded, and an Arial fallback using UA's own
overrides above, so nothing shifts on load. **Do not upload UA fonts to a published canvas** without that approval;
a published artifact redistributes the files. Until then, the canvas uses the Google Fonts stand-ins in 4.5 and 4.6.

### 4.2 The type scale, adapted for app density

Six UA Text sizes from Baselayer's published styles, which is the round-three median of "six sizes per screen". Two
weights. Everything else on the canvas collapses into these.

| HyperDelivery role | Baselayer style | Size / line height (px) | Weight | Case | Canvas stand-in |
|---|---|---|---|---|---|
| Moment title (First Run, Gate, Graduation), once per page | Heading XL | 32 / 40 | Bold | Title Case | Archivo 700 |
| Page title | Heading LG | 24 / 30 | Bold | Title Case | Archivo 700 |
| Section heading | Heading MD | 20 / 24 | Bold | Title Case | Archivo 700 |
| Card title, dialog title, rail heading | Heading SM | 16 / 20 | Bold | Title Case | Archivo 700 |
| Small heading (replaces every ALL CAPS eyebrow) | Heading XS | 14 / 18 | Bold | Title Case | Archivo 700 |
| Reading body: briefs, plans, assistant messages, any paragraph over two lines | Body MD | 16 / 24 | Regular | Sentence | Archivo 400 |
| Dense body: list rows, table cells, card text | Body SM | 14 / 20 | Regular, Bold for emphasis | Sentence | Archivo 400 / 700 |
| Small: metadata, helper text, timestamps | Body XS | 12 / 18 | Regular | Sentence | Archivo 400 |
| Button label | primary CTA metric (R-001) | 14 / 20 | Bold | Title Case | Archivo 700 |
| Nav items, tabs, field labels, menu items | Label SM | 14 / 18 | Regular; Bold when selected | Title Case | Archivo |
| Chip text, table headers, small labels | Label XS | 12 / 15 | Regular; Bold for headers | Title Case for UI labels; data as written | Archivo |
| Durations and counts that change ("1d 4h", "14 of 18") | the surrounding style | same | Bold where it is the point | n/a | Archivo, `tabular-nums` |
| Mono identifiers (Jira keys, SHAs, query ids, paths) | none (library gap) | 12 / 16 | Regular | As written | Chivo Mono 400 |
| Tile-style badge (tier, "New", metric type) | Label LG / XL Technical exist at 20 and 24 px; proposed dense size | 12 / 16 | Demi (600) | ALL CAPS | Chivo Mono 600 |

Notes:

- **No text below 12 px.** The canvas has 88 uses below 11 px and 145 at 11 px, mostly in diagrams and micro-visuals.
  If a diagram cannot carry 12 px labels, move the label into a hover card.
- **Leading.** Baselayer says body leading should be at least 1.5×, but its own Body SM is 14/20 (1.43×) and its
  Labels are 1.25×. Use the published styles as written, and use Body MD 16/24 for running paragraphs so the 1.5× rule
  holds where it matters.
- **Reading measure.** Cap running text at 5 columns (571 px, about 80 characters of 16 px text).
- **Tabular figures** (`font-variant-numeric: tabular-nums`) on every number that changes. I could not confirm
  Archivo's `tnum` support without opening the font, so check it in a browser specimen. If it is missing, set
  changing numbers in the mono.
- **Weights.** 400 and 700 only. Retire 500, 600, 800 and 900 on the canvas, and every `font-stretch`.

### 4.3 Case, caps and spacing rules

- **Title Case** (skill rule 4, foundations 1.5) applies to the UI's own words: page, section and card headings,
  buttons, tabs, nav, menu items, field labels, column headers, dialog titles and status labels. Lowercase articles (a,
  an, the), coordinating conjunctions (and, but, for, or, nor, yet, so) and prepositions of three letters or fewer (at,
  by, for, in, of, on, to, up, via), unless first or last. Capitalize the first word after a colon. Acronyms and
  identifiers keep their form (SKU, UA, T1, AC-1).
- **Sentence case** applies to content: body text, helper and error messages, status sentences, toasts, questions a
  person or agent asked, and anything a person typed. User-typed names show as typed; the Start flow can suggest Title
  Case when someone names a project.
- **Converted from the canvas:** "Needs You", "My Projects", "Shipped Across UA This Week", "New in the Library",
  "Your Approval: The Plan", "Accept the Working Prototype", "Evidence, Criterion by Criterion", "Who Signs, in
  Order", "What This Prototype Skips", "Advice From Checks", "Exactly What You Sign", "Review and Sign", "Sign and
  Accept", "Send Back", "Ask Someone", "Start a Project", "See the Whole Inbox", "Waiting on You", "Partly Met". A
  question card stays sentence case: "Which level counts as one style for duplicate checks?"
- **No ALL CAPS headings.** The eyebrows ("OPEN ITEMS", "WHO SIGNS, IN ORDER", the red "YOUR APPROVAL: …") become
  Heading XS 14/18 Bold in Title Case. The red one becomes the filled capsule from section 3. Baselayer allows ALL CAPS
  only on secondary Labels and UA Technical; HyperDelivery uses it only on badges.
- **No manual letter spacing.** Remove all 129 declarations, including the `-0.01em` on headings. Archivo's default
  spacing is designed in, and so is UA Text's ("the typefaces ship with correct kerning").
- **No condensed widths.** Round three used Archivo at `wdth` 68 to 75 in uppercase for the wordmark, gate labels,
  status capsule and split times. That imitates NeuePlakUA CompBlack, UA's display cut, and breaks the no-caps rule.
  Badges move to the mono, durations to tabular UA Text Bold, and the wordmark is a Brand question (section 9).
- **This reverses two round-three copy rules:** ux-direction section 6 ("every heading and project name is sentence
  case", "condensed uppercase … for strings of three words or fewer") and the canvas brief's "Sentence case". Log the
  change as a decision.

### 4.4 Google Fonts stand-in for UA Text

The criteria, in order:

1. **Width parity** with UA Text (about 0.985× Arial), so copy that fits on the canvas fits when UA Text is licensed.
2. **Category:** a mechanical or technical grotesque, Plak's lineage.
3. **Density:** a generous x-height, sound Regular and Bold at 12 to 16 px, and tabular figures.
4. **No borrowed identity:** not another company's brand face, and not the generic SaaS default.

Metrics are from Capsize. Width is the frequency-weighted average character width relative to Arial; UA's is 0.985.

| Candidate | Avg width vs Arial | x-height / em | Cap / em | x / cap | Google Fonts axes | Lineage and feel | Verdict |
|---|---|---|---|---|---|---|---|
| **Archivo** (today) | **0.987** | 0.526 | 0.686 | **0.767** | wght 100–900, wdth 62–125 | Grotesque "originally designed for highlights and headlines", late-19th-century American gothic roots, "crafted for high performance typography". Firm, slightly square, athletic at Bold | **Keep.** Closest width match by far; the largest x-to-cap ratio of the set, which suits dense UI; one variable file |
| Barlow | 0.967 | 0.506 | 0.700 | 0.723 | 9 static weights; Semi Condensed and Condensed are separate families | "Slightly rounded, low-contrast grotesk" from California plates and highway signs; DIN-like and mechanical | Runner-up if Brand wants a more mechanical read. The rounded corners soften UA's precision, and it is 2% narrower |
| Sofia Sans | 0.965 | 0.488 | 0.655 | 0.745 | wght 1–1000; four widths as families | "Early-twentieth-century … technical sans serifs": Plak's own era, vertical, tense curves, soft corners | Closest in lineage, but small on the em: it needs about 1 px more per size, which breaks the Baselayer sizes |
| Encode Sans | 0.991 | 0.540 | 0.740 | 0.730 | wght, wdth 75–125 | Humanist-geometric hybrid, "warmth and practicality", open apertures | Good metrics, wrong temperature: friendlier than a mechanical grotesque |
| Roboto Flex | 0.995 | 0.514 | 0.711 | 0.723 | 13 axes including wdth 25–151 and opsz | Roboto's mechanical skeleton with every parameter exposed | Capable, but reads as the Android and Google default, and the payload is heavy |
| Inter (control) | 1.071 | 0.546 | 0.728 | 0.750 | wght, opsz | Screen-first neo-grotesque, the default SaaS face | Reject. About 9% wider than UA Text, so copy reflows when UA Text arrives; also the look the owner is trying to leave |

**Recommendation:** keep Archivo, at `wdth` 100 and weights 400 and 700 only. Request only those weights from Google
Fonts instead of today's full `wdth 62..125, wght 100..900` range. Vertically, UA's line box is about 1.28 em against
Archivo's 1.09 em, so at 14/20 UA Text's baseline sits about 0.8 px lower. If UA Text is licensed, check optical
centering in 44 px buttons and 24 px chips when swapping.

### 4.5 Google Fonts stand-in for UA Technical

UA Technical is a "Demi Mono" used ALL CAPS for snipes, athlete tags and product-tile badges (skill). HyperDelivery has
two mono jobs: tile-style badges (UA Technical's role) and identifiers (a code role Baselayer does not cover). One
family should do both.

| Candidate | x-height / em | Weights | Feel | Verdict |
|---|---|---|---|---|
| **Chivo Mono** | 0.511 | 100–900, including 600 | Neo-grotesque mono from Omnibus-Type by Héctor Gatti, Archivo's designer | **Recommend.** Shares Archivo's construction and has a true demi weight for the "Demi Mono" role |
| Geist Mono (today) | 0.530 | 100–900 | Clean UI and code mono; Vercel's identity face | Fallback. No migration, but it borrows another company's voice |
| JetBrains Mono | 0.550 | 100–800 | Code-editor mono, tallest x-height of the set | Strong for identifiers, too "IDE" for badges |
| Martian Mono | 0.600 (cap 0.800) | 100–800, wdth 75–112.5 | "Brutal and eye-catching" grotesk mono | Closest to snipe energy, but too loud at 12 px in dense rows |
| IBM Plex Mono | 0.516 | 100–700 | IBM's corporate typeface | Reject: another company's brand |
| DM Mono | 0.496 | 300, 400, 500 | DeepMind's mono | Reject: no demi weight |
| Azeret Mono | 0.544 | 100–900 | OCR and operating-system character, about 8% wider than the others | Not needed |

Before switching, check 0 versus O and 1 versus l versus I at 12 px in Chivo Mono. Hashes and Jira keys depend on it.
If it fails, keep Geist Mono for both jobs.

### 4.6 Loading on the canvas

One request, two families, four styles:
`https://fonts.googleapis.com/css2?family=Archivo:wght@400;700&family=Chivo+Mono:wght@400;600&display=swap`. Stacks:
`'Archivo', Arial, sans-serif` and `'Chivo Mono', ui-monospace, monospace`. In the console, swap to UA Text with
UA's fallback overrides once Brand approves (4.1).

## 5. Spacing and grid

### 5.1 Spacing

Baselayer's scale governs layout rhythm. R-001 allows measured insets inside components without making them global
tokens.

| Value (px) | Baselayer name | HyperDelivery use |
|---|---|---|
| 4 | `size-3xs` in Figma (open question I-002); component-scoped | Icon to text inside chips, badge padding |
| 6 | component-scoped (segmented control, measured) | Gaps between chips in a row, segmented control vertical padding |
| 8 | 2XS | Icon gap in buttons, between adjacent buttons, list-item internals |
| 10, 12 | component-scoped (input and CTA insets, measured) | Input vertical inset (10); table cell horizontal padding (12) |
| 16 | XS | Gutter, dense card padding, control side insets, between stacked fields |
| 24 | SM | Page margin, comfortable card padding, between related groups |
| 32 | MD | Page header to content, between card groups |
| 56 | LG | Between major page sections |
| 64, 80 | XL, 2XL | Empty states, First Run |
| 120 | 3XL | Not used inside the app |

Retire 2, 3, 5, 7, 9, 14, 18, 20, 26 and 28 px as layout gaps; the canvas uses all of them. Heights such as 44 px are
control geometry, not spacing tokens.

### 5.2 The grid in app layouts

Desktop 1440: 12 columns, 24 px margins, 16 px gutters, so each column is (1440 − 48 − 176) / 12 = **101.3 px**.
A span of *n* columns measures *n* × 101.33 + (*n* − 1) × 16:

| Columns | 2 | 3 | 4 | 5 | 6 | 8 | 9 | 12 |
|---|---|---|---|---|---|---|---|---|
| Width (px) | 218.7 | **336** | 453.3 | 570.7 | 688 | 922.7 | 1040 | 1392 |

A 3-column span is exactly the 336 px sample width of Baselayer's `FormField/SB` and dropdown, a sign the library was
drawn on this grid.

| Screen | Spans | Notes |
|---|---|---|
| App header | Full width, content inside the 24 px margins | 56 px tall (an LG step; `Navigation - Top` was not inspected). Today's header sits on a 32 px margin and the page body on 100 px; both move to 24 |
| Home (Needs You plus rail) | 8 + 4 | 922.7 main, 453.3 rail |
| Gate | 8 + 4 | Evidence in 8, a sticky sign panel in 4 |
| Project, step by step | 3 + 6 + 3 | Line and steps, work, assistant rail. With the assistant collapsed: 3 + 9 |
| SKU workbench and other tables | 12 | Optional 4-column detail drawer over the table |
| Library, Portfolio | 3-up at 4 columns, or 4-up at 3 | Cards 453.3 or 336 wide |
| Admin and settings | 2 + 8 (2 empty) | Fields span 4 or 6 columns |
| Architecture canvas | 12, full bleed | 3-column details panel over the canvas |

Columns are fluid above 1440, so tables fill the width while reading surfaces keep their 5-column cap. Tablet (767):
8 columns, 16 px margins and gutters (77.9 px columns). Mobile (479; mockups at 393 or 360): 4 columns, 16 px margins
and gutters. Mobile is first-class, not a scaled-down desktop (skill).

## 6. Shape, elevation and focus

### 6.1 Radii

| Radius | Use | Source |
|---|---|---|
| 0 | Media inside cards (clipped by the card), table cells, full-bleed previews | (proposed) |
| 1 px | Checkbox mark | measured (skill) |
| 4 px | Inputs, dropdown triggers, option rows, dropdown panel bottom corners, segmented control, object chips, badges, logo tiles, tooltips, code blocks | measured on SB controls (skill) |
| 8 px | Cards, panels, popovers, menus, dialogs, preview frames | (proposed). The Cards page (`10035:11263`) was not inspected, so confirm there |
| 16 px | Switch track | measured (skill) |
| Pill | Every button hierarchy, icon buttons (circles), the status capsule, the Inbox count, avatars | `Btn/Primary/Black` capture |

Retire 2, 3, 5, 6, 7, 9 to 15, 18 and 26 px. The canvas uses all of them.

### 6.2 Elevation

Baselayer publishes two effects, both `#1D1D1D` at 15% with offset 0 0: `Floating Button/Medium` (blur 4) and
`Floating Button/Large` (blur 10).

| Level | Use | Light | Dark |
|---|---|---|---|
| Flat | Page, cards, tables | No shadow; a 1px `outline variant` ring where a card needs an edge | No shadow; a surface step (`#1D1D1D` to `#282828`) or a `#5F5F5F` ring |
| Medium | Tooltips, sticky table headers while scrolled, floating buttons | `0 0 4px rgba(29,29,29,.15)` | `#5F5F5F` ring |
| Large | Menus, popovers, dropdown panels, dialogs, snackbars | `0 0 10px rgba(29,29,29,.15)` plus a 1px `#D0D0D0` ring | `#5F5F5F` ring on a `#282828` surface |

A dialog scrim needs a value Baselayer does not publish (proposed: `#1D1D1D` at 40%).

### 6.3 Focus ring

Baselayer: a `#0096FA` stroke "when a keyboard user is detected", with the `Focus Button State/Default` glow (`#14A1FF`,
blur 4, spread 2). The primary button capture shows exactly this. Spec:

- Use `:focus-visible` only. 2px `#0096FA` outline at a 2px offset, plus the Figma glow where the component has it.
- On white the ring is 3.11:1, but on `#F9F9F9` it is 2.96:1. On containers, draw a white separator first:
  `box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #0096FA`. In dark, `#0096FA` on `#1D1D1D` is 5.41:1 and needs no separator.
- Inputs get the ring plus a `#1D1D1D` stroke. Table rows and list items get an inset ring (`outline-offset: -2px`).
- This replaces ux-direction's ink focus ring, and the console's red one.

## 7. Components

### 7.1 Buttons

| HyperDelivery role | Baselayer component | Light | Dark | Examples |
|---|---|---|---|---|
| Primary, one per view region | `Btn/Primary/Black` (`101:28334`); `Btn/Primary/White` (`101:28336`) on dark | `#1D1D1D` fill, white label; disabled `#D0D0D0` | white fill, `#1D1D1D` label; disabled `#5F5F5F` | Review and Sign, Sign and Accept, Start a Project |
| Secondary | `Btn/Secondary/Black FINAL` (`104:28436`); White (`104:28437`) | white fill, 1px `#1D1D1D`, `#1D1D1D` label | `#1D1D1D` fill, 1px white, white label | Send Back, Request Changes, answer options ("Style", "Style-color") |
| Tertiary / critical | `Btn/Tertiary/Red-Critical` (`104:28438`): `#DC0019`, hover `#E93E51`, pressed `#E6152D`, disabled `#FAB2BA` | not used | not used | none (section 3) |
| Text link | `Btn/TextLink/General` (`746:16698`); `Btn/TextLink/Nav` (`158:10058`) for nav | ink, underlined, 12, 14 or 16 px only | white, underlined | See the Whole Inbox, Ask Someone, Reassign |
| Success | the primary's Success state ("Added ✓"); `Btn/Additional/Success` | | | "Signed ✓" for 2 s after a gate decision, then the page settles |
| Loading | the primary's Loading state (three dots) | | | While a decision records |

States, per the library: Default, Hover, Pressed, Focus, Disabled, Loading, Success. In the capture, one state (hover
or pressed) fills `#5F5F5F`. Elements: Text Only, Text + Icon, Loading Dots. Labels are Title Case, 14/20 Bold, with an
optional 16 px leading icon 8 px from the text. Width hugs the label (the export's minimum is 96 px).

Sizes for dense UI:

| Size | Height | Side padding | Label | Icon | Use |
|---|---|---|---|---|---|
| Large (Baselayer) | 44 | 16 (12 vertical documented) | 14/20 Bold | 16 | Primary page and gate actions, dialogs, mobile everywhere |
| Compact (proposed) | 36 | 16 | 14/20 Bold | 16 | Toolbars, card footers, filter bars, Inbox row actions on desktop |
| Mini (proposed) | 28 | 12 | 12/16 Bold | 16; icon-only 28 × 28 circle | In-row table actions, desktop only |

Icon-only buttons are circles at 44, 36 or 28 px, with an accessible name and a tooltip. The mini size meets the
WCAG 2.2 AA 24 × 24 px target minimum (2.5.8) when spaced 8 px apart. That relaxes the canvas brief's "44 px targets"
for dense desktop contexts, so log it as a decision if adopted.

### 7.2 Chips and badges

Baselayer's chips are commerce selection chips: `Chip/Size–PLP` and `Chip/Shoe` at 40 px, `Chip/Size–PDP` and
`Chip/Team` at 32 px, plus `Chip/Color`, `Chip/FilterWithLabel` and `Chip/Card`. HyperDelivery needs two families,
plus badges.

- **Filter chip:** reuse `Chip/FilterWithLabel` at 32 px, keeping the library's shape. Unselected: `secondary` fill
  with a 1px `outline variant` ring. Selected: `primary` fill (`#1D1D1D`), white label and a 16 px check. Counts are
  tabular in `on surface variant`. Label XS or SM, Title Case.
- **Object chip** (tool, resource, model and system chips; proposed component): 24 px tall, 4 px radius, `tertiary`
  fill (`#F9F9F9` / `#444444`), an inset 1px `outline variant` ring, 8 px side padding (6 px on the side with the
  logo), a 16 px mark, a 6 px gap, and Label XS 12/15 in `on surface`. Identifiers inside use the 12/16 mono.
  Truncate with a tooltip holding the full value. Hover fills `surface container high`. The color comes only from the
  mark, never from a fill.
- **Status** is not a chip. It is a 12 px glyph plus a Label XS word: "✓ Met" in `status/success`, "Partly Met" with a
  half-filled circle in ink, "Waiting on You" in red per section 3. No tinted capsules, so the green and amber pills on
  the Gate's evidence rows go.
- **Badge** (the HyperDelivery analog of a product-tile badge; proposed dense size): 20 px tall, 6 px side padding,
  4 px radius, Chivo Mono 600 at 12/16, ALL CAPS, no tracking. Variants: neutral outline (1px `#1D1D1D`, ink text) for
  tiers and types ("T1", "METRIC"), and accent (`#FE9000` fill, `#1D1D1D` text, 7.39:1) for "NEW" only. Never red.
- **Inbox count:** a pill with a 16 px minimum width, `#DC0019` fill and a white 12/16 Bold tabular numeral. It counts
  only what waits on the viewer.
- **Avatar:** 24 or 32 px circles with 12 px Bold white initials on the extension fills (2.5).

### 7.3 Form fields

| Control | Baselayer (measured; skill) | HyperDelivery Large | HyperDelivery Compact (proposed) |
|---|---|---|---|
| Text input | `FormField/SB`: 44 px, 4 px radius, 16 px insets, 16/24 text, 12/20 Bold floating label in a 4 px cutout, 12/20 helper or error 8 px below, Show/Hide 16 px from the right | Start a Project, gate notes, settings | 36 px, 12 px insets, 14/20 text; a static Label SM label above, or an `aria-label` in toolbars (a placeholder is never the label) |
| Textarea | SB `Form Field - Large Giftcard`: 16/24 text, 16 / 10 insets, 12/20 counter 10 px below | Brief edits, notes | none |
| Dropdown | SB `Dropdown`: 44 px trigger, 16 px caret 16 px from the right; panel 8 px padding, 1px ink outline, 4 px bottom radii; 32 px option rows, 8 px side padding, 14/24 text, hover `#F0F0F0` with Bold text, 16 px check when selected | Forms | 36 px trigger, same 32 px rows |
| Checkbox, radio | 16 × 16 mark, 1px black, 1 px radius (checkbox), 16 px gap to 14/24 label | Forms, the gate attestation | Table selection: the 16 px mark centered in a 40 px column |
| Switch | 56 × 32 track inside a 56 × 40 wrapper, 28 px thumb, `#1D1D1D` on | Settings | none |
| Segmented toggle | 32 px segments, 16 × 6 padding, 12/20 labels, 1px `#D0D0D0` border and divider, 4 px radius; selected black with white text | Density toggle, list or board views | same |

Field colors: `surface` fill. Stroke at rest is `#5F5F5F` (6.39:1, which meets the 3:1 non-text minimum in WCAG
1.4.11), not `#D0D0D0` (1.54:1); `#949494` in dark. Hover stroke is `#1D1D1D` (white in dark). Focus adds the ring
plus an ink stroke. Errors use a `#DC0019` stroke and message with an icon (`#FF2A29` in dark), linked with
`aria-describedby` and `aria-invalid`. Placeholders use `on surface variant`. Disabled fields fill `#F0F0F0` with
`#5F5F5F` text. Read-only fields drop the stroke and sit on `surface container`. Use native `<select>` where it fits,
and never ARIA `menu` for choosing a value.

### 7.4 Tabs (library gap)

The Baselayer inventory has no Tabs component, so this is proposed, with the active state of `Navigation - Top` as the
visual reference. Tabs are 44 px tall, Label SM 14/18 in Title Case. Unselected tabs are Regular in
`on surface variant`. The selected tab is Bold in `on surface` with a 2px `#1D1D1D` bottom bar (white in dark). Tabs sit
24 px apart above a 1px `outline variant` rule, with counts inline in tabular figures. Use `role="tablist"` only when
the control switches panels; otherwise use the segmented toggle as a radio group.

### 7.5 Tables (library gap)

Baselayer has no data table; the Compare Chart CMS module is the nearest relative. Proposed spec for the SKU workbench
and every dense list:

| Part | Spec |
|---|---|
| Header row | 40 px; Label XS 12/15 Bold, Title Case, `on surface variant`; no caps or tracking; 1px `#D0D0D0` bottom; sticky on `surface`, gaining the Medium shadow while scrolled; 12 px sort glyph |
| Body rows | Three densities that move together: 44 px and 36 px rows with 14/20 text, 32 px rows with 12/18 |
| Cells | 12 px side padding (component-scoped); 16 px in the first and last cell; numbers right-aligned and tabular; identifiers in the mono |
| Dividers | 1px `#F0F0F0` (`color/stroke/tertiary`, Baselayer's product-grid divider); `#444444` in dark |
| Hover / selected | `#F9F9F9` / `#F0F0F0` (dark: `#282828` / `#444444`); selection never uses a blue tint |
| Pinned first column | 1px `#D0D0D0` right edge |
| Status in cells | Glyph plus word as in 7.2; red only for "waiting on you" |
| Empty state | Body SM in `on surface variant` with one secondary button |

Cards: 8 px radius, a 1px `#D0D0D0` ring, 16 px padding (24 px when comfortable), titles in Heading SM 16/20.
Snackbars and tooltips use `inverse surface` with 12/18 text and a 4 px radius. The Snackbar page is marked in progress
in Baselayer, so confirm its geometry there.

## 8. Icons

Baselayer icons are library instances named `ic/<size>-<color>/<Name>`, at XSm 12, Sm 16, Md 24, Lg 32, XL 40, XXL 48,
1XL 56 and 2XL 64. HyperDelivery uses four of those steps:

| Size | Use |
|---|---|
| 12 | Status glyphs beside 12 px text (check, clock, X, half circle) |
| 16 | The default: buttons, chips, table cells, nav, inputs, dropdown carets (Baselayer's caret is 16) |
| 24 | Header actions, rail toggles, logo tiles (a 24 px tile holding a 16 px mark, replacing the 20 px tile in ux-direction) |
| 48 | Empty states and First Run |

Retire 13, 14, 18, 20 and 22 px glyphs.

**One stroke set on the canvas and in the console: Phosphor.** The console already chose it
(`docs/decisions.md`, 2026-08-27, which rejected Lucide), and the logo pack's generic marks are Phosphor Regular.
The canvas requires inline stroke SVG, so use Phosphor's stroke form (a 256 grid with `stroke="currentColor"`,
`fill="none"`, round caps and joins) and draw every glyph at a **1.5 px rendered stroke**. That is Regular
(`stroke-width` 16) at 24 px and Bold (`stroke-width` 24) at 16 px; at 12 px, Bold renders 1.125 px. Color is
`currentColor`, taken from `on surface` or `on surface variant`. Only status glyphs take a status color. Production
code should map to Baselayer's own `ic` assets when a code library or Code Connect mapping exists.

**Brand marks are not icons.** They stay at 16 px, keep their own colors, and are never recolored. In Layer 3 they sit
in a 24 px tile: 4 px radius, white fill, 1px `#D0D0D0` ring. The blank and broken images on the published canvas
come from relative `logos/*.svg` paths, which the published canvas does not serve. Upload each mark to the artifact's
asset store and reference the returned `/_blob/` URL, or inline a `<symbol>` sprite once per artboard.

## 9. The UA logo, and what needs Brand review

Baselayer's logos are library components (`Logo/Logotype`, `Logo/Black`, Logos page `10224:88153`). An internal tool
can use them, but a lockup with a product name is a Brand decision.

- **May appear, with Brand approval:**
  - The sign-in page, as a monochrome UA mark above "HyperDelivery" with "Under Armour internal" in Body XS.
  - The app header, as a 20 to 24 px mark at the far left, a 1px `outline variant` divider, then the product name.
    That is a lockup, so it needs approval.
  - The About and Help pages, as text ("Under Armour").
- **Never:** redrawn or traced as inline SVG; placed inside generated prototypes, charts, avatars, project icons,
  favicons, loading animations or background patterns; placed in Teams cards or emails without approval; recolored
  beyond black on light and white on dark (red only where Brand says); stretched or crowded inside its clear space.
- **The product wordmark.** Today's "HYPERDELIVERY" in condensed uppercase borrows UA's display voice and breaks the
  no-caps rule. Until Brand rules, set it as "HyperDelivery" in Archivo Bold at 16/20 (Heading SM) beside the existing
  black square mark. The favicon is the HyperDelivery mark, not UA's.

**Brand review checklist** (add to the dated Brand review in ux-direction section 6):

1. Whether internal tools may license UA Text and UA Technical, and whether a published canvas may embed them (4.1).
2. Any lockup of the UA mark with HyperDelivery, and the product wordmark (above).
3. HD-R1: using `critical` red for "waiting on you" instead of transaction CTAs, with no red buttons (section 3).
4. Color extensions: agent hues, the data palette and avatar fills (2.5).
5. Dark-mode deviations: `#282828` chrome, `#444444` hover and selected, `#949494` field strokes (2.3).
6. Proposed component sizes: 36 and 28 px buttons, 24 px object chips, 12/16 badges in the UA Technical stand-in,
   8 px card radius, and the tab and table specs (sections 6 and 7).
7. Title Case as the product's UI copy rule, for content design (4.3).
8. Third-party marks in product chips (already a long-lead item in ux-direction).
9. The Baselayer conflicts in 2.2, plus the open questions I-001 to I-003 (Gray 1 duplicates, the green hex, spacing
   variables outside the scale, export contradictions).

## 10. Decisions to log and documents to update

Each of these chooses between real alternatives, so log it in `docs/decisions.md` with the `log-decision` skill:

1. Baselayer becomes the visual source of truth for HyperDelivery. It replaces ux-direction section 6's public-brand
   reading.
2. Baselayer role names become the console's CSS token names, with `--hd-*` aliases for product meaning.
3. HD-R1, the red rule, retiring `danger`, `caution` and the status tints.
4. Title Case for UI labels and headings, reversing sentence case. No caps headings, no tracking, no condensed widths.
5. Fonts: Archivo (400, 700) and Chivo Mono (400, 600) on the canvas, with Geist Mono as the fallback. The console
   moves from Geist to Archivo, or to UA Text if licensed.
6. Focus ring back to `#0096FA`.
7. Radii 0, 4, 8 and pill, replacing 3, 6 and 8 px surfaces and 5 to 6 px chips.
8. Dense sizes (36 and 28 px buttons, 24 px chips, three table densities), relaxing "44 px targets" on desktop.

Documents to update: [ux-direction.md](../ux-direction.md) section 6 (color, type, shape) and section 7 (chip and
logo-tile sizes); the canvas brief's copy rules (Title Case); `ui/console/src/index.css` tokens; and this folder's
README table.

## 11. Figma exploration, round 5

Added 2026-10-26, for the owner's ask that HyperDelivery carry UA's real logo and feel like a UA product. The
exploration was read-only: I browsed the files and copied exports. **Nothing in Figma was modified.**

**Libraries and assets found.**

| Library | What it holds | For HyperDelivery |
|---|---|---|
| [UA Brand Logos](https://www.figma.com/design/D6U8sFNGDbbzNtSE39RLvN/UA-Brand-Logos?node-id=1-5) | Logo, Lockups (horizontal, stack, vertical), Monogram, Signatures, Tag, Echo, Colors | The source of the copied files below |
| `00_UA_Baselayer_Library_Web` | The web design system this document applies (sections 1 to 8) | Already the visual source of truth |
| `00_Baselayer Ignite - Design System App` | A Navigation Bar, iOS 26 tab bars, an `ignite_icon` set that includes `icon/ua_logo`, and "NEW UA Styles" headings | The app-focused library. Check it before the console redesign (below) |
| UA Baselayer Typestyles - Mobile, RUN Type Apple Watch, File Resources | Organization libraries | Not needed for this pass |
| Material 3, Simple Design System, Apple platform kits | Community kits | Not UA sources; reference only |

**What was copied.** SVG exports, unmodified:

- the small UA logo in black (`ua-logo.svg`) and in white (`ua-logo-white.svg`);
- the horizontal small lockup, the UA logo plus the UNDER ARMOUR wordmark, in black (`ua-lockup.svg`).

They sit in the concept canvas's `logos/` folder and are uploaded as canvas assets.
[design-system.md section 8](../design-system.md#8-brand-the-ua-logo) holds the rules: the product lockup, the
three-notch mark's roles, clear space, minimum size, cuts and the do-not list.

**What this changes in section 9.** The app header now carries the lockup section 9 sketched (the UA logo, a 1px
`outline variant` hairline, then "HyperDelivery"), on the concept screens and the plan page. The precedent is
Baselayer's own Token Reference, whose header opens with the UA logo and then "Baselayer Design System - WEB". The
top bar inlines the exported path in `currentColor`; that is a copy of the export, so section 9's "never redrawn or
traced" still holds. The favicon stays the HyperDelivery mark. Production use of the lockup still goes through UA
Brand (checklist item 2). The decision is logged in `docs/decisions.md` (2026-10-26).

**Baselayer Ignite, before the console redesign.** The web library is built for e-commerce (section 1); Ignite is
built for apps. Its navigation bar and tab bars may settle the tabs gap in 7.4, its icon set bears on section 8, and
its "NEW UA Styles" headings may revise the type scale in 4.2. I did not read it in detail in this pass.

## Sources

- UA Brand Logos Figma file,
  [node `1:5`](https://www.figma.com/design/D6U8sFNGDbbzNtSE39RLvN/UA-Brand-Logos?node-id=1-5), and the
  organization's Figma libraries listed in section 11, including `00_Baselayer Ignite - Design System App`.
  Browsed read-only 2026-10-26. Internal access.
- Baselayer Figma library, `00_UA_Baselayer_Library_Web`:
  [file](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web),
  [Token Reference `9560:281`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=9560-281),
  [Typography Roles `12094:46250`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=12094-46250),
  [Buttons `9759:84363`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=9759-84363),
  [Primary CTA `7095:9593`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=7095-9593),
  [SB fields `826:17564`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=826-17564).
  Internal access.
- `baselayer-design-system` skill, internal repository underarmour/ua-ai-marketplace, `plugins/design/skills/baselayer-design-system/`
  (`SKILL.md`; `references/foundations.md`, `components.md`, `primitives.md`, `rules-log.md`, `figma-workflow.md`).
  Internal.
- Under Armour production site, [underarmour.com](https://www.underarmour.com/en-us/), stylesheet
  `/_next/static/chunks/087rj-x2_xf30.css` (`@font-face` rules and the `--font-base` and `--font-text` variables),
  retrieved 2026-10-25.
- Toshi Omagari, [Neue Plak](https://tosche.net/fonts/neue-plak) (Plak's history; "mechanical grotesque").
- [Capsize](https://github.com/seek-oss/capsize) and the
  [`@capsizecss/metrics`](https://www.npmjs.com/package/@capsizecss/metrics) package 4.4.0 (font metrics);
  [Next.js font optimization](https://nextjs.org/docs/app/api-reference/components/font) (how fallback overrides are
  computed).
- Google Fonts family descriptions and axes from the [google/fonts](https://github.com/google/fonts) repository:
  [Archivo](https://fonts.google.com/specimen/Archivo), [Barlow](https://fonts.google.com/specimen/Barlow),
  [Sofia Sans](https://fonts.google.com/specimen/Sofia+Sans), [Encode Sans](https://fonts.google.com/specimen/Encode+Sans),
  [Roboto Flex](https://fonts.google.com/specimen/Roboto+Flex), [Inter](https://fonts.google.com/specimen/Inter),
  [Chivo Mono](https://fonts.google.com/specimen/Chivo+Mono), [Geist Mono](https://fonts.google.com/specimen/Geist+Mono),
  [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono), [Martian Mono](https://fonts.google.com/specimen/Martian+Mono),
  [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono), [DM Mono](https://fonts.google.com/specimen/DM+Mono),
  [Azeret Mono](https://fonts.google.com/specimen/Azeret+Mono).
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): 1.4.3 contrast, 1.4.11 non-text contrast, 2.4.7 focus visible, 2.5.8
  target size (minimum).
- [Phosphor Icons](https://phosphoricons.com/) (MIT); HyperDelivery `docs/decisions.md`, 2026-08-27 (Phosphor
  adopted).
- HyperDelivery [ux-direction.md](../ux-direction.md) sections 5 to 7, [logo-assets.md](logo-assets.md),
  [chips-tables-diagrams.md](chips-tables-diagrams.md), [under-armour-context.md](under-armour-context.md).
