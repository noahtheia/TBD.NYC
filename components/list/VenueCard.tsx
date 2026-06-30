"use client";

import Link from "next/link";
import type { Venue } from "@/types/venue";
import { cn } from "@/lib/cn";
import { RESERVATION_SHORT, priceLabel } from "@/lib/display";
import { happyHourStatus, type NowParts } from "@/lib/hours";
import { formatProximity } from "@/lib/geo";
import VenuePhoto from "@/components/ui/VenuePhoto";
import OpenStatus from "@/components/ui/OpenStatus";
import ShareButton from "@/components/ui/ShareButton";

type Props = {
  venue: Venue;
  isActive?: boolean;
  onHover?: (id: string | null) => void;
  /** When provided (explore list), a click opens the drawer instead of navigating.
   *  When omitted (landing pages), the card navigates to /venue/[id]. */
  onSelect?: (id: string) => void;
  distanceMiles?: number | null;
  innerRef?: (el: HTMLElement | null) => void;
  /** Current NYC time, for the live "Happy hour now" pill. */
  now?: NowParts;
  /** Eager-load the photo (above-the-fold cards). */
  eager?: boolean;
  /** Hide the photo thumbnail (explore list + map sidebar). Defaults to shown. */
  showPhoto?: boolean;
};

export default function VenueCard({
  venue,
  isActive = false,
  onHover,
  onSelect,
  distanceMiles,
  innerRef,
  now,
  eager,
  showPhoto = true,
}: Props) {
  const primary = venue.locations[0];
  const tags =
    venue.category === "restaurant"
      ? venue.cuisines?.length
        ? venue.cuisines
        : ["Restaurant"]
      : venue.types;
  const subtitle = [tags.join(" · "), venue.neighborhood].filter(Boolean).join(" • ");
  const reservation =
    RESERVATION_SHORT[venue.reservationPolicy] || (venue.booking ? "Reservations" : "");
  const hhActive =
    venue.happyHour === true && happyHourStatus(venue.happyHourWindows, now)?.active === true;

  return (
    <article
      ref={innerRef}
      onMouseEnter={onHover ? () => onHover(venue.id) : undefined}
      onMouseLeave={onHover ? () => onHover(null) : undefined}
      className={cn(
        "group relative flex cursor-pointer gap-3 rounded-xl border p-3 transition",
        isActive
          ? "border-blaze bg-blaze/5 shadow-sm ring-1 ring-blaze/20"
          : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
      )}
    >
      {showPhoto && (
        <VenuePhoto
          name={venue.name}
          photoUrl={venue.photoUrl}
          className="h-20 w-20 shrink-0"
          rounded="rounded-lg"
          eager={eager}
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-base font-extrabold leading-tight tracking-tight text-ink group-hover:text-ember">
            <Link
              href={`/venue/${venue.id}`}
              aria-label={`${venue.name}${venue.neighborhood ? `, ${venue.neighborhood}` : ""}`}
              onClick={
                onSelect
                  ? (e) => {
                      // Plain left-click opens the drawer in place; modified clicks
                      // (cmd/ctrl/shift/middle) keep the native new-tab navigation.
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                      e.preventDefault();
                      onSelect(venue.id);
                    }
                  : undefined
              }
              onFocus={onHover ? () => onHover(venue.id) : undefined}
              onBlur={onHover ? () => onHover(null) : undefined}
              className="rounded-sm after:absolute after:inset-0 after:content-[''] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blaze"
            >
              {venue.name}
            </Link>
          </h3>
          <div className="flex shrink-0 items-center gap-1.5">
            {hhActive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-marquee px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-ember" aria-hidden />
                Happy Hour Now
              </span>
            ) : (
              venue.happyHour === true && (
                <span className="rounded-full bg-glow/40 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-ember">
                  Happy Hour
                </span>
              )
            )}
          </div>
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-zinc-500">
          {venue.rating != null && (
            <span className="font-medium text-zinc-700">★ {venue.rating.toFixed(1)}</span>
          )}
          {venue.priceLevel != null && <span>{priceLabel(venue.priceLevel)}</span>}
          {distanceMiles != null && (
            <span className="text-zinc-500">{formatProximity(distanceMiles)}</span>
          )}
          {subtitle && <span className="min-w-0 truncate">{subtitle}</span>}
        </div>

        <div className="mt-1.5">
          {venue.businessStatus === "CLOSED_TEMPORARILY" ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Temporarily closed
            </span>
          ) : (
            <OpenStatus hours={primary?.hours} />
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          {venue.awards?.map((a) => (
            <span
              key={a}
              className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 font-medium text-amber-800"
            >
              <span aria-hidden>🏆</span>
              {a}
            </span>
          ))}
          {reservation && (
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600">
              {reservation}
            </span>
          )}
          {venue.locations.length > 1 && (
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600">
              {venue.locations.length} locations
            </span>
          )}
          {venue.unverified && (
            <span
              title="Matched by name via Google — details may be approximate"
              className="rounded-md bg-amber-50 px-2 py-0.5 font-medium text-amber-700"
            >
              Unverified
            </span>
          )}
          <ShareButton
            iconOnly
            title={venue.name}
            url={`/venue/${venue.id}`}
            className="relative z-20 ml-auto h-7 w-7"
          />
        </div>
      </div>
    </article>
  );
}
