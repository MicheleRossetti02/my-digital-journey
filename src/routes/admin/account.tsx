import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/account")({
  component: AccountPage,
});

function AccountPage() {
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function changePassword() {
    if (newPassword.length < 8) { setMsg("Min 8 caratteri"); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setMsg(error ? `Errore: ${error.message}` : "Password aggiornata ✓");
    setNewPassword("");
  }
  async function changeEmail() {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setMsg(error ? `Errore: ${error.message}` : "Email: controlla la nuova casella per confermare");
  }

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="text-xl font-semibold">Account</h1>
      <p className="text-sm text-muted-foreground">Email attuale: <strong>{email}</strong></p>
      {msg && <p className="text-xs">{msg}</p>}

      <div className="space-y-2 rounded-lg border border-border p-4">
        <h2 className="text-sm font-semibold">Cambia password</h2>
        <input type="password" placeholder="Nuova password (min 8)" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <button onClick={changePassword} className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">Aggiorna password</button>
      </div>

      <div className="space-y-2 rounded-lg border border-border p-4">
        <h2 className="text-sm font-semibold">Cambia email</h2>
        <input type="email" placeholder="Nuova email" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
        <button onClick={changeEmail} className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">Aggiorna email</button>
      </div>
    </div>
  );
}
