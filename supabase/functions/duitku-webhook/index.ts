import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { crypto as stdCrypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";

async function getMD5(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await stdCrypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let body: Record<string, string> = {};
  try { body = await req.json(); } catch { body = {}; }

  const rawBody = JSON.stringify(body);
  console.log("[duitku-webhook] received:", rawBody.substring(0, 500));

  const { merchantCode, amount, merchantOrderId, resultCode, signature } = body;

  // Log all incoming webhooks immediately
  await supabase.from("webhook_logs").insert({
    source: "duitku",
    payload: body,
    ref_id: merchantOrderId || null,
    is_valid: false,
    processed: false,
  }).catch(() => {});

  try {
    // Get Duitku config
    const { data: settings } = await supabase.from("settings").select("key, value");
    const cfg = Object.fromEntries((settings || []).map((s: { key: string; value: string }) => [s.key, s.value]));
    const apiKey = (cfg.duitku_api_key || "").trim();

    // Verify signature
    const expectedSignature = await getMD5(merchantCode + amount + merchantOrderId + apiKey);
    const isValid = signature === expectedSignature;

    if (!isValid) {
      console.error(`[duitku-webhook] INVALID SIGNATURE. received=${signature}, expected=${expectedSignature}`);
      // Update log with invalid status
      await supabase.from("webhook_logs").update({ is_valid: false })
        .eq("source", "duitku").eq("ref_id", merchantOrderId).order("created_at", { ascending: false }).limit(1);
      return new Response("INVALID SIGNATURE", { status: 403 });
    }

    // Update log as valid
    await supabase.from("webhook_logs")
      .update({ is_valid: true })
      .eq("source", "duitku")
      .eq("ref_id", merchantOrderId);

    // Map result code
    let paymentStatus = "pending";
    if (resultCode === "00") paymentStatus = "paid";
    else if (resultCode === "01") paymentStatus = "failed";

    if (paymentStatus !== "pending") {
      await supabase.from("transactions").update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      }).eq("invoice_no", merchantOrderId);

      // Trigger product delivery if paid
      if (paymentStatus === "paid") {
        const { data: tx } = await supabase.from("transactions")
          .select("id, status")
          .eq("invoice_no", merchantOrderId)
          .maybeSingle();

        if (tx && tx.status === "pending") {
          // FIXED: correct parameter name is transaction_id
          await supabase.functions.invoke("digiflazz-transaction", {
            body: { transaction_id: tx.id },
          }).catch(err => console.error("[duitku-webhook] digiflazz invoke error:", err));
        }
      }
    }

    // Mark as processed
    await supabase.from("webhook_logs").update({ processed: true })
      .eq("source", "duitku").eq("ref_id", merchantOrderId);

    return new Response("SUCCESS", { headers: { "Content-Type": "text/plain" } });
  } catch (err) {
    console.error("[duitku-webhook] error:", err);
    return new Response("ERROR", { status: 500 });
  }
});
