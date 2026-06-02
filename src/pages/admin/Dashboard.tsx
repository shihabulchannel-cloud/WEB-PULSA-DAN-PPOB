import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, ShoppingCart, DollarSign, Package, RefreshCw,
  PackageX, Banknote, ArrowUpRight, Calendar, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils-app';
import { format, subDays, startOfMonth, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';

const CHART_GREEN = '#0e8a4a';
const CHART_ACCENT = '#1cc96b';
const CHART_BLUE = '#3b82f6';

interface Stats {
  todayRevenue: number; todayProfit: number; todayTransactions: number;
  monthRevenue: number; monthProfit: number; monthTransactions: number;
  totalDeposit: number; activeProducts: number; inactiveProducts: number;
}

export default function AdminDashboard() {
  const [chartView, setChartView] = useState<'daily' | 'monthly'>('daily');
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = startOfMonth(new Date()).toISOString();

  /* ── Stats ── */
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [todayR, monthR, depositR, activeR, inactiveR] = await Promise.all([
        supabase.from('transactions').select('sell_price,profit,status').gte('created_at', today),
        supabase.from('transactions').select('sell_price,profit,status').gte('created_at', monthStart),
        supabase.from('transactions').select('total_amount').eq('payment_status', 'paid'),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', false),
      ]);
      const calc = (data: { sell_price: number; profit: number; status: string }[]) => {
        const s = (data || []).filter(t => t.status === 'success');
        return { revenue: s.reduce((a, t) => a + (t.sell_price || 0), 0), profit: s.reduce((a, t) => a + (t.profit || 0), 0), count: s.length };
      };
      const td = calc(todayR.data || []);
      const mo = calc(monthR.data || []);
      const dep = (depositR.data || []).reduce((a, t) => a + (t.total_amount || 0), 0);
      return {
        todayRevenue: td.revenue, todayProfit: td.profit, todayTransactions: td.count,
        monthRevenue: mo.revenue, monthProfit: mo.profit, monthTransactions: mo.count,
        totalDeposit: dep,
        activeProducts: activeR.count || 0,
        inactiveProducts: inactiveR.count || 0,
      };
    },
    refetchInterval: 30000,
  });

  /* ── Daily Chart ── */
  const { data: dailyData = [] } = useQuery({
    queryKey: ['admin-chart-daily'],
    queryFn: async () => {
      const days = [];
      for (let i = 13; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const dateStr = d.toISOString().slice(0, 10);
        const nextStr = subDays(d, -1).toISOString().slice(0, 10);
        const { data } = await supabase.from('transactions').select('sell_price,profit,status').gte('created_at', dateStr).lt('created_at', nextStr);
        const s = (data || []).filter(t => t.status === 'success');
        days.push({
          date: format(d, 'dd MMM', { locale: id }),
          omzet: s.reduce((a, t) => a + (t.sell_price || 0), 0),
          profit: s.reduce((a, t) => a + (t.profit || 0), 0),
          trx: s.length,
        });
      }
      return days;
    },
  });

  /* ── Monthly Chart ── */
  const { data: monthlyData = [] } = useQuery({
    queryKey: ['admin-chart-monthly'],
    queryFn: async () => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const m = subMonths(new Date(), i);
        const start = startOfMonth(m).toISOString();
        const end = startOfMonth(subMonths(m, -1)).toISOString();
        const { data } = await supabase.from('transactions').select('sell_price,profit,status').gte('created_at', start).lt('created_at', end);
        const s = (data || []).filter(t => t.status === 'success');
        months.push({
          bulan: format(m, 'MMM yy', { locale: id }),
          omzet: s.reduce((a, t) => a + (t.sell_price || 0), 0),
          profit: s.reduce((a, t) => a + (t.profit || 0), 0),
          trx: s.length,
        });
      }
      return months;
    },
  });

  /* ── Top Products ── */
  const { data: topProducts = [] } = useQuery({
    queryKey: ['admin-top-products'],
    queryFn: async () => {
      const { data } = await supabase.from('transactions').select('product_name,sell_price,status').eq('status', 'success').order('created_at', { ascending: false }).limit(300);
      const g = (data || []).reduce((acc: Record<string, { product_name: string; count: number; revenue: number }>, t) => {
        if (!acc[t.product_name]) acc[t.product_name] = { product_name: t.product_name, count: 0, revenue: 0 };
        acc[t.product_name].count++;
        acc[t.product_name].revenue += t.sell_price || 0;
        return acc;
      }, {});
      return Object.values(g).sort((a, b) => b.count - a.count).slice(0, 6);
    },
  });

  /* ── Payment Method Stats ── */
  const { data: paymentStats = [] } = useQuery({
    queryKey: ['admin-payment-stats'],
    queryFn: async () => {
      const { data } = await supabase.from('transactions').select('payment_method_name,total_amount,status').eq('payment_status', 'paid').order('created_at', { ascending: false }).limit(500);
      const g = (data || []).reduce((acc: Record<string, { name: string; count: number; amount: number }>, t) => {
        const k = t.payment_method_name || 'Lainnya';
        if (!acc[k]) acc[k] = { name: k, count: 0, amount: 0 };
        acc[k].count++;
        acc[k].amount += t.total_amount || 0;
        return acc;
      }, {});
      return Object.values(g).sort((a, b) => b.count - a.count).slice(0, 6);
    },
  });

  /* ── Recent Transactions ── */
  const { data: recentTx = [], refetch: refetchTx } = useQuery({
    queryKey: ['admin-recent-tx'],
    queryFn: async () => {
      const { data } = await supabase.from('transactions').select('invoice_no,product_name,target_id,total_amount,status,created_at').order('created_at', { ascending: false }).limit(8);
      return data || [];
    },
    refetchInterval: 15000,
  });

  const COLORS = [CHART_GREEN, CHART_ACCENT, CHART_BLUE, '#f97316', '#a855f7', '#ef4444'];

  const statCards = [
    { label: 'Omzet Hari Ini', value: formatCurrency(stats?.todayRevenue || 0), sub: `${stats?.todayTransactions || 0} transaksi`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', trend: '+' },
    { label: 'Profit Hari Ini', value: formatCurrency(stats?.todayProfit || 0), sub: 'margin bersih', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', trend: '+' },
    { label: 'Omzet Bulan Ini', value: formatCurrency(stats?.monthRevenue || 0), sub: `${stats?.monthTransactions || 0} transaksi`, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', trend: '+' },
    { label: 'Profit Bulan Ini', value: formatCurrency(stats?.monthProfit || 0), sub: 'akumulasi bulan ini', icon: ArrowUpRight, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', trend: '+' },
    { label: 'Transaksi Hari Ini', value: String(stats?.todayTransactions || 0), sub: 'sukses', icon: ShoppingCart, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', trend: '' },
    { label: 'Transaksi Bulan Ini', value: String(stats?.monthTransactions || 0), sub: 'sukses', icon: Activity, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100', trend: '' },
    { label: 'Total Deposit Masuk', value: formatCurrency(stats?.totalDeposit || 0), sub: 'semua waktu', icon: Banknote, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', trend: '' },
    { label: 'Produk Aktif', value: String(stats?.activeProducts || 0), sub: 'produk tersedia', icon: Package, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', trend: '' },
    { label: 'Produk Nonaktif', value: String(stats?.inactiveProducts || 0), sub: 'dinonaktifkan', icon: PackageX, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', trend: '' },
  ];

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Panel Admin SHIELACOM CELL — {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-slow" />
              <span>Live</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3">
          {statCards.slice(0, 6).map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`bg-card rounded-2xl border ${card.border} shadow-card p-4 md:p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs md:text-sm text-muted-foreground leading-tight">{card.label}</p>
                  <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 md:w-5 md:h-5 ${card.color}`} />
                  </div>
                </div>
                {statsLoading ? (
                  <div className="skeleton h-7 w-28 rounded" />
                ) : (
                  <p className="text-lg md:text-2xl font-bold text-foreground leading-tight">{card.value}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Bottom Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {statCards.slice(6).map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`bg-card rounded-2xl border ${card.border} shadow-card p-4 flex items-center gap-4`}>
                <div className={`w-11 h-11 rounded-2xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  {statsLoading ? <div className="skeleton h-6 w-20 rounded mt-1" /> : (
                    <p className="text-lg font-bold text-foreground">{card.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{card.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Grafik Penjualan</h3>
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              <button onClick={() => setChartView('daily')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${chartView === 'daily' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                14 Hari
              </button>
              <button onClick={() => setChartView('monthly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${chartView === 'monthly' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                6 Bulan
              </button>
            </div>
          </div>

          {chartView === 'daily' ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="cOmzet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_GREEN} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={CHART_GREEN} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_ACCENT} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={CHART_ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(120 10% 88%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(150 10% 48%)" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(150 10% 48%)" tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : String(v)} />
                <Tooltip formatter={(v: number, name: string) => [formatCurrency(v), name === 'omzet' ? 'Omzet' : 'Profit']} labelStyle={{ fontSize: 11 }} contentStyle={{ borderRadius: 10, border: '1px solid hsl(120 10% 88%)', fontSize: 11 }} />
                <Area type="monotone" dataKey="omzet" stroke={CHART_GREEN} strokeWidth={2} fill="url(#cOmzet)" name="omzet" />
                <Area type="monotone" dataKey="profit" stroke={CHART_ACCENT} strokeWidth={2} fill="url(#cProfit)" name="profit" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(120 10% 88%)" />
                <XAxis dataKey="bulan" tick={{ fontSize: 10 }} stroke="hsl(150 10% 48%)" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(150 10% 48%)" tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : String(v)} />
                <Tooltip formatter={(v: number, name: string) => [formatCurrency(v), name === 'omzet' ? 'Omzet' : 'Profit']} labelStyle={{ fontSize: 11 }} contentStyle={{ borderRadius: 10, border: '1px solid hsl(120 10% 88%)', fontSize: 11 }} />
                <Legend formatter={v => v === 'omzet' ? 'Omzet' : 'Profit'} />
                <Bar dataKey="omzet" fill={CHART_GREEN} radius={[4, 4, 0, 0]} name="omzet" />
                <Bar dataKey="profit" fill={CHART_ACCENT} radius={[4, 4, 0, 0]} name="profit" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Recent Transactions */}
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm">Transaksi Terbaru</h3>
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => { refetchTx(); qc.invalidateQueries({ queryKey: ['admin-stats'] }); }}>
                <RefreshCw className="w-3 h-3" /> Refresh
              </Button>
            </div>
            <div className="divide-y divide-border">
              {recentTx.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">Belum ada transaksi</div>
              ) : recentTx.slice(0, 6).map((tx: { invoice_no: string; product_name: string; target_id: string; total_amount: number; status: string; created_at: string }) => (
                <div key={tx.invoice_no} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{tx.product_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{tx.invoice_no} • {tx.target_id}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(tx.total_amount)}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${
                      tx.status === 'success' ? 'text-green-700 bg-green-50 border-green-200' :
                      tx.status === 'failed' ? 'text-red-600 bg-red-50 border-red-200' :
                      'text-yellow-600 bg-yellow-50 border-yellow-200'
                    }`}>{tx.status === 'success' ? 'Berhasil' : tx.status === 'failed' ? 'Gagal' : 'Pending'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column: Top Products + Payment Stats */}
          <div className="space-y-5">
            {/* Top Products */}
            <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-foreground text-sm">Produk Terlaris</h3>
              </div>
              <div className="p-4 space-y-2.5">
                {topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
                ) : topProducts.slice(0, 5).map((p: { product_name: string; count: number; revenue: number }, i: number) => (
                  <div key={p.product_name} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground/50 w-5 flex-shrink-0">#{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{p.product_name}</p>
                      <div className="w-full bg-muted rounded-full h-1 mt-1">
                        <div className="h-1 rounded-full bg-primary" style={{ width: `${Math.max(8, (p.count / (topProducts[0]?.count || 1)) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-foreground">{p.count}x</p>
                      <p className="text-[10px] text-muted-foreground">{formatCurrency(p.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Stats */}
            <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-foreground text-sm">Metode Pembayaran</h3>
              </div>
              {paymentStats.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Belum ada data pembayaran</p>
              ) : (
                <div className="p-4 flex items-center gap-4">
                  <ResponsiveContainer width={100} height={100}>
                    <PieChart>
                      <Pie data={paymentStats} dataKey="count" cx="50%" cy="50%" outerRadius={46} innerRadius={28} strokeWidth={0}>
                        {paymentStats.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">
                    {paymentStats.slice(0, 5).map((p: { name: string; count: number; amount: number }, i: number) => (
                      <div key={p.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-xs text-foreground flex-1 truncate">{p.name}</span>
                        <span className="text-xs font-semibold text-foreground">{p.count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
