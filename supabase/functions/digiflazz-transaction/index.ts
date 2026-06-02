import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto as stdCrypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function createMD5(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await stdCrypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { transaction_id } = await req.json();
    if (!transaction_id) throw new Error("transaction_id required");

    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .select("*, products(buyer_sku_code, digiflazz_sku)")
      .eq("id", transaction_id)
      .maybeSingle();

    if (txError || !tx) throw new Error(`Transaction not found: ${transaction_id}`);

    if (tx.digiflazz_submitted_at && (tx.status === "success" || tx.status === "processing")) {
      console.log(`[digiflazz-trx] Already submitted: ${transaction_id}`);
      return new Response(JSON.stringify({ success: true, status: tx.status, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: settings } = await supabase.from("settings").select("key, value")
      .in("key", ["digiflazz_username", "digiflazz_api_key"]);
    const settingsMap = Object.fromEntries((settings || []).map((s: { key: string; value: string }) => [s.key, s.value]));

    // TRIM credentials to prevent signature mismatch
    const username = (settingsMap["digiflazz_username"] || "").trim();
    const apiKey = (settingsMap["digiflazz_api_key"] || "").trim();

    console.log(`[digiflazz-trx] username=${username}, apikey_len=${apiKey.length}`);

    if (!username || !apiKey) {
      await supabase.from("transactions").update({
        status: "failed",
        digiflazz_message: "Konfigurasi Digiflazz belum diatur di Pengaturan",
      }).eq("id", transaction_id);
      throw new Error("Digiflazz credentials not configured");
    }

    const refId = `TRX-${Date.now()}-${transaction_id.slice(0, 8)}`;
    const prod = tx.products as { buyer_sku_code: string; digiflazz_sku: string } | null;
    const buyerSkuCode = prod?.buyer_sku_code || prod?.digiflazz_sku || tx.product_sku;

    if (!buyerSkuCode) {
      await supabase.from("transactions").update({
        status: "failed",
        digiflazz_message: "SKU produk tidak ditemukan",
      }).eq("id", transaction_id);
      throw new Error("Product SKU not found");
    }

    // Signature: MD5(username + apiKey + refId) per Digiflazz docs
    const signStr = username + apiKey + refId;
    const sign = await createMD5(signStr);
    console.log(`[digiflazz-trx] refId=${refId}, sku=${buyerSkuCode}, sign=${sign.substring(0, 8)}...`);

    // Mark as submitted
    await supabase.from("transactions").update({
      digiflazz_submitted_at: new Date().toISOString(),
      digiflazz_ref: refId,
      status: "processing",
    }).eq("id", transaction_id);

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
    console.log(`[digiflazz-trx] response: ${JSON.stringify(result).substring(0, 500)}`);

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

    await supabase.from("transactions").update({
      digiflazz_status: newStatus,
      digiflazz_message: result?.data?.message,
      digiflazz_sn: result?.data?.sn,
      status: newStatus,
    }).eq("id", transaction_id);

    if (newStatus === "success" || newStatus === "failed") {
      await supabase.functions.invoke("send-notification", {
        body: { transaction_id, type: newStatus === "success" ? "topup_success" : "topup_failed" },
      }).catch(() => {});
    }

    return new Response(JSON.stringify({ success: true, status: newStatus, data: result?.data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("[digiflazz-trx] error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
