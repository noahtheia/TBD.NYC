"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type SearchSuggestion = {
  type: "venue" | "neighborhood";
  label: string;
  /** The text committed to the search when this suggestion is chosen. */
  value: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Commit the search (Enter / suggestion pick). Until this fires, typing must
   *  NOT alter the map or list — it only updates the suggestions dropdown. */
  onSubmit?: (value: string) => void;
  suggestions?: SearchSuggestion[];
  onSelectSuggestion?: (item: SearchSuggestion) => void;
};

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  suggestions = [],
  onSelectSuggestion,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const showList = open && suggestions.length > 0;

  // Dismiss the dropdown on outside tap (pointerdown covers mouse + touch). Same
  // pattern as SortControl. Escape is handled on the input's keydown.
  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  function commit(next: string) {
    onSubmit?.(next);
    setOpen(false);
    setActiveIndex(-1);
  }

  function select(item: SearchSuggestion) {
    onSelectSuggestion?.(item);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showList && activeIndex >= 0 && suggestions[activeIndex]) {
        select(suggestions[activeIndex]);
      } else {
        commit(value);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M9 3.5a5.5 5.5 0 103.39 9.84l3.38 3.38a.75.75 0 101.06-1.06l-3.38-3.38A5.5 5.5 0 009 3.5zM5 9a4 4 0 118 0 4 4 0 01-8 0z"
          clipRule="evenodd"
        />
      </svg>
      <input
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          showList && activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined
        }
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search bars, neighborhoods, types…"
        aria-label="Search venues"
        className="w-full rounded-full border border-zinc-300 bg-white py-2 pl-9 pr-4 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl"
        >
          {suggestions.map((s, i) => (
            <li key={`${s.type}-${s.value}`} role="presentation">
              <button
                type="button"
                role="option"
                id={`${listId}-opt-${i}`}
                aria-selected={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => select(s)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
                  i === activeIndex ? "bg-zinc-100 text-zinc-900" : "text-zinc-700"
                )}
              >
                <span aria-hidden className="shrink-0 text-zinc-400">
                  {s.type === "neighborhood" ? "📍" : "🍸"}
                </span>
                <span className="min-w-0 flex-1 truncate">{s.label}</span>
                {s.type === "neighborhood" && (
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-zinc-400">
                    Area
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
