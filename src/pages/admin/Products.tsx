import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Plus, Edit2, Trash2, RefreshCw, Power, PowerOff, Check, X, Tag } from 'lucide-react';
import { formatCurrency } from '@/lib/utils-app';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string; name: string; brand: string; sku: string; buyer_sku_code: string;
  modal_price: number; sell_price: number; markup_amount: number; is_active: boolean;
  stock_status: string; categories?: { name: string };
}

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [inlineMarkup, setInlineMarkup] = useState<Record<string, string>>({});
  const [savingMarkup, setSavingMarkup] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const emptyForm = { name: '', brand: '', sku: '', buyer_sku_code: '', modal_price: '', markup_amount: '', category_id: '' };
  const [form, setForm] = useState(emptyForm);

  // Auto-calculated sell price in form
  const formSellPrice = (parseFloat(form.modal_price) || 0) + (parseFloat(form.markup_amount) || 0);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['admin-products', search],
    queryFn: async () => {
      let q = supabase.from('products').select('*, categories(name)').order('name');
      if (search) q = q.ilike('name', `%${search}%`);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-admin'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, name').order('sort_order');
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const markupAmt = parseFloat(form.markup_amount) || 0;
      const modalP = parseFloat(form.modal_price) || 0;
      const payload = {
        name: form.name, brand: form.brand, sku: form.sku,
        buyer_sku_code: form.buyer_sku_code,
        modal_price: modalP,
        markup_amount: markupAmt,
        sell_price: modalP + markupAmt,
        category_id: form.category_id || null,
      };
      if (editingProduct) {
        return supabase.from('products').update(payload).eq('id', editingProduct.id);
      } else {
        return supabase.from('products').insert(payload);
      }
    },
    onSuccess: () => {
      toast({ title: 'Produk disimpan' });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setShowForm(false); setEditingProduct(null); setForm(emptyForm);
    },
    onError: () => toast({ title: 'Gagal menyimpan', variant: 'destructive' }),
  });

  const toggleActive = useMutation({
    mutationFn: async (product: Product) =>
      supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => supabase.from('products').delete().eq('id', id),
    onSuccess: () => {
      toast({ title: 'Produk dihapus' });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });

  // Save inline markup for a single product
  const saveInlineMarkup = async (product: Product) => {
    const markupStr = inlineMarkup[product.id];
    if (markupStr === undefined) return;
    const markupAmt = parseFloat(markupStr) || 0;
    if (markupAmt < 0) {
      toast({ title: 'Markup tidak boleh negatif', variant: 'destructive' }); return;
    }
    setSavingMarkup(s => ({ ...s, [product.id]: true }));
    const { error } = await supabase.from('products').update({
      markup_amount: markupAmt,
      sell_price: product.modal_price + markupAmt,
    }).eq('id', product.id);
    setSavingMarkup(s => ({ ...s, [product.id]: false }));
    if (error) {
      toast({ title: 'Gagal menyimpan markup', variant: 'destructive' });
    } else {
      toast({ title: 'Markup disimpan', description: `Harga jual: ${formatCurrency(product.modal_price + markupAmt)}` });
      setInlineMarkup(s => { const n = { ...s }; delete n[product.id]; return n; });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    }
  };

  const handleSyncDigiflazz = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('digiflazz-sync', {});
      if (error) {
        toast({ title: 'Sinkronisasi gagal', description: error?.message || 'Koneksi gagal', variant: 'destructive' });
        return;
      }
      if (data?.error || data?.success === false) {
        toast({ title: 'Sinkronisasi gagal', description: data.error || 'Terjadi kesalahan', variant: 'destructive' });
        return;
      }
      toast({ title: 'Sinkronisasi berhasil', description: data?.message || `${data?.synced || 0} produk disinkronkan` });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (err) {
      toast({ title: 'Sinkronisasi gagal', description: err instanceof Error ? err.message : 'Error tidak diketahui', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name, brand: p.brand || '', sku: p.sku || '',
      buyer_sku_code: p.buyer_sku_code || '',
      modal_price: p.modal_price.toString(),
      markup_amount: (p.markup_amount ?? p.sell_price - p.modal_price).toString(),
      category_id: '',
    });
    setShowForm(true);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manajemen Produk</h1>
            <p className="text-sm text-muted-foreground">{products.length} produk</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSyncDigiflazz} disabled={syncing} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Sync Digiflazz
            </Button>
            <Button onClick={() => { setEditingProduct(null); setForm(emptyForm); setShowForm(true); }} className="gap-2 gradient-button text-primary-foreground">
              <Plus className="w-4 h-4" /> Tambah Produk
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Markup info banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-2 text-sm text-primary">
          <Tag className="w-4 h-4 shrink-0" />
          <span>Edit markup langsung di kolom <strong>Markup</strong> tiap produk, lalu tekan <strong>✓</strong> untuk simpan. Harga jual otomatis dihitung dari harga modal + markup.</span>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  {['Nama Produk', 'Harga Modal', 'Markup (Rp)', 'Harga Jual', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>
                  ))
                ) : products.map(p => {
                  const currentMarkup = inlineMarkup[p.id] ?? p.markup_amount?.toString() ?? (p.sell_price - p.modal_price).toString();
                  const isEditing = p.id in inlineMarkup;
                  const previewSellPrice = p.modal_price + (parseFloat(currentMarkup) || 0);

                  return (
                    <tr key={p.id} className={`hover:bg-muted/20 transition-colors ${!p.is_active ? 'opacity-50' : ''}`}>
                      {/* Name */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{(p.categories as { name: string })?.name} · {p.brand}</p>
                      </td>

                      {/* Modal price */}
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {formatCurrency(p.modal_price)}
                      </td>

                      {/* Markup inline edit */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            value={currentMarkup}
                            onChange={e => setInlineMarkup(s => ({ ...s, [p.id]: e.target.value }))}
                            className="h-7 w-24 text-xs px-2"
                            placeholder="0"
                          />
                          {isEditing && (
                            <>
                              <button
                                onClick={() => saveInlineMarkup(p)}
                                disabled={savingMarkup[p.id]}
                                className="h-7 w-7 rounded-md flex items-center justify-center bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                                title="Simpan markup"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setInlineMarkup(s => { const n = { ...s }; delete n[p.id]; return n; })}
                                className="h-7 w-7 rounded-md flex items-center justify-center bg-muted hover:bg-muted/60 transition-colors"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Sell price (auto-calculated preview) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm font-bold ${isEditing ? 'text-primary' : 'text-foreground'}`}>
                          {formatCurrency(isEditing ? previewSellPrice : p.sell_price)}
                        </span>
                        {isEditing && (
                          <p className="text-xs text-primary">preview</p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full border text-xs font-medium ${p.is_active ? 'text-green-600 bg-green-50 border-green-200' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                          {p.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(p)} title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toggleActive.mutate(p)} title={p.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                            {p.is_active ? <PowerOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Power className="w-3.5 h-3.5 text-green-500" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => { if (confirm('Hapus produk ini?')) deleteMutation.mutate(p.id); }} title="Hapus">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit / Add Dialog */}
      <Dialog open={showForm} onOpenChange={open => { setShowForm(open); if (!open) { setEditingProduct(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nama Produk</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nama produk" className="mt-1.5" />
              </div>
              <div>
                <Label>Brand</Label>
                <Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Brand" className="mt-1.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SKU</Label>
                <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="SKU unik" className="mt-1.5" />
              </div>
              <div>
                <Label>Digiflazz SKU</Label>
                <Input value={form.buyer_sku_code} onChange={e => setForm(f => ({ ...f, buyer_sku_code: e.target.value }))} placeholder="Kode Digiflazz" className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Kategori</Label>
              <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                className="w-full mt-1.5 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Pilih kategori</option>
                {(categories as { id: string; name: string }[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Pricing section */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pengaturan Harga</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Harga Modal (Rp)</Label>
                  <Input
                    type="number"
                    value={form.modal_price}
                    onChange={e => setForm(f => ({ ...f, modal_price: e.target.value }))}
                    placeholder="0"
                    className="mt-1.5"
                    readOnly={!!editingProduct}
                    title={editingProduct ? 'Harga modal dari Digiflazz, tidak bisa diubah manual' : ''}
                  />
                  {editingProduct && <p className="text-xs text-muted-foreground mt-1">Dari Digiflazz (readonly)</p>}
                </div>
                <div>
                  <Label className="text-sm">Markup (Rp)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.markup_amount}
                    onChange={e => setForm(f => ({ ...f, markup_amount: e.target.value }))}
                    placeholder="500"
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Keuntungan per transaksi</p>
                </div>
              </div>
              {/* Auto-calculated sell price */}
              <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">Harga Jual ke Pembeli</p>
                  <p className="text-sm font-semibold text-primary mt-0.5">= Modal + Markup</p>
                </div>
                <p className="text-xl font-bold text-primary">{formatCurrency(formSellPrice)}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Batal</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex-1 gradient-button text-primary-foreground">
                {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
