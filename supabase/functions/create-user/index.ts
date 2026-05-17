import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: corsHeaders },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Sesión inválida" }),
        { status: 401, headers: corsHeaders },
      );
    }

    const { data: isAdmin, error: roleError } = await userClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Solo administradores pueden crear usuarios" }),
        { status: 403, headers: corsHeaders },
      );
    }

    const { email, password, fullName, role } = await req.json();

    const normalizedEmail = email?.toString().trim().toLowerCase();
    const normalizedFullName = fullName?.toString().trim();
    const allowedRoles = ["admin", "supervisor", "asesor", "soporte"];

    if (
      !normalizedEmail ||
      !password ||
      !normalizedFullName ||
      !allowedRoles.includes(role)
    ) {
      return new Response(
        JSON.stringify({ error: "Datos inválidos" }),
        { status: 400, headers: corsHeaders },
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: existingUsers, error: existingUsersError } =
      await adminClient.auth.admin.listUsers({
        query: normalizedEmail,
        perPage: 1,
      });

    if (existingUsersError) {
      return new Response(
        JSON.stringify({ error: existingUsersError.message }),
        { status: 400, headers: corsHeaders },
      );
    }

    if (
      (existingUsers?.users ?? []).some(
        (user) => user.email?.toLowerCase() === normalizedEmail,
      )
    ) {
      return new Response(
        JSON.stringify({ error: "Ya existe un usuario con ese correo" }),
        { status: 409, headers: corsHeaders },
      );
    }

    const { data: created, error: createError } =
      await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: normalizedFullName,
        },
      });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: corsHeaders },
      );
    }

    const newUserId = created.user.id;

    await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", newUserId);

    const { error: insertRoleError } = await adminClient
      .from("user_roles")
      .insert({
        user_id: newUserId,
        role,
      });

    if (insertRoleError) {
      return new Response(
        JSON.stringify({ error: insertRoleError.message }),
        { status: 400, headers: corsHeaders },
      );
    }

    return new Response(
      JSON.stringify({ user: created.user }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Error inesperado",
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});