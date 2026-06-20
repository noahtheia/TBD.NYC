"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import type { Facets, Venue } from "@/types/venue";
import { useExploreState } from "@/hooks/useExploreState";
import { countActiveFilters, filterVenues } from "@/lib/filtering";
import { nycNow, type NowParts } from "@/lib/hours";
import { FOCUS_ZOOM } from "@/lib/map-config";
import { cn } from "@/lib/cn";
import SearchBar from "@/components/filters/SearchBar";
import FilterBar from "@/components/filters/FilterBar";
import ActiveFilterChips from "@/components/filters/ActiveFilterChips";
import VenueList, { type ActiveState } from "@/components/list/VenueList";
import VenueDrawer from "@/components/detail/VenueDrawer";
import ShareButton from "@/components/ui/ShareButton";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-zinc-100" />,
});

type Props = {
  venues: Venue[];
  facets: Facets;
};

export default function ExploreView({ venues, facets }: Props) {
  const {
    filters,
    toggleHappyHour,
    toggleOpenNow,
    toggleOpenLate,
    toggleFilterValue,
    togglePrice,
    clearFilters,
    searchInput,
    setSearchInput,
    debouncedSearch,
    openId,
    openVenue,
    closeVenue,
  } = useExploreState();

  const [active, setActive] = useState<ActiveState>({ id: null, source: "list" });
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const mapRef = useRef<MapRef | null>(null);

  // Current NYC time, refreshed each minute, drives the "open now" filter.
  const [now, setNow] = useState<NowParts>(() => nycNow());
  useEffect(() => {
    const t = setInterval(() => setNow(nycNow()), 60_000);
    return () => clearInterval(t);
  }, []);

  const venuesById = useMemo(
    () => new Map(venues.map((v) => [v.id, v])),
    [venues]
  );

  const filteredVenues = useMemo(
    () => filterVenues(venues, filters, debouncedSearch, now),
    [venues, filters, debouncedSearch, now]
  );

  const activeFilterCount = countActiveFilters(filters);
  const openVenueObj = openId ? venuesById.get(openId) ?? null : null;

  const handleHoverList = useCallback(
    (id: string | null) => setActive({ id, source: "list" }),
    []
  );
  const handleHoverMap = useCallback(
    (id: string | null) => setActive({ id, source: "map" }),
    []
  );

  const handleSelect = useCallback(
    (id: string) => {
      openVenue(id);
      setActive({ id, source: "list" });
      const loc = venuesById.get(id)?.locations[0];
      if (loc) {
        mapRef.current?.flyTo({
          center: [loc.coordinates.lng, loc.coordinates.lat],
          zoom: FOCUS_ZOOM,
          duration: 800,
        });
      }
    },
    [openVenue, venuesById]
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="z-20 shrink-0 border-b border-zinc-200 bg-white">
        <div className="flex flex-col gap-3 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold tracking-tight text-zinc-900">
                TBD<span className="text-rose-600">.NYC</span>
              </span>
              <span className="hidden text-sm text-zinc-400 sm:inline">
                NYC bars &amp; happy hours
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-44 sm:w-72 md:w-96">
                <SearchBar value={searchInput} onChange={setSearchInput} />
              </div>
              <ShareButton />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FilterBar
              facets={facets}
              filters={filters}
              activeCount={activeFilterCount}
              onToggleHappyHour={toggleHappyHour}
              onToggleOpenNow={toggleOpenNow}
              onToggleOpenLate={toggleOpenLate}
              onToggleFilterValue={toggleFilterValue}
              onTogglePrice={togglePrice}
              onClear={clearFilters}
            />
            <span className="ml-auto shrink-0 text-sm text-zinc-500">
              {filteredVenues.length}{" "}
              {filteredVenues.length === 1 ? "spot" : "spots"}
            </span>
          </div>
          {activeFilterCount > 0 && (
            <ActiveFilterChips
              filters={filters}
              onToggleHappyHour={toggleHappyHour}
              onToggleOpenNow={toggleOpenNow}
              onToggleOpenLate={toggleOpenLate}
              onToggleFilterValue={toggleFilterValue}
              onTogglePrice={togglePrice}
              onClear={clearFilters}
            />
          )}
        </div>
      </header>

      {/* Two-pane body */}
      <div className="flex min-h-0 flex-1">
        <section
          className={cn(
            "w-full overflow-y-auto border-r border-zinc-200 lg:block lg:w-[42%] lg:max-w-xl xl:w-[38%]",
            mobileView === "map" && "hidden"
          )}
        >
          <VenueList
            venues={filteredVenues}
            active={active}
            onHover={handleHoverList}
            onSelect={handleSelect}
          />
        </section>

        <section
          className={cn(
            "relative flex-1 lg:block",
            mobileView === "list" && "hidden"
          )}
        >
          <MapView
            venues={filteredVenues}
            activeId={active.id}
            mapRef={mapRef}
            onHover={handleHoverMap}
            onSelect={handleSelect}
          />
        </section>
      </div>

      {/* Mobile list/map toggle */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center lg:hidden">
        <div className="pointer-events-auto inline-flex rounded-full border border-zinc-200 bg-white p-1 shadow-lg">
          {(["list", "map"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setMobileView(v)}
              className={cn(
                "rounded-full px-5 py-1.5 text-sm font-semibold capitalize transition",
                mobileView === v
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <VenueDrawer venue={openVenueObj} onClose={closeVenue} />
    </div>
  );
}
