<!-- Point-in-time research, retrieved 2026-10-25 for the UA-DLC plan. Claims carry source links; vendor features and dates change quickly, so verify before acting. See README.md in this folder. -->
<!-- cspell:words Arnaud BOBJ BOYNEXTDOOR Bacelar Bloq Boomi CISO CNBC COLDGEAR Duroseau Ecommerce Elementum Eurostile Financials Fiori François HANA HEATGEAR Hintz IEEPA Liedtke Logility Madhu Mehri Merkle Natesan Newswire Omagari Pantone Peake Pestridge Renner's Reza SFCC Saidi Shadman Subframe Taleghani Tosche Toshi VTEX Velociti Yassine actuals dejobs iagora infosec paywalled streetwear -->

# Under Armour context for HyperDelivery (researched 2026-10-25)

**Labels used below.** *Confirmed* means a primary source says it: an SEC filing, UA's own site or page code, a UA job posting, or a vendor case study quoting named UA staff. *Reported* means trade press, or a search-result summary of a page I could not open myself. *Inference* is my own reasoning, marked as such. The web-search budget ran out partway through. Later facts come from fetching known URLs directly, and the gaps are listed at the end.

---

## 1. Brand identity, as publicly documented

**Mission and vision (Confirmed).** UA states its mission as "Under Armour Makes Athletes Better". Its vision is to offer performance solutions people did not know they needed ([Mission, Vision & Values](https://about.underarmour.com/en/Purpose/Mission-Vision-Values.html)). The governance page shortens the mission to "make you better" ([Corporate Governance](https://about.underarmour.com/en/investors/corporate-governance.html)).

**Logo and trademarks (Confirmed).** The FY2026 10-K lists these registered marks: the UA Logo, UNDER ARMOUR, UA, ARMOUR, HEATGEAR, COLDGEAR, PROTECT THIS HOUSE and I WILL. It says UA will "aggressively police" infringements ([10-K FY2026](https://www.sec.gov/Archives/edgar/data/0001336917/000133691726000073/ua-20260331.htm)). On underarmour.com the interlocking-UA logo is a single-color SVG that takes the surrounding text color. It shows white on a black nav bar (page source, Oct 2026). *Reported:* in March 2026 UA sent a cease-and-desist to streetwear label Vice Lair over a logo resembling the UA mark ([Creative Bloq](https://www.creativebloq.com/design/logos-icons/under-armour-orders-indie-brand-to-change-its-logo); paywalled, so I relied on the search summary). I found **no public UA brand-standards document**. Logo clear-space, official Pantone values and approved lockups have to come from UA's internal brand team.

**Color (Confirmed from the live site, with a caveat).** These are the design tokens in underarmour.com's production CSS:
- `--base-color-black: #1d1d1d` (text, nav, primary buttons)
- white
- greys `#f9f9f9 / #f0f0f0 / #d0d0d0 / #949494 / #5f5f5f / #444`
- `--base-color-red: #dc0019`, plus `red-1 #e51b24`, `red-2 #ff2a29`, `red-4 #e93e51`
- `--base-color-green: #00834b`

Primary buttons are black with white text. Red appears sparingly, for example in the bracket-frame graphic of the new **Armour Access** membership. An image asset named `FW26_Q3_ArmourAccess_Launch` suggests it launched in fall 2026; the program name is confirmed, the launch timing is inference. The caveat: these are e-commerce tokens, not published brand-standard values. *Inference:* UA's own digital surface is monochrome first, with red used as a signal.

**Typography (Confirmed from the live site).** The site loads **NeuePlakUA** (weights 400, 600, 700, 800–900) for UI and headings, and **NeuePlakUAText** (400, 600, 700) for body copy. The fallback stack is `ARMOUR, Helvetica, Arial`, so a proprietary face named **ARMOUR** also exists. Neue Plak is Monotype's 2018 revival, by Linda Hintz and Toshi Omagari, of Paul Renner's 1928 poster face Plak ([MyFonts](https://myfonts.com/pages/linotype-neue-plak), [Tosche](https://tosche.net/fonts/neue-plak)). *Inference:* the "UA" suffix points to a custom or exclusively licensed cut. An internal tool should not self-host it without a license check. Third-party sites credit the wordmark to Eurostile or to "custom" lettering; those claims are unreliable ([Subframe](https://www.subframe.com/tips/what-font-does-under-armour-use), [MadeGoodDesigns](https://madegooddesigns.com/under-armour-font/)).

**Layout tokens (Confirmed).** Spacing follows a 4px scale (2, 4, 8, 16, 24, 32, 40, 48, 56, 64, 80, 120). Corner radii are 3, 8 and 16px, and buttons are pills.

**Photography and graphic language.** *Be The Problem* ran in September 2025, made by Uncommon Creative Studio for European football. It uses harsh light, stark shadows, spotlights and a dark, sleek palette, with in-the-action camera work ([It's Nice That](https://www.itsnicethat.com/articles/under-armour-be-the-problem-advertising-project-090925)). UA's 2026 [Snowflake case study page](https://www.snowflake.com/en/customers/all-customers/case-study/under-armour/) uses the same kind of imagery: athletes mid-effort, gyms, dark backgrounds. UA also publicly called a 2024 Anthony Joshua film, *Forever Is Made Now*, an "AI commercial" ([UA story](https://about.underarmour.com/en/stories/2024/03/forever-is-made-now.html)). Brand marketing therefore runs its own AI-creative decisions.

**Tone of voice.** UA's history page says the 2003 *Protect This House* ad introduced the idea of "WILL" as brand DNA ([History](https://about.underarmour.com/en/our-company/history.html)). *The Only Way Is Through* (January 2020, made in-house) was framed around there being no shortcuts ([CNBC](https://www.cnbc.com/2020/01/14/under-armours-kevin-plank-pushes-new-ad-campaign-the-only-way-is-through.html), [B&T](https://www.bandt.com.au/under-armour-unveils-2020-global-brand-platform-the-only-way-is-through/)). In August 2026 Plank gave a three-part formula for product storytelling: what the product is, what it does, and how it makes you better ([Q1 FY27 call](https://www.fool.com/earnings/call-transcripts/2026/08/07/under-armour-uaa-q1-2027-earnings-call-transcript/)). Overall the voice is direct, declarative and earned rather than hyped.

**Brand platforms and taglines, in order:**
- *Protect This House*: 2003 ([History](https://about.underarmour.com/en/our-company/history.html)). Revived March 2023 with agency Zambezi and the in-house team. UA's SVP of global brand marketing called it the soul of UA ([MediaPost](https://www.mediapost.com/publications/article/383375/under-armour-brings-back-protect-this-house.html)).
- *I WILL*: registered trademark.
- *Click-Clack*: 2006 cleats. Revived as *Click Clack: The Next Era* for women's flag football in February 2026 ([UA](https://about.underarmour.com/en/stories/2026/02/under-armour-debuts-click-clack--the-next-era--celebrating-the-w.html)).
- *The Only Way Is Through*: 2020.
- *Be The Problem*: 2025, European football.
- 2026 campaigns:
  - *Rest Less* (sportswear) ([UA](https://about.underarmour.com/en/stories/2026/07/under-armour-celebrates-the-off-season-in-new--rest-less--sports.html))
  - *For When It's Hot* (HeatGear, with François Arnaud) ([UA](https://about.underarmour.com/en/stories/2026/07/under-armour-names-francois-arnaud-as-global-brand-ambassador.html))
  - **Commit**, a new brand platform from August 2026. Fronted by CMO Simon Pestridge and framed around an APAC generation; BOYNEXTDOOR fronts it ([UA](https://about.underarmour.com/en/stories/2026/08/under-armour-launches-new-brand-platform-centered-on-commit--spo.html)).
  - *We Love Football* (October 2026) ([UA](https://about.underarmour.com/en/stories/2026/10/under-armour-debuts-we-love-football-campaign.html))
- 2026 is UA's **30th anniversary** (Q1 FY27 call).

**Athlete ethos (Confirmed).** Plank describes building "from the athlete back". He also says athletes need better choices rather than more of them (Q1 FY27 call).

## 2. Corporate strategy and situation, 2025–2026

**Leadership (Confirmed on the [governance page](https://about.underarmour.com/en/investors/corporate-governance.html), October 2026):**
- Kevin Plank, President and CEO since April 2024
- Reza Taleghani, CFO since February 2026 (from Samsonite)
- Shawn Curran, Chief Supply Chain Officer
- Adam Peake, President, Americas (February 2026). He rejoined in 2025 as SVP Strategy, Go-To-Market and Analytics.
- Simon Pestridge, CMO (since June 2026)
- Mehri Shadman, Chief Legal **and People** Officer (August 2026)
- Kara Trent, Chief Merchandising Officer (February 2026)

The 10-K filed in May 2026 listed Eric Liedtke as CMO and EVP Strategy; he is absent from the October page (*inference:* a role change, unverified). Yassine Saidi (Chief Product Officer since 2024) became a design advisor ([PR Newswire, January 2026](https://www.prnewswire.com/news-releases/under-armour-announces-executive-leadership-changes-to-accelerate-transformation-302662536.html)).

Technology leadership:
- A [2023 UA release](https://about.underarmour.com/en-us/stories/2023/06/under-armour-announces-changes-to-executive-leadership-team.html) named **Danny Miles** EVP and CTO. His remit covered global IT, infosec, **enterprise data management & analytics**, enterprise architecture, enterprise applications, digital storefront and "corporate teammate services". The 10-K says the CISO reports to the CTO, who reports to the CEO. Whether Miles is still CTO in 2026 is unverified.
- **Patrick Duroseau** is Chief Data and AI Officer (2026 Snowflake case study). He was previously VP of Enterprise Data Management ([Snowflake blog, 2022](https://www.snowflake.com/en/blog/under-armour-data-first-company/)).
- *Reported:* Liz Bacelar (formerly Estée Lauder) was hired in March 2025 to lead a new AI and advanced-analytics group ([World Footwear](https://worldfootwear.com/news/under-armour-hires-former-estee-lauder-executive-to-lead-its-ai-and-analytics-efforts/10488.html)).

**Financials (Confirmed).**
- FY2026 (ended March 31, 2026): revenue $4.97B (down about 4%), gross margin 45.5% (down 240bps, mostly tariffs), net loss $496M, adjusted operating income $107M ([Q4 FY26 release](https://www.sec.gov/Archives/edgar/data/0001336917/000133691726000059/exhibit991-fiscal2026q4.htm)).
- Q1 FY27: revenue about $1.1B (down 3%), North America down 9%. FY27 revenue guidance cut to a mid-single-digit decline; adjusted operating income held at $140–160M ([Q1 FY27 release](https://www.sec.gov/Archives/edgar/data/1336917/000133691726000108/exhibit991-fiscal2027q1.htm)).
- Channel mix: wholesale 57%, DTC 41%. North America is 58% of revenue. UA runs 443 Brand and Factory House stores and has about **14,100 teammates**, about 10,100 of them in stores (10-K).

**Restructuring (Confirmed).** The FY2025 plan is now about **$305M**. $260.7M had been recorded by March 31, 2026, and the plan should be substantially done by December 31, 2026. It includes charges for the **Curry Brand separation** and for exiting the Rialto, CA distribution center (10-K).

**Turnaround priorities (Confirmed).**
- The 10-K lists four: elevate brand positioning, simplify and scale the operating model, accelerate innovation, and strengthen global go-to-market.
- In August 2026 Plank gave his own four:
  1. Rationalize the line around franchises such as HeatGear, Velociti and StealthForm.
  2. Rebuild marketing around fewer, bigger stories.
  3. Improve commercialization.
  4. Manage inventory in the marketplace.
- His mandate to the organization: UA will "sell so much more of so many less products at a much higher full retail price."
- SKUs are down 25%, with another 25% to go within 18 months and roughly 40% by the end of 2028.
- Marketing runs at 10–11% of revenue. Plank wants fewer, bigger activations, clear measurement and a higher bar for funding.
- Portland has been rightsized, with Baltimore and New York as the decision hubs.
- He wants a common "red thread" across regions, so UA feels like one brand rather than three regional companies.
- Product takes 18–24 months to reach market.
- Named 10-K investments: a global operating and financial-reporting IT system, e-commerce and loyalty, an **end-to-end planning system upgrade**, a **global shared services and technology center**, and a new HQ on the Baltimore Peninsula. *Reported:* a Bengaluru Global Capability Center focused on technology, AI and data science opened in June 2026 under Madhu Natesan ([Textile Excellence](https://textileexcellence.com/single-news/7028/under-armour-bets-on-india-s-tech-talent-appoints-madhu-natesan-to-lead-new-bengaluru-gcc)).

## 3. Technology and data landscape

| Area | What is public | Confidence |
|---|---|---|
| Data platform | **Snowflake since 2020**, run as a single platform. Pattern: every AI insight is anchored to a **"golden report"**. Stated tenet: don't move data. Uses secure data sharing and clean rooms. Product-margin reporting went from monthly to daily. Five years spent on observability and governance ([Snowflake case study](https://www.snowflake.com/en/customers/all-customers/case-study/under-armour/)) | Confirmed (vendor-published, names UA staff) |
| Conversational and coding AI | Business teammates have **Snowflake CoWork**, Snowflake's personal agent for knowledge workers, renamed from Snowflake Intelligence ([product page](https://www.snowflake.com/en/product/snowflake-cowork/)). Developers have **CoCo**, the renamed Cortex Code ([product page](https://www.snowflake.com/en/product/snowflake-coco/)). UA's first agentic workflow is an internal help desk | Confirmed |
| Analytics stack | Enterprise Data Management & Analytics (EDMA) postings ask for Snowflake (RBAC, semantic layer), **dbt**, **Tableau**, Python, CI/CD, **Elementum** automation, and AI coding assistants by name (GitHub Copilot, Claude, Cursor, Cortex Code) ([Sr. Data Analytics Engineer](https://careers.underarmour.com/job/Baltimore-Sr_-Data-Analytics-Engineer-MD-21230/1399376900/)). Power BI also appears in EDM postings (search summary). SAP HANA, BusinessObjects and SAC appear in another (search summary) | Confirmed / Reported |
| ERP | SAP S/4HANA went live in 2017, with a rocky launch ([Supply Chain Dive](https://www.supplychaindive.com/news/under-armour-losses-ERP-update-supply-chain-disruption/510078/)). AWS became the preferred cloud for SAP in 2021: ERP, BI/BOBJ, PI/PO and Fiori moved in under six months ([InsideSAP](https://insidesap.com/under-armour-runs-sap-in-the-cloud-with-aws/)) | Confirmed / Reported |
| Integration | 2026 SAP Innovation Award entry ([SAP](https://www.sap.com/documents/2026/02/b6814270-407f-0010-bca6-c68f7e60039b.html)): 25 integrations moved from MuleSoft to **SAP Integration Suite on BTP** in 9 months, cutting license cost 75% (about $1.5M a year). Boomi (used for SuccessFactors) and CPI-neo are next. BTP is positioned for Build Work Zone, process automation and AI ahead of an **upcoming S/4HANA migration** | Confirmed |
| HR | SAP **SuccessFactors**: the internal career-site link in job postings and the SAP award entry | Confirmed |
| Planning | **Blue Yonder** demand planning, plus a goal of using ML/AI for demand sensing (job posting via search summary). The SVP E2E Planning posting named Blue Yonder, Logility and o9 | Reported |
| PLM | Centric Software chosen in 2015 for more than 1,000 users ([Centric](https://www.centricsoftware.com/press-releases/under-armour-plm-software-for-retail-consumer-goods-fashion/)). Current status unknown | Reported, may be outdated |
| Commerce | Headless **Salesforce Commerce Cloud** since 2017 across about 35 storefronts (Merkle, via search summary; the page now redirects). underarmour.com currently serves a **Next.js** front end with **Adobe Scene7** imagery, and about.underarmour.com runs on **AEM** (page source). VTEX powers Brazil ([VTEX](https://vtex.com/en/blog/customer-stories/under-armour-vtex)); Fluent Commerce OMS powers the Middle East | Mixed |
| Cloud | AWS for SAP and formerly for Connected Fitness ([AWS](https://aws.amazon.com/solutions/case-studies/under-armour)); data science postings ask for SageMaker | Confirmed / Reported |
| Microsoft 365, Atlassian | **No public evidence found.** Treat the HyperDelivery team's own knowledge as authoritative | Not verifiable |

## 4. Culture, vocabulary, and the domains a data org serves

**Vocabulary (Confirmed).**
- Employees are **teammates** (10-K).
- The five values are **Love Athletes, Celebrate the Wins, Stand for Equality, Act Sustainably, Fight On Together**. UA calls them the **"red thread"** connecting everyone. *Fight On Together* includes acting with an **enterprise mindset** ([values](https://about.underarmour.com/en/Purpose/Mission-Vision-Values.html)).
- Other people terms: Teammate Resource Groups, ten per the 10-K ([culture](https://about.underarmour.com/en/Purpose/culture.html)); "speak up" and "make the right call" trainings; paid "UA Give Back" volunteer days.
- Data-org terms: **monument** (a foundational platform worth building on), **golden report**, **article activation** (the journey from design to consumer), **data products**, **decision intelligence**, **squads**, **EDMA**.
- Retail terms: **Brand House** (premium stores) and **Factory House** (outlet and clearance).
- Calendar: the **fiscal year runs April to March**, so FY27 is April 2026 to March 2027. Seasons follow FW/SS codes, for example FW26.

**Domains EDMA serves (Confirmed).** A current Sr. Enterprise Data Analyst posting lists them: Retail, Wholesale, Ecommerce, Supply Chain, Sales, Finance, Merchandising, Marketing, Accounting, Product, HR and Emerging Markets ([posting](https://careers.underarmour.com/job/Amsterdam-Sr_-Enterprise-Data-Analyst-1076-CM/1424403600/)). Sourcing facts from the 10-K:
- 40 primary apparel manufacturers in 17 countries; about 65% of output comes from Jordan, Vietnam, Indonesia and Cambodia.
- Footwear comes from 7 manufacturers, mainly in Vietnam and Indonesia.
- The top five fabric suppliers provide 43% of fabric.

## 5. Recommendations: expressing UA identity tastefully

**Borrow:**
- **A monochrome-first palette with red as a signal.** Mirror UA's own tokens: near-black `#1d1d1d` for text and primary actions, a white or light-grey canvas, and a 5-step grey ramp.
  - Keep the console's `--color-ua-red #e4002b` for exactly one meaning, the brand mark plus the **human approval gate**, and never for errors. Today `--color-danger #b3261e` is a second red, so "approve" and "failed" look alike. Move danger toward a deeper red-brown with icon and text, or reuse UA's `#dc0019` and give the gate its own form.
  - Use black primary buttons, as underarmour.com does.
- **Typographic restraint.** Ask UA Brand whether internal tools may license NeuePlakUA. If not, keep a neutral grotesk such as Geist, with uppercase, tracked, heavy headings echoing Neue Plak's condensed poster energy. Do not imitate the proprietary ARMOUR face.
- **Athletic precision**: the 4px spacing scale, dense data tables, tabular numerals, crisp 3–8px radii, pill CTAs.
- **Voice.** Address users as "teammates" and keep copy short and declarative. Structure every Showroom demo like Plank's formula: what it is, what it does, how it makes you better.

**Avoid:**
- Athlete photography, campaign films, taglines (*Protect This House* and *I WILL* are registered marks), athlete names and likenesses, and **AI-generated athlete imagery**. These carry rights and contract obligations, and brand marketing owns them.
- Logo lockups or recolors without Brand sign-off; UA polices its marks hard.
- Tagline-themed screen names. Sports metaphors are fine in small doses ("game plan", "reps"), because UA's own data team uses them.

## 6. Domains and example HyperDelivery use cases

| Domain (owner) | Example prototype | Context the agents need |
|---|---|---|
| Merchandising (Trent) | **SKU rationalization workbench**: flag low-productivity styles and colorways against the 40%-by-2028 target | Article/style/colorway hierarchy (PLM, SAP), sell-through, daily product-margin golden report, franchise tags, seasons |
| Pricing and full-price selling | Full-price vs promo dependency monitor by channel | Promo calendar, markdown history, DTC orders, golden-report margin definitions |
| Supply chain and sourcing (Curran) | Tariff and country-of-origin scenario tool (IEEPA refunds, FY27 guidance) | PO lines, HTS codes, factory list, landed cost, supplier code-of-conduct status |
| Demand planning | Forecast-accuracy explorer next to Blue Yonder | Forecast vs actuals, planning hierarchy, regional calendars. Do not duplicate CoWork Q&A |
| Wholesale (57% of revenue) | Account sell-through and "full UA expression" shop-in-shop tracker (e.g., DICK'S House of Sport) | Partner EDI sell-through, account hierarchy, allocation |
| DTC and e-commerce | **Armour Access** membership funnel prototype | SFCC orders, loyalty tables, web analytics. Privacy constraints on member PII |
| Stores (443 Brand and Factory House) | Labor-vs-traffic planner; Factory House clearance tracker | POS, traffic counts, store attributes, inventory by DC |
| Marketing (Pestridge) | Activation scorecard: "fewer, bigger" spend vs measured return | Spend by campaign, campaign calendar, attribution definitions |
| Sports marketing and team | Team-partnership deliverables tracker (e.g., Ravens and Northwestern 10-year deals) | Contract obligations, product allocations. Rights-sensitive data |
| Finance (Taleghani) | Restructuring and SG&A savings tracker | Fiscal calendar (April–March), SAP GL and cost centers. Read-only (SOX) |
| People (Shadman) | Teammate onboarding path builder | SuccessFactors org data. PII and legal review |
| Licensing and emerging markets | Licensee and distributor price-compliance monitor (licensee discounting hurt China) | Licensee sales reports, price lists |

## 7. Gaps and flags
- No official UA brand guidelines are public.
- Microsoft 365 and Atlassian use is unverified publicly.
- Several job postings are now filled, so their details come from search summaries.
- Merkle, Creative Bloq, DesignYourWay, an iagora listing and a dejobs posting could not be opened.
- The SAP PDF returned 403; I read the HTML rendering instead.
- The search budget ran out before I could check Curry separation details, 2026 layoffs, Danny Miles's 2026 status, or the logo designer.
- The UA "ideathon" is not public. It comes from the HyperDelivery team's own context.
