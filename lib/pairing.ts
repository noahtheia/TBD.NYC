import type { Category, Venue } from "@/types/venue";
import { haversineMiles } from "@/lib/geo";

export const PAIRING_RADIUS_MILES = 0.5;
export const PAIRING_LIMIT = 3;

// Bayesian shrinkage prior: the catalog's mean rating with 25 pseudo-reviews,
// so a 5.0★ with 3 reviews doesn't outrank a 4.7★ with 5,000.
const PRIOR_RATING = 4.4;
const PRIOR_COUNT = 25;

// Weights: within a ≤10-minute-walk radius everything is close, so quality
// dominates — the full radius costs 0.30 score (~0.64 shrunk-rating points).
const QUALITY_WEIGHT = 0.7;
const PROXIMITY_WEIGHT = 0.3;

export interface PairingSuggestion {
  venue: Venue;
  /** Miles between the closest pair of locations (chosen ↔ candidate). */
  distanceMiles: number;
  score: number;
}

export type PairingSets = Record<Category, PairingSuggestion[]>;

export interface PairingOptions {
  /** Which category to suggest. Defaults to the opposite of the chosen venue's. */
  category?: Category;
  radiusMiles?: number;
  limit?: number;
}

/** Going to a bar → suggest a restaurant (and vice versa). */
export function defaultPairingCategory(category: Category): Category {
  return category === "bar" ? "restaurant" : "bar";
}

/** Smallest distance between any pair of the two venues' locations, in miles.
 *  Infinity when either venue has no locations. For multi-location venues this
 *  means a suggestion may sit near the *other* location — acceptable for the
 *  handful of venues with more than one pin. */
export function venueDistanceMiles(a: Venue, b: Venue): number {
  let best = Infinity;
  for (const la of a.locations) {
    for (const lb of b.locations) {
      const d = haversineMiles(la.coordinates, lb.coordinates);
      if (d < best) best = d;
    }
  }
  return best;
}

/** Review-count-weighted rating shrunk toward the catalog mean. Unrated venues
 *  land exactly on the prior. Exported for tests. */
export function pairingQuality(venue: Venue): number {
  const n = venue.userRatingCount ?? 0;
  const rating = venue.rating ?? PRIOR_RATING;
  return (rating * n + PRIOR_RATING * PRIOR_COUNT) / (n + PRIOR_COUNT);
}

function pairingScore(quality: number, distanceMiles: number, radiusMiles: number): number {
  const qualityScore = Math.min(1, Math.max(0, (quality - 3.5) / 1.5));
  const proximityScore = 1 - distanceMiles / radiusMiles;
  return QUALITY_WEIGHT * qualityScore + PROXIMITY_WEIGHT * proximityScore;
}

/** Rank complementary venues near the one the user is going to: operational,
 *  in the target category, within the radius. Deterministic and
 *  time-independent so statically generated pages stay stable. */
export function suggestPairings(
  chosen: Venue,
  catalog: Venue[],
  opts?: PairingOptions
): PairingSuggestion[] {
  const category = opts?.category ?? defaultPairingCategory(chosen.category);
  const radiusMiles = opts?.radiusMiles ?? PAIRING_RADIUS_MILES;
  const limit = opts?.limit ?? PAIRING_LIMIT;

  const suggestions: PairingSuggestion[] = [];
  for (const v of catalog) {
    if (v.id === chosen.id) continue;
    if (v.category !== category) continue;
    if (v.businessStatus && v.businessStatus !== "OPERATIONAL") continue;
    const distanceMiles = venueDistanceMiles(chosen, v);
    if (distanceMiles > radiusMiles) continue;
    suggestions.push({
      venue: v,
      distanceMiles,
      score: pairingScore(pairingQuality(v), distanceMiles, radiusMiles),
    });
  }

  suggestions.sort(
    (a, b) =>
      b.score - a.score ||
      a.distanceMiles - b.distanceMiles ||
      a.venue.id.localeCompare(b.venue.id)
  );
  return suggestions.slice(0, limit);
}

/** Both pairing lists at once, so a bar/restaurant toggle can flip instantly
 *  without access to the catalog. */
export function suggestPairingSets(
  chosen: Venue,
  catalog: Venue[],
  opts?: Omit<PairingOptions, "category">
): PairingSets {
  return {
    bar: suggestPairings(chosen, catalog, { ...opts, category: "bar" }),
    restaurant: suggestPairings(chosen, catalog, { ...opts, category: "restaurant" }),
  };
}
