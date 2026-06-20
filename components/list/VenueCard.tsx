"use client";

import type { Venue } from "@/types/venue";
import { cn } from "@/lib/cn";
import { RESERVATION_SHORT } from "@/lib/display";
import VenuePhoto from "@/components/ui/VenuePhoto";

type Props = {
  venue: Venue;
  isActive: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  innerRef?: (el: HTMLElement | null) => void;
};

export default function VenueCard({
  venue,
  isActive,
  onHover,
  onSelect,
  innerRef,
}: Props) {
  const subtitle = [venue.types.join(" · "), venue.neighborhood]
    .filter(Boolean)
    .join(" • ");

  const reservation = RESERVATION_SHORT[venue.reservationPolicy];

  return (
    <article
      ref={innerRef}
      onMouseEnter={() => onHover(venue.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(venue.id)}
      className={cn(
        "group flex cursor-pointer gap-3 rounded-xl border p-3 transition",
        isActive
          ? "border-rose-400 bg-rose-50/50 shadow-sm ring-1 ring-rose-200"
          : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
      )}
    >
      <VenuePhoto
        name={venue.name}
        photoUrl={venue.photoUrl}
        className="h-20 w-20 shrink-0"
        rounded="rounded-lg"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-tight text-zinc-900 group-hover:text-rose-700">
            {venue.name}
          </h3>
          {venue.happyHour === true && (
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              Happy hour
            </span>
          )}
        </div>

        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}

        {venue.happyHour === true && venue.happyHourDetails && (
          <p className="mt-1.5 line-clamp-2 text-xs text-amber-800/90">
            {venue.happyHourDetails}
          </p>
        )}

        {venue.hours && (
          <p className="mt-1.5 line-clamp-1 text-xs text-zinc-400">{venue.hours}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          {reservation && (
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600">
              {reservation}
            </span>
          )}
          {venue.booking && (
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-medium capitalize text-zinc-600">
              {venue.booking.host === "other" ? "Reserve" : venue.booking.host}
            </span>
          )}
          {venue.approxLocation && (
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-medium text-zinc-500">
              Approx. location
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
