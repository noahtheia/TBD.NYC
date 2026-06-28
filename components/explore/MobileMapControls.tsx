"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Filters } from "@/types/venue";
import type { FilterBarProps } from "@/components/filters/FilterBar";
import SearchBar from "@/components/filters/SearchBar";
import ActiveFilterChips from "@/components/filters/ActiveFilterChips";

type Props = {
  // search
  searchValue: string;
  onSearchChange: (v: string) => void;
  // quick toggles
  filters: Filters;
  onHappyHourNow: () => void;
  onToggleOpenNow: () => void;
  onToggleOpenLate: () => void;
  // saved
  favCount: number;
  savedActive: boolean;
  onToggleSaved: () => void;
  // active chips (when filters are applied)
  activeCount: number;
  onToggleHappyHour: () => void;
  onToggleFilterValue: FilterBarProps["onToggleFilterValue"];
  onTogglePrice: (value: number) => void;
  onClear: () => void;
};

/** Floating controls layered over the full-screen mobile map: brand chip, search,
 *  a horizontally-scrollable row of quick filter pills, and the active filter
 *  chips. The full filter set opens from the bottom bar's "Filter" button (see
 *  ExploreView), so there is no Filters trigger here. Mobile only (`lg:hidden`). */
export default function MobileMapControls({
  searchValue,
  onSearchChange,
  filters,
  onHappyHourNow,
  onToggleOpenNow,
  onToggleOpenLate,
  favCount,
  savedActive,
  onToggleSaved,
  activeCount,
  onToggleHappyHour,
  onToggleFilterValue,
  onTogglePrice,
  onClear,
}: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 px-3 pt-safe lg:hidden">
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

      {/* Row 2: horizontally-scrollable quick filters. */}
      <div className="pointer-events-auto -mx-3 flex items-center gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={onHappyHourNow}
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-rose-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-md transition hover:bg-rose-700"
        >
          <span aria-hidden>🍸</span> Happy hour now
        </button>
        <QuickPill
          active={filters.openNow}
          activeClass="border-emerald-500 bg-emerald-500 text-white"
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
          active={filters.openLate}
          activeClass="border-indigo-500 bg-indigo-500 text-white"
          onClick={onToggleOpenLate}
        >
          <span aria-hidden>🌙</span> Open late
        </QuickPill>
        {favCount > 0 && (
          <QuickPill
            active={savedActive}
            activeClass="border-rose-500 bg-rose-50 text-rose-700"
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

function QuickPill({
  active,
  activeClass,
  onClick,
  children,
}: {
  active: boolean;
  activeClass: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium shadow-md backdrop-blur transition",
        active ? activeClass : "border-zinc-200 bg-white/90 text-zinc-700"
      )}
    >
      {children}
    </button>
  );
}
