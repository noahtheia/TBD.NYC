export type ReservationPolicy = "reservations" | "walk-in" | "mixed" | "unknown";

export type BookingHost = "resy" | "opentable" | "tock" | "other";

export interface VenueBooking {
  url: string;
  host: BookingHost;
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
