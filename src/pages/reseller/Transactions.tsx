import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ResellerLayout from '@/components/layout/ResellerLayout';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils-app';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function ResellerTransactions() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['reseller-all-transactions', user?.id, search],
    queryFn: async () => {
      let q = supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (search) q = q.or(`invoice_no.ilike.%${search}%,product_name.ilike.%${search}%,customer_email.ilike.%${search}%`);
      const { data } = await q;
      return data || [];
    },
    enabled: !!user?.id,
  });

  return (
    <ResellerLayout>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Riwayat Transaksi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{transactions.length} transaksi ditemukan</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari invoice, produk, email..." value={search}
            onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b border-border">
                <tr>{['Invoice', 'Produk', 'Target', 'Harga', 'Pembayaran', 'Status', 'Tanggal'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td></tr>
                )) : transactions.map(t => (
                  <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">{t.invoice_no}</td>
                    <td className="px-4 py-3 text-xs text-foreground max-w-[160px] truncate">{t.product_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.target_id}</td>
                    <td className="px-4 py-3 text-xs font-semibold whitespace-nowrap">{formatCurrency(t.sell_price)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full border text-xs ${getStatusColor(t.payment_status)}`}>
                        {t.payment_status === 'paid' ? 'Dibayar' : t.payment_status === 'pending' ? 'Belum' : t.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full border text-xs ${getStatusColor(t.status)}`}>{getStatusLabel(t.status)}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isLoading && transactions.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-12">Belum ada transaksi</p>
          )}
        </div>
      </div>
    </ResellerLayout>
  );
}
