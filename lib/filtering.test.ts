import { describe, expect, it } from "vitest";
import { filterVenues } from "@/lib/filtering";
import { EMPTY_FILTERS, type Venue } from "@/types/venue";

const NOW = { day: 3, minutes: 1080 }; // Wed 6pm

function venue(over: Partial<Venue>): Venue {
  return {
    id: "x",
    name: "X",
    category: "bar",
    types: ["Bar"],
    locations: [{ address: "1 Test St", neighborhood: "Chelsea", coordinates: { lat: 40.74, lng: -74 } }],
    happyHour: null,
    reservationPolicy: "unknown",
    ...over,
  };
}

const bar = venue({
  id: "bar1",
  name: "Late Bar",
  neighborhood: "Chelsea",
  happyHour: true,
  reservationPolicy: "walk-in",
  priceLevel: 2,
  locations: [
    {
      address: "1 A",
      neighborhood: "Chelsea",
      coordinates: { lat: 40.74, lng: -74 },
      hours: { periods: [{ openDay: 3, openMin: 1020, closeDay: 4, closeMin: 120 }] },
    },
  ],
});
const restaurant = venue({
  id: "r1",
  name: "Pasta Place",
  category: "restaurant",
  types: [],
  cuisines: ["Italian"],
  awards: ["Michelin Star"],
  neighborhood: "Nolita",
  priceLevel: 4,
  reservationPolicy: "reservations",
  locations: [{ address: "2 B", neighborhood: "Nolita", coordinates: { lat: 40.72, lng: -73.99 } }],
});
const venues = [bar, restaurant];

describe("filterVenues", () => {
  it("no filters returns all", () => {
    expect(filterVenues(venues, EMPTY_FILTERS, "", NOW)).toHaveLength(2);
  });
  it("category", () => {
    const r = filterVenues(venues, { ...EMPTY_FILTERS, categories: ["restaurant"] }, "", NOW);
    expect(r.map((v) => v.id)).toEqual(["r1"]);
  });
  it("cuisine", () => {
    const r = filterVenues(venues, { ...EMPTY_FILTERS, cuisines: ["Italian"] }, "", NOW);
    expect(r.map((v) => v.id)).toEqual(["r1"]);
  });
  it("awards", () => {
    const r = filterVenues(venues, { ...EMPTY_FILTERS, awards: ["Michelin Star"] }, "", NOW);
    expect(r.map((v) => v.id)).toEqual(["r1"]);
  });
  it("happy hour", () => {
    const r = filterVenues(venues, { ...EMPTY_FILTERS, happyHourOnly: true }, "", NOW);
    expect(r.map((v) => v.id)).toEqual(["bar1"]);
  });
  it("happy hour now matches an ongoing window, not just the boolean flag", () => {
    // Window Wed 5–7pm — covers NOW (Wed 6pm).
    const ongoing = venue({
      id: "hhnow",
      happyHour: true,
      happyHourWindows: {
        periods: [{ openDay: 3, openMin: 1020, closeDay: 3, closeMin: 1140 }],
      },
    });
    // Window Wed 7–9pm — does not cover NOW.
    const later = venue({
      id: "hhlater",
      happyHour: true,
      happyHourWindows: {
        periods: [{ openDay: 3, openMin: 1140, closeDay: 3, closeMin: 1260 }],
      },
    });
    // `bar` has happyHour:true but no windows — excluded from "now".
    const r = filterVenues(
      [bar, ongoing, later],
      { ...EMPTY_FILTERS, happyHourNow: true },
      "",
      NOW
    );
    expect(r.map((v) => v.id)).toEqual(["hhnow"]);
  });
  it("price", () => {
    const r = filterVenues(venues, { ...EMPTY_FILTERS, prices: [4] }, "", NOW);
    expect(r.map((v) => v.id)).toEqual(["r1"]);
  });
  it("neighborhood", () => {
    const r = filterVenues(venues, { ...EMPTY_FILTERS, neighborhoods: ["Nolita"] }, "", NOW);
    expect(r.map((v) => v.id)).toEqual(["r1"]);
  });
  it("open now (bar open Wed 6pm)", () => {
    const r = filterVenues(venues, { ...EMPTY_FILTERS, openNow: true }, "", NOW);
    expect(r.map((v) => v.id)).toEqual(["bar1"]);
  });
  it("open late", () => {
    const r = filterVenues(venues, { ...EMPTY_FILTERS, openLate: true }, "", NOW);
    expect(r.map((v) => v.id)).toEqual(["bar1"]);
  });
  it("open now excludes temporarily-closed venues", () => {
    const tempClosed = { ...bar, id: "bar2", businessStatus: "CLOSED_TEMPORARILY" as const };
    const r = filterVenues([bar, tempClosed], { ...EMPTY_FILTERS, openNow: true }, "", NOW);
    expect(r.map((v) => v.id)).toEqual(["bar1"]);
  });
  it("search matches name and cuisine", () => {
    expect(filterVenues(venues, EMPTY_FILTERS, "pasta", NOW).map((v) => v.id)).toEqual(["r1"]);
    expect(filterVenues(venues, EMPTY_FILTERS, "italian", NOW).map((v) => v.id)).toEqual(["r1"]);
  });
});
