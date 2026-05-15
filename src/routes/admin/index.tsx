import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: ProfileEditor,
});

type Profile = {
  id: number;
  name: string;
  tagline_en: string; tagline_it: string;
  bio_en: string; bio_it: string;
  location: string;
  avatar_url: string | null;
  cv_url: string | null;
  email: string;
  links: { label: string; url: string; icon?: string }[];
  typing_en: string[]; typing_it: string[];
};

function ProfileEditor() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("site_profile").select("*").eq("id", 1).single().then(({ data }) => {
      if (data) setProfile(data as unknown as Profile);
    });
  }, []);

  async function save() {
    if (!profile) return;
    setSaving(true); setMsg(null);
    const { error } = await supabase.from("site_profile").update({
      name: profile.name,
      tagline_en: profile.tagline_en, tagline_it: profile.tagline_it,
      bio_en: profile.bio_en, bio_it: profile.bio_it,
      location: profile.location, email: profile.email,
      avatar_url: profile.avatar_url, cv_url: profile.cv_url,
      links: profile.links as unknown as never,
      typing_en: profile.typing_en as unknown as never,
      typing_it: profile.typing_it as unknown as never,
    }).eq("id", 1);
    setSaving(false);
    setMsg(error ? `Errore: ${error.message}` : "Salvato ✓");
  }

  async function uploadFile(file: File, folder: string) {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
    if (error) { alert(error.message); return null; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return data.publicUrl;
  }

  if (!profile) return <p className="text-sm text-muted-foreground">Caricamento…</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Profilo</h1>
        <div className="flex items-center gap-3">
          {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
          <button onClick={save} disabled={saving} className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {saving ? "..." : "Salva"}
          </button>
        </div>
      </div>

      <Field label="Nome">
        <input className={inputCls} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
      </Field>

      <Field label="Avatar">
        <div className="flex items-center gap-3">
          {profile.avatar_url && <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />}
          <input type="file" accept="image/*" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            const url = await uploadFile(f, "avatar");
            if (url) setProfile({ ...profile, avatar_url: url });
          }} />
        </div>
      </Field>

      <Field label="CV (PDF)">
        <div className="flex items-center gap-3">
          {profile.cv_url && <a href={profile.cv_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">CV attuale</a>}
          <input type="file" accept="application/pdf" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            const url = await uploadFile(f, "cv");
            if (url) setProfile({ ...profile, cv_url: url });
          }} />
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Tagline EN"><input className={inputCls} value={profile.tagline_en} onChange={(e) => setProfile({ ...profile, tagline_en: e.target.value })} /></Field>
        <Field label="Tagline IT"><input className={inputCls} value={profile.tagline_it} onChange={(e) => setProfile({ ...profile, tagline_it: e.target.value })} /></Field>
        <Field label="Bio EN"><textarea rows={4} className={inputCls} value={profile.bio_en} onChange={(e) => setProfile({ ...profile, bio_en: e.target.value })} /></Field>
        <Field label="Bio IT"><textarea rows={4} className={inputCls} value={profile.bio_it} onChange={(e) => setProfile({ ...profile, bio_it: e.target.value })} /></Field>
        <Field label="Location"><input className={inputCls} value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} /></Field>
        <Field label="Email"><input className={inputCls} value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Field>
      </div>

      <Field label="Link social (label · URL)">
        <div className="space-y-2">
          {profile.links.map((l, i) => (
            <div key={i} className="flex gap-2">
              <input className={inputCls} placeholder="Label" value={l.label} onChange={(e) => {
                const n = [...profile.links]; n[i] = { ...n[i], label: e.target.value }; setProfile({ ...profile, links: n });
              }} />
              <input className={inputCls} placeholder="URL" value={l.url} onChange={(e) => {
                const n = [...profile.links]; n[i] = { ...n[i], url: e.target.value }; setProfile({ ...profile, links: n });
              }} />
              <button onClick={() => setProfile({ ...profile, links: profile.links.filter((_, j) => j !== i) })}
                className="text-xs text-destructive px-2">✕</button>
            </div>
          ))}
          <button onClick={() => setProfile({ ...profile, links: [...profile.links, { label: "", url: "" }] })}
            className="text-xs rounded-md border border-input px-2 py-1">+ Aggiungi link</button>
        </div>
      </Field>

      <Field label="Frasi animate EN (una per riga)">
        <textarea rows={4} className={inputCls} value={profile.typing_en.join("\n")} onChange={(e) => setProfile({ ...profile, typing_en: e.target.value.split("\n") })} />
      </Field>
      <Field label="Frasi animate IT (una per riga)">
        <textarea rows={4} className={inputCls} value={profile.typing_it.join("\n")} onChange={(e) => setProfile({ ...profile, typing_it: e.target.value.split("\n") })} />
      </Field>
    </div>
  );
}

const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}
