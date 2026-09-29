/** Every illustration the console has a slot for. The prompts that produce them, their
 * sizes and where each one appears are in docs/design/asset-prompts.md. */
export const ARTWORK = {
  "a1-line": "The line as an isometric production floor",
  "a3-gate": "A hazard-striped gate barrier, small icon version",
  "a4-brief": "A messy brief becoming clear requirements",
  "c-scout": "Scout, dithered player-card portrait",
  "c-coach": "Coach, dithered player-card portrait",
  "c-ref": "Ref, dithered player-card portrait",
  "c-host": "Host, dithered player-card portrait",
  "d1-floor": "An empty production floor, one sheet waiting",
  "d2-gate-clear": "A raised gate barrier, lane clear",
  "d3-scout-rest": "Scout at rest, clipboard lowered",
  "d4-tray": "An empty document tray",
  "d5-search": "Scout with a magnifier over an empty tile",
  "d6-column": "An empty board column with a dashed card",
  "e-missing-platform": "The line with one platform missing",
  "i2-crew": "The four crew members in a row",
} as const;

export type ArtworkId = keyof typeof ARTWORK;

// Discovered at build time: drop `<id>.<light|dark>.<ext>` (or `<id>.<ext>` for both
// themes) into src/assets/illustrations/ and it replaces the fallback - no code change.
const FILES = import.meta.glob<string>("../assets/illustrations/*.{svg,webp,avif,png,jpg}", {
  eager: true,
  query: "?url",
  import: "default",
});

const VARIANTS = new Map<string, { light?: string; dark?: string; any?: string }>();
for (const [path, url] of Object.entries(FILES)) {
  const name = path.split("/").at(-1)?.replace(/\.[a-z0-9]+$/, "") ?? "";
  const match = /^(.+?)(?:\.(light|dark))?$/.exec(name);
  if (!match) continue;
  const [, id, theme] = match;
  const entry = VARIANTS.get(id!) ?? {};
  entry[(theme as "light" | "dark" | undefined) ?? "any"] = url;
  VARIANTS.set(id!, entry);
}

/** The file for `id` in `theme`, falling back to a theme-neutral file, then the other
 * theme's. Undefined until someone drops the artwork in. */
export function artworkUrl(id: ArtworkId, theme: "light" | "dark"): string | undefined {
  const entry = VARIANTS.get(id);
  if (!entry) return undefined;
  return entry[theme] ?? entry.any ?? entry[theme === "light" ? "dark" : "light"];
}
