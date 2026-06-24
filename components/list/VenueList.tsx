"use client";

import { useEffect, useRef } from "react";
import type { Venue } from "@/types/venue";
import { nearestDistanceMiles, type LatLng } from "@/lib/geo";
import type { NowParts } from "@/lib/hours";
import VenueCard from "./VenueCard";

export type ActiveState = { id: string | null; source: "list" | "map" };

type Props = {
  venues: Venue[];
  active: ActiveState;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  userLoc?: LatLng | null;
  now?: NowParts;
  /** Number of active filters, for the no-results message. */
  activeCount?: number;
  /** Clear all filters + search, for the no-results recovery action. */
  onClear?: () => void;
};

export default function VenueList({
  venues,
  active,
  onHover,
  onSelect,
  userLoc,
  now,
  activeCount = 0,
  onClear,
}: Props) {
  const refs = useRef<Map<string, HTMLElement>>(new Map());

  // When the active venue changes because of a map interaction, scroll its
  // card into view. (Don't scroll on list-originated hover — the user is there.)
  useEffect(() => {
    if (active.id && active.source === "map") {
      refs.current
        .get(active.id)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [active]);

  if (venues.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-base font-medium text-zinc-700">No spots match</p>
        <p className="mt-1 text-sm text-zinc-500">
          {activeCount > 0
            ? `No spots match your ${activeCount} ${activeCount === 1 ? "filter" : "filters"}.`
            : "Try a different search."}
        </p>
        {onClear && activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3 p-4">
      {venues.map((v, i) => (
        <li key={v.id}>
          <VenueCard
            venue={v}
            isActive={v.id === active.id}
            onHover={onHover}
            onSelect={onSelect}
            distanceMiles={userLoc ? nearestDistanceMiles(userLoc, v) : null}
            now={now}
            eager={i < 4}
            innerRef={(el) => {
              if (el) refs.current.set(v.id, el);
              else refs.current.delete(v.id);
            }}
          />
        </li>
      ))}
    </ul>
  );
}
