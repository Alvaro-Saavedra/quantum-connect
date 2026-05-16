import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  BarChart3,
  UserCog,
  Plug,
  Search,
  Bell,
  LogOut,
  Plus,
  Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/pipeline", label: "Pipeline", icon: TrendingUp },
  { to: "/reportes", label: "Reportes", icon: BarChart3 },
  { to: "/usuarios", label: "Usuarios", icon: UserCog, staffOnly: true },
  { to: "/integraciones", label: "Integraciones", icon: Plug },
];

export function AppShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, isStaff, signOut } = useAuth();

  const initials = (user?.user_metadata?.full_name ?? user?.email ?? "U")
    .split(" ")
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-canvas text-foreground">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-border bg-sidebar z-50 hidden lg:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="size-9 bg-brand-primary rounded-md flex items-center justify-center shadow-[0_0_20px_oklch(0.84_0.18_145_/_0.4)]">
            <Zap className="size-5 text-canvas" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-foreground font-semibold tracking-tight">Quantum CRM</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Motors</div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2">
          {nav
            .filter((item) => !item.staffOnly || isStaff)
            .map((item) => {
              const active = path === item.to || path.startsWith(item.to + "/");
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    active
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="size-9 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
              {initials}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-foreground truncate">
                {user?.user_metadata?.full_name ?? user?.email}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isStaff ? "Staff" : "Asesor"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await signOut();
                navigate({ to: "/login" });
              }}
              className="size-8 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:pl-64">
        <header className="sticky top-0 z-40 h-16 border-b border-border bg-canvas/80 backdrop-blur-xl">
          <div className="h-full px-8 flex items-center justify-between gap-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes, oportunidades…"
                className="pl-10 bg-secondary/50 border-border h-9"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Bell className="size-5" />
              </Button>
              <Button
                onClick={() => navigate({ to: "/clientes/nuevo" })}
                className="bg-brand-primary text-canvas hover:bg-brand-primary/90 font-medium"
              >
                <Plus className="size-4" />
                Nuevo Cliente
              </Button>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto animate-[fade-in_0.3s_ease-out]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
