import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    const { action, ...data } = body;

    // CREATE RESELLER
    if (action === "create") {
      const { nama, username, email, password, whatsapp, kota, saldo_awal = 0, created_by } = data;
      if (!nama || !username || !email || !password) {
        return new Response(JSON.stringify({ success: false, error: "Nama, username, email, dan password wajib diisi" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create Supabase auth user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: { role: "reseller", nama, username },
        email_confirm: true,
      });

      if (authError) {
        return new Response(JSON.stringify({ success: false, error: authError.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Insert into resellers table
      const { data: reseller, error: resellerError } = await supabaseAdmin.from("resellers").insert({
        user_id: authUser.user.id,
        nama, username, email, whatsapp: whatsapp || "", kota: kota || "",
        is_active: true, created_by: created_by || null,
      }).select().single();

      if (resellerError) {
        // Rollback auth user
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        return new Response(JSON.stringify({ success: false, error: resellerError.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create balance record
      await supabaseAdmin.from("reseller_balances").insert({
        reseller_id: reseller.id,
        balance: saldo_awal || 0,
      });

      // Record initial balance history if saldo > 0
      if (saldo_awal && saldo_awal > 0) {
        await supabaseAdmin.from("reseller_balance_history").insert({
          reseller_id: reseller.id,
          type: "credit",
          amount: saldo_awal,
          balance_before: 0,
          balance_after: saldo_awal,
          description: "Saldo awal",
          created_by: created_by || null,
        });
      }

      return new Response(JSON.stringify({ success: true, reseller }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ADJUST BALANCE (admin adds/reduces balance)
    if (action === "adjust_balance") {
      const { reseller_id, type, amount, description, created_by } = data;
      if (!reseller_id || !type || !amount) {
        return new Response(JSON.stringify({ success: false, error: "reseller_id, type, amount wajib diisi" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: balData } = await supabaseAdmin
        .from("reseller_balances")
        .select("balance")
        .eq("reseller_id", reseller_id)
        .maybeSingle();

      const currentBalance = balData?.balance || 0;
      const newBalance = type === "credit" ? currentBalance + amount : currentBalance - amount;
      if (newBalance < 0) {
        return new Response(JSON.stringify({ success: false, error: "Saldo tidak cukup" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabaseAdmin.from("reseller_balances")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("reseller_id", reseller_id);

      await supabaseAdmin.from("reseller_balance_history").insert({
        reseller_id, type, amount,
        balance_before: currentBalance,
        balance_after: newBalance,
        description: description || (type === "credit" ? "Penambahan saldo" : "Pengurangan saldo"),
        created_by: created_by || null,
      });

      return new Response(JSON.stringify({ success: true, new_balance: newBalance }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // RESET PASSWORD
    if (action === "reset_password") {
      const { user_id, new_password } = data;
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, { password: new_password });
      if (error) return new Response(JSON.stringify({ success: false, error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Unknown action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[create-reseller]", err);
    return new Response(JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
