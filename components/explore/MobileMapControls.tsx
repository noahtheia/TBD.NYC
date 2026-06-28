"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Filters } from "@/types/venue";
import type { SortKey } from "@/lib/sort";
import type { FilterBarProps } from "@/components/filters/FilterBar";
import SearchBar from "@/components/filters/SearchBar";
import SortControl from "@/components/filters/SortControl";
import ActiveFilterChips from "@/components/filters/ActiveFilterChips";

type GeoStatus = "idle" | "loading" | "granted" | "denied" | "unavailable";

type Props = {
  /** `floating` overlays the full-screen map; `inline` is a sticky header in the list. */
  variant?: "floating" | "inline";
  // search
  searchValue: string;
  onSearchChange: (v: string) => void;
  // quick toggles
  filters: Filters;
  /** Toggle "happy hour now": turns it on, or (when already on) clears happy hour. */
  onHappyHourNow: () => void;
  onToggleOpenNow: () => void;
  onToggleOpenLate: () => void;
  // near me (distance sort via geolocation)
  geoStatus: GeoStatus;
  nearMeActive: boolean;
  onNearMe: () => void;
  // sort
  sort: SortKey;
  onSort: (s: SortKey) => void;
  // saved
  favCount: number;
  savedActive: boolean;
  onToggleSaved: () => void;
  // active chips (when filters are applied)
  activeCount: number;
  onToggleHappyHour: () => void;
  onToggleHappyHourNow: () => void;
  onToggleFilterValue: FilterBarProps["onToggleFilterValue"];
  onTogglePrice: (value: number) => void;
  onClear: () => void;
};

/** Shared mobile top controls: brand chip, search, a horizontally-scrollable row of
 *  quick filter pills (with a pinned Sort dropdown), and the active filter chips.
 *  `floating` overlays the full-screen map; `inline` is a sticky header at the top of
 *  the list. The full filter set opens from the bottom bar's "Filter" button (see
 *  ExploreView), so there is no Filters trigger here. Mobile only (`lg:hidden`). */
export default function MobileMapControls({
  variant = "floating",
  searchValue,
  onSearchChange,
  filters,
  onHappyHourNow,
  onToggleOpenNow,
  onToggleOpenLate,
  geoStatus,
  nearMeActive,
  onNearMe,
  sort,
  onSort,
  favCount,
  savedActive,
  onToggleSaved,
  activeCount,
  onToggleHappyHour,
  onToggleHappyHourNow,
  onToggleFilterValue,
  onTogglePrice,
  onClear,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 pt-safe lg:hidden",
        variant === "inline"
          ? "sticky top-0 z-30 border-b border-zinc-200 bg-white px-3 pb-2"
          : "pointer-events-none absolute inset-x-0 top-0 z-20 px-3"
      )}
    >
      {/* Row 1: brand chip + search. Keep clear of the top-right zoom control. */}
      <div className="pointer-events-auto flex items-center gap-2">
        <Link
          href="/"
          aria-label="TBD.NYC — home"
          className="shrink-0 rounded-full border border-zinc-200 bg-white/90 px-3 py-2 text-sm font-extrabold tracking-tight text-zinc-900 shadow-md backdrop-blur"
        >
          TBD<span className="text-rose-600">.NYC</span>
        </Link>
        <div className="min-w-0 flex-1 pr-12 sm:pr-0">
          <div className="rounded-full shadow-md">
            <SearchBar value={searchValue} onChange={onSearchChange} />
          </div>
        </div>
      </div>

      {/* Row 2: the scrollable quick filters, with the Sort dropdown as the first
          item so it scrolls together with the pills. SortControl's `floatMenu`
          renders its dropdown with fixed positioning so `overflow-x-auto` can't
          clip it. */}
      <div className="pointer-events-auto flex min-w-0 items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="shrink-0 drop-shadow-md">
          <SortControl
            sort={sort}
            onSort={onSort}
            geoStatus={geoStatus}
            onLocate={onNearMe}
            hideNearMe
            align="left"
            floatMenu
          />
        </div>
        <button
          type="button"
          onClick={onHappyHourNow}
          aria-pressed={filters.happyHourNow}
          className={cn(
            QUICK_PILL_BASE,
            filters.happyHourNow ? QUICK_PILL_ACTIVE : QUICK_PILL_INACTIVE
          )}
        >
          <span aria-hidden>{filters.happyHourNow ? "✓" : "🍸"}</span> Happy hour now
        </button>
        <QuickPill
          active={filters.openNow}
          activeClass={QUICK_PILL_ACTIVE}
          onClick={onToggleOpenNow}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              filters.openNow ? "bg-white" : "bg-emerald-500"
            )}
          />
          Open now
        </QuickPill>
        <QuickPill
          active={nearMeActive}
          activeClass={QUICK_PILL_ACTIVE}
          onClick={onNearMe}
          disabled={geoStatus === "loading" || geoStatus === "unavailable"}
        >
          <span aria-hidden>📍</span>
          {geoStatus === "loading"
            ? "Locating…"
            : geoStatus === "denied"
              ? "Location blocked"
              : "Near me"}
        </QuickPill>
        {favCount > 0 && (
          <QuickPill
            active={savedActive}
            activeClass={QUICK_PILL_ACTIVE}
            onClick={onToggleSaved}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
              <path d="M12 20.5S3.5 15.6 3.5 9.6A4.1 4.1 0 0 1 12 7a4.1 4.1 0 0 1 8.5 2.6c0 6-8.5 10.9-8.5 10.9z" />
            </svg>
            Saved {favCount}
          </QuickPill>
        )}
      </div>

      {/* Row 3: active filter chips (dismissible). */}
      {activeCount > 0 && (
        <div className="pointer-events-auto -mx-3 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="w-max">
            <ActiveFilterChips
              filters={filters}
              onToggleHappyHour={onToggleHappyHour}
              onToggleHappyHourNow={onToggleHappyHourNow}
              onToggleOpenNow={onToggleOpenNow}
              onToggleOpenLate={onToggleOpenLate}
              onToggleFilterValue={onToggleFilterValue}
              onTogglePrice={onTogglePrice}
              onClear={onClear}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Shared quick-pill styling: grey when unselected, solid red when selected. */
const QUICK_PILL_BASE =
  "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium shadow-md backdrop-blur transition disabled:opacity-50";
const QUICK_PILL_INACTIVE = "border-zinc-300 bg-zinc-100/95 text-zinc-700";
const QUICK_PILL_ACTIVE = "border-rose-600 bg-rose-600 text-white";

function QuickPill({
  active,
  activeClass,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  activeClass: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(QUICK_PILL_BASE, active ? activeClass : QUICK_PILL_INACTIVE)}
    >
      {children}
    </button>
  );
}
