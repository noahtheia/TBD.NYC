import type { AdminRow } from "./AdminList";

/** Dashboard summary computed from the venue rows. Server component. */
export default function StatsBar({ venues }: { venues: AdminRow[] }) {
  const total = venues.length;
  const bars = venues.filter((v) => v.category === "bar").length;
  const restaurants = venues.filter((v) => v.category === "restaurant").length;
  const featured = venues.filter((v) => v.featured).length;
  const unverified = venues.filter((v) => v.unverified).length;
  const happyHour = venues.filter((v) => v.happyHour === true).length;
  const manual = venues.filter((v) => v.source === "manual").length;
  const noRating = venues.filter((v) => v.rating == null).length;
  const noPhoto = venues.filter((v) => !v.photoUrl).length;
  const noNeighborhood = venues.filter((v) => !v.neighborhood).length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Venues" value={total} />
        <Stat label="Bars / Restaurants" value={`${bars} / ${restaurants}`} />
        <Stat label="Happy hour" value={happyHour} />
        <Stat label="Featured" value={featured} />
        <Stat label="Unverified" value={unverified} tone={unverified ? "warn" : "default"} />
        <Stat label="Manually edited" value={manual} />
        <Stat label="No rating" value={noRating} tone={noRating ? "warn" : "default"} />
        <Stat label="No photo" value={noPhoto} tone={noPhoto ? "warn" : "default"} />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
        <span>{noNeighborhood} missing a neighborhood.</span>
        {/* Download endpoint (route handler), not a page — a real anchor is required. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/admin/export" className="font-medium text-blaze hover:underline">
          Export CSV ↓
        </a>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "warn";
}) {
  return (
    <div className="rounded-lg border border-zinc-200 px-3 py-2">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</div>
      <div
        className={
          "mt-0.5 text-xl font-bold " + (tone === "warn" ? "text-amber-600" : "text-zinc-900")
        }
      >
        {value}
      </div>
    </div>
  );
}
