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

const categoryMapping: Record<string, string> = {
  "Games": "top-up-game",
  "Pulsa": "pulsa",
  "Paket Data": "paket-data",
  "Data": "paket-data",
  "E-Money": "e-wallet",
  "E-Wallet": "e-wallet",
  "PLN": "ppob",
  "BPJS": "ppob",
  "PDAM": "ppob",
  "Telkom": "ppob",
  "Internet": "ppob",
  "Voucher": "voucher-digital",
  "Voucher Game": "top-up-game",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authError } = await anonClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const { data: settings } = await supabase.from("settings").select("key, value");
    const settingsMap = Object.fromEntries((settings || []).map((s: { key: string; value: string }) => [s.key, s.value]));

    // TRIM to prevent signature mismatch
    const username = (settingsMap["digiflazz_username"] || "").trim();
    const apiKey = (settingsMap["digiflazz_api_key"] || "").trim();
    const defaultMarkup = parseInt(settingsMap["default_markup"] || "500", 10);

    console.log(`[digiflazz-sync] username=${username}, apikey_len=${apiKey.length}, markup=${defaultMarkup}`);

    if (!username || !apiKey) {
      return new Response(JSON.stringify({ error: "Digiflazz credentials not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Signature for price-list: MD5(username + apiKey + "pricelist")
    const sign = await createMD5(username + apiKey + "pricelist");
    console.log(`[digiflazz-sync] sign=${sign.substring(0, 8)}...`);

    const startTime = Date.now();
    const response = await fetch("https://api.digiflazz.com/v1/price-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd: "prepaid", username, sign }),
    });

    const data = await response.json();
    const duration = Date.now() - startTime;
    console.log(`[digiflazz-sync] http=${response.status}, items=${data?.data?.length || 0}`);

    if (!data?.data || !Array.isArray(data.data)) {
      const errMsg = data?.rc || data?.rd || data?.message || "Invalid response";
      await supabase.from("api_logs").insert({
        service: "digiflazz",
        endpoint: "/v1/price-list",
        request_data: { cmd: "prepaid", username },
        response_data: data,
        status_code: response.status,
        is_success: false,
        error_message: errMsg,
        duration_ms: duration,
      });
      return new Response(JSON.stringify({
        error: `Digiflazz error: ${errMsg}`,
        response: data,
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const products = data.data;

    // Get all categories
    const { data: categories } = await supabase.from("categories").select("id, slug");
    const catMap: Record<string, string> = {};
    (categories || []).forEach((c: { id: string; slug: string }) => { catMap[c.slug] = c.id; });

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    const batchSize = 50;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const upsertData = batch.map((product: Record<string, unknown>) => {
        let categoryId = null;
        const cat = (product.category as string) || "";
        const brand = (product.brand as string) || "";
        for (const [key, slug] of Object.entries(categoryMapping)) {
          if (cat.includes(key) || brand.includes(key)) {
            categoryId = catMap[slug] || null;
            break;
          }
        }
        const modalPrice = parseFloat(product.price as string) || 0;
        const sellPrice = modalPrice + defaultMarkup;
        return {
          name: product.product_name as string,
          brand: brand,
          buyer_sku_code: product.buyer_sku_code as string,
          digiflazz_sku: product.buyer_sku_code as string,
          modal_price: modalPrice,
          sell_price: sellPrice,
          markup_amount: defaultMarkup,
          stock_status: (product.buyer_product_status as boolean) ? "available" : "empty",
          seller_product_status: product.seller_product_status as boolean,
          buyer_product_status: product.buyer_product_status as boolean,
          is_active: (product.buyer_product_status as boolean) === true,
          category_id: categoryId,
          unlimited_stock: (product.unlimited_stock as boolean) ?? true,
          provider: "digiflazz",
        };
      });

      const { error } = await supabase.from("products").upsert(upsertData, {
        onConflict: "buyer_sku_code",
        ignoreDuplicates: false,
      });

      if (!error) {
        imported += batch.length;
      } else {
        console.error(`[digiflazz-sync] batch error: ${error.message}`);
        errors.push(error.message);
        failed += batch.length;
      }
    }

    await supabase.from("api_logs").insert({
      service: "digiflazz",
      endpoint: "/v1/price-list",
      request_data: { cmd: "prepaid", total_items: products.length },
      response_data: { total: products.length, imported, failed, errors },
      status_code: 200,
      is_success: failed === 0,
      duration_ms: duration,
    });

    return new Response(JSON.stringify({
      success: true,
      total: products.length,
      imported,
      failed,
      synced: imported,
      message: `Sinkronisasi selesai: ${imported} berhasil, ${failed} gagal dari ${products.length} total produk`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("[digiflazz-sync] error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
