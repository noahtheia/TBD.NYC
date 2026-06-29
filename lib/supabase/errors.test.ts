import { describe, expect, it } from "vitest";
import { isMissingTableError } from "./errors";

describe("isMissingTableError", () => {
  it("detects the PostgREST schema-cache error", () => {
    expect(
      isMissingTableError("Could not find the table 'public.posts' in the schema cache")
    ).toBe(true);
    expect(
      isMissingTableError(
        "Could not find the table 'public.editor_picks' in the schema cache"
      )
    ).toBe(true);
  });

  it("detects the raw Postgres undefined-table error", () => {
    expect(isMissingTableError('relation "public.posts" does not exist')).toBe(true);
  });

  it("is false for unrelated errors and empty input", () => {
    expect(isMissingTableError("permission denied for table posts")).toBe(false);
    expect(isMissingTableError("network timeout")).toBe(false);
    expect(isMissingTableError("")).toBe(false);
    expect(isMissingTableError(null)).toBe(false);
    expect(isMissingTableError(undefined)).toBe(false);
  });
});
