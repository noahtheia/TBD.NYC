import type { Filters, Venue } from "@/types/venue";

/** Pure filter + search. AND across dimensions, OR within a dimension. */
export function filterVenues(venues: Venue[], filters: Filters, query: string): Venue[] {
  const q = query.trim().toLowerCase();

  return venues.filter((v) => {
    if (filters.happyHourOnly && v.happyHour !== true) return false;

    if (
      filters.neighborhoods.length &&
      !(v.neighborhood && filters.neighborhoods.includes(v.neighborhood))
    ) {
      return false;
    }

    if (filters.types.length && !v.types.some((t) => filters.types.includes(t))) {
      return false;
    }

    if (filters.reservation.length && !filters.reservation.includes(v.reservationPolicy)) {
      return false;
    }

    if (q) {
      const haystack = `${v.name} ${v.types.join(" ")} ${v.neighborhood ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}

export function countActiveFilters(f: Filters): number {
  return (
    (f.happyHourOnly ? 1 : 0) +
    f.neighborhoods.length +
    f.types.length +
    f.reservation.length
  );
}
