import { createServerFn } from "@tanstack/react-start";
import { isSupabaseServiceConfigured, supabaseAdmin } from "@/integrations/supabase/client.server";

// Types
type SessionPayload = {
  id: string;
  referrer: string;
  device: string; // 'mobile' | 'tablet' | 'desktop'
  language: string;
  screen_width: number;
};

type SectionViewPayload = {
  session_id: string;
  section_key: string;
  duration_ms: number;
};

type ClickPayload = {
  session_id: string;
  section_key: string;
  x_pct: number;
  y_pct: number;
  target_tag: string;
};

// Recording
export const recordSessionFn = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: SessionPayload }) => {
    if (!isSupabaseServiceConfigured()) return;
    await supabaseAdmin.from("analytics_sessions").upsert({
      id: data.id,
      referrer: data.referrer,
      device: data.device,
      language: data.language,
      screen_width: data.screen_width,
    }, { onConflict: "id" });
  });

export const flushSessionFn = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string; duration_ms: number } }) => {
    if (!isSupabaseServiceConfigured()) return;
    await supabaseAdmin.from("analytics_sessions").update({
      ended_at: new Date().toISOString(),
      duration_ms: data.duration_ms,
    }).eq("id", data.id);
  });

export const recordSectionViewsFn = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: SectionViewPayload[] }) => {
    if (!isSupabaseServiceConfigured()) return;
    if (!data.length) return;
    await supabaseAdmin.from("analytics_section_views").insert(
      data.map((v) => ({
        session_id: v.session_id,
        section_key: v.section_key,
        duration_ms: v.duration_ms,
      }))
    );
  });

export const recordClicksFn = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: ClickPayload[] }) => {
    if (!isSupabaseServiceConfigured()) return;
    if (!data.length) return;
    await supabaseAdmin.from("analytics_clicks").insert(
      data.map((c) => ({
        session_id: c.session_id,
        section_key: c.section_key,
        x_pct: c.x_pct,
        y_pct: c.y_pct,
        target_tag: c.target_tag,
      }))
    );
  });

// Querying (admin dashboard)
export const getAnalyticsSummaryFn = createServerFn({ method: "GET" }).handler(async () => {
  if (!isSupabaseServiceConfigured()) {
    return { totalSessions: 0, totalClicks: 0, avgDuration: 0, deviceMap: {} as Record<string, number> };
  }
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [sessions, clicks, avgDur] = await Promise.all([
    supabaseAdmin.from("analytics_sessions").select("id, device", { count: "exact" }).gte("started_at", since),
    supabaseAdmin.from("analytics_clicks").select("id", { count: "exact" }).gte("clicked_at", since),
    supabaseAdmin.from("analytics_sessions").select("duration_ms").gte("started_at", since).not("duration_ms", "is", null),
  ]);

  const totalSessions = sessions.count ?? 0;
  const totalClicks = clicks.count ?? 0;
  const durations = (avgDur.data ?? []).map((r) => r.duration_ms).filter(Boolean) as number[];
  const avgDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  // Device breakdown
  const deviceMap: Record<string, number> = {};
  for (const s of sessions.data ?? []) {
    const d = s.device ?? "unknown";
    deviceMap[d] = (deviceMap[d] ?? 0) + 1;
  }

  return { totalSessions, totalClicks, avgDuration, deviceMap };
});

export const getSessionsOverTimeFn = createServerFn({ method: "GET" }).handler(async () => {
  if (!isSupabaseServiceConfigured()) return [] as { date: string; sessions: number }[];
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from("analytics_sessions")
    .select("started_at")
    .gte("started_at", since)
    .order("started_at", { ascending: true });

  // Group by day (YYYY-MM-DD)
  const byDay: Record<string, number> = {};
  for (const row of data ?? []) {
    const day = row.started_at.slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;
  }

  // Fill in all 30 days
  const result: { date: string; sessions: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, sessions: byDay[key] ?? 0 });
  }
  return result;
});

export const getSectionEngagementFn = createServerFn({ method: "GET" }).handler(async () => {
  if (!isSupabaseServiceConfigured()) return [] as { section: string; avgSeconds: number; views: number }[];
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from("analytics_section_views")
    .select("section_key, duration_ms")
    .gte("viewed_at", since);

  const map: Record<string, { total: number; count: number }> = {};
  for (const row of data ?? []) {
    if (!map[row.section_key]) map[row.section_key] = { total: 0, count: 0 };
    map[row.section_key].total += row.duration_ms;
    map[row.section_key].count += 1;
  }

  const SECTION_ORDER = ["hero", "about", "now", "education", "experiences", "projects", "looking", "reading", "skills", "passions", "gallery", "contact"];
  return SECTION_ORDER.filter((k) => map[k]).map((k) => ({
    section: k,
    avgSeconds: Math.round(map[k].total / map[k].count / 1000),
    views: map[k].count,
  }));
});

export const getClickHeatmapFn = createServerFn({ method: "GET" }).handler(async ({ data }: { data: { section: string } }) => {
  if (!isSupabaseServiceConfigured()) return [] as { x_pct: number; y_pct: number; target_tag: string }[];
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: rows } = await supabaseAdmin
    .from("analytics_clicks")
    .select("x_pct, y_pct, target_tag")
    .eq("section_key", data.section)
    .gte("clicked_at", since)
    .limit(500);
  return (rows ?? []) as { x_pct: number; y_pct: number; target_tag: string }[];
});
