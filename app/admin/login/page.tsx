import { redirect } from "next/navigation";
import { isAdmin, hasAdminAuth } from "@/lib/admin-auth";
import { loginAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">
        TBD<span className="text-rose-600">.NYC</span> admin
      </h1>
      {!hasAdminAuth && (
        <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Set <code>ADMIN_PASSWORD</code> in the environment to enable admin login.
        </p>
      )}
      <form action={loginAction} className="mt-5 space-y-3">
        <label htmlFor="admin-password" className="sr-only">
          Admin password
        </label>
        <input
          id="admin-password"
          type="password"
          name="password"
          placeholder="Admin password"
          autoFocus
          aria-describedby={error ? "admin-password-error" : undefined}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
        {error && (
          <p id="admin-password-error" role="alert" className="text-sm text-rose-600">
            Incorrect password.
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
