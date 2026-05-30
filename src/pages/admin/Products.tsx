import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Plus, Edit2, Trash2, RefreshCw, Power, PowerOff } from 'lucide-react';
import { formatCurrency } from '@/lib/utils-app';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string; name: string; brand: string; sku: string; buyer_sku_code: string;
  modal_price: number; sell_price: number; is_active: boolean; stock_status: string;
  categories?: { name: string };
}

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({ name: '', brand: '', sku: '', buyer_sku_code: '', modal_price: '', sell_price: '', category_id: '' });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['admin-products', search],
    queryFn: async () => {
      let q = supabase.from('products').select('*, categories(name)').order('sort_order');
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
      const payload = {
        name: form.name,
        brand: form.brand,
        sku: form.sku,
        buyer_sku_code: form.buyer_sku_code,
        modal_price: parseFloat(form.modal_price) || 0,
        sell_price: parseFloat(form.sell_price) || 0,
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
      setShowForm(false);
      setEditingProduct(null);
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

  const handleSyncDigiflazz = async () => {
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('digiflazz-sync', {});
      if (error) throw error;
      toast({ title: 'Sinkronisasi berhasil', description: 'Produk Digiflazz berhasil disinkronkan' });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch {
      toast({ title: 'Sinkronisasi gagal', description: 'Pastikan API key Digiflazz sudah dikonfigurasi di Pengaturan', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({ name: p.name, brand: p.brand || '', sku: p.sku || '', buyer_sku_code: p.buyer_sku_code || '', modal_price: p.modal_price.toString(), sell_price: p.sell_price.toString(), category_id: '' });
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
            <Button onClick={() => { setEditingProduct(null); setForm({ name: '', brand: '', sku: '', buyer_sku_code: '', modal_price: '', sell_price: '', category_id: '' }); setShowForm(true); }} className="gap-2 gradient-button text-primary-foreground">
              <Plus className="w-4 h-4" /> Tambah Produk
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  {['Nama', 'Brand', 'SKU', 'Harga Modal', 'Harga Jual', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>
                  ))
                ) : products.map(p => (
                  <tr key={p.id} className={`hover:bg-muted/20 transition-colors ${!p.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{(p.categories as { name: string })?.name}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.brand}</td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{p.sku}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{formatCurrency(p.modal_price)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-primary">{formatCurrency(p.sell_price)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full border text-xs font-medium ${p.is_active ? 'text-green-600 bg-green-50 border-green-200' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(p)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toggleActive.mutate(p)}>
                          {p.is_active ? <PowerOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Power className="w-3.5 h-3.5 text-green-500" />}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => { if (confirm('Hapus produk ini?')) deleteMutation.mutate(p.id); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Harga Modal (Rp)</Label>
                <Input type="number" value={form.modal_price} onChange={e => setForm(f => ({ ...f, modal_price: e.target.value }))} placeholder="0" className="mt-1.5" />
              </div>
              <div>
                <Label>Harga Jual (Rp)</Label>
                <Input type="number" value={form.sell_price} onChange={e => setForm(f => ({ ...f, sell_price: e.target.value }))} placeholder="0" className="mt-1.5" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
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
