import { cn } from "@/lib/cn";

/**
 * The "TBD-Approved" seal from the brand identity — a Space Mono sticker in the
 * Ink/Marquee colorway, shown on editor's-pick and featured venues.
 */
export default function TbdApprovedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-marquee",
        className
      )}
    >
      ✦ TBD-Approved
    </span>
  );
}
