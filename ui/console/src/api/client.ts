import type {
  Artifact,
  Builds,
  Decision,
  DecisionRequest,
  GlobalContext,
  PreviewResponse,
  Project,
  Station,
  StoredDocument,
} from "./types";
import { getIdToken } from "../auth/idToken";

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8090";

// Unset in local dev (no deployed WebSocket API) - `openProjectStream` returns null in
// that case and callers fall back to polling. See infra/stacks/orchestration_stack.py's
// ConsoleWebSocketApi for the deployed side of this.
const WEBSOCKET_URL: string | undefined = import.meta.env.VITE_WEBSOCKET_URL;

// Bounds how long `openProjectStream` waits for the handshake to complete before giving
// up and letting the caller fall back to polling.
const WS_OPEN_TIMEOUT_MS = 5_000;

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
  /** `interrupted` is a call the turn ended without a result for - it is finished in the
   * sense that nothing more is coming, which is what stops the spinner. */
  status: "running" | "done" | "interrupted";
  result?: unknown;
  /** The call's arguments, long strings clipped. Only on a finished call - while one is
   * still streaming its input is a half-written JSON string. */
  input?: Record<string, unknown>;
}

/** Tokens the whole turn burned, accumulated across every model call the agent made.
 *
 * `input_tokens` is the *uncached* input only - with prompt caching on, most of the
 * prompt lands in the two cache counts instead, and only all five together add up. */
export interface UsageEvent {
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  total_tokens: number;
}

export interface AdvanceStreamEvent {
  chunk?: string;
  /** The next slice of the artifact's JSON as the agent writes it - append, don't replace. */
  draft?: string;
  error?: string;
  done?: true;
  project?: Project;
  tool_call?: ToolCallEvent;
  /** Emitted on a timer while the agent is waiting on the model, which produces nothing
   * observable until its first token. Its absence means events are flowing normally. */
  thinking?: { seconds: number };
  usage?: UsageEvent;
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
  // from a message with no name typed in. `id`, if given, becomes the project's id
  // instead of one generated server-side - see `createProjectFromMessage`, which opens
  // this project's WebSocket connection before this call even exists.
  createProject: (payload: { name?: string; message?: string; id?: string }) =>
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

  getContext: () => request<GlobalContext>("/context"),

  setContext: (context: string) =>
    request<GlobalContext>("/context", {
      method: "PATCH",
      body: JSON.stringify({ context }),
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

  listArtifactVersions: (projectId: string, agent: string) =>
    request<Artifact[]>(`/projects/${projectId}/artifacts/${agent}/versions`),

  listDocuments: (projectId: string) => request<StoredDocument[]>(`/projects/${projectId}/documents`),

  // Stores the raw file in S3 and hands back its key - the console never parses it
  // itself. `Content-Type` is deliberately left unset so the browser sets its own
  // multipart boundary (see `request()`, which always sends application/json).
  uploadDocument: async (
    projectId: string,
    file: File,
  ): Promise<{ key: string; filename: string }> => {
    const token = await getIdToken();
    const body = new FormData();
    body.append("file", file);
    const resp = await fetch(`${API_BASE_URL}/projects/${projectId}/documents`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
    if (!resp.ok) {
      throw new ApiError(resp.status, await _errorMessage(resp));
    }
    return (await resp.json()) as { key: string; filename: string };
  },

  listBuilds: (projectId: string) => request<Builds>(`/projects/${projectId}/builds`),

  // Idempotent: safe to call again once already running, or when the backend has no
  // PREVIEW_CHECKOUT_PATH configured - both come back as a normal (non-error) response.
  startPreview: (projectId: string) =>
    request<PreviewResponse>(`/projects/${projectId}/preview`, { method: "POST" }),

  stopPreview: (projectId: string) =>
    request<PreviewResponse>(`/projects/${projectId}/preview/stop`, { method: "POST" }),

  submitDecision: (projectId: string, decision: DecisionRequest) =>
    request<Project>(`/projects/${projectId}/decisions`, {
      method: "POST",
      body: JSON.stringify(decision),
    }),

  listDecisions: (projectId: string) => request<Decision[]>(`/projects/${projectId}/decisions`),

  // Deployed-mode counterpart of the local advanceProject stream: answers Distill's
  // pending_question via the state machine's task token instead of invoking an agent
  // directly. 409s if no state machine is configured (see the backend's answer_question).
  answerQuestion: (projectId: string, answer: string) =>
    request<Project>(`/projects/${projectId}/answer`, {
      method: "POST",
      body: JSON.stringify({ answer }),
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

  // The deployed-mode counterpart of the SSE stream above: the console API has no live
  // connection to the state machine, so `agent_invoker` pushes each event straight to
  // this WebSocket instead (see ConsoleWebSocketApi). Resolves only once the socket is
  // actually open, not as soon as it's constructed - API Gateway's `$connect` route runs
  // synchronously as part of the handshake, so an open socket is proof `agent_invoker`'s
  // connections table already has this connection's row, and the caller can trigger the
  // turn right after without racing it (no backend-side retry needed for that race).
  // Resolves `null` if no WebSocket API is configured for this build, or if the handshake
  // errors or doesn't complete within `WS_OPEN_TIMEOUT_MS`, so a caller can fall back to
  // polling either way.
  openProjectStream: async (projectId: string): Promise<WebSocket | null> => {
    if (!WEBSOCKET_URL) return null;
    const { ticket } = await request<{ ticket: string }>(`/projects/${projectId}/stream-ticket`, {
      method: "POST",
    });
    const query = new URLSearchParams({ project_id: projectId, ticket });
    const ws = new WebSocket(`${WEBSOCKET_URL}?${query}`);
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        cleanup();
        ws.close();
        resolve(null);
      }, WS_OPEN_TIMEOUT_MS);
      const cleanup = () => {
        clearTimeout(timeout);
        ws.removeEventListener("open", onOpen);
        ws.removeEventListener("error", onError);
      };
      const onOpen = () => {
        cleanup();
        resolve(ws);
      };
      const onError = () => {
        cleanup();
        ws.close();
        resolve(null);
      };
      ws.addEventListener("open", onOpen);
      ws.addEventListener("error", onError);
    });
  },
};
