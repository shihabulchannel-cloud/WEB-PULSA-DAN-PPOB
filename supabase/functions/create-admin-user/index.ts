import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Delete existing admin if any
    const { data: users } = await supabase.auth.admin.listUsers();
    const existing = users?.users?.find(u => u.email === "admin@shielacomcell.com");
    if (existing) {
      await supabase.auth.admin.deleteUser(existing.id);
    }

    // Create fresh admin account
    const { data, error } = await supabase.auth.admin.createUser({
      email: "admin@shielacomcell.com",
      password: "Admin@123456",
      email_confirm: true,
      user_metadata: { role: "admin", name: "Admin SHIELACOM CELL" },
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, user_id: data.user.id, email: data.user.email }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
