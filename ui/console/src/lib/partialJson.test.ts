import { describe, expect, it } from "vitest";
import { parsePartialJson } from "./partialJson";

describe("parsePartialJson", () => {
  it("parses complete JSON unchanged", () => {
    expect(parsePartialJson('{"a":1,"b":["x"]}')).toEqual({ a: 1, b: ["x"] });
  });

  it("closes an open string and brackets", () => {
    expect(parsePartialJson('{"title":"Hel')).toEqual({ title: "Hel" });
    expect(parsePartialJson('{"items":["a","b')).toEqual({ items: ["a", "b"] });
  });

  it("cuts back past a half-written key", () => {
    expect(parsePartialJson('{"a":1,"b')).toEqual({ a: 1 });
  });

  it("cuts back past a half-written literal", () => {
    expect(parsePartialJson('{"a":1,"ok":tr')).toEqual({ a: 1 });
  });

  it("ignores a dangling backslash inside a string", () => {
    expect(parsePartialJson('{"a":"line\\')).toEqual({ a: "line" });
  });

  it("does not treat brackets inside strings as structure", () => {
    expect(parsePartialJson('{"a":"}]","b":2')).toEqual({ a: "}]", b: 2 });
  });

  it("returns null when nothing parses yet", () => {
    expect(parsePartialJson("")).toBeNull();
    expect(parsePartialJson("[1,2")).toBeNull();
  });
});
