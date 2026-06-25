import { describe, expect, it } from "vitest";
import { computeFacets } from "@/lib/facets";
import type { Venue } from "@/types/venue";

function v(over: Partial<Venue>): Venue {
  return {
    id: "x",
    name: "X",
    category: "bar",
    types: ["Bar"],
    locations: [{ address: "1", coordinates: { lat: 0, lng: 0 } }],
    happyHour: null,
    reservationPolicy: "unknown",
    ...over,
  };
}

const bar = v({
  id: "b1",
  category: "bar",
  types: ["Cocktail Bar"],
  priceLevel: 2,
  happyHour: true,
  locations: [{ address: "a", neighborhood: "Chelsea", coordinates: { lat: 0, lng: 0 } }],
});
const rest = v({
  id: "r1",
  category: "restaurant",
  types: [],
  cuisines: ["Italian"],
  priceLevel: 2,
  reservationPolicy: "reservations",
  locations: [{ address: "b", neighborhood: "Nolita", coordinates: { lat: 0, lng: 0 } }],
});

describe("computeFacets", () => {
  const f = computeFacets([rest, bar]);

  it("collects sorted, unique neighborhoods and cuisines", () => {
    expect(f.neighborhoods).toEqual(["Chelsea", "Nolita"]);
    expect(f.cuisines).toEqual(["Italian"]);
    expect(f.types).toEqual(["Cocktail Bar"]);
  });
  it("counts categories, happy hour, and price", () => {
    expect(f.counts.category).toEqual({ bar: 1, restaurant: 1 });
    expect(f.counts.happyHour).toBe(1);
    expect(f.counts.price[2]).toBe(2);
  });
  it("counts neighborhoods and reservation policy", () => {
    expect(f.counts.neighborhoods.Chelsea).toBe(1);
    expect(f.counts.reservation.reservations).toBe(1);
  });
});
