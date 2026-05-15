import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { kvGetProfile, kvSetProfile, type SiteProfile } from "@/lib/kv.server";

export const Route = createFileRoute("/admin/")({
  component: ProfileEditor,
});

const getProfileFn = createServerFn({ method: "GET" }).handler(() => kvGetProfile());
const saveProfileFn = createServerFn({ method: "POST" })
  .handler(({ data }: { data: SiteProfile }) => kvSetProfile(data));

function ProfileEditor() {
  const [profile, setProfile] = useState<SiteProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    getProfileFn().then(setProfile);
  }, []);

  async function save() {
    if (!profile) return;
    setSaving(true); setMsg(null);
    try {
      await saveProfileFn({ data: profile });
      setMsg("Salvato ✓");
    } catch (e) {
      setMsg(`Errore: ${(e as Error).message}`);
    }
    setSaving(false);
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
        <input className={inp} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
      </Field>

      <Field label="Avatar URL">
        <div className="flex items-center gap-3">
          {profile.avatar_url && <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />}
          <input className={inp} value={profile.avatar_url ?? ""} placeholder="https://..." onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value || null })} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Incolla URL pubblico di un'immagine (es. da Imgur, Cloudinary)</p>
      </Field>

      <Field label="CV URL">
        <div className="flex items-center gap-3">
          {profile.cv_url && <a href={profile.cv_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline shrink-0">CV attuale</a>}
          <input className={inp} value={profile.cv_url ?? ""} placeholder="/cv.pdf o URL esterno" onChange={(e) => setProfile({ ...profile, cv_url: e.target.value || null })} />
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Tagline EN"><input className={inp} value={profile.tagline_en} onChange={(e) => setProfile({ ...profile, tagline_en: e.target.value })} /></Field>
        <Field label="Tagline IT"><input className={inp} value={profile.tagline_it} onChange={(e) => setProfile({ ...profile, tagline_it: e.target.value })} /></Field>
        <Field label="Bio EN"><textarea rows={4} className={inp} value={profile.bio_en} onChange={(e) => setProfile({ ...profile, bio_en: e.target.value })} /></Field>
        <Field label="Bio IT"><textarea rows={4} className={inp} value={profile.bio_it} onChange={(e) => setProfile({ ...profile, bio_it: e.target.value })} /></Field>
        <Field label="Location"><input className={inp} value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} /></Field>
        <Field label="Email"><input className={inp} value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Field>
      </div>

      <Field label="Link social (label · URL)">
        <div className="space-y-2">
          {profile.links.map((l, i) => (
            <div key={i} className="flex gap-2">
              <input className={inp} placeholder="Label" value={l.label} onChange={(e) => {
                const n = [...profile.links]; n[i] = { ...n[i], label: e.target.value }; setProfile({ ...profile, links: n });
              }} />
              <input className={inp} placeholder="URL" value={l.url} onChange={(e) => {
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
        <textarea rows={4} className={inp} value={profile.typing_en.join("\n")} onChange={(e) => setProfile({ ...profile, typing_en: e.target.value.split("\n") })} />
      </Field>
      <Field label="Frasi animate IT (una per riga)">
        <textarea rows={4} className={inp} value={profile.typing_it.join("\n")} onChange={(e) => setProfile({ ...profile, typing_it: e.target.value.split("\n") })} />
      </Field>
    </div>
  );
}

const inp = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}
