import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  phone: z.string().min(4, "Teléfono requerido").max(30),
  email: z.string().email("Email inválido").max(255),
  city: z.string().max(80).optional().or(z.literal("")),
  vehicle_interest: z.string().max(120).optional().or(z.literal("")),
  status: z.string(),
  priority: z.string(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

function NewClientPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const submit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const parsed = schema.safeParse(form);

    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-client", {
        body: JSON.stringify({
          full_name: form.full_name,
          phone: form.phone,
          email: form.email,
          city: form.city || null,
          vehicle_interest: form.vehicle_interest || null,
          status: form.status,
          priority: form.priority,
          notes: form.notes || null,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      await queryClient.invalidateQueries({ queryKey: ["clients"] });

      toast.success("Cliente creado y credenciales enviadas por correo");

      navigate({
        to: "/clientes/$id",
        params: {
          id: data.client.id,
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el cliente");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <Link
        to="/clientes"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a clientes
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Nuevo cliente</h1>
        <p className="text-muted-foreground">
          Registra un nuevo contacto en el CRM. Se creará también su usuario de acceso y se enviarán
          sus credenciales por correo.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5 rounded-xl border border-border bg-card p-6">
        <div>
          <Label htmlFor="full_name">Nombre completo *</Label>
          <Input
            id="full_name"
            value={form.full_name}
            onChange={(e) =>
              setForm({
                ...form,
                full_name: e.target.value,
              })
            }
            className="mt-1 bg-secondary/50"
            autoComplete="off"
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Teléfono *</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value,
              })
            }
            className="mt-1 bg-secondary/50"
            autoComplete="off"
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Se usará para generar la contraseña inicial con formato nombre.telefono.
          </p>
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
            className="mt-1 bg-secondary/50"
            autoComplete="off"
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Este correo será el usuario de inicio de sesión del cliente.
          </p>
        </div>

        <div>
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            value={form.city}
            onChange={(e) =>
              setForm({
                ...form,
                city: e.target.value,
              })
            }
            className="mt-1 bg-secondary/50"
            autoComplete="off"
          />
        </div>

        <div>
          <Label htmlFor="vehicle_interest">Vehículo de interés</Label>
          <Input
            id="vehicle_interest"
            value={form.vehicle_interest}
            onChange={(e) =>
              setForm({
                ...form,
                vehicle_interest: e.target.value,
              })
            }
            className="mt-1 bg-secondary/50"
            autoComplete="off"
          />
        </div>

        <div>
          <Label htmlFor="status">Estado</Label>
          <select
            id="status"
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as typeof form.status,
              })
            }
            className="mt-1 w-full px-3 py-2 rounded-md bg-secondary/50 border border-border text-sm"
          >
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="priority">Prioridad</Label>
          <select
            id="priority"
            value={form.priority}
            onChange={(e) =>
              setForm({
                ...form,
                priority: e.target.value as typeof form.priority,
              })
            }
            className="mt-1 w-full px-3 py-2 rounded-md bg-secondary/50 border border-border text-sm"
          >
            {Object.entries(priorityLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="notes">Observaciones internas</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) =>
              setForm({
                ...form,
                notes: e.target.value,
              })
            }
            className="mt-1 bg-secondary/50"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="bg-brand-primary text-canvas hover:bg-brand-primary/90"
          >
            {saving ? "Creando cliente…" : "Crear cliente"}
          </Button>

          <Button type="button" variant="ghost" onClick={() => navigate({ to: "/clientes" })}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
