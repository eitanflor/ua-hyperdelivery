# Asset prompts

Copy-paste prompts for every illustration the console has a slot for, and how to get each one
from the generator into the app. The briefs in [asset-briefs.md](asset-briefs.md) say *what*
each asset is and why; this file is the *how*.

Nothing here is required for the console to work. Every slot already has a designed fallback
drawn in code, and a dropped-in file replaces it with no code change.

## Where files go

```
ui/console/src/assets/illustrations/<id>.light.<ext>
ui/console/src/assets/illustrations/<id>.dark.<ext>
ui/console/src/assets/illustrations/<id>.<ext>        # one file for both themes
```

`<ext>` is `svg`, `webp`, `avif`, `png` or `jpg`. The app finds files at build time through
[`lib/artwork.ts`](../../ui/console/src/lib/artwork.ts). If a theme is missing it uses the
theme-neutral file, then the other theme's. Restart `pnpm dev` after adding a file, because
the glob is evaluated when Vite starts.

| Id | Where it appears | Artboard | Format | Until then |
|---|---|---|---|---|
| `a1-line` | Help panel, top | 1600 x 600 | SVG | Animated full-color isometric line |
| `a3-gate` | Gate card header icon | 96 x 64 | SVG | Lock icon |
| `a4-brief` | Start page, "What happens next" | 1200 x 400 | SVG | Nothing |
| `c-scout`, `c-coach`, `c-ref`, `c-host` | Crew player cards | 512 x 512 | PNG / WebP | Face on a halftone field |
| `d1-floor` | Home, first run | 1600 x 600 | SVG | Code-drawn isometric line |
| `d2-gate-clear` | Home, nothing waiting for approval | 320 x 240 | SVG | Nothing |
| `d3-scout-rest` | Home, no open questions | 320 x 240 | SVG | Nothing |
| `d4-tray` | Inspector Sources, nothing uploaded | 320 x 240 | SVG | Nothing |
| `d5-search` | Command palette, no results | 320 x 240 | SVG | Nothing |
| `d6-column` | Portfolio, filter matches nothing | 320 x 240 | SVG | Nothing |
| `e-missing-platform` | Not-found page | 960 x 540 | SVG | Animated ASCII crew head |
| `i2-crew` | First-project kickoff card | 1200 x 400 | SVG | Crew faces |

The crew portraits are square because the card crops to a square, not the 480 x 600 in the
brief.

## Workflow

1. **Make the crew first (brief B).** Generate the four turnaround sheets before anything
   else and pick one good render per robot. Every later prompt that shows a crew member
   passes that render as the **reference image** (Higgsfield "Character"/Soul ID,
   Midjourney `--cref`, Ideogram or Recraft style reference). This keeps the robots
   consistent across scenes, which the words alone never manage.
2. **Lock the style once.** Generate A1 until it is right, then use it as the style reference
   (Midjourney `--sref`, Recraft custom style, Higgsfield reference) for every other scene.
3. **Generate at 2x** the artboard and downscale. Ask for a plain off-white background; you
   remove it in post, which is cleaner than asking a model for transparency.
4. **Light first, dark second.** Produce the light variant, then run the same seed and
   reference with the dark prompt suffix below, or recolor the SVG (step 6). Recoloring is
   usually cleaner.
5. **Post-process** (below), name the file, drop it in the folder, restart `pnpm dev`, and
   check both themes.
6. **Record provenance.** Add the tool, model, prompt, seed and date to the table at the
   end of this file. The asset rules require it so any file can be regenerated.

### Tool notes

- **Higgsfield.** Use an image model (Soul, or whichever image model it offers), not the
  video presets. Upload the chosen B render as the character reference for every crew scene.
  Keep "enhance prompt" off, because it adds lighting and gradients the style forbids.
- **Recraft.** The best fit for the SVG assets, because it exports real vectors. Create a
  custom style from the A1 render and pick the "vector illustration" or "line art" family.
- **Midjourney.** `--style raw --stylize 50` stops it drifting into glossy renders. Add
  `--ar` to match the artboard, and `--no` with the negative list.
- **Ideogram / DALL-E / Imagen.** Fine for exploration. Put the negative list in the prompt
  as "Do not include: ..." because these tools have no separate negative field.

## Shared prompt parts

Paste the **style prefix** at the start of every prompt, and the **negative** into the
negative field or at the end.

**Style prefix**

> Isometric technical illustration, true 30-degree isometric projection, clean vector line
> art with uniform 1.5px strokes, flat fills from a limited palette, no gradients, industrial
> athletic-training-facility aesthetic, precise and engineered, generous negative space.

**Light suffix**

> Plain off-white paper background #fafafa. Surfaces white #ffffff, recessed areas #f1f1f2,
> lines and hairlines #dcdce0 and #101010 ink, muted details #5a5a5e.

**Dark suffix**

> Plain near-black background #0d0d0f. Surfaces #17171a, recessed areas #09090a, lines
> #2c2c32 and off-white ink #f5f5f6, muted details #a9a9b2.

**Negative**

> text, letters, numbers, words, labels, logos, brand marks, watermark, signature, people,
> human faces, photorealism, 3D render, glossy, gradients, glow, neon, lens flare, bloom,
> depth of field, perspective camera, vanishing point, cartoon, bubbly, stock illustration,
> clutter, busy background, drop shadows

**Crew hues.** One accent per robot, used on the crest, eye glow and one accessory:

| Crew | Light (ink on tint) | Dark (ink on tint) |
|---|---|---|
| Scout | `#0a6e7a` on `#e4f4f6` | `#4dd4e0` on `#0a2429` |
| Coach | `#3f4ca8` on `#ebedfa` | `#8b9cff` on `#14172e` |
| Ref | `#6b3fa0` on `#f1eafa` | `#b995f0` on `#1d1330` |
| Host | `#a3287f` on `#fbeaf5` | `#f07ac8` on `#2c0f22` |

**The one red.** UA red `#e4002b` appears on exactly one detail per image, usually a hazard
stripe. Repeating it everywhere turns the whole scene into a warning. The exception is
`a1-line`, the full-color overview of the whole line.

## B. Crew turnarounds (reference only, not shipped)

These are not placed in the app. They feed every crew prompt below.

**Common body**, reused in all four:

> A compact, friendly industrial robot. Rounded-square head, about as wide as it is tall,
> with two short vertical pill-shaped eyes. Sturdy torso shaped like a piece of gym training
> equipment, simple jointed limbs, matte finish, neutral white and light grey body panels
> with dark grey joints.

**Scout** (`#0a6e7a`)

> [style prefix] Character turnaround sheet of one robot on a plain white background: front
> view, three-quarter view, side view and back view in a row, all the same scale, plus a row
> of seven head close-ups showing only the eyes changing (open, mid-blink, glancing up, wide
> looking at viewer, closed happy arcs, flat lines, looking sideways). [common body] On top
> of the head, a single short diagonal tick stroke as a crest, off-center. Carries a
> clipboard and a stopwatch on a lanyard. Crest, eye glow and lanyard in teal #0a6e7a;
> everything else neutral. [negative]

**Coach** (`#3f4ca8`)

> [same as Scout, replacing the crest and props:] On top of the head, a small X-shaped
> crest like a chalk play mark. Holds a whiteboard marker, wears a whistle on a cord. Crest,
> eye glow and whistle cord in indigo #3f4ca8.

**Ref** (`#6b3fa0`)

> [same, with:] On top of the head, three short vertical bars like a tally mark. Holds a
> small tablet showing a circular replay arrow. Crest, eye glow and tablet frame in violet
> #6b3fa0.

**Host** (`#a3287f`)

> [same, with:] On top of the head, a tiny microphone on a short stem as a crest. Holds a
> handheld microphone, wears a slim headset. Crest, eye glow and headset in magenta #a3287f.

The crests must match the console's face marks. Open the Help panel in the app and compare
before you accept a render.

## A. Scenes

### `a1-line`: the line

> [style prefix] A long production floor running diagonally left to right on the isometric
> grid. Four raised square platforms evenly spaced along it, each with one small robot crew
> member standing on top [use the four B renders as references, left to right: Scout, Coach,
> Ref, Host]. Each platform's top is tinted in its crew member's color: teal #e4f4f6, indigo
> #ebedfa, violet #f1eafa, magenta #fbeaf5. Between each pair of platforms, a low barrier
> gate: two short posts and a horizontal arm with diagonal hazard stripes in red #e4002b and
> black. A conveyor belt with visible rollers runs along the front edge linking the
> platforms; a small stack of document sheets rides it, each sheet edged in the color of the
> crew member who added it. The last platform opens onto a small stage with a faint
> spotlight cone from above. [light suffix] [negative]

- Artboard 1600 x 600, keep the content inside the central 1200 x 450.
- Optional. The Help panel's code version is animated. A dropped-in file replaces it with a
  still image, so add one only if the illustration is worth losing the motion.
- The code version (`IsoLine.tsx` with `overview`) is the same composition. Screenshot the
  Help panel and use it as a composition reference.

### `a3-gate`: gate icon

> [style prefix] A single isometric barrier arm across a short lane, simplified to an icon:
> two posts and one horizontal arm with bold diagonal hazard stripes in red #e4002b and black.
> Lines only, very few details, reads clearly at 48 pixels wide. Transparent background.
> [negative]

- 96 x 64 artboard, strokes only. Vectorize, then delete stray nodes by hand. It has to be
  crisp at 48 x 32.
- Dark variant: swap black for `#f5f5f6`. Keep the red.

### `a4-brief`: messy brief to clear requirements

> [style prefix] Three zones left to right on an isometric floor. Left: a loose, slightly
> chaotic pile of mixed papers, sticky notes, an open laptop and a rounded speech-bubble
> shape, all blank with no writing. Center: Scout [reference] on a small raised platform,
> reading a sheet. Right: a neat stack of identical white cards, each with a small teal
> #0a6e7a checkmark. A thin conveyor connects left to right. [light suffix] [negative]

- 1200 x 400. The slot is about 320px wide, so keep shapes chunky and avoid hairline detail.

## C. Player-card portraits

One per crew member, named `c-scout`, `c-coach`, `c-ref` and `c-host`.

> Head-and-shoulders portrait of [crew name] [reference: the three-quarter view from its B
> sheet], three-quarter angle, centered with the head filling the upper two thirds of a
> square frame, plain background. [negative]

**Post-process into the texture:**

1. Remove the background.
2. Convert to grayscale and raise contrast.
3. Apply an **ordered (Bayer 8 x 8) dither** or a **halftone** with dots about 3px apart at
   512px. Photopea: *Image → Mode → Bitmap → Halftone*. Any "dither" filter works.
   React Bits Texture Lab also does it in the browser.
4. Map the two tones:
   - Light: dots in the crew ink (for example `#0a6e7a`) on the crew tint (`#e4f4f6`).
   - Dark: dots in the dark ink (`#4dd4e0`) on the dark tint (`#0a2429`).
5. Export 512 x 512 WebP or PNG as `c-scout.light.webp` and `c-scout.dark.webp`.

The jersey number and name are added by the card in code. Keep the top-left corner quiet,
because the number sits there.

## D. Empty states

All 320 x 240 and spot-sized, so fewer objects and heavier shapes than the scenes. Each slot
renders at 64-80px tall, so the silhouette has to read at that size.

### `d1-floor`: Home, first run

> [style prefix] An empty production floor on the isometric grid: four raised square
> platforms in a row, all unoccupied and unlit, low barrier gates between them with light grey
> striped arms, a conveyor belt along the front edge. A single white document sheet waits at
> the very start of the belt. Quiet, calm, expectant. [light suffix] [negative]

- Uses the wide 1600 x 600 artboard, not 320 x 240. It sits where the line would.

### `d2-gate-clear`: nothing waiting for approval

> [style prefix] A single barrier gate with its striped arm raised fully upright, the lane
> beneath it clear and empty, a small pennant flag with a checkmark shape on the post.
> Striped arm in light grey and white, flag in green #0e7a4d. [light suffix] [negative]

### `d3-scout-rest`: no open questions

> [style prefix] Scout [reference] sitting relaxed on the edge of its raised platform, legs
> dangling, clipboard lowered on its knee, eyes as closed happy arcs. Teal #0a6e7a crest.
> [light suffix] [negative]

### `d4-tray`: nothing uploaded

> [style prefix] An empty shallow document tray, the kind on an office desk, sitting on a
> small raised platform. Nothing inside it. [light suffix] [negative]

### `d5-search`: no results

> [style prefix] Scout [reference] leaning forward holding a large magnifying glass over a
> single empty square floor tile. Curious, not worried. [light suffix] [negative]

### `d6-column`: filter matches nothing

> [style prefix] One empty kanban board column seen from the isometric angle: a tall shallow
> tray with a single card outline drawn in a dashed line, no content on it. [light suffix]
> [negative]

## E. Not found

### `e-missing-platform`

> [style prefix] A section of the production floor with one platform missing: a clean gap in
> the floor where it should be, the gap's edge marked with a red #e4002b and black hazard
> stripe. Host [reference] stands beside the gap with a mild shrug, microphone lowered.
> Conveyor belt ends at the gap with one document sheet at the edge. Warm and slightly funny,
> not alarming. [light suffix] [negative]

- 960 x 540. Rendered about 160px tall above the "Not on the line" heading.

## I. Onboarding

### `i2-crew`: the crew in a row

> [style prefix] The four robot crew members standing in a row on a single long low platform,
> evenly spaced, facing the viewer at a slight isometric angle [references: Scout, Coach,
> Ref, Host, left to right]. Each gives a small welcoming gesture: Scout raises the
> clipboard, Coach points forward with the marker, Ref gives a thumbs-up, Host tips the
> microphone. [light suffix] [negative]

- 1200 x 400. Shown about 96px tall at the top of the kickoff card, so crop tight.

## Post-processing

- **Background.** Remove it (remove.bg, Photopea, or Recraft's export) and export with
  transparency.
- **Vectorize** raster output for SVG slots: Recraft's vectorizer, Vectorizer.AI or Illustrator
  Image Trace. Limit the colors to the palette and merge near-duplicate swatches. Then run
  `npx svgo <file>.svg` to shrink it.
- **Recolor for dark.** In the SVG, swap the light palette values for the dark ones with a find
  and replace, using the palette table in [asset-briefs.md](asset-briefs.md#palette). Keep
  `#e4002b` as it is.
- **Check strokes.** Stroke width should stay close to 1.5px at the artboard size. If the
  vectorizer produced filled outlines instead of strokes, that is fine, as long as they read
  as 1.5px.
- **Size.** SVGs under 40 KB, rasters under 150 KB. Anything larger slows first paint.
- **Check both themes** by toggling the theme in Settings. Then look at the slot at its real
  size. A spot that reads at 320px can be mush at 64px.

## Provenance

Fill in one row per delivered file.

| File | Tool / model | Prompt (section) | Seed | Date | By |
|---|---|---|---|---|---|
| | | | | | |
