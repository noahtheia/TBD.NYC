import Link from "next/link";
import type { ResolvedPick } from "@/types/pick";
import { priceLabel } from "@/lib/display";
import VenuePhoto from "@/components/ui/VenuePhoto";

/** Image-forward editor's-pick card (Resy "hit list" style). */
export default function PickCard({ pick }: { pick: ResolvedPick }) {
  const v = pick.venue;
  const tags =
    v.category === "restaurant"
      ? v.cuisines?.length
        ? v.cuisines
        : ["Restaurant"]
      : v.types;
  const sub = [tags.slice(0, 2).join(" · "), v.neighborhood].filter(Boolean).join(" • ");
  const secondary = pick.headline ? [v.name, sub].filter(Boolean).join(" · ") : sub;

  return (
    <Link
      href={`/venue/${v.id}`}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:shadow-md"
    >
      <VenuePhoto
        name={v.name}
        photoUrl={v.photoUrl}
        className="aspect-[4/3] w-full"
        rounded="rounded-none"
        sizes="288px"
      />
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-bold leading-snug text-zinc-900 group-hover:text-rose-700">
          {pick.headline || v.name}
        </h3>
        {secondary && <p className="mt-0.5 text-sm font-medium text-zinc-500">{secondary}</p>}
        {pick.blurb && <p className="mt-2 line-clamp-3 text-sm text-zinc-600">{pick.blurb}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-zinc-600">
          {v.rating != null && (
            <span className="font-semibold text-zinc-900">★ {v.rating.toFixed(1)}</span>
          )}
          {v.priceLevel != null && <span>{priceLabel(v.priceLevel)}</span>}
          {v.happyHour === true && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              Happy hour
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
