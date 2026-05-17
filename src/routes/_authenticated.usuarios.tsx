import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { roleLabels } from "@/lib/format";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/usuarios")({
  component: UsuariosPage,
});

type ProfileRow = { id: string; full_name: string | null; phone: string | null; created_at: string };
type RoleRow = { user_id: string; role: string };

function UsuariosPage() {
  const { hasRole } = useAuth();
  const qc = useQueryClient();

  const isAdmin = hasRole("admin");

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState("asesor");
  const [creating, setCreating] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      toast.error("Solo administradores pueden crear usuarios");
      return;
    }

    setCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: newEmail,
          password: newPassword,
          fullName: newFullName,
          role: newRole,
        },
      });

      if (error) throw error;

      toast.success("Usuario creado correctamente");

      setNewEmail("");
      setNewPassword("");
      setNewFullName("");
      setNewRole("asesor");
      setIsCreateUserModalOpen(false);

      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["roles"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el usuario");
    } finally {
      setCreating(false);
    }
  };

  const { data: profiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return (data ?? []) as RoleRow[];
    },
  });

  const changeRole = async (userId: string, newRole: string) => {
    // remove existing roles for this user
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) { toast.error(delErr.message); return; }
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as never });
    if (error) { toast.error(error.message); return; }
    toast.success("Rol actualizado");
    qc.invalidateQueries({ queryKey: ["roles"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios y roles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión del equipo interno
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsCreateUserModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-canvas hover:bg-brand-primary/90 transition-colors"
          >
            Nuevo usuario
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="glass-card p-4 rounded-lg text-sm text-muted-foreground">
          Solo administradores pueden modificar roles. Estás viendo en modo lectura.
        </div>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-secondary/30">
              <th className="px-6 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Rol actual</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cambiar rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {(profiles ?? []).map((p) => {
              const userRole = (roles ?? []).find((r) => r.user_id === p.id)?.role ?? "asesor";
              return (
                <tr key={p.id} className="hover:bg-secondary/20">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{p.full_name ?? "Sin nombre"}</div>
                    {p.phone && <div className="text-xs text-muted-foreground">{p.phone}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-secondary-soft text-brand-secondary border border-brand-secondary/30">
                      {roleLabels[userRole] ?? userRole}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {isAdmin ? (
                      <select
                        value={userRole}
                        onChange={(e) => changeRole(p.id, e.target.value)}
                        className="px-3 py-1.5 rounded-md bg-secondary/50 border border-border text-sm"
                      >
                        {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isAdmin && isCreateUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsCreateUserModalOpen(false)}
          />

          <form
            onSubmit={createUser}
            className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-canvas p-6 shadow-2xl space-y-5"
            autoComplete="off"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Crear usuario</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Registra un nuevo usuario interno y asígnale un rol dentro del sistema.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateUserModalOpen(false)}
                className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="admin-create-user-full-name"
                  className="text-sm font-medium text-foreground"
                >
                  Nombre completo
                </label>
                <input
                  id="admin-create-user-full-name"
                  name="admin-create-user-full-name"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Ej. Vanessa Canaviri"
                  autoComplete="off"
                  className="w-full px-3 py-2 rounded-md bg-secondary/50 border border-border text-sm outline-none focus:border-brand-primary"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="admin-create-user-email"
                  className="text-sm font-medium text-foreground"
                >
                  Correo electrónico
                </label>
                <input
                  id="admin-create-user-email"
                  name="admin-create-user-email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="correo@empresa.com"
                  type="email"
                  autoComplete="off"
                  className="w-full px-3 py-2 rounded-md bg-secondary/50 border border-border text-sm outline-none focus:border-brand-primary"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="admin-create-user-temporary-password"
                  className="text-sm font-medium text-foreground"
                >
                  Contraseña temporal
                </label>
                <input
                  id="admin-create-user-temporary-password"
                  name="admin-create-user-temporary-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  type="password"
                  autoComplete="new-password"
                  className="w-full px-3 py-2 rounded-md bg-secondary/50 border border-border text-sm outline-none focus:border-brand-primary"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="admin-create-user-role"
                  className="text-sm font-medium text-foreground"
                >
                  Rol del usuario
                </label>
                <select
                  id="admin-create-user-role"
                  name="admin-create-user-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  autoComplete="off"
                  className="w-full px-3 py-2 rounded-md bg-secondary/50 border border-border text-sm outline-none focus:border-brand-primary"
                >
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateUserModalOpen(false)}
                className="px-4 py-2 rounded-md border border-border bg-secondary/50 text-sm font-medium text-foreground hover:bg-secondary"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded-md bg-brand-primary text-canvas text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-60"
              >
                {creating ? "Creando..." : "Crear usuario"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
