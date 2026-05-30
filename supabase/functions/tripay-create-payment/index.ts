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

  try {
    const body = await req.json();
    const {
      transaction_id, invoice_no, amount, payment_code,
      customer_name, customer_email, customer_phone, product_name,
    } = body;

    // Get Tripay settings
    const { data: settings } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["tripay_api_key", "tripay_private_key", "tripay_merchant_code", "tripay_mode"]);

    const sm = Object.fromEntries((settings || []).map((s: { key: string; value: string }) => [s.key, s.value]));
    const apiKey = sm["tripay_api_key"];
    const privateKey = sm["tripay_private_key"];
    const merchantCode = sm["tripay_merchant_code"];
    const mode = sm["tripay_mode"] || "sandbox";

    if (!apiKey || !privateKey || !merchantCode) {
      return new Response(
        JSON.stringify({ error: "Tripay credentials not configured. Configure API key in admin settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = mode === "production" 
      ? "https://tripay.co.id/api" 
      : "https://tripay.co.id/api-sandbox";

    // Create signature
    const signatureStr = `${merchantCode}${invoice_no}${amount}`;
    const hmac = createHmac("sha256", privateKey);
    hmac.update(signatureStr);
    const signature = hmac.digest("hex");

    const expiredTime = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

    const payload = {
      method: payment_code,
      merchant_ref: invoice_no,
      amount,
      customer_name: customer_name || "Customer",
      customer_email: customer_email || "customer@example.com",
      customer_phone: customer_phone || "08000000000",
      order_items: [{ name: product_name, price: amount, quantity: 1 }],
      return_url: `${req.headers.get("origin") || ""}/transaction/${invoice_no}`,
      expired_time: expiredTime,
      signature,
    };

    const startTime = Date.now();
    const response = await fetch(`${baseUrl}/transaction/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    const duration = Date.now() - startTime;

    // Log
    await supabase.from("api_logs").insert({
      service: "tripay",
      endpoint: "/transaction/create",
      request_data: { method: payment_code, merchant_ref: invoice_no, amount },
      response_data: result,
      status_code: response.status,
      is_success: result?.success === true,
      duration_ms: duration,
    });

    if (!result?.success) {
      return new Response(
        JSON.stringify({ error: result?.message || "Tripay payment creation failed", raw: result }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentData = result.data;
    
    // Update transaction with payment info
    await supabase.from("transactions").update({
      payment_url: paymentData.checkout_url,
      payment_reference: paymentData.reference,
      payment_status: "pending",
    }).eq("id", transaction_id);

    return new Response(
      JSON.stringify({
        success: true,
        payment_url: paymentData.checkout_url,
        reference: paymentData.reference,
        expired_time: paymentData.expired_time,
        data: paymentData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Tripay create payment error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
