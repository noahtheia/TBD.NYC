import type { Category, Filters, PriceLevel, ReservationPolicy } from "@/types/venue";

const RESERVATION_VALUES: ReservationPolicy[] = ["reservations", "walk-in", "mixed", "unknown"];
const CATEGORY_VALUES: Category[] = ["bar", "restaurant"];

function readList(sp: URLSearchParams, key: string): string[] {
  const raw = sp.get(key);
  return raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

export function parseFilters(sp: URLSearchParams): Filters {
  const reservation = readList(sp, "resv").filter((r): r is ReservationPolicy =>
    (RESERVATION_VALUES as string[]).includes(r)
  );
  const categories = readList(sp, "cat").filter((c): c is Category =>
    (CATEGORY_VALUES as string[]).includes(c)
  );
  const prices = readList(sp, "price")
    .map(Number)
    .filter((n): n is PriceLevel => n >= 1 && n <= 4);

  return {
    happyHourOnly: sp.get("hh") === "1",
    happyHourNow: sp.get("hhnow") === "1",
    openNow: sp.get("open") === "1",
    openLate: sp.get("late") === "1",
    categories,
    neighborhoods: readList(sp, "hood"),
    types: readList(sp, "type"),
    cuisines: readList(sp, "cuisine"),
    awards: readList(sp, "award"),
    prices,
    reservation,
  };
}

/** Build a query string ("?..." or "") from the current explore state. */
export function buildQuery(filters: Filters, search: string, venueId: string | null): string {
  const p = new URLSearchParams();
  if (filters.happyHourOnly) p.set("hh", "1");
  if (filters.happyHourNow) p.set("hhnow", "1");
  if (filters.openNow) p.set("open", "1");
  if (filters.openLate) p.set("late", "1");
  if (filters.categories.length) p.set("cat", filters.categories.join(","));
  if (filters.neighborhoods.length) p.set("hood", filters.neighborhoods.join(","));
  if (filters.types.length) p.set("type", filters.types.join(","));
  if (filters.cuisines.length) p.set("cuisine", filters.cuisines.join(","));
  if (filters.awards.length) p.set("award", filters.awards.join(","));
  if (filters.prices.length) p.set("price", filters.prices.join(","));
  if (filters.reservation.length) p.set("resv", filters.reservation.join(","));
  if (search.trim()) p.set("q", search.trim());
  if (venueId) p.set("venue", venueId);
  const s = p.toString();
  return s ? `?${s}` : "";
}
