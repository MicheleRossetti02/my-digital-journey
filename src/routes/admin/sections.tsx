import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { kvGetSections, kvSetSections, type Section } from "@/lib/kv.server";

export const Route = createFileRoute("/admin/sections")({
  component: SectionsList,
});

const getSectionsFn = createServerFn({ method: "GET" }).handler(() => kvGetSections());
const saveSectionsFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as Section[])
  .handler(({ data }) => kvSetSections(data));

function SectionsList() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const data = await getSectionsFn();
    setSections(data.sort((a, b) => a.position - b.position));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save(updated: Section[]) {
    setMsg(null);
    try {
      await saveSectionsFn({ data: updated });
      setMsg("Salvato ✓");
    } catch (e) {
      setMsg(`Errore: ${(e as Error).message}`);
    }
  }

  function toggle(id: string) {
    const updated = sections.map((s) => s.id === id ? { ...s, visible: !s.visible } : s);
    setSections(updated);
    save(updated);
  }

  function move(id: string, dir: -1 | 1) {
    const sorted = [...sections].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex((s) => s.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const newPos = sorted[swapIdx].position;
    const oldPos = sorted[idx].position;
    const updated = sections.map((s) => {
      if (s.id === sorted[idx].id) return { ...s, position: newPos };
      if (s.id === sorted[swapIdx].id) return { ...s, position: oldPos };
      return s;
    });
    setSections(updated.sort((a, b) => a.position - b.position));
    save(updated);
  }

  async function remove(id: string, key: string) {
    if (!confirm(`Eliminare la sezione "${key}"? (cancella anche tutte le sue voci)`)) return;
    const updated = sections.filter((s) => s.id !== id);
    setSections(updated);
    await save(updated);
  }

  function add() {
    const key = prompt("Chiave univoca della sezione (es: 'awards'):");
    if (!key) return;
    const type = prompt("Tipo (about / experiences / education / projects / gallery / passions / skills / contact / custom):", "custom") ?? "custom";
    const title = prompt("Titolo:") ?? key;
    const maxPos = Math.max(0, ...sections.map((s) => s.position));
    const newSection: Section = {
      id: `${key}-${Date.now()}`,
      section_key: key, section_type: type,
      title_en: title, title_it: title,
      subtitle_en: "", subtitle_it: "",
      kicker_en: "", kicker_it: "",
      body_en: "", body_it: "",
      position: maxPos + 10, visible: true,
      config: {}, items: [],
    };
    const updated = [...sections, newSection];
    setSections(updated);
    save(updated);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Caricamento…</p>;

  const sorted = [...sections].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Sezioni del sito</h1>
          {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
        </div>
        <button onClick={add} className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">+ Nuova sezione</button>
      </div>
      <div className="rounded-lg border border-border divide-y divide-border">
        {sorted.map((s, idx) => (
          <div key={s.id} className="flex items-center gap-3 p-3">
            <span className="font-mono text-xs text-muted-foreground w-12">{s.position}</span>
            <div className="flex-1">
              <div className="font-medium text-sm">{s.title_it || s.section_key}</div>
              <div className="text-xs text-muted-foreground">{s.section_key} · {s.section_type}</div>
            </div>
            <button onClick={() => move(s.id, -1)} disabled={idx === 0} className="text-xs px-2 py-1 border border-input rounded disabled:opacity-30">↑</button>
            <button onClick={() => move(s.id, 1)} disabled={idx === sorted.length - 1} className="text-xs px-2 py-1 border border-input rounded disabled:opacity-30">↓</button>
            <button onClick={() => toggle(s.id)} className={`text-xs px-2 py-1 rounded border ${s.visible ? "border-input" : "border-destructive text-destructive"}`}>
              {s.visible ? "👁 Visibile" : "🚫 Nascosta"}
            </button>
            <Link to="/admin/sections/$id" params={{ id: s.id }} className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80">
              Modifica
            </Link>
            <button onClick={() => remove(s.id, s.section_key)} className="text-xs text-destructive px-2">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
