import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type AuthMode = "login" | "register";
type AppRole = "admin" | "supervisor" | "asesor" | "soporte" | "cliente";

const CATALOG_URL = "/catalogo";

const VEHICLE_INTEREST_URL = "/catalogo?interes=vehiculo";

const loginSchema = z.object({
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
});

const registerSchema = z.object({
  fullName: z.string().min(2, "Nombre requerido").max(120),
  phone: z.string().min(4, "Teléfono requerido").max(30),
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
  city: z.string().max(80).optional(),
  vehicleInterest: z.string().max(120).optional(),
});

function LoginPage() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [vehicleInterest, setVehicleInterest] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const redirectAuthenticatedUser = async () => {
      if (!session?.user) return;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (error) {
        toast.error("No se pudo verificar el rol del usuario");
        return;
      }

      const roles = (data ?? []).map((item) => item.role as AppRole);

      if (roles.includes("cliente")) {
        navigate({ to: CATALOG_URL });
        return;
      }

      navigate({ to: "/dashboard" });
    };

    redirectAuthenticatedUser();
  }, [session, navigate]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
    setCity("");
    setVehicleInterest("");
  };

  const toggleMode = () => {
    setMode((currentMode) =>
      currentMode === "login" ? "register" : "login",
    );
    resetForm();
  };

  const submitLogin = async () => {
    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const userId = authData.user?.id;

    if (!userId) {
      throw new Error("No se pudo obtener el usuario autenticado");
    }

    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (rolesError) throw rolesError;

    const roles = (rolesData ?? []).map((item) => item.role as AppRole);

    toast.success("Bienvenido de vuelta");

    if (roles.includes("cliente")) {
      navigate({ to: CATALOG_URL });
      return;
    }

    navigate({ to: "/dashboard" });
  };

  const submitRegister = async () => {
    const parsed = registerSchema.safeParse({
      fullName,
      phone,
      email,
      password,
      city,
      vehicleInterest,
    });

    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    const normalizedVehicleInterest = vehicleInterest.trim();

    const { data, error } = await supabase.functions.invoke(
      "self-register-client",
      {
        body: {
          full_name: fullName,
          phone,
          email,
          password,
          city: city || null,
          vehicle_interest: normalizedVehicleInterest || null,
        },
      },
    );

    if (error) throw error;

    if (data?.error) {
      throw new Error(data.error);
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) throw loginError;

    toast.success("Registro completado correctamente");

    if (normalizedVehicleInterest) {
      window.location.assign(
        `${VEHICLE_INTEREST_URL}&vehiculo=${encodeURIComponent(
          normalizedVehicleInterest,
        )}`,
      );
      return;
    }

    navigate({ to: CATALOG_URL });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        await submitLogin();
      } else {
        await submitRegister();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error de autenticación",
      );
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = async () => {
    setLoading(true);

    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });

    if (result.error) {
      toast.error("No se pudo iniciar sesión con Google");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-foreground flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(158,255,137,0.12),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(90,200,250,0.08),_transparent_30%)]" />

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card/95 p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary text-canvas shadow-lg shadow-brand-primary/20">
            <Zap className="h-7 w-7" />
          </div>

          <p className="text-xl font-semibold">Quantum CRM</p>
          <p className="text-xs tracking-[0.35em] text-muted-foreground uppercase">
            Quantum Motors
          </p>

          <h1 className="mt-8 text-2xl font-semibold">
            {mode === "login" ? "Acceso al sistema" : "Registro de cliente"}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Ingresa con tu cuenta del equipo comercial o cliente"
              : "Crea tu cuenta para acceder al sistema "}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <Label htmlFor="fullName">Nombre completo *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Sofía Velásquez"
                  className="mt-1 bg-secondary/50"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. 70700000"
                  className="mt-1 bg-secondary/50"
                  required
                />
              </div>

              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej. Cochabamba"
                  className="mt-1 bg-secondary/50"
                />
              </div>

              <div>
                <Label htmlFor="vehicleInterest">
                  Vehículo de interés opcional
                </Label>
                <Input
                  id="vehicleInterest"
                  value={vehicleInterest}
                  onChange={(e) => setVehicleInterest(e.target.value)}
                  placeholder="Ej. Toyota Corolla"
                  className="mt-1 bg-secondary/50"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Si indicas un vehículo, te enviaremos a una página especial
                  para continuar tu solicitud.
                </p>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">
              {mode === "login" ? "Correo" : "Correo *"}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                mode === "login"
                  ? "tu@quantummotors.com"
                  : "tu-correo@gmail.com"
              }
              className="mt-1 bg-secondary/50"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Contraseña *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 bg-secondary/50"
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-canvas hover:bg-brand-primary/90"
          >
            {loading
              ? "Procesando…"
              : mode === "login"
                ? "Iniciar sesión"
                : "Registrarme como cliente"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? "¿Eres cliente nuevo?" : "¿Ya tienes cuenta?"}{" "}
          <button
            type="button"
            onClick={toggleMode}
            className="font-medium text-brand-primary hover:underline"
          >
            {mode === "login" ? "Regístrate aquí" : "Inicia sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}