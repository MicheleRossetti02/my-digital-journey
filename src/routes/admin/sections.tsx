import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/sections")({
  component: SectionsList,
});

type Section = {
  id: string; section_key: string; section_type: string;
  title_en: string; title_it: string; position: number; visible: boolean;
};

function SectionsList() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("sections").select("*").order("position");
    setSections((data ?? []) as Section[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggle(s: Section) {
    await supabase.from("sections").update({ visible: !s.visible }).eq("id", s.id);
    load();
  }
  async function move(s: Section, dir: -1 | 1) {
    await supabase.from("sections").update({ position: s.position + dir * 5 }).eq("id", s.id);
    load();
  }
  async function remove(s: Section) {
    if (!confirm(`Eliminare la sezione "${s.section_key}"? (cancella anche tutte le sue voci)`)) return;
    await supabase.from("sections").delete().eq("id", s.id);
    load();
  }
  async function add() {
    const key = prompt("Chiave univoca della sezione (es: 'awards'):");
    if (!key) return;
    const type = prompt("Tipo (about / experiences / education / projects / gallery / passions / skills / contact / custom):", "custom") ?? "custom";
    const title = prompt("Titolo:") ?? key;
    const maxPos = Math.max(0, ...sections.map((s) => s.position));
    await supabase.from("sections").insert({
      section_key: key, section_type: type,
      title_en: title, title_it: title,
      position: maxPos + 10, visible: true,
    });
    load();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Caricamento…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sezioni del sito</h1>
        <button onClick={add} className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">+ Nuova sezione</button>
      </div>
      <div className="rounded-lg border border-border divide-y divide-border">
        {sections.map((s) => (
          <div key={s.id} className="flex items-center gap-3 p-3">
            <span className="font-mono text-xs text-muted-foreground w-12">{s.position}</span>
            <div className="flex-1">
              <div className="font-medium text-sm">{s.title_it || s.section_key}</div>
              <div className="text-xs text-muted-foreground">{s.section_key} · {s.section_type}</div>
            </div>
            <button onClick={() => move(s, -1)} className="text-xs px-2 py-1 border border-input rounded">↑</button>
            <button onClick={() => move(s, 1)} className="text-xs px-2 py-1 border border-input rounded">↓</button>
            <button onClick={() => toggle(s)} className={`text-xs px-2 py-1 rounded border ${s.visible ? "border-input" : "border-destructive text-destructive"}`}>
              {s.visible ? "👁 Visibile" : "🚫 Nascosta"}
            </button>
            <Link to="/admin/sections/$id" params={{ id: s.id }} className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80">
              Modifica
            </Link>
            <button onClick={() => remove(s)} className="text-xs text-destructive px-2">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
