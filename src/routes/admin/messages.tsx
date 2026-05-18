import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { isSupabaseServiceConfigured, supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/admin/messages")({
  component: MessagesPage,
  head: () => ({ meta: [{ title: "Messaggi — Admin" }, { name: "robots", content: "noindex" }] }),
});

type Msg = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
};

const getMessagesFn = createServerFn({ method: "GET" }).handler(async () => {
  if (!isSupabaseServiceConfigured()) return { enabled: false as const, items: [] as Msg[] };
  const { data, error } = await supabaseAdmin
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return { enabled: true as const, items: (data ?? []) as Msg[] };
});

const toggleReadFn = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string; read: boolean } }) => {
    if (!isSupabaseServiceConfigured()) return;
    await supabaseAdmin.from("contact_messages").update({ read: data.read }).eq("id", data.id);
  });

const deleteMsgFn = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string } }) => {
    if (!isSupabaseServiceConfigured()) return;
    await supabaseAdmin.from("contact_messages").delete().eq("id", data.id);
  });

function MessagesPage() {
  const [items, setItems] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMessagesFn();
      setEnabled(data.enabled);
      setItems(data.items);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleRead(m: Msg) {
    await toggleReadFn({ data: { id: m.id, read: !m.read } });
    load();
  }

  async function remove(m: Msg) {
    if (!confirm(`Eliminare il messaggio di ${m.name}?`)) return;
    await deleteMsgFn({ data: { id: m.id } });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Messaggi ricevuti</h1>
        <button onClick={load} className="text-xs rounded-md border border-input px-3 py-1.5 hover:bg-accent">
          Aggiorna
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Caricamento…</p>
      ) : !enabled ? (
        <p className="text-sm text-muted-foreground">Messaggi disattivati: Supabase non è configurato in questo ambiente.</p>
      ) : error ? (
        <p className="text-sm text-destructive">Errore: {error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun messaggio.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((m) => (
            <li
              key={m.id}
              className={`rounded-lg border p-4 ${
                m.read ? "border-border bg-card" : "border-primary/40 bg-primary/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {m.name}{" "}
                    <a className="text-xs text-muted-foreground" href={`mailto:${m.email}`}>
                      &lt;{m.email}&gt;
                    </a>
                  </p>
                  {m.subject ? <p className="text-sm font-medium mt-0.5">{m.subject}</p> : null}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(m.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => toggleRead(m)} className="text-xs rounded-md border border-input px-2 py-1 hover:bg-accent">
                    {m.read ? "Segna non letto" : "Segna letto"}
                  </button>
                  <button onClick={() => remove(m)} className="text-xs rounded-md border border-destructive/40 text-destructive px-2 py-1 hover:bg-destructive/10">
                    Elimina
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/85">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
