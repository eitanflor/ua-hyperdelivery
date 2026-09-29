/** "Flor, Eitan" -> "Eitan Flor". Entra display names here are often "Last, First", which
 * reads as a directory entry, not a person. */
export function displayName(name: string): string {
  const [last, first] = name.split(",").map((part) => part.trim());
  return first ? `${first} ${last}` : name.trim();
}

/** "Flor, Eitan" -> "EF": initials in the order people say the name. */
export function initials(name: string): string {
  return displayName(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Who signed or edited something, as a person. Decisions record the token's email, which
 * reads as a system id: "jane.doe@underarmour.com" -> "Jane Doe". Show the raw
 * value as a tooltip wherever this is used, so it stays checkable. */
export function personName(who: string): string {
  if (!who.includes("@")) return displayName(who);
  const parts = (who.split("@")[0] ?? "").split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return who;
  return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
