import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { transaction_id } = await req.json();
    if (!transaction_id) throw new Error("transaction_id required");

    // Get transaction
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .select("*, products(buyer_sku_code)")
      .eq("id", transaction_id)
      .maybeSingle();

    if (txError || !tx) throw new Error("Transaction not found");

    // Get Digiflazz credentials
    const { data: settings } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["digiflazz_username", "digiflazz_api_key"]);

    const settingsMap = Object.fromEntries((settings || []).map((s: { key: string; value: string }) => [s.key, s.value]));
    const username = settingsMap["digiflazz_username"];
    const apiKey = settingsMap["digiflazz_api_key"];

    if (!username || !apiKey) {
      await supabase.from("transactions").update({
        status: "failed",
        digiflazz_message: "Konfigurasi Digiflazz belum diatur",
      }).eq("id", transaction_id);
      throw new Error("Digiflazz credentials not configured");
    }

    const refId = `TRX-${Date.now()}`;
    const buyerSkuCode = (tx.products as { buyer_sku_code: string })?.buyer_sku_code || tx.product_sku;

    // Create Digiflazz signature
    const signStr = `${username}${apiKey}${refId}`;
    const sign = await createMD5(signStr);

    // Send transaction to Digiflazz
    const startTime = Date.now();
    const response = await fetch("https://api.digiflazz.com/v1/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        buyer_sku_code: buyerSkuCode,
        customer_no: tx.target_id,
        ref_id: refId,
        sign,
      }),
    });

    const result = await response.json();
    const duration = Date.now() - startTime;

    // Log API call
    await supabase.from("api_logs").insert({
      service: "digiflazz",
      endpoint: "/v1/transaction",
      request_data: { buyer_sku_code: buyerSkuCode, customer_no: tx.target_id, ref_id: refId },
      response_data: result,
      status_code: response.status,
      is_success: result?.data?.status !== "Gagal",
      duration_ms: duration,
    });

    const digiStatus = result?.data?.status;
    let newStatus = "processing";
    if (digiStatus === "Sukses") newStatus = "success";
    else if (digiStatus === "Gagal") newStatus = "failed";

    // Update transaction
    await supabase.from("transactions").update({
      digiflazz_ref: refId,
      digiflazz_status: newStatus,
      digiflazz_message: result?.data?.message,
      digiflazz_sn: result?.data?.sn,
      status: newStatus,
    }).eq("id", transaction_id);

    // Send notification if success or failed
    if (newStatus === "success" || newStatus === "failed") {
      await supabase.functions.invoke("send-notification", {
        body: {
          transaction_id,
          type: newStatus === "success" ? "topup_success" : "topup_failed",
        },
      }).catch(() => {});
    }

    return new Response(
      JSON.stringify({ success: true, status: newStatus, data: result?.data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Digiflazz transaction error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function createMD5(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  try {
    const hashBuffer = await crypto.subtle.digest("MD5", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
}
