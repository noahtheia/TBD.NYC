"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import type { Facets, Venue } from "@/types/venue";
import { useExploreState } from "@/hooks/useExploreState";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { countActiveFilters, filterVenues } from "@/lib/filtering";
import { sortVenues, type SortKey } from "@/lib/sort";
import { suggestPairingSets } from "@/lib/pairing";
import { nycNow, type NowParts } from "@/lib/hours";
import { boundsForRadiusMiles, type LatLng } from "@/lib/geo";
import { FOCUS_ZOOM } from "@/lib/map-config";
import { motionDuration } from "@/lib/prefers-reduced-motion";
import { cn } from "@/lib/cn";
import meta from "@/data/meta.json";
import Wordmark from "@/components/site/Wordmark";
import SearchBar, { type SearchSuggestion } from "@/components/filters/SearchBar";
import FilterControls from "@/components/filters/FilterControls";
import FilterSheet from "@/components/filters/FilterSheet";
import SortControl from "@/components/filters/SortControl";
import ActiveFilterChips from "@/components/filters/ActiveFilterChips";
import VenueList, { type ActiveState } from "@/components/list/VenueList";
import VenueDrawer from "@/components/detail/VenueDrawer";
import PeekCard from "@/components/ui/PeekCard";
import MobileMapControls from "@/components/explore/MobileMapControls";

type Bounds = [number, number, number, number];

const DATA_UPDATED = new Date(meta.generatedAt).toLocaleDateString("en-US", {
  month: "long",
  year: "numeric",
});

/** Venues with at least one location inside `bounds` (all venues when null). */
function venuesWithinBounds(venues: Venue[], bounds: Bounds | null): Venue[] {
  if (!bounds) return venues;
  const [w, s, e, n] = bounds;
  return venues.filter((v) =>
    v.locations.some(
      (l) =>
        l.coordinates.lng >= w &&
        l.coordinates.lng <= e &&
        l.coordinates.lat >= s &&
        l.coordinates.lat <= n
    )
  );
}

/** Whether the viewport has moved enough from the searched area to be worth a
 *  re-search — ignores tiny inertial settles so the button doesn't flicker. */
function boundsDifferEnough(next: Bounds, searched: Bounds): boolean {
  const [aw, as, ae, an] = next;
  const [bw, bs, be, bn] = searched;
  const spanX = Math.abs(ae - aw) || 1e-9;
  const spanY = Math.abs(an - as) || 1e-9;
  const movedX = Math.abs((aw + ae) / 2 - (bw + be) / 2) / spanX;
  const movedY = Math.abs((as + an) / 2 - (bs + bn) / 2) / spanY;
  if (movedX > 0.12 || movedY > 0.12) return true;
  const areaA = Math.abs((ae - aw) * (an - as)) || 1e-12;
  const areaB = Math.abs((be - bw) * (bn - bs)) || 1e-12;
  const ratio = areaA / areaB;
  return ratio < 0.66 || ratio > 1.5;
}

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
    toggleHappyHourNow,
    clearHappyHourNow,
    toggleOpenNow,
    toggleOpenLate,
    toggleFilterValue,
    togglePrice,
    clearFilters,
    searchInput,
    setSearchInput,
    searchQuery,
    commitSearch,
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
  // The shared filter bottom sheet (mobile), opened from the header pill in list
  // view or the bottom bar's "Filter" button in map view.
  const [filterOpen, setFilterOpen] = useState(false);
  // The committed "searched" viewport [w, s, e, n] — the list and dots reflect
  // THIS area, not wherever the user has since panned. A ref mirror lets the move
  // handler compare without re-creating the callback on every commit.
  const [searchedBounds, setSearchedBounds] = useState<Bounds | null>(null);
  const searchedBoundsRef = useRef<Bounds | null>(null);
  // The latest viewport, updated on every move — committed when "Search Here" runs.
  const [liveBounds, setLiveBounds] = useState<Bounds | null>(null);
  // True once the user pans/zooms away from `searchedBounds` → shows "Search Here".
  const [viewportDirty, setViewportDirty] = useState(false);
  // Set right before a programmatic camera move (filter refit / near-me zoom) that
  // should re-seat the searched area on the next moveend.
  const commitBoundsOnNextMove = useRef(false);
  const mapRef = useRef<MapRef | null>(null);
  const listScrollRef = useRef<HTMLElement | null>(null);

  const isDesktop = useMediaQuery("(min-width: 1024px)");

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
    () => filterVenues(venues, filters, searchQuery, now),
    [venues, filters, searchQuery, now]
  );

  const sortedVenues = useMemo(
    () => sortVenues(filteredVenues, sort, userLoc),
    [filteredVenues, sort, userLoc]
  );

  // The list and the map dots both reflect the committed searched area — moving
  // the map changes neither until the user clicks "Search Here".
  const displayedVenues = useMemo(
    () => venuesWithinBounds(sortedVenues, searchedBounds),
    [sortedVenues, searchedBounds]
  );
  const mapVenues = useMemo(
    () => venuesWithinBounds(filteredVenues, searchedBounds),
    [filteredVenues, searchedBounds]
  );
  const visibleCount = displayedVenues.length;

  // Search suggestions: matching venue names first, then matching neighborhoods.
  // Derived during render so typing never touches the committed query/results.
  const suggestions = useMemo<SearchSuggestion[]>(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return [];
    const out: SearchSuggestion[] = [];
    const seenName = new Set<string>();
    for (const v of venues) {
      if (out.length >= 8) break;
      if (!seenName.has(v.name) && v.name.toLowerCase().includes(q)) {
        seenName.add(v.name);
        out.push({ type: "venue", label: v.name, value: v.name });
      }
    }
    const seenHood = new Set<string>();
    for (const v of venues) {
      if (out.length >= 8) break;
      const n = v.neighborhood;
      if (n && !seenHood.has(n) && n.toLowerCase().includes(q)) {
        seenHood.add(n);
        out.push({ type: "neighborhood", label: n, value: n });
      }
    }
    return out.slice(0, 8);
  }, [venues, searchInput]);

  const commitSearchedBounds = useCallback((b: Bounds) => {
    searchedBoundsRef.current = b;
    setSearchedBounds(b);
    setViewportDirty(false);
  }, []);

  const handleBoundsChange = useCallback(
    (b: Bounds, isUserGesture: boolean) => {
      setLiveBounds(b);
      // Seed the searched area on the first report (map load).
      if (searchedBoundsRef.current === null) {
        commitSearchedBounds(b);
        return;
      }
      // A programmatic refit/zoom asked us to re-seat the searched area.
      if (commitBoundsOnNextMove.current) {
        commitBoundsOnNextMove.current = false;
        commitSearchedBounds(b);
        return;
      }
      // A genuine user pan/zoom away from the searched area → offer "Search Here".
      if (isUserGesture && boundsDifferEnough(b, searchedBoundsRef.current)) {
        setViewportDirty(true);
      }
    },
    [commitSearchedBounds]
  );

  const searchHere = useCallback(() => {
    if (liveBounds) commitSearchedBounds(liveBounds);
  }, [liveBounds, commitSearchedBounds]);

  const activeFilterCount = countActiveFilters(filters);
  // "Near me" is on once distance sort is active with a granted location fix. While
  // it's on we keep the map on the user's 1-mile radius and don't refit on other filters.
  const nearMeActive = sort === "distance" && geoStatus === "granted";
  const openVenueObj = openId ? venuesById.get(openId) ?? null : null;
  const peekVenue = peekId ? venuesById.get(peekId) ?? null : null;

  // Pairing suggestions for the open venue (bar → dinner after, restaurant →
  // drink before). Computed over the full catalog, not the filtered results:
  // active filters describe the current search, not what's near your pick.
  const pairings = useMemo(
    () => (openVenueObj ? suggestPairingSets(openVenueObj, venues) : null),
    [openVenueObj, venues]
  );

  // The venue to focus when the map first loads (deep-linked ?venue=). Captured
  // once at mount so later state changes don't refly the map.
  const [focusOnLoad] = useState(
    () => openVenueObj?.locations[0]?.coordinates ?? null
  );

  // Fit the map to the results whenever the filter/search set changes (not on
  // hover, the per-minute clock tick, or sort).
  const filterSig = JSON.stringify({ ...filters, q: searchQuery });
  const prevSig = useRef(filterSig);
  useEffect(() => {
    if (filterSig === prevSig.current) return;
    prevSig.current = filterSig;
    // With Near me active, keep the user's 1-mile radius (or wherever they've panned)
    // — toggling other filters shouldn't yank the map to the full results bounds.
    if (nearMeActive) return;
    const hasFilters = activeFilterCount > 0 || searchQuery.trim().length > 0;
    const locs = filteredVenues.flatMap((v) => v.locations);
    if (!hasFilters || !locs.length) return;
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    for (const l of locs) {
      minLng = Math.min(minLng, l.coordinates.lng);
      maxLng = Math.max(maxLng, l.coordinates.lng);
      minLat = Math.min(minLat, l.coordinates.lat);
      maxLat = Math.max(maxLat, l.coordinates.lat);
    }
    // A filter/search is a fresh search — re-seat the searched area to the fitted
    // viewport on the resulting (programmatic) moveend, so the list/dots follow.
    commitBoundsOnNextMove.current = true;
    mapRef.current?.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 60, maxZoom: 15, duration: motionDuration(600) }
    );
  }, [filterSig, filteredVenues, activeFilterCount, searchQuery, nearMeActive]);

  // Zoom the map to a ~`miles` radius around a point (reuses the fitBounds
  // pattern from the filter-fit effect below).
  const zoomToUserRadius = useCallback(
    (center: LatLng, miles: number) => {
      const [w, s, e, n] = boundsForRadiusMiles(center, miles);
      // Near me is a fresh search — re-seat the searched area to the zoomed view.
      commitBoundsOnNextMove.current = true;
      mapRef.current?.fitBounds(
        [
          [w, s],
          [e, n],
        ],
        { padding: 40, duration: motionDuration(800) }
      );
    },
    []
  );

  // "Near me" intent: request location, then switch to distance sort once coords
  // actually arrive (so the sort doesn't silently change before/without a fix).
  // `pendingZoom` additionally zooms to the user's 1-mile radius — set only by the
  // dedicated Near me buttons.
  const pendingDistanceSort = useRef(false);
  const pendingZoom = useRef(false);

  // The Near me button: distance sort + zoom to the user's 1-mile radius.
  const nearMe = useCallback(() => {
    if (geoStatus === "granted") {
      setSort("distance");
      if (userLoc) zoomToUserRadius(userLoc, 1);
      return;
    }
    pendingDistanceSort.current = true;
    pendingZoom.current = true;
    locate();
  }, [geoStatus, userLoc, locate, zoomToUserRadius]);

  useEffect(() => {
    if (geoStatus !== "granted") return;
    if (pendingDistanceSort.current) {
      pendingDistanceSort.current = false;
      setSort("distance");
    }
    if (pendingZoom.current) {
      pendingZoom.current = false;
      if (userLoc) zoomToUserRadius(userLoc, 1);
    }
  }, [geoStatus, userLoc, zoomToUserRadius]);

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

  // Shared mobile top controls — the same tiles render over the map (floating) and
  // at the top of the list (inline sticky); only `variant` differs per call site.
  const mobileControlsProps = {
    searchValue: searchInput,
    onSearchChange: setSearchInput,
    searchSuggestions: suggestions,
    onSearchSubmit: (v: string) => commitSearch(v),
    onSelectSearchSuggestion: (item: SearchSuggestion) => {
      setSearchInput(item.value);
      commitSearch(item.value);
    },
    filters,
    onHappyHourNow: toggleHappyHourNow,
    onToggleOpenNow: toggleOpenNow,
    onToggleOpenLate: toggleOpenLate,
    geoStatus,
    nearMeActive,
    onNearMe: nearMe,
    sort,
    onSort: setSort,
    activeCount: activeFilterCount,
    onToggleHappyHour: toggleHappyHour,
    onToggleHappyHourNow: clearHappyHourNow,
    onToggleFilterValue: toggleFilterValue,
    onTogglePrice: togglePrice,
    onClear: clearFilters,
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-newsprint">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to results
      </a>
      {/* Header — desktop only. On mobile the shared MobileMapControls tiles take
          over the top of both the map and the list views. */}
      <header className="z-20 hidden shrink-0 border-b border-zinc-200 bg-newsprint lg:block">
        <div className="flex flex-col gap-3 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-2">
              <Link
                href="/"
                aria-label="TBD.NYC — home"
                className="transition hover:opacity-70"
              >
                <Wordmark className="text-xl" />
              </Link>
              <span className="hidden font-mono text-xs uppercase tracking-[0.2em] text-stone sm:inline">
                Eat · Drink · Decide
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-44 sm:w-72 md:w-96">
                <SearchBar
                  value={searchInput}
                  onChange={setSearchInput}
                  onSubmit={(v) => commitSearch(v)}
                  suggestions={suggestions}
                  onSelectSuggestion={(item) => {
                    setSearchInput(item.value);
                    commitSearch(item.value);
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FilterControls
              facets={facets}
              filters={filters}
              activeCount={activeFilterCount}
              onOpenFilters={() => setFilterOpen(true)}
              onToggleHappyHour={toggleHappyHour}
              onToggleHappyHourNow={toggleHappyHourNow}
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
                <span aria-hidden>🎲</span> Surprise Me
              </button>
              <SortControl
                sort={sort}
                onSort={setSort}
                geoStatus={geoStatus}
                onLocate={nearMe}
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
              onToggleHappyHourNow={clearHappyHourNow}
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
          {mobileView === "list" && (
            <MobileMapControls {...mobileControlsProps} variant="inline" />
          )}
          <VenueList
            key={`${filterSig}|${sort}`}
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
          {viewportDirty && (
            <div className="pointer-events-none absolute inset-x-0 bottom-24 z-30 flex justify-center px-4 lg:bottom-auto lg:top-3">
              <button
                type="button"
                onClick={searchHere}
                className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-lg transition hover:border-zinc-300 hover:shadow-xl"
              >
                <svg className="h-4 w-4 text-blaze" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 103.39 9.84l3.38 3.38a.75.75 0 101.06-1.06l-3.38-3.38A5.5 5.5 0 009 3.5zM5 9a4 4 0 118 0 4 4 0 01-8 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Search Here
              </button>
            </div>
          )}
          {mobileView === "map" && (
            <MobileMapControls {...mobileControlsProps} variant="floating" />
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

      {/* Mobile bottom bar — view toggle (List View / Map) + Filter, both views. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center gap-2 px-4 pb-safe lg:hidden">
        {mobileView === "map" ? (
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
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blaze px-1.5 text-xs font-semibold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        resultCount={filteredVenues.length}
        facets={facets}
        filters={filters}
        activeCount={activeFilterCount}
        onToggleHappyHour={toggleHappyHour}
        onToggleHappyHourNow={toggleHappyHourNow}
        onToggleOpenNow={toggleOpenNow}
        onToggleOpenLate={toggleOpenLate}
        onToggleFilterValue={toggleFilterValue}
        onTogglePrice={togglePrice}
        onClear={clearFilters}
      />

      <VenueDrawer
        venue={openVenueObj}
        onClose={closeVenue}
        pairings={pairings}
        onSelectVenue={handleSelect}
        now={now}
      />
    </div>
  );
}
