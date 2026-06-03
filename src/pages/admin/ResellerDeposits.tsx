import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate } from '@/lib/utils-app';
import { CheckCircle, XCircle, ExternalLink, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const statusColor = {
  pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  approved: 'text-green-600 bg-green-50 border-green-200',
  rejected: 'text-red-600 bg-red-50 border-red-200',
};
const statusLabel = { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' };

interface Deposit {
  id: string; reseller_id: string; amount: number; bank_name: string; sender_name: string;
  proof_url: string; status: string; notes: string; created_at: string;
  resellers: { nama: string; username: string } | null;
}

export default function AdminResellerDeposits() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('pending');
  const [detail, setDetail] = useState<Deposit | null>(null);
  const [notes, setNotes] = useState('');

  const { data: deposits = [], isLoading } = useQuery<Deposit[]>({
    queryKey: ['admin-deposits', filter],
    queryFn: async () => {
      let q = supabase.from('reseller_deposits')
        .select('*, resellers(nama, username)')
        .order('created_at', { ascending: false });
      if (filter !== 'all') q = q.eq('status', filter);
      const { data } = await q;
      return data || [];
    },
  });

  const actionMutation = useMutation({
    mutationFn: async (action: 'approve' | 'reject') => {
      if (!detail) return;
      const { data, error } = await supabase.functions.invoke('reseller-deposit-action', {
        body: { deposit_id: detail.id, action, notes: notes || undefined, approved_by: user?.id },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
    },
    onSuccess: (_, action) => {
      toast({ title: action === 'approve' ? 'Deposit disetujui — saldo bertambah' : 'Deposit ditolak' });
      qc.invalidateQueries({ queryKey: ['admin-deposits'] });
      setDetail(null); setNotes('');
    },
    onError: (err: Error) => toast({ title: 'Gagal', description: err.message, variant: 'destructive' }),
  });

  const pendingCount = deposits.filter(d => d.status === 'pending').length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Deposit Reseller</h1>
            {pendingCount > 0 && (
              <p className="text-sm text-yellow-600 font-medium mt-0.5">{pendingCount} deposit menunggu verifikasi</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', 'all'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/60'}`}>
              {s === 'pending' ? 'Menunggu' : s === 'approved' ? 'Disetujui' : s === 'rejected' ? 'Ditolak' : 'Semua'}
            </button>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b border-border">
                <tr>{['Reseller', 'Nominal', 'Pengirim', 'Bank', 'Bukti', 'Status', 'Tanggal', 'Aksi'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? [...Array(4)].map((_, i) => (
                  <tr key={i}><td colSpan={8}><div className="skeleton h-10 m-2 rounded" /></td></tr>
                )) : deposits.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12">
                    <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Tidak ada deposit</p>
                  </td></tr>
                ) : deposits.map(d => {
                  const status = d.status as keyof typeof statusColor;
                  return (
                    <tr key={d.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{d.resellers?.nama || '-'}</p>
                        <p className="text-xs text-muted-foreground">@{d.resellers?.username || '-'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-foreground whitespace-nowrap">{formatCurrency(d.amount)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{d.sender_name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{d.bank_name || '-'}</td>
                      <td className="px-4 py-3">
                        {d.proof_url ? (
                          <a href={d.proof_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline">
                            <ExternalLink className="w-3 h-3" /> Lihat
                          </a>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${statusColor[status] || statusColor.pending}`}>
                          {statusLabel[status] || d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(d.created_at)}</td>
                      <td className="px-4 py-3">
                        {d.status === 'pending' && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => { setDetail(d); setNotes(''); }}>
                            Proses
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={!!detail} onOpenChange={open => { if (!open) { setDetail(null); setNotes(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Verifikasi Deposit</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Reseller</span><span className="font-medium">{detail.resellers?.nama}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Nominal</span><span className="font-bold text-primary">{formatCurrency(detail.amount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Pengirim</span><span>{detail.sender_name}</span></div>
                {detail.bank_name && <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span>{detail.bank_name}</span></div>}
              </div>
              {detail.proof_url && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Bukti Transfer</p>
                  {detail.proof_url.match(/\.(jpg|jpeg|png)$/i) ? (
                    <img src={detail.proof_url} alt="bukti" className="w-full max-h-60 object-contain rounded-xl border border-border" />
                  ) : (
                    <a href={detail.proof_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline p-3 border border-border rounded-lg">
                      <ExternalLink className="w-4 h-4" /> Buka Bukti Transfer
                    </a>
                  )}
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground">Catatan (opsional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none h-16" />
              </div>
              <div className="flex gap-3">
                <Button onClick={() => actionMutation.mutate('reject')} disabled={actionMutation.isPending}
                  variant="outline" className="flex-1 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
                  <XCircle className="w-4 h-4" /> Tolak
                </Button>
                <Button onClick={() => actionMutation.mutate('approve')} disabled={actionMutation.isPending}
                  className="flex-1 gap-1.5 gradient-button text-primary-foreground">
                  <CheckCircle className="w-4 h-4" /> Setujui & Tambah Saldo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
