import type { Venue } from "@/types/venue";
import { BOOKING_LABEL, RESERVATION_LABEL, mapsUrl } from "@/lib/display";
import VenuePhoto from "@/components/ui/VenuePhoto";

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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-zinc-100 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-zinc-700">{children}</dd>
    </div>
  );
}

export default function VenueDetailContent({ venue }: { venue: Venue }) {
  const subtitle = [venue.types.join(" · "), venue.neighborhood]
    .filter(Boolean)
    .join(" • ");

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
          <h2 className="text-2xl font-bold leading-tight text-zinc-900">
            {venue.name}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
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
        <ActionLink href={mapsUrl(venue.name, venue.address)}>Directions</ActionLink>
        {venue.menuUrl && <ActionLink href={venue.menuUrl}>Menu</ActionLink>}
        {venue.website && <ActionLink href={venue.website}>Website</ActionLink>}
        {venue.instagram && <ActionLink href={venue.instagram}>Instagram</ActionLink>}
      </div>

      <dl className="mt-4">
        {venue.happyHour === true && venue.happyHourDetails && (
          <Row label="Happy hour">{venue.happyHourDetails}</Row>
        )}
        <Row label="Reservations">
          {venue.reservationRaw || RESERVATION_LABEL[venue.reservationPolicy]}
        </Row>
        {venue.hours && <Row label="Hours">{venue.hours}</Row>}
        <Row label="Address">
          {venue.address}
          {venue.approxLocation && (
            <span className="ml-2 text-xs text-zinc-400">(approximate)</span>
          )}
        </Row>
        {venue.otherInfo && <Row label="Good to know">{venue.otherInfo}</Row>}
      </dl>
    </div>
  );
}
