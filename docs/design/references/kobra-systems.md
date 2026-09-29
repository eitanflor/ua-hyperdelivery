# Kobra

| | |
|---|---|
| Source | <https://kobra.systems/> - agent-facing index at <https://kobra.systems/llms.txt> (same content as `/install.md` and `/design.md`) |
| Retrieved | 2026-09-28 |
| What it is | A React component library distributed through the shadcn CLI registry. 78 named components (90+ counting variants). |
| License / cost | 10 components install free. The rest need a paid registry token (`KOBRA_TOKEN`) - see <https://kobra.systems/pricing>. **Buy before copying any paid source into this repo.** |
| Stack | React, Tailwind tokens (`bg-muted`, `text-foreground`), `motion`, Tabler icons. Some parts pull in helper packages (`torph`, `input-otp`, Embla, Vaul, kmenu, Loomix, Gooey). |
| Extras | An MCP server (`https://kobra.systems/api/mcp`) and installable skills for motion, sound and design-system migration. |

## Why it is in the library

Kobra is the closest match to the console's own house style: token-driven, quiet by default,
one radius family, motion that is short and asymmetric. Its **Agents** group is a ready
vocabulary for exactly the states the console renders badly today - a model working, a plan
awaiting approval, a question the agent needs answered.

## House style, paraphrased

These are Kobra's eleven style rules in our words. Where one conflicts with ours,
[../principles.md](../principles.md) records the ruling.

1. **Color is information.** Neutrals are achromatic; color arrives through content and four
   status hues of equal lightness. A colored surface must mean something.
2. **Two weights.** Regular and bold. Size and color carry hierarchy; weight is the last
   resort. (Our exception: the italic uppercase stencil lockup for names.)
3. **Small, dense interface text.** 14px body, 13px secondary, headings rarely above 20px,
   line length around 60 characters.
4. **One radius family,** 10px base stepping 4px either way, nested concentrically (child
   radius = parent radius minus the padding between them).
5. **One hairline, then depth.** One border or ~10% ring per surface; further separation comes
   from shadow, not a second heavier line.
6. **Short, asymmetric motion.** Entrances 150-250ms on an ease-out
   (`cubic-bezier(0.23, 1, 0.32, 1)`); exits shorter on an ease-exit
   (`cubic-bezier(0.4, 0, 0.6, 1)`). Animate transform, opacity and filter only. Everything
   answers reduced motion.
7. **Press gives, it does not jump.** The pressed surface scales to ~0.99; the label stays put.
8. **Focus is one ring** that clears 3:1 against the page on its own.
9. **A busy button keeps its word.** The label turns out, a spinner turns in; never swap the
   label for "Saving..." and never disable it (disabling dims the spinner that *is* the state).
10. **Changing numbers are tabular** so counters do not reflow.
11. **Empty and loading states are designed:** a skeleton the size of what is coming, and an
    empty state that says what to do next.

Kobra's usage rules for agents are also worth keeping: install before hand-rolling, restyle
through variants not ad-hoc classes, use tokens never raw palette colors, no inline styles,
write class names out in full so Tailwind can see them.

## Full catalog

### Free (no account)

| Component | What it is |
|---|---|
| `input-otp` | Segmented one-time-code input with a traveling focus ring and success sweep. |
| `navigation-menu` | A collection of navigation links. |
| `video` | Video player with glass controls. |
| `carousel` | Horizontally navigable content, built on Embla. |
| `ai-editor` | A document an agent edits alongside you. |
| `command-menu` | Fast, nested command menu (kmenu). |
| `toast` | Stacked status notifications with progress and actions. |
| `conversation` | Messages from both sides of a chat. |
| `halftone-dots` | An image rebuilt as a field of dots that morph between pictures. |
| `sound` | An audio cue every control can answer a press with. |

### Agents

| Component | What it is |
|---|---|
| `reasoning-steps` | A model working before it answers (pairs with an orb and a text shimmer). |
| `file-diff` | Changes an agent proposes to a file. |
| `image-generation` | A canvas forming while an image generates. |
| `streaming-text` | A reply arriving a token at a time. |
| `inline-citations` | Sources cited inside a reply. |
| `code-block` | Syntax-highlighted code with actions. |
| `task-list` | A task list an agent works through (collapsible, spinner, shimmer). |
| `chat-input` | A composer for prompting an agent, with voice. |
| `plan-card` | A plan an agent is asking to run (steps, keyboard hints, tooltips). |
| `question-card` | A question an agent needs answered before it continues. |
| `message` | A structured conversation message. |
| `message-scroller` | Conversation scrolling with edge controls. |

### Content

| Component | What it is |
|---|---|
| `table` | Rows and columns of structured data. |
| `crm-table` | Accounts with owners, pipeline and odds, in resizable columns. |
| `chart` | Composable data visualizations. |
| `item` | A flexible row for lists and settings. |
| `avatar` | An image or fallback for a person. |
| `badge` | A compact status or category label. |
| `marker` | A labeled point or status marker. |
| `kbd` | Keyboard input and shortcut hints. |
| `attachment` | A compact file attachment. |
| `lightbox` | Photos in justified rows that open with a ripple zoom. |
| `qr-code` | A scannable dot code that ripples when its value changes. |
| `advertisement` | A rotating sponsor slot. |

### Feedback

| Component | What it is |
|---|---|
| `alert` | A callout for important contextual information. |
| `progress` | The completion state of a task. |
| `spinner` | An indeterminate loading indicator. |
| `skeleton` | A placeholder shown while content loads. |
| `empty` | An empty-state layout with guidance. |

### Form controls

| Component | What it is |
|---|---|
| `form` | Validated form composition. |
| `input` | Text input with label, description and attached controls. |
| `input-dissolve` | A field that carries its value away once it is spent. |
| `textarea` | Multiline text input. |
| `button` | A control that triggers an action. |
| `toggle-group` | A two-state control, alone or joined into a bar. |
| `checkbox` | Binary or indeterminate selection. |
| `radio-group` | A single choice from several options. |
| `switch` | Toggle a setting. |
| `slider` | A value along a range, with a liquid handle. |
| `select` | Option picker, styled menu or native. |
| `combobox` | Searchable option picker. |
| `multi-select` | Several values from one list, as chips. |
| `calendar` | Date selection. |
| `color-palette` | A wheel of nineteen swatches. |
| `color-picker` | Gradient and solid picker with draggable stops. |
| `magnetic-dropzone` | A drop target that leans toward the file you are carrying. |

### Layout

| Component | What it is |
|---|---|
| `card` | A surface grouping related content. |
| `accordion` | Stacked disclosure sections. |
| `collapsible` | An expandable region. |
| `aspect-ratio` | Keeps content within a fixed ratio. |
| `logo-carousel` | A wall of logos, a few at a time. |
| `separator` | A visual divider. |
| `scroll-area` | Custom cross-browser scroll container. |
| `resizable` | Panels separated by a draggable handle. |
| `direction` | Provides left-to-right or right-to-left direction. |

### Navigation

| Component | What it is |
|---|---|
| `tabs` | Layered content selected by tab. |
| `breadcrumb` | A hierarchical trail. |
| `pagination` | Controls for moving through pages. |
| `sidebar` | A composable application sidebar. |
| `menubar` | A persistent horizontal application menu. |

### Overlays

| Component | What it is |
|---|---|
| `dialog` | Modal window, plus the alert dialog that confirms. |
| `sheet` | A dialog that enters from an edge. |
| `drawer` | A panel that slides from an edge (Vaul). |
| `popover` | Floating content anchored to a trigger. |
| `hover-card` | Rich content revealed on hover. |
| `tooltip` | A concise label on hover or focus. |
| `dropdown-menu` | A menu opened from a trigger. |
| `context-menu` | Actions from a secondary click. |

## What Hyperdelivery takes

| Kobra component | Hyperdelivery surface | Roadmap phase |
|---|---|---|
| `reasoning-steps`, `task-list`, `streaming-text` | The narrated working state that replaces three dots in Simple mode, and the plan panel | 2 |
| `question-card` | Scout's clarifying questions, and the SME answer-only view | 3 |
| `plan-card` | Gate 2 "what you are approving" summary of Coach's build plan | 3 |
| `inline-citations` | Scout's evidence inline in requirements and replies | 4 |
| `file-diff`, `code-block` | Ref's findings against pull requests (Detailed mode) | 4 |
| `ai-editor` | Later: commenting on or editing an artifact alongside an agent | 4+ (considered) |
| `message-scroller` | "Jump to latest" edge control while a run streams | 2 |
| `toast` | Success receipts ("Gate 1 signed") next to today's error toast | 0 / 2 |
| `empty`, `skeleton` | Teaching empty states; a document skeleton that fills in | 1 / 2 |
| `magnetic-dropzone`, `attachment` | Intake uploads and file chips | 1 |
| `command-menu` | Nested command palette with actions, not just project search | 1 |
| `hover-card` | Crew player card on avatar hover | 1 |
| `crm-table`, `table`, `chart` | Portfolio records table and simple insights | 1 / 6 |
| `sheet`, `drawer`, `resizable` | The unified side-panel system (artifact, context, settings, activity) | 4 |
| `marker` | Station and gate markers on the line canvas | 5 |
| `halftone-dots` | Dithered bot portraits and hero imagery | 6 |
| `progress` | The completeness meter | 0 |

## What it does not take, and why

| Component | Reason |
|---|---|
| `sound` | Considered. An internal tool used in open offices; off by default, revisit on request. |
| `input-dissolve` | Clever, but no Hyperdelivery field is "spent" in a way users would benefit from seeing. |
| `video`, `lightbox`, `carousel`, `logo-carousel`, `advertisement`, `qr-code` | No matching surface. |
| `calendar`, `color-palette`, `color-picker`, `input-otp`, `slider` | No matching input in the product today. |
| `chat-input` voice | Dictation is not a need any persona raised. The `@` and `/` ideas are covered under [beautiful-ui.md](beautiful-ui.md). |

## Porting notes

- Replace Tabler icons with the Phosphor equivalent. One icon family, per
  [../principles.md](../principles.md).
- Map Kobra tokens to ours: `bg-muted` -> `bg-sunken`, `text-foreground` -> `text-fg`,
  `text-muted-foreground` -> `text-fg-muted`, `ring` -> the accent focus ring,
  `--error`/`--warning`/`--success`/`--info` -> our status tokens.
- Kobra's 10px base radius already equals our `--radius-md`. Its ease-out is close to our
  `--ease-out-expo`; its **ease-exit** is new and worth adding as a token.
- Keep the 12px type floor. Kobra's 13px secondary size matches our `text-xs`.
- Paid components: purchase, then install with the registry token. Never paste paid source
  into docs, issues or prompts.
