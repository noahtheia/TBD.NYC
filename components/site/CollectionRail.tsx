import Link from "next/link";

/** A Resy-style section: eyebrow + title + "see all" over a horizontal snap rail. */
export default function CollectionRail({
  eyebrow,
  title,
  seeAllHref,
  seeAllLabel = "See all",
  children,
}: {
  eyebrow?: string;
  title: string;
  seeAllHref?: string;
  seeAllLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {eyebrow}
            </p>
          )}
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">{title}</h2>
        </div>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="shrink-0 text-sm font-semibold text-rose-600 transition hover:text-rose-700"
          >
            {seeAllLabel} →
          </Link>
        )}
      </div>
      <div className="mt-4 flex snap-x items-stretch gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </section>
  );
}
