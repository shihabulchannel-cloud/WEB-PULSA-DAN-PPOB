import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate } from '@/lib/utils-app';
import { Plus, Edit2, Power, PowerOff, Key, Wallet, Search, Users } from 'lucide-react';

interface Reseller {
  id: string; user_id: string; nama: string; username: string; whatsapp: string;
  email: string; kota: string; is_active: boolean; created_at: string;
  reseller_balances: { balance: number } | null;
}

export default function AdminResellers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showBalance, setShowBalance] = useState<Reseller | null>(null);
  const [showPwReset, setShowPwReset] = useState<Reseller | null>(null);
  const [form, setForm] = useState({ nama: '', username: '', email: '', password: '', whatsapp: '', kota: '', saldo_awal: '0' });
  const [balanceForm, setBalanceForm] = useState({ type: 'credit', amount: '', description: '' });
  const [newPassword, setNewPassword] = useState('');

  const { data: resellers = [], isLoading } = useQuery<Reseller[]>({
    queryKey: ['admin-resellers', search],
    queryFn: async () => {
      let q = supabase.from('resellers').select('*, reseller_balances(balance)').order('created_at', { ascending: false });
      if (search) q = q.ilike('nama', `%${search}%`);
      const { data } = await q;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-reseller', {
        body: { action: 'create', ...form, saldo_awal: parseFloat(form.saldo_awal) || 0, created_by: user?.id },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || 'Gagal membuat reseller');
    },
    onSuccess: () => {
      toast({ title: 'Akun reseller berhasil dibuat' });
      qc.invalidateQueries({ queryKey: ['admin-resellers'] });
      setShowCreate(false);
      setForm({ nama: '', username: '', email: '', password: '', whatsapp: '', kota: '', saldo_awal: '0' });
    },
    onError: (err: Error) => toast({ title: 'Gagal', description: err.message, variant: 'destructive' }),
  });

  const toggleMutation = useMutation({
    mutationFn: (r: Reseller) => supabase.from('resellers').update({ is_active: !r.is_active }).eq('id', r.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-resellers'] }),
  });

  const adjustBalanceMutation = useMutation({
    mutationFn: async () => {
      if (!showBalance) return;
      const { data, error } = await supabase.functions.invoke('create-reseller', {
        body: {
          action: 'adjust_balance',
          reseller_id: showBalance.id,
          type: balanceForm.type,
          amount: parseFloat(balanceForm.amount),
          description: balanceForm.description || undefined,
          created_by: user?.id,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
    },
    onSuccess: () => {
      toast({ title: 'Saldo berhasil diubah' });
      qc.invalidateQueries({ queryKey: ['admin-resellers'] });
      setShowBalance(null);
      setBalanceForm({ type: 'credit', amount: '', description: '' });
    },
    onError: (err: Error) => toast({ title: 'Gagal', description: err.message, variant: 'destructive' }),
  });

  const resetPwMutation = useMutation({
    mutationFn: async () => {
      if (!showPwReset || !newPassword) return;
      if (newPassword.length < 6) throw new Error('Password minimal 6 karakter');
      const { data, error } = await supabase.functions.invoke('create-reseller', {
        body: { action: 'reset_password', user_id: showPwReset.user_id, new_password: newPassword },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
    },
    onSuccess: () => {
      toast({ title: 'Password berhasil direset' });
      setShowPwReset(null); setNewPassword('');
    },
    onError: (err: Error) => toast({ title: 'Gagal', description: err.message, variant: 'destructive' }),
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manajemen Reseller</h1>
            <p className="text-sm text-muted-foreground">{resellers.length} reseller terdaftar</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2 gradient-button text-primary-foreground">
            <Plus className="w-4 h-4" /> Buat Akun Reseller
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari reseller..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b border-border">
                <tr>{['Nama / Username', 'Email', 'WhatsApp', 'Saldo', 'Status', 'Bergabung', 'Aksi'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? [...Array(4)].map((_, i) => (
                  <tr key={i}><td colSpan={7}><div className="skeleton h-10 m-2 rounded" /></td></tr>
                )) : resellers.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12">
                    <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Belum ada reseller</p>
                  </td></tr>
                ) : resellers.map(r => (
                  <tr key={r.id} className={`hover:bg-muted/20 ${!r.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{r.nama}</p>
                      <p className="text-xs text-muted-foreground">@{r.username}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{r.email}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{r.whatsapp || '-'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setShowBalance(r); setBalanceForm({ type: 'credit', amount: '', description: '' }); }}
                        className="text-sm font-bold text-primary hover:underline">
                        {formatCurrency(r.reseller_balances?.balance || 0)}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${r.is_active ? 'text-green-600 bg-green-50 border-green-200' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                        {r.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setShowBalance(r); setBalanceForm({ type: 'credit', amount: '', description: '' }); }} title="Kelola Saldo">
                          <Wallet className="w-3.5 h-3.5 text-primary" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setShowPwReset(r); setNewPassword(''); }} title="Reset Password">
                          <Key className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toggleMutation.mutate(r)} title={r.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                          {r.is_active ? <PowerOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Power className="w-3.5 h-3.5 text-green-500" />}
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

      {/* Create Reseller Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Buat Akun Reseller Baru</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nama <span className="text-destructive">*</span></Label><Input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} className="mt-1.5" /></div>
              <div><Label>Username <span className="text-destructive">*</span></Label><Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="mt-1.5" /></div>
            </div>
            <div><Label>Email <span className="text-destructive">*</span></Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1.5" /></div>
            <div><Label>Password <span className="text-destructive">*</span></Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 karakter" className="mt-1.5" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="628..." className="mt-1.5" /></div>
              <div><Label>Kota</Label><Input value={form.kota} onChange={e => setForm(f => ({ ...f, kota: e.target.value }))} className="mt-1.5" /></div>
            </div>
            <div><Label>Saldo Awal (Rp)</Label><Input type="number" value={form.saldo_awal} onChange={e => setForm(f => ({ ...f, saldo_awal: e.target.value }))} placeholder="0" className="mt-1.5" /></div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Batal</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="flex-1 gradient-button text-primary-foreground">
                {createMutation.isPending ? 'Membuat...' : 'Buat Akun'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Adjust Balance Dialog */}
      <Dialog open={!!showBalance} onOpenChange={open => { if (!open) setShowBalance(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Kelola Saldo — {showBalance?.nama}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Saldo Saat Ini</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(showBalance?.reseller_balances?.balance || 0)}</p>
            </div>
            <div>
              <Label>Tipe</Label>
              <select value={balanceForm.type} onChange={e => setBalanceForm(f => ({ ...f, type: e.target.value }))}
                className="w-full mt-1.5 px-3 py-2 rounded-lg border border-border bg-background text-sm">
                <option value="credit">Tambah Saldo</option>
                <option value="debit">Kurangi Saldo</option>
              </select>
            </div>
            <div><Label>Nominal (Rp)</Label><Input type="number" value={balanceForm.amount} onChange={e => setBalanceForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" className="mt-1.5" /></div>
            <div><Label>Keterangan</Label><Input value={balanceForm.description} onChange={e => setBalanceForm(f => ({ ...f, description: e.target.value }))} placeholder="Opsional" className="mt-1.5" /></div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowBalance(null)} className="flex-1">Batal</Button>
              <Button onClick={() => adjustBalanceMutation.mutate()} disabled={adjustBalanceMutation.isPending || !balanceForm.amount} className="flex-1 gradient-button text-primary-foreground">
                {adjustBalanceMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!showPwReset} onOpenChange={open => { if (!open) { setShowPwReset(null); setNewPassword(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reset Password — {showPwReset?.nama}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Password Baru</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 karakter" className="mt-1.5" /></div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setShowPwReset(null); setNewPassword(''); }} className="flex-1">Batal</Button>
              <Button onClick={() => resetPwMutation.mutate()} disabled={resetPwMutation.isPending || !newPassword} className="flex-1 gradient-button text-primary-foreground">
                {resetPwMutation.isPending ? 'Mereset...' : 'Reset Password'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
