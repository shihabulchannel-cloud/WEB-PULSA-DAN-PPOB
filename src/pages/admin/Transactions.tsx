import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw, Eye, Download, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils-app';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

interface Transaction {
  id: string; invoice_no: string; product_name: string; target_id: string;
  customer_name: string; customer_email: string; total_amount: number;
  payment_method_name: string; payment_status: string; status: string; created_at: string;
}

const PAGE_SIZE = 20;

export default function AdminTransactions() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-transactions', search, statusFilter, page],
    queryFn: async () => {
      let q = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (search) q = q.or(`invoice_no.ilike.%${search}%,product_name.ilike.%${search}%,target_id.ilike.%${search}%`);
      if (statusFilter) q = q.eq('status', statusFilter);
      const { data, count } = await q;
      return { data: data || [], total: count || 0 };
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (txId: string) => {
      const { data: tx } = await supabase.from('transactions').select('*').eq('id', txId).maybeSingle();
      if (!tx) throw new Error('Transaction not found');
      const result = await supabase.functions.invoke('digiflazz-transaction', { body: { transaction_id: txId } });
      return result;
    },
    onSuccess: () => {
      toast({ title: 'Retry berhasil', description: 'Transaksi sedang diproses ulang' });
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
    },
    onError: () => toast({ title: 'Retry gagal', variant: 'destructive' }),
  });

  const exportExcel = () => {
    if (!data?.data) return;
    const rows = data.data.map((t: Transaction) => ({
      'Invoice': t.invoice_no,
      'Produk': t.product_name,
      'Tujuan': t.target_id,
      'Customer': t.customer_name || '-',
      'Total': t.total_amount,
      'Metode': t.payment_method_name,
      'Status Bayar': getStatusLabel(t.payment_status),
      'Status': getStatusLabel(t.status),
      'Tanggal': formatDate(t.created_at),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');
    XLSX.writeFile(wb, `transaksi-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manajemen Transaksi</h1>
            <p className="text-sm text-muted-foreground">Total: {data?.total || 0} transaksi</p>
          </div>
          <Button onClick={exportExcel} variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Export Excel
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Cari invoice, produk, nomor tujuan..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['', 'pending', 'processing', 'success', 'failed'].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(0); }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {s === '' ? 'Semua' : getStatusLabel(s)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  {['Invoice', 'Produk', 'Tujuan', 'Total', 'Metode', 'Status', 'Tanggal', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="skeleton h-5 w-full rounded" /></td></tr>
                  ))
                ) : (data?.data || []).map((tx: Transaction) => (
                  <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-primary">{tx.invoice_no}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground max-w-[150px] truncate">{tx.product_name}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{tx.target_id}</td>
                    <td className="px-4 py-3 text-sm font-bold text-foreground">{formatCurrency(tx.total_amount)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{tx.payment_method_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(tx.status)}`}>
                        {getStatusLabel(tx.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(tx.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Link to={`/transaction/${tx.invoice_no}`} target="_blank">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Eye className="w-3.5 h-3.5" /></Button>
                        </Link>
                        {tx.status === 'failed' && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => retryMutation.mutate(tx.id)}>
                            <RefreshCw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Halaman {page + 1} dari {totalPages} ({data?.total || 0} total)
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page === 0} className="h-8 w-8 p-0">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="h-8 w-8 p-0">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
