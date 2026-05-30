import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FAQ {
  id: string; question: string; answer: string; sort_order: number; is_active: boolean;
}

export default function AdminFAQ() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [form, setForm] = useState({ question: '', answer: '' });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: faqs = [], isLoading } = useQuery<FAQ[]>({
    queryKey: ['admin-faq'],
    queryFn: async () => {
      const { data } = await supabase.from('faq').select('*').order('sort_order');
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) return supabase.from('faq').update({ question: form.question, answer: form.answer }).eq('id', editing.id);
      return supabase.from('faq').insert({ question: form.question, answer: form.answer, sort_order: faqs.length + 1 });
    },
    onSuccess: () => { toast({ title: 'FAQ disimpan' }); queryClient.invalidateQueries({ queryKey: ['admin-faq'] }); setShowForm(false); },
    onError: () => toast({ title: 'Gagal menyimpan', variant: 'destructive' }),
  });

  const toggleMutation = useMutation({
    mutationFn: (f: FAQ) => supabase.from('faq').update({ is_active: !f.is_active }).eq('id', f.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-faq'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supabase.from('faq').delete().eq('id', id),
    onSuccess: () => { toast({ title: 'FAQ dihapus' }); queryClient.invalidateQueries({ queryKey: ['admin-faq'] }); },
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Manajemen FAQ</h1>
          <Button onClick={() => { setEditing(null); setForm({ question: '', answer: '' }); setShowForm(true); }} className="gap-2 gradient-button text-primary-foreground">
            <Plus className="w-4 h-4" /> Tambah FAQ
          </Button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            [...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)
          ) : faqs.map(faq => (
            <div key={faq.id} className={`bg-card border rounded-xl p-4 flex gap-3 ${!faq.is_active ? 'opacity-50 border-border' : 'border-border shadow-card'}`}>
              <GripVertical className="w-5 h-5 text-muted-foreground/50 flex-shrink-0 mt-1 cursor-grab" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{faq.question}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditing(faq); setForm({ question: faq.question, answer: faq.answer }); setShowForm(true); }}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <button onClick={() => toggleMutation.mutate(faq)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${faq.is_active ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                  {faq.is_active ? 'Aktif' : 'Off'}
                </button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => { if (confirm('Hapus FAQ?')) deleteMutation.mutate(faq.id); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit FAQ' : 'Tambah FAQ'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pertanyaan</Label>
              <Input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} placeholder="Pertanyaan..." className="mt-1.5" />
            </div>
            <div>
              <Label>Jawaban</Label>
              <Textarea value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} placeholder="Jawaban lengkap..." rows={4} className="mt-1.5" />
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
