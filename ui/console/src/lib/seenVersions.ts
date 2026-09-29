const KEY = "hyperdelivery:seen-versions";

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
  seen[`${projectId}:${agent}`] = version;
  try {
    localStorage.setItem(KEY, JSON.stringify(seen));
  } catch {
    // storage full or disabled: the banner just will not appear, nothing else depends on it
  }
}
