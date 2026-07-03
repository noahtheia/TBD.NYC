"use client";

import { useState } from "react";
import type { Category, Venue } from "@/types/venue";
import type { NowParts } from "@/lib/hours";
import type { PairingSets } from "@/lib/pairing";
import { defaultPairingCategory } from "@/lib/pairing";
import { cn } from "@/lib/cn";
import VenueCard from "@/components/list/VenueCard";

const CATEGORY_LABEL: Record<Category, string> = { bar: "Bar", restaurant: "Restaurant" };
const CATEGORY_PLURAL: Record<Category, string> = { bar: "Bars", restaurant: "Restaurants" };

function heading(venueCategory: Category, shown: Category): string {
  if (shown === defaultPairingCategory(venueCategory)) {
    return venueCategory === "bar" ? "Grab dinner after" : "Start with a drink before";
  }
  return `${CATEGORY_PLURAL[shown]} nearby`;
}

type Props = {
  /** The venue the user is going to. Reset the override across venues by
   *  rendering with key={venue.id}. */
  venue: Venue;
  pairings: PairingSets;
  /** When provided (drawer), a suggestion click swaps the open venue instead
   *  of navigating — same dual-mode contract as VenueCard. */
  onSelect?: (id: string) => void;
  /** Current NYC time, for the live "Happy hour now" pill (drawer only). */
  now?: NowParts;
  className?: string;
};

export default function PairingSection({ venue, pairings, onSelect, now, className }: Props) {
  const [override, setOverride] = useState<Category | null>(null);
  const shown = override ?? defaultPairingCategory(venue.category);
  const items = pairings[shown];

  if (pairings.bar.length === 0 && pairings.restaurant.length === 0) return null;

  return (
    <section aria-label="Pairing suggestions" className={className}>
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-stone">
        Make a night of it
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 className="font-display text-lg font-black tracking-tight text-ink">
          {heading(venue.category, shown)}
        </h2>
        <div role="group" aria-label="Suggest a bar or a restaurant" className="flex gap-1.5">
          {(["bar", "restaurant"] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={shown === c}
              onClick={() => setOverride(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition",
                shown === c
                  ? "border-blaze bg-blaze/5 font-semibold text-ember"
                  : "border-zinc-200 bg-white font-medium text-zinc-600 hover:border-zinc-300"
              )}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        Within a 10-minute walk of {venue.name}
      </p>

      {items.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {items.map((s) => (
            <li key={s.venue.id}>
              <VenueCard
                venue={s.venue}
                distanceMiles={s.distanceMiles}
                onSelect={onSelect}
                now={now}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">
          No {shown === "bar" ? "bars" : "restaurants"} within a 10-minute walk.
        </p>
      )}
    </section>
  );
}
