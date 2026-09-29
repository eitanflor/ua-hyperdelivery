import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `WEBSOCKET_URL` is read when the module loads, so each test loads a fresh copy.
async function load(websocketUrl = "") {
  vi.stubEnv("VITE_WEBSOCKET_URL", websocketUrl);
  vi.resetModules();
  return import("./client");
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const sse = (...chunks: string[]) =>
  new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
        controller.close();
      },
    }),
    { status: 200 },
  );

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("requests", () => {
  it("sends the bearer token and JSON headers, and parses the body", async () => {
    const { api } = await load();
    fetchMock.mockResolvedValue(json([{ id: "a" }]));
    expect(await api.listProjects()).toEqual([{ id: "a" }]);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toMatch(/\/projects$/);
    expect(init?.headers).toEqual({ "Content-Type": "application/json", Authorization: "Bearer tok" });
  });

  it("posts a JSON body for a decision", async () => {
    const { api } = await load();
    fetchMock.mockResolvedValue(json({ id: "a" }));
    await api.submitDecision("a", { approved: false, comment: "no" });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toMatch(/\/projects\/a\/decisions$/);
    expect(init).toMatchObject({ method: "POST", body: JSON.stringify({ approved: false, comment: "no" }) });
  });

  it("raises the server's detail and a known code", async () => {
    const { api, ApiError } = await load();
    fetchMock.mockResolvedValue(json({ detail: "not yours", code: "token_invalid" }, 401));
    const err = await api.listProjects().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 401, message: "not yours", code: "token_invalid" });
  });

  it("drops a code it does not recognize", async () => {
    const { api } = await load();
    fetchMock.mockResolvedValue(json({ detail: "odd", code: "made_up" }, 400));
    expect(await api.listProjects().catch((e: unknown) => e)).toMatchObject({ message: "odd", code: null });
  });

  it("falls back to the raw text, then the status text, for a non-JSON error", async () => {
    const { api } = await load();
    fetchMock.mockResolvedValueOnce(new Response("upstream down", { status: 502 }));
    expect(await api.listProjects().catch((e: unknown) => e)).toMatchObject({ status: 502, message: "upstream down" });
    fetchMock.mockResolvedValueOnce(new Response("", { status: 503, statusText: "Service Unavailable" }));
    expect(await api.listProjects().catch((e: unknown) => e)).toMatchObject({ message: "Service Unavailable" });
  });

  it("raises on a failed delete and upload too", async () => {
    const { api } = await load();
    fetchMock.mockImplementation(async () => json({ detail: "gone", code: "project_not_found" }, 404));
    await expect(api.deleteProject("a")).rejects.toMatchObject({ code: "project_not_found" });
    await expect(api.uploadDocument("a", new File(["x"], "a.txt"))).rejects.toMatchObject({ status: 404 });
  });

  it("uploads as multipart without forcing a content type", async () => {
    const { api } = await load();
    fetchMock.mockResolvedValue(json({ key: "k", filename: "a.txt" }));
    expect(await api.uploadDocument("a", new File(["x"], "a.txt"))).toEqual({ key: "k", filename: "a.txt" });
    const init = fetchMock.mock.calls[0]![1]!;
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.headers).toEqual({ Authorization: "Bearer tok" });
  });
});

describe("advanceProject", () => {
  const collect = async (stream: AsyncIterable<unknown>) => {
    const events: unknown[] = [];
    for await (const event of stream) events.push(event);
    return events;
  };

  it("posts the transcript and the typed message", async () => {
    const { api } = await load();
    fetchMock.mockResolvedValue(sse(""));
    await collect(api.advanceProject("a", "User: hi", undefined, "hi"));
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toMatch(/\/projects\/a\/advance\/stream$/);
    expect(JSON.parse(String(init?.body))).toEqual({ prompt: "User: hi", message: "hi" });
  });

  it("yields each event, including ones split across network chunks", async () => {
    const { api } = await load();
    fetchMock.mockResolvedValue(
      sse('data: {"chunk":"He', 'llo"}\n\ndata: {"chunk":"!"}\n\n', 'data: {"done":true}\n\n'),
    );
    expect(await collect(api.advanceProject("a", "p"))).toEqual([{ chunk: "Hello" }, { chunk: "!" }, { done: true }]);
  });

  it("ignores lines that are not data", async () => {
    const { api } = await load();
    fetchMock.mockResolvedValue(sse(': keep-alive\n\ndata: {"chunk":"x"}\n\n'));
    expect(await collect(api.advanceProject("a", "p"))).toEqual([{ chunk: "x" }]);
  });

  it("raises an ApiError before streaming when the request is refused", async () => {
    const { api } = await load();
    fetchMock.mockResolvedValue(json({ detail: "busy", code: "state_machine_active" }, 409));
    await expect(collect(api.advanceProject("a", "p"))).rejects.toMatchObject({ status: 409, code: "state_machine_active" });
  });
});

describe("openProjectStream", () => {
  class FakeSocket extends EventTarget {
    static instances: FakeSocket[] = [];
    close = vi.fn();
    url: string;
    constructor(url: string) {
      super();
      this.url = url;
      FakeSocket.instances.push(this);
    }
  }

  beforeEach(() => {
    FakeSocket.instances = [];
    vi.stubGlobal("WebSocket", FakeSocket);
    fetchMock.mockResolvedValue(json({ ticket: "t1" }));
  });

  it("is null, and asks for no ticket, when no WebSocket API is configured", async () => {
    const { api } = await load("");
    expect(await api.openProjectStream("a")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resolves the socket once it is open, on a URL carrying the ticket", async () => {
    vi.useFakeTimers();
    const { api } = await load("wss://ws.example/live");
    const opened = api.openProjectStream("a");
    await vi.advanceTimersByTimeAsync(0);
    const socket = FakeSocket.instances[0]!;
    expect(socket.url).toBe("wss://ws.example/live?project_id=a&ticket=t1");
    socket.dispatchEvent(new Event("open"));
    expect(await opened).toBe(socket);
    expect(socket.close).not.toHaveBeenCalled();
  });

  it("is null and closes the socket when the handshake errors", async () => {
    vi.useFakeTimers();
    const { api } = await load("wss://ws.example/live");
    const opened = api.openProjectStream("a");
    await vi.advanceTimersByTimeAsync(0);
    FakeSocket.instances[0]!.dispatchEvent(new Event("error"));
    expect(await opened).toBeNull();
    expect(FakeSocket.instances[0]!.close).toHaveBeenCalled();
  });

  it("is null and closes the socket when the handshake takes over five seconds", async () => {
    vi.useFakeTimers();
    const { api } = await load("wss://ws.example/live");
    const opened = api.openProjectStream("a");
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(await opened).toBeNull();
    expect(FakeSocket.instances[0]!.close).toHaveBeenCalled();
  });
});
