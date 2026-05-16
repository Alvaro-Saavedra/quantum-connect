import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { statusLabels, statusBadgeClass, formatCurrency, timeAgo } from "@/lib/format";
import { Link } from "@tanstack/react-router";
import { TrendingUp, Users, MessageSquare, Target } from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: clients } = useQuery({
    queryKey: ["clients-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: opps } = useQuery({
    queryKey: ["opportunities-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("opportunities").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const newToday = (clients ?? []).filter((c) => new Date(c.created_at) >= today).length;
  const activeLeads = (clients ?? []).filter((c) => !["cerrada", "postventa"].includes(c.status)).length;
  const closed = (opps ?? []).filter((o) => o.stage === "cerrada_ganada");
  const totalRevenue = closed.reduce((sum, o) => sum + Number(o.estimated_value ?? 0), 0);
  const conversionRate =
    opps && opps.length > 0 ? Math.round((closed.length / opps.length) * 100) : 0;

  const funnelData = [
    { stage: "Prospección", value: (opps ?? []).filter((o) => o.stage === "prospeccion").length },
    { stage: "Contacto", value: (opps ?? []).filter((o) => o.stage === "contacto").length },
    { stage: "Interesado", value: (opps ?? []).filter((o) => o.stage === "interesado").length },
    { stage: "Negociación", value: (opps ?? []).filter((o) => o.stage === "negociacion").length },
    { stage: "Ganada", value: closed.length },
  ];

  const recent = (clients ?? []).slice(0, 6);

  const kpis = [
    { label: "Clientes nuevos hoy", value: newToday, delta: "+12%", icon: Users, color: "brand-primary" },
    { label: "Leads activos", value: activeLeads, delta: "+5%", icon: TrendingUp, color: "brand-secondary" },
    { label: "Conversaciones", value: 0, delta: "—", icon: MessageSquare, color: "brand-secondary" },
    { label: "Conversión", value: `${conversionRate}%`, delta: formatCurrency(totalRevenue), icon: Target, color: "brand-primary" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Panel de control</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen comercial del equipo Quantum Motors
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((k) => (
          <div key={k.label} className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{k.label}</p>
              <k.icon className={`size-4 text-${k.color}`} />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-foreground">{k.value}</span>
              <span className={`text-xs font-medium text-${k.color}`}>{k.delta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Funnel + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-sm font-medium text-foreground mb-6">Embudo de ventas</h3>
          <div className="space-y-3">
            {funnelData.map((f, i) => {
              const max = Math.max(...funnelData.map((x) => x.value), 1);
              const width = (f.value / max) * 100;
              return (
                <div key={f.stage}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{f.stage}</span>
                    <span className="font-medium">{f.value}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={i === funnelData.length - 1 ? "h-full bg-brand-primary" : "h-full bg-brand-secondary/60"}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl lg:col-span-2">
          <h3 className="text-sm font-medium text-foreground mb-6">Actividad comercial</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={funnelData}>
              <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "oklch(0.65 0.01 285)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.205 0.005 285)",
                  border: "1px solid oklch(0.3 0.005 285 / 0.5)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {funnelData.map((_, i) => (
                  <Cell key={i} fill={i === funnelData.length - 1 ? "oklch(0.84 0.18 145)" : "oklch(0.65 0.2 252)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent clients */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Clientes recientes</h3>
          <Link to="/clientes" className="text-xs text-muted-foreground hover:text-foreground">
            Ver todo →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/30">
                <th className="px-6 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Vehículo</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ciudad</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Últ. contacto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    Aún no hay clientes. <Link to="/clientes/nuevo" className="text-brand-primary hover:underline">Crear el primero →</Link>
                  </td>
                </tr>
              )}
              {recent.map((c) => (
                <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4">
                    <Link to="/clientes/$id" params={{ id: c.id }} className="text-sm font-medium text-foreground hover:text-brand-primary">
                      {c.full_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{c.vehicle_interest ?? "—"}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{c.city ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusBadgeClass(c.status)}`}>
                      {statusLabels[c.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{timeAgo(c.last_contact_at ?? c.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
