import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { formatCurrency, formatDateTime } from '@/lib/utils-app';
import { ArrowDownCircle, ArrowUpCircle, ShoppingCart, RefreshCw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const typeConfig = {
  deposit: { label: 'Deposit', icon: ArrowDownCircle, color: 'text-green-600', bg: 'bg-green-50', sign: '+' },
  transfer: { label: 'Transfer', icon: ArrowDownCircle, color: 'text-blue-600', bg: 'bg-blue-50', sign: '+' },
  purchase: { label: 'Pembelian', icon: ShoppingCart, color: 'text-red-500', bg: 'bg-red-50', sign: '-' },
  refund: { label: 'Refund', icon: RefreshCw, color: 'text-teal-600', bg: 'bg-teal-50', sign: '+' },
};

type TxType = keyof typeof typeConfig;

export default function AdminWalletTransactions() {
  const [filter, setFilter] = useState<TxType | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['admin-wallet-transactions', filter],
    queryFn: async () => {
      let q = supabase
        .from('wallet_transactions')
        .select('*, resellers(nama, username)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (filter !== 'all') q = q.eq('type', filter);
      const { data } = await q;
      return data || [];
    },
  });

  const filtered = search
    ? transactions.filter(t =>
        (t.resellers as { nama?: string; username?: string } | null)?.nama?.toLowerCase().includes(search.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.reference_id || '').toLowerCase().includes(search.toLowerCase())
      )
    : transactions;

  const filterTabs: { key: TxType | 'all'; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'deposit', label: 'Deposit' },
    { key: 'transfer', label: 'Transfer' },
    { key: 'purchase', label: 'Pembelian' },
    { key: 'refund', label: 'Refund' },
  ];

  const totalIn = transactions.filter(t => t.type !== 'purchase').reduce((s, t) => s + (t.amount || 0), 0);
  const totalOut = transactions.filter(t => t.type === 'purchase').reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mutasi Wallet Reseller</h1>
          <p className="text-sm text-muted-foreground">Log semua perubahan saldo reseller</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground">Total Transaksi</p>
            <p className="text-xl font-bold text-foreground">{transactions.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground">Total Masuk</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalIn)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground">Total Keluar</p>
            <p className="text-xl font-bold text-red-500">{formatCurrency(totalOut)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 flex-wrap">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  filter === tab.key
                    ? 'gradient-button text-primary-foreground border-transparent'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Cari reseller, deskripsi..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  {['Waktu', 'Reseller', 'Tipe', 'Deskripsi', 'Jumlah', 'Saldo Setelah'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">Tidak ada data</td></tr>
                ) : filtered.map(tx => {
                  const type = tx.type as TxType;
                  const cfg = typeConfig[type] || typeConfig.deposit;
                  const Icon = cfg.icon;
                  const isCredit = cfg.sign === '+';
                  const reseller = tx.resellers as { nama?: string; username?: string } | null;
                  return (
                    <tr key={tx.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(tx.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{reseller?.nama || '-'}</p>
                        {reseller?.username && <p className="text-xs text-muted-foreground">@{reseller.username}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="text-sm text-foreground truncate">{tx.description || '-'}</p>
                        {tx.reference_id && <p className="text-[10px] font-mono text-muted-foreground/70">{tx.reference_id}</p>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm font-bold ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                          {cfg.sign}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                        {tx.balance_after !== null && tx.balance_after !== undefined
                          ? formatCurrency(tx.balance_after) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
