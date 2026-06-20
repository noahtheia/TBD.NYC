"use client";

import { memo } from "react";
import { Marker, type MarkerEvent } from "react-map-gl/mapbox";
import type { Venue } from "@/types/venue";
import { cn } from "@/lib/cn";

type Props = {
  venue: Venue;
  isActive: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

function VenueMarkerBase({ venue, isActive, onHover, onSelect }: Props) {
  const isHH = venue.happyHour === true;

  return (
    <Marker
      longitude={venue.coordinates.lng}
      latitude={venue.coordinates.lat}
      anchor="bottom"
      style={{ zIndex: isActive ? 10 : 1 }}
      onClick={(e: MarkerEvent<MouseEvent>) => {
        e.originalEvent.stopPropagation();
        onSelect(venue.id);
      }}
    >
      <button
        type="button"
        aria-label={venue.name}
        onMouseEnter={() => onHover(venue.id)}
        onMouseLeave={() => onHover(null)}
        className="group/marker relative flex -translate-y-1 flex-col items-center"
      >
        {isActive && (
          <span className="absolute bottom-full mb-1 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white shadow-lg">
            {venue.name}
          </span>
        )}
        <span
          className={cn(
            "block rounded-full border-2 border-white shadow-md transition-all",
            isActive ? "h-5 w-5" : "h-3.5 w-3.5 group-hover/marker:h-4 group-hover/marker:w-4",
            isActive
              ? isHH
                ? "bg-amber-500 ring-4 ring-amber-300/50"
                : "bg-rose-600 ring-4 ring-rose-300/50"
              : isHH
                ? "bg-amber-400"
                : "bg-rose-500"
          )}
        />
      </button>
    </Marker>
  );
}

export default memo(VenueMarkerBase);
