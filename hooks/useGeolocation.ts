"use client";

import { useCallback, useState } from "react";
import type { LatLng } from "@/lib/geo";

type Status = "idle" | "loading" | "granted" | "denied" | "unavailable";

export function useGeolocation() {
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("granted");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  return { coords, status, request } as const;
}
