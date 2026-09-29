# React Bits

| | |
|---|---|
| Source | <https://reactbits.dev/> - repo <https://github.com/DavidHDev/react-bits>, micro category <https://reactbits.dev/c/micro> |
| Retrieved | 2026-09-28 (catalog from `src/constants/Categories.js` on `main`) |
| What it is | 200+ animated, copy-paste React components across five categories, plus three free creative tools. |
| License | MIT + Commons Clause: free for personal and commercial use; the components themselves may not be resold. |
| Install | Copy the source, or `npx shadcn@latest add @react-bits/<Name>-TS-TW` (also via jsrepo). Every component ships in four variants: JS-CSS, JS-TW, TS-CSS, TS-TW. Use **TS-TW**. |

## Why it is in the library

React Bits is the largest source of motion for the moments the console underplays: an agent
thinking, a gate being signed, a project shipping, an empty screen that should teach. Its
**Micro** category is the most useful part for an operator tool - small, state-carrying
interactions rather than hero effects.

## Catalog

The retrieval elided a few names at chunk boundaries; `Categories.js` is the source of truth.

**Text Animations.** Tech Text, Text Loop, Masked Heading, Particle Text, Split Flap Text, Warp
Text, Stroke Text, Depth Text, Fold Text, Echo Text, Split Text, Blur Text, Circular Text, Text
Type, Shuffle, Shiny Text, Text Pressure, Curved Loop, Fuzzy Text, Gradient Text, Falling Text,
Text Cursor, Decrypted Text, True Focus, Scroll Float, Scroll Reveal, ASCII Text, Scrambled
Text, Rotating Text, Glitch Text, Scroll Velocity, Variable Proximity, Count Up.

**Animations.** Electric Logo, Dither Veil, Glow Cursor, Scroll Expand, Ripple Distortion,
Elastic Mesh, Swarm Cursor, Halftone Reveal, Pixel Swap, Cursor Grid, Animated Content, Fade
Content, Electric Border, Orbit Images, Pixel Transition, Glare Hover, Antigravity, Logo Loop,
Target Cursor, Magic Rings, Laser Flow, Magnet Lines, Ghost Cursor, Gradual Blur, Click Spark,
Magnet, Strands, Sticker Peel, Pixel Trail, Cubes, Metallic Paint, Noise, Shape Blur,
Crosshair, Image Trail, Ribbons, Splash Cursor, Meta Balls, Blob Cursor, Star Border.

**Components.** Flex Carousel, Infinite Spiral, Depth Carousel, Morph Slider, Drift Wall,
Accordion Gallery, Specular Button, Option Wheel, Curved Input, Line Sidebar, Animated List,
Scroll Stack, Bubble Menu, Magic Bento, Circular Gallery, Reflective Card, Card Nav, Stack,
Fluid Glass, Pill Nav, Tilted Card, Masonry, Glass Surface, Dome Gallery, Chroma Grid, Folder,
Staggered Menu, Model Viewer, Lanyard, Profile Card, Dock, Gooey Nav, Pixel Card, Carousel,
Spotlight Card, Border Glow, Flying Posters, Card Swap, Glass Icons, Decay Card, Flowing Menu,
Elastic Slider, Counter, Infinite Menu, Stepper, Bounce Cards.

**Micro.** Shredder, Paper Crumple, Tear Ticket, Flip Card, Branched Menu, Folder Float, Refine
Frame, Thought Line, Voice Pill, Slosh Gauge, Prompt Bar, Swipe Toast, Sling Button, Bell
Toggle, Call Chip, Status Mark, Glide Select, Swipe Row, Jelly Radio, Comet Dial, Wake Slider,
Code Slots, Dodge Field, Lattice Loader, Scrub Field, Fuse Button, Warm Tooltip, Slide Commit,
Rubber Segment, Pulse Heart, Spring Check, Peek Rating, Hold Button, Squish Switch.

**Backgrounds.** Micro Slats, Shape Waves, Aero Shards, Ghost Fibers, CRT Warp, Molten Metal,
Gradient Waves, Web Threads, Topography, Light Tunnel, Sliced Waves, Acid Squares, Scanner,
Ferrofluid, Lightfall, Liquid Ether, Prism, Dark Veil, Light Pillar, Silk, Floating Lines,
Side Rays, Light Rays, Pixel Blast, Color Bends, Evil Eye, Line Waves, Radar, Soft Aurora,
Aurora, Plasma, Plasma Wave, Particles, Gradient Blinds, Grainient, Grid Scan, Beams, Pixel
Snow, Lightning, Prismatic Burst, Galaxy, Dither, Faulty Terminal, Ripple Grid, Dot Field, Dot
Grid, Threads, Hyperspeed, Iridescence, Waves, Grid Distortion, Ballpit, Orb, Letter Glitch,
Grid Motion, Shape Grid, Liquid Chrome, Balatro.

**Tools.** *Background Studio* (tune and export animated backgrounds as video, image or
code), *Shape Magic* (inner rounded corners between shapes, exported as SVG, React or
clip-path), *Texture Lab* (20+ effects including noise, dithering and ASCII, applied to images
or video and exported). Texture Lab is the fastest route to the dithered crew portraits in
[../asset-briefs.md](../asset-briefs.md).

## Reviewed in depth

These four were read at the prop level because each answers a specific console problem.

### Thought Line

A single "working" line whose glyph and label breathe while an agent works, with an optional
shimmer band across the label and a live timer. Steps can be appended beneath it as the
agent progresses: the last is current, earlier ones tick. When work ends it settles into a
past-tense sentence ("Thought for 14s") and can fold its trace away. Props cover label, done
label, glyph (sparkle, dot, none, custom), steps, collapsible, fold-on-settle, breath period
and depth, shimmer, timer, and a settle callback.

**Use for:** the Simple-mode working state that replaces three drifting dots
([../patterns/agent-states.md](../patterns/agent-states.md)). Phase 2.

### Status Mark

One glyph that morphs through a lifecycle in place: pending (dashed ring), running
(indeterminate arc or determinate progress), done (check draws in, label strikes through),
failed (cross), and canceled. Label dims on completion.

**Use for:** plan steps, station nodes on the line, build rows, task rows. This is
detail.design's `motion-22` (one ambient lifecycle indicator) as a component. Phase 0/2.

### Slide Commit

A slide-to-confirm pill. Dragging the handle to the end fires a callback; returning a promise
shows a spinner, then the pill unfurls into a done state on resolve or springs home and
shows an error label on reject. Width, height, radius, bounce and hold duration are props.

**Use for:** one candidate for signing a gate - deliberate without a modal. Needs a keyboard
path (focus plus Enter to advance, or a hold). Phase 3.

### Hold Button

Press and hold for a set duration; a liquid fill sweeps across (or rises) with an optional
wave edge and glow, and the label inverts as the fill crosses it. A short tap fires a
separate callback, so a quick click can show a hint ("Hold to sign") instead of acting.

**Use for:** the other candidate for signing a gate, and for irreversible project deletion.
Keyboard: hold Space or Enter. Phase 3.

## Name-only candidates

Not yet reviewed at the prop level. Check before adopting.

| Component | Candidate use | Phase |
|---|---|---|
| Tear Ticket | The signed gate checkpoint as a ticket stub - a game-ticket nod that fits the crew | 3 |
| Lattice Loader | Pixel-grid working tile for bento and empty states | 2 |
| Spring Check | Criteria checkbox confirmation | 3 |
| Swipe Toast | Receipts that can be dismissed with a gesture | 2 |
| Warm Tooltip | Line indicator and glossary tooltips | 1 |
| Prompt Bar | Intake composer with `@` sources | 1 |
| Refine Frame | "Ask Scout to revise this section" affordance | 4 |
| Flip Card | Crew player card front and back | 1 |
| Folder Float | Artifacts grouped per project | 4 |
| Count Up / Counter | Home and portfolio numbers, animating once on first view | 1 |
| Split Flap Text | Stadium-board status for the line on Home | 6 |
| Rotating Text / Text Type | Cycling intake examples ("a dashboard...", "a data feed...") | 1 |
| Decrypted Text / Scrambled Text / ASCII Text | A bot "booting up" when a run starts - rare moments only | 6 |
| Magic Bento | Home dashboard grid | 1 |
| Stepper | Guided intake | 1 |
| Animated List | Activity feed | 1 |
| Card Swap / Stack | Artifact stacks with layer lifts | 6 |
| Profile Card / Tilted Card | Crew player cards | 1 / 6 |
| Dither, Dot Grid, Grid Scan, Letter Glitch, Faulty Terminal | Canvas backgrounds and dither/ASCII working surfaces | 5 / 6 |
| Halftone Reveal, Dither Veil, Pixel Transition | Crew portraits and hero imagery reveals | 6 |
| Gradual Blur | Scroll edges on long artifacts | 4 |

## What not to take

- **Cursor effects** (Glow, Swarm, Target, Ghost, Splash, Blob Cursor, Image and Pixel
  Trail, Crosshair, Click Spark). They decorate every pointer move in a tool people use all
  day - a clear failure of the frequency rule.
- **Heavy WebGL backgrounds** behind working content (Plasma, Galaxy, Hyperspeed, Liquid
  Ether, Ballpit and similar). If one is used at all, it goes on the landing or empty-state
  hero only, lazy-loaded, paused offscreen, and replaced by a static frame under reduced
  motion.
- **Flashy borders** (Electric Border, Star Border, Border Glow) on anything that is not a
  single authored moment. They compete with UA red, which is reserved.
- **Gallery components** (Dome, Circular, Infinite Spiral, Flying Posters, Masonry). No
  matching surface.

## Porting notes

- Several micro components depend on `@hugeicons/react` and `@hugeicons/core-free-icons`
  (Thought Line, Slide Commit). Replace them with Phosphor before merging; one icon family.
- Status Mark needs only `motion`, which the console already ships.
- Hex color props become CSS variables that read our semantic tokens.
- Many components accept only inline style props; wrap them so callers still pass tokens.
- Every ported component needs a reduced-motion branch that keeps the state change and drops
  the travel. Check it with the OS setting on, not just the media query in code.
- Upstream prose uses British spellings in places; paraphrase in US English (the spelling
  gate enforces it).
