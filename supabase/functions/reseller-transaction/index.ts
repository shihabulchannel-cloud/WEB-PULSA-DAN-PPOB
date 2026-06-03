import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { reseller_id, product_id, buyer_sku_code, target_number, amount } = await req.json();

    if (!reseller_id || !product_id || !buyer_sku_code || !target_number || !amount) {
      return new Response(JSON.stringify({ error: 'Data tidak lengkap' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Get current balance
    const { data: balanceRow, error: balErr } = await supabase
      .from('reseller_balances')
      .select('balance')
      .eq('reseller_id', reseller_id)
      .maybeSingle();

    if (balErr || !balanceRow) {
      return new Response(JSON.stringify({ error: 'Saldo tidak ditemukan' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentBalance = balanceRow.balance || 0;
    if (currentBalance < amount) {
      return new Response(JSON.stringify({ error: `Saldo tidak cukup. Saldo Anda: Rp${currentBalance.toLocaleString('id-ID')}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Get product info
    const { data: product } = await supabase
      .from('products')
      .select('name, brand, sell_price, modal_price')
      .eq('id', product_id)
      .maybeSingle();

    if (!product) {
      return new Response(JSON.stringify({ error: 'Produk tidak ditemukan' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Get reseller info for invoice
    const { data: reseller } = await supabase
      .from('resellers')
      .select('user_id, nama')
      .eq('id', reseller_id)
      .maybeSingle();

    // 4. Generate invoice
    const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const rand = Math.floor(Math.random() * 9000 + 1000);
    const invoiceNo = `RSL${ts}${rand}`;

    // 5. Deduct balance
    const newBalance = currentBalance - amount;
    const { error: updateErr } = await supabase
      .from('reseller_balances')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('reseller_id', reseller_id);

    if (updateErr) throw new Error('Gagal update saldo: ' + updateErr.message);

    // 6. Record wallet transaction
    await supabase.from('wallet_transactions').insert({
      reseller_id,
      user_id: reseller?.user_id || null,
      type: 'purchase',
      amount,
      balance_before: currentBalance,
      balance_after: newBalance,
      description: `Beli ${product.name} → ${target_number}`,
      reference_id: invoiceNo,
    });

    // 7. Record balance history (legacy)
    await supabase.from('reseller_balance_history').insert({
      reseller_id,
      type: 'debit',
      amount,
      balance_before: currentBalance,
      balance_after: newBalance,
      description: `Pembelian: ${product.name} → ${target_number}`,
      reference_id: invoiceNo,
    });

    // 8. Create transaction record
    const { data: txData, error: txErr } = await supabase.from('transactions').insert({
      invoice_no: invoiceNo,
      customer_email: `reseller_${reseller_id}@internal`,
      customer_phone: target_number,
      product_id,
      product_name: product.name,
      product_sku: buyer_sku_code,
      buyer_sku_code,
      modal_price: product.modal_price || 0,
      sell_price: amount,
      status: 'pending',
      payment_status: 'paid',
      target_number,
      reseller_id,
    }).select().single();

    if (txErr) {
      console.error('Transaction insert error:', txErr);
    }

    return new Response(JSON.stringify({
      success: true,
      invoice_no: invoiceNo,
      transaction_id: txData?.id,
      new_balance: newBalance,
      message: 'Transaksi berhasil diproses',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('reseller-transaction error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
