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
    const { transaction_id, type } = await req.json();

    // Get transaction details
    const { data: tx } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transaction_id)
      .maybeSingle();

    if (!tx) throw new Error("Transaction not found");

    // Get notification settings including site_url
    const { data: settings } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["fonnte_api_key", "smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from", "site_name", "site_url"]);

    const sm = Object.fromEntries((settings || []).map((s: { key: string; value: string }) => [s.key, s.value]));
    const siteName = sm["site_name"] || "SHIELACOM CELL";
    const siteUrl = sm["site_url"]?.replace(/\/$/, "") || "";

    const isSuccess = type === "topup_success" || type === "payment_success";
    const message = isSuccess
      ? `Transaksi ${tx.product_name} untuk ${tx.target_id} berhasil diproses!\nInvoice: ${tx.invoice_no}\nSerial Number: ${tx.digiflazz_sn || "-"}`
      : `Maaf, transaksi ${tx.product_name} untuk ${tx.target_id} gagal diproses.\nInvoice: ${tx.invoice_no}\nSilakan hubungi customer service.`;

    const statusUrl = siteUrl
      ? `${siteUrl}/transaction/${tx.invoice_no}`
      : `/transaction/${tx.invoice_no}`;

    // Insert in-app notification
    await supabase.from("notifications").insert({
      transaction_id,
      type,
      channel: "web",
      recipient: tx.customer_email || tx.customer_phone,
      message,
      is_sent: true,
      sent_at: new Date().toISOString(),
    });

    const notifications: { channel: string; sent: boolean; note?: string }[] = [];

    // Send WhatsApp via Fonnte
    if (sm["fonnte_api_key"] && tx.customer_phone) {
      try {
        const statusLabel = isSuccess ? "BERHASIL" : "GAGAL";
        const waMessage = [
          `*${siteName}*`,
          ``,
          `Status transaksi Anda: *${statusLabel}*`,
          ``,
          `Produk: ${tx.product_name}`,
          `Tujuan: ${tx.target_id}`,
          `Invoice: ${tx.invoice_no}`,
          isSuccess && tx.digiflazz_sn ? `Serial Number: ${tx.digiflazz_sn}` : null,
          isSuccess ? null : `Hubungi CS kami untuk bantuan.`,
          ``,
          `Cek status: ${statusUrl}`,
        ].filter(Boolean).join("\n");

        const waResponse = await fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: {
            Authorization: sm["fonnte_api_key"],
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target: tx.customer_phone.replace(/^0/, "62"),
            message: waMessage,
          }),
        });

        const waResult = await waResponse.json();

        await supabase.from("notifications").insert({
          transaction_id,
          type,
          channel: "whatsapp",
          recipient: tx.customer_phone,
          message: waMessage,
          is_sent: waResult.status === true,
          sent_at: new Date().toISOString(),
          error_message: waResult.status !== true ? JSON.stringify(waResult) : null,
        });

        notifications.push({ channel: "whatsapp", sent: waResult.status === true });
      } catch (waError) {
        console.error("WhatsApp notification error:", waError);
      }
    }

    // Email notification placeholder (SMTP not yet implemented)
    if (sm["smtp_host"] && sm["smtp_user"] && tx.customer_email) {
      await supabase.from("notifications").insert({
        transaction_id,
        type,
        channel: "email",
        recipient: tx.customer_email,
        message: message,
        is_sent: false,
        error_message: "Configure SMTP or email provider in Settings",
      });
      notifications.push({ channel: "email", sent: false, note: "Configure SMTP in settings" });
    }

    return new Response(
      JSON.stringify({ success: true, notifications }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send notification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
