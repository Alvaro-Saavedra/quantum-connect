import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { roleLabels } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/usuarios")({
  component: UsuariosPage,
});

type ProfileRow = { id: string; full_name: string | null; phone: string | null; created_at: string };
type RoleRow = { user_id: string; role: string };

function UsuariosPage() {
  const { hasRole } = useAuth();
  const qc = useQueryClient();

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

  const isAdmin = hasRole("admin");

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios y roles</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestión del equipo interno</p>
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
    </div>
  );
}
