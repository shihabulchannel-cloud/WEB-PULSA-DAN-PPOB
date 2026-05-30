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

  const rawBody = await req.text();

  try {
    const payload = JSON.parse(rawBody);
    const { data } = payload;

    // Filter out sensitive headers before logging
    const safeHeaders: Record<string, string> = {};
    for (const [key, value] of req.headers.entries()) {
      if (!["authorization", "x-service-role", "apikey"].includes(key.toLowerCase())) {
        safeHeaders[key] = value;
      }
    }

    const refId = data?.ref_id || null;

    // Log webhook with ref_id for accurate lookup
    await supabase.from("webhook_logs").insert({
      source: "digiflazz",
      payload,
      headers: safeHeaders,
      ref_id: refId,
      is_valid: true,
      processed: false,
    });

    if (!refId) {
      return new Response(JSON.stringify({ success: false, error: "No ref_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const status = data.status;
    let newStatus = "processing";
    if (status === "Sukses") newStatus = "success";
    else if (status === "Gagal") newStatus = "failed";

    // Find transaction by digiflazz_ref or invoice_no
    const { data: tx } = await supabase
      .from("transactions")
      .select("id, invoice_no")
      .or(`digiflazz_ref.eq.${refId},invoice_no.eq.${refId}`)
      .maybeSingle();

    if (tx) {
      await supabase.from("transactions").update({
        digiflazz_status: newStatus,
        digiflazz_message: data.message,
        digiflazz_sn: data.sn || null,
        status: newStatus,
        updated_at: new Date().toISOString(),
      }).eq("id", tx.id);

      // Send notification
      if (newStatus === "success" || newStatus === "failed") {
        await supabase.functions.invoke("send-notification", {
          body: {
            transaction_id: tx.id,
            type: newStatus === "success" ? "topup_success" : "topup_failed",
          },
        }).catch(() => {});
      }

      // Mark specific webhook log as processed using ref_id
      await supabase
        .from("webhook_logs")
        .update({ processed: true })
        .eq("source", "digiflazz")
        .eq("ref_id", refId);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Digiflazz webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
