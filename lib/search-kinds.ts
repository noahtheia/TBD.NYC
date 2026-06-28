/**
 * Canonical set of home-search suggestion groups ("kinds"). Single source of
 * truth shared by the hero search (`components/home/HeroSearch.tsx`), the admin
 * "Search priority" tab, and the config defaults — keep these `kind` strings in
 * sync with the `kind` values produced in HeroSearch.
 */

export type SearchKind =
  | "Filter"
  | "Category"
  | "Neighborhood"
  | "Cuisine"
  | "Award"
  | "Type"
  | "Bar"
  | "Restaurant";

/** Ordered (default priority) list of kinds with admin-facing labels. */
export const SEARCH_KINDS: { kind: SearchKind; label: string; description: string }[] = [
  { kind: "Filter", label: "Quick filters", description: "Open now, Happy hour, Open late" },
  { kind: "Category", label: "Categories", description: "The Bars / Restaurants chips" },
  { kind: "Neighborhood", label: "Neighborhoods", description: "e.g. Williamsburg, East Village" },
  { kind: "Cuisine", label: "Cuisines", description: "e.g. Italian, Japanese" },
  { kind: "Award", label: "Awards", description: "Editorial recognitions" },
  { kind: "Type", label: "Types", description: "Venue-type tags (e.g. Cocktail Bar)" },
  { kind: "Bar", label: "Individual bars", description: "Specific bars by name" },
  { kind: "Restaurant", label: "Individual restaurants", description: "Specific restaurants by name" },
];

/** Default order of the kinds, matching HeroSearch's historical insertion order. */
export const DEFAULT_SEARCH_ORDER: SearchKind[] = SEARCH_KINDS.map((k) => k.kind);

const KIND_SET = new Set<string>(DEFAULT_SEARCH_ORDER);

/** Type guard: is `value` one of the known search kinds? */
export function isSearchKind(value: string): value is SearchKind {
  return KIND_SET.has(value);
}
