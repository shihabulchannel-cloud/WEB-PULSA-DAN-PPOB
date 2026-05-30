import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { formatDate } from '@/lib/utils-app';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface ApiLog {
  id: string; service: string; endpoint: string; status_code: number; is_success: boolean; duration_ms: number; error_message: string; created_at: string;
}

export default function AdminApiLogs() {
  const { data: logs = [], isLoading } = useQuery<ApiLog[]>({
    queryKey: ['api-logs'],
    queryFn: async () => {
      const { data } = await supabase.from('api_logs').select('*').order('created_at', { ascending: false }).limit(100);
      return data || [];
    },
    refetchInterval: 30000,
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Log API</h1>
          <p className="text-sm text-muted-foreground">Riwayat panggilan API Digiflazz, Tripay, dan layanan lainnya</p>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  {['Layanan', 'Endpoint', 'Status', 'Durasi', 'Tanggal'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  [...Array(5)].map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>)
                ) : logs.map(log => (
                  <tr key={log.id} className={`hover:bg-muted/20 ${!log.is_success ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${log.service === 'digiflazz' ? 'bg-blue-100 text-blue-700' : log.service === 'tripay' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                        {log.service}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{log.endpoint}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {log.is_success ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-destructive" />}
                        <span className="text-xs">{log.status_code}</span>
                        {log.error_message && <span className="text-xs text-destructive truncate max-w-[150px]">{log.error_message}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {log.duration_ms}ms
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(log.created_at)}</td>
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
