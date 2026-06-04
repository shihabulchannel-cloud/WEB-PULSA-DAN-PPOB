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

    // --- APPROVE ---
    if (action === "approve") {
      // ATOMIC: Update status from pending→approved in ONE conditional query
      // This prevents double-credit: if two concurrent requests come in,
      // only one will match WHERE status='pending' and get rows_count=1
      const { data: updatedDeposits, error: updateStatusErr } = await supabaseAdmin
        .from("reseller_deposits")
        .update({
          status: "approved",
          notes: notes || null,
          approved_by: approved_by || null,
          approved_at: new Date().toISOString(),
        })
        .eq("id", deposit_id)
        .eq("status", "pending") // <-- atomic guard: only matches if still pending
        .select("*, resellers(id, user_id)");

      if (updateStatusErr) {
        return new Response(JSON.stringify({ success: false, error: updateStatusErr.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If no rows updated → already processed (race condition or double-click)
      if (!updatedDeposits || updatedDeposits.length === 0) {
        return new Response(JSON.stringify({ success: false, error: "Deposit sudah diproses sebelumnya. Saldo tidak ditambahkan ganda." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const deposit = updatedDeposits[0];

      // Get current balance
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

      return new Response(JSON.stringify({ success: true, new_balance: newBalance }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- REJECT ---
    if (action === "reject") {
      // Also only reject if still pending
      const { data: rejectedDeposits, error: rejectErr } = await supabaseAdmin
        .from("reseller_deposits")
        .update({
          status: "rejected",
          notes: notes || null,
          approved_by: approved_by || null,
          approved_at: new Date().toISOString(),
        })
        .eq("id", deposit_id)
        .eq("status", "pending")
        .select("id");

      if (rejectErr) {
        return new Response(JSON.stringify({ success: false, error: rejectErr.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!rejectedDeposits || rejectedDeposits.length === 0) {
        return new Response(JSON.stringify({ success: false, error: "Deposit sudah diproses sebelumnya." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
