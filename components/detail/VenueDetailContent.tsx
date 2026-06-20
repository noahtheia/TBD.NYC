import type { Venue, VenueLocation } from "@/types/venue";
import { BOOKING_LABEL, RESERVATION_LABEL, mapsUrl, priceLabel } from "@/lib/display";
import { happyHourStatus } from "@/lib/hours";
import VenuePhoto from "@/components/ui/VenuePhoto";
import OpenStatus from "@/components/ui/OpenStatus";
import HoursTable from "./HoursTable";

function ActionLink({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={
        primary
          ? "inline-flex items-center justify-center rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          : "inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
      }
    >
      {children}
    </a>
  );
}

function LocationBlock({
  venueName,
  loc,
  showHours,
}: {
  venueName: string;
  loc: VenueLocation;
  showHours: boolean;
}) {
  return (
    <div className="border-t border-zinc-100 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm text-zinc-700">
          {loc.neighborhood && (
            <span className="font-medium text-zinc-900">{loc.neighborhood}</span>
          )}
          <div className="text-zinc-500">{loc.address}</div>
        </div>
        <a
          href={mapsUrl(venueName, loc.address)}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-sm font-medium text-rose-600 hover:underline"
        >
          Directions
        </a>
      </div>
      {showHours && loc.hours && (
        <div className="mt-3">
          <HoursTable hours={loc.hours} />
        </div>
      )}
    </div>
  );
}

export default function VenueDetailContent({ venue }: { venue: Venue }) {
  const primary = venue.locations[0];
  const multi = venue.locations.length > 1;
  const tags =
    venue.category === "restaurant"
      ? venue.cuisines?.length
        ? venue.cuisines
        : ["Restaurant"]
      : venue.types;
  const subtitle = [tags.join(" · "), !multi ? venue.neighborhood : undefined]
    .filter(Boolean)
    .join(" • ");
  const hh = venue.happyHour === true ? happyHourStatus(venue.happyHourWindows) : null;

  return (
    <div>
      <VenuePhoto
        name={venue.name}
        photoUrl={venue.photoUrl}
        className="mb-4 aspect-video w-full"
        rounded="rounded-xl"
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold leading-tight text-zinc-900">{venue.name}</h2>
          {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
          {venue.unverified && (
            <p className="mt-1 text-xs text-amber-700">
              Unverified · matched by name via Google
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-600">
            {venue.rating != null && (
              <span>
                <span className="font-semibold text-zinc-900">★ {venue.rating.toFixed(1)}</span>
                {venue.userRatingCount ? (
                  <span className="text-zinc-400"> ({venue.userRatingCount})</span>
                ) : null}
              </span>
            )}
            {venue.priceLevel != null && <span>{priceLabel(venue.priceLevel)}</span>}
            <OpenStatus hours={primary?.hours} />
          </div>
        </div>
        {venue.happyHour === true && (
          <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            Happy hour
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {venue.booking && (
          <ActionLink href={venue.booking.url} primary>
            {BOOKING_LABEL[venue.booking.host]}
          </ActionLink>
        )}
        <ActionLink href={venue.googleMapsUri ?? mapsUrl(venue.name, primary?.address ?? "")}>
          Directions
        </ActionLink>
        {venue.menuUrl && <ActionLink href={venue.menuUrl}>Menu</ActionLink>}
        {venue.website && <ActionLink href={venue.website}>Website</ActionLink>}
        {venue.instagram && <ActionLink href={venue.instagram}>Instagram</ActionLink>}
      </div>

      <dl className="mt-4">
        {venue.happyHour === true && (venue.happyHourDetails || hh) && (
          <div className="border-t border-zinc-100 py-3">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Happy hour
              {hh && (
                <span
                  className={
                    hh.active
                      ? "rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold normal-case tracking-normal text-amber-800"
                      : "text-[11px] font-medium normal-case tracking-normal text-zinc-500"
                  }
                >
                  {hh.label}
                </span>
              )}
            </dt>
            {venue.happyHourDetails && (
              <dd className="mt-1 text-sm text-zinc-700">{venue.happyHourDetails}</dd>
            )}
          </div>
        )}
        {venue.reservationPolicy !== "unknown" && (
          <div className="border-t border-zinc-100 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Reservations
            </dt>
            <dd className="mt-1 text-sm text-zinc-700">
              {venue.reservationRaw || RESERVATION_LABEL[venue.reservationPolicy]}
            </dd>
          </div>
        )}
        {venue.otherInfo && (
          <div className="border-t border-zinc-100 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Good to know
            </dt>
            <dd className="mt-1 text-sm text-zinc-700">{venue.otherInfo}</dd>
          </div>
        )}
      </dl>

      {/* Single location: hours table. Multi: a block per location. */}
      {!multi && primary?.hours && (
        <div className="border-t border-zinc-100 py-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Hours
          </div>
          <HoursTable hours={primary.hours} />
          <div className="mt-3 text-sm text-zinc-500">{primary.address}</div>
        </div>
      )}
      {!multi && !primary?.hours && primary && (
        <div className="border-t border-zinc-100 py-3 text-sm text-zinc-500">
          {primary.address}
        </div>
      )}
      {multi && (
        <div className="pt-1">
          <div className="pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {venue.locations.length} locations
          </div>
          {venue.locations.map((loc, i) => (
            <LocationBlock key={i} venueName={venue.name} loc={loc} showHours />
          ))}
        </div>
      )}
    </div>
  );
}
