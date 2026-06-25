"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EMPTY_FILTERS, type Filters, type ReservationPolicy } from "@/types/venue";
import { buildQuery, parseFilters } from "@/lib/url-state";
import { useDebouncedValue } from "./useDebouncedValue";

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
  const [openId, setOpenId] = useState<string | null>(
    () => searchParams.get("venue")
  );

  const debouncedSearch = useDebouncedValue(searchInput, 250);

  // Mirror state to the URL — replace (no history spam), no scroll jump.
  const mounted = useRef(false);
  useEffect(() => {
    const qs = buildQuery(filters, debouncedSearch, openId);
    // Skip the redundant replace on first render if nothing would change.
    if (!mounted.current) {
      mounted.current = true;
      if (qs === window.location.search) return;
    }
    router.replace(`${pathname}${qs}`, { scroll: false });
  }, [filters, debouncedSearch, openId, pathname, router]);

  const toggleHappyHour = useCallback(
    () => setFilters((f) => ({ ...f, happyHourOnly: !f.happyHourOnly })),
    []
  );
  // One-tap "happy hour now": force happy-hour + open-now on (not a toggle).
  const showHappyHourNow = useCallback(
    () => setFilters((f) => ({ ...f, happyHourOnly: true, openNow: true })),
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
  }, []);

  const openVenue = useCallback((id: string) => setOpenId(id), []);
  const closeVenue = useCallback(() => setOpenId(null), []);

  return {
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
  } as const;
}

export type { ReservationPolicy };
