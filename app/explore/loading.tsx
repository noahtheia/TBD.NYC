/** Instant FCP shell for the explore route while the ISR/Supabase fetch runs. */
export default function Loading() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <header className="shrink-0 border-b border-zinc-200 bg-white">
        <div className="flex flex-col gap-3 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-4">
            <span className="text-xl font-extrabold tracking-tight text-zinc-900">
              TBD<span className="text-rose-600">.NYC</span>
            </span>
            <div className="ml-auto h-9 w-44 animate-pulse rounded-full bg-zinc-100 sm:w-72" />
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-24 animate-pulse rounded-full bg-zinc-100"
              />
            ))}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <section className="w-full border-r border-zinc-200 lg:w-[42%] lg:max-w-xl xl:w-[38%]">
          <ul className="flex flex-col gap-3 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-zinc-200 p-3">
                <div className="h-20 w-20 shrink-0 animate-pulse rounded-lg bg-zinc-100" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-100" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100" />
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="hidden flex-1 animate-pulse bg-zinc-100 lg:block" />
      </div>
    </div>
  );
}
