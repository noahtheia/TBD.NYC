// NEXT_PUBLIC_ vars are inlined at build time and safe to read on the client.
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

/** Whether a Mapbox token is configured. When false, the app renders a fallback. */
export const hasMapboxToken = MAPBOX_TOKEN.length > 0;

export const NYC_CENTER = { longitude: -73.985, latitude: 40.736 };

export const INITIAL_VIEW_STATE = {
  ...NYC_CENTER,
  zoom: 11.6,
};

export const MAP_STYLE = "mapbox://styles/mapbox/light-v11";

/** Zoom/animation used when focusing a single venue. */
export const FOCUS_ZOOM = 14.5;
