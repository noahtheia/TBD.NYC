import { cn } from "@/lib/cn";

/**
 * Canonical TBD. lockup. The colored period is the brand "atom"; `NYC` is set in
 * Space Mono per the brand identity. Size is controlled by the caller via a
 * `text-*` class on `className` (e.g. `text-xl`); color defaults by variant but
 * can be overridden through `className`.
 */
export default function Wordmark({
  variant = "light",
  showNyc = true,
  className,
}: {
  variant?: "light" | "dark";
  showNyc?: boolean;
  className?: string;
}) {
  const accent = variant === "dark" ? "text-marquee" : "text-blaze";
  return (
    <span
      className={cn(
        "font-display font-black tracking-[-0.03em]",
        variant === "dark" ? "text-newsprint" : "text-ink",
        className
      )}
    >
      TBD<span className={accent}>.</span>
      {showNyc && (
        <span
          className={cn(
            "ml-1 align-top font-mono text-[0.5em] font-bold tracking-tight",
            accent
          )}
        >
          NYC
        </span>
      )}
    </span>
  );
}
