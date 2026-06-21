"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  bulkDeleteVenues,
  bulkSetFeatured,
  bulkSetUnverified,
  reEnrichVenue,
} from "./actions";

export type AdminRow = {
  id: string;
  name: string;
  category: string;
  neighborhood: string | null;
  source: string | null;
  unverified: boolean | null;
  featured: boolean | null;
  happyHour: boolean | null;
  rating: number | null;
  photoUrl: string | null;
  updatedAt: string | null;
};

const RENDER_CAP = 200;
const REENRICH_CAP = 25;

type CategoryFilter = "all" | "bar" | "restaurant";
type SourceFilter = "all" | "manual" | "sync";
type SortKey = "name" | "updated";

const hasGap = (v: AdminRow) => v.rating == null || !v.photoUrl || !v.neighborhood;

const selectCls =
  "rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-500";

export default function AdminList({ venues }: { venues: AdminRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [source, setSource] = useState<SourceFilter>("all");
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [onlyUnverified, setOnlyUnverified] = useState(false);
  const [onlyGaps, setOnlyGaps] = useState(false);
  const [sort, setSort] = useState<SortKey>("name");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = venues.filter((v) => {
      if (s && !v.name.toLowerCase().includes(s) && !(v.neighborhood ?? "").toLowerCase().includes(s))
        return false;
      if (category !== "all" && v.category !== category) return false;
      if (source !== "all" && (v.source ?? "sync") !== source) return false;
      if (onlyFeatured && !v.featured) return false;
      if (onlyUnverified && !v.unverified) return false;
      if (onlyGaps && !hasGap(v)) return false;
      return true;
    });
    out.sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")
    );
    return out;
  }, [venues, q, category, source, onlyFeatured, onlyUnverified, onlyGaps, sort]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((v) => selected.has(v.id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((v) => v.id)));
  const clear = () => setSelected(new Set());

  const ids = () => [...selected];

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      clear();
      router.refresh();
    });

  const onFeature = (featured: boolean) => run(() => bulkSetFeatured(ids(), featured));
  const onVerify = (unverified: boolean) => run(() => bulkSetUnverified(ids(), unverified));
  const onDelete = () => {
    if (!confirm(`Delete ${selected.size} venue(s)? This cannot be undone.`)) return;
    run(() => bulkDeleteVenues(ids()));
  };
  const onReEnrich = () => {
    const batch = ids().slice(0, REENRICH_CAP);
    if (selected.size > REENRICH_CAP && !confirm(`Re-enrich the first ${REENRICH_CAP} of ${selected.size} selected?`))
      return;
    run(async () => {
      let ok = 0;
      const fails: string[] = [];
      for (const id of batch) {
        const r = await reEnrichVenue(id);
        if (r.ok) ok++;
        else fails.push(`${id}: ${r.message}`);
      }
      alert(`Re-enriched ${ok}/${batch.length}.${fails.length ? `\n\nSkipped:\n${fails.join("\n")}` : ""}`);
    });
  };

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={`Search ${venues.length} venues…`}
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select value={category} onChange={(e) => setCategory(e.target.value as CategoryFilter)} className={selectCls}>
          <option value="all">All categories</option>
          <option value="bar">Bars</option>
          <option value="restaurant">Restaurants</option>
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value as SourceFilter)} className={selectCls}>
          <option value="all">All sources</option>
          <option value="manual">Manual</option>
          <option value="sync">Synced</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectCls}>
          <option value="name">Sort: Name A–Z</option>
          <option value="updated">Sort: Recently updated</option>
        </select>
        <Toggle on={onlyFeatured} onClick={() => setOnlyFeatured((v) => !v)}>Featured</Toggle>
        <Toggle on={onlyUnverified} onClick={() => setOnlyUnverified((v) => !v)}>Unverified</Toggle>
        <Toggle on={onlyGaps} onClick={() => setOnlyGaps((v) => !v)}>Missing data</Toggle>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-500">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} />
          Select all ({filtered.length})
        </label>
        <span>
          {filtered.length === venues.length
            ? `${venues.length} venues`
            : `${filtered.length} of ${venues.length} matched`}
        </span>
      </div>

      {selected.size > 0 && (
        <div className="sticky top-2 z-10 mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-zinc-300 bg-white/95 p-2 shadow-sm backdrop-blur">
          <span className="px-1 text-sm font-semibold text-zinc-700">{selected.size} selected</span>
          <BulkBtn disabled={pending} onClick={() => onFeature(true)}>Feature</BulkBtn>
          <BulkBtn disabled={pending} onClick={() => onFeature(false)}>Unfeature</BulkBtn>
          <BulkBtn disabled={pending} onClick={() => onVerify(false)}>Mark verified</BulkBtn>
          <BulkBtn disabled={pending} onClick={() => onVerify(true)}>Mark unverified</BulkBtn>
          <BulkBtn disabled={pending} onClick={onReEnrich}>Re-enrich</BulkBtn>
          <BulkBtn disabled={pending} danger onClick={onDelete}>Delete</BulkBtn>
          <button onClick={clear} className="ml-auto px-2 text-sm text-zinc-500 hover:text-zinc-800">Clear</button>
        </div>
      )}

      <ul className="mt-3 divide-y divide-zinc-100 rounded-lg border border-zinc-200">
        {filtered.slice(0, RENDER_CAP).map((v) => (
          <li key={v.id} className="flex items-center gap-2 px-3 hover:bg-zinc-50">
            <input
              type="checkbox"
              checked={selected.has(v.id)}
              onChange={() => toggle(v.id)}
              aria-label={`Select ${v.name}`}
            />
            <Link href={`/admin/${v.id}`} className="flex min-w-0 flex-1 items-center justify-between gap-3 py-2">
              <span className="min-w-0 truncate">
                <span className="font-medium text-zinc-900">{v.name}</span>
                <span className="ml-2 text-sm text-zinc-500">
                  {v.category}
                  {v.neighborhood ? ` · ${v.neighborhood}` : ""}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                {v.featured && <Tag className="bg-amber-100 text-amber-700">featured</Tag>}
                {v.unverified && <Tag className="bg-rose-100 text-rose-700">unverified</Tag>}
                {hasGap(v) && <Tag className="bg-zinc-100 text-zinc-500">gaps</Tag>}
                {v.source === "manual" && <Tag className="bg-zinc-100 text-zinc-600">manual</Tag>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {filtered.length > RENDER_CAP && (
        <p className="mt-2 text-xs text-zinc-400">
          Showing first {RENDER_CAP} of {filtered.length}. Refine filters to narrow.
        </p>
      )}
    </div>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition",
        on ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"
      )}
    >
      {children}
    </button>
  );
}

function BulkBtn({
  onClick,
  disabled,
  danger,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-medium transition disabled:opacity-50",
        danger
          ? "bg-rose-600 text-white hover:bg-rose-700"
          : "bg-zinc-900 text-white hover:bg-zinc-700"
      )}
    >
      {children}
    </button>
  );
}

function Tag({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("rounded px-1.5 py-0.5 text-xs", className)}>{children}</span>;
}
