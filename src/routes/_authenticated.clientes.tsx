import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { statusLabels, statusBadgeClass, priorityLabels, timeAgo } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/clientes")({
  component: ClientesPage,
});

function ClientesPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (clients ?? []).filter((c) => {
    const matchesQuery =
      !query ||
      c.full_name.toLowerCase().includes(query.toLowerCase()) ||
      c.email?.toLowerCase().includes(query.toLowerCase()) ||
      c.phone?.includes(query);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} {filtered.length === 1 ? "registro" : "registros"}
          </p>
        </div>
        <Button asChild className="bg-brand-primary text-canvas hover:bg-brand-primary/90">
          <Link to="/clientes/nuevo">Nuevo cliente</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o teléfono…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 bg-secondary/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-md bg-secondary/50 border border-border text-sm"
        >
          <option value="all">Todos los estados</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/30">
                <th className="px-6 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Vehículo</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Prioridad</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Actualizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">Cargando…</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">Sin resultados</td></tr>
              )}
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4">
                    <Link to="/clientes/$id" params={{ id: c.id }} className="text-sm font-medium text-foreground hover:text-brand-primary">
                      {c.full_name}
                    </Link>
                    {c.city && <div className="text-xs text-muted-foreground">{c.city}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    <div>{c.email ?? "—"}</div>
                    <div className="text-xs">{c.phone ?? ""}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{c.vehicle_interest ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusBadgeClass(c.status)}`}>
                      {statusLabels[c.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{priorityLabels[c.priority]}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{timeAgo(c.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
