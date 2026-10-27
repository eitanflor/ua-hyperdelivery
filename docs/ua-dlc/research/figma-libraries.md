<!-- Point-in-time research, retrieved 2026-10-26 for the UA-DLC plan (round 8: a read-only pass over UA's Figma libraries for the app shell and the project workspace). Node ids and specs were read from Figma that day; the Baselayer libraries change without notice and are mid-migration, so re-read a node before building from it. Screenshots and raw metadata are internal UA design assets, kept outside the repo. See README.md in this folder. -->
<!-- cspell:words QATB Thumnail Titlebar Typestyles keycap raidal -->
<!-- cspell:ignoreRegExp QbamqYWF53D37xGmuxvvXJ -->

# Figma discovery, round 8: an app shell and a chat-first workspace from UA's libraries

> **Superseded in part (2026-10-26):** the concept boards adopted the shell in section 3 with a 248 px side nav
> that collapses to a 64 px rail, New Project as an outlined pill, Help as the "?" menu in a slim top bar, and
> status marks on the Recent rows. Section 3.4's two-path dialog became the Construction decision: a decision
> record made after approval 3 by the Construction owner (AI-driven, AI-assisted with engineers, or not now),
> not a fourth approval. See [operating-model.md section 10](../operating-model.md#10-handoff-and-the-construction-decision),
> [ux-direction.md](../ux-direction.md) and the [Main](../site/concepts/project/Main.dc.html) and
> [Start](../site/concepts/project/Start.dc.html) boards.

Date: 2026-10-26. Read-only pass, done for the owner's ask to make the HyperDelivery concept screens simpler and
more creative ("only copy for use, do not modify anything on Figma"). **Nothing in Figma was created, edited,
uploaded or published.** The only tools used were `whoami`, `get_libraries`, `search_design_system`,
`get_metadata`, `get_screenshot`, `get_design_context` and `get_variable_defs`. Screenshots were downloaded to
local files only.

- **Account:** Eitan Flor, View seat on the Under Armour org plan and on a personal starter team.
- **Figma calls used:** 51 (3 `get_libraries`, 1 `whoami`, 4 `search_design_system`, 14 `get_metadata`,
  17 `get_screenshot`, 11 `get_design_context`, 1 `get_variable_defs`). No rate-limit message was returned.
- **Not repeated from earlier rounds:** Baselayer Web color tokens, the type roles, buttons, SB form fields and the
  UA Brand Logos exports ([baselayer-for-hyperdelivery.md](baselayer-for-hyperdelivery.md)
  sections 2 to 9 and 11; [design-system.md](../design-system.md) sections 3 to 8).
- **Raw metadata** for the three largest pages and the screenshots (index in section 8) are internal UA design
  assets, so they are kept outside the repo.

All node links below are in `00_UA_Baselayer_Library_Web`, file key `QbamqYWF53D37xGmuxvvXJ`, so a link is
`https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=<a>-<b>`.

---

## 0. What this round found, in brief

1. **Baselayer already has a left side navigation.** The account area's `Account Navigation / Desktop`
   ([`9286:10835`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=9286-10835))
   is a 219 px vertical text list with weight-only selection and a 16 px count badge. It is UA's own precedent
   for moving HyperDelivery's primary navigation out of the top bar.
2. **Baselayer already has the "section preview with View All" block and a compact empty state.**
   `Page Preview Section / Desktop`
   ([`11161:102657`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=11161-102657))
   pairs an icon, a title, a count and a "View All" link with content below. Its Empty variant is 192 px tall,
   with no glyph. This is the direct fix for cards like "Shipped Across UA This Week" that hold a whole column of
   whitespace.
3. **UA's loading pattern is a three-dot loader, not a spinner.** `Animation/3Dot_Loader`
   ([`1975:18969`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=1975-18969))
   is three 10 px dots, 12 px apart, 54 × 10 overall, with no rotation. It replaces the rotating 14 px ring in the
   trace playback that the owner saw clipped.
4. **Baselayer has the pieces a chat workspace needs:** a UA snackbar with a Loading state and a timer bar, an
   inline Message banner with a Mini size, a two-segment Toggle, Action Cards, a Menu Stack, dark and light
   tooltips with arrows, dialog headers and footers, a two-choice dialog, a list row with thumbnails, and a 58 px
   search bar with 32 px type.
5. **Baselayer Ignite is the UA consumer mobile app library** (Shop, Bag, Rewards, Loyalty, iOS and Android
   bars). It has a `Sidebar Search Field`, `Loaders`, `Menu` and `Chips`, and its `NEW UA Styles` text styles,
   but no published variables. **The MCP exposes its library key, not its file key,** so its components could be
   listed but not opened or screenshotted. To finish it, the owner needs to share the Ignite file link.
6. **UA's design team already uses an AI coding agent on Baselayer.** The Web library has a page named
   `Icons - Factory Ai Test`
   ([`10035:11256`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=10035-11256))
   holding `Sticker Sheet - Factory Ai Output` and `Icon System • Factory Ai Output`
   ([`13872:244`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=13872-244)):
   a seven-size icon slot (12 to 64 px) with migration notes. The names point to Factory's agent; confirm with
   the Baselayer team. It is a useful internal proof point for the "agentic IDE" logos and the comparison guide.
7. **The community kits have the canonical app-shell components** (Material 3's Navigation Rail, Expanded Rail,
   Navigation Drawer and Side Sheet; Simple Design System's `Sidebar` and `AI Sidebar`; macOS 27's
   `Sidebars - Composed`). They are reference only, not UA sources, and their file keys are not exposed either.

---

## 1. Inventory: every library visible from the Baselayer Web file

`get_libraries` on `QbamqYWF53D37xGmuxvvXJ`, paged at offsets 0, 20 and 40 until it returned no next page. Two
libraries are subscribed, four organization libraries and eight community kits are available. The org list is
complete at four.

| Library | Source | What it is for | For a desktop internal web app | Read this round |
|---|---|---|---|---|
| `00_UA_Baselayer_Library_Web` | Team, subscribed | UA's web design system: tokens, type, components A to Z, CMS modules, page templates (Homepage, PLP, PDP, Cart, Checkout, Account) | **Primary source.** Built for e-commerce, but its account area, messages, snackbar, loaders, toggle, tooltips, dialogs, menus and cards transfer directly | 14 pages surveyed; 11 components specified (section 2.1) |
| `00_Baselayer Ignite - Design System App` | Team, subscribed | UA's consumer mobile app system: iOS 18 and 26 tab bars, Android toolbars, Navigation Bar, Ignite lists, Sidebar Search Field, loaders, chips, badges, loyalty and shop cards, `NEW UA Styles` text styles, `ignite_icon` set | **Partly.** Mobile-first and consumer-shaped; useful for type naming, icons and a few atoms. No desktop shell | Component and style search only; file not reachable (section 2.2) |
| UA Brand Logos | Organization | Logo, lockups, monogram, signatures, tag, echo, colors | Yes, for the product lockup (done in round 5) | Not repeated |
| UA Baselayer Typestyles - Mobile | Organization | Mobile type styles | No. A "heading" style search returned nothing | Search only |
| RUN Type Apple Watch | Organization | Type for the Apple Watch run app | No | Listed only |
| File Resources | Organization | Figma housekeeping: `Project Title`, `Screen Info`, `Thumbnail Icon`, `Thumnail Logo / MapMyRun` (2023) | No, except as a file-cover convention if HyperDelivery ever ships Figma files | Search only |
| Material 3 Design Kit | Community | Google's Material 3: Navigation Rail, Navigation Rail: Expanded, Navigation Drawer, Side Sheet, App bar, Search bar, Split button, `Examples/Detailed view-Web` (a layout template with app bar and navigation regions), and an M3 snackbar | **Reference for structure** (rail, drawer, side sheet behavior). Not a UA source | Search only (section 2.3) |
| Simple Design System | Community | Figma's own sample system: `Sidebar`, **`AI Sidebar`**, `Navigation Pill List`, `Navigation Button List`, `Search`, `Dialog Body` (overlays capped at 600 wide) | Reference for an AI sidebar and simple nav lists | Search only |
| macOS 27 | Community | Apple's macOS kit: `Sidebars - Composed`, `Examples/Windows/Default with Titlebar and Sidebar`, `Outline View`, `Search Field`, alerts | Reference for a calm desktop sidebar and outline lists | Search only |
| macOS 26 | Community | The previous macOS kit | Superseded by macOS 27 | Listed only |
| iOS and iPadOS 26, iOS and iPadOS 27 | Community | Apple's mobile kits | No | Listed only |
| watchOS 26, visionOS 26 | Community | Apple's watch and spatial kits | No | Listed only |

---

## 2. Per-library findings

### 2.1 `00_UA_Baselayer_Library_Web`: the pages that matter for an app

The file's pages, in order: Cover, Fonts, Colors, Grid & Spacing, then **Components A to Z** (Accordion (empty),
App Branch Banner, Aspect Ratio, Breadcrumbs, Buttons, Cards, Chips & Badges, Controls, Cookies Banner, Dialogs,
Email, Footer, Form Fields, Logos, **Icons - Factory Ai Test**, Icons - Duplicate WIP Fallback Ai, Loading &
Progress, Loyalty Rewards (empty), Menus & Lists, Message, Navigation, Pagination, Product Tiles, Ratings, **Rec
Zone (MCP)**, Search, Snackbar, Tooltip, QATB Modal), CMS Modules A to Z, Device Mockups, then **Nested
Components by Page** (Homepage, PLP, PDP, Cart/Bag, Checkout, **Account**), Components for Brand, Archive,
Internal. Two page names (`Icons - Factory Ai Test`, `Rec Zone (MCP)`) show the design team already works with AI
agents and MCP.

**Tokens these components bind** (`get_variable_defs` on the Message, plus the variables named in the
generated code):

| Variable | Value | Notes |
|---|---|---|
| `size-0` | 0 | |
| `size-3xs` | 4 | Message radius |
| `size-2xs` | 8 | Label-to-badge gap; menu and card radius |
| `size-xs` | 16 | Card and message padding; gaps |
| `size-sm` | 24 | Section gap in the account preview |
| `size-md` | 32 (16 on mobile) | Gap between message links |
| `size-2md` | 40 | Dialog header padding |
| `Surface/surface` | #FFFFFF | |
| `Surface/surface-container-high` | #F0F0F0 | Message fill, search field fill |
| `Surface/on-surface` | #1D1D1D | |
| `Surface/on-surface-var` | #444444 | Message links, breadcrumb, accent edge |
| `ui-elements/primary` | #1D1D1D | Secondary button label |

Named color styles in use: Black #1D1D1D, Gray 2 #F0F0F0, Gray 3 #D0D0D0, Gray 4 #949494, Gray 5 #5F5F5F,
Gray 6 #444444, Red #DC0019. **Every web component read this round binds `(Old)` text styles** (Neue Plak UA and
Neue Plak UA Text: `(Old) H6/Bold` 16/24, `(Old) Body/SemiBold` 14/20 at weight 600, `(Old) Subtext/Regular`
12/20, `(Old) Legal/SemiBold` 10/16), so the library is mid-migration to the new type names.

#### Account Navigation: UA's own side nav

`Account Navigation / Desktop`, [`9286:10835`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=9286-10835),
eight state variants, one per destination (My Dashboard, Order History, Saved Items, Rewards Locker, Profile &
Settings, Payment Methods, Addresses, Preferred Sizes). Section [`11063:90255`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=11063-90255);
the mobile version is a stack of 393 × 64 rows ([`9284:10384`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=9284-10384)).

| Part | Spec from Figma (`9286:10836`) |
|---|---|
| Panel | 219 wide, `#FFFFFF`, a vertical stack, **24 px between items**, 24 px right padding, no border |
| Item (`_Menu Title`, [`11063:91466`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=11063-91466)) | 16/24 Neue Plak UA. **Selected:** Bold, `#1D1D1D`. **Unselected:** Regular, Gray 5 `#5F5F5F`. No fill, no bar, no icon |
| Count | Inline in the label ("Saved Items (12)") |
| Badge (`ic/Misc/Alert`) | A 16 px black circle (`#1D1D1D`, radius 8) with a white 10/16 SemiBold number, 8 px after the label (`size-2xs`) |

The pitch is 48 px (a 24 px line plus 24 px gap). It is calm, typographic and has no chrome, which is exactly
the feel ChatGPT and Claude Desktop get from their sidebars.

#### Page Preview Section and the compact empty state

`Page Preview Section / Desktop`, [`11161:102657`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=11161-102657),
variants Stack, Single and Empty. Section [`11142:41122`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=11142-41122).

| Part | Spec from Figma (`11161:102763`, Empty) |
|---|---|
| Block | 922 wide (an 8-column span), `Surface/surface`, 24 px (`size-sm`) between the header and the content |
| Header | Left: a 24 px icon (`ic/md-black/OrderHistory`), 16 px gap, the title in 16/24 Bold, 8 px gap, the 16 px count badge. Right: "View All" text link, 14/20 SemiBold, Gray 5 |
| Content, Stack | Two cards side by side (product image left, "4 items", a 24 px Bold title, a price line) |
| Content, Single | One bordered panel with four media tiles |
| **Empty** (`_Empty Account Section / Desktop`, [`11142:41025`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=11142-41025)) | 922 × 144, centered, 16 px vertical padding, 16 px gap. Title 16/24 SemiBold ("Nothing saved–yet."), 4 px, body 14/24 Regular, then `Btn/Secondary/Black` 44 tall, 212 wide. **No glyph.** The whole Empty block, header included, is 192 px |

The account dashboard is therefore a **left nav plus a column of preview sections, each with View All and a
short empty state.** That is the Home HyperDelivery needs.

#### Order History List Item: a row with thumbnails

`Order History List Item / Desktop`, [`11195:102992`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=11195-102992).

| Part | Spec from Figma (`11195:102993`) |
|---|---|
| Row | 920 wide, `Surface/surface`, a 1px Gray 3 bottom rule, 24 px vertical padding, 24 px right padding, items spread |
| Thumbnails | Up to four 56 px wide tiles 8 px apart on Gray 2, the fourth able to show "+1 Item" |
| Details | 32 px after the thumbnails: a 14/20 Bold first line, then 14/24 Regular lines |
| Right | A status word in 14/20 SemiBold Gray 5, then a 16 px caret (`ic/sm-black/Caret Right`) |
| Variant | Returns & Exchanges adds a middle column with a 16 px glyph and a word ("Exchange") |

#### Message: the inline banner

`Message/Desktop`, [`11289:1816`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=11289-1816);
the option guide is [`12918:3369`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=12918-3369).

| Part | Spec from Figma (`11289:1817`, Default Gray, fill, 14pt) |
|---|---|
| Box | 840 wide, `Surface/surface-container-high` #F0F0F0, 16 px padding, radius 4 (`size-3xs`), 56 tall on one line |
| Icon | A 16 px alert glyph in a 24 px tall slot, 8 px before the text |
| Text | 14/24 Regular, `Surface/on-surface` |
| Links | Up to three, 14/20 SemiBold, `Surface/on-surface-var` #444, 24 px apart, right-aligned |
| Options | Type: Default (Gray), Alert (Yellow), Error (Red). Size: Default (14pt) or **Mini (12pt), 36 tall**. Background fill or text only. Close X (fill variant only). **accentEdge: a 4 px left bar in `on-surface-var`** |

#### Snackbar: the UA toast, with a Loading state and a timer bar

The UA snackbar is `Snackbar`, [`9192:25593`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=9192-25593),
with its own spec sheet ([`9505:91665`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=9505-91665):
Anatomy, Properties, Layout and spacing [`9505:92030`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=9505-92030)).
The page also holds an imported Material 3 snackbar ([`9192:26494`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=9192-26494)),
which is not UA-styled; ignore it.

| Part | Spec from Figma |
|---|---|
| Box | **344 fixed wide**, 56 tall (one and two lines), `#1D1D1D`, horizontal, top-left aligned, hugs vertically |
| Padding and gaps | 8 px top and bottom, **16 px left and right**, 16 px between items |
| Leading media | An optional 32 × 40 product thumbnail |
| Text | 14 px, white, one line recommended |
| Action | An underlined text link ("Action") with 8 px vertical padding |
| Close | An optional 16 px X |
| States | Default; **Loading**; Dark mode, which inverts to a white box with a 1px gray edge and black text |
| Timer | "Unsave animation for Saved List": a **4 px red bar along the bottom edge that shrinks** (288, 144, 48 px wide in the three frames) while the undo window runs |

#### Loading & Progress: the three-dot loader

`Animation/3Dot_Loader`, [`1975:18969`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=1975-18969),
and `Animation/3Dot_Loader/FullScreen` ([`1993:19962`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=1993-19962)).

| Part | Spec from Figma (`1975:19007`) |
|---|---|
| Dots | Three 10 px circles, **12 px apart, 54 × 10 overall** |
| Frame 1 | `#949494` at 30%, `#5F5F5F` at 60%, `#444444` at 100% |
| Animation | Three frames that move the dark dot left to right; a DarkMode set of three more |
| Full screen | The loader centered on a `#F5F5F5` page, 1440 × 1024 |

That is the whole of UA's loading vocabulary on this page: no spinner, no ring, no progress circle (Ignite has a
radial progress bar for loyalty, which is a meter, not a loader).

#### Controls/Toggle: the segmented control

`Controls/Toggle`, [`109:8205`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=109-8205),
states Default, Focus, Hover, Pressed, Active-Side Left or Right.

| Part | Spec from Figma (`0:4071`) |
|---|---|
| Frame | 360 wide, a 1px Gray 3 `#D0D0D0` border, radius 4 |
| Segment | 32 tall, 16 px side and 6 px vertical padding, a Gray 3 divider |
| Label | 12/20 Neue Plak UA Text **Regular on both segments** |
| Selected | `#1D1D1D` fill, white label |
| Focus | The variant is 40 tall: a blue ring outside the frame |

#### Tooltip

`Misc/Tooltip`, [`119:9300`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=119-9300):
three styles (Default black, DarkMode default, Light white), seven arrow directions (top centered,
left and right; bottom left and right; left; right), 172 to 288 px wide, centered multi-line text, square
corners. Light and arrowed variants make a ready first-run coach mark.

#### Menu Stack and Action Card: lists of choices

- **Menu Stack**, [`9284:10737`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=9284-10737):
  styles Compact, 4px Stack, 16px Stack, 24px Stack, 16px Grid, 24px Grid. Compact
  ([`9284:10738`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=9284-10738)):
  361 wide, white, radius 8, rows with 16 px padding, a 16/24 Bold title and a 16 px caret, so each row is 56 tall.
- **Action Card**, [`9284:10703`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=9284-10703):
  styles Outline, White, Gray, 361 × 76. Outline ([`9284:10704`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=9284-10704)):
  white, a 1px Gray 3 border, radius 8, 16 px padding; a 24 px icon (instance swap), 16 px gap, a 16/24 Bold title
  with an optional 16 px count badge, an optional 12/20 Gray 5 subtitle, then on the right an optional 14/20
  SemiBold value (red "XXX pts" for loyalty) and a 16 px caret. Its annotation says the badge "represents actions
  or notifications available on a specific page".

#### Dialogs

- **Desktop header and footer**, [`8236:18727`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=8236-18727):
  header ([`8236:18726`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=8236-18726))
  560 wide, white, 40 px top and side padding and 8 px bottom (`size-2md`, `size-2xs`), the title in 24/32 Bold
  with 0.5 px tracking, a 16 px X absolutely placed top-right inside 28 px top and 24 px side padding; options for
  sticky (gains a shadow), back arrow and a centered icon-plus-title. Footer variants hold one centered primary
  pill or a secondary and primary pair, sticky or not.
- **Two-choice dialog**, `Dialog/WithAsset-WIP` desktop
  ([`13415:72401`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=13415-72401)),
  800 × 432: "Member Checkout" with two pills (Create Account, Log In), a rule, then "Guest Checkout" with one
  wide pill. A ready layout for a decision between two paths.
- Desktop dialogs are 448 to 560 wide (800 for the two-choice layout); the corners render square in every screenshot.

#### Search

`Form/Desktop/SearchResults/SearchBar`, [`3734:21360`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=3734-21360).
Active Filled ([`3734:21373`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=3734-21373)):
827 × 58, Gray 2 `#F0F0F0`, **radius 11**, 16 px left padding, a 24 px search glyph, 16 px gap, the query in
**32/40 Bold** with 0.5 px tracking, a 28 px caret line, then a 16 px clear X in a 48 px hit area. The header search
in `Form/Search/Nav` ([`114:9284`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=114-9284))
opens a recent-searches and suggestions panel (296 wide on mobile).

#### Breadcrumbs

`Breadcrumb` desktop, [`10927:6`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=10927-6):
crumbs in 14/20 SemiBold `on-surface-var` #444, separated by a "/" in 14/24 Regular, **4 px gaps**, the last crumb
styled like the others.

#### Navigation (top)

`Navigation - Top`, [`124:9358`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=124-9358):
desktop headers at 1440 and 1600 (104 tall; 64 for checkout), 1280 and 1024 breakpoints with collapsing search,
and 56 px mobile headers. Already the source of `design-system.md` section 7.1; not re-read.

#### Icons and the Factory AI icon system

The icon page holds 654 symbols in fixed size families (`ic/xs` 12, `ic/sm` 16, `ic/md` 24, `ic/lg` 32,
`ic/xl` 40, `ic/xxl` 48) plus flags and two animated icons (an SMS alert wiggle and a gift-box shake). Glyphs a
chat shell needs already exist: `ic/sm-black/Chat` (`0:13466`), `ic/sm-black/Attachment` (`0:13096`),
`ic/sm-black/Upload` (`0:2966`), `ic/sm-black/Menu` (`0:2738`), `ic/sm-black/settings` (`9192:25508`),
`ic/sm-black/OrderHistory` (`0:2764`), `ic/sm-black/AccountProfile` (`0:13280`), and `ic/md-black` 24 px versions of
Chat, Order History, Account Profile and settings.

`Icon System • Factory Ai Output`, [`13872:244`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=13872-244),
defines **`Icon / Sized`: one slot, seven sizes (XS 12, SM 16, MD 24 default, LG 32, XL 40, XXL 48, 2XL 64)**, on
light and dark surfaces. Its rules: XS is for compact non-interactive detail, 2XL is an opt-in display size, keep
square glyphs proportional, "Icon canvas size is separate from a control's accessible hit area", give icon-only
controls an accessible name, and do not rename or detach published masters. Its audit lists 11 duplicate name
groups and 31 placeholder flags left for a separate release. `Sticker Sheet - Factory Ai Output`
([`13742:47041`](https://www.figma.com/design/QbamqYWF53D37xGmuxvvXJ/00_UA_Baselayer_Library_Web?node-id=13742-47041))
is the companion sheet (765 × 10884).

#### Not opened this round

Form Fields, Chips & Badges, Pagination, Product Tiles, Ratings, Rec Zone (MCP), the CMS modules and the nested
page templates other than Account. Form fields and chips were covered in earlier rounds.

### 2.2 `00_Baselayer Ignite - Design System App`

Found through `search_design_system` scoped to library key `lk-505e6afa…3605`. Search returns component keys and
paths but no file key, so no node ids or screenshots were possible.

| Need | What Ignite has (component or set key) | Fit for a desktop app |
|---|---|---|
| Navigation | `Navigation Bar` (sets `ea98036…`, `208eb5a…`); `Tab Bar` (`7f23e59…`, `4010602…`); `TabBar-iOS26`, `TabBar-iOS26-Light`/`-Dark`, `TabBar-iOS18-Light`/`-Dark`, `Ignite_TabBar-iOS26`; `ToolBar_Android_Light`/`_Dark`; `Bottom_Nav` (`0277a68…`); `Page Headers` (`28456a9…`, `f47893d…`); `Section Headers` (`51c7c92…`); `iOS_Headers` | Mobile bars only; no side nav or rail |
| Search | **`Sidebar Search Field`** (`3f8aea7…`); `❖ Ignite_Search_Bar` (`f116626…`); `Search` | The sidebar search field is the one desktop-shaped atom; worth opening once the file is shared |
| Lists | `❖ Ignite List_Regular`, `_Tall`, `_Max` for iOS and Android; `Row with Swipe Actions`; `TableView`; `Building Blocks/Menu list item` at 0, -2 and -4 density; `Menu` (set `59223b9…`, "Menus display a list of choices on a temporary surface") | Menu and density variants are Material-derived and useful; swipe rows are not |
| Inputs | `Input Field_IOS`, `Input Field_Android`, `iOS_input fields`, `Keyboard - iPhone`, `Controls/Checkbox_Animation` | No |
| Status | `Loaders` (`e4039f2…`), `LazyLoader`, `base_raidal_progressBar [0 -> 100]`, `Progress Bar Loyalty`, `Badge`, `Notification_Badge`, `Badging`, `Chips` (`1653d07…`) | Loaders and badges worth checking against the web three-dot loader |
| Cards | `Card`, `Hero Overlay`, `Carousel Main`, `Item Card Landscape`, Shop, Sport, Rewards, Loyalty, DYF and My Orders cards | Consumer content; no |
| Icons | `❖ ignite_icon` (set `de318a0…`) including `icon/ua_logo`, `icon/search`, `icon/chevron_left`, `icon/filter_applied`, `icon/placeholder` | The `ua_logo` and chevrons are useful |
| Spacing | Spacer components named like `(016px) $spacing-hor-ver-medium` | Confirms a 16 px "medium" step |
| Type | **`NEW UA Styles`**: Heading 4XL, 3XL, 2XL, XL, LG, MD, SM, XS; Body LG, MD, SM, XS in Reg and Bold; Label XS. Also `Old (NP) Styles` (Neue Plak: Body Small, Medium, Large, with semi bold) | The new names match the naming `design-system.md` 4.2 already uses |
| Variables | None published (searches for surface, spacing and radius returned nothing) | Tokens live in Baselayer Web |

**Next step:** ask the owner for the Ignite file link (any `figma.com/design/<key>/...` URL from that file), then
spend about five calls on `Sidebar Search Field`, `Loaders`, `Menu`, `Chips` and `Badge`.

### 2.3 Community kits (reference only)

| Kit | Component | What its own description says |
|---|---|---|
| Material 3 | `Navigation Rail` (`f006d1f…`) | "A side navigation component that displays three to seven app destinations and, optionally, a floating action button... can serve as the sole navigation component on larger screen sizes" |
| Material 3 | `Navigation Rail: Expanded` (`e07e5a0…`) | Recommended "for apps with 5 or more top-level destinations, apps with 2 or more levels of navigation hierarchy"; can be permanent or opened and closed by a menu icon |
| Material 3 | `Navigation Drawer` (`2e423d5…`) | Same guidance as the expanded rail |
| Material 3 | `Side Sheet` (`bd13815…`) | "Supplementary content or actions to support tasks as part of a flow... anchored on the right edge of larger screens"; standard or modal |
| Material 3 | `App bar` (`23a2048…`) | Describe the current page with 1 to 2 essential actions; fill on scroll |
| Material 3 | `Examples/Detailed view-Web` | A web layout template with app bar and navigation regions |
| Simple Design System | `Sidebar`, `AI Sidebar` (`dc7913d…`), `Navigation Pill List`, `Navigation Button List`, `Dialog Body` (overlays max 600 wide) | No descriptions |
| macOS 27 | `Sidebars - Composed`, `Examples/Windows/Default with Titlebar and Sidebar`, `Outline View`, `Search Field`, `Section Header`, `Item` | No descriptions |

Use these for behavior (rail versus expanded, standard versus modal side sheet), never for visual style. Public
M3 guidance (not read from the kit) puts a collapsed rail at about 80 to 96 dp and an expanded rail at 220 to
360 dp, which brackets Baselayer's 219 px account nav.

---

## 3. What this means for HyperDelivery: patterns to adopt

The owner's direction: a ChatGPT- or Claude-Desktop-simple tool for business users; a collapsible left side nav; a
chat-first home; a project workspace with the conversation on the left and an artifact panel on the right; the
build stops at Inception (Ideation's output is a visual mockup, Inception's is a prototype on a hosted sandbox
with dev data, and Construction on production data is a later, separate decision). Figma values are marked
**(Figma)**; everything else is a proposal built on them.

### 3.1 The shell: a collapsible left side nav replaces the top-bar navigation

| Zone | Spec |
|---|---|
| Nav, expanded | 240 wide: Baselayer's 219 list plus a 16 px left inset, rounded up to the grid. `surface`, a 1px `outline-variant` right rule. Holds the UA lockup at the top (moved from the top bar) |
| Nav, collapsed | 64 wide: a 24 px icon (Baselayer `Icon / Sized` MD, **(Figma)** default) centered in a 40 px target. Tooltips (Baselayer Light tooltip, right arrow) name each item. The collapse toggle is a 32 px ghost with `chevron_left` at the top; the state is remembered per viewer |
| Item | 40 tall with 8 px between items, so the pitch stays **48 (Figma)**. Label 16/24: **selected Bold `#1D1D1D`, unselected Regular `#5F5F5F` (Figma)**, with a `surface-container-high` hover fill (radius 4) added for a clickable row. A 24 px icon 12 px before the label |
| Count | **The 16 px badge 8 px after the label (Figma)**, except Inbox, which keeps HyperDelivery's red count (HD-R1; see conflict 3) |
| Order | **New Project** (a 44 px black pill, the only one in the nav), Home, Inbox, Projects, Library; a divider; **Recent** (the five most recent projects, one line each, the stage as a 12/16 word, like a chat history); then pinned to the bottom: Help, Admin (role-gated) and the avatar with the account menu |
| What leaves | The top bar's primary navigation, the workspace switcher (moves into the account menu and the composer), "Start a Project" (becomes New Project), and the 240 px search launcher (becomes a 32 px search row in the nav with the ⌘K keycap) |
| Page header | A slim 56 px band per page: the breadcrumb (conflict 6 for its type), the title, at most one action. Project pages add the line |

The result is one navigation surface on the left, as in ChatGPT, Claude and Gemini, and a page that starts with
its own content.

### 3.2 A chat-first Home

| Block | Spec |
|---|---|
| Column | A centered 720 column (the reading cap of 680 plus padding) |
| Greeting | Heading XL "What should we build?" and one Body SM line naming the workspace |
| Composer | Borrow the **search results bar (Figma):** a Gray 2 `#F0F0F0` field, 16 px left padding, a 24 px glyph, 16 px gap, at least 58 tall and growing with the text. Normalize its 11 px radius to the system's 8 and its 32/40 type to Body MD 16/24 once someone types; keep the 32/40 for the placeholder only if Brand wants the bold search feel. Footer actions: Add Files (`ic/sm-black/Attachment`), Add a Link, the workspace picker, Continue |
| Starters | **Action Cards, Outline (Figma):** a 2 × 2 grid of 352 × 76 cards, 16 px gaps, each a 24 px icon, a 16/24 Bold title ("Flag Late Vendor Invoices") and a 12/20 Gray 5 subtitle ("Finance, from the AP aging report") |
| Waiting on you | One **Page Preview Section (Figma)**: icon, "Waiting on You", the count, "View All". Up to three Inbox rows. **Hidden when empty**, not replaced with an empty card |
| Continue | A second preview section, "Continue Where You Left Off", with up to three **list rows with thumbnails (Figma, Order History item):** the mockup or prototype thumbnail at 56 wide, the project name in 14/20 Bold, the stage and next step in 14/24, the status word and a caret on the right |
| Removed | "Shipped Across UA This Week". If leadership wants it, it becomes a Library or Portfolio section with View All, or one Body XS line under the greeting ("12 projects shipped across UA this week"), never a tall card |

Rule for every screen: **a section that has nothing to show is either hidden or a 144 px Baselayer empty
section; it never holds open a column.**

### 3.3 The project workspace: conversation left, artifact panel right

| Zone | Spec |
|---|---|
| Layout | The nav collapses to 64 when an artifact opens. Conversation column: flexible, at least 480, messages capped at 680. Artifact panel: an **M3 standard side sheet** pattern anchored right, 50% of the remaining width with a 560 minimum and a draggable 1px divider; full-width with Escape back |
| Page header | Breadcrumb "Projects / `<Project>`", the title, the line (the stage strip) across both columns, and the one action |
| Messages | Assistant and teammate turns in Body MD 16/24. Each output appears as an **Action Card, Outline (Figma)** in the stream: the artifact-type icon, its name ("Brief", "Mockup", "Tech Design"), a subtitle ("Version 3, updated 2m ago"), a caret. Clicking opens it in the panel, like Claude's artifacts and ChatGPT's canvas |
| System notes | **Message, Mini 12pt, fill, Default Gray (Figma),** 36 tall, for events in the stream ("Maya approved the brief."), with one link ("View Approval") |
| Agent working | A status line in Body SM plus the **three-dot loader (Figma)**: "Drafting the tech design" and the 54 × 10 dots. No ring spinner anywhere |
| Background work | **The UA snackbar's Loading state (Figma),** 344 × 56 bottom-left: "Building the prototype in the sandbox", then Default with "Open" when done |
| Artifact panel header | Baselayer **dialog header (Figma)** geometry, tightened: the artifact name in 20/24 Bold (not 24/32 with tracking, conflict 9), a version select, a **Toggle (Figma)** to switch views ("Preview | Source" for documents, "Mockup | Prototype" once Inception has both), Share to Teams, Open Full Screen, and the 16 px X |
| Artifact list | A segmented control at the top of the panel switches to "All Artifacts": a Menu Stack (Figma) grouped by stage: Ideation (Research, Brief, Mockup) and Inception (Requirements, Stories, Tech Design, Test Plan, Tickets, Prototype). Construction rows show as "After Handoff" in `on-surface-variant`, so the stop at Inception is visible |
| Provenance | Every mockup and prototype keeps the provenance strip ("Synthetic data" or "Dev data in the sandbox"), drawn as a Message with fill (see conflict 11 for the edge) |
| Composer | Pinned to the bottom of the conversation column, the same box as Home, at least 58 tall |

### 3.4 The end of Inception: a two-path decision

Use the **two-choice dialog layout (Figma, `13415:72401`)** for the handoff the owner described: once the
prototype is accepted, one section reads "Hand Off to Engineering" (AI-assisted build on production systems, a
secondary and a primary), a rule, and the other reads "Continue AI-Driven" (requires the production approval
path), each with one line on what changes when the work touches production data. It keeps the human gate and
makes "we stop here for now" a visible, deliberate state rather than a missing stage.

### 3.5 Overlays and feedback

- **Toasts:** the UA snackbar (344 × 56, 8 and 16 padding, underlined action, optional X). For "Undo" after a
  signature, keep the shrinking 4 px timer bar but in ink, not red (conflict 5).
- **Coach marks for first run:** the Light tooltip with an arrow, one per step, to explain the nav, the composer
  and the artifact panel to a business user once.
- **Inline problems:** Message, Default fill, with one link ("Reconnect Snowflake").

---

## 4. Creative ideas the libraries enable that the concept screens do not use yet

1. **The account dashboard as the template for Home.** Baselayer already composes a left nav with stacked preview
   sections, each with View All and a 144 px empty state. Home becomes a UA-native page instead of a dashboard of
   cards.
2. **Weight-only navigation.** No pills, fills or bars: Bold ink for here, Gray 5 for elsewhere. It is the
   calmest nav state in UA's system and it reads like the AI products the owner cited.
3. **Artifacts as Action Cards in the conversation.** One familiar card per output, opening the side panel; the
   chat becomes the project's table of contents.
4. **Thumbnails on project rows.** The Order History row's 56 px tiles become each project's latest mockup or
   prototype frame, so Projects and Home show work, not just status words.
5. **The three-dot loader as the "thinking" indicator,** inline in the stream, in trace rows and in the full-screen
   app load. It is UA's own motion and it never clips.
6. **A snackbar that tracks long work.** The Loading state plus a later "Open" action gives background jobs
   (building the sandbox, running tests) a quiet, UA-styled home.
7. **The Toggle as the view switch** between Mockup and Prototype, or Chat and Artifact on narrow screens.
8. **Mini messages as the activity log inside the chat,** replacing a separate Activity feed for most people.
9. **A big, bold prompt field.** The search results bar's 58 px Gray 2 field with 32/40 Bold placeholder text is the
   most "UA" input in the library and a strong, simple Home hero.
10. **Arrowed Light tooltips as a three-step first-run tour.**
11. **The two-choice dialog for the path-to-production decision** (section 3.4).
12. **Native UA glyphs for the shell** (Chat, Attachment, Upload, Menu, Settings, Order History, Account) at
    Baselayer's seven icon sizes, if the icon decision is revisited.
13. **An internal proof point:** UA's design team has already let an AI agent (named Factory AI in the file)
    produce a governed Baselayer icon system with migration notes. That is HyperDelivery's thesis, AI output with
    human review inside UA's standards, already happening in UA's own design library.

---

## 5. Conflicts with `design-system.md`

| # | Topic | `design-system.md` says | Figma shows | Suggested ruling |
|---|---|---|---|---|
| 1 | Navigation placement | 7.1: primary navigation in the 56 px top bar | Baselayer's account area uses a left vertical nav (`9286:10835`) | Move to the left side nav (section 3.1). Rewrite 7.1 and 7.2; log the decision |
| 2 | Selected nav state | 7.1: Bold `on-surface` plus a 2px `outline` bar on the bottom edge | Side nav: Bold `#1D1D1D` versus Regular `#5F5F5F`, no bar or fill | Weight only, plus a hover fill for clickable rows |
| 3 | Count badge | 7.1 and 9.7: the Inbox count is red (HD-R1) | Baselayer's badge is a 16 px black circle, 10/16 SemiBold white | Black badge for ordinary counts; keep red only for "waiting on you" (Inbox), as HD-R1 says |
| 4 | Segmented control | 9.11: 32 px overall, 12/16 labels, selected label Bold, `outline-variant` border, hover `surface-container-high` | 32 px segments inside a 1px border (34 overall), 12/20 labels, **Regular on both segments**, Gray 3 `#D0D0D0` border, a 40 px Focus variant | Match Figma: 12/20 Regular, Gray 3 border. Decide whether the selected label stays Regular |
| 5 | Toast | 9.18: at least 44 tall, 16 left and 8 right padding, a 16 px glyph, an underlined 36 px Undo, radius 4 | 344 fixed wide, 56 tall, 8 top and bottom and **16 left and right**, an optional 32 × 40 thumbnail, an underlined text action, an optional X, a Loading state, a dark-mode inverse, **a red 4 px timer bar** | Adopt the Figma geometry and the Loading state. Draw the timer bar in ink: red would break HD-R1 |
| 6 | Breadcrumb | 7.2: Body XS 12/18 `on-surface-variant`, " / " with 8 px gaps, the last segment plain text | 14/20 SemiBold `#444` crumbs, "/" in 14/24 Regular, 4 px gaps, the last crumb styled the same | Keep HD's 12/18 for density, but take Figma's 4 px gaps, or adopt Figma whole if Brand prefers. Either way, log it |
| 7 | Empty state | 9.19: 64 × 24 px padding, a 48 px glyph, a Heading SM title, one Body SM line up to 360, a Compact secondary | No glyph, 16 px vertical padding, 16 px gap (4 between title and body), a 16/24 SemiBold title, a 14/24 body, a 44 px secondary 212 wide; 144 tall | Adopt the compact Baselayer empty section in panels; keep the glyph version only for whole-page empties |
| 8 | Weight 600 | 4.5 bans weight 600 in UA Text | Baselayer uses SemiBold 600 for text links (`Btn/TextLink/General`), status words, badge numbers and empty titles | 600 is part of Baselayer; the ban exists because the Archivo stand-in ships only 400 and 700. Note this in 4.5 so the production font can use 600 where Baselayer does |
| 9 | Letter-spacing | 4.5 bans any letter-spacing | Dialog titles 24/32 and the search query 32/40 carry 0.5 px tracking | Keep the ban for the stand-in fonts; note Baselayer's 0.5 px on large Bold for the production font |
| 10 | Dialog radius | 6.1 and 9.18: dialogs at radius 8 (proposed) | Desktop dialogs render square; the header is 560 wide with 40 px padding | Square dialogs match "square is the brand motif"; consider 0 for dialogs and keep 8 for menus and cards (the Menu Stack and Action Card are 8 in Figma) |
| 11 | Side stripes | 6.2: "No colored side stripes anywhere" | Message has an optional 4 px `accentEdge` on the left | Keep the ban (the edge stays off); the provenance strip keeps its top rule |
| 12 | Body line height | 4.2: Body SM 14/20 for UI text | Message text, empty-state body and list rows use 14/24 (`Body/Regular`) | Use 14/24 for sentences in banners and empty states; keep 14/20 for dense rows |
| 13 | Loading | 9.19: skeletons, no spinner; "loading dots" for a wait on another system | The three-dot loader: 3 × 10 px dots, 12 px apart, 54 × 10 | Consistent. Name the exact component in 9.19. The trace playback still uses a rotating 14 px ring (`Activity.dc.html` lines 39 to 41, 617 and 662): replace it with the dots |
| 14 | Search | 7.1: a 240 × 36 launcher, radius 4 | The search results bar is 58 tall, radius 11, 32/40 Bold | Keep a small search row in the nav; borrow the large bar for the Home composer, at radius 8 |
| 15 | Menu rows | 9.18 and 9.23: menus with 32 px rows in Label SM | Menu Stack rows are 56 tall (16 padding, 16/24 Bold) at radius 8 | Different jobs: 32 px rows for dropdown menus; the Menu Stack for navigational lists (the artifact list, starters) |
| 16 | Icons | Section 10: Phosphor, mostly at 16 px | Baselayer's `Icon / Sized` has seven sizes with **MD 24 as the default**, and UA glyphs for chat, attachment, upload, menu and settings | Use 24 px icons in the side nav and 16 px inline. Keep Phosphor for now; list the UA glyphs as the swap target |
| 17 | Type names | 4.2 uses Heading XL to XS, Body MD to XS, Label SM and XS | Web components still bind `(Old)` styles; Ignite has `NEW UA Styles` Heading 4XL to XS, Body LG to XS, Label XS | No change; note that 4.2's names follow Ignite's new naming, and that Label SM is HD's own addition |

---

## 6. Gaps and next steps

1. **Ignite file link.** Needed to open `Sidebar Search Field`, `Loaders`, `Menu`, `Chips` and `Badge`. About
   five calls.
2. **Community kits.** Not reachable by node through the MCP; use their public documentation for behavior.
3. **Not opened:** Form Fields, Chips & Badges, Pagination, Product Tiles, Ratings, Rec Zone (MCP), CMS modules,
   and the nested Homepage, PLP, PDP, Cart and Checkout templates.
4. **Brand questions to carry to the Brand review list:** weight 600 and the 0.5 px tracking for the production
   font (conflicts 8 and 9), square dialogs (10), and the red timer bar (5).
5. **Factory AI page:** confirm with the Baselayer team what produced `Icon System • Factory Ai Output` before
   citing it outside the team.

---

## 7. Call log

| Tool | Calls | Targets |
|---|---|---|
| `whoami` | 1 | Seat check |
| `get_libraries` | 3 | Offsets 0, 20 and 40 |
| `search_design_system` | 4 | Ignite components (16 queries); Ignite variables and styles (8); community kits (6); org libraries (3) |
| `get_metadata` | 14 | Page list; Navigation, Account, Snackbar, Loading & Progress, Dialogs, Message, Menus & Lists, Tooltip, Controls, Icons, Search, Breadcrumbs, Cards |
| `get_screenshot` | 17 | 15 kept (section 8), plus the Message guide and the full-screen loader, deleted as low value |
| `get_design_context` | 11 | `9286:10836`, `0:4071`, `11161:102763`, `1975:19007`, `11289:1817`, `11195:102993`, `9284:10738`, `3734:21373`, `8236:18726`, `10927:6`, `9284:10704` (all with the screenshot excluded) |
| `get_variable_defs` | 1 | `11289:1817` |
| **Total** | **51** | No rate-limit or access errors |

---

## 8. Screenshot index

Screenshots kept outside the repo: they are internal UA design assets, not to be published outside UA. The file
names are listed so a later round can find them.

| File | Node | What it shows |
|---|---|---|
| `01-account-side-nav-desktop.png` | `9286:10835` | The eight states of the account side nav |
| `02-page-preview-section-desktop.png` | `11161:102657` | Preview sections: Stack, Single and the compact Empty |
| `03-order-history-list-item-desktop.png` | `11195:102992` | List rows with thumbnails, status and caret |
| `04-message-desktop.png` | `11289:1816` | Message banners: Default, Error, Alert; fill and text-only; Default and Mini |
| `05-snackbar-ua-states.png` | `9192:25593` | The UA snackbar: one and two lines, action, close, dark mode, the red timer bar |
| `05b-snackbar-m3-import.png` | `9192:26494` | The Material 3 snackbar imported into Baselayer (not UA-styled; for contrast) |
| `05c-snackbar-layout-spacing-spec.png` | `9505:92030` | The snackbar's own layout and spacing spec |
| `06-controls-toggle-segmented.png` | `109:8205` | The segmented Toggle: Default, Focus, Hover, Pressed, right-active |
| `07-three-dot-loader.png` | `1975:18969` | The three-dot loader's frames, light and dark |
| `08-tooltip-variants.png` | `119:9300` | Tooltips: Default, DarkMode and Light, every arrow direction |
| `09-menu-stack.png` | `9284:10737` | Menu Stack styles: Compact, 4, 16 and 24 px stacks and grids |
| `10-dialog-desktop-header-footer.png` | `8236:18727` | Dialog headers (sticky, back, icon) and footers (one or two CTAs) |
| `11-dialog-with-asset-desktop.png` | `13415:72401` | The two-choice dialog |
| `12-icon-system-factory-ai-output.png` | `13872:244` | The seven-size icon system labeled Factory AI output |
| `14-action-card-styles.png` | `9284:10703` | Action Cards: Outline, White and Gray |

---

## Sources

- Figma, `00_UA_Baselayer_Library_Web`, file key `QbamqYWF53D37xGmuxvvXJ`: every node linked above. Internal access,
  read-only, 2026-10-26.
- Figma, `00_Baselayer Ignite - Design System App`, library key
  `lk-505e6afa834b4dba43b0c02485ac939ec6b063cf666cdb0a32029a915b3d6b9dd9f83805996c808bf9ca3d029b600954c72f0f640b86a76e4be184549b803605`,
  through `search_design_system`. Internal access.
- Figma organization libraries UA Brand Logos, UA Baselayer Typestyles - Mobile, RUN Type Apple Watch and File
  Resources; community kits Material 3 Design Kit, Simple Design System, macOS 26 and 27, iOS and iPadOS 26 and
  27, watchOS 26 and visionOS 26, as listed by `get_libraries`.
- Material Design 3, [m3.material.io](https://m3.material.io/) (navigation rail and side sheet guidance).
- HyperDelivery [design-system.md](../design-system.md) sections 4 to 10,
  [baselayer-for-hyperdelivery.md](baselayer-for-hyperdelivery.md) section 11, and the
  [Activity](../site/concepts/project/Activity.dc.html) and [Main](../site/concepts/project/Main.dc.html) concept boards
  as they stood before this round.
