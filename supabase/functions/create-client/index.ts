import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type AppRole = "admin" | "supervisor" | "asesor" | "soporte" | "cliente";

type CreateClientPayload = {
  full_name: string;
  phone: string;
  email: string;
  city?: string | null;
  vehicle_interest?: string | null;
  status?: string;
  priority?: string;
  notes?: string | null;
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

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buildDefaultPassword(fullName: string, phone: string): string {
  const firstName = normalizeText(fullName).split(/\s+/)[0] || "cliente";
  const cleanPhone = phone.replace(/\D/g, "");

  return `${firstName}.${cleanPhone}`;
}

function validatePayload(payload: CreateClientPayload): string | null {
  if (!payload.full_name || payload.full_name.trim().length < 2) {
    return "El nombre completo del cliente es obligatorio";
  }

  if (!payload.email || !payload.email.includes("@")) {
    return "El correo del cliente es obligatorio y debe ser válido";
  }

  if (!payload.phone || payload.phone.replace(/\D/g, "").length < 4) {
    return "El teléfono del cliente es obligatorio y debe tener al menos 4 dígitos";
  }

  return null;
}

async function sendCredentialsEmail(params: {
  to: string;
  fullName: string;
  email: string;
  password: string;
}) {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  const fromEmail = Deno.env.get("BREVO_FROM_EMAIL");
  const fromName = Deno.env.get("BREVO_FROM_NAME") ?? "Quantum Connect";

  if (!brevoApiKey || !fromEmail) {
    throw new Error(
      "Faltan secretos BREVO_API_KEY o BREVO_FROM_EMAIL en Supabase",
    );
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": brevoApiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: fromName,
        email: fromEmail,
      },
      to: [
        {
          email: params.to,
          name: params.fullName,
        },
      ],
      subject: "Credenciales de acceso - Quantum Connect",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Bienvenido/a a Quantum Connect</h2>

          <p>Hola ${params.fullName},</p>

          <p>Tu cuenta de cliente fue creada correctamente. Puedes ingresar con las siguientes credenciales:</p>

          <div style="background: #f4f4f4; padding: 16px; border-radius: 8px;">
            <p><strong>Usuario:</strong> ${params.email}</p>
            <p><strong>Contraseña:</strong> ${params.password}</p>
          </div>

          <p>Por favor conserva estos datos de acceso.</p>

          <p>Saludos,<br/>Equipo Quantum Connect</p>
        </div>
      `,
      textContent: `
Bienvenido/a a Quantum Connect

Hola ${params.fullName},

Tu cuenta de cliente fue creada correctamente.

Usuario: ${params.email}
Contraseña: ${params.password}

Saludos,
Equipo Quantum Connect
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`No se pudo enviar el correo: ${errorText}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método no permitido" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return jsonResponse({ error: "No autorizado" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse(
        { error: "Faltan variables de entorno de Supabase" },
        500,
      );
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Sesión inválida" }, 401);
    }

    const { data: roles, error: rolesError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError) {
      return jsonResponse({ error: rolesError.message }, 400);
    }

    const currentRoles = (roles ?? []).map((item) => item.role as AppRole);
    const canCreateClient =
      currentRoles.includes("admin") ||
      currentRoles.includes("supervisor") ||
      currentRoles.includes("asesor");

    if (!canCreateClient) {
      return jsonResponse(
        { error: "No tienes permisos para crear clientes" },
        403,
      );
    }

    const payload = (await req.json()) as CreateClientPayload;
    const validationError = validatePayload(payload);

    if (validationError) {
      return jsonResponse({ error: validationError }, 400);
    }

    const fullName = payload.full_name.trim();
    const email = payload.email.trim().toLowerCase();
    const phone = payload.phone.trim();
    const password = buildDefaultPassword(fullName, phone);

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
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone,
        },
      });

    if (createUserError || !createdUser.user) {
      return jsonResponse(
        { error: createUserError?.message ?? "No se pudo crear el usuario" },
        400,
      );
    }

    const clientAuthUserId = createdUser.user.id;

    const { error: deleteRoleError } = await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", clientAuthUserId);

    if (deleteRoleError) {
      return jsonResponse({ error: deleteRoleError.message }, 400);
    }

    const { error: insertRoleError } = await adminClient
      .from("user_roles")
      .insert({
        user_id: clientAuthUserId,
        role: "cliente",
      });

    if (insertRoleError) {
      return jsonResponse({ error: insertRoleError.message }, 400);
    }

    const { data: createdClient, error: createClientError } = await adminClient
      .from("clients")
      .insert({
        auth_user_id: clientAuthUserId,
        full_name: fullName,
        email,
        phone,
        city: payload.city || null,
        vehicle_interest: payload.vehicle_interest || null,
        status: payload.status || "nuevo",
        priority: payload.priority || "media",
        notes: payload.notes || null,
        created_by: user.id,
        assigned_to: user.id,
      })
      .select()
      .single();

    if (createClientError) {
      await adminClient.auth.admin.deleteUser(clientAuthUserId);

      return jsonResponse(
        {
          error:
            "Se creó el usuario Auth, pero falló el registro del cliente. El usuario fue revertido.",
          detail: createClientError.message,
        },
        400,
      );
    }

    await sendCredentialsEmail({
      to: email,
      fullName,
      email,
      password,
    });

    return jsonResponse({
      client: createdClient,
      message: "Cliente creado y credenciales enviadas correctamente",
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Error inesperado",
      },
      500,
    );
  }
});