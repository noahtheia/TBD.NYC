/** True when the user prefers reduced motion. Safe to call in event handlers /
 *  effects (reads matchMedia at call time). */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** A map animation duration that collapses to 0 under reduced-motion preference. */
export function motionDuration(ms: number): number {
  return prefersReducedMotion() ? 0 : ms;
}
