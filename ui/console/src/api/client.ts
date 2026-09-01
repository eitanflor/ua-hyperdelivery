import type { Artifact, DecisionRequest, Project, Station } from "./types";
import { getIdToken } from "../auth/idToken";

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8090";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getIdToken();
  const resp = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...init,
  });
  if (!resp.ok) {
    throw new ApiError(resp.status, await _errorMessage(resp));
  }
  return (await resp.json()) as T;
}

// FastAPI's HTTPException bodies are `{"detail": "..."}` - surface that directly
// instead of the raw JSON blob, since this ends up shown to the user verbatim (e.g.
// in the global error toast).
async function _errorMessage(resp: Response): Promise<string> {
  const text = await resp.text();
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed?.detail === "string") return parsed.detail;
  } catch {
    // not JSON - fall through to the raw text
  }
  return text || resp.statusText;
}

export interface ToolCallEvent {
  id: string;
  name: string;
  status: "running" | "done";
  result?: unknown;
}

export interface AdvanceStreamEvent {
  chunk?: string;
  error?: string;
  done?: true;
  project?: Project;
  tool_call?: ToolCallEvent;
}

// Parses a `text/event-stream` body (`data: <json>\n\n` per event, per
// BedrockAgentCoreApp/the console API's SSE proxy) into individual JSON events as they
// arrive - fetch()'s ReadableStream doesn't do this for us the way EventSource would,
// but EventSource can't send a POST body, which /advance/stream needs for the prompt.
async function* readSse(resp: Response): AsyncGenerator<AdvanceStreamEvent> {
  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      for (const line of rawEvent.split("\n")) {
        if (line.startsWith("data: ")) yield JSON.parse(line.slice("data: ".length));
      }
    }
  }
}

export const api = {
  // Either a name, or a message to generate one from (see the backend's ProjectNamer,
  // Claude Haiku) - the console UI's landing-page chatbox creates a project straight
  // from a message with no name typed in.
  createProject: (payload: { name?: string; message?: string }) =>
    request<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getProject: (projectId: string) => request<Project>(`/projects/${projectId}`),

  listProjects: () => request<Project[]>("/projects"),

  renameProject: (projectId: string, name: string) =>
    request<Project>(`/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),

  deleteProject: async (projectId: string): Promise<void> => {
    const token = await getIdToken();
    const resp = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) {
      throw new ApiError(resp.status, await _errorMessage(resp));
    }
  },

  listPending: (station: Station) =>
    request<Project[]>(`/projects/pending/${station}`),

  listArtifacts: (projectId: string) =>
    request<Artifact[]>(`/projects/${projectId}/artifacts`),

  getArtifact: (projectId: string, agent: string) =>
    request<Artifact>(`/projects/${projectId}/artifacts/${agent}`),

  submitDecision: (projectId: string, decision: DecisionRequest) =>
    request<Project>(`/projects/${projectId}/decisions`, {
      method: "POST",
      body: JSON.stringify(decision),
    }),

  // Local-dev-only: invokes the current station's agent directly (no deployed Step
  // Functions/AgentCore Runtime) and advances the project. 409s once a real state
  // machine is configured on the backend. Streams the agent's output as it's produced
  // (see /advance/stream on the console API) instead of blocking until it's done.
  advanceProject: async function* (
    projectId: string,
    prompt?: string,
    signal?: AbortSignal,
  ): AsyncGenerator<AdvanceStreamEvent> {
    const token = await getIdToken();
    const resp = await fetch(`${API_BASE_URL}/projects/${projectId}/advance/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ prompt: prompt ?? null }),
      signal,
    });
    if (!resp.ok) {
      const detail = await resp.text();
      throw new ApiError(resp.status, detail || resp.statusText);
    }
    yield* readSse(resp);
  },
};

