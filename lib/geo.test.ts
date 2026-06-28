import { describe, expect, it } from "vitest";
import {
  haversineMiles,
  nearestDistanceMiles,
  boundsForRadiusMiles,
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

describe("boundsForRadiusMiles", () => {
  const center = { lat: 40.74, lng: -73.99 }; // ~midtown NYC
  it("spans ~1 mile from the center to each edge", () => {
    const [w, s, e, n] = boundsForRadiusMiles(center, 1);
    expect(haversineMiles(center, { lat: n, lng: center.lng })).toBeCloseTo(1, 1);
    expect(haversineMiles(center, { lat: s, lng: center.lng })).toBeCloseTo(1, 1);
    expect(haversineMiles(center, { lat: center.lat, lng: e })).toBeCloseTo(1, 1);
    expect(haversineMiles(center, { lat: center.lat, lng: w })).toBeCloseTo(1, 1);
  });
  it("is centered on the point", () => {
    const [w, s, e, n] = boundsForRadiusMiles(center, 1);
    expect((w + e) / 2).toBeCloseTo(center.lng, 6);
    expect((s + n) / 2).toBeCloseTo(center.lat, 6);
  });
  it("scales with the radius", () => {
    const [, , , n1] = boundsForRadiusMiles(center, 1);
    const [, , , n2] = boundsForRadiusMiles(center, 2);
    expect(n2 - center.lat).toBeCloseTo(2 * (n1 - center.lat), 6);
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
