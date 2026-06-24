"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Venue } from "@/types/venue";
import VenueDetailContent from "./VenueDetailContent";

type Props = {
  venue: Venue | null;
  onClose: () => void;
};

export default function VenueDrawer({ venue, onClose }: Props) {
  const open = venue !== null;

  // The home page ships a lite catalog, so fetch the full record on open and swap
  // it in. The lite venue renders instantly in the meantime. Fetched records are
  // cached in state (keyed by id) and read during render.
  const [fetched, setFetched] = useState<Record<string, Venue>>({});
  useEffect(() => {
    if (!venue || fetched[venue.id]) return;
    let cancelled = false;
    fetch(`/api/venue/${venue.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Venue | null) => {
        if (cancelled || !data) return;
        setFetched((prev) => (prev[data.id] ? prev : { ...prev, [data.id]: data }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [venue, fetched]);

  const detail = venue ? fetched[venue.id] ?? venue : null;

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
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/30 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel: bottom sheet on mobile, right slide-over on desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={venue?.name ?? "Venue details"}
        className={`absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out
          sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none
          ${open ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"}`}
      >
        <div className="sticky top-0 flex items-center justify-end border-b border-zinc-100 bg-white/90 px-4 py-3 backdrop-blur">
          {venue && (
            <Link
              href={`/venue/${venue.id}`}
              className="mr-auto text-sm font-medium text-zinc-500 hover:text-zinc-800"
            >
              View page ↗
            </Link>
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

        {detail && (
          <div className="p-5">
            <VenueDetailContent venue={detail} />
          </div>
        )}
      </div>
    </div>
  );
}
