import type { Filters, Venue } from "@/types/venue";
import { isOpenAt, isOpenLate, type NowParts } from "@/lib/hours";

/** Pure filter + search. AND across dimensions, OR within a dimension. */
export function filterVenues(
  venues: Venue[],
  filters: Filters,
  query: string,
  now: NowParts
): Venue[] {
  const q = query.trim().toLowerCase();

  return venues.filter((v) => {
    if (filters.happyHourOnly && v.happyHour !== true) return false;

    if (filters.categories.length && !filters.categories.includes(v.category)) {
      return false;
    }

    if (filters.prices.length && !(v.priceLevel && filters.prices.includes(v.priceLevel))) {
      return false;
    }

    if (
      filters.neighborhoods.length &&
      !v.locations.some((l) => l.neighborhood && filters.neighborhoods.includes(l.neighborhood))
    ) {
      return false;
    }

    if (filters.types.length && !v.types.some((t) => filters.types.includes(t))) {
      return false;
    }

    if (
      filters.cuisines.length &&
      !(v.cuisines ?? []).some((c) => filters.cuisines.includes(c))
    ) {
      return false;
    }

    if (filters.reservation.length && !filters.reservation.includes(v.reservationPolicy)) {
      return false;
    }

    if (filters.openNow && !v.locations.some((l) => isOpenAt(l.hours, now))) {
      return false;
    }

    if (filters.openLate && !v.locations.some((l) => isOpenLate(l.hours))) {
      return false;
    }

    if (q) {
      const haystack = `${v.name} ${v.types.join(" ")} ${(v.cuisines ?? []).join(
        " "
      )} ${v.locations.map((l) => l.neighborhood ?? "").join(" ")}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}

export function countActiveFilters(f: Filters): number {
  return (
    (f.happyHourOnly ? 1 : 0) +
    (f.openNow ? 1 : 0) +
    (f.openLate ? 1 : 0) +
    f.categories.length +
    f.neighborhoods.length +
    f.types.length +
    f.cuisines.length +
    f.prices.length +
    f.reservation.length
  );
}
