import data from "@/data/venues.json";
import type { Venue } from "@/types/venue";

const venues = data as unknown as Venue[];

export function getVenues(): Venue[] {
  return venues;
}

export function getVenueById(id: string): Venue | undefined {
  return venues.find((v) => v.id === id);
}

export function getAllVenueIds(): string[] {
  return venues.map((v) => v.id);
}
