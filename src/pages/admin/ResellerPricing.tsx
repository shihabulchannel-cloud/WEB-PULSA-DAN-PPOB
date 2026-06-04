import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils-app';
import { Save, Globe, Layers, Package, Check, Info, TrendingUp } from 'lucide-react';

interface Category {
  id: string; name: string; icon: string; reseller_markup: number;
}

interface Product {
  id: string; name: string; brand: string; modal_price: number; sell_price: number; reseller_price: number;
  categories?: { name: string };
}

export default function AdminResellerPricing() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'global' | 'category' | 'product'>('global');
  const [globalMarkup, setGlobalMarkup] = useState('');
  const [categoryMarkups, setCategoryMarkups] = useState<Record<string, string>>({});
  const [savingCategory, setSavingCategory] = useState<Record<string, boolean>>({});
  const [productPrices, setProductPrices] = useState<Record<string, string>>({});
  const [savingProduct, setSavingProduct] = useState<Record<string, boolean>>({});
  const [productSearch, setProductSearch] = useState('');

  // Global markup from settings
  const { data: settings } = useQuery({
    queryKey: ['settings-reseller-markup'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('key, value').in('key', ['reseller_markup_global']);
      const map: Record<string, string> = {};
      (data || []).forEach(s => { map[s.key] = s.value || '0'; });
      return map;
    },
  });

  useEffect(() => {
    if (settings?.reseller_markup_global !== undefined) {
      setGlobalMarkup(settings.reseller_markup_global);
    }
  }, [settings]);

  const saveGlobalMutation = useMutation({
    mutationFn: async () => {
      await supabase.from('settings').upsert({ key: 'reseller_markup_global', value: globalMarkup }, { onConflict: 'key' });
    },
    onSuccess: () => {
      toast({ title: 'Markup global disimpan' });
      qc.invalidateQueries({ queryKey: ['settings-reseller-markup'] });
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => toast({ title: 'Gagal menyimpan', variant: 'destructive' }),
  });

  // Categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories-reseller-pricing'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, name, icon, reseller_markup').order('sort_order');
      return data || [];
    },
  });

  const saveCategoryMarkup = async (cat: Category) => {
    const val = categoryMarkups[cat.id];
    if (val === undefined) return;
    setSavingCategory(s => ({ ...s, [cat.id]: true }));
    const { error } = await supabase.from('categories').update({ reseller_markup: parseFloat(val) || 0 }).eq('id', cat.id);
    setSavingCategory(s => ({ ...s, [cat.id]: false }));
    if (error) {
      toast({ title: 'Gagal', variant: 'destructive' });
    } else {
      toast({ title: `Markup ${cat.name} disimpan` });
      setCategoryMarkups(s => { const n = { ...s }; delete n[cat.id]; return n; });
      qc.invalidateQueries({ queryKey: ['categories-reseller-pricing'] });
    }
  };

  // Products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products-reseller-pricing', productSearch],
    queryFn: async () => {
      let q = supabase.from('products')
        .select('id, name, brand, modal_price, sell_price, reseller_price, categories(name)')
        .eq('is_active', true).order('name').limit(100);
      if (productSearch) q = q.ilike('name', `%${productSearch}%`);
      const { data } = await q;
      return data || [];
    },
  });

  const saveProductPrice = async (p: Product) => {
    const val = productPrices[p.id];
    if (val === undefined) return;
    setSavingProduct(s => ({ ...s, [p.id]: true }));
    const { error } = await supabase.from('products').update({ reseller_price: parseFloat(val) || 0 }).eq('id', p.id);
    setSavingProduct(s => ({ ...s, [p.id]: false }));
    if (error) {
      toast({ title: 'Gagal', variant: 'destructive' });
    } else {
      toast({ title: `Harga ${p.name} disimpan` });
      setProductPrices(s => { const n = { ...s }; delete n[p.id]; return n; });
      qc.invalidateQueries({ queryKey: ['products-reseller-pricing'] });
    }
  };

  const globalMarkupNum = parseFloat(globalMarkup) || 0;
  const tabs = [
    { key: 'global' as const, label: 'Markup Global', icon: Globe },
    { key: 'category' as const, label: 'Per Kategori', icon: Layers },
    { key: 'product' as const, label: 'Per Produk', icon: Package },
  ];

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengaturan Harga Reseller</h1>
          <p className="text-sm text-muted-foreground">Atur markup harga khusus untuk reseller</p>
        </div>

        {/* Priority info */}
        <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-primary">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold mb-1">Prioritas Harga</p>
            <p><span className="font-medium">1.</span> Harga Per Produk (tertinggi)</p>
            <p><span className="font-medium">2.</span> Markup Per Kategori</p>
            <p><span className="font-medium">3.</span> Markup Global (terendah)</p>
            <p className="mt-1 text-primary/70">Jika produk memiliki harga khusus, harga tersebut mengalahkan kategori dan global.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                  tab === t.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* TAB: Global */}
        {tab === 'global' && (
          <div className="bg-card border border-border rounded-xl p-6 shadow-card max-w-md space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Markup Global</h2>
            </div>
            <p className="text-sm text-muted-foreground">Diterapkan ke semua produk yang tidak memiliki harga kategori atau produk khusus.</p>
            <div>
              <label className="text-sm font-medium text-foreground">Markup (Rp)</label>
              <Input
                type="number"
                min="0"
                value={globalMarkup}
                onChange={e => setGlobalMarkup(e.target.value)}
                placeholder="Contoh: 500"
                className="mt-1.5"
              />
              {globalMarkupNum > 0 && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Contoh: Modal Rp 10.000 → Harga Reseller {formatCurrency(10000 + globalMarkupNum)}
                </p>
              )}
            </div>
            <Button onClick={() => saveGlobalMutation.mutate()} disabled={saveGlobalMutation.isPending} className="gap-2 gradient-button text-primary-foreground">
              <Save className="w-4 h-4" />
              {saveGlobalMutation.isPending ? 'Menyimpan...' : 'Simpan Markup Global'}
            </Button>
          </div>
        )}

        {/* TAB: Per Kategori */}
        {tab === 'category' && (
          <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    {['Kategori', 'Markup Saat Ini', 'Markup Baru (Rp)', 'Contoh Harga', 'Aksi'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categories.map(cat => {
                    const currentVal = categoryMarkups[cat.id] ?? cat.reseller_markup?.toString() ?? '0';
                    const isEditing = cat.id in categoryMarkups;
                    const previewMarkup = parseFloat(currentVal) || 0;
                    return (
                      <tr key={cat.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {cat.reseller_markup > 0 ? (
                            <span className="text-green-600 font-medium">+{formatCurrency(cat.reseller_markup)}</span>
                          ) : (
                            <span className="text-muted-foreground/50 text-xs">Belum diatur</span>
                          )}
                        </td>
                        <td className="px-4 py-3 w-40">
                          <Input
                            type="number"
                            min="0"
                            value={currentVal}
                            onChange={e => setCategoryMarkups(s => ({ ...s, [cat.id]: e.target.value }))}
                            className={`h-8 text-sm ${isEditing ? 'border-primary' : ''}`}
                          />
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {previewMarkup > 0 ? `Modal 10.000 → ${formatCurrency(10000 + previewMarkup)}` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            onClick={() => saveCategoryMarkup(cat)}
                            disabled={savingCategory[cat.id] || !isEditing}
                            className={`h-7 px-3 text-xs ${isEditing ? 'gradient-button text-primary-foreground' : 'opacity-40'}`}
                          >
                            {savingCategory[cat.id] ? '...' : <Check className="w-3.5 h-3.5" />}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: Per Produk */}
        {tab === 'product' && (
          <div className="space-y-3">
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr>
                      {['Produk', 'Kategori', 'Harga Modal', 'Harga Jual', 'Harga Reseller', 'Margin', 'Aksi'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">Tidak ada produk</td></tr>
                    ) : products.map(p => {
                      const currentVal = productPrices[p.id] ?? (p.reseller_price || '').toString();
                      const isEditing = p.id in productPrices;
                      const resellerPrice = parseFloat(currentVal) || p.reseller_price || p.sell_price;
                      const margin = resellerPrice - p.modal_price;
                      return (
                        <tr key={p.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3 max-w-[180px]">
                            <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {(p.categories as { name: string } | null)?.name || '-'}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatCurrency(p.modal_price)}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatCurrency(p.sell_price)}</td>
                          <td className="px-4 py-3 w-36">
                            <Input
                              type="number"
                              min="0"
                              value={currentVal}
                              onChange={e => setProductPrices(s => ({ ...s, [p.id]: e.target.value }))}
                              className={`h-8 text-sm ${isEditing ? 'border-primary' : ''}`}
                              placeholder={p.sell_price.toString()}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <TrendingUp className={`w-3.5 h-3.5 ${margin > 0 ? 'text-green-500' : 'text-red-500'}`} />
                              <span className={`text-xs font-semibold ${margin > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {margin > 0 ? '+' : ''}{formatCurrency(margin)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              onClick={() => saveProductPrice(p)}
                              disabled={savingProduct[p.id] || !isEditing}
                              className={`h-7 px-3 text-xs ${isEditing ? 'gradient-button text-primary-foreground' : 'opacity-40'}`}
                            >
                              {savingProduct[p.id] ? '...' : <Check className="w-3.5 h-3.5" />}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
