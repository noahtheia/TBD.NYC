"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Facets } from "@/types/venue";

type Suggestion = { label: string; kind: string; href: string };

function exploreHref(params: Record<string, string>) {
  return `/explore?${new URLSearchParams(params).toString()}`;
}

const QUICK = [
  { label: "Open now", href: exploreHref({ open: "1" }) },
  { label: "Happy hour now", href: exploreHref({ hh: "1", open: "1" }) },
  { label: "Bars", href: exploreHref({ cat: "bar" }) },
  { label: "Restaurants", href: exploreHref({ cat: "restaurant" }) },
];

export default function HeroSearch({ facets }: { facets: Facets }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);

  // Every filterable option, each linking to /explore with the matching filter
  // applied — so clicking one shows only what matches.
  const all = useMemo<Suggestion[]>(
    () => [
      { label: "Open now", kind: "Filter", href: exploreHref({ open: "1" }) },
      { label: "Happy hour", kind: "Filter", href: exploreHref({ hh: "1" }) },
      { label: "Open late", kind: "Filter", href: exploreHref({ late: "1" }) },
      { label: "Bars", kind: "Category", href: exploreHref({ cat: "bar" }) },
      { label: "Restaurants", kind: "Category", href: exploreHref({ cat: "restaurant" }) },
      ...facets.neighborhoods.map((n) => ({
        label: n,
        kind: "Neighborhood",
        href: exploreHref({ hood: n }),
      })),
      ...facets.cuisines.map((c) => ({
        label: c,
        kind: "Cuisine",
        href: exploreHref({ cuisine: c }),
      })),
      ...facets.awards.map((a) => ({
        label: a,
        kind: "Award",
        href: exploreHref({ award: a }),
      })),
      ...facets.types.map((t) => ({
        label: t,
        kind: "Type",
        href: exploreHref({ type: t }),
      })),
    ],
    [facets]
  );

  const matches = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const starts: Suggestion[] = [];
    const contains: Suggestion[] = [];
    for (const s of all) {
      const l = s.label.toLowerCase();
      if (l.startsWith(query)) starts.push(s);
      else if (l.includes(query)) contains.push(s);
    }
    return [...starts, ...contains].slice(0, 8);
  }, [q, all]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? exploreHref({ q: query }) : "/explore");
  }

  const open = focused && q.trim().length > 0;

  return (
    <div className="relative">
      <form
        onSubmit={submit}
        className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white p-1.5 shadow-sm focus-within:border-zinc-400"
      >
        <svg className="ml-2 h-5 w-5 shrink-0 text-zinc-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 103.4 9.82l3.64 3.64a.75.75 0 101.06-1.06l-3.64-3.64A5.5 5.5 0 009 3.5zM5 9a4 4 0 118 0 4 4 0 01-8 0z"
            clipRule="evenodd"
          />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          aria-label="Search bars, restaurants, neighborhoods, and cuisines"
          placeholder="Search bars, restaurants, neighborhoods…"
          className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-zinc-400"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          Search
        </button>
      </form>

      {open && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
          <ul className="max-h-80 overflow-y-auto py-1.5">
            <li>
              <Link
                href={exploreHref({ q: q.trim() })}
                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                <span aria-hidden>🔎</span>
                Search <span className="font-semibold text-zinc-900">“{q.trim()}”</span>
              </Link>
            </li>
            {matches.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="flex items-center justify-between gap-3 px-4 py-2 text-sm hover:bg-zinc-50"
                >
                  <span className="font-medium text-zinc-800">{s.label}</span>
                  <span className="shrink-0 text-xs text-zinc-400">{s.kind}</span>
                </Link>
              </li>
            ))}
            {matches.length === 0 && (
              <li className="px-4 py-2 text-xs text-zinc-400">
                No matching filters — press Enter to search names.
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-rose-700"
          >
            {c.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
