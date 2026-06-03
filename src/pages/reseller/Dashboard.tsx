import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ResellerLayout from '@/components/layout/ResellerLayout';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatRelativeTime, getStatusColor, getStatusLabel } from '@/lib/utils-app';
import { Wallet, TrendingUp, ShoppingCart, Clock, CreditCard, ArrowRight, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

  const { data: walletTx = [] } = useQuery({
    queryKey: ['reseller-wallet-tx', reseller?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('reseller_id', reseller!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!reseller?.id,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['reseller-transactions-recent', reseller?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('id, invoice_no, product_name, sell_price, status, payment_status, created_at')
        .eq('reseller_id', reseller!.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!reseller?.id,
  });

  const balance = (reseller?.reseller_balances as { balance: number } | null)?.balance || 0;

  // Build chart data from wallet_tx (last 7 entries reversed for chart)
  const chartData = [...walletTx].reverse().slice(-14).map((tx, idx) => ({
    name: `T${idx + 1}`,
    saldo: tx.balance_after ?? 0,
  }));

  const totalSpent = walletTx.filter(t => t.type === 'purchase').reduce((s, t) => s + (t.amount || 0), 0);
  const totalDeposit = walletTx.filter(t => t.type === 'deposit' || t.type === 'transfer').reduce((s, t) => s + (t.amount || 0), 0);

  const stats = [
    { label: 'Saldo Anda', value: formatCurrency(balance), icon: Wallet, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Deposit', value: formatCurrency(totalDeposit), icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Total Belanja', value: formatCurrency(totalSpent), icon: ShoppingCart, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
    { label: 'Transaksi', value: transactions.length.toString(), icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30' },
  ] as const;

  return (
    <ResellerLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            Halo, {reseller?.nama || user?.user_metadata?.nama || 'Reseller'}!
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Selamat datang di dashboard reseller Anda</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4 shadow-card">
                <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4.5 h-4.5 ${s.color}`} />
                </div>
                <p className={`text-lg md:text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Balance Chart */}
        {chartData.length > 1 && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-card">
            <h3 className="font-semibold text-foreground mb-4">Grafik Saldo</h3>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={60}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), 'Saldo']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                />
                <Area type="monotone" dataKey="saldo" stroke="hsl(var(--primary))" fill="url(#saldoGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

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
              <Link to="/reseller/products">
                <Button variant="outline" className="w-full justify-between text-sm h-10">
                  <span className="flex items-center gap-2"><Package className="w-4 h-4 text-green-500" /> Beli Produk</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              </Link>
              <Link to="/reseller/balance">
                <Button variant="outline" className="w-full justify-between text-sm h-10">
                  <span className="flex items-center gap-2"><Wallet className="w-4 h-4 text-blue-500" /> Mutasi Saldo</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              </Link>
              <Link to="/reseller/transactions">
                <Button variant="outline" className="w-full justify-between text-sm h-10">
                  <span className="flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-yellow-500" /> Riwayat Transaksi</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Recent Wallet Mutations */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Mutasi Saldo Terbaru</h3>
              <Link to="/reseller/balance" className="text-xs text-primary hover:underline">Lihat semua</Link>
            </div>
            {walletTx.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada mutasi saldo</p>
            ) : (
              <div className="space-y-1">
                {walletTx.slice(0, 5).map((tx) => {
                  const isCredit = tx.type !== 'purchase';
                  return (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-xs font-medium text-foreground">{tx.description || tx.type}</p>
                        <p className="text-[11px] text-muted-foreground">{formatRelativeTime(tx.created_at)}</p>
                      </div>
                      <span className={`text-sm font-bold ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                        {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  );
                })}
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
