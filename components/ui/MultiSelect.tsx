"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type Option = { value: string; label: string };

type Props = {
  label: string;
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
  searchable?: boolean;
};

export default function MultiSelect({
  label,
  options,
  selected,
  onToggle,
  searchable = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
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
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const visible = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  const count = selected.length;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
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
          className="absolute z-30 mt-2 max-h-80 w-64 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
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
          <ul className="max-h-64 overflow-y-auto p-1.5">
            {visible.length === 0 && (
              <li className="px-2.5 py-2 text-sm text-zinc-400">No matches</li>
            )}
            {visible.map((o) => {
              const checked = selected.includes(o.value);
              return (
                <li key={o.value}>
                  <button
                    type="button"
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
                    <span className="text-zinc-700">{o.label}</span>
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
