"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type Option = { value: string; label: string; count?: number };

type Props = {
  label: string;
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
  searchable?: boolean;
  /** Render the dropdown with fixed positioning anchored to the trigger, flipping
   *  above the trigger when there isn't room below. Lets it escape an `overflow`
   *  ancestor (the mobile filter sheet) instead of being clipped off-screen.
   *  Closes on scroll/resize to avoid stale positioning. */
  floatMenu?: boolean;
};

/** Approx. panel height (max-h-80 panel + search row) used to decide flip direction. */
const PANEL_EST_HEIGHT = 360;

export default function MultiSelect({
  label,
  options,
  selected,
  onToggle,
  searchable = false,
  floatMenu = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuPos, setMenuPos] = useState<{
    left: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    // The floating menu is anchored to the trigger; any scroll/resize invalidates
    // the position, so close rather than chase the trigger around.
    function onReflow() {
      if (floatMenu) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
    };
  }, [open, floatMenu]);

  // Anchor the floating menu to the trigger, flipping up when there's more room
  // above than below (e.g. a bottom-most filter inside the mobile sheet).
  function toggleOpen() {
    setOpen((v) => {
      const next = !v;
      if (next && floatMenu && triggerRef.current) {
        const r = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - r.bottom;
        const spaceAbove = r.top;
        const dropUp = spaceBelow < PANEL_EST_HEIGHT && spaceAbove > spaceBelow;
        setMenuPos(
          dropUp
            ? {
                left: r.left,
                bottom: window.innerHeight - r.top + 8,
                maxHeight: spaceAbove - 16,
              }
            : { left: r.left, top: r.bottom + 8, maxHeight: spaceBelow - 16 }
        );
      }
      return next;
    });
  }

  const visible = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  const count = selected.length;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggleOpen}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
          count > 0
            ? "border-zinc-900 bg-zinc-900 text-white"
            : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
        )}
      >
        {label}
        {count > 0 && (
          <span
            className={cn(
              "ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs",
              "bg-white/20 text-white"
            )}
          >
            {count}
          </span>
        )}
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
          id={panelId}
          style={
            floatMenu && menuPos
              ? {
                  position: "fixed",
                  left: menuPos.left,
                  top: menuPos.top,
                  bottom: menuPos.bottom,
                  maxHeight: menuPos.maxHeight,
                }
              : undefined
          }
          className={cn(
            "z-30 flex max-h-80 w-64 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg",
            floatMenu ? "fixed" : "absolute mt-2"
          )}
        >
          {searchable && (
            <div className="border-b border-zinc-100 p-2">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}…`}
                className="w-full rounded-md bg-zinc-100 px-2.5 py-1.5 text-sm outline-none placeholder:text-zinc-400 focus:bg-zinc-50 focus:ring-1 focus:ring-zinc-300"
              />
            </div>
          )}
          <ul
            role="listbox"
            aria-label={label}
            aria-multiselectable="true"
            className="max-h-64 min-h-0 flex-1 overflow-y-auto p-1.5"
          >
            {visible.length === 0 && (
              <li className="px-2.5 py-2 text-sm text-zinc-500">No matches</li>
            )}
            {visible.map((o) => {
              const checked = selected.includes(o.value);
              return (
                <li key={o.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => onToggle(o.value)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-zinc-50"
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        checked
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-300"
                      )}
                    >
                      {checked && (
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.29 6.8-6.79a1 1 0 011.4 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="flex-1 text-zinc-700">{o.label}</span>
                    {typeof o.count === "number" && (
                      <span className="text-xs tabular-nums text-zinc-500">
                        {o.count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
