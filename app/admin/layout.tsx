import type { Metadata } from "next";
import { isAdmin } from "@/lib/admin-auth";
import AdminNav from "./AdminNav";

export const dynamic = "force-dynamic";

// The admin surface should never be indexed (robots.ts also disallows /admin).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login page (unauthenticated) renders without the sidebar chrome.
  if (!(await isAdmin())) return <>{children}</>;

  return (
    <div className="flex min-h-dvh bg-newsprint">
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 border-r border-zinc-200 bg-zinc-50 sm:block">
        <AdminNav />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
