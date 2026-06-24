"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import type { Facets, Venue } from "@/types/venue";
import { useExploreState } from "@/hooks/useExploreState";
import { useGeolocation } from "@/hooks/useGeolocation";
import { countActiveFilters, filterVenues } from "@/lib/filtering";
import { sortVenues, type SortKey } from "@/lib/sort";
import { nycNow, type NowParts } from "@/lib/hours";
import { FOCUS_ZOOM } from "@/lib/map-config";
import { cn } from "@/lib/cn";
import meta from "@/data/meta.json";
import SearchBar from "@/components/filters/SearchBar";
import FilterBar from "@/components/filters/FilterBar";
import SortControl from "@/components/filters/SortControl";
import ActiveFilterChips from "@/components/filters/ActiveFilterChips";
import VenueList, { type ActiveState } from "@/components/list/VenueList";
import VenueDrawer from "@/components/detail/VenueDrawer";
import PeekCard from "@/components/ui/PeekCard";
import ShareButton from "@/components/ui/ShareButton";

const DATA_UPDATED = new Date(meta.generatedAt).toLocaleDateString("en-US", {
  month: "long",
  year: "numeric",
});

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
    showHappyHourNow,
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
  const [sort, setSort] = useState<SortKey>("relevance");
  const [peekId, setPeekId] = useState<string | null>(null);
  const mapRef = useRef<MapRef | null>(null);

  const { coords: userLoc, status: geoStatus, request: locate } = useGeolocation();

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

  const sortedVenues = useMemo(
    () => sortVenues(filteredVenues, sort, userLoc),
    [filteredVenues, sort, userLoc]
  );

  const activeFilterCount = countActiveFilters(filters);
  const openVenueObj = openId ? venuesById.get(openId) ?? null : null;
  const peekVenue = peekId ? venuesById.get(peekId) ?? null : null;

  // The venue to focus when the map first loads (deep-linked ?venue=). Captured
  // once at mount so later state changes don't refly the map.
  const [focusOnLoad] = useState(
    () => openVenueObj?.locations[0]?.coordinates ?? null
  );

  // Fit the map to the results whenever the filter/search set changes (not on
  // hover, the per-minute clock tick, or sort).
  const filterSig = JSON.stringify({ ...filters, q: debouncedSearch });
  const prevSig = useRef(filterSig);
  useEffect(() => {
    if (filterSig === prevSig.current) return;
    prevSig.current = filterSig;
    const hasFilters = activeFilterCount > 0 || debouncedSearch.trim().length > 0;
    const locs = filteredVenues.flatMap((v) => v.locations);
    if (!hasFilters || !locs.length) return;
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    for (const l of locs) {
      minLng = Math.min(minLng, l.coordinates.lng);
      maxLng = Math.max(maxLng, l.coordinates.lng);
      minLat = Math.min(minLat, l.coordinates.lat);
      maxLat = Math.max(maxLat, l.coordinates.lat);
    }
    mapRef.current?.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 60, maxZoom: 15, duration: 600 }
    );
  }, [filterSig, filteredVenues, activeFilterCount, debouncedSearch]);

  // "Near me" intent: request location, then switch to distance sort once coords
  // actually arrive (so the sort doesn't silently change before/without a fix).
  const pendingDistanceSort = useRef(false);
  const requestNearMe = useCallback(() => {
    if (geoStatus === "granted") {
      setSort("distance");
      return;
    }
    pendingDistanceSort.current = true;
    locate();
  }, [geoStatus, locate]);

  useEffect(() => {
    if (geoStatus === "granted" && pendingDistanceSort.current) {
      pendingDistanceSort.current = false;
      setSort("distance");
    }
  }, [geoStatus]);

  // One-tap headline action: happy hour + open now, sorted nearest.
  const showHappyHourNearMe = useCallback(() => {
    showHappyHourNow();
    requestNearMe();
  }, [showHappyHourNow, requestNearMe]);

  const handleHoverList = useCallback(
    (id: string | null) => setActive({ id, source: "list" }),
    []
  );
  const handleHoverMap = useCallback(
    (id: string | null) => setActive({ id, source: "map" }),
    []
  );

  const flyTo = useCallback(
    (id: string) => {
      const loc = venuesById.get(id)?.locations[0];
      if (loc) {
        mapRef.current?.flyTo({
          center: [loc.coordinates.lng, loc.coordinates.lat],
          zoom: FOCUS_ZOOM,
          duration: 800,
        });
      }
    },
    [venuesById]
  );

  const handleSelect = useCallback(
    (id: string) => {
      setPeekId(null);
      openVenue(id);
      setActive({ id, source: "list" });
      flyTo(id);
    },
    [openVenue, flyTo]
  );

  // Map pin click: on mobile map view, show a peek card; otherwise open the drawer.
  const handleSelectFromMap = useCallback(
    (id: string) => {
      if (mobileView === "map") {
        setPeekId(id);
        setActive({ id, source: "map" });
        flyTo(id);
      } else {
        handleSelect(id);
      }
    },
    [mobileView, flyTo, handleSelect]
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
            <button
              type="button"
              onClick={showHappyHourNearMe}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
            >
              <span aria-hidden>🍸</span> Happy hour now
            </button>
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
            <div className="ml-auto flex shrink-0 items-center gap-3">
              <SortControl
                sort={sort}
                onSort={setSort}
                geoStatus={geoStatus}
                onLocate={requestNearMe}
              />
              <span className="hidden text-sm text-zinc-500 sm:inline">
                {filteredVenues.length}{" "}
                {filteredVenues.length === 1 ? "spot" : "spots"}
              </span>
            </div>
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
            venues={sortedVenues}
            active={active}
            onHover={handleHoverList}
            onSelect={handleSelect}
            userLoc={userLoc}
            now={now}
            activeCount={activeFilterCount}
            onClear={clearFilters}
          />
          <p className="px-4 pb-24 pt-2 text-center text-xs text-zinc-400 lg:pb-6">
            {filteredVenues.length} venues · data updated {DATA_UPDATED}
          </p>
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
            onSelect={handleSelectFromMap}
            focusOnLoad={focusOnLoad}
            userLoc={userLoc}
          />
          {peekVenue && (
            <div className="pointer-events-none absolute inset-x-0 bottom-20 z-20 lg:hidden">
              <PeekCard
                venue={peekVenue}
                onOpen={() => handleSelect(peekVenue.id)}
                onClose={() => setPeekId(null)}
                now={now}
              />
            </div>
          )}
        </section>
      </div>

      {/* Mobile list/map toggle */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center lg:hidden">
        <div className="pointer-events-auto inline-flex rounded-full border border-zinc-200 bg-white p-1 shadow-lg">
          {(["list", "map"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setMobileView(v);
                setPeekId(null);
              }}
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
