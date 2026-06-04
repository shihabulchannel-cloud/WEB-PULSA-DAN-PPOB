import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ResellerLayout from '@/components/layout/ResellerLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils-app';
import { Search, ShoppingCart, Wallet, Tag } from 'lucide-react';

interface Product {
  id: string; name: string; brand: string; sell_price: number; reseller_price: number;
  modal_price: number; stock_status: string; buyer_sku_code: string;
  category_id: string | null;
  categories?: { name: string; reseller_markup: number };
}

// Priority pricing: product explicit > category markup > global markup
function getEffectiveResellerPrice(
  p: Product,
  globalMarkup: number
): { price: number; source: 'product' | 'category' | 'global' } {
  if (p.reseller_price && p.reseller_price > 0) {
    return { price: p.reseller_price, source: 'product' };
  }
  const catMarkup = p.categories?.reseller_markup ?? 0;
  if (catMarkup > 0) {
    return { price: p.modal_price + catMarkup, source: 'category' };
  }
  if (globalMarkup > 0) {
    return { price: p.modal_price + globalMarkup, source: 'global' };
  }
  return { price: p.sell_price, source: 'global' };
}

export default function ResellerProducts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<{ product: Product; effectivePrice: number } | null>(null);
  const [target, setTarget] = useState('');
  const [showBuy, setShowBuy] = useState(false);

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

  // Fetch global markup from settings
  const { data: globalMarkupNum = 0 } = useQuery({
    queryKey: ['reseller-markup-global'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'reseller_markup_global').maybeSingle();
      return parseFloat(data?.value || '0') || 0;
    },
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['reseller-products', search],
    queryFn: async () => {
      let q = supabase.from('products')
        .select('id, name, brand, sell_price, reseller_price, modal_price, stock_status, buyer_sku_code, category_id, categories(name, reseller_markup)')
        .eq('is_active', true).order('name');
      if (search) q = q.ilike('name', `%${search}%`);
      const { data } = await q;
      return data || [];
    },
  });

  const buyMutation = useMutation({
    mutationFn: async () => {
      if (!selected || !target.trim()) throw new Error('Lengkapi data pembelian');
      if (!reseller?.id) throw new Error('Profil reseller tidak ditemukan');
      const { effectivePrice } = selected;
      if (balance < effectivePrice) throw new Error(`Saldo tidak cukup. Saldo Anda: ${formatCurrency(balance)}`);

      const { data, error } = await supabase.functions.invoke('reseller-transaction', {
        body: {
          reseller_id: reseller.id,
          product_id: selected.product.id,
          buyer_sku_code: selected.product.buyer_sku_code,
          target_number: target.trim(),
          amount: effectivePrice,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || 'Transaksi gagal');
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Transaksi berhasil diproses', description: 'Cek riwayat transaksi untuk status terbaru' });
      setShowBuy(false); setSelected(null); setTarget('');
      qc.invalidateQueries({ queryKey: ['reseller-profile'] });
      qc.invalidateQueries({ queryKey: ['reseller-wallet-tx'] });
      qc.invalidateQueries({ queryKey: ['reseller-transactions-recent'] });
    },
    onError: (err: Error) => toast({ title: 'Transaksi gagal', description: err.message, variant: 'destructive' }),
  });

  const openBuy = (p: Product, price: number) => {
    setSelected({ product: p, effectivePrice: price });
    setTarget('');
    setShowBuy(true);
  };

  return (
    <ResellerLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Produk Reseller</h1>
            <p className="text-sm text-muted-foreground">Harga khusus untuk Anda</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">
            <Wallet className="w-4 h-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground">Saldo</p>
              <p className="text-sm font-bold text-primary">{formatCurrency(balance)}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading ? (
            [...Array(6)].map((_, i) => <div key={i} className="skeleton h-36 rounded-xl" />)
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Tidak ada produk ditemukan</p>
            </div>
          ) : products.map(p => {
            const { price, source } = getEffectiveResellerPrice(p, globalMarkupNum);
            const saving = p.sell_price - price;
            const inStock = p.stock_status !== 'empty';
            return (
              <div key={p.id} className={`bg-card border border-border rounded-xl p-4 shadow-card flex flex-col gap-3 ${!inStock ? 'opacity-60' : ''}`}>
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground text-sm leading-tight">{p.name}</p>
                    {source === 'product' && (
                      <span className="flex-shrink-0 flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                        <Tag className="w-2.5 h-2.5" /> Khusus
                      </span>
                    )}
                  </div>
                  {p.categories?.name && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full mt-1 inline-block">{p.categories.name}</span>
                  )}
                </div>
                <div className="flex items-end justify-between mt-auto">
                  <div>
                    <p className="text-lg font-bold text-primary">{formatCurrency(price)}</p>
                    {saving > 0 && (
                      <p className="text-xs text-green-600 font-medium">Hemat {formatCurrency(saving)}</p>
                    )}
                  </div>
                  <Button size="sm" onClick={() => openBuy(p, price)} disabled={!inStock}
                    className="gradient-button text-primary-foreground text-xs h-8">
                    <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                    {inStock ? 'Beli' : 'Habis'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Buy Dialog */}
      <Dialog open={showBuy} onOpenChange={o => { setShowBuy(o); if (!o) { setSelected(null); setTarget(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembelian</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-sm font-semibold text-foreground">{selected.product.name}</p>
                <p className="text-xl font-bold text-primary mt-1">{formatCurrency(selected.effectivePrice)}</p>
                {selected.product.sell_price > selected.effectivePrice && (
                  <p className="text-xs text-green-600">Hemat {formatCurrency(selected.product.sell_price - selected.effectivePrice)} dari harga normal</p>
                )}
              </div>
              <div>
                <Label>ID / No. Target <span className="text-destructive">*</span></Label>
                <Input
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  placeholder="Masukkan ID/nomor tujuan"
                  className="mt-1.5"
                />
              </div>
              <div className="space-y-2">
                <div className="bg-card border border-border rounded-lg p-3 flex justify-between text-sm">
                  <span className="text-muted-foreground">Saldo saat ini</span>
                  <span className="font-semibold text-foreground">{formatCurrency(balance)}</span>
                </div>
                <div className="bg-card border border-border rounded-lg p-3 flex justify-between text-sm">
                  <span className="text-muted-foreground">Saldo setelah transaksi</span>
                  <span className={`font-semibold ${balance - selected.effectivePrice < 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {formatCurrency(balance - selected.effectivePrice)}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="outline" onClick={() => setShowBuy(false)} className="flex-1">Batal</Button>
                <Button
                  onClick={() => buyMutation.mutate()}
                  disabled={buyMutation.isPending || !target.trim() || balance < selected.effectivePrice}
                  className="flex-1 gradient-button text-primary-foreground"
                >
                  {buyMutation.isPending ? 'Memproses...' : 'Konfirmasi Beli'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ResellerLayout>
  );
}
