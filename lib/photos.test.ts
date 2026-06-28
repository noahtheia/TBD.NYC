import { describe, expect, it } from "vitest";
import { orderedVenuePhotos } from "./photos";
import type { Venue } from "@/types/venue";

function venue(partial: Partial<Venue>): Venue {
  return {
    id: "v",
    name: "Test",
    category: "bar",
    types: [],
    locations: [],
    happyHour: null,
    reservationPolicy: "unknown",
    ...partial,
  };
}

describe("orderedVenuePhotos", () => {
  it("returns nothing when there are no photos", () => {
    expect(orderedVenuePhotos(venue({}))).toEqual([]);
  });

  it("puts the logo (photoUrl) first", () => {
    const out = orderedVenuePhotos(
      venue({ photoUrl: "logo.jpg", photos: [{ url: "in.jpg", tag: "inside" }] })
    );
    expect(out.map((p) => p.url)).toEqual(["logo.jpg", "in.jpg"]);
  });

  it("orders logo → inside → food → drinks → rest", () => {
    const out = orderedVenuePhotos(
      venue({
        photoUrl: "logo.jpg",
        photos: [
          { url: "out.jpg", tag: "outside" },
          { url: "drink.jpg", tag: "drinks" },
          { url: "food.jpg", tag: "food" },
          { url: "inside.jpg", tag: "inside" },
        ],
      })
    );
    expect(out.map((p) => p.url)).toEqual([
      "logo.jpg",
      "inside.jpg",
      "food.jpg",
      "drink.jpg",
      "out.jpg",
    ]);
  });

  it("prefers the explicitly featured photo over the first of its tag", () => {
    const out = orderedVenuePhotos(
      venue({
        photos: [
          { url: "inside-a.jpg", tag: "inside" },
          { url: "inside-b.jpg", tag: "inside", featured: true },
        ],
      })
    );
    expect(out.map((p) => p.url)).toEqual(["inside-b.jpg", "inside-a.jpg"]);
  });

  it("de-duplicates so a featured photo is not repeated in the tail", () => {
    const out = orderedVenuePhotos(
      venue({
        photoUrl: "logo.jpg",
        photos: [
          { url: "logo.jpg" },
          { url: "food.jpg", tag: "food" },
        ],
      })
    );
    expect(out.map((p) => p.url)).toEqual(["logo.jpg", "food.jpg"]);
  });

  it("drops empty URLs", () => {
    const out = orderedVenuePhotos(
      venue({ photoUrl: "", photos: [{ url: "  ", tag: "inside" }, { url: "real.jpg" }] })
    );
    expect(out.map((p) => p.url)).toEqual(["real.jpg"]);
  });
});
