import Link from "next/link";
import { cn } from "@/lib/cn";
import Wordmark from "@/components/site/Wordmark";

/** Shared editorial header (home, blog, landing pages). */
export default function SiteHeader({
  active,
}: {
  active?: "home" | "explore" | "blog";
}) {
  const navLink = (href: string, label: string, key: NonNullable<typeof active>) => (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium transition hover:text-zinc-900",
        active === key ? "text-zinc-900" : "text-zinc-500"
      )}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-newsprint/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 lg:px-6">
        <Link href="/" aria-label="TBD.NYC home">
          <Wordmark className="text-xl" />
        </Link>
        <nav className="ml-auto flex items-center gap-5">
          {navLink("/explore", "Explore", "explore")}
          {navLink("/blog", "The Guide", "blog")}
          <Link
            href="/explore"
            className="rounded-full bg-blaze px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-ember"
          >
            Open the map
          </Link>
        </nav>
      </div>
    </header>
  );
}
