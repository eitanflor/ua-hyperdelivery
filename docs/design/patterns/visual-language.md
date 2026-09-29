# Pattern: visual language

Isometric scenes and layer lifts, dither and ASCII treatments, bento grids, icons, motion and
the brand rules that hold them together. The console's working surfaces stay quiet; this is
where the product gets its signature.

## Brand anchors (unchanged)

- **UA red is reserved:** primary action, current station, the gate, "needs you". Never
  decoration, never an illustration fill beyond a single focal detail.
- **Black and white first.** Neutral surfaces, ink text; color arrives through content.
- **The stencil lockup** - italic, uppercase, 800 weight - for names only: the product, the
  crew, stations and gates. Never sentences.
- **The hazard stripe** only on gates.
- **Geist and Geist Mono**, self-hosted. No third family.
- **Athletic and industrial:** the crew are staff at a training facility; the line is a
  production floor. Visuals should feel engineered and physical, not bubbly.

## Where expression is allowed

| Surface | Expression budget | Why |
|---|---|---|
| Landing, Home hero, onboarding | High - illustration, one ambient animation | First impressions, visited rarely |
| Empty states, 404, "project shipped" | Medium - illustration, one small moment | Rare, and where teaching happens |
| Gate cards | Medium - ceremony on sign | Rare and important |
| Bento tiles, player cards | Low-medium - texture, count-up once | Read at a glance, visited daily |
| Thread, artifacts, tables, forms | Minimal - state-carrying motion only | Used all day |

## Isometric scenes and layer lifts

**Isometric scenes** explain structure without words: the line as a production floor with the
four crew members at raised platforms, gates as barriers with the hazard stripe, artifacts as
stacked sheets moving along a belt.

- Use a true 30-degree isometric projection, drawn as SVG so it recolors from tokens and works
  in both themes (`design-10`). Ship light and dark variants.
- Palette: neutrals from the token ramp, one agent hue per crew member, UA red on one focal
  detail only (the gate waiting for you).
- Where: landing hero, Home header, onboarding, the Simple-mode line map
  ([canvas-and-diagrams.md](canvas-and-diagrams.md)), empty states. Never inside the thread.
- Briefs: [../asset-briefs.md](../asset-briefs.md) A1-A4.

**Layer lifts** are an interaction: a card made of stacked layers that separate on hover or
focus to show what it contains.

- An artifact card lifts into its sections (requirements, criteria, sources) - a preview of
  what opening it will show (`motion-1`).
- Coach's build plan lifts into its architecture layers (interface, services, data).
- Implementation: CSS 3D transforms (`perspective`, `translateZ` or stepped `translateY`) with
  a shadow offset that grows per layer. At most three layers; lift of 4-8px per layer;
  150-200ms on the ease-out; exit on the ease-exit.
- Reduced motion: show the separated state statically on focus, or not at all.
- Diagrams follow Diagram Design's no-shadow rule; lifts are for illustrative cards only.

## Dither and ASCII

A 1-bit or two-tone texture that fits both the industrial register and the "machine at work"
idea without looking like generic AI gradients.

| Use | Treatment | Source |
|---|---|---|
| Crew player-card portraits | Ordered dither or halftone of the bot illustration, ink on paper, agent hue as the second tone | React Bits Texture Lab, Kobra `halftone-dots`, Halftone Reveal |
| Working tile on Home | A small pixel-grid or ASCII frame loop inside a running project's tile | Lattice Loader, Beautiful UI Loading State, ASCII spinner frames (`motion-5`) |
| Empty states | A dithered isometric illustration | Asset briefs |
| A bot "booting" when a run starts | One-shot decrypt or scramble of the bot's name, then static | Decrypted Text / Scrambled Text - rare moments only |
| Canvas background | Static dot grid | Dot Grid |

Rules: two tones at most, taken from tokens; never behind body text; always a static
fallback; both themes. The vendored `industrial-brutalist-ui` skill in
`.github/skills/` covers the terminal and analog-degradation register in more depth.

## Bento

Grids of differently sized tiles that summarize a place at a glance.

- **Home:** one hero tile (*Needs you* - gates and questions assigned to this person), then
  *In flight*, *Recently shipped* (`interactivity-23`), *Crew status* (who is working on
  what), and for leadership a small insights tile.
- **Gate card:** *What you are approving* ([approval-cards.md](approval-cards.md)).
- **Artifact cover:** the summary numbers ([artifacts-and-panels.md](artifacts-and-panels.md)).
- Grid: 12 columns; tiles 1x1, 2x1, 2x2. One hero tile per grid; at most one tile uses the
  accent.
- Nested radius follows `design-1`: a tile inside a 10px card with 4px padding gets 6px.
- Numbers use tabular numerals and count up once on first view, never on re-render.
- Every tile has a designed empty and loading state.

## Icons

- **Phosphor stays the one UI icon family.** Regular weight for interface controls; **duotone**
  for bento tiles and empty states, where an icon is illustrative; **fill** only for state
  (lock, seal, warning).
- Sizes 16, 20 and 24px, on the same stroke. Hit area at least 24px regardless of glyph size
  (`interactivity-3`).
- **Source marks** (Confluence, Jira, GitHub, Snowflake, AWS) come from Simple Icons as
  monochrome `currentColor` glyphs, used only to name a source, never as buttons.
- **Crew faces are authored marks,** not icons, and never mix with the icon family.
- When porting from React Bits (Hugeicons) or Kobra (Tabler), swap to the Phosphor equivalent.

## Motion

| Tier | What | Budget |
|---|---|---|
| 1. Ambient status | Blinking eyes, status marks, the working dot | Always on while the state holds; tiny |
| 2. Transitions | Panels, tabs, rows entering, highlight slides | 150-250ms entrances on ease-out, shorter exits on ease-exit |
| 3. Authored moments | Gate signed and handed off; first project created; project shipped | These three only |
| 4. Decorative | Landing and Home hero ambience | One per surface, lazy-loaded, paused offscreen and under reduced motion |

- Add an **ease-exit** token (`cubic-bezier(0.4, 0, 0.6, 1)`) next to `--ease-out-expo` in
  [index.css](../../../ui/console/src/index.css#L88).
- Animate transform, opacity and filter only.
- Everything interruptible (`motion-11`). High-frequency actions get less motion (`motion-15`).
- Reduced motion keeps every state change and removes travel.

## Typography on reading surfaces

- Thread prose, artifact bodies and gate copy move up one step: `text-sm` (14px) for body,
  `text-base` (15px) in the artifact viewer. Metadata stays at 12-13px. The 12px floor is
  unchanged.
- Stencil for names of three words or fewer.
- Tabular numerals on anything that counts or changes.

## Sound

Considered (Kobra `sound`). Off. Revisit only if users ask for an audible "needs you" cue.
