const KEY = "hyperdelivery:seen-versions";

/** Most-recently-seen documents to remember; a bare number per entry, so this stays a few KB
 * however many projects a browser has opened. */
const MAX_ENTRIES = 300;

function read(): Record<string, number> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
}

/** The version of a document this browser last showed, or undefined on a first look -
 * what "Updated since you last looked" compares against. */
export function lastSeenVersion(projectId: string, agent: string): number | undefined {
  return read()[`${projectId}:${agent}`];
}

export function markSeen(projectId: string, agent: string, version: number): void {
  const seen = read();
  if (seen[`${projectId}:${agent}`] === version) return;
  // delete first so the entry moves to the end, the newest, when it is re-added
  delete seen[`${projectId}:${agent}`];
  seen[`${projectId}:${agent}`] = version;
  const newest = Object.fromEntries(Object.entries(seen).slice(-MAX_ENTRIES));
  try {
    localStorage.setItem(KEY, JSON.stringify(newest));
  } catch {
    // storage full or disabled: the banner just will not appear, nothing else depends on it
  }
}
