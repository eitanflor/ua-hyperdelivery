import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "../api/client";
import type { Build, Project } from "../api/types";
import { endsARun, isSettled, UNDO_MS, useProjectsStore } from "./useProjectsStore";

const initial = useProjectsStore.getState();

const project = (id: string, over: Partial<Project> = {}): Project => ({
  id,
  name: `Project ${id}`,
  station: "blueprint_approval",
  pending_question: null,
  orchestration_mode: "local",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...over,
});

const state = () => useProjectsStore.getState();

beforeEach(() => {
  useProjectsStore.setState(initial, true);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("recent projects", () => {
  it("moves a reopened project to the front without duplicating it", async () => {
    vi.spyOn(api, "getProject").mockImplementation(async (id) => project(id));
    for (const id of ["a", "b", "a"]) await state().loadProject(id);
    expect(state().recentProjects.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("keeps at most 30", async () => {
    vi.spyOn(api, "getProject").mockImplementation(async (id) => project(id));
    for (let i = 0; i < 35; i++) await state().loadProject(`p${i}`);
    expect(state().recentProjects).toHaveLength(30);
    expect(state().recentProjects[0]!.id).toBe("p34");
  });

  it("drops recents the API no longer lists, and marks the list loaded", async () => {
    useProjectsStore.setState({ recentProjects: [{ id: "gone", name: "Gone" }, { id: "a", name: "A" }] });
    vi.spyOn(api, "listProjects").mockResolvedValue([project("a")]);
    await state().loadProjects();
    expect(state().recentProjects.map((p) => p.id)).toEqual(["a"]);
    expect(state().projects["a"]).toBeDefined();
    expect(state().projectsLoaded).toBe(true);
  });

  it("still marks the list loaded when listing fails, and surfaces the error", async () => {
    vi.spyOn(api, "listProjects").mockRejectedValue(new ApiError(500, "down"));
    await state().loadProjects();
    expect(state().projectsLoaded).toBe(true);
    expect(state().error?.action).toBe("retry");
    expect(state().loading).toBe(false);
  });

  it("renames the project and its recent entry", async () => {
    useProjectsStore.setState({ recentProjects: [{ id: "a", name: "Old" }] });
    vi.spyOn(api, "renameProject").mockResolvedValue(project("a", { name: "New" }));
    await state().renameProject("a", "New");
    expect(state().projects["a"]!.name).toBe("New");
    expect(state().recentProjects).toEqual([{ id: "a", name: "New" }]);
  });

  it("removes a deleted project from every map", async () => {
    useProjectsStore.setState({
      projects: { a: project("a"), b: project("b") },
      recentProjects: [{ id: "a", name: "A" }, { id: "b", name: "B" }],
      artifactsByProject: { a: [] },
      conversationByProject: { a: [] },
      signaturesByProject: { a: [] },
      pendingByStation: { blueprint_approval: [project("a"), project("b")] },
    });
    vi.spyOn(api, "deleteProject").mockResolvedValue(undefined);
    await state().deleteProject("a");
    expect(Object.keys(state().projects)).toEqual(["b"]);
    expect(state().recentProjects.map((p) => p.id)).toEqual(["b"]);
    expect(state().artifactsByProject).toEqual({});
    expect(state().pendingByStation.blueprint_approval?.map((p) => p.id)).toEqual(["b"]);
  });
});

describe("decide", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(api, "listArtifacts").mockResolvedValue([]);
    vi.spyOn(api, "listDecisions").mockResolvedValue([]);
    vi.spyOn(api, "listTurns").mockResolvedValue([]);
    vi.spyOn(api, "listPending").mockResolvedValue([]);
  });

  it("holds the decision locally for the undo window", () => {
    const submit = vi.spyOn(api, "submitDecision");
    state().decide("a", "blueprint_approval", { approved: true }, "me@ua.com");
    vi.advanceTimersByTime(UNDO_MS - 1);
    expect(submit).not.toHaveBeenCalled();
    expect(state().pendingDecision?.projectId).toBe("a");
  });

  it("sends nothing after an undo", () => {
    const submit = vi.spyOn(api, "submitDecision");
    state().decide("a", "blueprint_approval", { approved: true }, "me@ua.com");
    state().undoDecision();
    vi.advanceTimersByTime(UNDO_MS * 2);
    expect(submit).not.toHaveBeenCalled();
    expect(state().pendingDecision).toBeNull();
  });

  it("a second decision replaces the first rather than sending both", async () => {
    const submit = vi.spyOn(api, "submitDecision").mockResolvedValue(project("a", { station: "done" }));
    state().decide("a", "blueprint_approval", { approved: false, comment: "no" }, "me@ua.com");
    state().decide("a", "blueprint_approval", { approved: true }, "me@ua.com");
    await vi.advanceTimersByTimeAsync(UNDO_MS);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith("a", { approved: true });
  });

  it("records the signature and clears the pending decision once it lands", async () => {
    vi.spyOn(api, "submitDecision").mockResolvedValue(project("a", { station: "done" }));
    state().decide("a", "blueprint_approval", { approved: true, comment: "ok" }, "me@ua.com");
    await vi.advanceTimersByTimeAsync(UNDO_MS);
    expect(state().pendingDecision).toBeNull();
    expect(state().projects["a"]!.station).toBe("done");
    expect(state().signaturesByProject["a"]).toMatchObject([
      { station: "blueprint_approval", signer: "me@ua.com", approved: true, comment: "ok" },
    ]);
  });

  it("puts the gate back and shows the error when the decision is rejected", async () => {
    vi.spyOn(api, "submitDecision").mockRejectedValue(new ApiError(409, "moved", "not_awaiting_approval"));
    state().decide("a", "blueprint_approval", { approved: true }, "me@ua.com");
    await vi.advanceTimersByTimeAsync(UNDO_MS);
    expect(state().pendingDecision).toBeNull();
    expect(state().error?.title).toBe("This project moved on without you");
    expect(state().signaturesByProject["a"]).toBeUndefined();
  });
});

describe("isSettled", () => {
  const build = (over: Partial<Build>) => ({ number: 1, state: "open", draft: false, checks: "pending", ...over }) as Build;

  it("settles on merged or closed", () => {
    expect(isSettled(build({ state: "merged" }), new Map())).toBe(true);
    expect(isSettled(build({ state: "closed" }), new Map())).toBe(true);
  });

  it("never settles a draft that is still open", () => {
    expect(isSettled(build({ draft: true, checks: "passing" }), new Map())).toBe(false);
  });

  it("settles on a check verdict, not while checks are pending", () => {
    expect(isSettled(build({ checks: "passing" }), new Map())).toBe(true);
    expect(isSettled(build({ checks: "failing" }), new Map())).toBe(true);
    expect(isSettled(build({ checks: "pending" }), new Map())).toBe(false);
  });

  it("waits out the grace period before accepting that no checks are coming", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const none = build({ checks: "none" });
    expect(isSettled(none, new Map())).toBe(false);
    expect(isSettled(none, new Map([[1, 1_000_000 - 119_000]]))).toBe(false);
    expect(isSettled(none, new Map([[1, 1_000_000 - 120_000]]))).toBe(true);
  });
});

describe("endsARun", () => {
  it("is true for a done or error event", () => {
    expect(endsARun('{"done":true}')).toBe(true);
    expect(endsARun('{"error":"boom"}')).toBe(true);
  });

  it("is false for other events and for non-JSON", () => {
    expect(endsARun('{"token":"hi"}')).toBe(false);
    expect(endsARun('{"done":false}')).toBe(false);
    expect(endsARun("not json")).toBe(false);
    expect(endsARun("null")).toBe(false);
  });
});
