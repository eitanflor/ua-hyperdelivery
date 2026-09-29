import type { TurnRecord } from "../api/client";
import type { ChatTurn } from "../store/useProjectsStore";

/** How far a turn's start in this browser can sit from the server's record of it and still be
 * the same turn: the two clocks are not the same clock, and a run can be long. */
const MATCH_WINDOW_MS = 5 * 60_000;

/** Whether the record holds an agent's side of a turn, not only the person's message. */
function hasOutput(record: TurnRecord): boolean {
  return (
    record.text.trim() !== "" ||
    record.tool_calls.length > 0 ||
    record.usage !== null ||
    record.error !== null
  );
}

/** The server's record of `turn`, if there is one nobody else has claimed.
 *
 * The browser's turn ids are its own, so a turn is matched to its record by agent and by which
 * start is nearest. Each record is handed out once (`taken`), so two quick turns by the same
 * agent do not both land on one record. A message-only record is never the reply. */
export function recordFor(
  turn: Pick<ChatTurn, "agent" | "createdAt">,
  records: TurnRecord[],
  taken: Set<TurnRecord>,
): TurnRecord | undefined {
  const at = Date.parse(turn.createdAt);
  let best: TurnRecord | undefined;
  let bestGap = MATCH_WINDOW_MS;
  for (const record of records) {
    if (taken.has(record) || record.agent !== turn.agent || !hasOutput(record)) continue;
    const gap = Math.abs(Date.parse(record.started_at) - at);
    if (gap <= bestGap) {
      best = record;
      bestGap = gap;
    }
  }
  if (best) taken.add(best);
  return best;
}

/** Whether this browser already has the person's message from `record`. */
function hasMessage(local: ChatTurn[], record: TurnRecord): boolean {
  const at = Date.parse(record.started_at);
  return local.some(
    (t) =>
      t.role === "user" &&
      t.agent === record.agent &&
      t.text === record.message &&
      Math.abs(Date.parse(t.createdAt) - at) <= MATCH_WINDOW_MS,
  );
}

/** The conversation on a project: what this browser already holds, plus every recorded turn it
 * does not.
 *
 * The server is where history lives, so a browser that has none (a reload, another machine, an
 * approver) builds the thread from the records. A turn this browser watched is already here in
 * full, so it is not added twice. Safe to call again as records arrive: the same records always
 * make the same turns. */
export function conversationFromRecords(local: ChatTurn[], records: TurnRecord[]): ChatTurn[] {
  const taken = new Set<TurnRecord>();
  for (const turn of local) if (turn.role === "agent") recordFor(turn, records, taken);

  const added: ChatTurn[] = [];
  for (const record of records) {
    const at = Date.parse(record.started_at);
    if (record.message && !hasMessage(local, record)) {
      added.push({
        id: `message-${record.started_at}-${record.agent}`,
        role: "user",
        agent: record.agent,
        text: record.message,
        // a millisecond earlier, so the message sorts before the reply it started
        createdAt: new Date(at - 1).toISOString(),
      });
    }
    if (hasOutput(record) && !taken.has(record)) {
      added.push({
        id: `turn-${record.started_at}-${record.agent}`,
        role: "agent",
        agent: record.agent,
        text: record.text,
        toolCalls: record.tool_calls,
        usage: record.usage ?? undefined,
        durationMs: record.duration_ms ?? undefined,
        error: record.error ?? undefined,
        errorCode: record.error_code ?? undefined,
        createdAt: record.started_at,
      });
    }
  }
  if (added.length === 0) return local;
  return [...local, ...added].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}
