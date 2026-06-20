"use client";

import type { OpeningHours } from "@/types/venue";
import { openStatus } from "@/lib/hours";
import { cn } from "@/lib/cn";

export default function OpenStatus({
  hours,
  className,
}: {
  hours?: OpeningHours;
  className?: string;
}) {
  const status = openStatus(hours);
  if (!status) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        status.open ? "text-emerald-600" : "text-zinc-500",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status.open ? "bg-emerald-500" : "bg-zinc-300"
        )}
      />
      {status.label}
    </span>
  );
}
