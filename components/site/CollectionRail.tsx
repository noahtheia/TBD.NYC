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
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-blaze">
              {eyebrow}
            </p>
          )}
          <h2 className="mt-1 font-display text-2xl font-black tracking-tight text-ink">{title}</h2>
        </div>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="shrink-0 font-mono text-xs font-bold uppercase tracking-[0.1em] text-blaze transition hover:text-ember"
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
