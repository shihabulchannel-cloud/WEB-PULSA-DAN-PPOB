import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ResellerLayout from '@/components/layout/ResellerLayout';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatRelativeTime, getStatusColor, getStatusLabel } from '@/lib/utils-app';
import { Wallet, TrendingUp, ShoppingCart, Clock, CreditCard, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function ResellerDashboard() {
  const { user } = useAuth();

  const { data: reseller } = useQuery({
    queryKey: ['reseller-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('resellers')
        .select('*, reseller_balances(balance)')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['reseller-transactions-recent', reseller?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('id, invoice_no, product_name, sell_price, status, payment_status, created_at, customer_email')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!reseller?.id,
  });

  const { data: balanceHistory = [] } = useQuery({
    queryKey: ['reseller-balance-history-recent', reseller?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('reseller_balance_history')
        .select('*')
        .eq('reseller_id', reseller!.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!reseller?.id,
  });

  const balance = (reseller?.reseller_balances as { balance: number } | null)?.balance || 0;

  const stats = [
    { label: 'Saldo Anda', value: formatCurrency(balance), icon: Wallet, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Transaksi', value: transactions.length.toString(), icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Transaksi Sukses', value: transactions.filter(t => t.status === 'success').length.toString(), icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Menunggu Bayar', value: transactions.filter(t => t.payment_status === 'pending').length.toString(), icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ] as const;

  return (
    <ResellerLayout>
      <div className="p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Halo, {reseller?.nama || user?.user_metadata?.nama || 'Reseller'}!
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Selamat datang di dashboard reseller Anda</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4 shadow-card">
                <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4.5 h-4.5 ${s.color}`} />
                </div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-card">
            <h3 className="font-semibold text-foreground mb-4">Aksi Cepat</h3>
            <div className="space-y-2">
              <Link to="/reseller/deposit">
                <Button variant="outline" className="w-full justify-between text-sm h-10">
                  <span className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Top Up Saldo</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              </Link>
              <Link to="/reseller/transactions">
                <Button variant="outline" className="w-full justify-between text-sm h-10">
                  <span className="flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-blue-500" /> Riwayat Transaksi</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Recent Balance History */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-card">
            <h3 className="font-semibold text-foreground mb-4">Riwayat Saldo Terbaru</h3>
            {balanceHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada histori saldo</p>
            ) : (
              <div className="space-y-2">
                {balanceHistory.map((h) => (
                  <div key={h.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-xs font-medium text-foreground">{h.description || (h.type === 'credit' ? 'Penambahan saldo' : 'Penggunaan saldo')}</p>
                      <p className="text-[11px] text-muted-foreground">{formatRelativeTime(h.created_at)}</p>
                    </div>
                    <span className={`text-sm font-bold ${h.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                      {h.type === 'credit' ? '+' : '-'}{formatCurrency(h.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-semibold text-foreground">Transaksi Terbaru</h3>
              <Link to="/reseller/transactions" className="text-xs text-primary hover:underline">Lihat semua</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    {['Invoice', 'Produk', 'Harga', 'Status'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{t.invoice_no}</td>
                      <td className="px-4 py-3 text-xs text-foreground">{t.product_name}</td>
                      <td className="px-4 py-3 text-xs font-semibold">{formatCurrency(t.sell_price)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full border text-xs ${getStatusColor(t.status)}`}>{getStatusLabel(t.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ResellerLayout>
  );
}
