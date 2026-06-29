"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { Venue } from "@/types/venue";
import { nearestDistanceMiles, type LatLng } from "@/lib/geo";
import type { NowParts } from "@/lib/hours";
import VenueCard from "./VenueCard";

export type ActiveState = { id: string | null; source: "list" | "map" };

const STEP = 60;

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
  /** When set (a venue is explicitly opened/clicked), scroll its card into view.
   *  Hovering does NOT set this, so the list stays put while browsing the map. */
  scrollToId?: string | null;
  /** The scroll container, used as the IntersectionObserver root for paging. */
  scrollRef?: RefObject<HTMLElement | null>;
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
  scrollToId,
  scrollRef,
}: Props) {
  const refs = useRef<Map<string, HTMLElement>>(new Map());
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Render the list progressively to keep first paint + INP cheap on the full
  // ~400-card catalog; pull more in as the user scrolls. The parent remounts this
  // (via key) when the result set changes, which resets the window to the top.
  const [count, setCount] = useState(STEP);

  // Ensure the opened venue's card is within the rendered window so it can be
  // scrolled to (derived, so no extra state is needed for an off-window target).
  const targetIdx = scrollToId ? venues.findIndex((v) => v.id === scrollToId) : -1;
  const shownCount = targetIdx >= count ? targetIdx + 1 : count;

  // Scroll the list to a venue ONLY when one is explicitly opened (clicked) — never
  // on hover — so the list doesn't jump around as the user moves over the map.
  useEffect(() => {
    if (scrollToId) {
      refs.current
        .get(scrollToId)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [scrollToId, shownCount]);

  // Page in more cards when the sentinel nears the bottom of the scroll area.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setCount((c) => Math.min(c + STEP, venues.length));
        }
      },
      { root: scrollRef?.current ?? null, rootMargin: "400px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [venues.length, scrollRef]);

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
            className="mt-4 inline-flex items-center justify-center rounded-full bg-blaze px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember"
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3 p-4">
        {venues.slice(0, shownCount).map((v, i) => (
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
      {shownCount < venues.length && (
        <div ref={sentinelRef} className="h-1" aria-hidden />
      )}
    </>
  );
}
