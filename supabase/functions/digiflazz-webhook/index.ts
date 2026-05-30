import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This edge function handles Digiflazz webhook callbacks
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

    // Log webhook
    await supabase.from("webhook_logs").insert({
      source: "digiflazz",
      payload,
      headers: Object.fromEntries(req.headers.entries()),
      is_valid: true,
      processed: false,
    });

    if (!data?.ref_id) {
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
      .or(`digiflazz_ref.eq.${data.ref_id},invoice_no.eq.${data.ref_id}`)
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
    }

    // Mark as processed
    await supabase
      .from("webhook_logs")
      .update({ processed: true })
      .eq("source", "digiflazz")
      .order("created_at", { ascending: false })
      .limit(1);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Digiflazz webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
