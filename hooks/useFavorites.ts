"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  toggleFavorite,
} from "@/lib/favorites";

/** Subscribe to the saved-venues store. `ids` is the saved list, `set` a fast
 *  lookup, `toggle` flips one venue, `count` is the size. */
export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const set = useMemo(() => new Set(ids), [ids]);
  const toggle = useCallback((id: string) => toggleFavorite(id), []);
  return { ids, set, toggle, count: ids.length };
}
