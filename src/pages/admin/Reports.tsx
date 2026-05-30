import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, TrendingUp, DollarSign, ShoppingCart, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { formatCurrency, formatDate } from '@/lib/utils-app';
import * as XLSX from 'xlsx';
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export default function AdminReports() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: txData = [], isLoading } = useQuery({
    queryKey: ['report-transactions', startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  interface TxItem {
    status: string;
    sell_price: number;
    modal_price: number;
    profit: number;
    created_at: string;
    invoice_no: string;
    product_name: string;
    target_id: string;
    payment_method_name: string;
    total_amount: number;
  }

  const successful = (txData as TxItem[]).filter((t) => t.status === 'success');
  const totalRevenue = successful.reduce((s, t) => s + (t.sell_price || 0), 0);
  const totalProfit = successful.reduce((s, t) => s + (t.profit || 0), 0);
  const totalModal = successful.reduce((s, t) => s + (t.modal_price || 0), 0);

  // Group by date for chart
  const byDate = (txData as TxItem[]).reduce((acc: Record<string, { revenue: number; profit: number; transactions: number }>, t) => {
    const date = t.created_at?.slice(0, 10) || '';
    if (!acc[date]) acc[date] = { revenue: 0, profit: 0, transactions: 0 };
    if (t.status === 'success') {
      acc[date].revenue += t.sell_price || 0;
      acc[date].profit += t.profit || 0;
      acc[date].transactions++;
    }
    return acc;
  }, {});

  const chartData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, stats]) => ({
      date: format(parseISO(date), 'dd MMM', { locale: id }),
      ...stats,
    }));

  const exportExcel = () => {
    const rows = (txData as TxItem[]).map(t => ({
      Invoice: t.invoice_no,
      Tanggal: formatDate(t.created_at),
      Produk: t.product_name,
      Tujuan: t.target_id,
      Metode: t.payment_method_name,
      'Harga Modal': t.modal_price,
      'Harga Jual': t.sell_price,
      Profit: t.profit,
      Total: t.total_amount,
      Status: t.status,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
    XLSX.writeFile(wb, `laporan-${startDate}-${endDate}.xlsx`);
  };

  const exportCSV = () => {
    const rows = (txData as TxItem[]).map(t => `${t.invoice_no},${t.product_name},${t.sell_price},${t.profit},${t.status},${t.created_at}`);
    const csv = 'Invoice,Produk,Harga Jual,Profit,Status,Tanggal\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `laporan-${startDate}-${endDate}.csv`; a.click();
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Laporan Profit</h1>
            <p className="text-sm text-muted-foreground">Analisis penjualan dan keuntungan</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV} className="gap-2"><Download className="w-4 h-4" /> CSV</Button>
            <Button onClick={exportExcel} className="gap-2 gradient-button text-primary-foreground"><Download className="w-4 h-4" /> Excel</Button>
          </div>
        </div>

        {/* Date Filter */}
        <div className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row gap-3 items-end">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Dari Tanggal</label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-auto" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Sampai Tanggal</label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-auto" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Penjualan', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Total Profit', value: formatCurrency(totalProfit), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Total Transaksi', value: successful.length.toString(), icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Margin Rata-rata', value: totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}%` : '0%', icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-card rounded-2xl border border-border shadow-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground">{card.value}</p>
              </div>
            );
          })}
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-card rounded-2xl border border-border shadow-card p-6">
            <h3 className="font-semibold text-foreground mb-4">Grafik Penjualan & Profit</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(220 90% 50%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(220 90% 50%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(145 60% 45%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(145 60% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v.toString()} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="hsl(220 90% 50%)" fill="url(#colorRev)" name="Penjualan" />
                <Area type="monotone" dataKey="profit" stroke="hsl(145 60% 45%)" fill="url(#colorPro)" name="Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Table */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm">Detail Transaksi ({txData.length} transaksi)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  {['Invoice', 'Produk', 'Harga Jual', 'Modal', 'Profit', 'Status', 'Tanggal'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>)
                ) : (txData as TxItem[]).slice(0, 50).map(tx => (
                  <tr key={tx.invoice_no} className="hover:bg-muted/20">
                    <td className="px-4 py-3 text-xs font-mono text-primary">{tx.invoice_no}</td>
                    <td className="px-4 py-3 text-sm text-foreground max-w-[140px] truncate">{tx.product_name}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{formatCurrency(tx.sell_price)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatCurrency(tx.modal_price)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600">{formatCurrency(tx.profit)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full border text-xs font-medium ${tx.status === 'success' ? 'text-green-600 bg-green-50 border-green-200' : tx.status === 'failed' ? 'text-red-600 bg-red-50 border-red-200' : 'text-yellow-600 bg-yellow-50 border-yellow-200'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
