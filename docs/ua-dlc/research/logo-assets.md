<!-- Point-in-time research, retrieved 2026-10-25 for the UA-DLC plan. Claims carry source links; vendor features and dates change quickly, so verify before acting. See README.md in this folder. -->
<!-- cspell:words Atlassians Fivetran Iconify Invertocat Octicon amazonbedrock amazonnova amazonwebservices deepseek firecrawl gilbarbara lobehub lobehub's logomark microsoftcopilot microsoftexcel microsoftonedrive microsoftoutlook microsoftsharepoint microsoftteams onedrive powerbi qwen slackhq svgl -->

# Logo assets for HyperDelivery: what was collected, where from, and what the brands allow

> The dark-theme variants described here are out of scope since 2026-10-26: HyperDelivery is light theme only for now.

Research key: `logo-assets`. Date: 2026-10-25. Scope: brand marks for integration chips, model chips, the agent trace,
and the architecture canvas (the owner's ask for real logos), plus a small generic icon set for "point at a resource"
sources (the owner's ask to point at resources instead of uploading them).

## 1. What is in the pack

Location: a planning scratch folder, not committed to this repository. Every file is reproducible from the `source` URLs listed below.

| Path | Contents |
|---|---|
| `<name>.svg` | 42 primary marks: brand color where the brand uses color, `currentColor` where the brand is black or white |
| `mono/<name>.svg` | 42 single-color variants. All are `currentColor`, mostly one path, and fit the ink-first console |
| `logos.json` | Array of `{name, title, category, file, source, license, hex, hexSource, viewBox, svg, artworkColors, mono{file, source, license, viewBox, svg}, trademarkNotes}` |
| `preview.html` | Chip sheet in light and dark (primary mark, label, mono mark, hex) for checking rendering |

Normalization, done by a small build script kept with the scratch pack:

- **Inner markup only.** `svg` in the JSON is the inner markup for `<svg viewBox="…">`, with `<title>` and `<desc>` removed. Each file on disk has `role="img"`, an `aria-label` and a `<title>`.
- **Root attributes kept.** Presentation attributes on the source root (`fill`, `fill-rule` and similar) move to a wrapping `<g>`, so the inner markup renders the same without the original root.
- **Namespaced ids.** Every `id` becomes `hd-<name>-…` (mono uses `hd-<name>-m-…`), and the `url(#…)` and `href="#…"` references follow it. This stops gradient and mask ids from colliding when many logos are inlined on one page. If the same multi-color logo is inlined twice, its ids still duplicate. For repeated use, prefer a `<symbol>` sprite or `<img src>`.
- **Safety checks.** I rejected any file containing `<script>`, `<foreignObject>`, `<image>`, `<style>` elements, `on*=` handlers, `javascript:`, or external `href` or `url()` references. None were found. Every output is checked as well-formed XML, and none references anything outside itself.
- **Brand colors applied.** Single-path brand marks get their brand fill: Snowflake #29B5E8, Claude #D97757, Atlassian #1868DB. GitHub, Copilot and Anthropic use `currentColor`, because those brands are black or white.

All 84 files were rendered in a browser and checked by eye in light and dark.

## 2. Asset table

License describes copyright in the SVG drawing only. **No license listed here grants trademark rights.** Section 4
covers what each owner allows.

| name | primary source | mono source | license (primary) | hex |
|---|---|---|---|---|
| snowflake | simple-icons 16.36.0 `snowflake` (keeps ®), filled #29B5E8 | same, currentColor | CC0-1.0 | 29B5E8 |
| jira | `@atlaskit/logo` 23.3.1 `artifacts/logo-components/jira/icon.js` (2025 tile) | same file, `customThemeSvg` (one path) | Apache-2.0 code | 1868DB |
| confluence | `@atlaskit/logo` 23.3.1 `…/confluence/icon.js` (2025 tile) | same, `customThemeSvg` | Apache-2.0 code | 1868DB |
| atlassian | `@atlaskit/logo` 23.3.1 `legacy-logos/atlassian/icon.js`, #1868DB | same, currentColor | Apache-2.0 code | 1868DB (dark #357DE8) |
| github | simple-icons `github`, currentColor | same | CC0-1.0 | 181717 |
| githubcopilot | simple-icons `githubcopilot` (Primer Octicon copilot-24) | same | MIT | 000000 (Copilot Purple 8534F3) |
| microsoftteams | svgl `microsoft-teams` (Oct 2025 refreshed icon) | simple-icons 12.0.0 `microsoftteams` | none stated (svgl) | 6264A7 |
| sharepoint | svgl `microsoft-sharepoint` (2025) | simple-icons 12.0.0 `microsoftsharepoint` | none stated (svgl) | 0078D4 (art is teal) |
| onedrive | svgl `microsoft-onedrive` (2025) | simple-icons 12.0.0 `microsoftonedrive` | none stated (svgl) | 0078D4 |
| microsoftexcel | svgl `microsoft-excel` (2025) | simple-icons 12.0.0 `microsoftexcel` | none stated (svgl) | 217346 |
| outlook | svgl `microsoft-outlook` (2025) | simple-icons 12.0.0 `microsoftoutlook` | none stated (svgl) | 0078D4 |
| powerbi | Iconify `logos:microsoft-power-bi` (**pre-Dec-2025 icon**) | simple-icons 12.0.0 `powerbi` | CC0-1.0 (gilbarbara/logos) | F2C811 |
| anthropic | simple-icons `anthropic`, currentColor | same | CC0-1.0 | 191919 |
| claude | simple-icons `claude`, filled #D97757 | same, currentColor | CC0-1.0 | D97757 |
| amazonwebservices | lobehub `aws-color` (text currentColor, smile #FF9900) | lobehub `aws` | MIT (lobe-icons) | 232F3E (smile FF9900) |
| amazonbedrock | lobehub `bedrock-color` (blue-violet gradient) | lobehub `bedrock` | MIT (lobe-icons) | 3D8FFF (artwork, not official) |
| tableau | Iconify `logos:tableau-icon` | simple-icons 13.0.0 `tableau` | CC0-1.0 (gilbarbara/logos) | E97627 |
| figma | svgl `figma` (full color) | simple-icons `figma` | none stated (svgl) | F24E1E |
| dbt | Iconify `logos:dbt-icon` | simple-icons 15.0.0 `dbt` | CC0-1.0 (gilbarbara/logos) | FF694B |
| streamlit | Iconify `logos:streamlit` | simple-icons `streamlit` | CC0-1.0 (gilbarbara/logos) | FF4B4B |
| slack (reference) | Iconify `logos:slack-icon` | simple-icons 15.0.0 `slack` | CC0-1.0 (gilbarbara/logos) | 4A154B |
| notion (reference) | svgl `notion` (works on dark) | simple-icons `notion` | none stated (svgl) | 000000 |
| python | svgl `python` (gradient logo) | simple-icons `python` | none stated (svgl) | 3776AB |

**Extras (not requested, for model chips):** lobehub color and mono marks for `amazonnova`, `openai`, `gemini`, `meta`,
`mistral`, `deepseek`, `cohere` and `qwen`, plus `microsoft` and `microsoftcopilot`. All are MIT (lobe-icons 1.100.0).
Their hex values are artwork colors, not checked against each brand's guidelines.

**Generic marks:** Phosphor `regular` weight from `@phosphor-icons/core` 2.1.1 (MIT). Each is a single path with
`currentColor` on a 256 viewBox:

| name | Phosphor icon | Lucide equivalent (ISC), if a stroke style wins |
|---|---|---|
| web-browser | browser | app-window |
| database | database | database |
| file | file-text | file-text |
| spreadsheet | table | sheet |
| meeting | video-camera | video |
| recording | record | circle-dot |
| terminal | terminal-window | square-terminal |
| folder (extra) | folder-simple | folder |
| link (extra) | link-simple | link |

Exact source URLs for every file are in each entry's `source` field in `logos.json`. The source bases are:

- simple-icons: `https://cdn.jsdelivr.net/npm/simple-icons@<ver>/icons/<slug>.svg`
- lobehub: `https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@1.100.0/icons/<x>.svg`
- svgl: `https://svgl.app/library/<x>.svg`
- Iconify: `https://cdn.jsdelivr.net/npm/@iconify-json/logos@1.2.17/icons.json`, also served at `https://api.iconify.design/logos/<x>.svg`
- Atlaskit: `https://cdn.jsdelivr.net/npm/@atlaskit/logo@23.3.1/dist/es2019/...`
- Phosphor: `https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2.1.1/assets/regular/<x>.svg`

## 3. Brands Simple Icons removed or never had

I read this from the Simple Icons GitHub release notes and removal PRs, using the GitHub API.

| Brands | Removed in | Reason given in the PR |
|---|---|---|
| All Microsoft brands: Teams, SharePoint, OneDrive, Excel, Outlook, Power BI, Azure, Skype and others ([PR #10019](https://github.com/simple-icons/simple-icons/pull/10019)) | v13.0.0 (2024-06-30) | Microsoft's trademark terms forbid icon use without explicit permission. Microsoft Office went earlier, in v10 |
| Tableau ([PR #12212](https://github.com/simple-icons/simple-icons/pull/12212)) | v14.0.0 (2024-12-22) | The PR cites the Salesforce acquisition |
| All Amazon and AWS brands, including Amazon Web Services and S3 ([PR #13056](https://github.com/simple-icons/simple-icons/pull/13056)) | v15.0.0 (2025-06-01) | AWS neither confirms nor denies permission, and the maintainers expect it would enforce |
| Slack and every Salesforce brand ([PR #13503](https://github.com/simple-icons/simple-icons/pull/13503)) | v16.0.0 (2025-11-30) | Salesforce guidelines forbid altering marks and transferring rights |
| dbt ([PR #13525](https://github.com/simple-icons/simple-icons/pull/13525)) | v16.0.0 | dbt's brand page and terms imply permission is needed. Outreach got no reply |
| Amazon Bedrock | never had it | n/a |

Simple Icons' [CONTRIBUTING forbidden-brands list](https://github.com/simple-icons/simple-icons/blob/develop/CONTRIBUTING.md#forbidden-brands)
now names Amazon/AWS and Microsoft (including LinkedIn, Visual Studio and Playwright) among the brands it will not
accept. Note the logic here: Simple Icons drops a brand when **permission to redistribute** is doubtful. That is a
stronger test than whether a customer may show the logo inside an internal tool, but it shows which owners police hardest.

Still in Simple Icons 16.36.0: Snowflake, Jira, Confluence, Atlassian, GitHub, GitHub Copilot, Anthropic, Claude,
Figma, Notion, Python and Streamlit. Its Jira and Confluence glyphs are the pre-2025 un-tiled forms (#0052CC and
#172B4D), which is why the pack uses Atlaskit instead.

## 4. What each owner allows for an integration chip in an internal tool

These are general findings for UA legal to confirm, not legal advice. HyperDelivery is internal-only, which lowers
exposure a great deal. Most guidelines still separate two kinds of use:

- **Word marks:** saying in text "works with X" is almost always allowed.
- **Logos:** permission, a license, or a narrow listed use (diagrams, linking) is usually required.

| Owner | Rule for a logo in a UI chip | Colors and alterations | Source |
|---|---|---|---|
| **Microsoft** (Teams, SharePoint, OneDrive, Excel, Outlook, Power BI) | Logos and app icons need an express license. Truthful text compatibility statements are fine. Architecture icons are licensed **only for architectural diagrams, training materials and documentation** | Do not crop, flip, rotate or distort them, change their shape, or use them to represent your own product | [Trademark guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks); [M365 architecture icons (archived)](https://learn.microsoft.com/en-us/microsoft-365/solutions/architecture-icons-templates); [Power Platform icons](https://learn.microsoft.com/en-us/power-platform/guidance/icons) |
| **AWS** (AWS, Bedrock) | Logos need a license or prior written permission. Fair use is plain text only ("built on Amazon Bedrock"). Customers may use the "Powered by AWS" logo. Architecture Icons are allowed for architecture diagrams, presentations and whitepapers | Do not alter. Marks must stand alone with clear space | [Trademark guidelines](https://aws.amazon.com/trademark-guidelines/); [Architecture Icons](https://aws.amazon.com/architecture/icons/) |
| **Atlassian** (Jira, Confluence, Atlassian) | Use the logo component's icon variant in product experiences, paired with the app name and with the app name in alt text. Logos for third-party integrations live in internal Atlaskit staging, which is Atlassians only | Keep the tile's predefined radius and **never nest the logomark in another container**. Never compose your own attribution lockup. Brand #1868DB light, #357DE8 dark, neutral #6C6F77, inverse white | [atlassian.design/foundations/logos](https://atlassian.design/foundations/logos) (scraped with firecrawl); `@atlaskit/logo` color source |
| **GitHub** | Explicitly allowed: a permitted GitHub logo can show that your project integrates with GitHub, if less prominent than your own brand and implying no endorsement | Black or white only (gray or green in a few cases). No recoloring, gradients, shadows or distortion. Not as your app icon | [brand.github.com logo](https://brand.github.com/foundations/logo) |
| **GitHub Copilot** | Since 2025 there is **no standalone Copilot logo**. GitHub uses the "GitHub Copilot" lockup (Invertocat plus wordmark). The page does not address third-party use of the glyph | Copilot Purple #8534F3 is a palette color, not a logo color | [brand.github.com Copilot](https://brand.github.com/brand-identity/copilot) |
| **Snowflake** (and Streamlit) | Partner co-branding goes through the Partner Network guides. The page does not explicitly cover integration use. Streamlit allows logos that truthfully refer or link to Streamlit; anything else needs written permission | Snowflake Blue on white or white on blue. The bug **must carry ®**. Clear space equals the logotype x-height | [Snowflake brand guidelines](https://www.snowflake.com/brand-guidelines/); [streamlit.io/brand](https://streamlit.io/brand) |
| **Anthropic** (Anthropic, Claude) | Use only as Anthropic permits and approves in advance. It does not address referential "uses Claude" statements, but prohibits implied endorsement without express authorization. Existing partners contact marketing@anthropic.com | No color, font or proportion changes. Clear space. No added ™ | [Anthropic trademark guidelines](https://www.anthropic.com/legal/trademark-guidelines) |
| **Salesforce** (Tableau, Slack) | Developers of integrated products may use a product logo **only inside a diagram or flowchart** showing how the products work together, less prominent than their own brand. Other logo uses need written authorization | No alteration of any kind. Text use adds "[X] is a trademark of Salesforce, Inc." | [Salesforce trademark guidelines](https://www.salesforce.com/company/legal/tmcusageguidelines/); [Slack media kit](https://slack.com/media-kit) |
| **Figma** | Allowed to identify Figma if truthful, fair and not misleading. Your own mark is more prominent. Use "Figma" as an adjective | Do not modify. Black-and-white and color versions are provided | [Using the Figma brand](https://www.figma.com/using-the-figma-brand/) |
| **dbt Labs** (Fivetran + dbt Labs since 2026-06-01) | The brand page assumes you already have permission and defers to its Trademark Policy | Black or white logotypes. The brand may change after the merger | [dbt brand guidelines](https://www.getdbt.com/brand-guidelines); [merger close](https://www.fivetran.com/press/fivetran-dbt-labs-complete-merger-to-create-the-data-infrastructure-for-trusted-ai-agents) |
| **PSF** (Python) | Saying software uses or is compatible with Python, with the **unaltered** logo, needs no approval, commercial or not | No shape or color changes. The ™ symbol must stay with the logo; the chip files omit it | [PSF trademark policy](https://www.python.org/psf/trademarks/) |
| **Notion** | Could not find an official brand or trademark page | Black and white mark | n/a (flagged) |

## 5. Recommendations for the console

1. **Always pair a logo with its text name.** Most guidelines ask for this (Atlassian, Microsoft's diagram guidance).
   The text is also the legally safest part, and it keeps a chip readable for people who do not know the logo.
2. **Full-color marks on neutral chips; mono where a brand or the Brand review calls for it.** The round-3 UX direction
   takes most of a screen's color from brand marks on neutral chips, while status stays text plus a small glyph and
   agent hues stay in Layers 2 and 3 ([ux-direction.md](../ux-direction.md) section 6). Use the mono file in
   `currentColor` where a brand allows only black or white, or until a full-color mark is cleared; where a brand only
   allows full color, use the primary file or the text name alone. Mono is an official form for Atlassian (its own
   themed variant), GitHub (black or white only), Anthropic, OpenAI, Notion and dbt (black or white). Microsoft and
   Salesforce forbid alteration.
3. **Microsoft is the main judgment call.** UA is a Microsoft 365 customer, and a few users will see Teams or OneDrive
   icons in an internal tool, so practical risk is low. Strictly, though, Microsoft licenses its icons only for
   diagrams, training and documentation. A product chip is not on that list. Three options:
   - (a) Text chip plus a generic glyph: "Teams recording" with `meeting`, "OneDrive folder" with `folder`. This is fully clean.
   - (b) Use the icons after UA legal or Brand agrees.
   - (c) Use the icons freely on the **architecture canvas**, which falls within Microsoft's diagram license.

   I suggest (a) until the Brand review (a long-lead item, weeks 2 to 10) clears (b), and (c) for the canvas. AWS (plain text only, outside diagrams) and Salesforce (diagrams
   only) follow the same split.
4. **For the architecture canvas, prefer the official diagram packages** over the redraws in this pack. The licenses
   for these name diagram use explicitly:
   - AWS Architecture Icons (`Icon-package_07312026`, which includes the official Amazon Bedrock service icon)
   - Microsoft Power Platform icons (includes the December 2025 Power BI icon)
   - Azure and M365 architecture icons

   Someone has to accept those click-through terms; I did not download them.
5. **Respect the Atlassian tile.** Render the Jira and Confluence tile as-is, without a second rounded background.
   In dark mode, switch the Atlassian fill to #357DE8 or use the mono file.
6. **Small-size caveats.**
   - The Snowflake ® is unreadable below about 20px, but Snowflake requires it. Use 20px or larger where the color bug shows.
   - The Copilot glyph is a deprecated standalone mark. The concept screens show it on the Copilot coding agent's chip; in the product, use the GitHub mark plus the label "Copilot coding agent" unless the Brand review clears the glyph.
7. **Model chips.** A text model name ("Claude Sonnet", "Amazon Nova") is always allowed. Anthropic's guidelines
   require approval for logo use, and UA's Claude contract runs through AWS Bedrock, so ask UA legal before showing the
   Claude mark in product.
8. **Treat these files as data.** All are sanitized and self-contained. Keep it that way if more are added: the build
   script rejects scripts, external references and event handlers.

## 6. What I could not access or did not do

- **Official zips not downloaded.** The AWS Architecture Icons zip and Microsoft's Power Platform zip (behind an "I agree"
  checkbox) need a person to accept the terms, so I skipped them. As a result, Power BI is the pre-December-2025 icon
  and Bedrock is lobehub's redraw.
- **The 2025 Microsoft 365 icons come from svgl, not Microsoft.** I matched them visually to the October 2025 refresh
  (Message Center [MC1163778](https://mc.merill.net/message/MC1163778); [Princeton notice](https://oit.princeton.edu/news/microsoft-365-gets-redesigned-icons)),
  but svgl names no source for them. Microsoft's Fluent CDN (`res-1.cdn.office.net/.../brand-icons/product/svg/*_48x1.svg`)
  still serves the 2019 icons; I downloaded these for comparison but did not use them.
- **Pages not fully read:**
  - The Atlassian third-party integration logo set is internal to Atlassian.
  - The Snowflake Partners Guide and the Slack Brand Center (brand.slackhq.com) were not opened.
  - The dbt Trademark Policy was not read beyond the brand page.
  - Microsoft's partner-led marketing guidelines were not read.
  - The `atlassian.com/legal/trademark` page came back as navigation only.
- **Notion:** no official brand page found.
- **Unverified hex values:** the SharePoint, OneDrive and Outlook hexes are Simple Icons' 2024 values (#0078D4), and
  the 2025 artwork is more varied (SharePoint is teal-dominant). The Bedrock and model-extra hexes are artwork colors.
- **Not covered:** UA's own marks, which [ux-direction.md](../ux-direction.md) says need Brand sign-off.

Mono marks for removed brands (Microsoft products, Power BI, AWS, Tableau, dbt, Slack) come from the last Simple Icons
release that still shipped them: 12.0.0, 14.0.0, 13.0.0 and 15.0.0. They were CC0 at that version, but were withdrawn
for the trademark reasons in section 3.
