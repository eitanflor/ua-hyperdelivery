import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { api, TurnError } from "../api/client";
import type { AdvanceStreamEvent, ToolCallEvent, TurnRecord, UsageEvent } from "../api/client";
import type { TurnErrorCode } from "../api/errorCodes";
import { buildTranscript } from "../lib/transcript";
import { describeError, type FriendlyError } from "../lib/errors";
import { withAttachments, type Attachment } from "../lib/attachments";
import { paragraphBreaks } from "../lib/streamText";
import { conversationFromRecords } from "../lib/runs";
import { AGENT_META, AGENT_STATIONS } from "../lib/pipeline";
import type {
  Artifact,
  Build,
  Builds,
  Decision,
  DecisionRequest,
  PreviewResponse,
  Project,
  Station,
} from "../api/types";

const MAX_RECENTS = 30;

/** How often the console asks GitHub what a build pull request is doing. Slow enough not
 * to burn the API's hourly rate limit over a run that takes minutes, fast enough that the
 * card is not visibly stale. */
const BUILD_POLL_MS = 15_000;

/** How long a non-draft pull request has to report no checks at all before the console
 * accepts that none are coming. Without this a repository with no CI never settles; with
 * a shorter one, a pull request whose workflow has not started yet settles immediately
 * and the station announces a build that has not run. */
const NO_CHECKS_GRACE_MS = 120_000;

/** A build stops moving when it is merged or closed, or its checks have reached a verdict
 * on an open pull request - a draft is still being written by the agent.
 *
 * `noChecksSince` carries when each build first reported no checks, so "no CI configured"
 * can be told apart from "CI has not started yet". They look identical to the API. */
export function isSettled(build: Build, noChecksSince: Map<number, number>): boolean {
  if (build.state === "merged" || build.state === "closed") return true;
  if (build.draft) return false;
  if (build.checks === "passing" || build.checks === "failing") return true;
  if (build.checks !== "none") return false;
  const since = noChecksSince.get(build.number);
  return since !== undefined && Date.now() - since >= NO_CHECKS_GRACE_MS;
}

/** How long a gate decision stays undoable before it is sent.
 *
 * Deliberately client-side for now: if the tab closes inside the window the decision is
 * dropped rather than recorded, which is the safe direction to fail for an audit gate.
 * A server-side deferred dispatch would make it durable - see docs/console-redesign.md. */
export const UNDO_MS = 12_000;

/** Streamed tokens are buffered this long before hitting the store, so a fast agent
 * does not rewrite the conversation map once per token. */
const STREAM_FLUSH_MS = 80;

/** How often the console asks the backend for Distill's next turn once a state machine
 * (not the console itself) is driving it - deployed mode has no SSE stream to await
 * instead, see `_advanceProjectDeployed`. */
const DISTILL_POLL_MS = 3_000;

/** Give up waiting after this long, matching roughly how long a slow model call plus a
 * cold AgentCore Runtime invocation can reasonably take - long enough not to false-alarm
 * on a real turn, short enough to not leave a human staring at a spinner forever. */
const DISTILL_POLL_TIMEOUT_MS = 5 * 60_000;

const GATES = ["blueprint_approval", "review_approval", "showroom_approval"] as const;

export interface RecentProject {
  id: string;
  name: string;
}

/** How much of the machinery to show. "pm" (labeled Simple) shows the synthesized reply,
 * plain-language steps and the structured document - the default, because most people
 * here want the outcome. "developer" (labeled Detailed) adds the full trace: tool calls,
 * raw agent text, JSON and token counts. The stored values predate the labels and are kept
 * so existing choices survive. A display preference, not project state. */
export type ViewMode = "developer" | "pm";

export interface ChatTurn {
  // stable identity for matching a turn across updates (e.g. a flush replacing it with
  // a new object each time) - object references break the moment a turn is recreated
  // via spread, which left orphaned streaming bubbles stuck in the conversation forever
  // on error once at least one chunk had arrived.
  id: string;
  role: "user" | "agent";
  agent: string;
  text?: string; // user turns, and the accumulating text of an in-progress agent turn
  content?: Record<string, unknown>; // finished agent turns
  draft?: string; // the artifact's JSON as it is being written, streaming turns only
  waitingSeconds?: number; // how long the model has been silent, streaming turns only
  streaming?: boolean; // true while an agent turn is still receiving chunks
  /** Why a recorded turn ended without finishing; live failures are dropped instead. */
  error?: string;
  /** Why it failed, when the server knew. */
  errorCode?: TurnErrorCode;
  toolCalls?: ToolCallEvent[]; // tool calls made so far during a streaming turn
  usage?: UsageEvent; // arrives once, at the end of an agent turn
  durationMs?: number; // wall-clock time from send to the finished turn, finished turns only
  createdAt: string;
}

/** Enough to re-run a send that failed, so recovery is one click rather than retyping. */
export interface FailedRun {
  projectId: string;
  agent: string;
  prompt: string;
}

export interface PendingDecision {
  projectId: string;
  station: Station;
  decision: DecisionRequest;
  /** For the local echo only - the API records whoever is signed in. */
  signer: string;
  /** Epoch ms at which this stops being undoable and is sent. */
  deadline: number;
  /** Set once the undo window closes and the decision is in flight. */
  committing?: boolean;
}

/** A decision this browser sent.
 *
 * Not the audit trail - that lives in DynamoDB and has no read endpoint yet. This is a
 * local echo so a gate cleared in this session can show who signed it instead of going
 * anonymous the moment the form closes. */
export interface Signature {
  station: Station;
  signer: string;
  approved: boolean;
  comment?: string | null;
  at: string;
}

interface ProjectsState {
  projects: Record<string, Project>;
  artifactsByProject: Record<string, Artifact[]>;
  pendingByStation: Partial<Record<Station, Project[]>>;
  recentProjects: RecentProject[];
  /** The project list has been fetched once (successfully or not). Until then an empty list
   * means "not here yet", not "no projects". */
  projectsLoaded: boolean;
  // Full per-project turn history (user prompts + agent replies) - lets a station's
  // elicitation loop (e.g. Distill asking for missing info) render as a real back-and-
  // forth instead of a single overwritten artifact.
  conversationByProject: Record<string, ChatTurn[]>;
  signaturesByProject: Record<string, Signature[]>;
  /** The server's decision trail - authoritative, unlike the local echo above. */
  decisionsByProject: Record<string, Decision[]>;
  /** What the server recorded of each project's agent turns - the trace, which lives on the
   * server rather than in this browser so any machine sees it. Not persisted locally. */
  turnsByProject: Record<string, TurnRecord[]>;
  /** Each project's unsent message, so a quote from a document can land in it. */
  composerDrafts: Record<string, string>;
  buildsByProject: Record<string, Builds>;
  previewByProject: Record<string, PreviewResponse>;
  loading: boolean;
  error: FriendlyError | null;
  failedRun: FailedRun | null;
  pendingDecision: PendingDecision | null;
  /** Set while an agent run is in flight, so the UI can offer a stop. */
  runningProjectId: string | null;
  viewMode: ViewMode;

  createProject: (name: string) => Promise<Project>;
  // Creates a project straight from a message (no name typed in - see ProjectNamer on
  // the backend) and immediately sends that same message as Distill's first turn, so
  // the landing-page chatbox behaves like one continuous action instead of two. Any
  // files are uploaded once the project (and so its S3 prefix) exists, then cited in
  // that first turn the same way an in-thread attachment is.
  createProjectFromMessage: (message: string, files?: File[]) => Promise<Project>;
  loadProject: (projectId: string) => Promise<void>;
  // Backs the portfolio dashboard - every project, not just the ones this browser has
  // visited (unlike `recentProjects`, which is a local echo).
  loadProjects: () => Promise<void>;
  loadArtifacts: (projectId: string) => Promise<void>;
  loadDecisions: (projectId: string) => Promise<void>;
  loadTurns: (projectId: string) => Promise<void>;
  /** Re-read a project and what its runs changed, quietly: no spinner, no error toast. */
  refreshProject: (projectId: string) => Promise<void>;
  loadPending: (station: Station) => Promise<void>;
  /** Reads the build pull requests once. `watchBuilds` is what keeps them fresh. */
  loadBuilds: (projectId: string) => Promise<void>;
  /** Polls while any build is still moving; resolves the moment they all settle. */
  watchBuilds: (projectId: string) => () => void;
  // Idempotent and best-effort, same as the backend's own auto-preview after a merge -
  // safe to call whether or not one is already running, and a failure (e.g. no
  // PREVIEW_CHECKOUT_PATH configured) is a normal result, not an error toast.
  startPreview: (projectId: string) => Promise<void>;
  /** Fires one agent turn once every build has stopped moving. At most once per project. */
  announceBuildsSettled: (projectId: string) => Promise<void>;
  decide: (projectId: string, station: Station, decision: DecisionRequest, signer: string) => void;
  undoDecision: () => void;
  // Dispatches to the local (SSE-streaming) or deployed (polling) implementation based
  // on the project's `orchestration_mode` - the only thing any caller should invoke.
  advanceProject: (projectId: string, agent: string, prompt: string) => Promise<void>;
  // Local-dev only: invokes the current station's agent directly over SSE. Not for
  // direct use outside advanceProject - kept on the store (rather than a free function)
  // only because it needs `set`/`get`.
  _advanceProjectLocal: (projectId: string, agent: string, prompt: string) => Promise<void>;
  // Deployed-mode counterpart: Distill only, answers via /answer (or lets an
  // already-started execution run) and polls for its next turn instead of streaming.
  _advanceProjectDeployed: (projectId: string, agent: string, prompt: string) => Promise<void>;
  cancelRun: () => void;
  retryFailedRun: () => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  renameProject: (projectId: string, name: string) => Promise<void>;
  clearError: () => void;
  setViewMode: (mode: ViewMode) => void;
  setComposerDraft: (projectId: string, text: string) => void;
}

// Kept outside the store: neither is state the UI renders, and neither should ever be
// persisted or trigger a re-render.
let undoTimer: ReturnType<typeof setTimeout> | null = null;
let runController: AbortController | null = null;
// Projects whose builds have already been announced, so remounting the thread does not
// send the same follow-up prompt twice.
const announced = new Set<string>();

async function guarded(set: (partial: Partial<ProjectsState>) => void, fn: () => Promise<void>) {
  set({ loading: true, error: null });
  try {
    await fn();
  } catch (err) {
    set({ error: describeError(err) });
  } finally {
    set({ loading: false });
  }
}

// Thread.tsx owns one connection per visible project. It stays outside render state.
interface ProjectSocket {
  socket: WebSocket;
  bufferedEvents: string[];
  consume: ((data: string) => void) | null;
}

const projectSockets = new Map<string, Promise<ProjectSocket | null>>();

// Events nobody is consuming pile up until a send flow attaches; a long-open thread must not
// keep every chunk of every automatic run.
const MAX_BUFFERED_EVENTS = 200;

/** `done` is broadcast before the run's turn, document and next station are saved, so a run
 * that finished with nobody in this tab waiting on it (a gate released the next agent) is
 * re-read a few times over the seconds after, not once. */
const REFRESH_DELAYS_MS = [1_500, 5_000, 12_000];
const refreshTimers = new Map<string, ReturnType<typeof setTimeout>[]>();

function cancelRefresh(projectId: string): void {
  for (const timer of refreshTimers.get(projectId) ?? []) clearTimeout(timer);
  refreshTimers.delete(projectId);
}

function refreshAfterRun(projectId: string): void {
  cancelRefresh(projectId);
  refreshTimers.set(
    projectId,
    REFRESH_DELAYS_MS.map((delay) =>
      setTimeout(() => void useProjectsStore.getState().refreshProject(projectId), delay),
    ),
  );
}

/** Whether a socket event ends a run: `done: true` or a string `error`. Other or malformed events do not. */
export function endsARun(data: string): boolean {
  try {
    const event: unknown = JSON.parse(data);
    return (
      typeof event === "object" &&
      event !== null &&
      ((event as { done?: unknown }).done === true ||
        typeof (event as { error?: unknown }).error === "string")
    );
  } catch {
    return false;
  }
}

/** Return the project's open connection or start one. */
export function ensureProjectSocket(projectId: string): Promise<ProjectSocket | null> {
  const pending = projectSockets.get(projectId);
  if (pending) {
    return pending.then((connection) =>
      connection?.socket.readyState === WebSocket.OPEN
        ? connection
        : openProjectSocket(projectId),
    );
  }
  return openProjectSocket(projectId);
}

function openProjectSocket(projectId: string): Promise<ProjectSocket | null> {
  const promise = api.openProjectStream(projectId).then((socket) => {
    if (!socket) return null;
    const connection: ProjectSocket = { socket, bufferedEvents: [], consume: null };
    socket.addEventListener("message", (event: MessageEvent<string>) => {
      if (connection.consume) {
        connection.consume(event.data);
        return;
      }
      if (connection.bufferedEvents.length >= MAX_BUFFERED_EVENTS) connection.bufferedEvents.shift();
      connection.bufferedEvents.push(event.data);
      if (endsARun(event.data)) refreshAfterRun(projectId);
    });
    return connection;
  });
  projectSockets.set(projectId, promise);
  return promise;
}

/** Close a project's connection when its thread is no longer visible. */
export function closeProjectSocket(projectId: string): void {
  cancelRefresh(projectId);
  const pending = projectSockets.get(projectId);
  projectSockets.delete(projectId);
  void pending?.then((connection) => connection?.socket.close());
}

function rememberRecent(recents: RecentProject[], project: Project): RecentProject[] {
  const withoutThis = recents.filter((p) => p.id !== project.id);
  return [{ id: project.id, name: project.name }, ...withoutThis].slice(0, MAX_RECENTS);
}

/** Polls until Distill's next turn actually lands: either a new `pending_question` is
 * persisted or the project leaves the distill station entirely (it drafted and advanced
 * past the gate). Clearing the previous question is only an intermediate state between
 * `/answer` and the next Step Functions turn, not completion. */
async function pollForDistillTurn(before: Project, signal?: AbortSignal): Promise<Project> {
  const deadline = Date.now() + DISTILL_POLL_TIMEOUT_MS;
  const beforeQuestion = JSON.stringify(before.pending_question);
  while (Date.now() < deadline) {
    await new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timeout);
        signal?.removeEventListener("abort", done);
        resolve();
      };
      const timeout = setTimeout(done, DISTILL_POLL_MS);
      signal?.addEventListener("abort", done, { once: true });
    });
    signal?.throwIfAborted();
    const project = await api.getProject(before.id);
    if (
      project.station !== "distill" ||
      (project.pending_question !== null && JSON.stringify(project.pending_question) !== beforeQuestion)
    ) {
      return project;
    }
  }
  throw new Error("Distill did not respond in time");
}

/** Builds the agent turn a deployed-mode poll produced, in one of three shapes:
 * - a structured question, wrapped as the same `ask_clarifying_questions` tool-call
 *   shape a local run would have streamed, so `questionsFromToolCalls`/`Composer`'s
 *   existing question picker renders it with no further changes;
 * - a bare conversational reply, as plain text;
 * - a draft: the station left distill, so the artifact is fetched and shown the same
 *   way a finished local turn is (see `advanceProject`'s `agentTurn` below). */
async function buildDistillTurn(project: Project): Promise<ChatTurn> {
  const createdAt = new Date().toISOString();
  const pendingQuestion = project.pending_question;
  if (pendingQuestion?.status === "questions" && pendingQuestion.questions?.length) {
    return {
      id: crypto.randomUUID(),
      role: "agent",
      agent: "distill",
      toolCalls: [
        {
          id: "pending-question",
          name: "ask_clarifying_questions",
          status: "done",
          result: { questions: pendingQuestion.questions },
        },
      ],
      createdAt,
    };
  }
  if (pendingQuestion?.status === "chat") {
    return { id: crypto.randomUUID(), role: "agent", agent: "distill", text: pendingQuestion.message ?? "", createdAt };
  }
  const artifact = await api.getArtifact(project.id, "distill").catch(() => null);
  return {
    id: crypto.randomUUID(),
    role: "agent",
    agent: "distill",
    content: artifact?.content,
    createdAt: artifact?.created_at ?? createdAt,
  };
}

type SetState = (
  partial:
    | Partial<ProjectsState>
    | ((state: ProjectsState) => Partial<ProjectsState>),
) => void;

/** Accumulates a live turn's text/draft/tool-calls onto a streaming placeholder turn -
 * the deployed-mode (WebSocket) counterpart of the buffering `advanceProject`'s local
 * SSE path does inline. Kept separate rather than shared with local's implementation:
 * local's is left untouched per its own constraint, and this one has no `usage`/
 * `thinking` handling since AgentCore Runtime's raw stream never emits either. */
function createTurnAccumulator(set: SetState, projectId: string, streamingTurnId: string) {
  let pendingText = "";
  let pendingDraft = "";
  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let drafted = false;
  const breaks = paragraphBreaks();

  const flush = () => {
    if (!pendingText && !pendingDraft) return;
    const text = pendingText;
    const draft = pendingDraft;
    pendingText = "";
    pendingDraft = "";
    set((state) => {
      const turns = state.conversationByProject[projectId] ?? [];
      return {
        conversationByProject: {
          ...state.conversationByProject,
          [projectId]: turns.map((t) =>
            t.id === streamingTurnId
              ? { ...t, text: (t.text ?? "") + text, draft: (t.draft ?? "") + draft }
              : t,
          ),
        },
      };
    });
  };
  const scheduleFlush = () => {
    flushTimer ??= setTimeout(() => {
      flushTimer = null;
      flush();
    }, STREAM_FLUSH_MS);
  };

  return {
    appendChunk: (chunk: string) => {
      pendingText += breaks.chunk(chunk);
      scheduleFlush();
    },
    appendDraft: (draft: string) => {
      if (draft) drafted = true;
      pendingDraft += draft;
      scheduleFlush();
    },
    upsertToolCall: (toolCall: ToolCallEvent) => {
      breaks.toolCall(toolCall);
      set((state) => {
        const turns = state.conversationByProject[projectId] ?? [];
        return {
          conversationByProject: {
            ...state.conversationByProject,
            [projectId]: turns.map((t) => {
              if (t.id !== streamingTurnId) return t;
              const existing = t.toolCalls ?? [];
              const safeToolCall =
                typeof toolCall.result === "string" && toolCall.result.length > 10_000
                  ? { ...toolCall, result: `${toolCall.result.slice(0, 10_000)}… (truncated)` }
                  : toolCall;
              const idx = existing.findIndex((tc) => tc.id === safeToolCall.id);
              const toolCalls =
                idx === -1
                  ? [...existing, safeToolCall]
                  : existing.map((tc, i) => (i === idx ? safeToolCall : tc));
              return { ...t, toolCalls };
            }),
          },
        };
      });
    },
    flushNow: () => {
      if (flushTimer !== null) clearTimeout(flushTimer);
      flushTimer = null;
      flush();
    },
    hasDrafted: () => drafted,
  };
}

/** Listens on `ws` until `agent_invoker`'s broadcast marks the turn `done` (or the
 * connection errors/closes early, or nothing arrives within the timeout), feeding every
 * chunk/draft/tool_call into `acc` as it arrives. Resolves once `done` lands - the
 * caller still has to re-fetch the project afterwards, since `done` carries no project
 * state (see agent_invoker.py's `_broadcaster`, deliberately dumb: it doesn't know the
 * console API's response shape). */
function waitForDistillTurnOverSocket(
  connection: ProjectSocket,
  acc: ReturnType<typeof createTurnAccumulator>,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const { socket } = connection;
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Distill did not respond in time"));
    }, DISTILL_POLL_TIMEOUT_MS);
    const cleanup = () => {
      clearTimeout(timeout);
      connection.consume = null;
      socket.removeEventListener("error", onSocketError);
      socket.removeEventListener("close", onClose);
      signal.removeEventListener("abort", onAbort);
    };
    const onMessage = (data: string) => {
      let event: AdvanceStreamEvent;
      try {
        event = JSON.parse(data);
      } catch {
        return; // not a JSON event this client understands - ignore rather than crash
      }
      if (typeof event.chunk === "string") acc.appendChunk(event.chunk);
      else if (typeof event.draft === "string") acc.appendDraft(event.draft);
      else if (event.tool_call) acc.upsertToolCall(event.tool_call);
      else if (typeof event.error === "string") {
        cleanup();
        reject(new TurnError(event.error, event.code));
      } else if (event.done) {
        cleanup();
        resolve();
      }
    };
    const onSocketError = () => {
      cleanup();
      reject(new Error("The live connection to the server failed."));
    };
    const onClose = () => {
      cleanup();
      reject(new Error("The live connection closed before Distill finished this turn."));
    };
    const onAbort = () => {
      cleanup();
      reject(signal.reason);
    };
    connection.consume = onMessage;
    socket.addEventListener("error", onSocketError);
    socket.addEventListener("close", onClose);
    signal.addEventListener("abort", onAbort, { once: true });
    for (const data of connection.bufferedEvents.splice(0)) onMessage(data);
  });
}

/** `localStorage` that never throws: a full or blocked store (private mode, disabled storage)
 * must break neither hydration nor an unrelated state update. */
const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // nothing stored, or nothing we may touch
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // this tab keeps working, it just will not remember
    }
  },
};

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: {},
      artifactsByProject: {},
      pendingByStation: {},
      recentProjects: [],
      projectsLoaded: false,
      conversationByProject: {},
      signaturesByProject: {},
      decisionsByProject: {},
      turnsByProject: {},
      composerDrafts: {},
      buildsByProject: {},
      previewByProject: {},
      loading: false,
      error: null,
      failedRun: null,
      pendingDecision: null,
      runningProjectId: null,
      viewMode: "pm",

      createProject: async (name) => {
        const project = await api.createProject({ name });
        set((state) => ({
          projects: { ...state.projects, [project.id]: project },
          recentProjects: rememberRecent(state.recentProjects, project),
        }));
        return project;
      },

      createProjectFromMessage: async (message, files = []) => {
        set({ error: null });
        // Register the stream before project creation can start its first execution.
        const projectId = crypto.randomUUID();
        await ensureProjectSocket(projectId);
        const project = await api.createProject({ id: projectId, message });
        set((state) => ({
          projects: { ...state.projects, [project.id]: project },
          recentProjects: rememberRecent(state.recentProjects, project),
        }));
        const attachments: Attachment[] = [];
        for (const file of files) {
          try {
            attachments.push(await api.uploadDocument(project.id, file));
          } catch (err) {
            set({ error: describeError(err) });
          }
        }
        // A failed attachment blocks the first turn the same way Landing.tsx already
        // treats any error as a hard stop before navigating - sending the message
        // anyway would silently drop the file the user was relying on, and leave a
        // running project the caller never navigated to.
        if (get().error) return project;
        // don't block on the first Distill turn - the caller navigates to the new
        // project's workspace as soon as it exists, and watches this happen live via
        // the same conversationByProject state the thread already reads
        void get().advanceProject(project.id, "distill", withAttachments(message, attachments));
        return project;
      },

      loadProject: (projectId) =>
        guarded(set, async () => {
          const project = await api.getProject(projectId);
          set((state) => ({
            projects: { ...state.projects, [projectId]: project },
            recentProjects: rememberRecent(state.recentProjects, project),
          }));
        }),

      loadProjects: () =>
        guarded(set, async () => {
          try {
            const projects = await api.listProjects();
            const ids = new Set(projects.map((p) => p.id));
            set((state) => ({
              projects: {
                ...state.projects,
                ...Object.fromEntries(projects.map((p) => [p.id, p])),
              },
              // the list is every project this API knows, so a recent it lacks was deleted
              // or belongs to another environment - kept, it lingers in search forever
              recentProjects: state.recentProjects.filter((p) => ids.has(p.id)),
            }));
          } finally {
            set({ projectsLoaded: true });
          }
        }),

      loadArtifacts: (projectId) =>
        guarded(set, async () => {
          const artifacts = await api.listArtifacts(projectId);
          set((state) => ({
            artifactsByProject: { ...state.artifactsByProject, [projectId]: artifacts },
          }));
        }),

      loadDecisions: (projectId) =>
        guarded(set, async () => {
          const decisions = await api.listDecisions(projectId);
          set((state) => ({
            decisionsByProject: { ...state.decisionsByProject, [projectId]: decisions },
          }));
        }),

      // Deliberately not `guarded`: the trace is an extra, so a failed fetch leaves the thread
      // as it was rather than raising a toast over a page that is otherwise fine.
      loadTurns: async (projectId) => {
        try {
          const turns = await api.listTurns(projectId);
          set((state) => {
            const local = state.conversationByProject[projectId] ?? [];
            const merged = conversationFromRecords(local, turns);
            return {
              turnsByProject: { ...state.turnsByProject, [projectId]: turns },
              // untouched when the records add nothing, so a poll does not re-render the thread
              ...(merged === local
                ? {}
                : { conversationByProject: { ...state.conversationByProject, [projectId]: merged } }),
            };
          });
        } catch {
          // an older API without the endpoint, or a blip - nothing to show, but the thread
          // need not keep waiting for it
          set((state) => ({
            turnsByProject: { ...state.turnsByProject, [projectId]: state.turnsByProject[projectId] ?? [] },
          }));
        }
      },

      // Not `guarded`, like `loadTurns`: this runs unprompted when a run finishes, so it must
      // not flip the global spinner or raise a toast over a page the reader is just reading.
      refreshProject: async (projectId) => {
        try {
          const [project, artifacts, decisions] = await Promise.all([
            api.getProject(projectId),
            api.listArtifacts(projectId),
            api.listDecisions(projectId),
          ]);
          set((state) => ({
            projects: { ...state.projects, [projectId]: project },
            artifactsByProject: { ...state.artifactsByProject, [projectId]: artifacts },
            decisionsByProject: { ...state.decisionsByProject, [projectId]: decisions },
          }));
          await get().loadTurns(projectId);
        } catch {
          // a blip: the next scheduled read tries again
        }
      },

      // Deliberately not `guarded`: a poll that flips the global loading spinner every
      // few seconds, or raises a toast because GitHub blipped, is worse than a stale card
      loadBuilds: async (projectId) => {
        try {
          const builds = await api.listBuilds(projectId);
          set((state) => ({ buildsByProject: { ...state.buildsByProject, [projectId]: builds } }));
        } catch {
          // leave whatever was last known on screen
        }
      },

      startPreview: async (projectId) => {
        try {
          const preview = await api.startPreview(projectId);
          set((state) => ({ previewByProject: { ...state.previewByProject, [projectId]: preview } }));
        } catch {
          // no PREVIEW_CHECKOUT_PATH, or the checkout's own script failed - leave
          // whatever was last known (usually nothing) rather than surface a toast for
          // what is only ever a laptop-demo convenience
        }
      },

      watchBuilds: (projectId) => {
        let stopped = false;
        let timer: ReturnType<typeof setTimeout> | null = null;
        const noChecksSince = new Map<number, number>();
        const tick = async () => {
          await get().loadBuilds(projectId);
          if (stopped) return;
          const builds = get().buildsByProject[projectId];
          for (const build of builds?.builds ?? []) {
            if (build.checks === "none" && !build.draft) {
              if (!noChecksSince.has(build.number)) noChecksSince.set(build.number, Date.now());
            } else {
              noChecksSince.delete(build.number);
            }
          }
          if (!builds?.watching || builds.builds.every((b) => isSettled(b, noChecksSince))) {
            void get().announceBuildsSettled(projectId);
            return;
          }
          timer = setTimeout(() => void tick(), BUILD_POLL_MS);
        };
        void tick();
        return () => {
          stopped = true;
          if (timer !== null) clearTimeout(timer);
        };
      },

      // One agent turn, not a poll: the human should be told what happened and what to do
      // next in the thread, in the station's own voice, rather than reading a status chip.
      // Settledness is the caller's judgment - only it knows how long a build has been
      // reporting no checks.
      announceBuildsSettled: async (projectId) => {
        const builds = get().buildsByProject[projectId];
        const project = get().projects[projectId];
        if (!builds?.builds.length || !project || get().runningProjectId) return;
        // the state machine's own build-merge handling drives what happens next in
        // deployed mode - this is a local-dev-only nudge for when nothing else will.
        if (project.orchestration_mode === "deployed") return;
        // a gate cannot take a message - posting one there 409s as "moved on without you"
        if (!AGENT_STATIONS.includes(project.station)) return;
        if (announced.has(projectId)) return;
        announced.add(projectId);
        const summary = builds.builds
          .map((b) => `#${b.number} ${b.state ?? "unknown"}/${b.checks ?? "unknown"}`)
          .join(", ");
        await get().advanceProject(
          projectId,
          project.station,
          `The build pull requests have settled: ${summary}. Check them against the ` +
            `blueprint's acceptance criteria and tell me what still needs a decision.`,
        );
      },

      loadPending: (station) =>
        guarded(set, async () => {
          const pending = await api.listPending(station);
          set((state) => ({
            pendingByStation: { ...state.pendingByStation, [station]: pending },
          }));
        }),

      // Holds the decision locally for UNDO_MS, then sends it. The gate counts this
      // window down; undoDecision() cancels before anything reaches the backend.
      decide: (projectId, station, decision, signer) => {
        if (undoTimer !== null) clearTimeout(undoTimer);
        set({
          pendingDecision: { projectId, station, decision, signer, deadline: Date.now() + UNDO_MS },
          error: null,
        });
        undoTimer = setTimeout(() => {
          undoTimer = null;
          const pending = get().pendingDecision;
          if (!pending) return;
          // stays set until the project has actually moved on: clearing it here would
          // put the station back at this gate for the length of the round trip, so the
          // form the user just signed flashes back before the line advances
          set({ pendingDecision: { ...pending, committing: true } });
          void guarded(set, async () => {
            try {
              const project = await api.submitDecision(pending.projectId, pending.decision);
              const signature: Signature = {
                station: pending.station,
                signer: pending.signer,
                approved: pending.decision.approved,
                comment: pending.decision.comment,
                at: new Date().toISOString(),
              };
              set((state) => ({
                projects: { ...state.projects, [pending.projectId]: project },
                signaturesByProject: {
                  ...state.signaturesByProject,
                  [pending.projectId]: [
                    ...(state.signaturesByProject[pending.projectId] ?? []).filter(
                      (s) => s.station !== pending.station,
                    ),
                    signature,
                  ],
                },
                pendingDecision: null,
              }));
              await get().loadArtifacts(pending.projectId);
              void get().loadDecisions(pending.projectId);
              void get().loadTurns(pending.projectId);
              for (const gate of GATES) void get().loadPending(gate);

              // "when a decision commits, the line visibly advances and the next agent
              // takes the station" (docs/console-redesign.md) - the state machine does
              // this on its own in production; this local-dev bypass has to do it too,
              // rather than leaving the project sitting at the new station until someone
              // happens to type into its composer. A rejection lands back on the agent
              // whose artifact was under review (see prior_station on the backend), so
              // it needs the same treatment - fed the reviewer's comment as its next
              // prompt instead of a generic "may begin.", so the send-back reason
              // actually reaches the LLM rather than only living in the audit trail.
              if (AGENT_STATIONS.includes(project.station) && project.orchestration_mode !== "deployed") {
                const label = AGENT_META[project.station]?.name ?? project.station;
                const prompt = pending.decision.approved
                  ? `${label} may begin.`
                  : `Sent back: ${pending.decision.comment?.trim() || "no reason given"}`;
                void get().advanceProject(pending.projectId, project.station, prompt);
              }
            } catch (err) {
              // the gate has to come back if the decision never landed, or the project
              // is stuck behind a banner for a decision the backend never received
              set({ pendingDecision: null });
              throw err;
            }
          });
        }, UNDO_MS);
      },

      undoDecision: () => {
        if (undoTimer !== null) clearTimeout(undoTimer);
        undoTimer = null;
        set({ pendingDecision: null });
      },

      advanceProject: (projectId, agent, prompt) =>
        get().projects[projectId]?.orchestration_mode === "deployed"
          ? get()._advanceProjectDeployed(projectId, agent, prompt)
          : get()._advanceProjectLocal(projectId, agent, prompt),

      _advanceProjectDeployed: (projectId, agent, prompt) =>
        guarded(set, async () => {
          const project = get().projects[projectId];
          const userTurn: ChatTurn = {
            id: crypto.randomUUID(),
            role: "user",
            agent,
            text: prompt,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({
            conversationByProject: {
              ...state.conversationByProject,
              [projectId]: [...(state.conversationByProject[projectId] ?? []), userTurn],
            },
            failedRun: null,
            runningProjectId: projectId,
          }));

          if (agent !== "distill") {
            // Blueprint/Review/Showroom run automatically once their gate is approved -
            // the state machine invokes them itself, so there is nothing to send here.
            const note: ChatTurn = {
              id: crypto.randomUUID(),
              role: "agent",
              agent,
              text: "This station runs automatically once its gate is approved - nothing to send here.",
              createdAt: new Date().toISOString(),
            };
            set((state) => ({
              conversationByProject: {
                ...state.conversationByProject,
                [projectId]: [...(state.conversationByProject[projectId] ?? []), note],
              },
              runningProjectId: null,
            }));
            return;
          }

          // no chunks to stream in deployed mode unless a WebSocket API is configured
          // (see api.openProjectStream) - but a bare `streaming: true` turn is enough
          // for Thread.tsx to show the same "working" bubble + waiting-seconds readout
          // a local run gets, so a build with no WebSocket API still reads as working
          // instead of hung during the polling fallback below.
          const streamingTurnId = crypto.randomUUID();
          const startedAt = Date.now();
          set((state) => ({
            conversationByProject: {
              ...state.conversationByProject,
              [projectId]: [
                ...(state.conversationByProject[projectId] ?? []),
                {
                  id: streamingTurnId,
                  role: "agent",
                  agent,
                  text: "",
                  streaming: true,
                  createdAt: new Date().toISOString(),
                },
              ],
            },
          }));
          // Wait for registration before triggering the turn; null falls back to polling.
          const ws = await ensureProjectSocket(projectId);
          const waitingTimer = ws
            ? null
            : setInterval(() => {
                set((state) => {
                  const turns = state.conversationByProject[projectId] ?? [];
                  return {
                    conversationByProject: {
                      ...state.conversationByProject,
                      [projectId]: turns.map((t) =>
                        t.id === streamingTurnId
                          ? { ...t, waitingSeconds: (Date.now() - startedAt) / 1000 }
                          : t,
                      ),
                    },
                  };
                });
              }, 1_000);

          try {
            const before = project ?? (await api.getProject(projectId));
            if (before.pending_question) {
              await api.answerQuestion(projectId, prompt);
            }
            // else: this is the project's first turn - `POST /projects` already started
            // the execution with this same message, so there is nothing new to send.

            let updated: Project;
            let agentTurn: ChatTurn;
            if (ws) {
              const acc = createTurnAccumulator(set, projectId, streamingTurnId);
              const controller = new AbortController();
              // Polling keeps the turn recoverable if the live connection drops.
              let race: "socket" | { polled: Project };
              try {
                race = await Promise.race([
                  waitForDistillTurnOverSocket(ws, acc, controller.signal).then(
                    () => "socket" as const,
                  ),
                  pollForDistillTurn(before, controller.signal).then((polled) => ({ polled })),
                ]);
              } finally {
                controller.abort();
              }
              if (race === "socket") {
                acc.flushNow();
                // AgentInvoker broadcasts `done` before Step Functions advances to the
                // question-persist Lambda. Wait for that projection instead of caching
                // the transient state where pending_question is still null.
                updated = await pollForDistillTurn(before);
                const artifact = acc.hasDrafted()
                  ? await api.getArtifact(projectId, agent)
                  : null;
                const streamed = (get().conversationByProject[projectId] ?? []).find(
                  (t) => t.id === streamingTurnId,
                );
                agentTurn = {
                  id: crypto.randomUUID(),
                  role: "agent",
                  agent,
                  content: artifact?.content,
                  text: streamed?.text,
                  toolCalls: streamed?.toolCalls,
                  durationMs: Date.now() - startedAt,
                  // the turn's own start, not when its artifact landed: that is what its server
                  // record is matched on, and a long run would otherwise appear twice
                  createdAt: streamed?.createdAt ?? new Date().toISOString(),
                };
              } else {
                updated = race.polled;
                agentTurn = await buildDistillTurn(updated);
              }
            } else {
              updated = await pollForDistillTurn(before);
              agentTurn = await buildDistillTurn(updated);
            }

            if (waitingTimer !== null) clearInterval(waitingTimer);
            set((state) => ({
              projects: { ...state.projects, [projectId]: updated },
              conversationByProject: {
                ...state.conversationByProject,
                [projectId]: [
                  ...(state.conversationByProject[projectId] ?? []).filter(
                    (t) => t.id !== streamingTurnId,
                  ),
                  agentTurn,
                ],
              },
              runningProjectId: null,
            }));
            if (updated.station !== "distill") await get().loadArtifacts(projectId);
            void get().loadTurns(projectId);
          } catch (err) {
            if (waitingTimer !== null) clearInterval(waitingTimer);
            // Not `ws?.close()`: the error might be `answerQuestion`'s REST call, or the
            // socket's own timeout/error/close - closing a socket that's otherwise
            // healthy here would kill the persistent connection over an unrelated
            // failure. A genuinely dead socket needs no help closing; a live one
            // should stay open for the next turn.
            set((state) => ({
              conversationByProject: {
                ...state.conversationByProject,
                [projectId]: (state.conversationByProject[projectId] ?? []).filter(
                  (t) => t.id !== userTurn.id && t.id !== streamingTurnId,
                ),
              },
              failedRun: { projectId, agent, prompt },
              runningProjectId: null,
            }));
            throw err;
          }
        }),

      _advanceProjectLocal: (projectId, agent, prompt) =>
        guarded(set, async () => {
          const startedAt = Date.now();
          const priorTurns = (get().conversationByProject[projectId] ?? []).filter(
            (t) => t.agent === agent,
          );
          const transcript = buildTranscript(priorTurns, prompt);

          const userTurnId = crypto.randomUUID();
          const streamingTurnId = crypto.randomUUID();
          const userTurn: ChatTurn = {
            id: userTurnId,
            role: "user",
            agent,
            text: prompt,
            createdAt: new Date().toISOString(),
          };
          const streamingTurn: ChatTurn = {
            id: streamingTurnId,
            role: "agent",
            agent,
            text: "",
            streaming: true,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({
            conversationByProject: {
              ...state.conversationByProject,
              [projectId]: [
                ...(state.conversationByProject[projectId] ?? []),
                userTurn,
                streamingTurn,
              ],
            },
            failedRun: null,
            runningProjectId: projectId,
          }));

          // chunks accumulate here and flush on a timer - matched by id rather than
          // object reference, since each flush replaces the turn with a new object and
          // reference equality would break after the first one
          let pendingText = "";
          let pendingDraft = "";
          let flushTimer: ReturnType<typeof setTimeout> | null = null;
          const flush = () => {
            if (!pendingText && !pendingDraft) return;
            const text = pendingText;
            const draft = pendingDraft;
            pendingText = "";
            pendingDraft = "";
            set((state) => {
              const turns = state.conversationByProject[projectId] ?? [];
              return {
                conversationByProject: {
                  ...state.conversationByProject,
                  [projectId]: turns.map((t) =>
                    t.id === streamingTurnId
                      ? { ...t, text: (t.text ?? "") + text, draft: (t.draft ?? "") + draft }
                      : t,
                  ),
                },
              };
            });
          };
          const scheduleFlush = () => {
            flushTimer ??= setTimeout(() => {
              flushTimer = null;
              flush();
            }, STREAM_FLUSH_MS);
          };
          const breaks = paragraphBreaks();
          const appendChunk = (chunk: string) => {
            pendingText += breaks.chunk(chunk);
            scheduleFlush();
          };
          // set once real draft content arrives - a voluntary-structured-output agent
          // (see agent_runtime.factory's `force_structured_output`) may finish a turn
          // having chosen not to draft anything at all, and that turn gets no artifact.
          let drafted = false;
          const appendDraft = (draft: string) => {
            if (draft) drafted = true;
            pendingDraft += draft;
            scheduleFlush();
          };
          // a running call becomes its own done call in place once it finishes - matched
          // by tool use id, so a retried call (same name, new id) gets its own row
          const upsertToolCall = (toolCall: ToolCallEvent) => {
            breaks.toolCall(toolCall);
            set((state) => {
              const turns = state.conversationByProject[projectId] ?? [];
              return {
                conversationByProject: {
                  ...state.conversationByProject,
                  [projectId]: turns.map((t) => {
                    if (t.id !== streamingTurnId) return t;
                    const existing = t.toolCalls ?? [];
                    const safeToolCall =
                      typeof toolCall.result === "string" && toolCall.result.length > 10_000
                        ? { ...toolCall, result: `${toolCall.result.slice(0, 10_000)}… (truncated)` }
                        : toolCall;
                    const idx = existing.findIndex((tc) => tc.id === safeToolCall.id);
                    const toolCalls =
                      idx === -1
                        ? [...existing, safeToolCall]
                        : existing.map((tc, i) => (i === idx ? safeToolCall : tc));
                    return { ...t, toolCalls };
                  }),
                },
              };
            });
          };
          // the model reports nothing at all while it works through a large context, so
          // this is the only sign the turn is alive - guarded because it repeats on a
          // timer and every distinct value is a re-render
          let waitingSeconds: number | undefined;
          const setWaiting = (seconds: number | undefined) => {
            if (waitingSeconds === seconds) return;
            waitingSeconds = seconds;
            set((state) => {
              const turns = state.conversationByProject[projectId] ?? [];
              return {
                conversationByProject: {
                  ...state.conversationByProject,
                  [projectId]: turns.map((t) =>
                    t.id === streamingTurnId ? { ...t, waitingSeconds: seconds } : t,
                  ),
                },
              };
            });
          };

          // undoes both turns pushed above so a failed send leaves nothing behind to
          // duplicate or confuse a retry (e.g. the composer reading stale "prior turns")
          const dropFailedTurns = () =>
            set((state) => {
              const turns = state.conversationByProject[projectId] ?? [];
              return {
                conversationByProject: {
                  ...state.conversationByProject,
                  [projectId]: turns.filter((t) => t.id !== userTurnId && t.id !== streamingTurnId),
                },
              };
            });

          runController = new AbortController();
          let project: Project | null = null;
          let usage: UsageEvent | undefined;
          try {
            for await (const event of api.advanceProject(
              projectId,
              transcript,
              runController.signal,
              prompt,
            )) {
              if (event.thinking) {
                setWaiting(event.thinking.seconds);
                continue;
              }
              setWaiting(undefined);
              if (typeof event.chunk === "string") appendChunk(event.chunk);
              else if (typeof event.draft === "string") appendDraft(event.draft);
              else if (event.tool_call) upsertToolCall(event.tool_call);
              else if (event.usage) usage = event.usage;
              else if (typeof event.error === "string") throw new TurnError(event.error, event.code);
              else if (event.done && event.project) project = event.project;
            }
            if (!project) throw new Error(`${agent} agent invocation ended without a result`);
          } catch (err) {
            if (flushTimer !== null) clearTimeout(flushTimer);
            dropFailedTurns();
            set({ failedRun: { projectId, agent, prompt }, runningProjectId: null });
            throw err;
          } finally {
            runController = null;
          }
          if (flushTimer !== null) clearTimeout(flushTimer);
          flush();

          const artifact = drafted ? await api.getArtifact(projectId, agent) : null;
          set((state) => {
            const turns = state.conversationByProject[projectId] ?? [];
            const streamingTurn = turns.find((t) => t.id === streamingTurnId);
            const agentTurn: ChatTurn = {
              id: crypto.randomUUID(),
              role: "agent",
              agent,
              // undefined when the turn drafted nothing - it stays a plain conversational
              // turn with no artifact card, same as any other intake turn (see
              // `hasContent` in api/artifacts.ts).
              content: artifact?.content,
              // carried over from the streaming turn so the tool calls and the reasoning
              // that produced this artifact stay readable instead of vanishing once it's
              // done - the narrative often holds caveats the structured output can't
              text: streamingTurn?.text,
              toolCalls: streamingTurn?.toolCalls,
              usage,
              durationMs: Date.now() - startedAt,
              // the turn's own start, so it lines up with its server record (see `conversationFromRecords`)
              createdAt: streamingTurn?.createdAt ?? new Date().toISOString(),
            };
            const withoutStreaming = turns.filter((t) => t.id !== streamingTurnId);
            return {
              projects: { ...state.projects, [projectId]: project! },
              conversationByProject: {
                ...state.conversationByProject,
                [projectId]: [...withoutStreaming, agentTurn],
              },
              runningProjectId: null,
            };
          });
          await get().loadArtifacts(projectId);
          void get().loadTurns(projectId);
        }),

      cancelRun: () => {
        runController?.abort();
        runController = null;
        set({ runningProjectId: null });
      },

      retryFailedRun: async () => {
        const failed = get().failedRun;
        if (!failed) return;
        set({ failedRun: null });
        await get().advanceProject(failed.projectId, failed.agent, failed.prompt);
      },

      deleteProject: (projectId) =>
        guarded(set, async () => {
          await api.deleteProject(projectId);
          set((state) => {
            const projects = { ...state.projects };
            delete projects[projectId];
            const artifactsByProject = { ...state.artifactsByProject };
            delete artifactsByProject[projectId];
            const conversationByProject = { ...state.conversationByProject };
            delete conversationByProject[projectId];
            const signaturesByProject = { ...state.signaturesByProject };
            delete signaturesByProject[projectId];
            const pendingByStation = Object.fromEntries(
              Object.entries(state.pendingByStation).map(([station, pending]) => [
                station,
                pending?.filter((p) => p.id !== projectId),
              ]),
            ) as typeof state.pendingByStation;
            return {
              projects,
              artifactsByProject,
              conversationByProject,
              signaturesByProject,
              pendingByStation,
              recentProjects: state.recentProjects.filter((p) => p.id !== projectId),
            };
          });
        }),

      renameProject: (projectId, name) =>
        guarded(set, async () => {
          const project = await api.renameProject(projectId, name);
          set((state) => ({
            projects: { ...state.projects, [projectId]: project },
            recentProjects: state.recentProjects.map((p) =>
              p.id === projectId ? { ...p, name: project.name } : p,
            ),
          }));
        }),

      clearError: () => set({ error: null }),
      setViewMode: (viewMode) => set({ viewMode }),

      setComposerDraft: (projectId, text) =>
        set((state) => ({ composerDrafts: { ...state.composerDrafts, [projectId]: text } })),
    }),
    {
      name: "hyperdelivery-console",
      version: 2,
      storage: createJSONStorage(() => safeLocalStorage),
      // Only what belongs to this browser: which projects it opened, and how much detail it
      // wants. Conversations and the trace live on the server (see `loadTurns`), so nothing a
      // project produced is kept here - it is small, per browser and readable by any script on
      // the origin.
      partialize: (state) => ({
        recentProjects: state.recentProjects,
        viewMode: state.viewMode,
      }),
      // Named fields only, so what an older version stored (whole conversations, signatures)
      // is ignored and then overwritten on the next save instead of loaded back in.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<Pick<ProjectsState, "recentProjects" | "viewMode">>;
        return {
          ...current,
          recentProjects: saved.recentProjects ?? current.recentProjects,
          viewMode: saved.viewMode ?? current.viewMode,
        };
      },
    },
  ),
);
