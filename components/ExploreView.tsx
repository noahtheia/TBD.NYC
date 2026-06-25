"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import type { Facets, Venue } from "@/types/venue";
import { useExploreState } from "@/hooks/useExploreState";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useFavorites } from "@/hooks/useFavorites";
import { countActiveFilters, filterVenues } from "@/lib/filtering";
import { sortVenues, type SortKey } from "@/lib/sort";
import { nycNow, type NowParts } from "@/lib/hours";
import { FOCUS_ZOOM } from "@/lib/map-config";
import { motionDuration } from "@/lib/prefers-reduced-motion";
import { cn } from "@/lib/cn";
import meta from "@/data/meta.json";
import SearchBar from "@/components/filters/SearchBar";
import FilterControls from "@/components/filters/FilterControls";
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
  const [showSaved, setShowSaved] = useState(false);
  const mapRef = useRef<MapRef | null>(null);
  const listScrollRef = useRef<HTMLElement | null>(null);

  const { coords: userLoc, status: geoStatus, request: locate } = useGeolocation();
  const { set: favSet, count: favCount } = useFavorites();

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

  // "Saved" view: intersect with favorites (only while there are favorites).
  const savedActive = showSaved && favCount > 0;
  const displayedVenues = useMemo(
    () => (savedActive ? sortedVenues.filter((v) => favSet.has(v.id)) : sortedVenues),
    [savedActive, sortedVenues, favSet]
  );
  const mapVenues = useMemo(
    () => (savedActive ? filteredVenues.filter((v) => favSet.has(v.id)) : filteredVenues),
    [savedActive, filteredVenues, favSet]
  );
  const visibleCount = savedActive ? displayedVenues.length : filteredVenues.length;

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
      { padding: 60, maxZoom: 15, duration: motionDuration(600) }
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
          duration: motionDuration(800),
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

  // "Surprise me": open a random venue from the current results.
  const surprise = useCallback(() => {
    if (!displayedVenues.length) return;
    const pick = displayedVenues[Math.floor(Math.random() * displayedVenues.length)];
    handleSelect(pick.id);
  }, [displayedVenues, handleSelect]);

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
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to results
      </a>
      {/* Header */}
      <header className="z-20 shrink-0 border-b border-zinc-200 bg-white">
        <div className="flex flex-col gap-3 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-2">
              <Link
                href="/"
                className="text-xl font-extrabold tracking-tight text-zinc-900"
              >
                TBD<span className="text-rose-600">.NYC</span>
              </Link>
              <span className="hidden text-sm text-zinc-400 sm:inline">
                NYC bars &amp; happy hours
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-44 sm:w-72 md:w-96">
                <SearchBar value={searchInput} onChange={setSearchInput} />
              </div>
              {favCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSaved((v) => !v)}
                  aria-pressed={savedActive}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition",
                    savedActive
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                  )}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d="M12 20.5S3.5 15.6 3.5 9.6A4.1 4.1 0 0 1 12 7a4.1 4.1 0 0 1 8.5 2.6c0 6-8.5 10.9-8.5 10.9z" />
                  </svg>
                  <span className="hidden sm:inline">Saved</span> {favCount}
                </button>
              )}
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
            <FilterControls
              facets={facets}
              filters={filters}
              activeCount={activeFilterCount}
              resultCount={filteredVenues.length}
              onToggleHappyHour={toggleHappyHour}
              onToggleOpenNow={toggleOpenNow}
              onToggleOpenLate={toggleOpenLate}
              onToggleFilterValue={toggleFilterValue}
              onTogglePrice={togglePrice}
              onClear={clearFilters}
            />
            <div className="ml-auto flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={surprise}
                title="Open a random spot"
                aria-label="Surprise me — open a random spot"
                className="hidden items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 sm:flex"
              >
                <span aria-hidden>🎲</span> Surprise me
              </button>
              <SortControl
                sort={sort}
                onSort={setSort}
                geoStatus={geoStatus}
                onLocate={requestNearMe}
              />
              <span
                className="hidden text-sm text-zinc-500 sm:inline"
                role="status"
                aria-live="polite"
              >
                {visibleCount}{" "}
                {visibleCount === 1 ? "spot" : "spots"}
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
      <main id="main" className="flex min-h-0 flex-1">
        <section
          ref={listScrollRef}
          aria-label="Venue results"
          className={cn(
            "w-full overflow-y-auto border-r border-zinc-200 lg:block lg:w-[42%] lg:max-w-xl xl:w-[38%]",
            mobileView === "map" && "hidden"
          )}
        >
          <VenueList
            key={`${filterSig}|${sort}|${savedActive}`}
            venues={displayedVenues}
            active={active}
            onHover={handleHoverList}
            onSelect={handleSelect}
            userLoc={userLoc}
            now={now}
            activeCount={activeFilterCount}
            onClear={clearFilters}
            scrollToId={openId}
            scrollRef={listScrollRef}
          />
          <p className="px-4 pb-24 pt-2 text-center text-xs text-zinc-500 lg:pb-6">
            {visibleCount} venues · data updated {DATA_UPDATED}
          </p>
        </section>

        <section
          aria-label="Map"
          className={cn(
            "relative flex-1 lg:block",
            mobileView === "list" && "hidden"
          )}
        >
          <MapView
            venues={mapVenues}
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
      </main>

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
