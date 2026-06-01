import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getMD5(text: string): Promise<string> {
  const { crypto: stdCrypto } = await import("https://deno.land/std@0.208.0/crypto/mod.ts");
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await stdCrypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    console.log("Duitku webhook received:", JSON.stringify(body));

    const { merchantCode, amount, merchantOrderId, productDetail, additionalParam, paymentCode, resultCode, merchantUserId, reference, signature } = body;

    // Get API key for signature verification
    const { data: settings } = await supabase.from("settings").select("key, value");
    const cfg = Object.fromEntries((settings || []).map((s: { key: string; value: string }) => [s.key, s.value]));
    const apiKey = cfg.duitku_api_key || Deno.env.get("duitku_api_key") || "";

    // Verify signature
    const expectedSignature = await getMD5(merchantCode + amount + merchantOrderId + apiKey);
    if (signature !== expectedSignature) {
      console.error("Invalid Duitku signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 403, headers: corsHeaders });
    }

    // Log webhook
    await supabase.from("webhook_logs").insert({
      type: "duitku",
      payload: body,
      ref_id: merchantOrderId,
      created_at: new Date().toISOString(),
    }).catch(() => {});

    // Map result code
    let paymentStatus: string;
    if (resultCode === "00") {
      paymentStatus = "paid";
    } else if (resultCode === "01") {
      paymentStatus = "failed";
    } else {
      paymentStatus = "pending";
    }

    if (paymentStatus !== "pending") {
      await supabase.from("transactions")
        .update({
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("invoice_no", merchantOrderId);

      // Trigger product delivery if paid
      if (paymentStatus === "paid") {
        const { data: tx } = await supabase.from("transactions")
          .select("*")
          .eq("invoice_no", merchantOrderId)
          .maybeSingle();

        if (tx && tx.status === "pending") {
          await supabase.functions.invoke("digiflazz-transaction", {
            body: { transactionId: tx.id },
          }).catch(err => console.error("Failed to trigger digiflazz:", err));
        }
      }
    }

    return new Response("SUCCESS", { headers: { ...corsHeaders, "Content-Type": "text/plain" } });
  } catch (err) {
    console.error("duitku-webhook error:", err);
    return new Response("ERROR", { status: 500 });
  }
});
