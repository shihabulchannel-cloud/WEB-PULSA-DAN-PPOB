import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { data: users } = await supabase.auth.admin.listUsers();
    const existing = users?.users?.find(u => u.email === "admin@shielacomcell.com");

    // SECURITY: If admin already exists and email is confirmed, refuse re-creation
    if (existing && existing.email_confirmed_at) {
      return new Response(
        JSON.stringify({
          error: "Admin already exists. Contact system administrator to reset access.",
          exists: true,
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete unconfirmed admin if exists
    if (existing && !existing.email_confirmed_at) {
      await supabase.auth.admin.deleteUser(existing.id);
    }

    // Create admin account with confirmed email
    const { data, error } = await supabase.auth.admin.createUser({
      email: "admin@shielacomcell.com",
      password: "Admin@123456",
      email_confirm: true,
      user_metadata: { role: "admin", name: "Admin SHIELACOM CELL" },
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, user_id: data.user.id }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
