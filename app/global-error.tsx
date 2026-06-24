"use client";

import { useEffect } from "react";
import { logError } from "@/lib/log";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError("global-error", error, { digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-white text-zinc-900">
        <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
          <p className="text-xl font-extrabold tracking-tight">
            TBD<span className="text-rose-600">.NYC</span>
          </p>
          <h1 className="mt-4 text-lg font-semibold">Something went wrong</h1>
          <p className="mt-1 text-sm text-zinc-500">
            An unexpected error occurred. Try again, or head back to the map.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Try again
            </button>
            {/* Plain anchor: global-error renders outside the router, where next/link is unreliable. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400"
            >
              Back to map
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
