const CLOSER: Record<string, string> = { "{": "}", "[": "]" };

function tryParse(text: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(text);
    return value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Places the text can be cut back to and still close into valid JSON: just after an
 * opener, or just before a comma between values. Each carries the closers it needs. */
interface Cut {
  at: number;
  closers: string;
}

const MAX_CUTS = 24;

/** The object an unfinished JSON string would be if it stopped here.
 *
 * The station's document streams in as one tool call's JSON arguments, so the text is
 * always a prefix of a valid object. Closing the open string and brackets recovers
 * almost every prefix; when the tail is a half-written key or literal, cutting back to
 * the last comma or opener recovers the rest. Returns null only when nothing parses -
 * callers treat that as "nothing to show yet", never as an error. */
export function parsePartialJson(text: string): Record<string, unknown> | null {
  const stack: string[] = [];
  const cuts: Cut[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{" || ch === "[") {
      stack.push(CLOSER[ch]!);
      cuts.push({ at: i + 1, closers: [...stack].reverse().join("") });
    } else if (ch === "}" || ch === "]") stack.pop();
    else if (ch === ",") cuts.push({ at: i, closers: [...stack].reverse().join("") });
  }

  // a dangling backslash would escape the quote added to close the string
  const body = escaped ? text.slice(0, -1) : text;
  const whole = tryParse(body + (inString ? '"' : "") + [...stack].reverse().join(""));
  if (whole) return whole;

  for (const cut of cuts.slice(-MAX_CUTS).reverse()) {
    const parsed = tryParse(text.slice(0, cut.at) + cut.closers);
    if (parsed) return parsed;
  }
  return null;
}
