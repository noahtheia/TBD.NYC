"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-lg font-bold text-zinc-900">Admin couldn’t load</h1>
      <p className="mt-2 text-sm text-zinc-600">
        This usually means the admin environment variables aren’t set in the
        server that’s running the app. Make sure these are configured where the
        app is served (your deploy host, or this environment’s settings):
      </p>
      <ul className="mt-3 list-inside list-disc text-sm text-zinc-700">
        <li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
        <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
        <li><code>SUPABASE_SERVICE_ROLE_KEY</code> (secret)</li>
        <li><code>ADMIN_PASSWORD</code> (secret)</li>
      </ul>
      <button
        onClick={reset}
        className="mt-5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
      >
        Try again
      </button>
      {error?.digest && (
        <p className="mt-3 text-xs text-zinc-400">Ref: {error.digest}</p>
      )}
    </main>
  );
}
