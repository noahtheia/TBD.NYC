import type { Venue } from "@/types/venue";

export type LatLng = { lat: number; lng: number };

/** Great-circle distance in miles. */
export function haversineMiles(a: LatLng, b: LatLng): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Distance from a point to the nearest of a venue's locations (miles), or null. */
export function nearestDistanceMiles(user: LatLng | null, venue: Venue): number | null {
  if (!user) return null;
  let best = Infinity;
  for (const loc of venue.locations) {
    const d = haversineMiles(user, loc.coordinates);
    if (d < best) best = d;
  }
  return Number.isFinite(best) ? best : null;
}

export function formatMiles(miles: number): string {
  if (miles < 0.1) return "< 0.1 mi";
  return `${miles.toFixed(1)} mi`;
}

/** Walkable distance as a time hint (~20 min/mi); falls back to miles when far. */
export function formatProximity(miles: number): string {
  const min = Math.round(miles * 20);
  if (min <= 25) return `~${Math.max(min, 1)} min walk`;
  return formatMiles(miles);
}
