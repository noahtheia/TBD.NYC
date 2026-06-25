"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CHIPS = [
  { label: "Open now", href: "/explore?open=1" },
  { label: "Happy hour now", href: "/explore?hh=1&open=1" },
  { label: "West Village", href: "/explore?hood=West+Village" },
  { label: "Williamsburg", href: "/explore?hood=Williamsburg" },
  { label: "Chinatown", href: "/explore?hood=Chinatown" },
];

export default function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/explore?q=${encodeURIComponent(query)}` : "/explore");
  }

  return (
    <div>
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
          aria-label="Search bars, restaurants, and neighborhoods"
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
      <div className="mt-3 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
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
