import { useEffect, useState } from 'react';
import { CheckCircle2, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatRelativeTime, maskPhoneNumber } from '@/lib/utils-app';

interface Transaction {
  id: string;
  product_name: string;
  target_id: string;
  sell_price: number;
  status: string;
  created_at: string;
}

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchRecent = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('id, product_name, target_id, sell_price, status, created_at')
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(20);
      setTransactions(data || []);
    };

    fetchRecent();

    const channel = supabase
      .channel('realtime-transactions')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transactions' }, (payload) => {
        const updated = payload.new as Transaction;
        if (updated.status === 'success') {
          setTransactions(prev => [updated, ...prev.slice(0, 19)]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (transactions.length === 0) return null;

  // Duplicate for infinite scroll effect
  const displayItems = [...transactions, ...transactions];

  return (
    <section className="py-10 bg-background overflow-hidden">
      <div className="container mx-auto px-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-slow" />
          <h3 className="text-sm font-semibold text-foreground">Transaksi Berhasil Terbaru</h3>
          <span className="text-xs text-muted-foreground ml-1">(Realtime)</span>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="ticker-container">
          <div className="ticker-content gap-3 flex">
            {displayItems.map((tx, i) => (
              <div key={`${tx.id}-${i}`} className="flex-shrink-0 flex items-center gap-3 bg-card border border-green-100 rounded-xl px-4 py-3 shadow-card">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground whitespace-nowrap">{tx.product_name}</p>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {maskPhoneNumber(tx.target_id)} • {formatCurrency(tx.sell_price)} • {formatRelativeTime(tx.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600 font-medium ml-2">
                  <Zap className="w-3 h-3" />
                  <span>Berhasil</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
