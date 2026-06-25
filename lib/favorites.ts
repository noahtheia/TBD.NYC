// Client-side saved venues, persisted to localStorage. Exposed as an external
// store so components can subscribe via useSyncExternalStore (no hydration
// mismatch, no setState-in-effect).

const KEY = "tbd:favorites";
const EMPTY: string[] = [];

let ids = new Set<string>();
let snapshot: string[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    ids = new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    ids = new Set();
  }
  snapshot = [...ids];
  loaded = true;
}

function commit() {
  snapshot = [...ids];
  try {
    window.localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore quota / private-mode errors */
  }
  for (const l of listeners) l();
}

export function toggleFavorite(id: string) {
  load();
  if (ids.has(id)) ids.delete(id);
  else ids.add(id);
  commit();
}

export function subscribe(cb: () => void): () => void {
  load();
  listeners.add(cb);
  function onStorage(e: StorageEvent) {
    if (e.key === KEY) {
      loaded = false;
      load();
      for (const l of listeners) l();
    }
  }
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Stable snapshot reference (only changes on mutation) — required by useSyncExternalStore. */
export function getSnapshot(): string[] {
  load();
  return snapshot;
}

export function getServerSnapshot(): string[] {
  return EMPTY;
}
