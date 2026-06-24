"use client";

import { useEffect, useState } from "react";
import { subscribe, dismiss, type Toast } from "@/lib/toast";

/** Renders transient toast messages. Mounted once in the root layout. */
export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => subscribe(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismiss(t.id)}
          className="pointer-events-auto max-w-sm rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-lg"
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
