import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RegisterClientPayload = {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  city?: string | null;
  vehicle_interest?: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function normalizeOptionalText(value?: string | null): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function validatePayload(payload: RegisterClientPayload): string | null {
  if (!payload.full_name || payload.full_name.trim().length < 2) {
    return "El nombre completo es obligatorio";
  }

  if (!payload.email || !payload.email.includes("@")) {
    return "El correo es obligatorio y debe ser válido";
  }

  if (!payload.phone || payload.phone.replace(/\D/g, "").length < 4) {
    return "El teléfono es obligatorio y debe tener al menos 4 dígitos";
  }

  if (!payload.password || payload.password.length < 6) {
    return "La contraseña debe tener al menos 6 caracteres";
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método no permitido" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        { error: "Faltan variables de entorno de Supabase" },
        500,
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const payload = (await req.json()) as RegisterClientPayload;

    const validationError = validatePayload(payload);

    if (validationError) {
      return jsonResponse({ error: validationError }, 400);
    }

    const fullName = payload.full_name.trim();
    const phone = payload.phone.trim();
    const email = payload.email.trim().toLowerCase();
    const vehicleInterest = normalizeOptionalText(payload.vehicle_interest);
    const city = normalizeOptionalText(payload.city);

    const { data: existingClient } = await adminClient
      .from("clients")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (existingClient) {
      return jsonResponse(
        { error: "Ya existe un cliente registrado con ese correo" },
        409,
      );
    }

    const { data: createdUser, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email,
        password: payload.password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone,
          role: "cliente",
        },
      });

    if (createUserError || !createdUser.user) {
      return jsonResponse(
        {
          error:
            createUserError?.message ?? "No se pudo crear el usuario cliente",
        },
        400,
      );
    }

    const authUserId = createdUser.user.id;

    const { error: insertRoleError } = await adminClient
      .from("user_roles")
      .insert({
        user_id: authUserId,
        role: "cliente",
      });

    if (insertRoleError) {
      await adminClient.auth.admin.deleteUser(authUserId);

      return jsonResponse(
        {
          error:
            "Se creó el usuario Auth, pero no se pudo asignar el rol cliente",
          detail: insertRoleError.message,
        },
        400,
      );
    }

    const { data: createdClient, error: createClientError } = await adminClient
      .from("clients")
      .insert({
        auth_user_id: authUserId,
        full_name: fullName,
        phone,
        email,
        city,
        vehicle_interest: vehicleInterest,
        status: vehicleInterest ? "interesado" : "nuevo",
        priority: vehicleInterest ? "media" : "baja",
        notes: vehicleInterest
          ? `Cliente auto-registrado con interés en: ${vehicleInterest}`
          : "Cliente auto-registrado desde el formulario público.",
      })
      .select()
      .single();

    if (createClientError) {
      await adminClient.from("user_roles").delete().eq("user_id", authUserId);
      await adminClient.auth.admin.deleteUser(authUserId);

      return jsonResponse(
        {
          error:
            "Se creó el usuario Auth, pero falló el registro en la tabla clients",
          detail: createClientError.message,
        },
        400,
      );
    }

    return jsonResponse({
      userId: authUserId,
      client: createdClient,
      hasVehicleInterest: Boolean(vehicleInterest),
      message: "Cliente registrado correctamente",
    });
  } catch (error) {
    console.error("Error en self-register-client:", error);

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Error inesperado",
      },
      500,
    );
  }
});