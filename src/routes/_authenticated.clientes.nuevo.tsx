import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { statusLabels, priorityLabels } from "@/lib/format";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/clientes/nuevo")({
  component: NewClientPage,
});

const schema = z.object({
  full_name: z.string().min(2, "Nombre requerido").max(120),
  phone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email("Email inválido").max(255).optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  vehicle_interest: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

function NewClientPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    city: "",
    vehicle_interest: "",
    status: "nuevo" as const,
    priority: "media" as const,
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (!user) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("clients")
      .insert({
        ...form,
        email: form.email || null,
        phone: form.phone || null,
        city: form.city || null,
        vehicle_interest: form.vehicle_interest || null,
        notes: form.notes || null,
        created_by: user.id,
        assigned_to: user.id,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cliente creado");
    navigate({ to: "/clientes/$id", params: { id: data.id } });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Link to="/clientes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver a clientes
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo cliente</h1>
        <p className="text-sm text-muted-foreground mt-1">Registra un nuevo contacto en el CRM</p>
      </div>

      <form onSubmit={submit} className="glass-card p-6 rounded-xl space-y-4">
        <div>
          <Label htmlFor="full_name">Nombre completo *</Label>
          <Input id="full_name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1 bg-secondary/50" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 bg-secondary/50" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 bg-secondary/50" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1 bg-secondary/50" />
          </div>
          <div>
            <Label htmlFor="vehicle_interest">Vehículo de interés</Label>
            <Input id="vehicle_interest" placeholder="Ej. Quantum E4 Max" value={form.vehicle_interest} onChange={(e) => setForm({ ...form, vehicle_interest: e.target.value })} className="mt-1 bg-secondary/50" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status">Estado</Label>
            <select id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })} className="mt-1 w-full px-3 py-2 rounded-md bg-secondary/50 border border-border text-sm">
              {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="priority">Prioridad</Label>
            <select id="priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as typeof form.priority })} className="mt-1 w-full px-3 py-2 rounded-md bg-secondary/50 border border-border text-sm">
              {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Observaciones internas</Label>
          <Textarea id="notes" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 bg-secondary/50" />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving} className="bg-brand-primary text-canvas hover:bg-brand-primary/90">
            {saving ? "Guardando…" : "Crear cliente"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate({ to: "/clientes" })}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
