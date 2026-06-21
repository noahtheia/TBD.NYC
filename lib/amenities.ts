// Canonical list of venue amenities. Editorial, set in the admin.
// Shared so the admin form, the seed/type layer, and (later) the public
// amenity filter + computeFacets all speak the same vocabulary.

export const AMENITIES = [
  "Outdoor seating",
  "Rooftop",
  "Dog-friendly",
  "Wheelchair accessible",
  "Live music",
  "DJ",
  "Sports / TVs",
  "Pool table",
  "Dancing",
  "Private events",
  "Group-friendly",
  "Date spot",
  "WiFi",
  "Cash only",
] as const;

export type Amenity = (typeof AMENITIES)[number];

const AMENITY_SET = new Set<string>(AMENITIES);

/** Keep only recognized amenities, de-duplicated and in canonical order. */
export function normalizeAmenities(values: string[]): string[] {
  const present = new Set(values.map((v) => v.trim()).filter(Boolean));
  return AMENITIES.filter((a) => present.has(a));
}

export function isAmenity(value: string): value is Amenity {
  return AMENITY_SET.has(value);
}
