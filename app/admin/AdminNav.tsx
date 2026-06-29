"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import Wordmark from "@/components/site/Wordmark";
import { logoutAction } from "./actions";

const NAV = [
  { href: "/admin", label: "Venues", exact: true },
  { href: "/admin/new", label: "Add venue", exact: false },
  { href: "/admin/posts", label: "Blog posts", exact: false },
  { href: "/admin/picks", label: "Editor's picks", exact: false },
  { href: "/admin/search", label: "Search priority", exact: false },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex h-full flex-col gap-1 p-4">
      <div className="mb-4 px-2">
        <Wordmark className="text-lg" />
        <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-stone">
          Admin
        </span>
      </div>
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition",
              active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"
            )}
          >
            {item.label}
          </Link>
        );
      })}
      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
      >
        View site ↗
      </a>
      <form action={logoutAction} className="mt-auto">
        <button className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800">
          Sign out
        </button>
      </form>
    </nav>
  );
}
