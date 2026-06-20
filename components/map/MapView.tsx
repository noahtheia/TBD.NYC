"use client";

import { useCallback, useMemo, useState, type RefObject } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/mapbox";
import Supercluster from "supercluster";
import type { Venue } from "@/types/venue";
import {
  INITIAL_VIEW_STATE,
  MAP_STYLE,
  MAPBOX_TOKEN,
  hasMapboxToken,
} from "@/lib/map-config";
import { cn } from "@/lib/cn";
import MapFallback from "./MapFallback";

type Props = {
  venues: Venue[];
  activeId: string | null;
  mapRef: RefObject<MapRef | null>;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

type PointProps = {
  venueId: string;
  name: string;
  category: "bar" | "restaurant";
  happyHour: boolean;
};

type Bounds = [number, number, number, number];

function buildIndex(venues: Venue[]): Supercluster<PointProps> {
  const index = new Supercluster<PointProps>({ radius: 60, maxZoom: 16 });
  const features = venues.flatMap((v) =>
    v.locations.map((loc) => ({
      type: "Feature" as const,
      properties: {
        venueId: v.id,
        name: v.name,
        category: v.category,
        happyHour: v.happyHour === true,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [loc.coordinates.lng, loc.coordinates.lat],
      },
    }))
  );
  index.load(features);
  return index;
}

export default function MapView({ venues, activeId, mapRef, onHover, onSelect }: Props) {
  const [view, setView] = useState<{ bounds: Bounds; zoom: number }>({
    bounds: [-74.05, 40.6, -73.85, 40.85],
    zoom: INITIAL_VIEW_STATE.zoom,
  });

  const index = useMemo(() => buildIndex(venues), [venues]);
  const clusters = useMemo(
    () => index.getClusters(view.bounds, Math.round(view.zoom)),
    [index, view]
  );

  const updateView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    if (!b) return;
    setView({
      bounds: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
      zoom: map.getZoom(),
    });
  }, [mapRef]);

  if (!hasMapboxToken) return <MapFallback />;

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={INITIAL_VIEW_STATE}
      mapStyle={MAP_STYLE}
      style={{ width: "100%", height: "100%" }}
      reuseMaps
      onLoad={updateView}
      onMoveEnd={updateView}
    >
      <NavigationControl position="top-right" showCompass={false} />

      {clusters.map((c) => {
        const [lng, lat] = c.geometry.coordinates;

        if ("cluster" in c.properties && c.properties.cluster) {
          const count = c.properties.point_count;
          const size = count < 10 ? 34 : count < 50 ? 42 : 52;
          return (
            <Marker
              key={`cluster-${c.id}`}
              longitude={lng}
              latitude={lat}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                const zoom = Math.min(
                  index.getClusterExpansionZoom(c.id as number),
                  18
                );
                mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 500 });
              }}
            >
              <div
                style={{ width: size, height: size }}
                className="flex items-center justify-center rounded-full border-2 border-white bg-rose-500/90 text-sm font-semibold text-white shadow-md transition hover:bg-rose-600"
              >
                {count}
              </div>
            </Marker>
          );
        }

        const { venueId, name, category, happyHour } = c.properties;
        const isActive = venueId === activeId;
        const color = category === "restaurant" ? "bg-emerald-500" : "bg-rose-500";
        const activeColor =
          category === "restaurant"
            ? "bg-emerald-600 ring-4 ring-emerald-300/50"
            : "bg-rose-600 ring-4 ring-rose-300/50";

        return (
          <Marker
            key={`pt-${venueId}-${lng.toFixed(5)}-${lat.toFixed(5)}`}
            longitude={lng}
            latitude={lat}
            anchor="bottom"
            style={{ zIndex: isActive ? 10 : 1 }}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelect(venueId);
            }}
          >
            <button
              type="button"
              aria-label={name}
              onMouseEnter={() => onHover(venueId)}
              onMouseLeave={() => onHover(null)}
              className="group/marker relative flex -translate-y-1 flex-col items-center"
            >
              {isActive && (
                <span className="absolute bottom-full mb-1 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white shadow-lg">
                  {name}
                </span>
              )}
              <span
                className={cn(
                  "block rounded-full border-2 border-white shadow-md transition-all",
                  isActive
                    ? `h-5 w-5 ${activeColor}`
                    : `h-3.5 w-3.5 group-hover/marker:h-4 group-hover/marker:w-4 ${color}`,
                  happyHour && !isActive && "ring-2 ring-amber-300"
                )}
              />
            </button>
          </Marker>
        );
      })}
    </Map>
  );
}
