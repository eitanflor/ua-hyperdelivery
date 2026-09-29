import { describe, expect, it } from "vitest";
import { AGENT_META, AGENT_STATIONS, isGate, PIPELINE, stationIndex, STATION_META } from "./pipeline";

describe("pipeline", () => {
  it("has metadata for every station in the line", () => {
    expect(Object.keys(STATION_META).sort()).toEqual([...PIPELINE].sort());
  });

  it("alternates agents and the gates that sign them off, ending at done", () => {
    expect(PIPELINE.map((s) => STATION_META[s].kind)).toEqual([
      "agent", "gate", "agent", "gate", "agent", "gate", "agent", "done",
    ]);
  });

  it("points each gate at the agent before it and the one it unlocks", () => {
    for (const [i, station] of PIPELINE.entries()) {
      if (!isGate(station)) continue;
      expect(STATION_META[station].reviewing).toBe(PIPELINE[i - 1]);
      expect(STATION_META[station].unlocks).toBe(PIPELINE[i + 1]);
    }
  });

  it("lists exactly the agent stations, each with display metadata", () => {
    expect(AGENT_STATIONS).toEqual(PIPELINE.filter((s) => STATION_META[s].kind === "agent"));
    for (const station of AGENT_STATIONS) expect(AGENT_META[station]).toBeDefined();
  });

  it("gives every station a distinct label", () => {
    const labels = Object.values(STATION_META).map((m) => m.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("orders stations by index", () => {
    expect(stationIndex("distill")).toBe(0);
    expect(stationIndex("done")).toBe(PIPELINE.length - 1);
    expect(isGate("blueprint_approval")).toBe(true);
    expect(isGate("blueprint")).toBe(false);
  });
});
