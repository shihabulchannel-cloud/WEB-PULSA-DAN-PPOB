import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Power, PowerOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ImageUploader from '@/components/ImageUploader';

interface Banner {
  id: string; title: string; subtitle: string; image_url: string; link_url: string; button_text: string; sort_order: number; is_active: boolean;
}

export default function AdminBanners() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({ title: '', subtitle: '', image_url: '', link_url: '', button_text: 'Mulai Sekarang', sort_order: '1' });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data } = await supabase.from('banners').select('*').order('sort_order');
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, sort_order: parseInt(form.sort_order) || 1 };
      if (editing) return supabase.from('banners').update(payload).eq('id', editing.id);
      return supabase.from('banners').insert({ ...payload, is_active: true });
    },
    onSuccess: () => { toast({ title: 'Banner disimpan' }); queryClient.invalidateQueries({ queryKey: ['admin-banners'] }); setShowForm(false); },
    onError: () => toast({ title: 'Gagal menyimpan', variant: 'destructive' }),
  });

  const toggleMutation = useMutation({
    mutationFn: (b: Banner) => supabase.from('banners').update({ is_active: !b.is_active }).eq('id', b.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-banners'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supabase.from('banners').delete().eq('id', id),
    onSuccess: () => { toast({ title: 'Banner dihapus' }); queryClient.invalidateQueries({ queryKey: ['admin-banners'] }); },
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Manajemen Banner</h1>
          <Button onClick={() => { setEditing(null); setForm({ title: '', subtitle: '', image_url: '', link_url: '', button_text: 'Mulai Sekarang', sort_order: '1' }); setShowForm(true); }} className="gap-2 gradient-button text-primary-foreground">
            <Plus className="w-4 h-4" /> Tambah Banner
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? [...Array(3)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />) :
          banners.map(b => (
            <div key={b.id} className={`bg-card border rounded-2xl overflow-hidden shadow-card ${!b.is_active ? 'opacity-60' : ''}`}>
              {b.image_url ? (
                <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${b.image_url})` }} />
              ) : (
                <div className="h-32 gradient-primary flex items-center justify-center">
                  <p className="text-primary-foreground font-bold text-lg text-center px-4">{b.title}</p>
                </div>
              )}
              <div className="p-4">
                <p className="font-semibold text-foreground">{b.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{b.subtitle}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(b); setForm({ title: b.title, subtitle: b.subtitle || '', image_url: b.image_url || '', link_url: b.link_url || '', button_text: b.button_text || 'Mulai Sekarang', sort_order: b.sort_order.toString() }); setShowForm(true); }}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleMutation.mutate(b)}>
                    {b.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => { if (confirm('Hapus banner?')) deleteMutation.mutate(b.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Banner' : 'Tambah Banner'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Judul</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label>Subjudul</Label>
              <Textarea value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} rows={2} className="mt-1.5" />
            </div>
            <div>
              <ImageUploader
                bucket="site-images"
                folder="banners"
                value={form.image_url}
                onChange={url => setForm(f => ({ ...f, image_url: url }))}
                label="Gambar Banner"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>URL Link</Label>
                <Input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} placeholder="/category/..." className="mt-1.5" />
              </div>
              <div>
                <Label>Teks Tombol</Label>
                <Input value={form.button_text} onChange={e => setForm(f => ({ ...f, button_text: e.target.value }))} className="mt-1.5" />
              </div>
            </div>
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
