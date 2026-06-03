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
    const { deposit_id, action, notes, approved_by } = await req.json();

    if (!deposit_id || !action) {
      return new Response(JSON.stringify({ success: false, error: "deposit_id dan action wajib diisi" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: deposit, error: depositError } = await supabaseAdmin
      .from("reseller_deposits")
      .select("*, resellers(id, user_id)")
      .eq("id", deposit_id)
      .maybeSingle();

    if (depositError || !deposit) {
      return new Response(JSON.stringify({ success: false, error: "Deposit tidak ditemukan" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (deposit.status !== "pending") {
      return new Response(JSON.stringify({ success: false, error: "Deposit sudah diproses sebelumnya" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "approve") {
      const { data: balData } = await supabaseAdmin
        .from("reseller_balances")
        .select("balance")
        .eq("reseller_id", deposit.reseller_id)
        .maybeSingle();

      const currentBalance = Number(balData?.balance) || 0;
      const newBalance = currentBalance + Number(deposit.amount);

      // Update balance
      await supabaseAdmin.from("reseller_balances")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("reseller_id", deposit.reseller_id);

      // Legacy balance history
      await supabaseAdmin.from("reseller_balance_history").insert({
        reseller_id: deposit.reseller_id,
        type: "credit",
        amount: deposit.amount,
        balance_before: currentBalance,
        balance_after: newBalance,
        description: `Deposit disetujui #${deposit_id.slice(0, 8)}`,
        reference_id: deposit_id,
        created_by: approved_by || null,
      });

      // Unified wallet_transactions log
      const resellerUserId = (deposit.resellers as { user_id?: string } | null)?.user_id || null;
      await supabaseAdmin.from("wallet_transactions").insert({
        reseller_id: deposit.reseller_id,
        user_id: resellerUserId,
        type: "deposit",
        amount: deposit.amount,
        balance_before: currentBalance,
        balance_after: newBalance,
        description: `Deposit disetujui — ${deposit.bank_name || ''} atas nama ${deposit.sender_name || ''}`,
        reference_id: deposit_id,
        created_by: approved_by || null,
      });

      // Update deposit status
      await supabaseAdmin.from("reseller_deposits").update({
        status: "approved",
        notes: notes || null,
        approved_by: approved_by || null,
        approved_at: new Date().toISOString(),
      }).eq("id", deposit_id);

      return new Response(JSON.stringify({ success: true, new_balance: newBalance }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reject") {
      await supabaseAdmin.from("reseller_deposits").update({
        status: "rejected",
        notes: notes || null,
        approved_by: approved_by || null,
        approved_at: new Date().toISOString(),
      }).eq("id", deposit_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Action tidak valid" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[reseller-deposit-action]", err);
    return new Response(JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
