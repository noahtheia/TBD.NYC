"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { useFocusTrap } from "@/lib/useFocusTrap";
import FilterBar, { type FilterBarProps } from "./FilterBar";

type Props = FilterBarProps & {
  resultCount?: number;
  open: boolean;
  onClose: () => void;
};

/** The full filter set as a focus-trapped bottom sheet on mobile. Controlled by
 *  the parent so it can be opened from several triggers (the header "Filters"
 *  pill in list view, the "Filter" button in the full-screen map's bottom bar). */
export default function FilterSheet({ open, onClose, resultCount, ...filters }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, sheetRef);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={cn("fixed inset-0 z-50 lg:hidden", open ? "" : "pointer-events-none")}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
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
              onClick={onClose}
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
            onClick={onClose}
            className="w-full rounded-full bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            {resultCount != null
              ? `Show ${resultCount} ${resultCount === 1 ? "spot" : "spots"}`
              : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
