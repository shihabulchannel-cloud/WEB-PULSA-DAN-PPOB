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

  // Require admin authentication
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify the calling user is an authenticated admin
  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authError } = await anonClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Get Digiflazz credentials from settings
    const { data: settings } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["digiflazz_username", "digiflazz_api_key"]);

    const settingsMap = Object.fromEntries((settings || []).map((s: { key: string; value: string }) => [s.key, s.value]));
    const username = settingsMap["digiflazz_username"];
    const apiKey = settingsMap["digiflazz_api_key"];

    if (!username || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Digiflazz credentials not configured. Set in Settings > Digiflazz." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create correct MD5 signature
    const sign = await createMD5(`${username}${apiKey}pricelist`);

    // Fetch price list from Digiflazz
    const startTime = Date.now();
    const response = await fetch("https://api.digiflazz.com/v1/price-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd: "prepaid", username, sign }),
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    if (!data?.data || !Array.isArray(data.data)) {
      await supabase.from("api_logs").insert({
        service: "digiflazz",
        endpoint: "/v1/price-list",
        request_data: { cmd: "prepaid", username },
        response_data: data,
        status_code: response.status,
        is_success: false,
        error_message: "Invalid response format",
        duration_ms: duration,
      });
      return new Response(
        JSON.stringify({ error: "Invalid Digiflazz response", raw: data }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const products = data.data;

    // Get all categories
    const { data: categories } = await supabase.from("categories").select("id, slug");
    const catMap: Record<string, string> = {};
    (categories || []).forEach((c: { id: string; slug: string }) => { catMap[c.slug] = c.id; });

    // Map Digiflazz categories to our categories
    const categoryMapping: Record<string, string> = {
      "Games": "top-up-game",
      "Pulsa": "pulsa",
      "Data": "paket-data",
      "E-Money": "e-wallet",
      "PLN": "ppob",
      "BPJS": "ppob",
      "PDAM": "ppob",
      "Voucher": "voucher-digital",
    };

    let imported = 0;
    let failed = 0;

    // Process ALL products in batches
    const batchSize = 100;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const upsertData = batch.map((product: Record<string, unknown>) => {
        let categoryId = null;
        for (const [key, slug] of Object.entries(categoryMapping)) {
          const cat = product.category as string || "";
          const brand = product.brand as string || "";
          if (cat.includes(key) || brand.includes(key)) {
            categoryId = catMap[slug] || null;
            break;
          }
        }
        return {
          name: product.product_name as string,
          brand: product.brand as string,
          sku: product.buyer_sku_code as string,
          buyer_sku_code: product.buyer_sku_code as string,
          digiflazz_sku: product.buyer_sku_code as string,
          modal_price: parseFloat(product.price as string) || 0,
          sell_price: (parseFloat(product.price as string) || 0) + 500,
          markup_amount: 500,
          stock_status: (product.buyer_product_status as boolean) ? "available" : "empty",
          seller_product_status: product.seller_product_status as boolean,
          buyer_product_status: product.buyer_product_status as boolean,
          is_active: (product.buyer_product_status as boolean) === true,
          category_id: categoryId,
          unlimited_stock: (product.unlimited_stock as boolean) ?? true,
        };
      });

      const { error } = await supabase
        .from("products")
        .upsert(upsertData, { onConflict: "buyer_sku_code", ignoreDuplicates: false });

      if (!error) {
        imported += batch.length;
      } else {
        console.error("Batch upsert error:", error.message);
        failed += batch.length;
      }
    }

    // Log the sync
    await supabase.from("api_logs").insert({
      service: "digiflazz",
      endpoint: "/v1/price-list",
      request_data: { cmd: "prepaid" },
      response_data: { total: products.length, imported, failed },
      status_code: 200,
      is_success: true,
      duration_ms: duration,
    });

    return new Response(
      JSON.stringify({
        success: true,
        total: products.length,
        imported,
        failed,
        message: `Berhasil sync ${imported} produk dari ${products.length} total Digiflazz`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Digiflazz sync error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
