import type { Filters, ReservationPolicy } from "@/types/venue";

const RESERVATION_VALUES: ReservationPolicy[] = [
  "reservations",
  "walk-in",
  "mixed",
  "unknown",
];

function readList(sp: URLSearchParams, key: string): string[] {
  const raw = sp.get(key);
  return raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

export function parseFilters(sp: URLSearchParams): Filters {
  const reservation = readList(sp, "resv").filter((r): r is ReservationPolicy =>
    (RESERVATION_VALUES as string[]).includes(r)
  );

  return {
    happyHourOnly: sp.get("hh") === "1",
    neighborhoods: readList(sp, "hood"),
    types: readList(sp, "type"),
    reservation,
  };
}

/** Build a query string ("?..." or "") from the current explore state. */
export function buildQuery(
  filters: Filters,
  search: string,
  venueId: string | null
): string {
  const p = new URLSearchParams();
  if (filters.happyHourOnly) p.set("hh", "1");
  if (filters.neighborhoods.length) p.set("hood", filters.neighborhoods.join(","));
  if (filters.types.length) p.set("type", filters.types.join(","));
  if (filters.reservation.length) p.set("resv", filters.reservation.join(","));
  if (search.trim()) p.set("q", search.trim());
  if (venueId) p.set("venue", venueId);
  const s = p.toString();
  return s ? `?${s}` : "";
}
