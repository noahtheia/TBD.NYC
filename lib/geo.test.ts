import { describe, expect, it } from "vitest";
import {
  haversineMiles,
  nearestDistanceMiles,
  formatMiles,
  formatProximity,
} from "@/lib/geo";
import type { Venue } from "@/types/venue";

describe("haversineMiles", () => {
  it("is zero for the same point", () => {
    expect(haversineMiles({ lat: 40.7, lng: -74 }, { lat: 40.7, lng: -74 })).toBe(0);
  });
  it("≈ 69 miles per degree of latitude", () => {
    const d = haversineMiles({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeGreaterThan(68);
    expect(d).toBeLessThan(70);
  });
});

describe("nearestDistanceMiles", () => {
  const venue = {
    locations: [
      { coordinates: { lat: 40.9, lng: -74 } },
      { coordinates: { lat: 40.71, lng: -74 } },
    ],
  } as Venue;
  it("returns null without a user location", () => {
    expect(nearestDistanceMiles(null, venue)).toBeNull();
  });
  it("picks the nearest location", () => {
    const d = nearestDistanceMiles({ lat: 40.7, lng: -74 }, venue);
    expect(d).not.toBeNull();
    expect(d!).toBeLessThan(1); // ~0.7mi to the closer pin, not the far one
  });
});

describe("formatMiles / formatProximity", () => {
  it("formatMiles", () => {
    expect(formatMiles(0.05)).toBe("< 0.1 mi");
    expect(formatMiles(1.234)).toBe("1.2 mi");
  });
  it("formatProximity uses walk time when close, miles when far", () => {
    expect(formatProximity(0.5)).toBe("~10 min walk");
    expect(formatProximity(0.02)).toBe("~1 min walk");
    expect(formatProximity(2)).toBe("2.0 mi");
  });
});
