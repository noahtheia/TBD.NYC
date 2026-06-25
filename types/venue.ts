export type ReservationPolicy = "reservations" | "walk-in" | "mixed" | "unknown";

export type BookingHost = "resy" | "opentable" | "tock" | "other";

export interface VenueBooking {
  url: string;
  host: BookingHost;
}

export type Category = "bar" | "restaurant";

/** A single opening interval. Days use Google convention: 0 = Sunday … 6 = Saturday.
 *  Minutes are from midnight; closeDay may differ from openDay for overnight hours. */
export interface OpeningPeriod {
  openDay: number;
  openMin: number;
  closeDay: number;
  closeMin: number;
}

export interface OpeningHours {
  periods: OpeningPeriod[];
  /** Human-readable Mon–Sun rows (Google weekdayDescriptions), preferred for display. */
  weekdayText?: string[];
  open24?: boolean;
}

/** A happy-hour deal: an item and its price. */
export interface HappyHourItem {
  item: string;
  price?: string;
}

/** A photo in a venue's gallery. */
export interface VenuePhoto {
  url: string;
  caption?: string;
}

export interface VenueLocation {
  address: string;
  neighborhood?: string;
  borough?: string;
  coordinates: { lat: number; lng: number };
  placeId?: string;
  hours?: OpeningHours;
  approxLocation?: boolean;
}

export type PriceLevel = 1 | 2 | 3 | 4;

export interface Venue {
  /** Stable slug derived from the name, e.g. "bathtub-gin". Used as the route param. */
  id: string;
  name: string;
  category: Category;
  /** Normalized venue-type tags, e.g. ["Bar", "Cocktail Bar"]. Bar-focused. */
  types: string[];
  /** Cuisine tags for restaurants, e.g. ["Italian"]. */
  cuisines?: string[];
  /** One or more physical locations (a pin each). */
  locations: VenueLocation[];
  /** Convenience = locations[0].neighborhood. */
  neighborhood?: string;
  /** Google rating (0–5) and review count. */
  rating?: number;
  userRatingCount?: number;
  /** Google price level mapped to 1–4 ($–$$$$). */
  priceLevel?: PriceLevel;
  /** true = has happy hour, false = no happy hour, null = unknown. */
  happyHour: boolean | null;
  /** Free-text happy-hour notes. */
  happyHourDetails?: string;
  /** Structured happy-hour time windows. */
  happyHourWindows?: OpeningHours;
  /** Structured happy-hour deals (item + price). */
  happyHourMenu?: HappyHourItem[];
  reservationPolicy: ReservationPolicy;
  /** Google business status; absent = operational. CLOSED_TEMPORARILY venues are
   *  flagged in the UI and excluded from "open now". */
  businessStatus?: "OPERATIONAL" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY";
  /** Original free-text Reservations value. */
  reservationRaw?: string;
  booking?: VenueBooking;
  menuUrl?: string;
  website?: string;
  instagram?: string;
  googleMapsUri?: string;
  photoUrl?: string;
  /** Additional gallery photos (beyond the primary photoUrl). */
  photos?: VenuePhoto[];
  /** Editorial amenity tags (see lib/amenities.ts). */
  amenities?: string[];
  otherInfo?: string;
  /** Google match was low-confidence (restaurants resolved by name only). */
  unverified?: boolean;
  /** Editorial / manual fields (managed in the admin, not by the sync pipeline). */
  editorialNote?: string;
  featured?: boolean;
}

export interface Facets {
  neighborhoods: string[];
  types: string[];
  cuisines: string[];
  counts: {
    neighborhoods: Record<string, number>;
    types: Record<string, number>;
    cuisines: Record<string, number>;
    reservation: Record<ReservationPolicy, number>;
    category: Record<Category, number>;
    price: Record<number, number>;
    happyHour: number;
  };
}

export interface Filters {
  happyHourOnly: boolean;
  openNow: boolean;
  openLate: boolean;
  categories: Category[];
  neighborhoods: string[];
  types: string[];
  cuisines: string[];
  prices: PriceLevel[];
  reservation: ReservationPolicy[];
}

export const EMPTY_FILTERS: Filters = {
  happyHourOnly: false,
  openNow: false,
  openLate: false,
  categories: [],
  neighborhoods: [],
  types: [],
  cuisines: [],
  prices: [],
  reservation: [],
};
