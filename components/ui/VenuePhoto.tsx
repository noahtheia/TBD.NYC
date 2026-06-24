"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

const GRADIENTS = [
  "from-rose-400 to-orange-300",
  "from-amber-400 to-rose-300",
  "from-violet-400 to-rose-300",
  "from-sky-400 to-emerald-300",
  "from-fuchsia-400 to-amber-300",
  "from-emerald-400 to-cyan-300",
];

function hashIndex(s: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

type Props = {
  name: string;
  photoUrl?: string;
  /** Tailwind sizing/aspect classes for the container (e.g. "h-20 w-20" or "aspect-video w-full"). */
  className?: string;
  rounded?: string;
  /** Load eagerly with a high fetch priority — set for the LCP image (detail hero,
   *  first few above-the-fold cards). Defaults to lazy. */
  eager?: boolean;
  /** Responsive sizes hint for the optimizer. Defaults to a thumbnail size. */
  sizes?: string;
};

/** Venue image (optimized via next/image) with a deterministic gradient + initial
 *  fallback when there's no photo or the image fails to load. */
export default function VenuePhoto({
  name,
  photoUrl,
  className,
  rounded = "rounded-lg",
  eager = false,
  sizes = "160px",
}: Props) {
  const [errored, setErrored] = useState(false);
  const showImage = Boolean(photoUrl) && !errored;
  const gradient = GRADIENTS[hashIndex(name, GRADIENTS.length)];

  return (
    <div className={cn("relative overflow-hidden bg-zinc-100", rounded, className)}>
      {showImage ? (
        <Image
          src={photoUrl as string}
          alt={name}
          fill
          sizes={sizes}
          priority={eager}
          // http:// URLs aren't allowed by remotePatterns (and are mixed-content on
          // an https deploy) — render them unoptimized so dev still shows them.
          unoptimized={(photoUrl as string).startsWith("http://")}
          onError={() => setErrored(true)}
          className="object-cover"
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center bg-gradient-to-br",
            gradient
          )}
        >
          <span className="text-2xl font-bold text-white/90">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}
