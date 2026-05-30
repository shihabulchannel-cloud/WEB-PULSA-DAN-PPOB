import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Power, PowerOff, Gamepad2, Phone, Wifi, Wallet, FileText, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string; name: string; slug: string; description: string; icon: string; sort_order: number; is_active: boolean;
}

const icons = ['Gamepad2', 'Phone', 'Wifi', 'Wallet', 'FileText', 'Ticket', 'Package'];
const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = { Gamepad2, Phone, Wifi, Wallet, FileText, Ticket };

export default function AdminCategories() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', icon: 'Package', sort_order: '1' });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('sort_order');
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, sort_order: parseInt(form.sort_order) || 1 };
      if (editing) return supabase.from('categories').update(payload).eq('id', editing.id);
      return supabase.from('categories').insert({ ...payload, is_active: true });
    },
    onSuccess: () => { toast({ title: 'Kategori disimpan' }); queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); queryClient.invalidateQueries({ queryKey: ['categories'] }); setShowForm(false); },
    onError: () => toast({ title: 'Gagal menyimpan', variant: 'destructive' }),
  });

  const toggleMutation = useMutation({
    mutationFn: (c: Category) => supabase.from('categories').update({ is_active: !c.is_active }).eq('id', c.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supabase.from('categories').delete().eq('id', id),
    onSuccess: () => { toast({ title: 'Kategori dihapus' }); queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); },
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Manajemen Kategori</h1>
          <Button onClick={() => { setEditing(null); setForm({ name: '', slug: '', description: '', icon: 'Package', sort_order: String(categories.length + 1) }); setShowForm(true); }} className="gap-2 gradient-button text-primary-foreground">
            <Plus className="w-4 h-4" /> Tambah Kategori
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? [...Array(6)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />) :
          categories.map(cat => {
            const Icon = iconComponents[cat.icon] || Gamepad2;
            return (
              <div key={cat.id} className={`bg-card border rounded-2xl p-4 flex items-center gap-4 shadow-card ${!cat.is_active ? 'opacity-60' : ''}`}>
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.slug}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditing(cat); setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', icon: cat.icon, sort_order: cat.sort_order.toString() }); setShowForm(true); }}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toggleMutation.mutate(cat)}>
                    {cat.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5 text-green-500" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => { if (confirm('Hapus kategori ini?')) deleteMutation.mutate(cat.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nama</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} className="mt-1.5" /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="mt-1.5" /></div>
            <div><Label>Deskripsi</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1.5" /></div>
            <div>
              <Label>Ikon</Label>
              <select value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className="w-full mt-1.5 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                {icons.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div><Label>Urutan</Label><Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} className="mt-1.5" /></div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Batal</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex-1 gradient-button text-primary-foreground">Simpan</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
