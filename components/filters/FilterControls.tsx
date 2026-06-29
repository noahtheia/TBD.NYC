"use client";

import FilterBar, { type FilterBarProps } from "./FilterBar";

type Props = FilterBarProps & {
  /** Open the shared filter bottom sheet (rendered once at the page root). */
  onOpenFilters: () => void;
};

/** Filters as an inline bar on desktop, and a button on mobile that opens the
 *  shared `FilterSheet` (the inline 8-control bar is too cramped on phones). */
export default function FilterControls({ onOpenFilters, ...filters }: Props) {
  return (
    <>
      {/* Desktop: inline filter bar */}
      <div className="hidden min-w-0 lg:block">
        <FilterBar {...filters} />
      </div>

      {/* Mobile: open the shared sheet */}
      <button
        type="button"
        onClick={onOpenFilters}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 lg:hidden"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M2.5 5.5A1 1 0 013.5 5h13a1 1 0 010 2h-13a1 1 0 01-1-1.5zM5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm3 4a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
        Filters
        {filters.activeCount > 0 && (
          <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blaze px-1.5 text-xs font-semibold text-white">
            {filters.activeCount}
          </span>
        )}
      </button>
    </>
  );
}
