import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { api, ApiError, type AdvanceStreamEvent } from "../api/client";
import type { Artifact, Build, Builds, Project } from "../api/types";
import { closeProjectSocket, useProjectsStore } from "./useProjectsStore";

const initial = useProjectsStore.getState();
const state = () => useProjectsStore.getState();

const project = (id: string, over: Partial<Project> = {}): Project => ({
  id,
  name: `Project ${id}`,
  station: "distill",
  pending_question: null,
  orchestration_mode: "local",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...over,
});

const artifact = (content: Record<string, unknown>): Artifact =>
  ({ agent: "distill", content, version: 1, created_at: "2026-01-01T00:00:00Z" }) as Artifact;

const stream = (...events: AdvanceStreamEvent[]) =>
  vi.spyOn(api, "advanceProject").mockImplementation(async function* () {
    yield* events;
  });

const conversation = (id: string) => state().conversationByProject[id] ?? [];

beforeEach(() => {
  useProjectsStore.setState(initial, true);
  vi.spyOn(api, "listArtifacts").mockResolvedValue([]);
  vi.spyOn(api, "listTurns").mockResolvedValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("a local run", () => {
  it("streams text, tool calls and usage into one finished agent turn", async () => {
    const usage = { input_tokens: 1, output_tokens: 2, cache_read_tokens: 0, cache_write_tokens: 0, total_tokens: 3 };
    const advance = stream(
      { chunk: "Hel" },
      { tool_call: { id: "t1", name: "search_code", status: "running" } },
      { tool_call: { id: "t1", name: "search_code", status: "done", result: "ok" } },
      { chunk: "lo" },
      { usage },
      { done: true, project: project("p1", { station: "blueprint_approval" }) },
    );
    await state().advanceProject("p1", "distill", "hi");

    expect(advance).toHaveBeenCalledWith("p1", "User: hi", expect.any(AbortSignal), "hi");
    const [user, agent] = conversation("p1");
    expect(user).toMatchObject({ role: "user", text: "hi" });
    expect(agent).toMatchObject({ role: "agent", text: "Hel\n\nlo", usage });
    expect(agent!.toolCalls).toEqual([{ id: "t1", name: "search_code", status: "done", result: "ok" }]);
    expect(agent!.streaming).toBeUndefined();
    expect(state().projects["p1"]!.station).toBe("blueprint_approval");
    expect(state().runningProjectId).toBeNull();
    expect(state().error).toBeNull();
  });

  it("fetches the artifact only when the agent actually drafted one", async () => {
    const getArtifact = vi.spyOn(api, "getArtifact").mockResolvedValue(artifact({ title: "Plan" }));
    stream({ chunk: "just talking" }, { done: true, project: project("p2") });
    await state().advanceProject("p2", "distill", "hi");
    expect(getArtifact).not.toHaveBeenCalled();

    stream({ draft: '{"title":"Plan"' }, { done: true, project: project("p2") });
    await state().advanceProject("p2", "distill", "again");
    expect(getArtifact).toHaveBeenCalledWith("p2", "distill");
    expect(conversation("p2").at(-1)!.content).toEqual({ title: "Plan" });
  });

  it("replays prior turns of the same agent as the transcript", async () => {
    stream({ done: true, project: project("p3") });
    await state().advanceProject("p3", "distill", "first");
    const advance = stream({ done: true, project: project("p3") });
    await state().advanceProject("p3", "distill", "second");
    expect(advance.mock.calls.at(-1)![1]).toBe("User: first\nUser: second");
  });

  it("caps a huge tool result", async () => {
    stream(
      { tool_call: { id: "t", name: "get_file_contents", status: "done", result: "x".repeat(20_000) } },
      { done: true, project: project("p4") },
    );
    await state().advanceProject("p4", "distill", "hi");
    const result = conversation("p4").at(-1)!.toolCalls![0]!.result as string;
    expect(result.length).toBeLessThan(10_100);
    expect(result).toMatch(/\(truncated\)$/);
  });

  it("drops both turns, keeps the failure for a retry and words the error", async () => {
    stream({ chunk: "partial" }, { error: "took too long", code: "agent_timeout" });
    await state().advanceProject("p5", "distill", "hi");
    expect(conversation("p5")).toEqual([]);
    expect(state().failedRun).toEqual({ projectId: "p5", agent: "distill", prompt: "hi" });
    expect(state().error?.title).toBe("The agent took too long");
    expect(state().runningProjectId).toBeNull();
  });

  it("treats a stream that ends without a result as a failure", async () => {
    stream({ chunk: "x" });
    await state().advanceProject("p6", "distill", "hi");
    expect(state().error?.detail).toMatch(/ended without a result/);
    expect(state().failedRun).not.toBeNull();
  });

  it("treats a refused request as a failure", async () => {
    vi.spyOn(api, "advanceProject").mockImplementation(async function* () {
      yield* [];
      throw new ApiError(409, "moved", "not_at_agent_station");
    });
    await state().advanceProject("p7", "distill", "hi");
    expect(state().error?.title).toBe("This project moved on without you");
  });

  it("retries the failed run with the same prompt", async () => {
    stream({ error: "boom" });
    await state().advanceProject("p8", "distill", "hi");
    const advance = stream({ done: true, project: project("p8") });
    await state().retryFailedRun();
    expect(advance.mock.calls[0]![3]).toBe("hi");
    expect(state().failedRun).toBeNull();
    expect(conversation("p8")).toHaveLength(2);
  });

  it("does nothing to retry when nothing failed", async () => {
    const advance = stream();
    await state().retryFailedRun();
    expect(advance).not.toHaveBeenCalled();
  });

  it("can be canceled, which reads as Stopped rather than a failure to fix", async () => {
    vi.spyOn(api, "advanceProject").mockImplementation(async function* (_id, _prompt, signal) {
      await new Promise((_, reject) =>
        signal!.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))),
      );
      yield {};
    });
    const running = state().advanceProject("p9", "distill", "hi");
    await vi.waitFor(() => expect(state().runningProjectId).toBe("p9"));
    state().cancelRun();
    await running;
    expect(state().runningProjectId).toBeNull();
    expect(state().error?.title).toBe("Stopped");
  });
});

describe("a deployed run", () => {
  const deployed = (id: string, over: Partial<Project> = {}) =>
    project(id, { orchestration_mode: "deployed", ...over });

  it("says a later station runs by itself instead of sending anything", async () => {
    useProjectsStore.setState({ projects: { d1: deployed("d1", { station: "blueprint" }) } });
    const advance = vi.spyOn(api, "advanceProject");
    await state().advanceProject("d1", "blueprint", "hello");
    expect(advance).not.toHaveBeenCalled();
    expect(conversation("d1").map((t) => t.role)).toEqual(["user", "agent"]);
    expect(conversation("d1")[1]!.text).toMatch(/runs automatically/);
    expect(state().runningProjectId).toBeNull();
  });

  describe("polling, with no live connection", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(api, "openProjectStream").mockResolvedValue(null);
    });

    it("answers the pending question, waits for the next turn and shows its questions", async () => {
      const asked = { status: "questions" as const, questions: [{ id: "q", question: "Which?", options: ["a"], multi_select: false }] };
      useProjectsStore.setState({ projects: { d2: deployed("d2", { pending_question: { status: "chat", message: "?" } }) } });
      const answer = vi.spyOn(api, "answerQuestion").mockResolvedValue(deployed("d2"));
      vi.spyOn(api, "getProject").mockResolvedValue(deployed("d2", { pending_question: asked }));

      const running = state().advanceProject("d2", "distill", "an answer");
      await vi.advanceTimersByTimeAsync(1_000);
      expect(conversation("d2").at(-1)).toMatchObject({ streaming: true, waitingSeconds: 1 });
      await vi.advanceTimersByTimeAsync(2_000);
      await running;

      expect(answer).toHaveBeenCalledWith("d2", "an answer");
      const agent = conversation("d2").at(-1)!;
      expect(agent.toolCalls?.[0]).toMatchObject({ name: "ask_clarifying_questions", result: { questions: asked.questions } });
      expect(state().runningProjectId).toBeNull();
    });

    it("sends no answer on a project's first turn, and shows the draft once it leaves distill", async () => {
      useProjectsStore.setState({ projects: { d3: deployed("d3") } });
      const answer = vi.spyOn(api, "answerQuestion");
      vi.spyOn(api, "getProject").mockResolvedValue(deployed("d3", { station: "blueprint_approval" }));
      vi.spyOn(api, "getArtifact").mockResolvedValue(artifact({ title: "Brief" }));

      const running = state().advanceProject("d3", "distill", "start");
      await vi.advanceTimersByTimeAsync(3_000);
      await running;

      expect(answer).not.toHaveBeenCalled();
      expect(conversation("d3").at(-1)!.content).toEqual({ title: "Brief" });
      expect(state().projects["d3"]!.station).toBe("blueprint_approval");
    });

    it("gives up after five minutes and keeps the failure for a retry", async () => {
      useProjectsStore.setState({ projects: { d4: deployed("d4") } });
      vi.spyOn(api, "getProject").mockResolvedValue(deployed("d4"));

      const running = state().advanceProject("d4", "distill", "start");
      await vi.advanceTimersByTimeAsync(5 * 60_000 + 3_000);
      await running;

      expect(state().error?.detail).toBe("Distill did not respond in time");
      expect(state().failedRun).toEqual({ projectId: "d4", agent: "distill", prompt: "start" });
      expect(conversation("d4")).toEqual([]);
    });

    it("drops both turns when answering the question is refused", async () => {
      useProjectsStore.setState({ projects: { d5: deployed("d5", { pending_question: { status: "chat" } }) } });
      vi.spyOn(api, "answerQuestion").mockRejectedValue(new ApiError(409, "no machine", "state_machine_required"));

      await state().advanceProject("d5", "distill", "hi");

      expect(conversation("d5")).toEqual([]);
      expect(state().error?.title).toBe("This isn't set up on the server");
    });
  });

  describe("over a live connection", () => {
    class FakeSocket extends EventTarget {
      readyState = 1;
      close = vi.fn();
    }
    const push = (socket: FakeSocket, event: AdvanceStreamEvent) =>
      socket.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(event) }));

    beforeEach(() => {
      vi.useFakeTimers();
      vi.stubGlobal("WebSocket", Object.assign(FakeSocket, { OPEN: 1 }));
    });

    afterEach(() => {
      // not unstubAllGlobals: that would also remove the localStorage stub from the setup file
      vi.stubGlobal("WebSocket", undefined);
    });

    it("builds the turn from the events pushed to the socket", async () => {
      const socket = new FakeSocket();
      vi.spyOn(api, "openProjectStream").mockResolvedValue(socket as unknown as WebSocket);
      useProjectsStore.setState({ projects: { w1: deployed("w1", { pending_question: { status: "chat" } }) } });
      vi.spyOn(api, "answerQuestion").mockResolvedValue(deployed("w1"));
      vi.spyOn(api, "getProject").mockResolvedValue(deployed("w1", { pending_question: { status: "chat", message: "next" } }));

      const running = state().advanceProject("w1", "distill", "answer");
      await vi.advanceTimersByTimeAsync(0);
      push(socket, { chunk: "Hi" });
      push(socket, { tool_call: { id: "t", name: "search_code", status: "done" } });
      push(socket, { done: true });
      await vi.advanceTimersByTimeAsync(3_000);
      await running;

      const agent = conversation("w1").at(-1)!;
      expect(agent).toMatchObject({ role: "agent", text: "Hi" });
      expect(agent.toolCalls).toHaveLength(1);
      expect(state().runningProjectId).toBeNull();
      closeProjectSocket("w1");
    });

    it("fails the turn when the server reports an error over the socket", async () => {
      const socket = new FakeSocket();
      vi.spyOn(api, "openProjectStream").mockResolvedValue(socket as unknown as WebSocket);
      useProjectsStore.setState({ projects: { w2: deployed("w2", { pending_question: { status: "chat" } }) } });
      vi.spyOn(api, "answerQuestion").mockResolvedValue(deployed("w2"));
      vi.spyOn(api, "getProject").mockResolvedValue(deployed("w2", { pending_question: { status: "chat" } }));

      const running = state().advanceProject("w2", "distill", "answer");
      await vi.advanceTimersByTimeAsync(0);
      push(socket, { error: "model failed", code: "agent_failed" });
      await vi.advanceTimersByTimeAsync(0);
      await running;

      expect(state().error?.title).toBe("The agent could not finish");
      expect(state().failedRun?.projectId).toBe("w2");
      closeProjectSocket("w2");
    });
  });
});

describe("builds", () => {
  const build = (over: Partial<Build> = {}): Build => ({
    group_id: "g",
    number: 1,
    url: "https://github.com/o/r/pull/1",
    title: "Add",
    unit_ids: [],
    issue_numbers: [],
    state: "open",
    checks: "pending",
    draft: false,
    ...over,
  });
  const builds = (list: Build[], watching = true): Builds => ({ repository: "o/r", builds: list, watching });

  it("keeps what was last shown when a poll fails", async () => {
    const known = builds([build()]);
    useProjectsStore.setState({ buildsByProject: { b1: known } });
    vi.spyOn(api, "listBuilds").mockRejectedValue(new Error("blip"));
    await state().loadBuilds("b1");
    expect(state().buildsByProject["b1"]).toBe(known);
    expect(state().error).toBeNull();
  });

  it("stores a preview, and stays quiet when there is none", async () => {
    const preview = { running: true, url: "http://localhost:3000" } as never;
    vi.spyOn(api, "startPreview").mockResolvedValueOnce(preview).mockRejectedValueOnce(new Error("no checkout"));
    await state().startPreview("b1");
    expect(state().previewByProject["b1"]).toBe(preview);
    await state().startPreview("b2");
    expect(state().previewByProject["b2"]).toBeUndefined();
    expect(state().error).toBeNull();
  });

  describe("watching", () => {
    let announce: Mock<(projectId: string) => Promise<void>>;

    beforeEach(() => {
      vi.useFakeTimers();
      announce = vi.fn<(projectId: string) => Promise<void>>();
      useProjectsStore.setState({ announceBuildsSettled: announce });
    });

    it("polls every 15 seconds until every build has a verdict, then announces once", async () => {
      const list = vi.spyOn(api, "listBuilds");
      list.mockResolvedValueOnce(builds([build()])).mockResolvedValue(builds([build({ checks: "passing" })]));
      state().watchBuilds("b3");
      await vi.advanceTimersByTimeAsync(0);
      expect(list).toHaveBeenCalledTimes(1);
      expect(announce).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(15_000);
      expect(list).toHaveBeenCalledTimes(2);
      expect(announce).toHaveBeenCalledWith("b3");
      await vi.advanceTimersByTimeAsync(60_000);
      expect(list).toHaveBeenCalledTimes(2);
    });

    it("announces straight away when nothing is being watched", async () => {
      vi.spyOn(api, "listBuilds").mockResolvedValue(builds([build()], false));
      state().watchBuilds("b4");
      await vi.advanceTimersByTimeAsync(0);
      expect(announce).toHaveBeenCalledWith("b4");
    });

    it("stops polling when the returned function is called", async () => {
      const list = vi.spyOn(api, "listBuilds").mockResolvedValue(builds([build()]));
      const stop = state().watchBuilds("b5");
      await vi.advanceTimersByTimeAsync(0);
      stop();
      await vi.advanceTimersByTimeAsync(60_000);
      expect(list).toHaveBeenCalledTimes(1);
    });
  });

  describe("announcing", () => {
    const setup = (id: string, over: Partial<Project> = {}, list: Build[] = [build({ state: "merged", checks: "passing" })]) => {
      const advance = vi.fn();
      useProjectsStore.setState({
        advanceProject: advance,
        projects: { [id]: project(id, { station: "review", ...over }) },
        buildsByProject: { [id]: builds(list) },
      });
      return advance;
    };

    it("tells the current agent how the builds settled, once", async () => {
      const advance = setup("n1");
      await state().announceBuildsSettled("n1");
      await state().announceBuildsSettled("n1");
      expect(advance).toHaveBeenCalledTimes(1);
      expect(advance.mock.calls[0]).toEqual(["n1", "review", expect.stringContaining("#1 merged/passing")]);
    });

    it.each([
      ["a gate, which cannot take a message", "n2", { station: "review_approval" as const }, undefined],
      ["deployed mode, where the state machine drives it", "n3", { orchestration_mode: "deployed" as const }, undefined],
      ["no builds", "n4", {}, []],
    ])("stays silent for %s", async (_why, id, over, list) => {
      const advance = setup(id, over, list);
      await state().announceBuildsSettled(id);
      expect(advance).not.toHaveBeenCalled();
    });

    it("stays silent while another run is in progress", async () => {
      const advance = setup("n5");
      useProjectsStore.setState({ runningProjectId: "other" });
      await state().announceBuildsSettled("n5");
      expect(advance).not.toHaveBeenCalled();
    });
  });
});
