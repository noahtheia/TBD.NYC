"use client";

import { type RefObject } from "react";
import Map, { NavigationControl, type MapRef } from "react-map-gl/mapbox";
import type { Venue } from "@/types/venue";
import {
  INITIAL_VIEW_STATE,
  MAP_STYLE,
  MAPBOX_TOKEN,
  hasMapboxToken,
} from "@/lib/map-config";
import VenueMarker from "./VenueMarker";
import MapFallback from "./MapFallback";

type Props = {
  venues: Venue[];
  activeId: string | null;
  mapRef: RefObject<MapRef | null>;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

export default function MapView({
  venues,
  activeId,
  mapRef,
  onHover,
  onSelect,
}: Props) {
  if (!hasMapboxToken) return <MapFallback />;

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={INITIAL_VIEW_STATE}
      mapStyle={MAP_STYLE}
      style={{ width: "100%", height: "100%" }}
      reuseMaps
      onClick={() => onHover(null)}
    >
      <NavigationControl position="top-right" showCompass={false} />
      {venues.map((v) => (
        <VenueMarker
          key={v.id}
          venue={v}
          isActive={v.id === activeId}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </Map>
  );
}
