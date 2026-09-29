import {
  list,
  SEVERITY_ORDER,
  str,
  type AcceptanceCriterion,
  type ApiContract,
  type BusinessValue,
  type Component,
  type Coverage,
  type DemoSeed,
  type EvidenceLink,
  type Finding,
  type IntegrationPoint,
  type Requirement,
  type TalkTrackSection,
  type UnitOfWork,
} from "../api/artifacts";
import { buildOrder, EVIDENCE_LABEL, SEVERITY_LABEL } from "./plainLabels";

export interface ExportMeta {
  projectName: string;
  output: string;
  version: number;
}

/** "Size Run Planner - Requirements brief v3": what the file is, without opening it. */
export function exportName({ projectName, output, version }: ExportMeta): string {
  return `${projectName} - ${output} v${version}`.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
}

function section(title: string, body: string[]): string[] {
  return body.length > 0 ? [`## ${title}`, "", ...body, ""] : [];
}

function specMarkdown(content: Record<string, unknown>): string[] {
  const evidence = list<EvidenceLink>(content, "evidence");
  const acceptance = list<AcceptanceCriterion>(content, "acceptance_criteria");
  const value = new Map(list<BusinessValue>(content, "business_value").map((b) => [b.requirement_id, b]));
  const requirements = list<Requirement>(content, "requirements").flatMap((r) => {
    const why = value.get(r.id);
    return [
      `### ${r.id} - ${r.description}`,
      "",
      ...(why ? [`*Why it matters:* ${why.use_case} - ${why.roi}`, ""] : []),
      ...acceptance.filter((a) => a.requirement_id === r.id).map((a) => `- [ ] ${a.description}`),
      ...evidence
        .filter((e) => e.requirement_id === r.id)
        .map((e) => `> ${e.evidence}  \n> - ${EVIDENCE_LABEL[e.source ?? "source_document"]}`),
      "",
    ];
  });
  return [
    ...section("Objective", str(content, "objective") ? [str(content, "objective")!] : []),
    ...section("Scope", str(content, "scope") ? [str(content, "scope")!] : []),
    ...section("Requirements", requirements),
    ...section("Open questions", list<string>(content, "open_questions").map((q) => `- ${q}`)),
  ];
}

function blueprintMarkdown(content: Record<string, unknown>): string[] {
  const units = buildOrder(list<UnitOfWork>(content, "units_of_work"));
  return [
    ...section("Architecture", str(content, "architecture_summary") ? [str(content, "architecture_summary")!] : []),
    ...section(
      "Build order",
      units.map((u, i) => `${i + 1}. **${u.title}** - ${u.description.split("\n")[0] ?? ""}`),
    ),
    ...section(
      "Components",
      list<Component>(content, "components").map((c) => `- **${c.name}** - ${c.responsibility}`),
    ),
    ...section(
      "Integration points",
      list<IntegrationPoint>(content, "integration_points").map(
        (p) => `- **${p.system}** (${p.direction}) - ${p.description}`,
      ),
    ),
    ...section(
      "API contracts",
      list<ApiContract>(content, "api_contracts").map((c) => `- \`${c.method} ${c.path}\` - ${c.summary}`),
    ),
  ];
}

function reviewMarkdown(content: Record<string, unknown>): string[] {
  const coverage = list<Coverage>(content, "coverage");
  const findings = [...list<Finding>(content, "findings")].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
  return [
    ...section(
      "Requirement coverage",
      coverage.length > 0
        ? [
            `${coverage.filter((c) => c.met).length} of ${coverage.length} requirements met.`,
            "",
            ...coverage.map((c) => `- ${c.met ? "[x]" : "[ ]"} ${c.requirement_id}`),
          ]
        : [],
    ),
    ...section(
      "Findings",
      findings.map(
        (f) =>
          `- **${SEVERITY_LABEL[f.severity]}** - ${f.description}${f.requirement_id ? ` (${f.requirement_id})` : ""}`,
      ),
    ),
  ];
}

function demoMarkdown(content: Record<string, unknown>): string[] {
  return [
    ...section("Summary", str(content, "summary") ? [str(content, "summary")!] : []),
    ...section(
      "Walkthrough",
      list<TalkTrackSection>(content, "talk_track").map(
        (s, i) => `${i + 1}. ${s.narration} *(${s.requirement_id})*`,
      ),
    ),
    ...section(
      "Sample data",
      list<DemoSeed>(content, "demo_data").map((d) => `- **${d.entity}** - ${d.description}`),
    ),
  ];
}

const BODY: Record<string, (content: Record<string, unknown>) => string[]> = {
  distill: specMarkdown,
  blueprint: blueprintMarkdown,
  review: reviewMarkdown,
  showroom: demoMarkdown,
};

/** The document as Markdown a reader could paste into Confluence or a ticket. */
export function toMarkdown(agent: string, content: Record<string, unknown>, meta: ExportMeta): string {
  const title = str(content, "title") ?? meta.output;
  const body = BODY[agent]?.(content) ?? ["```json", JSON.stringify(content, null, 2), "```"];
  return [`# ${title}`, "", `*${meta.output} - ${meta.projectName} - version ${meta.version}*`, "", ...body]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

/** Project names and titles are user-supplied; they reach HTML only through this. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadMarkdown(agent: string, content: Record<string, unknown>, meta: ExportMeta): void {
  download(
    new Blob([toMarkdown(agent, content, meta)], { type: "text/markdown;charset=utf-8" }),
    `${exportName(meta)}.md`,
  );
}

const WORD_STYLES = `
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.45; color: #1a1a1a; }
  h1 { font-size: 20pt; margin: 0 0 4pt; } h2 { font-size: 14pt; margin: 16pt 0 6pt; }
  h3, h4 { font-size: 12pt; margin: 10pt 0 4pt; } p, li { margin: 0 0 4pt; }
  code { font-family: Consolas, monospace; font-size: 9.5pt; }
  button, svg, [aria-hidden="true"] { display: none; }
`;

/** The rendered document as a Word file. Word opens HTML with its own typography, so this
 * keeps the headings, lists and tables the reader sees without a document library. */
export function downloadWord(element: HTMLElement, title: string, meta: ExportMeta): void {
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${escapeHtml(exportName(meta))}</title><style>${WORD_STYLES}</style></head><body><h1>${escapeHtml(title)}</h1><p><em>${escapeHtml(`${meta.output} - ${meta.projectName} - version ${meta.version}`)}</em></p>${element.innerHTML}</body></html>`;
  download(new Blob(["\ufeff", html], { type: "application/msword" }), `${exportName(meta)}.doc`);
}

/** Prints only `element`, from a hidden frame that carries the console's own styles - the
 * app's fixed-height scroll regions would otherwise clip it or add blank pages. The frame's
 * title becomes the suggested file name when the reader saves as PDF. */
export function printDocument(element: HTMLElement, meta: ExportMeta): void {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;visibility:hidden";
  document.body.append(frame);
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(
    `<!doctype html><html data-theme="light"><head>${document.head.innerHTML}` +
      `<style>body{background:#fff;padding:0 8mm}button{display:none!important}</style></head>` +
      `<body>${element.outerHTML}</body></html>`,
  );
  doc.close();
  // the copied head brings the console's own <title>; this replaces its text, unparsed
  doc.title = exportName(meta);
  win.addEventListener("afterprint", () => frame.remove());
  // stylesheets load asynchronously; printing before they apply prints unstyled text
  win.addEventListener("load", () => win.print());
}
