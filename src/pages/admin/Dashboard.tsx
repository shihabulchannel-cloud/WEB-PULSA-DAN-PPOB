import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ShoppingCart, DollarSign, Package, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils-app';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';

interface Stats {
  todayRevenue: number;
  todayProfit: number;
  todayTransactions: number;
  monthRevenue: number;
  monthProfit: number;
  monthTransactions: number;
}

interface ChartData {
  date: string;
  revenue: number;
  profit: number;
  transactions: number;
}

interface TopProduct {
  product_name: string;
  count: number;
  revenue: number;
}

export default function AdminDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [todayResult, monthResult] = await Promise.all([
        supabase.from('transactions').select('sell_price, profit, status').gte('created_at', today),
        supabase.from('transactions').select('sell_price, profit, status').gte('created_at', monthStart),
      ]);
      const calcStats = (data: { sell_price: number; profit: number; status: string }[]) => {
        const successful = (data || []).filter(t => t.status === 'success');
        return {
          revenue: successful.reduce((s, t) => s + (t.sell_price || 0), 0),
          profit: successful.reduce((s, t) => s + (t.profit || 0), 0),
          transactions: successful.length,
        };
      };
      const todayStats = calcStats(todayResult.data || []);
      const monthStats = calcStats(monthResult.data || []);
      return {
        todayRevenue: todayStats.revenue,
        todayProfit: todayStats.profit,
        todayTransactions: todayStats.transactions,
        monthRevenue: monthStats.revenue,
        monthProfit: monthStats.profit,
        monthTransactions: monthStats.transactions,
      };
    },
    refetchInterval: 30000,
  });

  const { data: chartData = [] } = useQuery<ChartData[]>({
    queryKey: ['admin-chart'],
    queryFn: async () => {
      const days: ChartData[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const dateStr = d.toISOString().slice(0, 10);
        const { data } = await supabase
          .from('transactions')
          .select('sell_price, profit, status')
          .gte('created_at', dateStr)
          .lt('created_at', subDays(d, -1).toISOString().slice(0, 10));
        const successful = (data || []).filter(t => t.status === 'success');
        days.push({
          date: format(d, 'dd MMM', { locale: id }),
          revenue: successful.reduce((s, t) => s + (t.sell_price || 0), 0),
          profit: successful.reduce((s, t) => s + (t.profit || 0), 0),
          transactions: successful.length,
        });
      }
      return days;
    },
  });

  const { data: topProducts = [] } = useQuery<TopProduct[]>({
    queryKey: ['admin-top-products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('product_name, sell_price, status')
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(200);
      const grouped = (data || []).reduce((acc: Record<string, TopProduct>, t) => {
        if (!acc[t.product_name]) acc[t.product_name] = { product_name: t.product_name, count: 0, revenue: 0 };
        acc[t.product_name].count++;
        acc[t.product_name].revenue += t.sell_price || 0;
        return acc;
      }, {});
      return Object.values(grouped).sort((a, b) => b.count - a.count).slice(0, 8);
    },
  });

  const { data: recentTx = [] } = useQuery({
    queryKey: ['admin-recent-tx'],
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('invoice_no, product_name, target_id, total_amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(8);
      return data || [];
    },
    refetchInterval: 15000,
  });

  const statsCards = [
    { label: 'Penjualan Hari Ini', value: formatCurrency(stats?.todayRevenue || 0), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Profit Hari Ini', value: formatCurrency(stats?.todayProfit || 0), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Transaksi Hari Ini', value: stats?.todayTransactions?.toString() || '0', icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Penjualan Bulan Ini', value: formatCurrency(stats?.monthRevenue || 0), icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Selamat datang di panel admin SHIELACOM CELL</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-slow" />
              <span>Live</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-card rounded-2xl border border-border shadow-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
                {statsLoading ? (
                  <div className="skeleton h-8 w-32 rounded" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Month Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl border border-border shadow-card p-5">
            <p className="text-sm text-muted-foreground mb-1">Profit Bulan Ini</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats?.monthProfit || 0)}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border shadow-card p-5">
            <p className="text-sm text-muted-foreground mb-1">Total Transaksi Bulan Ini</p>
            <p className="text-2xl font-bold text-foreground">{stats?.monthTransactions || 0} <span className="text-sm font-normal text-muted-foreground">transaksi</span></p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-6">
          <h3 className="font-semibold text-foreground mb-4">Grafik Penjualan 14 Hari</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(220 90% 50%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(220 90% 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(145 60% 45%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(145 60% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} labelStyle={{ fontSize: 12 }} contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(220 90% 50%)" strokeWidth={2} fill="url(#colorRevenue)" name="Penjualan" />
              <Area type="monotone" dataKey="profit" stroke="hsl(145 60% 45%)" strokeWidth={2} fill="url(#colorProfit)" name="Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent Transactions */}
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm">Transaksi Terbaru</h3>
              <Button variant="ghost" size="sm" className="text-xs gap-1"><RefreshCw className="w-3 h-3" />Refresh</Button>
            </div>
            <div className="divide-y divide-border">
              {recentTx.slice(0, 6).map((tx: { invoice_no: string; product_name: string; target_id: string; total_amount: number; status: string; created_at: string }) => (
                <div key={tx.invoice_no} className="px-5 py-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{tx.product_name}</p>
                    <p className="text-xs text-muted-foreground">{tx.invoice_no} • {tx.target_id}</p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-sm font-medium text-foreground">{formatCurrency(tx.total_amount)}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${
                      tx.status === 'success' ? 'text-green-600 bg-green-50 border-green-200' :
                      tx.status === 'failed' ? 'text-red-600 bg-red-50 border-red-200' :
                      'text-yellow-600 bg-yellow-50 border-yellow-200'
                    }`}>
                      {tx.status === 'success' ? 'Berhasil' : tx.status === 'failed' ? 'Gagal' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground text-sm">Produk Terlaris</h3>
            </div>
            <div className="p-5 space-y-3">
              {topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
              ) : topProducts.map((p, i) => (
                <div key={p.product_name} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground/40 w-6 flex-shrink-0">#{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.product_name}</p>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                      <div
                        className="h-1.5 rounded-full gradient-primary"
                        style={{ width: `${Math.max(10, (p.count / (topProducts[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-foreground">{p.count}x</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(p.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
