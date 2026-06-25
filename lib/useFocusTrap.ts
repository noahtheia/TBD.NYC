import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Trap focus within `ref` while `active`: focus the first focusable on open, keep
 *  Tab/Shift+Tab inside, lock body scroll, and restore focus to the trigger on close. */
export function useFocusTrap(
  active: boolean,
  ref: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    const node = ref.current;
    if (!active || !node) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const items = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );

    // Defer initial focus so the open transition / async content can mount.
    const t = setTimeout(() => (items()[0] ?? node).focus(), 50);

    function onKey(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const list = items();
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey && (activeEl === first || activeEl === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    }
    node.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(t);
      node.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [active, ref]);
}
