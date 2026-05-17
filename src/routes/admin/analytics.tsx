import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  getAnalyticsSummaryFn,
  getSessionsOverTimeFn,
  getSectionEngagementFn,
  getClickHeatmapFn,
} from "@/lib/analytics.server";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
  head: () => ({ meta: [{ title: "Analytics — Admin" }, { name: "robots", content: "noindex" }] }),
});

type Summary = {
  totalSessions: number;
  totalClicks: number;
  avgDuration: number;
  deviceMap: Record<string, number>;
};

type SessionsOverTime = { date: string; sessions: number }[];

type SectionEngagement = { section: string; avgSeconds: number; views: number }[];

type HeatmapPoint = { x_pct: number; y_pct: number; target_tag: string };

const SECTION_KEYS = ["hero", "about", "now", "education", "experiences", "projects", "looking", "reading", "skills", "passions", "gallery", "contact"];
const PIE_COLORS = ["#16a34a", "#3b82f6", "#f59e0b"];

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

type TabKey = "panoramica" | "sezioni" | "heatmap" | "dettagli";

function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("panoramica");

  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [sessionsOverTime, setSessionsOverTime] = useState<SessionsOverTime | null>(null);
  const [sotLoading, setSotLoading] = useState(true);

  const [sectionEngagement, setSectionEngagement] = useState<SectionEngagement | null>(null);
  const [seLoading, setSeLoading] = useState(true);

  const [heatmapSection, setHeatmapSection] = useState<string>("hero");
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[] | null>(null);
  const [heatmapLoading, setHeatmapLoading] = useState(false);

  useEffect(() => {
    getAnalyticsSummaryFn()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));

    getSessionsOverTimeFn()
      .then(setSessionsOverTime)
      .catch(() => setSessionsOverTime(null))
      .finally(() => setSotLoading(false));

    getSectionEngagementFn()
      .then(setSectionEngagement)
      .catch(() => setSectionEngagement(null))
      .finally(() => setSeLoading(false));
  }, []);

  useEffect(() => {
    setHeatmapLoading(true);
    setHeatmapPoints(null);
    getClickHeatmapFn({ data: { section: heatmapSection } })
      .then(setHeatmapPoints)
      .catch(() => setHeatmapPoints([]))
      .finally(() => setHeatmapLoading(false));
  }, [heatmapSection]);

  const devicePieData = summary
    ? Object.entries(summary.deviceMap).map(([name, value]) => ({ name, value }))
    : [];

  const topDevice =
    summary && Object.keys(summary.deviceMap).length > 0
      ? Object.entries(summary.deviceMap).sort((a, b) => b[1] - a[1])[0][0]
      : "—";

  const tabs: { key: TabKey; label: string }[] = [
    { key: "panoramica", label: "Panoramica" },
    { key: "sezioni", label: "Sezioni" },
    { key: "heatmap", label: "Heatmap" },
    { key: "dettagli", label: "Dettagli" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Ultimi 30 giorni</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={
              activeTab === t.key
                ? "px-4 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground"
                : "px-4 py-1.5 rounded-md text-sm font-medium border border-input hover:bg-accent"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== PANORAMICA ===== */}
      {activeTab === "panoramica" && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Totale Visite (30gg)</p>
              {summaryLoading ? (
                <p className="text-sm text-muted-foreground mt-2">Caricamento…</p>
              ) : (
                <p className="text-3xl font-semibold mt-1">{summary?.totalSessions ?? 0}</p>
              )}
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Durata Media</p>
              {summaryLoading ? (
                <p className="text-sm text-muted-foreground mt-2">Caricamento…</p>
              ) : (
                <p className="text-3xl font-semibold mt-1">{summary ? formatDuration(summary.avgDuration) : "—"}</p>
              )}
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Click Totali</p>
              {summaryLoading ? (
                <p className="text-sm text-muted-foreground mt-2">Caricamento…</p>
              ) : (
                <p className="text-3xl font-semibold mt-1">{summary?.totalClicks ?? 0}</p>
              )}
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Dispositivo Top</p>
              {summaryLoading ? (
                <p className="text-sm text-muted-foreground mt-2">Caricamento…</p>
              ) : (
                <p className="text-3xl font-semibold mt-1 capitalize">{topDevice}</p>
              )}
            </div>
          </div>

          {/* Sessions over time */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold mb-4">Sessioni al giorno</h2>
            {sotLoading ? (
              <p className="text-sm text-muted-foreground">Caricamento…</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={sessionsOverTime ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => v.slice(5)}
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number) => [value, "Sessioni"]}
                    labelFormatter={(label: string) => label}
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Device pie */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold mb-4">Dispositivi</h2>
            {summaryLoading ? (
              <p className="text-sm text-muted-foreground">Caricamento…</p>
            ) : devicePieData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun dato</p>
            ) : (
              <div className="flex items-center gap-6 flex-wrap">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={devicePieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={false}>
                      {devicePieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [value, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="space-y-2">
                  {devicePieData.map((d, i) => (
                    <li key={d.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="capitalize">{d.name}</span>
                      <span className="text-muted-foreground ml-1">{d.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== SEZIONI ===== */}
      {activeTab === "sezioni" && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-4">Tempo medio per sezione (secondi)</h2>
          {seLoading ? (
            <p className="text-sm text-muted-foreground">Caricamento…</p>
          ) : !sectionEngagement || sectionEngagement.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun dato</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(sectionEngagement.length * 40, 200)}>
              <BarChart data={sectionEngagement} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 11 }} unit="s" />
                <YAxis type="category" dataKey="section" tick={{ fontSize: 12 }} width={90} />
                <Tooltip
                  formatter={(value: number) => [`${value}s`, "Avg"]}
                />
                <Bar dataKey="avgSeconds" fill="#16a34a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* ===== HEATMAP ===== */}
      {activeTab === "heatmap" && (
        <div className="space-y-4">
          {/* Section selector */}
          <div className="flex flex-wrap gap-2">
            {SECTION_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => setHeatmapSection(key)}
                className={
                  heatmapSection === key
                    ? "px-3 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground"
                    : "px-3 py-1 rounded-md text-xs font-medium border border-input hover:bg-accent"
                }
              >
                {key}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold mb-4">
              Click — <span className="font-normal text-muted-foreground">{heatmapSection}</span>
            </h2>
            {heatmapLoading ? (
              <p className="text-sm text-muted-foreground">Caricamento…</p>
            ) : (
              <div
                className="relative w-full bg-muted rounded-lg overflow-hidden"
                style={{ aspectRatio: "16/9" }}
              >
                {heatmapPoints && heatmapPoints.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Nessun click registrato per questa sezione</p>
                  </div>
                )}
                {heatmapPoints?.map((pt, i) => (
                  <span
                    key={i}
                    title={pt.target_tag}
                    style={{
                      position: "absolute",
                      left: `${pt.x_pct}%`,
                      top: `${pt.y_pct}%`,
                      transform: "translate(-50%, -50%)",
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "oklch(0.6 0.15 162 / 0.5)",
                      pointerEvents: "none",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== DETTAGLI ===== */}
      {activeTab === "dettagli" && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sezione</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Visualizzazioni</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Tempo medio</th>
              </tr>
            </thead>
            <tbody>
              {seLoading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                    Caricamento…
                  </td>
                </tr>
              ) : !sectionEngagement || sectionEngagement.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                    Nessun dato
                  </td>
                </tr>
              ) : (
                [...sectionEngagement]
                  .sort((a, b) => b.avgSeconds - a.avgSeconds)
                  .map((row) => (
                    <tr key={row.section} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium capitalize">{row.section}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{row.views}</td>
                      <td className="px-4 py-3 text-right font-mono">{row.avgSeconds}s</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
