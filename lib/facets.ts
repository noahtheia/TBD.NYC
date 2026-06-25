import type { Category, Facets, ReservationPolicy, Venue } from "@/types/venue";

/** Derive the full set of filter options + counts from the dataset (not the
 *  filtered subset), so options never disappear while filtering. */
export function computeFacets(venues: Venue[]): Facets {
  const neighborhoods = [
    ...new Set(
      venues.flatMap((v) => v.locations.map((l) => l.neighborhood)).filter((n): n is string => Boolean(n))
    ),
  ].sort((a, b) => a.localeCompare(b));

  const types = [...new Set(venues.flatMap((v) => v.types))].sort((a, b) =>
    a.localeCompare(b)
  );

  const cuisines = [...new Set(venues.flatMap((v) => v.cuisines ?? []))].sort((a, b) =>
    a.localeCompare(b)
  );

  const awards = [...new Set(venues.flatMap((v) => v.awards ?? []))].sort((a, b) =>
    a.localeCompare(b)
  );

  const nCount: Record<string, number> = {};
  const tCount: Record<string, number> = {};
  const cuCount: Record<string, number> = {};
  const awCount: Record<string, number> = {};
  const rCount: Record<ReservationPolicy, number> = {
    reservations: 0,
    "walk-in": 0,
    mixed: 0,
    unknown: 0,
  };
  const cCount: Record<Category, number> = { bar: 0, restaurant: 0 };
  const pCount: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let happyHour = 0;

  for (const v of venues) {
    const hoods = new Set(v.locations.map((l) => l.neighborhood).filter(Boolean) as string[]);
    for (const h of hoods) nCount[h] = (nCount[h] ?? 0) + 1;
    for (const t of v.types) tCount[t] = (tCount[t] ?? 0) + 1;
    for (const cu of v.cuisines ?? []) cuCount[cu] = (cuCount[cu] ?? 0) + 1;
    for (const aw of v.awards ?? []) awCount[aw] = (awCount[aw] ?? 0) + 1;
    rCount[v.reservationPolicy] = (rCount[v.reservationPolicy] ?? 0) + 1;
    cCount[v.category] = (cCount[v.category] ?? 0) + 1;
    if (v.priceLevel) pCount[v.priceLevel] = (pCount[v.priceLevel] ?? 0) + 1;
    if (v.happyHour === true) happyHour++;
  }

  return {
    neighborhoods,
    types,
    cuisines,
    awards,
    counts: {
      neighborhoods: nCount,
      types: tCount,
      cuisines: cuCount,
      awards: awCount,
      reservation: rCount,
      category: cCount,
      price: pCount,
      happyHour,
    },
  };
}
