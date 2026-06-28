"use client";

import type { Facets, Filters } from "@/types/venue";
import { cn } from "@/lib/cn";
import {
  CATEGORY_OPTIONS,
  PRICE_OPTIONS,
  RESERVATION_OPTIONS,
} from "@/lib/display";
import MultiSelect from "@/components/ui/MultiSelect";

export type FilterBarProps = {
  facets: Facets;
  filters: Filters;
  activeCount: number;
  onToggleHappyHour: () => void;
  onToggleOpenNow: () => void;
  onToggleOpenLate: () => void;
  onToggleFilterValue: (
    key: "neighborhoods" | "types" | "cuisines" | "awards" | "reservation" | "categories",
    value: string
  ) => void;
  onTogglePrice: (value: number) => void;
  onClear: () => void;
  /** Stack controls vertically (for the mobile filter sheet). */
  stack?: boolean;
  /** Hide the open-now / happy-hour / open-late quick pills (they live at the
   *  top of the mobile map, so the mobile filter sheet shouldn't repeat them). */
  hideQuickFilters?: boolean;
  /** Render each dropdown with fixed positioning that flips above the trigger when
   *  needed — for the mobile filter sheet, where lower filters would otherwise open
   *  below the fold. See `MultiSelect`'s `floatMenu`. */
  floatMenu?: boolean;
};

function TogglePill({
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
        "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
        active
          ? activeClass
          : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
      )}
    >
      {children}
    </button>
  );
}

export default function FilterBar({
  facets,
  filters,
  activeCount,
  onToggleHappyHour,
  onToggleOpenNow,
  onToggleOpenLate,
  onToggleFilterValue,
  onTogglePrice,
  onClear,
  stack = false,
  hideQuickFilters = false,
  floatMenu = false,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "gap-2",
        stack ? "flex flex-col items-stretch" : "flex flex-wrap items-center"
      )}
    >
      {!hideQuickFilters && (
        <>
          <TogglePill
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
          </TogglePill>

          <TogglePill
            active={filters.happyHourOnly}
            activeClass="border-amber-500 bg-amber-400 text-amber-950"
            onClick={onToggleHappyHour}
          >
            <span aria-hidden>🍸</span> Happy hour
          </TogglePill>

          <TogglePill
            active={filters.openLate}
            activeClass="border-indigo-500 bg-indigo-500 text-white"
            onClick={onToggleOpenLate}
          >
            <span aria-hidden>🌙</span> Open late
          </TogglePill>
        </>
      )}

      <MultiSelect
        label="Category"
        floatMenu={floatMenu}
        options={CATEGORY_OPTIONS.map((o) => ({
          ...o,
          count: facets.counts.category[o.value],
        }))}
        selected={filters.categories}
        onToggle={(v) => onToggleFilterValue("categories", v)}
      />

      <MultiSelect
        label="Neighborhood"
        searchable
        floatMenu={floatMenu}
        options={facets.neighborhoods.map((n) => ({
          value: n,
          label: n,
          count: facets.counts.neighborhoods[n],
        }))}
        selected={filters.neighborhoods}
        onToggle={(v) => onToggleFilterValue("neighborhoods", v)}
      />

      <MultiSelect
        label="Cuisine"
        searchable
        floatMenu={floatMenu}
        options={facets.cuisines.map((c) => ({
          value: c,
          label: c,
          count: facets.counts.cuisines[c],
        }))}
        selected={filters.cuisines}
        onToggle={(v) => onToggleFilterValue("cuisines", v)}
      />

      <MultiSelect
        label="Type"
        searchable
        floatMenu={floatMenu}
        options={facets.types.map((t) => ({
          value: t,
          label: t,
          count: facets.counts.types[t],
        }))}
        selected={filters.types}
        onToggle={(v) => onToggleFilterValue("types", v)}
      />

      {facets.awards.length > 0 && (
        <MultiSelect
          label="Awards"
          searchable
          floatMenu={floatMenu}
          options={facets.awards.map((a) => ({
            value: a,
            label: a,
            count: facets.counts.awards[a],
          }))}
          selected={filters.awards}
          onToggle={(v) => onToggleFilterValue("awards", v)}
        />
      )}

      <MultiSelect
        label="Price"
        floatMenu={floatMenu}
        options={PRICE_OPTIONS.map((o) => ({
          value: String(o.value),
          label: o.label,
          count: facets.counts.price[o.value],
        }))}
        selected={filters.prices.map(String)}
        onToggle={(v) => onTogglePrice(Number(v))}
      />

      <MultiSelect
        label="Reservations"
        floatMenu={floatMenu}
        options={RESERVATION_OPTIONS.map((o) => ({
          ...o,
          count: facets.counts.reservation[o.value],
        }))}
        selected={filters.reservation}
        onToggle={(v) => onToggleFilterValue("reservation", v)}
      />

      {activeCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-full px-2.5 py-1.5 text-sm font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
