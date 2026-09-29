import { describe, expect, it } from "vitest";
import { displayName, initials, personName } from "./people";
import { withAttachments } from "./attachments";

describe("displayName", () => {
  it("flips Last, First and leaves other names alone", () => {
    expect(displayName("Flor, Eitan")).toBe("Eitan Flor");
    expect(displayName("  Eitan Flor ")).toBe("Eitan Flor");
  });
});

describe("initials", () => {
  it("takes up to two initials in spoken order", () => {
    expect(initials("Flor, Eitan")).toBe("EF");
    expect(initials("Ada Lovelace King")).toBe("AL");
    expect(initials("cher")).toBe("C");
    expect(initials("")).toBe("");
  });
});

describe("personName", () => {
  it("reads an email as a person, and leaves a plain name to displayName", () => {
    expect(personName("jane.doe@underarmour.com")).toBe("Jane Doe");
    expect(personName("j_smith-jones@x.com")).toBe("J Smith Jones");
    expect(personName("Flor, Eitan")).toBe("Eitan Flor");
  });

  it("returns the raw value when nothing precedes the @", () => {
    expect(personName("@x.com")).toBe("@x.com");
  });
});

describe("withAttachments", () => {
  it("lists each attachment before the message", () => {
    expect(withAttachments("  build it ", [{ key: "k1", filename: "a.docx" }])).toBe(
      'Attached: "a.docx" (S3 key: k1)\n\nbuild it',
    );
  });

  it("is just the trimmed message with no attachments, and skips a blank message", () => {
    expect(withAttachments(" hi ", [])).toBe("hi");
    expect(withAttachments("  ", [{ key: "k", filename: "f" }])).toBe('Attached: "f" (S3 key: k)');
  });
});
