import type { ToolCallEvent } from "../api/client";

/** Text streamed before and after a tool call arrives as separate chunks with nothing
 * between them, so "...a few basics from you:" ran straight into "I checked the library...".
 * Feed it every chunk and tool call in order: the first chunk after a call gets a paragraph
 * break in front of it. */
export function paragraphBreaks() {
  let tail = "";
  let afterToolCall = false;
  return {
    toolCall: (call: Pick<ToolCallEvent, "status">) => {
      if (call.status === "running") afterToolCall = true;
    },
    chunk: (text: string): string => {
      if (!text) return text;
      const out = afterToolCall && tail !== "" && !tail.endsWith("\n") ? `\n\n${text}` : text;
      afterToolCall = false;
      tail = text.slice(-1);
      return out;
    },
  };
}
