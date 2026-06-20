import type { Venue } from "@/types/venue";
import { nearestDistanceMiles, type LatLng } from "@/lib/geo";

export type SortKey = "relevance" | "rating" | "price" | "distance";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "rating", label: "Top rated" },
  { value: "price", label: "Price: low to high" },
  { value: "distance", label: "Nearest" },
];

/** Sort a (already name-ordered) venue list. "relevance" keeps the input order. */
export function sortVenues(venues: Venue[], sort: SortKey, user: LatLng | null): Venue[] {
  if (sort === "relevance") return venues;
  const arr = [...venues];
  if (sort === "rating") {
    arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  } else if (sort === "price") {
    arr.sort((a, b) => (a.priceLevel ?? 99) - (b.priceLevel ?? 99));
  } else if (sort === "distance" && user) {
    arr.sort(
      (a, b) =>
        (nearestDistanceMiles(user, a) ?? Infinity) -
        (nearestDistanceMiles(user, b) ?? Infinity)
    );
  }
  return arr;
}
