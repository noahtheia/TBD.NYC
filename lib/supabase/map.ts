import type {
  HappyHourItem,
  OpeningHours,
  PriceLevel,
  ReservationPolicy,
  Venue,
  VenueBooking,
  VenueLocation,
} from "@/types/venue";

export interface DbLocation {
  position: number | null;
  address: string;
  neighborhood: string | null;
  borough: string | null;
  lat: number;
  lng: number;
  place_id: string | null;
  hours: OpeningHours | null;
  approx_location: boolean | null;
}

export interface DbVenue {
  id: string;
  name: string;
  category: "bar" | "restaurant";
  types: string[] | null;
  cuisines: string[] | null;
  neighborhood: string | null;
  rating: number | null;
  user_rating_count: number | null;
  price_level: PriceLevel | null;
  happy_hour: boolean | null;
  happy_hour_details: string | null;
  happy_hour_windows: OpeningHours | null;
  happy_hour_menu: HappyHourItem[] | null;
  reservation_policy: ReservationPolicy | null;
  reservation_raw: string | null;
  booking: VenueBooking | null;
  menu_url: string | null;
  website: string | null;
  instagram: string | null;
  google_maps_uri: string | null;
  photo_url: string | null;
  other_info: string | null;
  unverified: boolean | null;
  editorial_note: string | null;
  featured: boolean | null;
  locations?: DbLocation[] | null;
}

const undef = <T>(v: T | null | undefined): T | undefined => v ?? undefined;

export function rowToVenue(row: DbVenue): Venue {
  const locations: VenueLocation[] = (row.locations ?? [])
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((l) => ({
      address: l.address,
      neighborhood: undef(l.neighborhood),
      borough: undef(l.borough),
      coordinates: { lat: l.lat, lng: l.lng },
      placeId: undef(l.place_id),
      hours: undef(l.hours),
      approxLocation: undef(l.approx_location),
    }));

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    types: row.types ?? [],
    cuisines: row.cuisines ?? [],
    locations,
    neighborhood: undef(row.neighborhood),
    rating: undef(row.rating),
    userRatingCount: undef(row.user_rating_count),
    priceLevel: undef(row.price_level),
    happyHour: row.happy_hour ?? null,
    happyHourDetails: undef(row.happy_hour_details),
    happyHourWindows: undef(row.happy_hour_windows),
    happyHourMenu: undef(row.happy_hour_menu),
    reservationPolicy: row.reservation_policy ?? "unknown",
    reservationRaw: undef(row.reservation_raw),
    booking: undef(row.booking),
    menuUrl: undef(row.menu_url),
    website: undef(row.website),
    instagram: undef(row.instagram),
    googleMapsUri: undef(row.google_maps_uri),
    photoUrl: undef(row.photo_url),
    otherInfo: undef(row.other_info),
    unverified: undef(row.unverified),
    editorialNote: undef(row.editorial_note),
    featured: undef(row.featured),
  };
}
