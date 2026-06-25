"use client";

import type { Filters } from "@/types/venue";
import {
  CATEGORY_LABEL,
  RESERVATION_OPTIONS,
  priceLabel,
} from "@/lib/display";

const RESERVATION_LABELS = Object.fromEntries(
  RESERVATION_OPTIONS.map((o) => [o.value, o.label])
);

type Props = {
  filters: Filters;
  onToggleHappyHour: () => void;
  onToggleOpenNow: () => void;
  onToggleOpenLate: () => void;
  onToggleFilterValue: (
    key: "neighborhoods" | "types" | "cuisines" | "awards" | "reservation" | "categories",
    value: string
  ) => void;
  onTogglePrice: (value: number) => void;
  onClear: () => void;
};

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 py-1 pl-3 pr-1.5 text-sm text-zinc-700">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </span>
  );
}

export default function ActiveFilterChips({
  filters,
  onToggleHappyHour,
  onToggleOpenNow,
  onToggleOpenLate,
  onToggleFilterValue,
  onTogglePrice,
  onClear,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.openNow && <Chip label="Open now" onRemove={onToggleOpenNow} />}
      {filters.happyHourOnly && <Chip label="Happy hour" onRemove={onToggleHappyHour} />}
      {filters.openLate && <Chip label="Open late" onRemove={onToggleOpenLate} />}
      {filters.categories.map((c) => (
        <Chip key={`c-${c}`} label={CATEGORY_LABEL[c]} onRemove={() => onToggleFilterValue("categories", c)} />
      ))}
      {filters.neighborhoods.map((n) => (
        <Chip key={`h-${n}`} label={n} onRemove={() => onToggleFilterValue("neighborhoods", n)} />
      ))}
      {filters.cuisines.map((c) => (
        <Chip key={`cu-${c}`} label={c} onRemove={() => onToggleFilterValue("cuisines", c)} />
      ))}
      {filters.awards.map((a) => (
        <Chip key={`aw-${a}`} label={a} onRemove={() => onToggleFilterValue("awards", a)} />
      ))}
      {filters.types.map((t) => (
        <Chip key={`t-${t}`} label={t} onRemove={() => onToggleFilterValue("types", t)} />
      ))}
      {filters.prices.map((p) => (
        <Chip key={`p-${p}`} label={priceLabel(p)} onRemove={() => onTogglePrice(p)} />
      ))}
      {filters.reservation.map((r) => (
        <Chip
          key={`r-${r}`}
          label={RESERVATION_LABELS[r] ?? r}
          onRemove={() => onToggleFilterValue("reservation", r)}
        />
      ))}
      <button
        type="button"
        onClick={onClear}
        className="text-sm font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
