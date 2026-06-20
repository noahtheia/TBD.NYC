import type { Facets, ReservationPolicy, Venue } from "@/types/venue";

/** Derive the full set of filter options + counts from the dataset (not the
 *  filtered subset), so options never disappear while filtering. */
export function computeFacets(venues: Venue[]): Facets {
  const neighborhoods = [
    ...new Set(venues.map((v) => v.neighborhood).filter((n): n is string => Boolean(n))),
  ].sort((a, b) => a.localeCompare(b));

  const types = [...new Set(venues.flatMap((v) => v.types))].sort((a, b) =>
    a.localeCompare(b)
  );

  const nCount: Record<string, number> = {};
  const tCount: Record<string, number> = {};
  const rCount: Record<ReservationPolicy, number> = {
    reservations: 0,
    "walk-in": 0,
    mixed: 0,
    unknown: 0,
  };
  let happyHour = 0;

  for (const v of venues) {
    if (v.neighborhood) nCount[v.neighborhood] = (nCount[v.neighborhood] ?? 0) + 1;
    for (const t of v.types) tCount[t] = (tCount[t] ?? 0) + 1;
    rCount[v.reservationPolicy] = (rCount[v.reservationPolicy] ?? 0) + 1;
    if (v.happyHour === true) happyHour++;
  }

  return {
    neighborhoods,
    types,
    counts: { neighborhoods: nCount, types: tCount, reservation: rCount, happyHour },
  };
}
