"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";

type Props = {
  /** Link to copy. Relative paths are resolved against the current origin so a
   *  friend gets a full link. Defaults to the current page URL. */
  url?: string;
  /** Title for the native share sheet (e.g. the venue name). */
  title?: string;
  className?: string;
  label?: string;
  /** Render a compact circular icon button (no text label) — for cards/headers. */
  iconOnly?: boolean;
};

export default function ShareButton({ url, title, className, label = "Share", iconOnly = false }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    // Stay inert when dropped over a clickable card (the list tile's inset overlay).
    e.preventDefault();
    e.stopPropagation();

    if (typeof window === "undefined") return;
    const link = url ? new URL(url, window.location.origin).href : window.location.href;
    if (!link) return;

    // Prefer the native share sheet on mobile; fall back to clipboard.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ url: link, ...(title ? { title } : {}) });
        return;
      } catch (err) {
        // User dismissed the sheet — don't silently copy instead.
        if ((err as Error)?.name === "AbortError") return;
        // Otherwise fall through to clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Couldn't copy the link — copy it from your address bar");
    }
  }

  const ariaLabel = title ? `Share ${title}` : "Share";
  const iconSize = iconOnly ? "h-5 w-5" : "h-4 w-4";
  const glyph = copied ? (
    <svg className={cn(iconSize, "text-emerald-600")} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.29 6.8-6.79a1 1 0 011.4 0z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className={iconSize} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M13 5a3 3 0 10-2.83 2H10a3 3 0 00-3 3v.17A3 3 0 105.83 13H6a3 3 0 003-3v-.17A3 3 0 0013 5z" opacity="0" />
      <path d="M7.5 11.5l5-3M7.5 8.5l5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <circle cx="5.5" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="14.5" cy="6" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="14.5" cy="14" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={ariaLabel}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800",
          className
        )}
      >
        {glyph}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400",
        className
      )}
    >
      {glyph}
      {copied ? "Copied!" : label}
    </button>
  );
}
