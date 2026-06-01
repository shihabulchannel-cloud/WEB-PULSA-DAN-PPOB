import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    console.log("VIP Payment webhook received:", JSON.stringify(body));

    const { trx_id, amount, status, sign } = body;

    // Get VIP settings
    const { data: settings } = await supabase.from("settings").select("key, value");
    const cfg = Object.fromEntries((settings || []).map((s: { key: string; value: string }) => [s.key, s.value]));
    const secretKey = cfg.vip_secret_key || Deno.env.get("vip_secret_key") || "";

    // Log webhook
    await supabase.from("webhook_logs").insert({
      type: "vip_payment",
      payload: body,
      ref_id: trx_id,
      created_at: new Date().toISOString(),
    }).catch(() => {});

    // Basic signature check (md5 of trx_id + secretKey)
    if (secretKey && sign) {
      const { crypto: stdCrypto } = await import("https://deno.land/std@0.208.0/crypto/mod.ts");
      const encoder = new TextEncoder();
      const expectedHash = await stdCrypto.subtle.digest("MD5", encoder.encode(trx_id + secretKey));
      const expectedSign = Array.from(new Uint8Array(expectedHash)).map(b => b.toString(16).padStart(2, "0")).join("");
      if (sign !== expectedSign) {
        console.error("Invalid VIP Payment signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 403, headers: corsHeaders });
      }
    }

    const paymentStatus = status === "success" ? "paid" : status === "failed" ? "failed" : "pending";

    if (paymentStatus !== "pending") {
      await supabase.from("transactions")
        .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
        .eq("invoice_no", trx_id);

      if (paymentStatus === "paid") {
        const { data: tx } = await supabase.from("transactions")
          .select("*").eq("invoice_no", trx_id).maybeSingle();
        if (tx && tx.status === "pending") {
          await supabase.functions.invoke("digiflazz-transaction", {
            body: { transactionId: tx.id },
          }).catch(err => console.error("Failed to trigger digiflazz:", err));
        }
      }
    }

    return new Response(JSON.stringify({ status: "OK" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("vip-payment-webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
