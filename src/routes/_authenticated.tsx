import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
  beforeLoad: async () => {
    // SSR-safe: only check on client. On server, render and let client guard handle it.
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login" });
    }
  },
});

const CLIENT_CATALOG_URL = "http://localhost:8080/catalogo";

function AuthenticatedLayout() {
  const { session, roles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/login" });
    }
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!loading && session && roles.includes("cliente")) {
      window.location.assign(CLIENT_CATALOG_URL);
    }
  }, [loading, session, roles]);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="text-muted-foreground text-sm">Cargando…</div>
      </div>
    );
  }

  return <AppShell />;
}
