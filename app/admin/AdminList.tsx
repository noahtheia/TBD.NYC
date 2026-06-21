"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  name: string;
  category: string;
  neighborhood: string | null;
  source: string | null;
};

export default function AdminList({ venues }: { venues: Row[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return venues;
    return venues.filter(
      (v) =>
        v.name.toLowerCase().includes(s) ||
        (v.neighborhood ?? "").toLowerCase().includes(s)
    );
  }, [q, venues]);

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={`Search ${venues.length} venues…`}
        className="mb-3 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
      />
      <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
        {filtered.slice(0, 300).map((v) => (
          <li key={v.id}>
            <Link
              href={`/admin/${v.id}`}
              className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-zinc-50"
            >
              <span className="min-w-0 truncate">
                <span className="font-medium text-zinc-900">{v.name}</span>
                <span className="ml-2 text-sm text-zinc-500">
                  {v.category}
                  {v.neighborhood ? ` · ${v.neighborhood}` : ""}
                </span>
              </span>
              {v.source === "manual" && (
                <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600">
                  manual
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      {filtered.length > 300 && (
        <p className="mt-2 text-xs text-zinc-400">
          Showing first 300 of {filtered.length}. Refine your search.
        </p>
      )}
    </div>
  );
}
