import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ResellerLayout from '@/components/layout/ResellerLayout';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDateTime } from '@/lib/utils-app';
import { Wallet, ArrowDownCircle, ArrowUpCircle, RefreshCw, ShoppingCart } from 'lucide-react';

const typeConfig = {
  deposit: { label: 'Deposit', icon: ArrowDownCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', sign: '+' },
  transfer: { label: 'Transfer Masuk', icon: ArrowDownCircle, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', sign: '+' },
  purchase: { label: 'Pembelian', icon: ShoppingCart, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30', sign: '-' },
  refund: { label: 'Refund', icon: RefreshCw, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30', sign: '+' },
};

type TxType = keyof typeof typeConfig;

export default function ResellerBalance() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<TxType | 'all'>('all');

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

  const balance = (reseller?.reseller_balances as { balance: number } | null)?.balance || 0;

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['wallet-transactions-reseller', reseller?.id, filter],
    queryFn: async () => {
      let q = supabase
        .from('wallet_transactions')
        .select('*')
        .eq('reseller_id', reseller!.id)
        .order('created_at', { ascending: false });
      if (filter !== 'all') q = q.eq('type', filter);
      const { data } = await q;
      return data || [];
    },
    enabled: !!reseller?.id,
  });

  const filterTabs: { key: TxType | 'all'; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'deposit', label: 'Deposit' },
    { key: 'transfer', label: 'Transfer' },
    { key: 'purchase', label: 'Pembelian' },
    { key: 'refund', label: 'Refund' },
  ];

  return (
    <ResellerLayout>
      <div className="p-4 md:p-6 space-y-5">
        {/* Header with balance */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Mutasi Saldo</h1>
            <p className="text-sm text-muted-foreground">Riwayat perubahan saldo wallet Anda</p>
          </div>
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-5 py-3">
            <Wallet className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Saldo Saat Ini</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(balance)}</p>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
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

        {/* Transactions List */}
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-border">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-3">
                  <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3.5 rounded w-2/5" />
                    <div className="skeleton h-3 rounded w-3/5" />
                  </div>
                  <div className="skeleton h-4 rounded w-20" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16">
              <Wallet className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Belum ada mutasi saldo</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((tx) => {
                const type = tx.type as TxType;
                const cfg = typeConfig[type] || typeConfig.deposit;
                const Icon = cfg.icon;
                const isCredit = cfg.sign === '+';
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-4 md:px-5 py-3.5 hover:bg-muted/20">
                    <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4.5 h-4.5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{tx.description || cfg.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(tx.created_at)}</p>
                      {tx.reference_id && (
                        <p className="text-[10px] font-mono text-muted-foreground/70 mt-0.5">Ref: {tx.reference_id}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                        {cfg.sign}{formatCurrency(tx.amount)}
                      </p>
                      {tx.balance_after !== null && tx.balance_after !== undefined && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">Saldo: {formatCurrency(tx.balance_after)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ResellerLayout>
  );
}
