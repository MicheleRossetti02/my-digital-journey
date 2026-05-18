import {
  recordSessionFn,
  flushSessionFn,
  recordSectionViewsFn,
  recordClicksFn,
} from "@/lib/analytics.server";

function getDevice(): string {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

type SectionView = { session_id: string; section_key: string; duration_ms: number };
type Click = { session_id: string; section_key: string; x_pct: number; y_pct: number; target_tag: string };

let sessionId: string;
let sessionStart: number;
const pendingViews: SectionView[] = [];
const pendingClicks: Click[] = [];
let flushing = false;

async function flush() {
  if (flushing) return;
  flushing = true;
  try {
    const views = pendingViews.splice(0);
    const clicks = pendingClicks.splice(0);
    const promises: Promise<unknown>[] = [];
    if (views.length) promises.push(recordSectionViewsFn({ data: views }));
    if (clicks.length) promises.push(recordClicksFn({ data: clicks }));
    const elapsed = Date.now() - sessionStart;
    promises.push(flushSessionFn({ data: { id: sessionId, duration_ms: elapsed } }));
    await Promise.allSettled(promises);
  } finally {
    flushing = false;
  }
}

export function initTracker() {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/admin")) return;

  sessionId = sessionStorage.getItem("_asid") ?? crypto.randomUUID();
  sessionStorage.setItem("_asid", sessionId);
  sessionStart = Date.now();

  recordSessionFn({
    data: {
      id: sessionId,
      referrer: document.referrer || "direct",
      device: getDevice(),
      language: navigator.language,
      screen_width: window.screen.width,
    },
  }).catch(() => {});

  // Section time tracking via IntersectionObserver
  const sectionTimers = new Map<string, number>(); // sectionKey -> enterTimestamp

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const key = (entry.target as HTMLElement).dataset.section;
        if (!key) continue;
        if (entry.isIntersecting) {
          sectionTimers.set(key, Date.now());
        } else {
          const enter = sectionTimers.get(key);
          if (enter) {
            const duration_ms = Date.now() - enter;
            if (duration_ms > 500) {
              pendingViews.push({ session_id: sessionId, section_key: key, duration_ms });
            }
            sectionTimers.delete(key);
          }
        }
      }
    },
    { threshold: 0.3 }
  );

  // Observe all sections with data-section attribute
  function observeSections() {
    document.querySelectorAll("[data-section]").forEach((el) => observer.observe(el));
  }
  observeSections();

  // Click tracking
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const section = target.closest("[data-section]") as HTMLElement | null;
    if (!section) return;
    const key = section.dataset.section;
    if (!key) return;
    const rect = section.getBoundingClientRect();
    const x_pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y_pct = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    pendingClicks.push({
      session_id: sessionId,
      section_key: key,
      x_pct,
      y_pct,
      target_tag: target.tagName.toLowerCase(),
    });
  }, { passive: true });

  // Flush on hide/unload
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      // Finalize any sections still visible
      sectionTimers.forEach((enter, key) => {
        const duration_ms = Date.now() - enter;
        if (duration_ms > 500) {
          pendingViews.push({ session_id: sessionId, section_key: key, duration_ms });
        }
      });
      sectionTimers.clear();
      flush();
    }
  });

  window.addEventListener("beforeunload", () => {
    sectionTimers.forEach((enter, key) => {
      const duration_ms = Date.now() - enter;
      if (duration_ms > 500) {
        pendingViews.push({ session_id: sessionId, section_key: key, duration_ms });
      }
    });
    sectionTimers.clear();
    flush();
  });
}
