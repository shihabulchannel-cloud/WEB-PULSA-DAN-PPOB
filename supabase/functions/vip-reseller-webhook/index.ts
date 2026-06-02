import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let body: Record<string, string> = {};
  try { body = await req.json(); } catch { body = {}; }

  const rawBody = JSON.stringify(body);
  console.log("[vip-reseller-webhook] received:", rawBody.substring(0, 500));

  // Log all incoming webhooks
  await supabase.from("webhook_logs").insert({
    source: "vip_reseller",
    payload: body,
    ref_id: body.ref_id || body.trxid || null,
    is_valid: true,
    processed: false,
  }).catch(() => {});

  try {
    // VIP Reseller callback fields
    const refId = body.ref_id || body.trxid || "";
    const status = body.status || "";
    const sn = body.sn || body.serial_number || "";
    const message = body.message || body.desc || "";

    if (!refId) {
      console.log("[vip-reseller-webhook] no ref_id found, ignoring");
      return new Response("OK", { status: 200 });
    }

    // Map VIP Reseller status
    let newStatus = "processing";
    const statusLower = status.toLowerCase();
    if (statusLower === "sukses" || statusLower === "success" || statusLower === "1") {
      newStatus = "success";
    } else if (statusLower === "gagal" || statusLower === "failed" || statusLower === "2") {
      newStatus = "failed";
    }

    if (newStatus !== "processing") {
      // Update transaction by digiflazz_ref or invoice_no
      const { data: tx } = await supabase.from("transactions")
        .select("id, status")
        .or(`digiflazz_ref.eq.${refId},invoice_no.eq.${refId}`)
        .maybeSingle();

      if (tx) {
        await supabase.from("transactions").update({
          status: newStatus,
          digiflazz_status: newStatus,
          digiflazz_message: message,
          digiflazz_sn: sn,
          updated_at: new Date().toISOString(),
        }).eq("id", tx.id);

        console.log(`[vip-reseller-webhook] updated tx ${tx.id} → ${newStatus}`);
      }
    }

    // Mark log as processed
    await supabase.from("webhook_logs")
      .update({ processed: true })
      .eq("source", "vip_reseller")
      .eq("ref_id", refId);

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("[vip-reseller-webhook] error:", err);
    return new Response("ERROR", { status: 500 });
  }
});
