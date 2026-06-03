import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { formatDate } from '@/lib/utils-app';
import { useToast } from '@/hooks/use-toast';
import ImageUploader from '@/components/ImageUploader';

interface Blog {
  id: string; title: string; slug: string; excerpt: string; content: string;
  cover_image?: string; meta_title: string; meta_description: string; is_published: boolean; created_at: string;
}

export default function AdminBlog() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Blog | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', excerpt: '', content: '', cover_image: '', meta_title: '', meta_description: '' });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: blogs = [], isLoading } = useQuery<Blog[]>({
    queryKey: ['admin-blogs'],
    queryFn: async () => {
      const { data } = await supabase.from('blogs').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, slug: form.slug || form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') };
      if (editing) return supabase.from('blogs').update(payload).eq('id', editing.id);
      return supabase.from('blogs').insert({ ...payload, is_published: false });
    },
    onSuccess: () => { toast({ title: 'Artikel disimpan' }); queryClient.invalidateQueries({ queryKey: ['admin-blogs'] }); setShowForm(false); },
    onError: () => toast({ title: 'Gagal menyimpan', variant: 'destructive' }),
  });

  const togglePublish = useMutation({
    mutationFn: (b: Blog) => supabase.from('blogs').update({ is_published: !b.is_published, published_at: !b.is_published ? new Date().toISOString() : null }).eq('id', b.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-blogs'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supabase.from('blogs').delete().eq('id', id),
    onSuccess: () => { toast({ title: 'Artikel dihapus' }); queryClient.invalidateQueries({ queryKey: ['admin-blogs'] }); },
  });

  const openEdit = (b: Blog) => {
    setEditing(b);
    setForm({ title: b.title, slug: b.slug, excerpt: b.excerpt || '', content: b.content || '', cover_image: b.cover_image || '', meta_title: b.meta_title || '', meta_description: b.meta_description || '' });
    setShowForm(true);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Manajemen Blog</h1>
          <Button onClick={() => { setEditing(null); setForm({ title: '', slug: '', excerpt: '', content: '', cover_image: '', meta_title: '', meta_description: '' }); setShowForm(true); }} className="gap-2 gradient-button text-primary-foreground">
            <Plus className="w-4 h-4" /> Tulis Artikel
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                {['Judul', 'Slug', 'Status', 'Tanggal', 'Aksi'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(3)].map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>)
              ) : blogs.map(b => (
                <tr key={b.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="text-sm font-medium text-foreground truncate">{b.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{b.excerpt}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{b.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {b.is_published ? 'Terbit' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(b.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(b)}><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => togglePublish.mutate(b)}>
                        {b.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => { if (confirm('Hapus artikel?')) deleteMutation.mutate(b.id); }}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Artikel' : 'Tulis Artikel'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Judul Artikel</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))} placeholder="Judul artikel" className="mt-1.5" />
            </div>
            <div>
              <Label>Slug URL</Label>
              <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="slug-artikel" className="mt-1.5" />
            </div>
            <ImageUploader
              bucket="site-images"
              folder="blogs"
              value={form.cover_image}
              onChange={url => setForm(f => ({ ...f, cover_image: url }))}
              label="Gambar Cover (opsional)"
            />
            <div>
              <Label>Ringkasan</Label>
              <Textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Ringkasan singkat artikel" rows={2} className="mt-1.5" />
            </div>
            <div>
              <Label>Konten</Label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Isi artikel..." rows={8} className="mt-1.5" />
            </div>
            <div>
              <Label>Meta Title (SEO)</Label>
              <Input value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} placeholder="Meta title untuk SEO" className="mt-1.5" />
            </div>
            <div>
              <Label>Meta Description (SEO)</Label>
              <Textarea value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} placeholder="Deskripsi meta untuk SEO" rows={2} className="mt-1.5" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Batal</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex-1 gradient-button text-primary-foreground">
                {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Draft'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
