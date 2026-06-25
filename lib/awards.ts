// Canonical list of venue awards / recognitions. Editorial, set in the admin
// (and pre-seeded from data/awards.json). Shared so the admin form, the type
// layer, the public awards filter, and computeFacets all speak the same
// vocabulary — mirrors lib/amenities.ts.

export const AWARDS = [
  "Michelin Star",
  "Bib Gourmand",
  "Michelin Guide",
  "World's 50 Best Bars",
  "North America's 50 Best Bars",
  "James Beard Award",
  "Eater 38",
] as const;

export type Award = (typeof AWARDS)[number];

const AWARD_SET = new Set<string>(AWARDS);

/** Keep only recognized awards, de-duplicated and in canonical order. */
export function normalizeAwards(values: string[]): string[] {
  const present = new Set(values.map((v) => v.trim()).filter(Boolean));
  return AWARDS.filter((a) => present.has(a));
}

export function isAward(value: string): value is Award {
  return AWARD_SET.has(value);
}
