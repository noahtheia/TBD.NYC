"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type Props = {
  /** Link to copy. Defaults to the current page URL. */
  url?: string;
  /** Title for the native share sheet (e.g. the venue name). */
  title?: string;
  className?: string;
  label?: string;
};

export default function ShareButton({ url, title, className, label = "Share" }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const link =
      url ?? (typeof window !== "undefined" ? window.location.href : "");
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
      if (typeof window !== "undefined") window.prompt("Copy this link:", link);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Copy link to this view"
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400",
        className
      )}
    >
      {copied ? (
        <>
          <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.29 6.8-6.79a1 1 0 011.4 0z" clipRule="evenodd" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M13 5a3 3 0 10-2.83 2H10a3 3 0 00-3 3v.17A3 3 0 105.83 13H6a3 3 0 003-3v-.17A3 3 0 0013 5z" opacity="0" />
            <path d="M7.5 11.5l5-3M7.5 8.5l5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <circle cx="5.5" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="14.5" cy="6" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="14.5" cy="14" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
