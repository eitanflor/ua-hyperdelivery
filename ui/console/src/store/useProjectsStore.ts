import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../api/client";
import { buildTranscript } from "../lib/transcript";
import { describeError, type FriendlyError } from "../lib/errors";
import type { Artifact, DecisionRequest, Project, Station } from "../api/types";

const MAX_RECENTS = 30;

/** How long a gate decision stays undoable before it is sent.
 *
 * Deliberately client-side for now: if the tab closes inside the window the decision is
 * dropped rather than recorded, which is the safe direction to fail for an audit gate.
 * A server-side deferred dispatch would make it durable - see docs/console-redesign.md. */
const UNDO_MS = 12_000;

/** Streamed tokens are buffered this long before hitting the store, so a fast agent
 * does not rewrite the conversation map once per token. */
const STREAM_FLUSH_MS = 80;

const GATES = ["blueprint_approval", "review_approval"] as const;

export interface RecentProject {
  id: string;
  name: string;
}

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
  streaming?: boolean; // true while an agent turn is still receiving chunks
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
  /** Epoch ms at which this stops being undoable and is sent. */
  deadline: number;
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
  // Full per-project turn history (user prompts + agent replies) - lets a station's
  // elicitation loop (e.g. Distill asking for missing info) render as a real back-and-
  // forth instead of a single overwritten artifact.
  conversationByProject: Record<string, ChatTurn[]>;
  signaturesByProject: Record<string, Signature[]>;
  loading: boolean;
  error: FriendlyError | null;
  failedRun: FailedRun | null;
  pendingDecision: PendingDecision | null;
  /** Set while an agent run is in flight, so the UI can offer a stop. */
  runningProjectId: string | null;

  createProject: (name: string) => Promise<Project>;
  // Creates a project straight from a message (no name typed in - see ProjectNamer on
  // the backend) and immediately sends that same message as Distill's first turn, so
  // the landing-page chatbox behaves like one continuous action instead of two.
  createProjectFromMessage: (message: string) => Promise<Project>;
  loadProject: (projectId: string) => Promise<void>;
  // Backs the portfolio dashboard - every project, not just the ones this browser has
  // visited (unlike `recentProjects`, which is a local echo).
  loadProjects: () => Promise<void>;
  loadArtifacts: (projectId: string) => Promise<void>;
  loadPending: (station: Station) => Promise<void>;
  decide: (projectId: string, station: Station, decision: DecisionRequest) => void;
  undoDecision: () => void;
  advanceProject: (projectId: string, agent: string, prompt: string) => Promise<void>;
  cancelRun: () => void;
  retryFailedRun: () => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  renameProject: (projectId: string, name: string) => Promise<void>;
  clearError: () => void;
}

// Kept outside the store: neither is state the UI renders, and neither should ever be
// persisted or trigger a re-render.
let undoTimer: ReturnType<typeof setTimeout> | null = null;
let runController: AbortController | null = null;

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

function rememberRecent(recents: RecentProject[], project: Project): RecentProject[] {
  const withoutThis = recents.filter((p) => p.id !== project.id);
  return [{ id: project.id, name: project.name }, ...withoutThis].slice(0, MAX_RECENTS);
}

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: {},
      artifactsByProject: {},
      pendingByStation: {},
      recentProjects: [],
      conversationByProject: {},
      signaturesByProject: {},
      loading: false,
      error: null,
      failedRun: null,
      pendingDecision: null,
      runningProjectId: null,

      createProject: async (name) => {
        const project = await api.createProject({ name });
        set((state) => ({
          projects: { ...state.projects, [project.id]: project },
          recentProjects: rememberRecent(state.recentProjects, project),
        }));
        return project;
      },

      createProjectFromMessage: async (message) => {
        const project = await api.createProject({ message });
        set((state) => ({
          projects: { ...state.projects, [project.id]: project },
          recentProjects: rememberRecent(state.recentProjects, project),
        }));
        // don't block on the first Distill turn - the caller navigates to the new
        // project's workspace as soon as it exists, and watches this happen live via
        // the same conversationByProject state the thread already reads
        void get().advanceProject(project.id, "distill", message);
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
          const projects = await api.listProjects();
          set((state) => ({
            projects: {
              ...state.projects,
              ...Object.fromEntries(projects.map((p) => [p.id, p])),
            },
          }));
        }),

      loadArtifacts: (projectId) =>
        guarded(set, async () => {
          const artifacts = await api.listArtifacts(projectId);
          set((state) => ({
            artifactsByProject: { ...state.artifactsByProject, [projectId]: artifacts },
          }));
        }),

      loadPending: (station) =>
        guarded(set, async () => {
          const pending = await api.listPending(station);
          set((state) => ({
            pendingByStation: { ...state.pendingByStation, [station]: pending },
          }));
        }),

      // Holds the decision locally for UNDO_MS, then sends it. The gate counts this
      // window down; undoDecision() cancels before anything reaches the backend.
      decide: (projectId, station, decision) => {
        if (undoTimer !== null) clearTimeout(undoTimer);
        set({
          pendingDecision: { projectId, station, decision, deadline: Date.now() + UNDO_MS },
          error: null,
        });
        undoTimer = setTimeout(() => {
          undoTimer = null;
          const pending = get().pendingDecision;
          if (!pending) return;
          set({ pendingDecision: null });
          void guarded(set, async () => {
            const project = await api.submitDecision(pending.projectId, pending.decision);
            const signature: Signature = {
              station: pending.station,
              signer: pending.decision.signer,
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
            }));
            await get().loadArtifacts(pending.projectId);
            for (const gate of GATES) void get().loadPending(gate);
          });
        }, UNDO_MS);
      },

      undoDecision: () => {
        if (undoTimer !== null) clearTimeout(undoTimer);
        undoTimer = null;
        set({ pendingDecision: null });
      },

      advanceProject: (projectId, agent, prompt) =>
        guarded(set, async () => {
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
          let flushTimer: ReturnType<typeof setTimeout> | null = null;
          const flush = () => {
            if (!pendingText) return;
            const text = pendingText;
            pendingText = "";
            set((state) => {
              const turns = state.conversationByProject[projectId] ?? [];
              return {
                conversationByProject: {
                  ...state.conversationByProject,
                  [projectId]: turns.map((t) =>
                    t.id === streamingTurnId ? { ...t, text: (t.text ?? "") + text } : t,
                  ),
                },
              };
            });
          };
          const appendChunk = (chunk: string) => {
            pendingText += chunk;
            flushTimer ??= setTimeout(() => {
              flushTimer = null;
              flush();
            }, STREAM_FLUSH_MS);
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
          try {
            for await (const event of api.advanceProject(
              projectId,
              transcript,
              runController.signal,
            )) {
              if (typeof event.chunk === "string") appendChunk(event.chunk);
              else if (typeof event.error === "string") throw new Error(event.error);
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

          const artifact = await api.getArtifact(projectId, agent);
          const agentTurn: ChatTurn = {
            id: crypto.randomUUID(),
            role: "agent",
            agent,
            content: artifact.content,
            createdAt: artifact.created_at,
          };
          set((state) => {
            const turns = state.conversationByProject[projectId] ?? [];
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
    }),
    {
      name: "hyperdelivery-console",
      partialize: (state) => ({
        recentProjects: state.recentProjects,
        conversationByProject: state.conversationByProject,
        signaturesByProject: state.signaturesByProject,
      }),
    },
  ),
);
