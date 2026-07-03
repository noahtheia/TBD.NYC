import { describe, expect, it } from "vitest";
import {
  defaultPairingCategory,
  pairingQuality,
  suggestPairings,
  suggestPairingSets,
} from "@/lib/pairing";
import { nearestDistanceMiles } from "@/lib/geo";
import type { Venue } from "@/types/venue";

// In NYC, 0.004° of latitude ≈ 0.28 mi (in radius) and 0.008° ≈ 0.55 mi (out).
const BASE = { lat: 40.74, lng: -74 };
const NEAR = { lat: BASE.lat + 0.004, lng: BASE.lng };
const FAR = { lat: BASE.lat + 0.008, lng: BASE.lng };

function venue(over: Partial<Venue>): Venue {
  return {
    id: "x",
    name: "X",
    category: "restaurant",
    types: [],
    locations: [{ address: "1 Test St", coordinates: BASE }],
    happyHour: null,
    reservationPolicy: "unknown",
    ...over,
  };
}

const chosenBar = venue({ id: "bar1", name: "Chosen Bar", category: "bar", types: ["Bar"] });

describe("defaultPairingCategory", () => {
  it("flips both ways", () => {
    expect(defaultPairingCategory("bar")).toBe("restaurant");
    expect(defaultPairingCategory("restaurant")).toBe("bar");
  });
});

describe("suggestPairings", () => {
  it("suggests only the opposite category by default", () => {
    const nearbyBar = venue({ id: "bar2", category: "bar", types: ["Bar"] });
    const nearbyRestaurant = venue({ id: "r1" });
    const r = suggestPairings(chosenBar, [chosenBar, nearbyBar, nearbyRestaurant]);
    expect(r.map((s) => s.venue.id)).toEqual(["r1"]);
  });

  it("respects a category override", () => {
    const nearbyBar = venue({ id: "bar2", category: "bar", types: ["Bar"] });
    const nearbyRestaurant = venue({ id: "r1" });
    const r = suggestPairings(chosenBar, [nearbyBar, nearbyRestaurant], { category: "bar" });
    expect(r.map((s) => s.venue.id)).toEqual(["bar2"]);
  });

  it("only includes venues within the radius", () => {
    const near = venue({ id: "near", locations: [{ address: "n", coordinates: NEAR }] });
    const far = venue({ id: "far", locations: [{ address: "f", coordinates: FAR }] });
    const r = suggestPairings(chosenBar, [near, far]);
    expect(r.map((s) => s.venue.id)).toEqual(["near"]);
    expect(r[0].distanceMiles).toBeGreaterThan(0.2);
    expect(r[0].distanceMiles).toBeLessThan(0.3);
  });

  it("includes a venue exactly at the radius boundary", () => {
    const near = venue({ id: "near", locations: [{ address: "n", coordinates: NEAR }] });
    const exact = nearestDistanceMiles(BASE, near) ?? 0;
    const r = suggestPairings(chosenBar, [near], { radiusMiles: exact });
    expect(r.map((s) => s.venue.id)).toEqual(["near"]);
  });

  it("never suggests the chosen venue itself, even at distance 0", () => {
    const self = venue({ id: "bar1", category: "restaurant" });
    expect(suggestPairings(chosenBar, [self])).toEqual([]);
  });

  it("excludes closed venues but keeps operational and status-less ones", () => {
    const temp = venue({ id: "temp", businessStatus: "CLOSED_TEMPORARILY" });
    const perm = venue({ id: "perm", businessStatus: "CLOSED_PERMANENTLY" });
    const op = venue({ id: "op", businessStatus: "OPERATIONAL" });
    const none = venue({ id: "none" });
    const r = suggestPairings(chosenBar, [temp, perm, op, none]);
    expect(r.map((s) => s.venue.id).sort()).toEqual(["none", "op"]);
  });

  it("anchors on the chosen venue's primary location, not its other branches", () => {
    // The user is going to the primary pin (~11 mi north); a candidate next to
    // the second branch must NOT be suggested as "within a 10-minute walk".
    const multiChosen = venue({
      id: "multi-bar",
      category: "bar",
      locations: [
        { address: "primary", coordinates: { lat: 40.9, lng: -74 } },
        { address: "branch", coordinates: BASE },
      ],
    });
    expect(suggestPairings(multiChosen, [venue({ id: "r1" })])).toEqual([]);
  });

  it("reaches a candidate's nearest branch", () => {
    const multiCandidate = venue({
      id: "multi-r",
      locations: [
        { address: "far", coordinates: { lat: 40.9, lng: -74 } },
        { address: "near", coordinates: NEAR },
      ],
    });
    const r = suggestPairings(chosenBar, [multiCandidate]);
    expect(r.map((s) => s.venue.id)).toEqual(["multi-r"]);
    expect(r[0].distanceMiles).toBeLessThan(0.3);
  });

  it("handles venues with no locations without crashing", () => {
    const noLocChosen = venue({ id: "no-loc", category: "bar", locations: [] });
    expect(suggestPairings(noLocChosen, [venue({ id: "r1" })])).toEqual([]);
    expect(suggestPairings(chosenBar, [venue({ id: "empty", locations: [] })])).toEqual([]);
  });

  it("ranks a well-reviewed rating above a barely-reviewed perfect one", () => {
    const proven = venue({ id: "proven", rating: 4.8, userRatingCount: 1000 });
    const unproven = venue({ id: "unproven", rating: 5.0, userRatingCount: 3 });
    const r = suggestPairings(chosenBar, [unproven, proven]);
    expect(r.map((s) => s.venue.id)).toEqual(["proven", "unproven"]);
  });

  it("ranks the nearer venue first at equal quality", () => {
    const near = venue({
      id: "near",
      rating: 4.5,
      userRatingCount: 500,
      locations: [{ address: "n", coordinates: NEAR }],
    });
    const nearer = venue({ id: "nearer", rating: 4.5, userRatingCount: 500 });
    const r = suggestPairings(chosenBar, [near, nearer]);
    expect(r.map((s) => s.venue.id)).toEqual(["nearer", "near"]);
    expect(r[0].distanceMiles).toBe(0);
  });

  it("keeps unrated venues eligible but below well-reviewed ones", () => {
    const unrated = venue({ id: "unrated" });
    const reviewed = venue({ id: "reviewed", rating: 4.7, userRatingCount: 500 });
    expect(pairingQuality(unrated)).toBe(4.4);
    const r = suggestPairings(chosenBar, [unrated, reviewed]);
    expect(r.map((s) => s.venue.id)).toEqual(["reviewed", "unrated"]);
  });

  it("returns the top candidates up to the limit", () => {
    const catalog = [4.9, 4.8, 4.7, 4.6, 4.5].map((rating, i) =>
      venue({ id: `r${i}`, rating, userRatingCount: 1000 })
    );
    const r = suggestPairings(chosenBar, catalog);
    expect(r.map((s) => s.venue.id)).toEqual(["r0", "r1", "r2"]);
    expect(suggestPairings(chosenBar, catalog, { limit: 1 }).map((s) => s.venue.id)).toEqual(["r0"]);
  });

  it("breaks full ties by id for determinism", () => {
    const b = venue({ id: "b", rating: 4.5, userRatingCount: 100 });
    const a = venue({ id: "a", rating: 4.5, userRatingCount: 100 });
    const r = suggestPairings(chosenBar, [b, a]);
    expect(r.map((s) => s.venue.id)).toEqual(["a", "b"]);
  });

  it("returns [] when nothing is in range", () => {
    expect(suggestPairings(chosenBar, [])).toEqual([]);
    const far = venue({ id: "far", locations: [{ address: "f", coordinates: FAR }] });
    expect(suggestPairings(chosenBar, [far])).toEqual([]);
  });
});

describe("suggestPairingSets", () => {
  it("returns both categories, each filtered to its own", () => {
    const nearbyBar = venue({ id: "bar2", category: "bar", types: ["Bar"] });
    const nearbyRestaurant = venue({ id: "r1" });
    const sets = suggestPairingSets(chosenBar, [chosenBar, nearbyBar, nearbyRestaurant]);
    expect(sets.bar.map((s) => s.venue.id)).toEqual(["bar2"]);
    expect(sets.restaurant.map((s) => s.venue.id)).toEqual(["r1"]);
  });
});
