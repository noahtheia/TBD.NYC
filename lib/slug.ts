/** URL-safe slug from a display label, e.g. "Lower East Side" -> "lower-east-side".
 *  Matches the convention used for venue ids (slugified names). */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "") // strip accents
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Find the original facet value whose slug matches `slug` (e.g. resolve a route
 *  param back to a neighborhood/cuisine name). */
export function unslug(slug: string, values: string[]): string | null {
  return values.find((v) => slugify(v) === slug) ?? null;
}
