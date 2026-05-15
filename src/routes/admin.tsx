import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { checkAuthFn } from "@/lib/auth.server";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Admin" }, { name: "robots", content: "noindex" }] }),
});

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    checkAuthFn().then(({ authed }) => {
      if (!authed) {
        navigate({ to: "/login" });
      } else {
        setAuthed(true);
        setChecking(false);
      }
    });
  }, [navigate]);

  function logout() {
    // Clear the session cookie
    document.cookie = "admin_session=; Path=/; Max-Age=0";
    navigate({ to: "/login" });
  }

  if (checking || !authed) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Caricamento…</div>;
  }

  const tabs = [
    { to: "/admin", label: "Profilo", exact: true },
    { to: "/admin/sections", label: "Sezioni" },
    { to: "/admin/github", label: "GitHub" },
    { to: "/admin/messages", label: "Messaggi" },
    { to: "/admin/account", label: "Account" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm font-semibold">← Torna al sito</Link>
            <nav className="flex gap-4 text-sm">
              {tabs.map((t) => {
                const active = t.exact ? location.pathname === t.to : location.pathname.startsWith(t.to);
                return (
                  <Link key={t.to} to={t.to} className={active ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}>
                    {t.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <button onClick={logout} className="text-xs rounded-md border border-input px-3 py-1.5 hover:bg-accent">
            Logout
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
