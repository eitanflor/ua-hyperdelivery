import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../api/client";
import { buildTranscript } from "../lib/transcript";
import type { Artifact, DecisionRequest, Project, Station } from "../api/types";

const MAX_RECENTS = 30;

export interface RecentProject {
  id: string;
  name: string;
}

export interface ChatTurn {
  // stable identity for matching a turn across updates (e.g. appendChunk replacing it
  // with a new object each time) - object references break the moment a turn is
  // recreated via spread, which left orphaned streaming bubbles stuck in the
  // conversation forever on error once at least one chunk had arrived.
  id: string;
  role: "user" | "agent";
  agent: string;
  text?: string; // user turns, and the accumulating text of an in-progress agent turn
  content?: Record<string, unknown>; // finished agent turns
  streaming?: boolean; // true while an agent turn is still receiving chunks
  createdAt: string;
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
  loading: boolean;
  error: string | null;

  createProject: (name: string) => Promise<Project>;
  // Creates a project straight from a message (no name typed in - see ProjectNamer on
  // the backend) and immediately sends that same message as Distill's first turn, so
  // the landing-page chatbox behaves like one continuous action instead of two.
  createProjectFromMessage: (message: string) => Promise<Project>;
  loadProject: (projectId: string) => Promise<void>;
  loadArtifacts: (projectId: string) => Promise<void>;
  loadPending: (station: Station) => Promise<void>;
  submitDecision: (projectId: string, decision: DecisionRequest) => Promise<void>;
  advanceProject: (projectId: string, agent: string, prompt: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  renameProject: (projectId: string, name: string) => Promise<void>;
  clearError: () => void;
}

async function guarded(set: (partial: Partial<ProjectsState>) => void, fn: () => Promise<void>) {
  set({ loading: true, error: null });
  try {
    await fn();
  } catch (err) {
    set({ error: err instanceof Error ? err.message : String(err) });
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
      loading: false,
      error: null,

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
        // the same conversationByProject state ChatThread/RunAgentPrompt already read
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

      submitDecision: (projectId, decision) =>
        guarded(set, async () => {
          const project = await api.submitDecision(projectId, decision);
          set((state) => ({ projects: { ...state.projects, [projectId]: project } }));
          await get().loadArtifacts(projectId);
        }),

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
              [projectId]: [...(state.conversationByProject[projectId] ?? []), userTurn, streamingTurn],
            },
          }));

          // appends a streamed chunk onto the placeholder turn pushed above - matched by
          // id rather than object reference, since this replaces the turn with a new
          // object each call and reference equality would break after the first chunk
          const appendChunk = (chunk: string) =>
            set((state) => {
              const turns = state.conversationByProject[projectId] ?? [];
              return {
                conversationByProject: {
                  ...state.conversationByProject,
                  [projectId]: turns.map((t) =>
                    t.id === streamingTurnId ? { ...t, text: (t.text ?? "") + chunk } : t,
                  ),
                },
              };
            });
          // undoes both turns pushed above so a failed send leaves nothing behind to
          // duplicate or confuse a retry (e.g. RunAgentPrompt reading stale "prior turns")
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

          let project: Project | null = null;
          try {
            for await (const event of api.advanceProject(projectId, transcript)) {
              if (typeof event.chunk === "string") appendChunk(event.chunk);
              else if (typeof event.error === "string") throw new Error(event.error);
              else if (event.done && event.project) project = event.project;
            }
            if (!project) throw new Error(`${agent} agent invocation ended without a result`);
          } catch (err) {
            dropFailedTurns();
            throw err;
          }

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
            };
          });
          await get().loadArtifacts(projectId);
        }),

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
            const pendingByStation = Object.fromEntries(
              Object.entries(state.pendingByStation).map(([station, projects]) => [
                station,
                projects?.filter((p) => p.id !== projectId),
              ]),
            ) as typeof state.pendingByStation;
            return {
              projects,
              artifactsByProject,
              conversationByProject,
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
      }),
    },
  ),
);
