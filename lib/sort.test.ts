import { describe, expect, it } from "vitest";
import { sortVenues } from "@/lib/sort";
import type { Venue } from "@/types/venue";

function v(over: Partial<Venue>): Venue {
  return {
    id: "x",
    name: "X",
    category: "bar",
    types: ["Bar"],
    locations: [{ address: "1", coordinates: { lat: 40.74, lng: -74 } }],
    happyHour: null,
    reservationPolicy: "unknown",
    ...over,
  };
}

const a = v({ id: "a", rating: 4.8, priceLevel: 3, locations: [{ address: "a", coordinates: { lat: 40.7, lng: -74 } }] });
const b = v({ id: "b", rating: 4.2, priceLevel: 1, locations: [{ address: "b", coordinates: { lat: 40.75, lng: -74 } }] });
const c = v({ id: "c", locations: [{ address: "c", coordinates: { lat: 40.8, lng: -74 } }] });
const list = [a, b, c];

describe("sortVenues", () => {
  it("relevance keeps input order", () => {
    expect(sortVenues(list, "relevance", null).map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
  it("rating: descending, missing last", () => {
    expect(sortVenues(list, "rating", null).map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
  it("price: ascending, missing last", () => {
    expect(sortVenues(list, "price", null).map((x) => x.id)).toEqual(["b", "a", "c"]);
  });
  it("distance: nearest first when user location is known", () => {
    expect(sortVenues(list, "distance", { lat: 40.7, lng: -74 })[0].id).toBe("a");
  });
  it("distance: no user location keeps order", () => {
    expect(sortVenues(list, "distance", null).map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
  it("does not mutate the input array", () => {
    const before = list.map((x) => x.id);
    sortVenues(list, "rating", null);
    expect(list.map((x) => x.id)).toEqual(before);
  });
});
