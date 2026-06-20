"use client";

import type { Facets, Filters } from "@/types/venue";
import { cn } from "@/lib/cn";
import { RESERVATION_OPTIONS } from "@/lib/display";
import MultiSelect from "@/components/ui/MultiSelect";

type Props = {
  facets: Facets;
  filters: Filters;
  activeCount: number;
  onToggleHappyHour: () => void;
  onToggleFilterValue: (
    key: "neighborhoods" | "types" | "reservation",
    value: string
  ) => void;
  onClear: () => void;
};

export default function FilterBar({
  facets,
  filters,
  activeCount,
  onToggleHappyHour,
  onToggleFilterValue,
  onClear,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onToggleHappyHour}
        aria-pressed={filters.happyHourOnly}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
          filters.happyHourOnly
            ? "border-amber-500 bg-amber-400 text-amber-950"
            : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
        )}
      >
        <span aria-hidden>🍸</span> Happy hour
      </button>

      <MultiSelect
        label="Neighborhood"
        searchable
        options={facets.neighborhoods.map((n) => ({ value: n, label: n }))}
        selected={filters.neighborhoods}
        onToggle={(v) => onToggleFilterValue("neighborhoods", v)}
      />

      <MultiSelect
        label="Type"
        searchable
        options={facets.types.map((t) => ({ value: t, label: t }))}
        selected={filters.types}
        onToggle={(v) => onToggleFilterValue("types", v)}
      />

      <MultiSelect
        label="Reservations"
        options={RESERVATION_OPTIONS}
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
