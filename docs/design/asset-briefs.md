# Asset briefs

Descriptions of the illustrations, portraits and textures the redesign calls for, written so
they can be handed to an image-generation tool or an illustrator as-is. Nothing here exists
yet. Each brief names where the asset is used, so it can be dropped if that surface is cut.

Ready-to-paste prompts, file names and the drop-in folder are in
[asset-prompts.md](asset-prompts.md).

## Rules for every asset

- **No text in the image.** Labels, names and numbers are added in code so they translate,
  theme and stay accessible.
- **No logos generated.** Never ask a tool to draw the Under Armour logo or any product mark.
  Composite the official file (`ui/console/public/ua-logo.png`) afterwards if a scene needs it.
  The same applies to GitHub, Jira, Confluence and Snowflake marks.
- **No real people.** The crew are robots; human figures, if any, are faceless silhouettes.
- **Two themes.** Every asset ships a light and a dark variant (detail.design `design-10`).
- **Deliver as SVG** where the style allows (isometric line art, icons, flat scenes) so colors
  can be re-mapped to tokens. Raster (PNG or AVIF at 2x) only for dithered and textured work.
- **Transparent background** unless the brief says otherwise.
- Record the tool, prompt and date next to each delivered file so it can be regenerated.

## Palette

Use these exact values; they match the tokens in `ui/console/src/index.css`.

| Role | Light | Dark |
|---|---|---|
| Paper (background) | `#fafafa` | `#0d0d0f` |
| Surface | `#ffffff` | `#17171a` |
| Recessed surface | `#f1f1f2` | `#09090a` |
| Hairline | `#dcdce0` | `#2c2c32` |
| Ink | `#101010` | `#f5f5f6` |
| Muted ink | `#5a5a5e` | `#a9a9b2` |
| UA red (one focal detail only) | `#e4002b` | `#e4002b` |
| Scout (teal) | `#0a6e7a` on `#e4f4f6` | `#4dd4e0` on `#0a2429` |
| Coach (indigo) | `#3f4ca8` on `#ebedfa` | `#8b9cff` on `#14172e` |
| Ref (violet) | `#6b3fa0` on `#f1eafa` | `#b995f0` on `#1d1330` |
| Host (magenta) | `#a3287f` on `#fbeaf5` | `#f07ac8` on `#2c0f22` |

## Shared style

*Isometric technical illustration, true 30-degree isometric projection, clean vector line art
with 1.5px uniform strokes, flat fills from a limited palette, no gradients, no drop shadows
except a flat offset shadow under raised platforms, industrial training-facility aesthetic,
precise and engineered, generous negative space, off-white paper background.*

Avoid: *glossy 3D renders, gradients, glow, lens flare, neon, bubbly cartoon style, stock
illustration people, clutter, text, logos, perspective (non-isometric) camera.*

## A. Scenes

### A1. The line (landing and Home hero)

- **Used on:** landing hero, Home header, Simple-mode line map.
- **Composition:** a long production floor running left to right on the isometric grid. Four
  raised square platforms, evenly spaced, each with one robot crew member (see B). Between
  platforms 1-2, 2-3 and 3-4, a low barrier gate with a diagonal hazard-stripe bar in UA red
  and ink. A conveyor belt links the platforms; flat document sheets travel along it, stacked
  thicker after each platform. The last platform opens onto a small stage with a spotlight
  cone (demo).
- **Focal detail:** the one hazard bar in UA red; everything else in neutrals and crew hues.
- **Size:** 1600 x 600 artboard, content in the central 1200 x 450.
- **Variants:** light, dark; plus four states with a different platform "lit" (crew member
  animated pose, platform top tinted in its hue) for the line map.

### A2. Crew at work (Home, crew section)

- A tighter crop of one platform per image, four images: the crew member working at a
  station-specific prop - Scout at a measuring board with a clipboard; Coach at a whiteboard
  with an X-and-O play; Ref at a monitor wall with a replay screen; Host at a lectern with a
  microphone facing a small audience silhouette.
- **Size:** 640 x 480 each.

### A3. The gate (gate card header, onboarding)

- A single isometric barrier arm across a lane, hazard-striped in UA red and ink, with a small
  kiosk beside it holding a document and a pen. A robot waits on one side of the barrier; the
  lane continues on the other side.
- **Size:** 480 x 320. Also a 96 x 64 simplified icon version (strokes only).

### A4. Messy brief to clear requirements (landing explainer, onboarding)

- Left: a loose pile of mixed papers, sticky notes, a laptop and a chat bubble shape (no text).
  Center: Scout on a platform. Right: a neat stack of identical cards with checkmark ticks.
- Illustrates Diagram Design's *unstructured-input transformation* pattern.
- **Size:** 1200 x 400.

## B. Crew turnarounds

One sheet per robot: front, three-quarter, side and back views, plus an expression row.

- **Common build:** compact, friendly industrial robot. Rounded-square head matching the
  console's face mark (a 16 x 14.5 rounded rectangle with two pill-shaped eyes), a crest on
  top, a sturdy torso like a piece of training equipment, simple limbs. Matte finish.
  Athletic-staff uniform cues (a lanyard, a whistle, a headset) instead of clothing.
- **Crests (must match the console marks):** Scout - a single off-center diagonal tick
  stroke; Coach - a small X like a chalk play mark; Ref - three vertical tally bars; Host - a
  small microphone on a short stem.
- **Colors:** body in neutrals; the crest, eye glow and one accessory in the crew hue.
- **Expression row (eyes only):** idle, working (mid-blink), thinking (glancing up), needs you
  (wide, looking toward the viewer), done (closed arcs), blocked (flat lines), handoff (looking
  to the side). See [patterns/bot-personas.md](patterns/bot-personas.md).
- **Props per robot:** Scout - clipboard and stopwatch; Coach - whiteboard marker; Ref -
  tablet with a replay symbol; Host - microphone.
- **Size:** 2400 x 1200 sheet; each view on a 512 x 512 cell.

## C. Player cards (dithered portraits)

- **Used on:** crew section, avatar hover cards, onboarding.
- **Source:** the three-quarter view from B, cropped head and shoulders.
- **Treatment:** ordered (Bayer) dither or halftone, **two tones only** - ink and the crew hue -
  on paper. Coarse enough to read as a deliberate texture at 240px wide. React Bits Texture Lab
  or a Bayer 8x8 filter.
- **Card frame (built in code, not in the image):** jersey number, name in the stencil lockup,
  job title, a hairline border. The image is the portrait only.
- **Size:** 480 x 600 PNG, light and dark (dark: light-hue dots on ink).

## D. Empty states

Small isometric spot illustrations, 320 x 240, same style as A.

| Id | Surface | Scene |
|---|---|---|
| D1 | Home, no projects yet | An empty production floor with the four platforms unlit and one document sheet waiting at the start |
| D2 | Needs you, nothing waiting | A gate barrier raised, lane clear, a small checkmark flag |
| D3 | Questions for you, none | Scout at rest on its platform, clipboard lowered |
| D4 | Inspector, no documents yet | An empty document tray on a platform |
| D5 | Search, no results | Scout with a magnifier looking at an empty floor tile |
| D6 | Portfolio, filter matches nothing | An empty kanban column with a single dashed card outline |

## E. Not-found page

- The line with one platform missing - a gap in the floor with a hazard-striped edge, and Host
  shrugging beside it with the microphone lowered. Warm, not alarming (detail.design
  `easter-egg-1`).
- **Size:** 960 x 540.

## F. The signed ticket stub

- Built in code (so it can carry live data), but needs a texture: a subtle paper grain and a
  perforated edge as a repeatable SVG pattern, in both themes.
- **Size:** tileable 64 x 64 grain; perforation as a 12px-high repeating SVG strip.

## G. Bento tile spots

Duotone Phosphor icons are the default. Where a tile benefits from an illustration, use a 160 x
120 isometric object in the A style: a gate barrier (Needs you), a conveyor with sheets (In
flight), a small trophy on a plinth (Recently shipped), a set of four platforms seen from above
(Crew status).

## H. Loading frames

- **Pixel grid:** an 8 x 8 grid of squares in ink at 20% opacity, a wave of full-opacity cells
  traveling diagonally. Delivered as a CSS or SVG spec, not frames.
- **ASCII frame set:** 8-12 frames of a small robot head built from monospace characters,
  eyes blinking, for a working tile. Delivered as a text file of frames. Characters limited to
  printable ASCII.

## I. Onboarding cards

Three cards, 640 x 400, shown on first run:

1. "Tell us what you need" - A4, simplified.
2. "The crew does the work" - the four crew members from B in a row.
3. "You approve every step" - A3.

## J. Favicon states

Built as SVG in code from the existing favicon, with a 6px dot overlay: ink dot while a run
is working, UA red dot with a count when something needs you. Light and dark variants.
