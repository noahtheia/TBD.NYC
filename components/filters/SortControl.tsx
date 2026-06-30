"use client";

import { useEffect, useRef, useState } from "react";
import { SORT_OPTIONS, type SortKey } from "@/lib/sort";
import { cn } from "@/lib/cn";

type GeoStatus = "idle" | "loading" | "granted" | "denied" | "unavailable";

type Props = {
  sort: SortKey;
  onSort: (s: SortKey) => void;
  geoStatus: GeoStatus;
  onLocate: () => void;
  /** Render only the sort dropdown (no "Near me" button) — for the mobile tile
   *  row, which already has its own Near me pill. */
  hideNearMe?: boolean;
  /** Which edge the dropdown menu aligns to. Default `right` (desktop header,
   *  pinned to the far right); use `left` when the control sits at the start of a
   *  row so the menu opens rightward into the viewport instead of off-screen. */
  align?: "left" | "right";
  /** Render the dropdown with fixed positioning anchored to the trigger, so it
   *  escapes an `overflow-x-auto` ancestor (the mobile filter scroller) instead of
   *  being clipped. Closes on scroll/resize to avoid stale positioning. */
  floatMenu?: boolean;
};

export default function SortControl({ sort, onSort, geoStatus, onLocate, hideNearMe, align = "right", floatMenu }: Props) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const distanceReady = geoStatus === "granted";

  useEffect(() => {
    if (!open) return;
    // `pointerdown` fires for both mouse and touch, so outside-tap dismissal works
    // on phones (a plain `mousedown` listener is unreliable on touch devices).
    function onDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    // For the floating (fixed-positioned) menu, re-anchor under the trigger on
    // scroll/resize so the mobile pill-row's horizontal scroll (or the URL bar
    // showing/hiding) repositions the menu instead of slamming it shut.
    function onReflow() {
      if (floatMenu && triggerRef.current) {
        const r = triggerRef.current.getBoundingClientRect();
        setMenuPos({ top: r.bottom + 8, left: r.left });
      }
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    if (floatMenu) {
      window.addEventListener("scroll", onReflow, true);
      window.addEventListener("resize", onReflow);
    }
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
    };
  }, [open, floatMenu]);

  // Anchor the floating menu below the trigger when it opens.
  function toggleOpen() {
    setOpen((v) => {
      const next = !v;
      if (next && floatMenu && triggerRef.current) {
        const r = triggerRef.current.getBoundingClientRect();
        setMenuPos({ top: r.bottom + 8, left: r.left });
      }
      return next;
    });
  }

  const current = SORT_OPTIONS.find((o) => o.value === sort) ?? SORT_OPTIONS[0];
  const denied = geoStatus === "denied";

  return (
    <div className="flex items-center gap-2">
      {!hideNearMe && (
        <button
          type="button"
          onClick={onLocate}
          disabled={geoStatus === "loading" || geoStatus === "unavailable"}
          title={
            geoStatus === "unavailable"
              ? "Location isn't available in this browser"
              : denied
                ? "Location is blocked — enable it in your browser's site settings, then tap again"
                : undefined
          }
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition disabled:opacity-50",
            sort === "distance" && distanceReady
              ? "border-sky-500 bg-sky-500 text-white"
              : denied
                ? "border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400"
                : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
          )}
        >
          <span aria-hidden>📍</span>
          {geoStatus === "loading"
            ? "Locating…"
            : denied
              ? "Location Blocked"
              : "Near Me"}
        </button>
      )}

      <div ref={rootRef} className="relative">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={toggleOpen}
          className="flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-400"
        >
          Sort: {current.label}
          <svg
            className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {open && (
          <div
            role="listbox"
            aria-label="Sort by"
            style={
              floatMenu && menuPos
                ? { position: "fixed", top: menuPos.top, left: menuPos.left }
                : undefined
            }
            className={cn(
              "z-30 w-48 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg",
              floatMenu
                ? "fixed"
                : cn("absolute mt-2", align === "left" ? "left-0" : "right-0")
            )}
          >
            {SORT_OPTIONS.map((o) => {
              const disabled = o.value === "distance" && !distanceReady;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={o.value === sort}
                  disabled={disabled}
                  onClick={() => {
                    onSort(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-zinc-50 disabled:opacity-40",
                    o.value === sort ? "font-semibold text-zinc-900" : "text-zinc-700"
                  )}
                >
                  {o.label}
                  {o.value === "distance" && !distanceReady && (
                    <span className="text-xs text-zinc-500">enable</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
