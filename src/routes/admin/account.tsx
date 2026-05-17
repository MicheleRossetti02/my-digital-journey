import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { getCFAdminEmail } from "@/lib/kv.server";

export const Route = createFileRoute("/admin/account")({
  component: AccountPage,
});

const getAccountInfoFn = createServerFn({ method: "GET" }).handler(() => ({
  email: getCFAdminEmail() || "(non configurata)",
}));

function AccountPage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    getAccountInfoFn().then(({ email }) => setEmail(email));
  }, []);

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="text-xl font-semibold">Account</h1>

      {email === null ? (
        <p className="text-sm text-muted-foreground">Caricamento…</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Email admin: <strong>{email}</strong>
          </p>
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h2 className="text-sm font-semibold">Modifica credenziali</h2>
            <p className="text-sm text-muted-foreground">
              Email e password sono gestite come variabili d'ambiente su Cloudflare.
              Per modificarle, aggiorna{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">ADMIN_EMAIL</code> e{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">ADMIN_PASSWORD</code> in{" "}
              Cloudflare Pages → Settings → Environment variables, poi rideploya.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
