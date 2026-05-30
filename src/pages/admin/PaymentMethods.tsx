import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Power, PowerOff } from 'lucide-react';
import { formatCurrency } from '@/lib/utils-app';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethod {
  id: string; name: string; code: string; type: string; fee_type: string; fee_value: number; min_amount: number; max_amount: number; is_active: boolean; sort_order: number;
}

const typeOptions = [{ value: 'qris', label: 'QRIS' }, { value: 'virtual_account', label: 'Virtual Account' }, { value: 'bank_transfer', label: 'Transfer Bank' }, { value: 'ewallet', label: 'E-Wallet' }];

export default function AdminPaymentMethods() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState({ name: '', code: '', type: 'qris', fee_type: 'fixed', fee_value: '0', min_amount: '10000', max_amount: '50000000' });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: methods = [], isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ['admin-payment-methods'],
    queryFn: async () => {
      const { data } = await supabase.from('payment_methods').select('*').order('sort_order');
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, code: form.code, type: form.type, fee_type: form.fee_type, fee_value: parseFloat(form.fee_value) || 0, min_amount: parseFloat(form.min_amount) || 10000, max_amount: parseFloat(form.max_amount) || 50000000 };
      if (editing) return supabase.from('payment_methods').update(payload).eq('id', editing.id);
      return supabase.from('payment_methods').insert({ ...payload, is_active: true, sort_order: methods.length + 1 });
    },
    onSuccess: () => { toast({ title: 'Metode pembayaran disimpan' }); queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] }); queryClient.invalidateQueries({ queryKey: ['payment-methods'] }); setShowForm(false); },
    onError: () => toast({ title: 'Gagal menyimpan', variant: 'destructive' }),
  });

  const toggleMutation = useMutation({
    mutationFn: (m: PaymentMethod) => supabase.from('payment_methods').update({ is_active: !m.is_active }).eq('id', m.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supabase.from('payment_methods').delete().eq('id', id),
    onSuccess: () => { toast({ title: 'Metode dihapus' }); queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] }); },
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Metode Pembayaran</h1>
            <p className="text-sm text-muted-foreground">Kelola metode pembayaran yang tersedia</p>
          </div>
          <Button onClick={() => { setEditing(null); setForm({ name: '', code: '', type: 'qris', fee_type: 'fixed', fee_value: '0', min_amount: '10000', max_amount: '50000000' }); setShowForm(true); }} className="gap-2 gradient-button text-primary-foreground">
            <Plus className="w-4 h-4" /> Tambah Metode
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  {['Nama', 'Kode', 'Tipe', 'Biaya Admin', 'Min/Max', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>) :
                methods.map(m => (
                  <tr key={m.id} className={`hover:bg-muted/20 ${!m.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{m.name}</td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{m.code}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-xs bg-primary/10 text-primary">{m.type}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {m.fee_type === 'fixed' ? formatCurrency(m.fee_value) : `${m.fee_value}%`}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatCurrency(m.min_amount)} - {formatCurrency(m.max_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {m.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditing(m); setForm({ name: m.name, code: m.code, type: m.type, fee_type: m.fee_type, fee_value: m.fee_value.toString(), min_amount: m.min_amount.toString(), max_amount: m.max_amount.toString() }); setShowForm(true); }}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toggleMutation.mutate(m)}>
                          {m.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5 text-green-500" />}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => { if (confirm('Hapus metode ini?')) deleteMutation.mutate(m.id); }}>
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

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Metode' : 'Tambah Metode Pembayaran'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nama</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="BCA Virtual Account" className="mt-1.5" /></div>
              <div><Label>Kode Tripay</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="BCAVA" className="mt-1.5" /></div>
            </div>
            <div>
              <Label>Tipe</Label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full mt-1.5 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                {typeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipe Biaya</Label>
                <select value={form.fee_type} onChange={e => setForm(f => ({ ...f, fee_type: e.target.value }))} className="w-full mt-1.5 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="fixed">Nominal Tetap</option>
                  <option value="percentage">Persentase</option>
                </select>
              </div>
              <div><Label>Nilai Biaya</Label><Input type="number" value={form.fee_value} onChange={e => setForm(f => ({ ...f, fee_value: e.target.value }))} className="mt-1.5" /></div>
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
