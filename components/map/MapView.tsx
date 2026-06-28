"use client";

import { useCallback, useMemo, useState, type RefObject } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Venue } from "@/types/venue";
import {
  INITIAL_VIEW_STATE,
  MAP_STYLE,
  MAPBOX_TOKEN,
  hasMapboxToken,
} from "@/lib/map-config";
import { cn } from "@/lib/cn";
import { FOCUS_ZOOM } from "@/lib/map-config";
import type { LatLng } from "@/lib/geo";
import MapFallback from "./MapFallback";

type Props = {
  venues: Venue[];
  activeId: string | null;
  /** The specific active pin (`${venueId}#${locIndex}`), set by map interaction.
   *  When set, only that pin highlights — not every pin of a multi-location venue. */
  activePointId?: string | null;
  mapRef: RefObject<MapRef | null>;
  onHover: (id: string | null, pointId?: string | null) => void;
  onSelect: (id: string, point: { pointId: string; lng: number; lat: number }) => void;
  focusOnLoad?: LatLng | null;
  userLoc?: LatLng | null;
  /** Show the zoom +/- control. Off on mobile (touch users pinch to zoom). */
  showZoomControls?: boolean;
  /** Notified with [west, south, east, north] whenever the viewport changes. */
  onBoundsChange?: (bounds: [number, number, number, number]) => void;
};

type Point = {
  venueId: string;
  /** Stable per-pin id: `${venueId}#${locIndex}`. */
  pointId: string;
  /** The venue has more than one location. */
  multi: boolean;
  name: string;
  category: "bar" | "restaurant";
  happyHour: boolean;
  lng: number;
  lat: number;
};

type Bounds = [number, number, number, number];

export default function MapView({
  venues,
  activeId,
  activePointId,
  mapRef,
  onHover,
  onSelect,
  focusOnLoad,
  userLoc,
  showZoomControls = true,
  onBoundsChange,
}: Props) {
  // One dot per venue location (no clustering).
  const points = useMemo<Point[]>(
    () =>
      venues.flatMap((v) =>
        v.locations.map((loc, idx) => ({
          venueId: v.id,
          pointId: `${v.id}#${idx}`,
          multi: v.locations.length > 1,
          name: v.name,
          category: v.category,
          happyHour: v.happyHour === true,
          lng: loc.coordinates.lng,
          lat: loc.coordinates.lat,
        }))
      ),
    [venues]
  );

  const [bounds, setBounds] = useState<Bounds>([-74.05, 40.6, -73.85, 40.85]);
  const [legendOpen, setLegendOpen] = useState(true);

  // Only render markers within (a padded) viewport — keeps the DOM light when
  // zoomed in — but always keep the active pin so fly-to + highlight work.
  const visible = useMemo(() => {
    const [w, s, e, n] = bounds;
    const padX = (e - w) * 0.15;
    const padY = (n - s) * 0.15;
    const inView = (p: Point) =>
      p.lng >= w - padX && p.lng <= e + padX && p.lat >= s - padY && p.lat <= n + padY;
    const list = points.filter(inView);
    const isActivePoint = (p: Point) =>
      activePointId ? p.pointId === activePointId : p.venueId === activeId;
    if ((activePointId || activeId) && !list.some(isActivePoint)) {
      const active = points.find(isActivePoint);
      if (active) list.push(active);
    }
    return list;
  }, [points, bounds, activeId, activePointId]);

  const updateBounds = useCallback(() => {
    const b = mapRef.current?.getBounds();
    if (!b) return;
    const next: Bounds = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
    setBounds(next);
    onBoundsChange?.(next);
  }, [mapRef, onBoundsChange]);

  const handleLoad = useCallback(() => {
    updateBounds();
    if (focusOnLoad) {
      mapRef.current?.flyTo({
        center: [focusOnLoad.lng, focusOnLoad.lat],
        zoom: FOCUS_ZOOM,
        duration: 0,
      });
    }
  }, [updateBounds, focusOnLoad, mapRef]);

  if (!hasMapboxToken) return <MapFallback />;

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={INITIAL_VIEW_STATE}
      mapStyle={MAP_STYLE}
      style={{ width: "100%", height: "100%" }}
      reuseMaps
      onLoad={handleLoad}
      onMoveEnd={updateBounds}
    >
      {showZoomControls && (
        <NavigationControl position="top-right" showCompass={false} />
      )}

      {legendOpen && (
        <div className="absolute left-2 top-2 z-10 flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white/90 px-3 py-1.5 text-xs text-zinc-600 shadow-md backdrop-blur">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" aria-hidden />
            Venue
          </span>
          <button
            type="button"
            onClick={() => setLegendOpen(false)}
            aria-label="Hide legend"
            className="ml-0.5 text-zinc-400 transition hover:text-zinc-700"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      )}

      {userLoc && (
        <Marker longitude={userLoc.lng} latitude={userLoc.lat} anchor="center">
          <span className="block h-4 w-4 rounded-full border-2 border-white bg-sky-500 shadow-md ring-4 ring-sky-300/40" />
        </Marker>
      )}

      {visible.map((p) => {
        // When a specific pin is active (map interaction), only that pin lights up;
        // otherwise fall back to highlighting the whole venue (e.g. list hover).
        const isActive = activePointId ? p.pointId === activePointId : p.venueId === activeId;
        // Label only the specifically-interacted pin, or a single-location venue's
        // sole pin — never every pin of a multi-location venue at once.
        const showLabel = isActive && (p.pointId === activePointId || !p.multi);

        return (
          <Marker
            key={`pt-${p.pointId}`}
            longitude={p.lng}
            latitude={p.lat}
            anchor="bottom"
            style={{ zIndex: isActive ? 10 : 1 }}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelect(p.venueId, { pointId: p.pointId, lng: p.lng, lat: p.lat });
            }}
          >
            <button
              type="button"
              aria-label={p.name}
              onMouseEnter={() => onHover(p.venueId, p.pointId)}
              onMouseLeave={() => onHover(null)}
              className="group/marker relative flex -translate-y-1 flex-col items-center"
            >
              {showLabel && (
                <span className="absolute bottom-full mb-1 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white shadow-lg">
                  {p.name}
                </span>
              )}
              <span
                className={cn(
                  "block rounded-full border-2 border-white shadow-md transition-all motion-reduce:transition-none",
                  // Every dot is red; only size/shade changes when active.
                  isActive
                    ? "h-5 w-5 bg-rose-600 ring-4 ring-rose-300/50"
                    : "h-3.5 w-3.5 bg-rose-500 group-hover/marker:h-4 group-hover/marker:w-4"
                )}
              />
            </button>
          </Marker>
        );
      })}
    </Map>
  );
}
