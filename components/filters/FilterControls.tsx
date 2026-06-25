"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useFocusTrap } from "@/lib/useFocusTrap";
import FilterBar, { type FilterBarProps } from "./FilterBar";

type Props = FilterBarProps & { resultCount?: number };

/** Filters as an inline bar on desktop, and a button + bottom sheet on mobile
 *  (the inline 8-control bar is too cramped on phones). */
export default function FilterControls({ resultCount, ...filters }: Props) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, sheetRef);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Desktop: inline filter bar */}
      <div className="hidden min-w-0 lg:block">
        <FilterBar {...filters} />
      </div>

      {/* Mobile: open the sheet */}
      <button
        type="button"
        onClick={() => setOpen(true)}
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
          <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-xs font-semibold text-white">
            {filters.activeCount}
          </span>
        )}
      </button>

      <div
        className={cn("fixed inset-0 z-50 lg:hidden", open ? "" : "pointer-events-none")}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/30 transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
          tabIndex={-1}
          className={cn(
            "absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none",
            open ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <h2 className="text-base font-semibold text-zinc-900">Filters</h2>
            <div className="flex items-center gap-3">
              {filters.activeCount > 0 && (
                <button
                  type="button"
                  onClick={filters.onClear}
                  className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
                >
                  Clear all
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <FilterBar {...filters} stack />
          </div>

          <div className="border-t border-zinc-100 p-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full rounded-full bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              {resultCount != null
                ? `Show ${resultCount} ${resultCount === 1 ? "spot" : "spots"}`
                : "Done"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
