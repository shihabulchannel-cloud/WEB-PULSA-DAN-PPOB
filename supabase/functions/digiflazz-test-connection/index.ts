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

    const { data: settings } = await supabase.from("settings").select("key, value");
    const cfg = Object.fromEntries((settings || []).map((s: { key: string; value: string }) => [s.key, s.value]));

    const username = cfg.digiflazz_username || Deno.env.get("digiflazz_username") || "";
    const apiKey = cfg.digiflazz_api_key || Deno.env.get("digiflazz_api_key") || "";

    if (!username || !apiKey) {
      return new Response(JSON.stringify({ success: false, message: "Username dan API Key Digiflazz belum dikonfigurasi" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sign = await getMD5(username + apiKey + "depo");

    const res = await fetch("https://api.digiflazz.com/v1/cek-saldo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd: "deposit", username, sign }),
    });

    const result = await res.json();

    if (result.data) {
      return new Response(JSON.stringify({
        success: true,
        balance: result.data.deposit,
        message: `Koneksi berhasil! Saldo: Rp ${Number(result.data.deposit).toLocaleString('id-ID')}`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      success: false,
      message: result.message || "Koneksi gagal — periksa username dan API key",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("digiflazz-test-connection error:", err);
    return new Response(JSON.stringify({ success: false, message: "Gagal menghubungi server Digiflazz" }), { status: 500, headers: corsHeaders });
  }
});
