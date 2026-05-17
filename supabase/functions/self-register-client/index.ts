import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RegisterClientPayload = {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  city: string;
  vehicle_interest?: string | null;
};

const allowedCities = [
  "Cochabamba",
  "La Paz",
  "Santa Cruz",
  "El Alto",
  "Yacuiba",
  "Oruro",
] as const;

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

  return normalized || null;
}

function validatePayload(payload: RegisterClientPayload): string | null {
  if (!payload.full_name || payload.full_name.trim().length < 2) {
    return "El nombre completo es obligatorio";
  }

  if (!payload.email?.includes("@")) {
    return "El correo es obligatorio y debe ser válido";
  }

  if (!payload.phone || payload.phone.replace(/\D/g, "").length < 4) {
    return "El teléfono es obligatorio y debe tener al menos 4 dígitos";
  }

  if (!payload.password || payload.password.length < 6) {
    return "La contraseña debe tener al menos 6 caracteres";
  }

  if (!payload.city || !allowedCities.includes(payload.city as typeof allowedCities[number])) {
    return "La ciudad es obligatoria y debe ser una de las opciones válidas";
  }

  return null;
}

function normalizeAdvisorName(userMetadata: any, email: string | null): string {
  if (userMetadata?.full_name?.trim()) {
    return String(userMetadata.full_name).trim();
  }

  return email || "Asesor";
}

type AdvisorStats = {
  id: string;
  clientsCount: number;
  locationMatches: number;
  city: string | null;
  full_name: string | null;
};

function createAdvisorStats(advisorIds: string[]) {
  return new Map(
    advisorIds.map((advisorId) => [
      advisorId,
      {
        id: advisorId,
        clientsCount: 0,
        locationMatches: 0,
        city: null,
        full_name: null,
      },
    ] as const),
  );
}

function sortAdvisorIdsByLoad(advisorStats: Map<string, AdvisorStats>, advisorIds: string[]) {
  return [...advisorIds].sort((a, b) => {
    const statA = advisorStats.get(a);
    const statB = advisorStats.get(b);

    if (!statA || !statB) {
      return 0;
    }

    if (statA.clientsCount !== statB.clientsCount) {
      return statA.clientsCount - statB.clientsCount;
    }

    return a.localeCompare(b);
  });
}

function countAdvisorClients(
  clients: Array<{ assigned_to: string | null } | null> | null | undefined,
  advisorStats: Map<string, AdvisorStats>,
) {
  for (const client of clients ?? []) {
    const assignedTo = client?.assigned_to;

    if (!assignedTo || !advisorStats.has(assignedTo)) {
      continue;
    }

    const stats = advisorStats.get(assignedTo);
    if (!stats) continue;

    stats.clientsCount += 1;
  }
}

function applyAdvisorProfiles(
  advisorProfiles: Array<{ id: string | null; full_name: string | null; city?: string | null } | null> | null | undefined,
  advisorStats: Map<string, AdvisorStats>,
  normalizedCity: string | null,
) {
  for (const advisorProfile of advisorProfiles ?? []) {
    const advisorId = advisorProfile?.id;
    if (!advisorId) continue;

    const stats = advisorStats.get(advisorId);
    if (!stats) continue;

    const advisorCity = advisorProfile.city?.trim().toLowerCase() || null;
    stats.city = advisorCity;
    if (normalizedCity && advisorCity === normalizedCity) {
      stats.locationMatches = 1;
    }
    stats.full_name = advisorProfile.full_name?.trim() || null;
  }
}

function chooseAdvisorIds(
  advisorStats: Map<string, AdvisorStats>,
  advisorIds: string[],
) {
  const candidateAdvisorIds = [...advisorStats.values()]
    .filter((stats) => stats.locationMatches > 0)
    .map((stats) => stats.id);

  const chosenAdvisorIds =
    candidateAdvisorIds.length > 0 ? candidateAdvisorIds : advisorIds;

  return sortAdvisorIdsByLoad(advisorStats, chosenAdvisorIds);
}

async function selectBestAdvisor(
  adminClient: ReturnType<typeof createClient>,
  clientCity?: string | null,
) {
  const { data: advisorRoles, error: advisorRolesError } = await adminClient
    .from("user_roles")
    .select("user_id")
    .eq("role", "asesor");

  if (advisorRolesError || !advisorRoles?.length) {
    console.error("Error obteniendo roles de asesor:", advisorRolesError);
    return null;
  }

  const advisorIds = advisorRoles
    .map((item) => item.user_id)
    .filter((advisorId): advisorId is string => Boolean(advisorId));

  if (!advisorIds.length) {
    return null;
  }

  const { data: clients, error: clientsError } = await adminClient
    .from("clients")
    .select("assigned_to")
    .in("assigned_to", advisorIds);

  if (clientsError) {
    console.error("Error obteniendo clientes para asignación de asesor:", clientsError);
  }

  const advisorStats = createAdvisorStats(advisorIds);
  countAdvisorClients(clients, advisorStats);

  let advisorProfiles: Array<{ id: string | null; full_name: string | null; city?: string | null }> = [];
  const { data: advisorProfilesData, error: advisorProfilesError } = await adminClient
    .from("profiles")
    .select("id, full_name, city")
    .in("id", advisorIds);

  if (advisorProfilesError) {
    console.error("Error obteniendo perfiles de asesores:", advisorProfilesError);
  } else {
    advisorProfiles = advisorProfilesData ?? [];
  }

  const { data: advisorAuthUsers, error: advisorAuthUsersError } = await adminClient
    .from("auth.users")
    .select("id, user_metadata")
    .in("id", advisorIds);

  if (advisorAuthUsersError) {
    console.error("Error obteniendo usuarios auth de asesores:", advisorAuthUsersError);
  }

  const advisorAuthUsersById = new Map(
    (advisorAuthUsers ?? []).map((user) => [user.id, user] as const),
  );

  advisorProfiles = advisorIds.map((advisorId) => {
    const profile = advisorProfiles.find((item) => item?.id === advisorId) ?? null;
    const authUser = advisorAuthUsersById.get(advisorId);
    const authCity = authUser?.user_metadata?.city;
    const authFullName = authUser?.user_metadata?.full_name;

    return {
      id: advisorId,
      full_name:
        profile?.full_name?.trim() ||
        (typeof authFullName === "string" ? authFullName.trim() : null) ||
        null,
      city:
        profile?.city?.trim() ||
        (typeof authCity === "string" ? authCity.trim() : null) ||
        null,
    };
  });

  const normalizedCity = clientCity?.trim().toLowerCase() || null;
  applyAdvisorProfiles(advisorProfiles, advisorStats, normalizedCity);

  const chosenAdvisorIds = chooseAdvisorIds(advisorStats, advisorIds);
  const selectedAdvisorId = chosenAdvisorIds[0];
  const selectedAdvisorStats = advisorStats.get(selectedAdvisorId);

  if (!selectedAdvisorStats) {
    return null;
  }

  return {
    id: selectedAdvisorStats.id,
    email: null,
    full_name: selectedAdvisorStats.full_name || "Asesor",
  };
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

    let payload: RegisterClientPayload;
    try {
      payload = (await req.json()) as RegisterClientPayload;
    } catch (parseError) {
      console.error("Invalid JSON payload:", parseError);
      return jsonResponse(
        { error: "JSON inválido en el cuerpo de la solicitud" },
        400,
      );
    }

    const validationError = validatePayload(payload);

    if (validationError) {
      return jsonResponse({ error: validationError }, 400);
    }

    const fullName = payload.full_name.trim();
    const phone = payload.phone.trim();
    const email = payload.email.trim().toLowerCase();
    const vehicleInterest = normalizeOptionalText(payload.vehicle_interest);
    const city = payload.city.trim();

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

    const { data: existingAuthUsers, error: existingAuthUsersError } =
      await adminClient.auth.admin.listUsers({
        query: email,
        perPage: 1,
      });

    if (existingAuthUsersError) {
      return jsonResponse(
        { error: existingAuthUsersError.message },
        400,
      );
    }

    if (
      (existingAuthUsers?.users ?? []).some(
        (user) => user.email?.toLowerCase() === email,
      )
    ) {
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
          city: city,
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

    const selectedAdvisor = await selectBestAdvisor(adminClient, city);

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
        assigned_to: selectedAdvisor?.id ?? null,
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
      assignedAdvisor: selectedAdvisor ?? null,
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