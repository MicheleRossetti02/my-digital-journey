import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { kvGetSections, kvSetSections, type Section, type SectionItem } from "@/lib/kv.server";

export const Route = createFileRoute("/admin/sections/$id")({
  component: SectionEditor,
});

const getSectionsFn = createServerFn({ method: "GET" }).handler(() => kvGetSections());
const saveSectionsFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as Section[])
  .handler(({ data }) => kvSetSections(data));

function SectionEditor() {
  const { id } = Route.useParams();
  const [section, setSection] = useState<Section | null>(null);
  const [allSections, setAllSections] = useState<Section[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const data = await getSectionsFn();
    setAllSections(data);
    const found = data.find((s) => s.id === id);
    setSection(found ?? null);
  }
  useEffect(() => { load(); }, [id]);

  async function persistSection(updated: Section) {
    const newAll = allSections.map((s) => s.id === updated.id ? updated : s);
    await saveSectionsFn({ data: newAll });
    setAllSections(newAll);
    setSection(updated);
  }

  async function saveSection() {
    if (!section) return;
    setMsg(null);
    try {
      await persistSection(section);
      setMsg("Sezione salvata ✓");
    } catch (e) {
      setMsg(`Errore: ${(e as Error).message}`);
    }
  }

  async function saveItem(item: SectionItem) {
    if (!section) return;
    const updatedItems = section.items.map((i) => i.id === item.id ? item : i);
    const updatedSection = { ...section, items: updatedItems };
    await persistSection(updatedSection);
  }

  async function deleteItem(itemId: string) {
    if (!section || !confirm("Eliminare questa voce?")) return;
    const updatedSection = { ...section, items: section.items.filter((i) => i.id !== itemId) };
    await persistSection(updatedSection);
  }

  async function addItem() {
    if (!section) return;
    const maxPos = Math.max(0, ...section.items.map((i) => i.position));
    const newItem: SectionItem = {
      id: `item-${Date.now()}`,
      position: maxPos + 10,
      visible: true,
      data: templateFor(section.section_type),
    };
    const updatedSection = { ...section, items: [...section.items, newItem] };
    await persistSection(updatedSection);
  }

  async function moveItem(itemId: string, dir: -1 | 1) {
    if (!section) return;
    const sorted = [...section.items].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex((i) => i.id === itemId);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const newPos = sorted[swapIdx].position;
    const oldPos = sorted[idx].position;
    const updatedItems = section.items.map((i) => {
      if (i.id === sorted[idx].id) return { ...i, position: newPos };
      if (i.id === sorted[swapIdx].id) return { ...i, position: oldPos };
      return i;
    });
    await persistSection({ ...section, items: updatedItems });
  }

  if (!section) return <p className="text-sm text-muted-foreground">Caricamento…</p>;

  const sorted = [...section.items].sort((a, b) => a.position - b.position);

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
        <h2 className="text-lg font-semibold">Voci ({section.items.length})</h2>
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
            onMoveUp={() => moveItem(item.id, -1)}
            onMoveDown={() => moveItem(item.id, 1)}
          />
        ))}
      </div>
    </div>
  );
}

function ItemCard({ item, isFirst, isLast, onSave, onDelete, onMoveUp, onMoveDown }: {
  item: SectionItem; isFirst: boolean; isLast: boolean;
  onSave: (i: SectionItem) => void; onDelete: () => void;
  onMoveUp: () => void; onMoveDown: () => void;
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
          <button onClick={onMoveUp} disabled={isFirst} className="rounded border border-input px-1.5 py-0.5 hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed">↑</button>
          <button onClick={onMoveDown} disabled={isLast} className="rounded border border-input px-1.5 py-0.5 hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed">↓</button>
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
          const isArr = Array.isArray(val);
          return (
            <div key={k} className="space-y-1">
              <label className="text-[11px] font-mono text-muted-foreground">{k}</label>
              {isArr ? (
                <input className={inp} value={(val as string[]).join(", ")} onChange={(e) => setKey(k, e.target.value.split(",").map((s) => s.trim()))} />
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
        <summary className="cursor-pointer text-muted-foreground">+ Aggiungi/rimuovi campi (JSON avanzato)</summary>
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
    case "gallery": return { src: "", alt_en: "", alt_it: "", caption_en: "", caption_it: "" };
    case "passions": return { icon: "✨", title_en: "", title_it: "", text_en: "", text_it: "" };
    case "skills": return { category: "soft", group_en: "", group_it: "", name_en: "", name_it: "", level: 3 };
    default: return { title_en: "", title_it: "", text_en: "", text_it: "" };
  }
}

const inp = "w-full rounded-md border border-input bg-background px-2 py-1 text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><label className="text-xs font-medium">{label}</label>{children}</div>;
}
