"use client";

import type { Venue } from "@/types/venue";
import { priceLabel } from "@/lib/display";
import { happyHourStatus, type NowParts } from "@/lib/hours";
import VenuePhoto from "@/components/ui/VenuePhoto";
import OpenStatus from "@/components/ui/OpenStatus";
import ShareButton from "@/components/ui/ShareButton";

type Props = {
  venue: Venue;
  onOpen: () => void;
  onClose: () => void;
  now?: NowParts;
};

export default function PeekCard({ venue, onOpen, onClose, now }: Props) {
  const primary = venue.locations[0];
  const tags =
    venue.category === "restaurant"
      ? venue.cuisines?.length
        ? venue.cuisines
        : ["Restaurant"]
      : venue.types;
  const subtitle = [tags.join(" · "), venue.neighborhood].filter(Boolean).join(" • ");
  const hhActive =
    venue.happyHour === true && happyHourStatus(venue.happyHourWindows, now)?.active === true;

  return (
    <div className="pointer-events-auto mx-3 flex gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xl">
      <VenuePhoto
        name={venue.name}
        photoUrl={venue.photoUrl}
        className="h-16 w-16 shrink-0"
        rounded="rounded-lg"
      />
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <h3 className="truncate font-display text-base font-extrabold tracking-tight text-ink">
          {venue.name}
        </h3>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-zinc-500">
          {venue.rating != null && (
            <span className="font-medium text-zinc-700">★ {venue.rating.toFixed(1)}</span>
          )}
          {venue.priceLevel != null && <span>{priceLabel(venue.priceLevel)}</span>}
          {subtitle && <span className="truncate">{subtitle}</span>}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <OpenStatus hours={primary?.hours} />
          {hhActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-marquee px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-ember" aria-hidden />
              Happy Hour Now
            </span>
          )}
          <span className="text-xs font-medium text-blaze">View details →</span>
        </div>
      </button>
      <div className="flex shrink-0 flex-col items-center gap-1">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-zinc-400 transition hover:text-zinc-700"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
        <ShareButton iconOnly title={venue.name} url={`/venue/${venue.id}`} />
      </div>
    </div>
  );
}
