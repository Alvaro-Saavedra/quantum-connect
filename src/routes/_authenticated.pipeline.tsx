import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { statusLabels, statusBadgeClass } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/pipeline")({
  component: PipelinePage,
});

const COLUMNS: Array<{ key: string; label: string }> = [
  { key: "nuevo", label: "Nuevo" },
  { key: "en_seguimiento", label: "En seguimiento" },
  { key: "interesado", label: "Interesado" },
  { key: "negociacion", label: "Negociación" },
  { key: "cerrada", label: "Cerrada" },
  { key: "postventa", label: "Postventa" },
];

function PipelinePage() {
  const { data: clients } = useQuery({
    queryKey: ["clients-pipeline"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6 w-full min-w-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline comercial</h1>
        <p className="text-sm text-muted-foreground mt-1">Vista kanban del estado de cada cliente</p>
      </div>

      <div className="flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory hide-scrollbar w-full min-w-0">
        <style>{`
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        `}</style>
        {COLUMNS.map((col) => {
          const items = (clients ?? []).filter((c) => c.status === col.key);
          return (
            <div key={col.key} className="glass-card rounded-xl p-3 min-w-[280px] w-[280px] shrink-0 snap-start flex flex-col max-h-[calc(100vh-220px)] border border-border/50">
              <div className="flex items-center justify-between mb-3 px-2 shrink-0">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusBadgeClass(col.key)}`}>
                  {col.label}
                </span>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                {items.map((c) => (
                  <Link
                    key={c.id}
                    to="/clientes/$id"
                    params={{ id: c.id }}
                    className="block p-3 rounded-md bg-secondary/40 hover:bg-secondary/70 transition-colors border border-border/40"
                  >
                    <div className="text-sm font-medium text-foreground">{c.full_name}</div>
                    {c.vehicle_interest && (
                      <div className="text-xs text-muted-foreground mt-1">{c.vehicle_interest}</div>
                    )}
                    {c.city && <div className="text-[10px] text-muted-foreground mt-1">{c.city}</div>}
                  </Link>
                ))}
                {items.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4">Vacío</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Para mover un cliente entre etapas, abre su ficha y cambia el estado.
      </p>
    </div>
  );
}
