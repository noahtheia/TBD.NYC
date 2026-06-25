import { describe, expect, it } from "vitest";
import { buildQuery, parseFilters } from "@/lib/url-state";
import { EMPTY_FILTERS, type Filters } from "@/types/venue";

describe("url-state", () => {
  it("builds an empty query for empty filters + no search/venue", () => {
    expect(buildQuery(EMPTY_FILTERS, "", null)).toBe("");
  });

  it("round-trips a full filter set", () => {
    const f: Filters = {
      happyHourOnly: true,
      openNow: true,
      openLate: false,
      categories: ["bar"],
      neighborhoods: ["West Village", "Chelsea"],
      types: ["Dive Bar"],
      cuisines: ["Italian"],
      awards: ["Michelin Star"],
      prices: [2, 3],
      reservation: ["walk-in"],
    };
    const qs = buildQuery(f, "negroni", "bathtub-gin");
    const sp = new URLSearchParams(qs);
    expect(parseFilters(sp)).toEqual(f);
    expect(sp.get("q")).toBe("negroni");
    expect(sp.get("venue")).toBe("bathtub-gin");
  });

  it("drops invalid prices, categories, and reservation values", () => {
    const sp = new URLSearchParams("price=9,2&cat=foo,bar&resv=bogus,walk-in");
    const f = parseFilters(sp);
    expect(f.prices).toEqual([2]);
    expect(f.categories).toEqual(["bar"]);
    expect(f.reservation).toEqual(["walk-in"]);
  });
});
