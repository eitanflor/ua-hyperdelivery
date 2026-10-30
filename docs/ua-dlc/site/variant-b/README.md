# Variant B, polished

The polished build of Variant B (side nav and chat), the direction the owner prefers of the three in
[ux-direction.md](../../ux-direction.md) section 3. It does not close the team vote. These static
screens are the source of the Figma file **HyperDelivery · Variant B**:
<https://www.figma.com/design/TvkJQitUv5BjF9YmgTMGut>. The file lives in the owner's personal Figma
team (Starter plan), not in the Under Armour organization.

Every name, project and number on the screens is invented to show the design.

```
variant-b/
  variant-b.css      shared tokens and components on UA Baselayer (design-system.md), including
                     the project card and the workspace chrome (ws-*) the four workspaces share
  home.html          Home: the composer, Waiting on You, Pick Up Where You Left Off
  inbox.html         Inbox: everything waiting on you, oldest first
  projects.html      Projects: every project and where it is on the line
  new-project.html   New Project: describe it, point at what you have
  project.html       A project: the conversation and its artifact panel
  approval.html      An approval: review and sign a gate
  handoff.html       The handoff to engineering
  figma-prep.js      rewrites a screen for Figma's HTML import (only with ?figma)
```

## Open it

```bash
make site
```

Then open <http://localhost:8766/variant-b/home.html>. Every screen is 1440 wide, the design width.
The four workspaces (New Project, a project, an approval, the handoff) are one 1440 × 1024 window;
Home (1204) and Inbox (1280) grow to their content, and the side nav stays one window tall.

## The Figma file

| Page | What it holds |
|---|---|
| Foundations | Variables: `Primitives`, `Color` (Baselayer roles) and `Layout` (space and radius). 20 text styles in Archivo and Chivo Mono, three elevation effects, and a specimen sheet of all of them |
| Components | 10 logos, 19 icons, Button, Nav Item, Count, Avatar, Status, Notch, Line, Source Chip, Tag and Badge, bound to the variables and text styles, each in a specimen well |
| Screens | The screens above, imported from this folder |

Foundations and Components were built natively through the Figma MCP server (`use_figma`). The
screens are designed here first, because this is where they can be rendered and checked at full
size, and then imported with the MCP server's `html_to_figma`. That import gives plain editable
layers (auto layout, real text in Archivo); it does not link them to the variables or components.

The Starter plan allows three pages per file and one mode per variable collection, so the file has
no dark mode and no separate cover page.

### Status, 2026-10-28

Foundations and Components are done. The seven screens here are final and pass the export check
below. The Screens page holds one test import of Home, made before `figma-prep.js` existed: its
icons are broken and its button outlines are missing, so delete it. The other imports wait on the
Figma MCP call limit, which the personal team's View seat reached on 2026-10-27 (Figma lists 20
calls a month for a View seat; it does not say when the count resets).

When access returns, also bring the file in line with what the screens settled after it was built:

- the Badge text style to 12/16 with no tracking, and avatar initials to 12 px on every size;
- cards and panels are flat (radius 8, a 1px `#D0D0D0` edge, no shadow), so the Card elevation
  effect is unused;
- the workspace pieces the screens now share (folder tabs, panel header, decision bar, composer) as
  components, so the imported screens can be re-linked to them.

Not yet seen in the importer: the side nav's wash below 1024 px on Home and Inbox is a hard-stop
gradient on `.app`, and buttons and tabs round their widths with `calc-size()`. Check both on the
first import.

## Where the screens meet a gap in the spec

- **Projects shows seven cards as 4 + 3.** design-system 9.12 forbids an orphan in a card grid, and
  7.1 makes the side nav's New Project the only start control, so no New Project tile can fill the
  eighth slot. The screens keep 7.1; the spec should say which rule gives way.
- **Handoff draws the Construction choice with the decision bar,** as section 12 describes. Section
  9.28 says that choice is a Decision card (9.13) instead. The spec should pick one.

## Export the screens for Figma

Figma's importer fetches nothing external, and it drops two things these screens use: inset
`box-shadow` rings (the outlines on secondary buttons, chips and the composer) and SVG paint
inherited from the `<svg>` root, along with relative, H/V and arc path commands. With `?figma` in
the URL, `figma-prep.js` rewrites both in the page: rings become borders, with padding or a
negative margin taking up the width so nothing moves, and every SVG shape becomes one absolute
path with its paint written on it. A screen renders the same with and without it.

```bash
uv run python scripts/export_variant_b_for_figma.py            # all seven screens
uv run python scripts/export_variant_b_for_figma.py home.html  # one
```

The script serves the site, has headless Chrome apply the prep at 1440 wide, and writes each
prepared page with `variant-b.css` and the logos inlined (to a temporary folder; `--out` changes
it). Import each file with `html_to_figma`, selector `.app`, under the Screens page (node `1:5`):
POST it to the submit URL the tool returns, with `Content-Type: text/html`.

Each screen loads `figma-prep.js` at the end of its body;
`tests/unit/test_export_variant_b_for_figma.py` fails if one does not.
