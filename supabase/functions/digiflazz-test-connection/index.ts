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

    const { data: settingsRows } = await supabase.from("settings").select("key, value");
    const cfg = Object.fromEntries((settingsRows || []).map((s: { key: string; value: string }) => [s.key, s.value]));

    // TRIM all credentials to remove accidental whitespace
    const username = (cfg.digiflazz_username || "").trim();
    const apiKey = (cfg.digiflazz_api_key || "").trim();

    // Debug info
    const debugInfo = {
      username_found: !!username,
      username_length: username.length,
      apikey_found: !!apiKey,
      apikey_length: apiKey.length,
      apikey_prefix: apiKey ? apiKey.substring(0, 4) + "..." : "N/A",
    };

    if (!username || !apiKey) {
      return new Response(JSON.stringify({
        success: false,
        message: "Username dan API Key Digiflazz belum dikonfigurasi. Isi di Pengaturan → Digiflazz.",
        debug: debugInfo,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Digiflazz cek-saldo signature: MD5(username + apiKey + "depo")
    const signStr = username + apiKey + "depo";
    const sign = await getMD5(signStr);

    console.log(`[digiflazz-test] username=${username}, apikey_len=${apiKey.length}, sign=${sign}`);

    const startTime = Date.now();
    const res = await fetch("https://api.digiflazz.com/v1/cek-saldo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd: "deposit", username, sign }),
    });

    const duration = Date.now() - startTime;
    const rawText = await res.text();
    let result: Record<string, unknown> = {};
    try { result = JSON.parse(rawText); } catch { result = { raw: rawText }; }

    console.log(`[digiflazz-test] http=${res.status} duration=${duration}ms response=${rawText.substring(0, 500)}`);

    // Log to api_logs
    await supabase.from("api_logs").insert({
      service: "digiflazz",
      endpoint: "/v1/cek-saldo",
      request_data: { cmd: "deposit", username, sign_preview: sign.substring(0, 8) + "..." },
      response_data: result,
      status_code: res.status,
      is_success: !!(result as { data?: unknown }).data,
      duration_ms: duration,
    }).catch(() => {});

    if ((result as { data?: { deposit?: number } }).data) {
      const balance = (result as { data: { deposit: number } }).data.deposit;
      return new Response(JSON.stringify({
        success: true,
        balance,
        message: `Koneksi berhasil! Saldo Digiflazz: Rp ${Number(balance).toLocaleString("id-ID")}`,
        debug: debugInfo,
        response: result,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Show actual Digiflazz error message
    const errMsg = (result as { rc?: string; rd?: string; message?: string }).rd
      || (result as { message?: string }).message
      || "Koneksi gagal";

    return new Response(JSON.stringify({
      success: false,
      message: `Digiflazz: ${errMsg}`,
      http_status: res.status,
      debug: debugInfo,
      response: result,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[digiflazz-test] error:", err);
    return new Response(JSON.stringify({
      success: false,
      message: `Error: ${err instanceof Error ? err.message : String(err)}`,
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
