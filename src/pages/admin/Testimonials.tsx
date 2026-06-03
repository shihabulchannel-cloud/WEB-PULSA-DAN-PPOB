import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ImageUploader from '@/components/ImageUploader';

interface Testimonial {
  id: string; name: string; rating: number; comment: string; product_name: string; avatar?: string; is_active: boolean;
}

export default function AdminTestimonials() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState({ name: '', rating: '5', comment: '', product_name: '', avatar: '' });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: testimonials = [], isLoading } = useQuery<Testimonial[]>({
    queryKey: ['admin-testimonials'],
    queryFn: async () => {
      const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, rating: parseInt(form.rating) || 5 };
      if (editing) return supabase.from('testimonials').update(payload).eq('id', editing.id);
      return supabase.from('testimonials').insert({ ...payload, is_active: true });
    },
    onSuccess: () => { toast({ title: 'Testimoni disimpan' }); queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] }); setShowForm(false); },
    onError: () => toast({ title: 'Gagal menyimpan', variant: 'destructive' }),
  });

  const toggleMutation = useMutation({
    mutationFn: (t: Testimonial) => supabase.from('testimonials').update({ is_active: !t.is_active }).eq('id', t.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supabase.from('testimonials').delete().eq('id', id),
    onSuccess: () => { toast({ title: 'Testimoni dihapus' }); queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] }); },
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Manajemen Testimoni</h1>
          <Button onClick={() => { setEditing(null); setForm({ name: '', rating: '5', comment: '', product_name: '', avatar: '' }); setShowForm(true); }} className="gap-2 gradient-button text-primary-foreground">
            <Plus className="w-4 h-4" /> Tambah Testimoni
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? [...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />) :
          testimonials.map(t => (
            <div key={t.id} className={`bg-card border rounded-2xl p-4 shadow-card ${!t.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  {t.product_name && <p className="text-xs text-muted-foreground">{t.product_name}</p>}
                  <div className="flex gap-0.5 my-2">
                    {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />)}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">"{t.comment}"</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditing(t); setForm({ name: t.name, rating: t.rating.toString(), comment: t.comment, product_name: t.product_name || '', avatar: t.avatar || '' }); setShowForm(true); }}><Edit2 className="w-3.5 h-3.5" /></Button>
                  <button onClick={() => toggleMutation.mutate(t)} className={`px-2 py-1 rounded text-xs font-medium ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{t.is_active ? 'Tampil' : 'Semb.'}</button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => { if (confirm('Hapus?')) deleteMutation.mutate(t.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Testimoni' : 'Tambah Testimoni'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nama Customer</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1.5" /></div>
            <div><Label>Produk yang Dibeli</Label><Input value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))} className="mt-1.5" /></div>
            <div>
              <Label>Rating</Label>
              <select value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} className="w-full mt-1.5 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Bintang</option>)}
              </select>
            </div>
            <div><Label>Komentar</Label><textarea value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} rows={3} className="w-full mt-1.5 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" /></div>
            <ImageUploader
              bucket="site-images"
              folder="testimonials"
              value={form.avatar}
              onChange={url => setForm(f => ({ ...f, avatar: url }))}
              label="Foto Profil (opsional)"
            />
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
