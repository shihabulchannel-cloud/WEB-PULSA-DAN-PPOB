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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { transactionId, amount, customerName, customerEmail, customerPhone, productName, returnUrl, callbackUrl } = body;

    if (!transactionId || !amount) {
      return new Response(JSON.stringify({ error: "transactionId and amount are required" }), { status: 400, headers: corsHeaders });
    }

    // Get Duitku settings
    const { data: settings } = await supabase.from("settings").select("key, value");
    const cfg = Object.fromEntries((settings || []).map((s: { key: string; value: string }) => [s.key, s.value]));

    const merchantCode = cfg.duitku_merchant_code || Deno.env.get("duitku_merchant_code") || "";
    const apiKey = cfg.duitku_api_key || Deno.env.get("duitku_api_key") || "";
    const mode = cfg.duitku_mode || "sandbox";

    if (!merchantCode || !apiKey) {
      return new Response(JSON.stringify({ error: "Duitku not configured" }), { status: 500, headers: corsHeaders });
    }

    const baseUrl = mode === "production"
      ? "https://passport.duitku.com/webapi/api"
      : "https://sandbox.duitku.com/webapi/api";

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = await getMD5(merchantCode + amount + transactionId + apiKey);

    const payload = {
      merchantCode,
      paymentAmount: amount,
      merchantOrderId: transactionId,
      productDetails: productName || "Digital Product",
      email: customerEmail || "",
      phoneNumber: customerPhone || "",
      additionalParam: "",
      merchantUserInfo: customerName || "",
      customerVaName: customerName || "Customer",
      callbackUrl: callbackUrl || `${Deno.env.get("SUPABASE_URL")}/functions/v1/duitku-webhook`,
      returnUrl: returnUrl || cfg.site_url || "",
      signature,
      expiryPeriod: 60,
    };

    const response = await fetch(`${baseUrl}/merchant/createinvoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.statusCode !== "00") {
      console.error("Duitku error:", result);
      return new Response(JSON.stringify({ error: result.statusMessage || "Payment creation failed" }), { status: 400, headers: corsHeaders });
    }

    // Update transaction with payment reference
    await supabase.from("transactions").update({
      payment_reference: result.reference,
      payment_url: result.paymentUrl,
    }).eq("invoice_no", transactionId);

    return new Response(JSON.stringify({
      success: true,
      paymentUrl: result.paymentUrl,
      reference: result.reference,
      amount: result.amount,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("duitku-create-payment error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
