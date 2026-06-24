"use client";

import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/cn";

/** A heart toggle for saving a venue. A client island so it can live inside
 *  server-rendered detail content without making the whole page client. */
export default function FavoriteButton({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const { set, toggle } = useFavorites();
  const faved = set.has(id);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      aria-label={faved ? "Remove from saved" : "Save"}
      aria-pressed={faved}
      className={cn(
        "flex items-center justify-center rounded-full transition",
        faved ? "text-rose-600" : "text-zinc-500 hover:text-rose-600",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill={faved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M12 20.5S3.5 15.6 3.5 9.6A4.1 4.1 0 0 1 12 7a4.1 4.1 0 0 1 8.5 2.6c0 6-8.5 10.9-8.5 10.9z" />
      </svg>
    </button>
  );
}
