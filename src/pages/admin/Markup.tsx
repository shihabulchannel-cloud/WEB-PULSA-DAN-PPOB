import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils-app';
import { useToast } from '@/hooks/use-toast';

interface MarkupRule {
  id: string;
  rule_type: string;
  category_id: string | null;
  product_id: string | null;
  markup_type: string;
  markup_value: number;
  is_active: boolean;
  categories?: { name: string };
  products?: { name: string };
}

export default function AdminMarkup() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MarkupRule | null>(null);
  const [form, setForm] = useState({ rule_type: 'global', category_id: '', product_id: '', markup_type: 'fixed', markup_value: '' });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: rules = [], isLoading } = useQuery<MarkupRule[]>({
    queryKey: ['markup-rules'],
    queryFn: async () => {
      const { data } = await supabase.from('markup_rules').select('*, categories(name), products(name)').order('created_at');
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
        rule_type: form.rule_type,
        category_id: form.rule_type === 'category' ? form.category_id : null,
        product_id: form.rule_type === 'product' ? form.product_id : null,
        markup_type: form.markup_type,
        markup_value: parseFloat(form.markup_value) || 0,
      };
      if (editing) {
        return supabase.from('markup_rules').update(payload).eq('id', editing.id);
      } else {
        return supabase.from('markup_rules').insert(payload);
      }
    },
    onSuccess: () => {
      toast({ title: 'Markup disimpan' });
      queryClient.invalidateQueries({ queryKey: ['markup-rules'] });
      setShowForm(false);
    },
    onError: () => toast({ title: 'Gagal menyimpan', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supabase.from('markup_rules').delete().eq('id', id),
    onSuccess: () => {
      toast({ title: 'Markup dihapus' });
      queryClient.invalidateQueries({ queryKey: ['markup-rules'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (rule: MarkupRule) => supabase.from('markup_rules').update({ is_active: !rule.is_active }).eq('id', rule.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['markup-rules'] }),
  });

  const ruleTypeLabel = { global: 'Global', category: 'Per Kategori', product: 'Per Produk' };

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Markup Harga</h1>
            <p className="text-sm text-muted-foreground">Atur margin keuntungan produk</p>
          </div>
          <Button onClick={() => { setEditing(null); setForm({ rule_type: 'global', category_id: '', product_id: '', markup_type: 'fixed', markup_value: '' }); setShowForm(true); }} className="gap-2 gradient-button text-primary-foreground">
            <Plus className="w-4 h-4" /> Tambah Markup
          </Button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-sm text-blue-700">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-1">Prioritas Markup:</p>
            <p>Per Produk (tertinggi) &gt; Per Kategori &gt; Global (terendah)</p>
            <p className="mt-1 text-blue-600">Harga jual = Harga modal + Markup yang berlaku</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                {['Tipe', 'Target', 'Markup', 'Nilai', 'Status', 'Aksi'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(3)].map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>)
              ) : rules.map(rule => (
                <tr key={rule.id} className={`hover:bg-muted/20 ${!rule.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${rule.rule_type === 'global' ? 'bg-blue-100 text-blue-700' : rule.rule_type === 'category' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                      {ruleTypeLabel[rule.rule_type as keyof typeof ruleTypeLabel]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {rule.rule_type === 'global' ? 'Semua Produk' :
                     rule.rule_type === 'category' ? (rule.categories as { name: string })?.name || '-' :
                     (rule.products as { name: string })?.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{rule.markup_type === 'fixed' ? 'Nominal Tetap' : 'Persentase'}</td>
                  <td className="px-4 py-3 text-sm font-bold text-green-600">
                    +{rule.markup_type === 'fixed' ? formatCurrency(rule.markup_value) : `${rule.markup_value}%`}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleMutation.mutate(rule)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${rule.is_active ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'}`}>
                      {rule.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
                        setEditing(rule);
                        setForm({ rule_type: rule.rule_type, category_id: rule.category_id || '', product_id: rule.product_id || '', markup_type: rule.markup_type, markup_value: rule.markup_value.toString() });
                        setShowForm(true);
                      }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => { if (confirm('Hapus markup ini?')) deleteMutation.mutate(rule.id); }}>
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

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Markup' : 'Tambah Markup'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipe Markup</Label>
              <select value={form.rule_type} onChange={e => setForm(f => ({ ...f, rule_type: e.target.value }))}
                className="w-full mt-1.5 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="global">Global (Semua Produk)</option>
                <option value="category">Per Kategori</option>
                <option value="product">Per Produk (belum tersedia)</option>
              </select>
            </div>
            {form.rule_type === 'category' && (
              <div>
                <Label>Pilih Kategori</Label>
                <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Pilih kategori</option>
                  {(categories as { id: string; name: string }[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <Label>Tipe Nilai</Label>
              <select value={form.markup_type} onChange={e => setForm(f => ({ ...f, markup_type: e.target.value }))}
                className="w-full mt-1.5 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="fixed">Nominal Tetap (Rp)</option>
                <option value="percentage">Persentase (%)</option>
              </select>
            </div>
            <div>
              <Label>Nilai Markup</Label>
              <Input type="number" value={form.markup_value} onChange={e => setForm(f => ({ ...f, markup_value: e.target.value }))} placeholder={form.markup_type === 'fixed' ? 'Contoh: 500' : 'Contoh: 5'} className="mt-1.5" />
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
