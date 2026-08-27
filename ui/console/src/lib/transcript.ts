import type { ChatTurn } from "../store/useProjectsStore";

/** Renders prior turns for one agent into a single self-contained prompt string.
 * Deliberately NOT relying on the local dev agent process's own hidden conversation
 * memory (it's a shared singleton across every project hitting that port - see
 * docs/decisions.md) - each request must carry its own full context to stay correct
 * regardless of what that process remembers (or wrongly remembers from another
 * project). Mirrors how the real production path (stateless Lambda invocations) works
 * too. */
export function buildTranscript(priorTurns: ChatTurn[], newMessage: string): string {
  const lines: string[] = [];
  for (const turn of priorTurns) {
    if (turn.role === "user") {
      if (turn.text) lines.push(`User: ${turn.text}`);
      continue;
    }
    const gaps = (turn.content?.completeness as { gaps?: string[] } | undefined)?.gaps;
    if (gaps?.length) {
      lines.push(`Agent: Missing info - ${gaps.join("; ")}`);
    }
  }
  lines.push(`User: ${newMessage}`);
  return lines.join("\n");
}
