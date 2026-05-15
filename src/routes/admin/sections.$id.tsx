import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/sections/$id")({
  component: SectionEditor,
});

type Section = {
  id: string; section_key: string; section_type: string;
  kicker_en: string; kicker_it: string;
  title_en: string; title_it: string;
  subtitle_en: string; subtitle_it: string;
  body_en: string; body_it: string;
  visible: boolean;
};
type Item = { id: string; position: number; visible: boolean; data: Record<string, unknown> };

function SectionEditor() {
  const { id } = Route.useParams();
  const [section, setSection] = useState<Section | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const { data: s } = await supabase.from("sections").select("*").eq("id", id).single();
    setSection(s as Section);
    const { data: it } = await supabase.from("section_items").select("*").eq("section_id", id).order("position");
    setItems((it ?? []) as Item[]);
  }
  useEffect(() => { load(); }, [id]);

  async function saveSection() {
    if (!section) return;
    const { error } = await supabase.from("sections").update({
      kicker_en: section.kicker_en, kicker_it: section.kicker_it,
      title_en: section.title_en, title_it: section.title_it,
      subtitle_en: section.subtitle_en, subtitle_it: section.subtitle_it,
      body_en: section.body_en, body_it: section.body_it,
    }).eq("id", id);
    setMsg(error ? `Errore: ${error.message}` : "Sezione salvata ✓");
  }

  async function saveItem(item: Item) {
    await supabase.from("section_items").update({
      data: item.data as never, visible: item.visible, position: item.position,
    }).eq("id", item.id);
    load();
  }
  async function deleteItem(itemId: string) {
    if (!confirm("Eliminare questa voce?")) return;
    await supabase.from("section_items").delete().eq("id", itemId);
    load();
  }
  async function addItem() {
    const maxPos = Math.max(0, ...items.map((i) => i.position));
    const template = templateFor(section?.section_type ?? "custom");
    await supabase.from("section_items").insert({
      section_id: id, position: maxPos + 10, visible: true, data: template as never,
    });
    load();
  }
  async function moveItem(item: Item, dir: -1 | 1) {
    const sorted = [...items].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex((i) => i.id === item.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swap = sorted[swapIdx];
    await Promise.all([
      supabase.from("section_items").update({ position: swap.position }).eq("id", item.id),
      supabase.from("section_items").update({ position: item.position }).eq("id", swap.id),
    ]);
    load();
  }
  async function uploadFile(file: File): Promise<string | null> {
    const ext = file.name.split(".").pop();
    const path = `items/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) { alert(error.message); return null; }
    return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
  }

  if (!section) return <p className="text-sm text-muted-foreground">Caricamento…</p>;

  const sorted = [...items].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin/sections" className="text-xs text-muted-foreground hover:text-foreground">← Sezioni</Link>
          <h1 className="text-xl font-semibold">{section.section_key} <span className="text-xs text-muted-foreground">({section.section_type})</span></h1>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
          <button onClick={saveSection} className="rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">Salva intestazione</button>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kicker EN"><input className={inp} value={section.kicker_en} onChange={(e) => setSection({ ...section, kicker_en: e.target.value })} /></Field>
          <Field label="Kicker IT"><input className={inp} value={section.kicker_it} onChange={(e) => setSection({ ...section, kicker_it: e.target.value })} /></Field>
          <Field label="Titolo EN"><input className={inp} value={section.title_en} onChange={(e) => setSection({ ...section, title_en: e.target.value })} /></Field>
          <Field label="Titolo IT"><input className={inp} value={section.title_it} onChange={(e) => setSection({ ...section, title_it: e.target.value })} /></Field>
          <Field label="Sottotitolo EN"><textarea rows={2} className={inp} value={section.subtitle_en} onChange={(e) => setSection({ ...section, subtitle_en: e.target.value })} /></Field>
          <Field label="Sottotitolo IT"><textarea rows={2} className={inp} value={section.subtitle_it} onChange={(e) => setSection({ ...section, subtitle_it: e.target.value })} /></Field>
          <Field label="Body EN"><textarea rows={3} className={inp} value={section.body_en} onChange={(e) => setSection({ ...section, body_en: e.target.value })} /></Field>
          <Field label="Body IT"><textarea rows={3} className={inp} value={section.body_it} onChange={(e) => setSection({ ...section, body_it: e.target.value })} /></Field>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Voci ({items.length})</h2>
        <button onClick={addItem} className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">+ Nuova voce</button>
      </div>

      <div className="space-y-3">
        {sorted.map((item, idx) => (
          <ItemCard
            key={item.id}
            item={item}
            isFirst={idx === 0}
            isLast={idx === sorted.length - 1}
            onSave={saveItem}
            onDelete={() => deleteItem(item.id)}
            onUpload={uploadFile}
            onMoveUp={() => moveItem(item, -1)}
            onMoveDown={() => moveItem(item, 1)}
          />
        ))}
      </div>
    </div>
  );
}

function ItemCard({ item, isFirst, isLast, onSave, onDelete, onUpload, onMoveUp, onMoveDown }: {
  item: Item;
  isFirst: boolean;
  isLast: boolean;
  onSave: (i: Item) => void;
  onDelete: () => void;
  onUpload: (f: File) => Promise<string | null>;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [local, setLocal] = useState(item);
  const keys = Object.keys(local.data);

  function setKey(k: string, v: unknown) {
    setLocal({ ...local, data: { ...local.data, [k]: v } });
  }

  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <div className="flex flex-col gap-0.5">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            title="Sposta su"
            className="rounded border border-input px-1.5 py-0.5 hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
          >↑</button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            title="Sposta giù"
            className="rounded border border-input px-1.5 py-0.5 hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
          >↓</button>
        </div>
        <label className="flex items-center gap-1 ml-1">
          <input type="checkbox" checked={local.visible} onChange={(e) => setLocal({ ...local, visible: e.target.checked })} />
          Visibile
        </label>
        <div className="ml-auto flex gap-2">
          <button onClick={() => onSave(local)} className="rounded bg-primary px-3 py-1 text-primary-foreground">Salva</button>
          <button onClick={onDelete} className="rounded border border-destructive text-destructive px-3 py-1">Elimina</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {keys.map((k) => {
          const val = local.data[k];
          const isLong = typeof val === "string" && val.length > 60;
          const isImg = k === "src" || k === "image" || k === "avatar_url" || k === "cv_url";
          const isArr = Array.isArray(val);
          return (
            <div key={k} className="space-y-1">
              <label className="text-[11px] font-mono text-muted-foreground">{k}</label>
              {isArr ? (
                <input className={inp} value={(val as string[]).join(", ")} onChange={(e) => setKey(k, e.target.value.split(",").map((s) => s.trim()))} />
              ) : isImg ? (
                <div className="space-y-1">
                  <input className={inp} value={String(val ?? "")} onChange={(e) => setKey(k, e.target.value)} />
                  <input type="file" className="text-xs" onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const url = await onUpload(f); if (url) setKey(k, url);
                  }} />
                </div>
              ) : isLong ? (
                <textarea rows={3} className={inp} value={String(val ?? "")} onChange={(e) => setKey(k, e.target.value)} />
              ) : typeof val === "number" ? (
                <input type="number" className={inp} value={Number(val)} onChange={(e) => setKey(k, Number(e.target.value))} />
              ) : (
                <input className={inp} value={String(val ?? "")} onChange={(e) => setKey(k, e.target.value)} />
              )}
            </div>
          );
        })}
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">+ Aggiungi/rimuovi campi (JSON)</summary>
        <textarea rows={6} className={`${inp} font-mono text-xs mt-2`} value={JSON.stringify(local.data, null, 2)} onChange={(e) => {
          try { setLocal({ ...local, data: JSON.parse(e.target.value) }); } catch { /* ignore */ }
        }} />
      </details>
    </div>
  );
}

function templateFor(type: string): Record<string, unknown> {
  switch (type) {
    case "experiences": return { title_en: "", title_it: "", org_en: "", org_it: "", when_en: "", when_it: "", text_en: "", text_it: "" };
    case "education": return { school: "", program_en: "", program_it: "", when_en: "", when_it: "", where_en: "", where_it: "" };
    case "projects": return { title: "", tag_en: "", tag_it: "", desc_en: "", desc_it: "", role_en: "", role_it: "", stack: [], href: "", image: "" };
    case "gallery": return { src: "", alt_en: "", alt_it: "", caption_en: "", caption_it: "", position_x: 50, position_y: 50, scale: 1 };
    case "passions": return { icon: "✨", title_en: "", title_it: "", text_en: "", text_it: "" };
    case "skills": return { category: "soft", group_en: "", group_it: "", name_en: "", name_it: "", level: 3 };
    default: return { title_en: "", title_it: "", text_en: "", text_it: "" };
  }
}

const inp = "w-full rounded-md border border-input bg-background px-2 py-1 text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><label className="text-xs font-medium">{label}</label>{children}</div>;
}
