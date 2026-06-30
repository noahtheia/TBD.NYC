"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EMPTY_FILTERS, type Filters, type ReservationPolicy } from "@/types/venue";
import { buildQuery, parseFilters } from "@/lib/url-state";

type StringListKey =
  | "neighborhoods"
  | "types"
  | "cuisines"
  | "awards"
  | "reservation"
  | "categories";

/**
 * Owns the shareable explore state (filters + search + open venue), mirrored to
 * the URL. Local React state is the source of truth; the URL is a write-through
 * mirror initialized from the URL on mount.
 *
 * Search is split into the live `searchInput` (what's in the box) and the
 * committed `searchQuery` (what actually filters the map/list). Typing only
 * updates `searchInput`; the results change only when `commitSearch` runs
 * (Enter or picking a suggestion).
 */
export function useExploreState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>(() =>
    parseFilters(new URLSearchParams(searchParams.toString()))
  );
  const [searchInput, setSearchInput] = useState<string>(
    () => searchParams.get("q") ?? ""
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    () => searchParams.get("q") ?? ""
  );
  const [openId, setOpenId] = useState<string | null>(
    () => searchParams.get("venue")
  );

  // Commit the search: Enter passes no value (use the current input), a
  // suggestion pick passes its term explicitly (avoids reading not-yet-flushed
  // input state).
  const commitSearch = useCallback(
    (value?: string) => setSearchQuery(value ?? searchInput),
    [searchInput]
  );

  // Mirror state to the URL — replace (no history spam), no scroll jump. Keyed on
  // the COMMITTED query so the URL updates on commit, not on every keystroke.
  const mounted = useRef(false);
  useEffect(() => {
    const qs = buildQuery(filters, searchQuery, openId);
    // Skip the redundant replace on first render if nothing would change.
    if (!mounted.current) {
      mounted.current = true;
      if (qs === window.location.search) return;
    }
    router.replace(`${pathname}${qs}`, { scroll: false });
  }, [filters, searchQuery, openId, pathname, router]);

  const toggleHappyHour = useCallback(
    () => setFilters((f) => ({ ...f, happyHourOnly: !f.happyHourOnly })),
    []
  );
  // "Happy hour now": a plain on/off filter for venues whose happy-hour window
  // covers the current time. (No geolocation side effects — it sits in the pill
  // row alongside the other toggles.)
  const toggleHappyHourNow = useCallback(
    () => setFilters((f) => ({ ...f, happyHourNow: !f.happyHourNow })),
    []
  );
  const showHappyHourNow = useCallback(
    () => setFilters((f) => ({ ...f, happyHourNow: true })),
    []
  );
  const clearHappyHourNow = useCallback(
    () => setFilters((f) => ({ ...f, happyHourNow: false })),
    []
  );
  const toggleOpenNow = useCallback(
    () => setFilters((f) => ({ ...f, openNow: !f.openNow })),
    []
  );
  const toggleOpenLate = useCallback(
    () => setFilters((f) => ({ ...f, openLate: !f.openLate })),
    []
  );

  const toggleFilterValue = useCallback((key: StringListKey, value: string) => {
    setFilters((f) => {
      const current = f[key] as string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...f, [key]: next };
    });
  }, []);

  const togglePrice = useCallback((value: number) => {
    setFilters((f) => {
      const next = f.prices.includes(value as 1 | 2 | 3 | 4)
        ? f.prices.filter((p) => p !== value)
        : [...f.prices, value as 1 | 2 | 3 | 4];
      return { ...f, prices: next };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setSearchInput("");
    setSearchQuery("");
  }, []);

  const openVenue = useCallback((id: string) => setOpenId(id), []);
  const closeVenue = useCallback(() => setOpenId(null), []);

  return {
    filters,
    toggleHappyHour,
    toggleHappyHourNow,
    showHappyHourNow,
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
  } as const;
}

export type { ReservationPolicy };
