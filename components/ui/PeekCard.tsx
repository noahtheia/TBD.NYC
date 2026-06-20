"use client";

import type { Venue } from "@/types/venue";
import { priceLabel } from "@/lib/display";
import VenuePhoto from "@/components/ui/VenuePhoto";
import OpenStatus from "@/components/ui/OpenStatus";

type Props = {
  venue: Venue;
  onOpen: () => void;
  onClose: () => void;
};

export default function PeekCard({ venue, onOpen, onClose }: Props) {
  const primary = venue.locations[0];
  const tags =
    venue.category === "restaurant"
      ? venue.cuisines?.length
        ? venue.cuisines
        : ["Restaurant"]
      : venue.types;
  const subtitle = [tags.join(" · "), venue.neighborhood].filter(Boolean).join(" • ");

  return (
    <div className="pointer-events-auto mx-3 flex gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xl">
      <VenuePhoto
        name={venue.name}
        photoUrl={venue.photoUrl}
        className="h-16 w-16 shrink-0"
        rounded="rounded-lg"
      />
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <h3 className="truncate font-semibold text-zinc-900">{venue.name}</h3>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-zinc-500">
          {venue.rating != null && (
            <span className="font-medium text-zinc-700">★ {venue.rating.toFixed(1)}</span>
          )}
          {venue.priceLevel != null && <span>{priceLabel(venue.priceLevel)}</span>}
          {subtitle && <span className="truncate">{subtitle}</span>}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <OpenStatus hours={primary?.hours} />
          <span className="text-xs font-medium text-rose-600">View details →</span>
        </div>
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="self-start text-zinc-400 transition hover:text-zinc-700"
      >
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}
