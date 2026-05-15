import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { kvGetProfile, kvSetProfile, type SiteProfile } from "@/lib/kv.server";
import { fetchTopRepos, languageColors, type GitHubRepo } from "@/lib/github";

export const Route = createFileRoute("/admin/github")({
  component: GitHubAdmin,
});

const getProfileFn = createServerFn({ method: "GET" }).handler(() => kvGetProfile());
const saveProfileFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as SiteProfile)
  .handler(({ data }) => kvSetProfile(data));

type GithubConfig = { username: string; pinned: string[]; max: number };

function GitHubAdmin() {
  const [config, setConfig] = useState<GithubConfig>({ username: "MicheleRossetti02", pinned: [], max: 6 });
  const [profile, setProfile] = useState<SiteProfile | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [fetchedUsername, setFetchedUsername] = useState("");

  useEffect(() => {
    getProfileFn().then((p) => {
      setProfile(p);
      if (p.github_config) {
        setConfig(p.github_config);
        fetchRepos(p.github_config.username);
      } else {
        fetchRepos("MicheleRossetti02");
      }
    });
  }, []);

  async function fetchRepos(username: string) {
    if (!username.trim()) return;
    setLoading(true); setMsg(null);
    try {
      const result = await fetchTopRepos(username, 100);
      setRepos(result);
      setFetchedUsername(username);
    } catch (e) {
      setMsg(`Errore GitHub: ${(e as Error).message}`);
    }
    setLoading(false);
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = { ...profile, github_config: config };
      await saveProfileFn({ data: updated });
      setProfile(updated);
      setMsg("Salvato ✓");
    } catch (e) {
      setMsg(`Errore: ${(e as Error).message}`);
    }
    setSaving(false);
  }

  function togglePin(name: string) {
    setConfig((prev) => ({
      ...prev,
      pinned: prev.pinned.includes(name) ? prev.pinned.filter((n) => n !== name) : [...prev.pinned, name],
    }));
  }

  function movePin(name: string, dir: -1 | 1) {
    const idx = config.pinned.indexOf(name);
    if (idx < 0) return;
    const next = [...config.pinned];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setConfig({ ...config, pinned: next });
  }

  const pinnedSet = new Set(config.pinned);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">GitHub Projects</h1>
          <p className="text-xs text-muted-foreground mt-1">Scegli quali repository mostrare nel sito e in che ordine.</p>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
          <button onClick={save} disabled={saving} className="rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {saving ? "..." : "Salva"}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4 space-y-4">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium">Username GitHub</label>
            <input className={inp} value={config.username} onChange={(e) => setConfig({ ...config, username: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Max repo (se nessun pin)</label>
            <input type="number" className={`${inp} w-24`} value={config.max} onChange={(e) => setConfig({ ...config, max: Math.max(1, Number(e.target.value)) })} min={1} max={20} />
          </div>
          <button onClick={() => fetchRepos(config.username)} disabled={loading} className="rounded-md border border-input px-3 py-2 text-sm hover:bg-accent disabled:opacity-50">
            {loading ? "Caricamento…" : "↻ Aggiorna"}
          </button>
        </div>
      </div>

      {config.pinned.length > 0 && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h2 className="text-sm font-semibold">Ordine di visualizzazione — {config.pinned.length} repo selezionati</h2>
          <div className="space-y-1.5">
            {config.pinned.map((name, i) => (
              <div key={name} className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                <span className="font-mono text-muted-foreground text-xs w-5 shrink-0">{i + 1}.</span>
                <span className="flex-1 font-medium truncate">{name}</span>
                <button onClick={() => movePin(name, -1)} disabled={i === 0} className="rounded border border-input px-1.5 py-0.5 text-xs hover:bg-accent disabled:opacity-30">↑</button>
                <button onClick={() => movePin(name, 1)} disabled={i === config.pinned.length - 1} className="rounded border border-input px-1.5 py-0.5 text-xs hover:bg-accent disabled:opacity-30">↓</button>
                <button onClick={() => togglePin(name)} className="text-xs text-destructive px-1">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {loading ? "Caricamento…" : repos.length > 0 ? `Repository di ${fetchedUsername} (${repos.length})` : "Nessun repo trovato"}
          </h2>
          {config.pinned.length === 0 && <p className="text-xs text-muted-foreground">Nessun pin → top {config.max} automatici</p>}
        </div>
        {repos.map((repo) => {
          const isPinned = pinnedSet.has(repo.name);
          const color = (repo.language && languageColors[repo.language]) || "#999";
          return (
            <div key={repo.id} onClick={() => togglePin(repo.name)}
              className={`cursor-pointer rounded-lg border p-3 flex items-start gap-3 hover:bg-accent/40 transition-colors select-none ${isPinned ? "border-primary bg-primary/5" : "border-border"}`}>
              <div className="mt-0.5 shrink-0">
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${isPinned ? "border-primary bg-primary" : "border-input"}`}>
                  {isPinned && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{repo.name}</span>
                  {isPinned && <span className="text-[10px] rounded-full bg-primary/10 text-primary px-1.5 py-0.5 font-medium">#{config.pinned.indexOf(repo.name) + 1}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{repo.description || <em>Nessuna descrizione</em>}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  {repo.language && <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />{repo.language}</span>}
                  <span>★ {repo.stargazers_count}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const inp = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
