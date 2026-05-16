import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { statusLabels, statusBadgeClass, priorityLabels, timeAgo } from "@/lib/format";
import { ArrowLeft, Mail, Phone, MapPin, Car } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/clientes/$id")({
  component: ClientDetailPage,
});

function ClientDetailPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [type, setType] = useState<"nota" | "llamada" | "email" | "whatsapp" | "reunion">("nota");

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: interactions } = useQuery({
    queryKey: ["interactions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_interactions")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() || !user) return;
    const { error } = await supabase.from("client_interactions").insert({
      client_id: id,
      user_id: user.id,
      type,
      content: note.trim(),
    });
    if (error) { toast.error(error.message); return; }
    await supabase.from("clients").update({ last_contact_at: new Date().toISOString() }).eq("id", id);
    setNote("");
    qc.invalidateQueries({ queryKey: ["interactions", id] });
    qc.invalidateQueries({ queryKey: ["client", id] });
    toast.success("Interacción registrada");
  };

  const updateStatus = async (status: string) => {
    const { error } = await supabase.from("clients").update({ status: status as never }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["client", id] });
    toast.success("Estado actualizado");
  };

  if (isLoading) return <div className="text-muted-foreground text-sm">Cargando…</div>;
  if (!client) return <div className="text-muted-foreground text-sm">Cliente no encontrado</div>;

  return (
    <div className="space-y-6">
      <Link to="/clientes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver a clientes
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{client.full_name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusBadgeClass(client.status)}`}>
              {statusLabels[client.status]}
            </span>
            <span className="text-xs text-muted-foreground">Prioridad {priorityLabels[client.priority]}</span>
          </div>
        </div>
        <select
          value={client.status}
          onChange={(e) => updateStatus(e.target.value)}
          className="px-3 py-2 rounded-md bg-secondary/50 border border-border text-sm"
        >
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>Cambiar a: {v}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <h3 className="text-sm font-medium">Información de contacto</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="size-4" /> {client.email ?? "—"}
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Phone className="size-4" /> {client.phone ?? "—"}
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="size-4" /> {client.city ?? "—"}
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Car className="size-4" /> {client.vehicle_interest ?? "—"}
            </div>
          </div>
          {client.notes && (
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Observaciones</p>
              <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="glass-card p-6 rounded-xl lg:col-span-2 space-y-4">
          <h3 className="text-sm font-medium">Historial de interacciones</h3>

          <form onSubmit={addInteraction} className="space-y-3">
            <div className="flex gap-2">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="px-3 py-2 rounded-md bg-secondary/50 border border-border text-sm"
              >
                <option value="nota">Nota</option>
                <option value="llamada">Llamada</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="reunion">Reunión</option>
              </select>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Describe la interacción…"
                rows={2}
                className="flex-1 bg-secondary/50"
              />
            </div>
            <Button type="submit" size="sm" className="bg-brand-primary text-canvas hover:bg-brand-primary/90">
              Registrar
            </Button>
          </form>

          <div className="space-y-3 pt-2">
            {(interactions ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Aún no hay interacciones registradas</p>
            )}
            {(interactions ?? []).map((i) => (
              <div key={i.id} className="flex gap-3 pb-3 border-b border-border/50 last:border-0">
                <div className="size-2 rounded-full bg-brand-primary mt-2 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium uppercase tracking-wider text-brand-primary">{i.type}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(i.created_at)}</span>
                  </div>
                  <p className="text-sm">{i.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
