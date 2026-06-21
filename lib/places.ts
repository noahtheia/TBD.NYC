import "server-only";
import type { OpeningHours, PriceLevel, VenueLocation } from "@/types/venue";

const KEY = process.env.GOOGLE_PLACES_API_KEY;

const NYC_RECT = {
  low: { latitude: 40.477398, longitude: -74.259087 },
  high: { latitude: 40.91618, longitude: -73.70018 },
};

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.regularOpeningHours",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.addressComponents",
  "places.types",
  "places.primaryType",
  "places.primaryTypeDisplayName",
  "places.businessStatus",
].join(",");

type GoogleComponent = { longText?: string; shortText?: string; types?: string[] };
type GooglePlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  regularOpeningHours?: {
    periods?: { open?: { day: number; hour?: number; minute?: number }; close?: { day: number; hour?: number; minute?: number } }[];
    weekdayDescriptions?: string[];
  };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  addressComponents?: GoogleComponent[];
  types?: string[];
  primaryType?: string;
  primaryTypeDisplayName?: { text?: string };
  businessStatus?: string;
};

export async function searchPlace(query: string): Promise<GooglePlace | null> {
  if (!KEY) throw new Error("GOOGLE_PLACES_API_KEY not configured");
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      locationRestriction: { rectangle: NYC_RECT },
      maxResultCount: 1,
    }),
  });
  if (!res.ok) throw new Error(`Places HTTP ${res.status}`);
  const json = (await res.json()) as { places?: GooglePlace[] };
  return json.places?.[0] ?? null;
}

export function convertOpeningHours(
  g: GooglePlace["regularOpeningHours"]
): OpeningHours | undefined {
  if (!g) return undefined;
  const periods = g.periods ?? [];
  if (periods.length === 1 && periods[0].open && !periods[0].close) {
    return { periods: [], weekdayText: g.weekdayDescriptions, open24: true };
  }
  const out = periods
    .filter((p) => p.open && p.close)
    .map((p) => ({
      openDay: p.open!.day,
      openMin: (p.open!.hour ?? 0) * 60 + (p.open!.minute ?? 0),
      closeDay: p.close!.day,
      closeMin: (p.close!.hour ?? 0) * 60 + (p.close!.minute ?? 0),
    }));
  if (!out.length && !g.weekdayDescriptions?.length) return undefined;
  return { periods: out, weekdayText: g.weekdayDescriptions };
}

const PRICE_MAP: Record<string, PriceLevel> = {
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};
export function mapPriceLevel(g?: string): PriceLevel | undefined {
  return g ? PRICE_MAP[g] : undefined;
}

const CUISINE_MAP: Record<string, string> = {
  american_restaurant: "American", italian_restaurant: "Italian",
  french_restaurant: "French", chinese_restaurant: "Chinese",
  japanese_restaurant: "Japanese", sushi_restaurant: "Sushi",
  ramen_restaurant: "Ramen", korean_restaurant: "Korean",
  mexican_restaurant: "Mexican", thai_restaurant: "Thai",
  indian_restaurant: "Indian", vietnamese_restaurant: "Vietnamese",
  mediterranean_restaurant: "Mediterranean", greek_restaurant: "Greek",
  spanish_restaurant: "Spanish", middle_eastern_restaurant: "Middle Eastern",
  seafood_restaurant: "Seafood", steak_house: "Steakhouse",
  pizza_restaurant: "Pizza", hamburger_restaurant: "Burgers",
  barbecue_restaurant: "Barbecue", vegetarian_restaurant: "Vegetarian",
  breakfast_restaurant: "Breakfast", brunch_restaurant: "Brunch", diner: "Diner",
  fine_dining_restaurant: "Fine Dining", cafe: "Cafe", bakery: "Bakery",
};
const GENERIC = new Set(["", "Restaurant", "Food", "Store", "Bar"]);

export function googleCuisine(place: GooglePlace): string[] {
  if (place.primaryType && CUISINE_MAP[place.primaryType]) return [CUISINE_MAP[place.primaryType]];
  for (const t of place.types ?? []) if (CUISINE_MAP[t]) return [CUISINE_MAP[t]];
  const label = (place.primaryTypeDisplayName?.text ?? "").replace(/\s+Restaurant$/i, "").trim();
  return GENERIC.has(label) ? [] : [label];
}

function component(components: GoogleComponent[] | undefined, type: string) {
  return components?.find((c) => c.types?.includes(type));
}
export function googleNeighborhood(c?: GoogleComponent[]): string | undefined {
  return component(c, "neighborhood")?.longText || component(c, "sublocality_level_2")?.longText || undefined;
}
export function googleBorough(c?: GoogleComponent[]): string | undefined {
  return component(c, "sublocality_level_1")?.longText || component(c, "locality")?.longText || undefined;
}

function normName(s: string): string {
  return (s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/['’.]/g, "").replace(/\b(the|bar|restaurant|nyc|new york|ny|cafe)\b/g, "")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
export function matchConfidence(name: string, displayName?: string): number {
  const a = normName(name);
  const b = normName(displayName ?? "");
  if (!a || !b) return 0;
  if (b.includes(a) || a.includes(b)) return 1;
  const at = new Set(a.split(" ").filter(Boolean));
  const bt = new Set(b.split(" ").filter(Boolean));
  const shared = [...at].filter((x) => bt.has(x)).length;
  return shared / Math.min(at.size, bt.size);
}

export async function fetchOgImage(website?: string): Promise<string | undefined> {
  if (!website) return undefined;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(website, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36", Accept: "text/html" },
    });
    clearTimeout(t);
    if (!res.ok) return undefined;
    const html = (await res.text()).slice(0, 200_000);
    const m =
      html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (m?.[1]) {
      const abs = new URL(m[1].trim(), res.url || website).href;
      return abs.startsWith("http") ? abs : undefined;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

export type EnrichResult = {
  found: boolean;
  error?: string;
  closed?: boolean;
  confidence: number;
  name?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: PriceLevel;
  cuisines?: string[];
  suggestedType?: string;
  website?: string;
  googleMapsUri?: string;
  photoUrl?: string;
  location?: VenueLocation;
};

/** Look up one venue and return fields to prefill the admin form. */
export async function enrichFromGoogle(name: string, address?: string): Promise<EnrichResult> {
  const query = address ? `${name}, ${address}` : `${name}, New York, NY`;
  const place = await searchPlace(query);
  if (!place || !place.location) return { found: false, confidence: 0 };

  const confidence = matchConfidence(name, place.displayName?.text);
  const website = place.websiteUri;
  const cuisineLabel = (place.primaryTypeDisplayName?.text ?? "").trim();
  const location: VenueLocation = {
    address: place.formattedAddress ?? address ?? "",
    neighborhood: googleNeighborhood(place.addressComponents),
    borough: googleBorough(place.addressComponents),
    coordinates: { lat: place.location.latitude, lng: place.location.longitude },
    placeId: place.id,
    hours: convertOpeningHours(place.regularOpeningHours),
  };

  return {
    found: true,
    closed: place.businessStatus === "CLOSED_PERMANENTLY",
    confidence,
    name: place.displayName?.text,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    priceLevel: mapPriceLevel(place.priceLevel),
    cuisines: googleCuisine(place),
    suggestedType: GENERIC.has(cuisineLabel) ? undefined : cuisineLabel,
    website,
    googleMapsUri: place.googleMapsUri,
    photoUrl: await fetchOgImage(website),
    location,
  };
}

export { parseHappyHourWindows } from "./happy-hour";
