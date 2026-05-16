import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { statusLabels, formatCurrency } from "@/lib/format";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reportes")({
  component: ReportesPage,
});

const COLORS = ["oklch(0.84 0.18 145)", "oklch(0.65 0.2 252)", "oklch(0.75 0.15 200)", "oklch(0.7 0.18 60)", "oklch(0.65 0.22 320)", "oklch(0.6 0.2 25)"];

function ReportesPage() {
  const { data: clients } = useQuery({
    queryKey: ["clients-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: opps } = useQuery({
    queryKey: ["opps-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("opportunities").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const byStatus = Object.entries(statusLabels).map(([k, v]) => ({
    name: v,
    value: (clients ?? []).filter((c) => c.status === k).length,
  }));

  const total = clients?.length ?? 0;
  const closed = (clients ?? []).filter((c) => c.status === "cerrada" || c.status === "postventa").length;
  const conversion = total > 0 ? Math.round((closed / total) * 100) : 0;
  const revenue = (opps ?? [])
    .filter((o) => o.stage === "cerrada_ganada")
    .reduce((s, o) => s + Number(o.estimated_value ?? 0), 0);

  const exportCSV = () => {
    const rows = [
      ["Métrica", "Valor"],
      ["Clientes totales", String(total)],
      ["Cerradas + postventa", String(closed)],
      ["Tasa de conversión %", String(conversion)],
      ["Ingresos cerrados (PEN)", String(revenue)],
      [],
      ["Estado", "Cantidad"],
      ...byStatus.map((b) => [b.name, String(b.value)]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quantum-reporte-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reportes y analítica</h1>
          <p className="text-sm text-muted-foreground mt-1">Métricas clave del desempeño comercial</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="bg-secondary/50">
          <Download className="size-4" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-xl">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total de clientes</p>
          <p className="text-3xl font-semibold mt-2">{total}</p>
        </div>
        <div className="glass-card p-6 rounded-xl">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Cerradas</p>
          <p className="text-3xl font-semibold mt-2 text-brand-primary">{closed}</p>
        </div>
        <div className="glass-card p-6 rounded-xl">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Conversión</p>
          <p className="text-3xl font-semibold mt-2">{conversion}%</p>
        </div>
        <div className="glass-card p-6 rounded-xl">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Ingresos ganados</p>
          <p className="text-2xl font-semibold mt-2 text-brand-primary">{formatCurrency(revenue)}</p>
        </div>
      </div>

      <div className="glass-card p-6 rounded-xl">
        <h3 className="text-sm font-medium mb-4">Distribución por estado</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={100} innerRadius={60}>
              {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "oklch(0.205 0.005 285)",
                border: "1px solid oklch(0.3 0.005 285 / 0.5)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
