import { describe, expect, it } from "vitest";
import { csvEscape, toCsv } from "@/lib/csv";

describe("csvEscape", () => {
  it("passes simple values through", () => {
    expect(csvEscape("hello")).toBe("hello");
    expect(csvEscape(42)).toBe("42");
    expect(csvEscape(true)).toBe("true");
  });

  it("renders null/undefined as empty", () => {
    expect(csvEscape(null)).toBe("");
    expect(csvEscape(undefined)).toBe("");
  });

  it("quotes and escapes fields with commas, quotes, or newlines", () => {
    expect(csvEscape("a,b")).toBe('"a,b"');
    expect(csvEscape('she said "hi"')).toBe('"she said ""hi"""');
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
  });

  it("joins arrays with a semicolon", () => {
    expect(csvEscape(["Bar", "Cocktail Bar"])).toBe("Bar; Cocktail Bar");
    expect(csvEscape(["a,b", "c"])).toBe('"a,b; c"');
  });
});

describe("toCsv", () => {
  it("builds a header + rows in column order", () => {
    const csv = toCsv(
      [
        { id: "x", name: "X Bar", types: ["Bar"] },
        { id: "y", name: "Y, Z", types: [] },
      ],
      ["id", "name", "types"]
    );
    expect(csv).toBe('id,name,types\r\nx,X Bar,Bar\r\ny,"Y, Z",');
  });

  it("emits empty strings for missing keys", () => {
    expect(toCsv([{ id: "x" }], ["id", "name"])).toBe("id,name\r\nx,");
  });
});
