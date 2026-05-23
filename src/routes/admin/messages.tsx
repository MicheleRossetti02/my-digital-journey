import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import {
  kvGetMessages,
  kvUpdateMessage,
  kvDeleteMessage,
  type ContactMessage,
} from "@/lib/kv.server";

export const Route = createFileRoute("/admin/messages")({
  component: MessagesPage,
  head: () => ({ meta: [{ title: "Messaggi — Admin" }, { name: "robots", content: "noindex" }] }),
});

const getMessagesFn = createServerFn({ method: "GET" }).handler(() => kvGetMessages());

const toggleReadFn = createServerFn({ method: "POST" }).handler(
  ({ data }: { data: { id: string; read: boolean } }) =>
    kvUpdateMessage(data.id, { read: data.read }),
);

const deleteMsgFn = createServerFn({ method: "POST" }).handler(
  ({ data }: { data: { id: string } }) => kvDeleteMessage(data.id),
);

function MessagesPage() {
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await getMessagesFn());
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleRead(m: ContactMessage) {
    await toggleReadFn({ data: { id: m.id, read: !m.read } });
    load();
  }

  async function remove(m: ContactMessage) {
    if (!confirm(`Eliminare il messaggio di ${m.name}?`)) return;
    await deleteMsgFn({ data: { id: m.id } });
    load();
  }

  const unread = items.filter((m) => !m.read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Messaggi ricevuti</h1>
          {unread > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {unread} non {unread === 1 ? "letto" : "letti"}
            </p>
          )}
        </div>
        <button
          onClick={load}
          className="text-xs rounded-md border border-input px-3 py-1.5 hover:bg-accent"
        >
          Aggiorna
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Caricamento…</p>
      ) : error ? (
        <p className="text-sm text-destructive">Errore: {error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun messaggio ancora.</p>
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
                    {!m.read && (
                      <span className="ml-2 inline-block w-2 h-2 rounded-full bg-primary align-middle" />
                    )}
                  </p>
                  {m.subject ? <p className="text-sm font-medium mt-0.5">{m.subject}</p> : null}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(m.created_at).toLocaleString("it-IT")}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => toggleRead(m)}
                    className="text-xs rounded-md border border-input px-2 py-1 hover:bg-accent"
                  >
                    {m.read ? "Segna non letto" : "Segna letto"}
                  </button>
                  <a
                    href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || "Il tuo messaggio")}`}
                    className="text-xs rounded-md border border-input px-2 py-1 hover:bg-accent"
                  >
                    Rispondi
                  </a>
                  <button
                    onClick={() => remove(m)}
                    className="text-xs rounded-md border border-destructive/40 text-destructive px-2 py-1 hover:bg-destructive/10"
                  >
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
