import type { BookingHost, ReservationPolicy } from "@/types/venue";

export const RESERVATION_LABEL: Record<ReservationPolicy, string> = {
  reservations: "Reservations",
  "walk-in": "Walk-in only",
  mixed: "Reservations & walk-in",
  unknown: "Reservations: ask",
};

export const RESERVATION_SHORT: Record<ReservationPolicy, string> = {
  reservations: "Reservations",
  "walk-in": "Walk-in",
  mixed: "Res / walk-in",
  unknown: "",
};

export const RESERVATION_OPTIONS: { value: ReservationPolicy; label: string }[] = [
  { value: "reservations", label: "Takes reservations" },
  { value: "walk-in", label: "Walk-in only" },
  { value: "mixed", label: "Reservations & walk-in" },
];

export const BOOKING_LABEL: Record<BookingHost, string> = {
  resy: "Book on Resy",
  opentable: "Book on OpenTable",
  tock: "Book on Tock",
  other: "Book / reserve",
};

export function mapsUrl(name: string, address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${name} ${address}`
  )}`;
}
