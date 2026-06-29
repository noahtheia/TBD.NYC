import Link from "next/link";

export type RelatedLink = { href: string; label: string; count?: number };

/** A crawlable list of related landing-page links (internal-linking for SEO). */
export default function RelatedLinks({
  title,
  links,
}: {
  title: string;
  links: RelatedLink[];
}) {
  if (!links.length) return null;
  return (
    <nav className="mt-10 border-t border-zinc-200 pt-6">
      <h2 className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-stone">
        {title}
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-ember"
            >
              {l.label}
              {l.count != null && <span className="text-zinc-400">{l.count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
