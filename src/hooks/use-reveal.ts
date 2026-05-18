import { useEffect } from "react";

/**
 * Adds `is-visible` class to all `.reveal` elements when they enter the viewport.
 * Uses IntersectionObserver, falls back to immediate visibility.
 */
export function useReveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const showAll = () => {
      document.querySelectorAll<HTMLElement>(".reveal").forEach((el) => el.classList.add("is-visible"));
    };

    if (!("IntersectionObserver" in window)) {
      showAll();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    const observePending = () => {
      document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)").forEach((el) => {
        if (el.dataset.revealBound === "1") return;
        el.dataset.revealBound = "1";
        io.observe(el);
      });
    };

    observePending();
    const mo = new MutationObserver(() => observePending());
    mo.observe(document.body, { childList: true, subtree: true });

    // Fail-safe: avoid "empty sections" if browser IO callbacks are throttled.
    const fallbackTimer = window.setTimeout(showAll, 1200);

    return () => {
      window.clearTimeout(fallbackTimer);
      mo.disconnect();
      io.disconnect();
    };
  }, []);
}
