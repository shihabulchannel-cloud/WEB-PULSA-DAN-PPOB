import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const rawBody = await req.text();
  const signature = req.headers.get("X-Callback-Signature") || "";

  try {
    // Get Tripay private key
    const { data: settings } = await supabase
      .from("settings")
      .select("key, value")
      .eq("key", "tripay_private_key");

    const privateKey = settings?.[0]?.value || "";

    // Verify signature
    let isValid = false;
    if (privateKey) {
      const hmac = createHmac("sha256", privateKey);
      hmac.update(rawBody);
      const expectedSig = hmac.digest("hex");
      isValid = signature === expectedSig;
    }

    const payload = JSON.parse(rawBody);

    // Log webhook
    await supabase.from("webhook_logs").insert({
      source: "tripay",
      payload,
      headers: Object.fromEntries(req.headers.entries()),
      is_valid: isValid,
      processed: false,
    });

    if (!isValid && privateKey) {
      return new Response("Invalid signature", { status: 400 });
    }

    const { merchant_ref, reference, status, paid_at, total_amount } = payload;

    if (!merchant_ref) {
      return new Response("Invalid payload", { status: 400 });
    }

    // Find transaction
    const { data: tx } = await supabase
      .from("transactions")
      .select("*")
      .eq("invoice_no", merchant_ref)
      .maybeSingle();

    if (!tx) {
      return new Response("Transaction not found", { status: 404 });
    }

    // Update payment status
    const paymentStatus = status === "PAID" ? "paid" : status === "EXPIRED" ? "expired" : "failed";
    
    await supabase.from("transactions").update({
      payment_status: paymentStatus,
      payment_reference: reference,
      payment_paid_at: paid_at ? new Date(paid_at * 1000).toISOString() : null,
    }).eq("invoice_no", merchant_ref);

    // If paid, trigger Digiflazz transaction
    if (status === "PAID") {
      await supabase.functions.invoke("digiflazz-transaction", {
        body: { transaction_id: tx.id },
      }).catch(console.error);
    }

    // Mark webhook as processed
    await supabase.from("webhook_logs")
      .update({ processed: true })
      .eq("source", "tripay")
      .eq("payload->merchant_ref" as "source", merchant_ref as string);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Tripay webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
