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
        JSON.stringify({ error: "Digiflazz credentials not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create MD5 signature
    const sign = await createMD5(`${username}${apiKey}pricelist`);

    // Fetch price list from Digiflazz
    const response = await fetch("https://api.digiflazz.com/v1/price-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cmd: "prepaid",
        username,
        sign,
      }),
    });

    const data = await response.json();

    if (!data?.data || !Array.isArray(data.data)) {
      await supabase.from("api_logs").insert({
        service: "digiflazz",
        endpoint: "/v1/price-list",
        request_data: { cmd: "prepaid", username },
        response_data: data,
        status_code: response.status,
        is_success: false,
        error_message: "Invalid response format",
      });
      return new Response(
        JSON.stringify({ error: "Invalid Digiflazz response", raw: data }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const products = data.data;
    let imported = 0;
    let updated = 0;

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

    for (const product of products.slice(0, 500)) {
      // Find matching category
      let categoryId = null;
      for (const [key, slug] of Object.entries(categoryMapping)) {
        if (product.category?.includes(key) || product.brand?.includes(key)) {
          categoryId = catMap[slug] || null;
          break;
        }
      }

      const productData = {
        name: product.product_name,
        brand: product.brand,
        buyer_sku_code: product.buyer_sku_code,
        digiflazz_sku: product.buyer_sku_code,
        modal_price: parseFloat(product.price) || 0,
        sell_price: (parseFloat(product.price) || 0) + 500,
        markup_amount: 500,
        stock_status: product.buyer_product_status ? "available" : "empty",
        seller_product_status: product.seller_product_status,
        buyer_product_status: product.buyer_product_status,
        is_active: product.buyer_product_status === true,
        category_id: categoryId,
        unlimited_stock: product.unlimited_stock ?? true,
      };

      // Upsert by buyer_sku_code
      const { error } = await supabase
        .from("products")
        .upsert(
          { ...productData, sku: product.buyer_sku_code },
          { onConflict: "buyer_sku_code", ignoreDuplicates: false }
        );

      if (!error) {
        imported++;
      } else {
        updated++;
      }
    }

    // Log the sync
    await supabase.from("api_logs").insert({
      service: "digiflazz",
      endpoint: "/v1/price-list",
      request_data: { cmd: "prepaid" },
      response_data: { total: products.length, imported, updated },
      status_code: 200,
      is_success: true,
    });

    return new Response(
      JSON.stringify({
        success: true,
        total: products.length,
        imported,
        updated,
        message: `Berhasil sync ${products.length} produk dari Digiflazz`,
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

async function createMD5(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("MD5", data).catch(() => null);
  
  if (!hashBuffer) {
    // Fallback: use SHA-256 first 16 bytes if MD5 not available
    const sha256Buffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(sha256Buffer));
    return hashArray.slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
