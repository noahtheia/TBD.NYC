import type { Facets, Venue } from "@/types/venue";

/** Derive the full set of filter options from the dataset (not the filtered subset),
 *  so options never disappear while filtering. */
export function computeFacets(venues: Venue[]): Facets {
  const neighborhoods = [
    ...new Set(venues.map((v) => v.neighborhood).filter((n): n is string => Boolean(n))),
  ].sort((a, b) => a.localeCompare(b));

  const types = [...new Set(venues.flatMap((v) => v.types))].sort((a, b) =>
    a.localeCompare(b)
  );

  return { neighborhoods, types };
}
