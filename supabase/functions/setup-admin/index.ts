import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { data: users } = await supabase.auth.admin.listUsers();
    const admin = users?.users?.find(u => u.email === "admin@shielacomcell.com");

    if (!admin) {
      // Create fresh admin
      const { data, error } = await supabase.auth.admin.createUser({
        email: "admin@shielacomcell.com",
        password: "Admin@Shiela2024!",
        email_confirm: true,
        user_metadata: { role: "admin", name: "Admin SHIELACOM CELL" },
      });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, action: "created", user_id: data.user.id }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Reset password for existing admin
    const { error } = await supabase.auth.admin.updateUserById(admin.id, {
      password: "Admin@Shiela2024!",
      email_confirm: true,
      user_metadata: { role: "admin", name: "Admin SHIELACOM CELL" },
    });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, action: "reset", user_id: admin.id }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
