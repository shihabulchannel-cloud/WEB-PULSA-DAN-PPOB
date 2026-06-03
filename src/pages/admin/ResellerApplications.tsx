import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils-app';
import { CheckCircle, XCircle, Clock, MessageCircle, Search } from 'lucide-react';

const statusColor = {
  waiting: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  approved: 'text-green-600 bg-green-50 border-green-200',
  rejected: 'text-red-600 bg-red-50 border-red-200',
};
const statusLabel = { waiting: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' };

interface Application {
  id: string; nama: string; whatsapp: string; email: string; kota: string;
  nama_toko: string; status: string; notes: string; created_at: string;
}

export default function AdminResellerApplications() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<Application | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [notes, setNotes] = useState('');

  const { data: apps = [], isLoading } = useQuery<Application[]>({
    queryKey: ['reseller-applications', search, filterStatus],
    queryFn: async () => {
      let q = supabase.from('reseller_applications').select('*').order('created_at', { ascending: false });
      if (search) q = q.ilike('nama', `%${search}%`);
      if (filterStatus !== 'all') q = q.eq('status', filterStatus);
      const { data } = await q;
      return data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('reseller_applications').update({ status, notes }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Status diperbarui' });
      qc.invalidateQueries({ queryKey: ['reseller-applications'] });
      setDetail(null);
    },
    onError: () => toast({ title: 'Gagal memperbarui', variant: 'destructive' }),
  });

  const waNumber = detail?.whatsapp?.replace(/\D/g, '') || '';

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Aplikasi Pendaftaran Reseller</h1>
            <p className="text-sm text-muted-foreground">{apps.length} pendaftar</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Cari nama..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
            <option value="all">Semua Status</option>
            <option value="waiting">Menunggu</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b border-border">
                <tr>{['Nama', 'WhatsApp', 'Email', 'Kota', 'Toko', 'Status', 'Tanggal', 'Aksi'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? [...Array(4)].map((_, i) => (
                  <tr key={i}><td colSpan={8}><div className="skeleton h-10 m-2 rounded" /></td></tr>
                )) : apps.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">Belum ada pendaftar</td></tr>
                ) : apps.map(a => {
                  const status = a.status as keyof typeof statusColor;
                  return (
                    <tr key={a.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{a.nama}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{a.whatsapp}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{a.email || '-'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{a.kota || '-'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{a.nama_toko || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${statusColor[status] || statusColor.waiting}`}>
                          {statusLabel[status] || a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(a.created_at)}</td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => { setDetail(a); setNotes(a.notes || ''); }}>
                          Detail
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={open => { if (!open) setDetail(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Detail Pendaftaran</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[['Nama', detail.nama], ['WhatsApp', detail.whatsapp], ['Email', detail.email || '-'], ['Kota', detail.kota || '-'], ['Nama Toko', detail.nama_toko || '-'], ['Daftar', formatDate(detail.created_at)]].map(([k, v]) => (
                  <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="font-medium text-foreground">{v}</p></div>
                ))}
              </div>
              {waNumber && (
                <a href={`https://wa.me/${waNumber}?text=Halo ${detail.nama}, pendaftaran reseller Anda sudah kami terima.`}
                  target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full gap-2 text-green-600 border-green-300 hover:bg-green-50">
                    <MessageCircle className="w-4 h-4" /> Hubungi via WhatsApp
                  </Button>
                </a>
              )}
              <div>
                <label className="text-xs text-muted-foreground">Catatan Admin</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none h-20" placeholder="Opsional..." />
              </div>
              <div className="flex gap-2">
                {detail.status !== 'approved' && (
                  <Button onClick={() => updateStatusMutation.mutate({ id: detail.id, status: 'approved' })}
                    disabled={updateStatusMutation.isPending}
                    className="flex-1 gap-1.5 text-green-600 border-green-300 hover:bg-green-50 bg-green-50" variant="outline">
                    <CheckCircle className="w-4 h-4" /> Setujui
                  </Button>
                )}
                {detail.status === 'waiting' && (
                  <Button onClick={() => updateStatusMutation.mutate({ id: detail.id, status: 'rejected' })}
                    disabled={updateStatusMutation.isPending}
                    className="flex-1 gap-1.5" variant="outline">
                    <XCircle className="w-4 h-4 text-destructive" /> Tolak
                  </Button>
                )}
                {detail.status !== 'waiting' && (
                  <Button onClick={() => updateStatusMutation.mutate({ id: detail.id, status: 'waiting' })}
                    disabled={updateStatusMutation.isPending}
                    variant="outline" className="flex-1 gap-1.5">
                    <Clock className="w-4 h-4" /> Reset ke Menunggu
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
