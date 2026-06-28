"use client";

import { useRef, useState } from "react";
import VenuePhoto from "@/components/ui/VenuePhoto";
import { cn } from "@/lib/cn";
import type { GalleryPhoto } from "@/lib/photos";

/** Horizontal scroll-snap gallery for the venue detail view. Falls back to a single
 *  hero (matching the old layout) when there is at most one photo. */
export default function VenuePhotoCarousel({
  name,
  photos,
}: {
  name: string;
  photos: GalleryPhoto[];
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Single (or no) photo: keep the original hero, no scroll affordance.
  if (photos.length <= 1) {
    return (
      <VenuePhoto
        name={name}
        photoUrl={photos[0]?.url}
        className="mb-4 aspect-video w-full"
        rounded="rounded-xl"
        eager
        sizes="(max-width: 768px) 100vw, 640px"
      />
    );
  }

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(Math.max(0, Math.min(i, photos.length - 1)));
  };

  return (
    <div className="mb-4">
      <div
        ref={scroller}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth rounded-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((p, i) => (
          <div key={`${p.url}-${i}`} className="relative w-full shrink-0 snap-center">
            <VenuePhoto
              name={name}
              photoUrl={p.url}
              className="aspect-video w-full"
              rounded="rounded-xl"
              eager={i === 0}
              sizes="(max-width: 768px) 100vw, 640px"
            />
            {p.caption && (
              <p className="absolute inset-x-0 bottom-0 rounded-b-xl bg-gradient-to-t from-black/60 to-transparent px-3 py-2 text-xs font-medium text-white">
                {p.caption}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-center gap-1.5">
        {photos.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === active ? "w-4 bg-zinc-800" : "w-1.5 bg-zinc-300"
            )}
          />
        ))}
      </div>
    </div>
  );
}
