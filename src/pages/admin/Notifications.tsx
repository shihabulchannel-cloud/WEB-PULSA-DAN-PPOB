import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Bell, CheckCircle2, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils-app';

interface Notification {
  id: string; type: string; channel: string; recipient: string; message: string; is_sent: boolean; sent_at: string; error_message: string; created_at: string;
}

const typeLabels: Record<string, string> = {
  topup_success: 'Top Up Berhasil', topup_failed: 'Top Up Gagal',
  payment_success: 'Pembayaran Berhasil', payment_failed: 'Pembayaran Gagal', payment_expired: 'Pembayaran Kadaluarsa'
};

export default function AdminNotifications() {
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
      return data || [];
    },
    refetchInterval: 30000,
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Riwayat Notifikasi</h1>
          <p className="text-sm text-muted-foreground">Log notifikasi email, WhatsApp, dan in-app</p>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  {['Tipe', 'Channel', 'Penerima', 'Status', 'Tanggal'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  [...Array(5)].map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>)
                ) : notifications.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Belum ada notifikasi
                  </td></tr>
                ) : notifications.map(n => (
                  <tr key={n.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${n.type?.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {typeLabels[n.type] || n.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${n.channel === 'whatsapp' ? 'bg-green-100 text-green-700' : n.channel === 'email' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {n.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{n.recipient || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {n.is_sent ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                        <span className="text-xs">{n.is_sent ? 'Terkirim' : 'Gagal'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(n.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
