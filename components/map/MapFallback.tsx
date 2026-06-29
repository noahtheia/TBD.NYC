export default function MapFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-zinc-100 p-8">
      <div className="max-w-sm rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <p className="text-base font-semibold text-zinc-800">Map unavailable</p>
        <p className="mt-2 text-sm text-zinc-500">
          Add a Mapbox token to{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">.env.local</code>{" "}
          as{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">
            NEXT_PUBLIC_MAPBOX_TOKEN
          </code>{" "}
          to enable the interactive map. The list and filters still work.
        </p>
        <a
          href="https://account.mapbox.com/access-tokens/"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm font-medium text-blaze hover:underline"
        >
          Get a free token →
        </a>
      </div>
    </div>
  );
}
