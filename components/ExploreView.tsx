"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import type { Facets, Venue } from "@/types/venue";
import { useExploreState } from "@/hooks/useExploreState";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useFavorites } from "@/hooks/useFavorites";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { countActiveFilters, filterVenues } from "@/lib/filtering";
import { sortVenues, type SortKey } from "@/lib/sort";
import { nycNow, type NowParts } from "@/lib/hours";
import { FOCUS_ZOOM } from "@/lib/map-config";
import { motionDuration } from "@/lib/prefers-reduced-motion";
import { cn } from "@/lib/cn";
import meta from "@/data/meta.json";
import SearchBar from "@/components/filters/SearchBar";
import FilterControls from "@/components/filters/FilterControls";
import FilterSheet from "@/components/filters/FilterSheet";
import SortControl from "@/components/filters/SortControl";
import ActiveFilterChips from "@/components/filters/ActiveFilterChips";
import VenueList, { type ActiveState } from "@/components/list/VenueList";
import VenueDrawer from "@/components/detail/VenueDrawer";
import PeekCard from "@/components/ui/PeekCard";
import MobileMapControls from "@/components/explore/MobileMapControls";

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
  // The specific map pin being interacted with (`${venueId}#${locIndex}`), so a
  // multi-location venue highlights only the touched pin — not all of them.
  const [activePointId, setActivePointId] = useState<string | null>(null);
  // Mobile is map-first (Resy-style): land on the full-screen map and toggle to
  // the list. Desktop ignores this — both panes keep `lg:block`.
  const [mobileView, setMobileView] = useState<"list" | "map">("map");
  const [sort, setSort] = useState<SortKey>("relevance");
  const [peekId, setPeekId] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  // The shared filter bottom sheet (mobile), opened from the header pill in list
  // view or the bottom bar's "Filter" button in map view.
  const [filterOpen, setFilterOpen] = useState(false);
  // Current map viewport bounds [w, s, e, n] — drives "list reflects what's visible".
  const [mapBounds, setMapBounds] = useState<[number, number, number, number] | null>(null);
  const mapRef = useRef<MapRef | null>(null);
  const listScrollRef = useRef<HTMLElement | null>(null);

  // Only narrow the list to the visible map area when both panes are on screen
  // (desktop). On mobile the list/map are separate views, so it stays the full set.
  const isDesktop = useMediaQuery("(min-width: 1024px)");

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
  // The list reflects the visible map area on desktop: filter to venues whose
  // location falls within the current map bounds.
  const displayedVenues = useMemo(() => {
    let list = savedActive ? sortedVenues.filter((v) => favSet.has(v.id)) : sortedVenues;
    if (isDesktop && mapBounds) {
      const [w, s, e, n] = mapBounds;
      list = list.filter((v) =>
        v.locations.some(
          (l) =>
            l.coordinates.lng >= w &&
            l.coordinates.lng <= e &&
            l.coordinates.lat >= s &&
            l.coordinates.lat <= n
        )
      );
    }
    return list;
  }, [savedActive, sortedVenues, favSet, isDesktop, mapBounds]);
  const mapVenues = useMemo(
    () => (savedActive ? filteredVenues.filter((v) => favSet.has(v.id)) : filteredVenues),
    [savedActive, filteredVenues, favSet]
  );
  const visibleCount = displayedVenues.length;

  const handleBoundsChange = useCallback(
    (b: [number, number, number, number]) => setMapBounds(b),
    []
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

  // Mobile "Happy hour now" toggle: turn it on, or (when already on) clear the
  // happy-hour filter — leaving Open now / Near me as the user set them.
  const toggleHappyHourNow = useCallback(() => {
    if (filters.happyHourOnly) toggleHappyHour();
    else showHappyHourNearMe();
  }, [filters.happyHourOnly, toggleHappyHour, showHappyHourNearMe]);

  const handleHoverList = useCallback((id: string | null) => {
    // List cards represent a venue, not a specific pin — clear the pin highlight.
    setActive({ id, source: "list" });
    setActivePointId(null);
  }, []);
  const handleHoverMap = useCallback((id: string | null, pointId?: string | null) => {
    setActive({ id, source: "map" });
    setActivePointId(id ? pointId ?? null : null);
  }, []);

  const flyToCoords = useCallback((lng: number, lat: number) => {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: FOCUS_ZOOM,
      duration: motionDuration(800),
    });
  }, []);

  const flyTo = useCallback(
    (id: string) => {
      const loc = venuesById.get(id)?.locations[0];
      if (loc) flyToCoords(loc.coordinates.lng, loc.coordinates.lat);
    },
    [venuesById, flyToCoords]
  );

  const handleSelect = useCallback(
    (id: string) => {
      setPeekId(null);
      openVenue(id);
      setActive({ id, source: "list" });
      setActivePointId(null);
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

  // Map pin click: fly to *the clicked location* (not the venue's primary), and
  // highlight just that pin. On mobile map view show a peek card; else open the drawer.
  const handleSelectFromMap = useCallback(
    (id: string, point: { pointId: string; lng: number; lat: number }) => {
      setActivePointId(point.pointId);
      if (mobileView === "map") {
        setPeekId(id);
        setActive({ id, source: "map" });
      } else {
        setPeekId(null);
        openVenue(id);
        setActive({ id, source: "map" });
      }
      flyToCoords(point.lng, point.lat);
    },
    [mobileView, flyToCoords, openVenue]
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to results
      </a>
      {/* Header — hidden on the mobile map view so the map fills the screen; the
          floating MobileMapControls take over there. Always shown on desktop. */}
      <header
        className={cn(
          "z-20 shrink-0 border-b border-zinc-200 bg-white",
          mobileView === "map" && "hidden lg:block"
        )}
      >
        <div className="flex flex-col gap-3 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-2">
              <Link
                href="/"
                aria-label="TBD.NYC — home"
                className="text-xl font-extrabold tracking-tight text-zinc-900 transition hover:opacity-70"
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
              onOpenFilters={() => setFilterOpen(true)}
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
            activePointId={activePointId}
            mapRef={mapRef}
            onHover={handleHoverMap}
            onSelect={handleSelectFromMap}
            focusOnLoad={focusOnLoad}
            userLoc={userLoc}
            showZoomControls={isDesktop}
            onBoundsChange={handleBoundsChange}
          />
          {mobileView === "map" && (
            <MobileMapControls
              searchValue={searchInput}
              onSearchChange={setSearchInput}
              filters={filters}
              onHappyHourNow={toggleHappyHourNow}
              onToggleOpenNow={toggleOpenNow}
              onToggleOpenLate={toggleOpenLate}
              geoStatus={geoStatus}
              nearMeActive={sort === "distance" && geoStatus === "granted"}
              onNearMe={requestNearMe}
              favCount={favCount}
              savedActive={savedActive}
              onToggleSaved={() => setShowSaved((v) => !v)}
              activeCount={activeFilterCount}
              onToggleHappyHour={toggleHappyHour}
              onToggleFilterValue={toggleFilterValue}
              onTogglePrice={togglePrice}
              onClear={clearFilters}
            />
          )}
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

      {/* Mobile bottom bar — map view: List View + Filter; list view: Map. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center gap-2 px-4 pb-safe lg:hidden">
        {mobileView === "map" ? (
          <>
            <button
              type="button"
              onClick={() => {
                setMobileView("list");
                setPeekId(null);
              }}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-zinc-800"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M3 5.5A.75.75 0 013.75 4.75h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 5.5zm0 4.5a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 10zm0 4.5a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z"
                  clipRule="evenodd"
                />
              </svg>
              List View
            </button>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 shadow-lg transition hover:border-zinc-300"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M2.5 5.5A1 1 0 013.5 5h13a1 1 0 010 2h-13a1 1 0 01-1-1.5zM5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm3 4a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Filter
              {activeFilterCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-xs font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setMobileView("map")}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-zinc-800"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                clipRule="evenodd"
              />
            </svg>
            Map
          </button>
        )}
      </div>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        resultCount={filteredVenues.length}
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

      <VenueDrawer venue={openVenueObj} onClose={closeVenue} />
    </div>
  );
}
