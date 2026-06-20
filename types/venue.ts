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

export interface VenueLocation {
  address: string;
  neighborhood?: string;
  borough?: string;
  coordinates: { lat: number; lng: number };
  placeId?: string;
  hours?: OpeningHours;
  approxLocation?: boolean;
}

export interface Venue {
  /** Stable slug derived from the name, e.g. "bathtub-gin". Used as the route param. */
  id: string;
  name: string;
  /** Normalized venue-type tags, e.g. ["Bar", "Cocktail Bar"]. */
  types: string[];
  /** Original free-text Type value, kept for reference. */
  rawType?: string;
  /** Neighborhood, derived from geocoding. */
  neighborhood?: string;
  /** Display address (first/primary location line). */
  address: string;
  coordinates: { lat: number; lng: number };
  /** True when the pin was geocoded from a neighborhood rather than an exact street address. */
  approxLocation?: boolean;
  /** true = has happy hour, false = no happy hour, null = unknown. */
  happyHour: boolean | null;
  happyHourDetails?: string;
  hours?: string;
  reservationPolicy: ReservationPolicy;
  /** Original free-text Reservations value. */
  reservationRaw?: string;
  booking?: VenueBooking;
  menuUrl?: string;
  website?: string;
  instagram?: string;
  otherInfo?: string;
  /** Reserved for future use; unused in v1 (no photos in the source data). */
  photoUrl?: string;
}

export interface Facets {
  neighborhoods: string[];
  types: string[];
  counts: {
    neighborhoods: Record<string, number>;
    types: Record<string, number>;
    reservation: Record<ReservationPolicy, number>;
    happyHour: number;
  };
}

export interface Filters {
  happyHourOnly: boolean;
  neighborhoods: string[];
  types: string[];
  reservation: ReservationPolicy[];
}

export const EMPTY_FILTERS: Filters = {
  happyHourOnly: false,
  neighborhoods: [],
  types: [],
  reservation: [],
};
