import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { crypto as stdCrypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getMD5(text: string): Promise<string> {
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

    // NO auth required — customers are anonymous
    const body = await req.json();
    const { invoiceNo, amount, customerName, customerEmail, customerPhone, productName, returnUrl } = body;

    if (!invoiceNo || !amount) {
      return new Response(JSON.stringify({ error: "invoiceNo and amount are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Verify invoice exists
    const { data: tx } = await supabase.from("transactions").select("id, payment_status").eq("invoice_no", invoiceNo).maybeSingle();
    if (!tx) {
      return new Response(JSON.stringify({ error: "Invoice tidak ditemukan" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get Duitku settings
    const { data: settings } = await supabase.from("settings").select("key, value");
    const cfg = Object.fromEntries((settings || []).map((s: { key: string; value: string }) => [s.key, s.value]));

    const merchantCode = (cfg.duitku_merchant_code || "").trim();
    const apiKey = (cfg.duitku_api_key || "").trim();
    const mode = (cfg.duitku_mode || "sandbox").trim();

    if (!merchantCode || !apiKey) {
      return new Response(JSON.stringify({ error: "Duitku belum dikonfigurasi. Isi di Pengaturan → Duitku Payment." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const baseUrl = mode === "production"
      ? "https://passport.duitku.com/webapi/api"
      : "https://sandbox.duitku.com/webapi/api";

    const signature = await getMD5(merchantCode + amount + invoiceNo + apiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";

    const payload = {
      merchantCode,
      paymentAmount: amount,
      merchantOrderId: invoiceNo,
      productDetails: productName || "Digital Product",
      email: customerEmail || "",
      phoneNumber: customerPhone || "",
      additionalParam: "",
      merchantUserInfo: customerName || "",
      customerVaName: customerName || "Customer",
      callbackUrl: `${supabaseUrl}/functions/v1/duitku-webhook`,
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
    console.log("[duitku-create-payment] response:", JSON.stringify(result));

    if (result.statusCode !== "00") {
      return new Response(JSON.stringify({
        error: result.statusMessage || "Payment creation failed",
        detail: result,
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update transaction with payment reference
    await supabase.from("transactions").update({
      payment_reference: result.reference,
      payment_url: result.paymentUrl,
    }).eq("invoice_no", invoiceNo);

    return new Response(JSON.stringify({
      success: true,
      paymentUrl: result.paymentUrl,
      reference: result.reference,
      amount: result.amount,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[duitku-create-payment] error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
