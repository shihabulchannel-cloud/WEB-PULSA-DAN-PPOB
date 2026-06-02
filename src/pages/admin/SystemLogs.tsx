import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { CheckCircle2, XCircle, Clock, Activity, Webhook, FileText, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils-app';
import { useQueryClient } from '@tanstack/react-query';

type Tab = 'api' | 'webhook' | 'activity';

export default function AdminSystemLogs() {
  const [tab, setTab] = useState<Tab>('api');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: apiLogs = [], isLoading: apiLoading } = useQuery({
    queryKey: ['sys-api-logs', search],
    queryFn: async () => {
      let q = supabase.from('api_logs').select('*').order('created_at', { ascending: false }).limit(100);
      if (search) q = q.or(`service.ilike.%${search}%,endpoint.ilike.%${search}%`);
      const { data } = await q;
      return data || [];
    },
    enabled: tab === 'api',
    refetchInterval: 30000,
  });

  const { data: webhookLogs = [], isLoading: webhookLoading } = useQuery({
    queryKey: ['sys-webhook-logs', search],
    queryFn: async () => {
      let q = supabase.from('webhook_logs').select('*').order('created_at', { ascending: false }).limit(100);
      if (search) q = q.or(`source.ilike.%${search}%,ref_id.ilike.%${search}%`);
      const { data } = await q;
      return data || [];
    },
    enabled: tab === 'webhook',
    refetchInterval: 30000,
  });

  const { data: activityLogs = [], isLoading: activityLoading } = useQuery({
    queryKey: ['sys-activity-logs', search],
    queryFn: async () => {
      let q = supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100);
      if (search) q = q.or(`action.ilike.%${search}%,entity_type.ilike.%${search}%`);
      const { data } = await q;
      return data || [];
    },
    enabled: tab === 'activity',
    refetchInterval: 60000,
  });

  const tabs = [
    { key: 'api' as Tab, label: 'API Log', icon: Activity, count: apiLogs.length },
    { key: 'webhook' as Tab, label: 'Webhook Log', icon: Webhook, count: webhookLogs.length },
    { key: 'activity' as Tab, label: 'Activity Log', icon: FileText, count: activityLogs.length },
  ];

  const isLoading = tab === 'api' ? apiLoading : tab === 'webhook' ? webhookLoading : activityLoading;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: [`sys-${tab}-logs`] });
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Log Sistem</h1>
            <p className="text-sm text-muted-foreground">Monitor aktivitas API, webhook, dan admin panel</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={refresh}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); }}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === t.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari log..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-sm" />
        </div>

        {/* API Logs */}
        {tab === 'api' && (
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>{['Layanan', 'Endpoint', 'Status', 'HTTP', 'Durasi', 'Waktu'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td></tr>)
                  ) : apiLogs.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Belum ada log</td></tr>
                  ) : apiLogs.map((log: { id: string; service: string; endpoint: string; is_success: boolean; status_code: number; duration_ms: number; error_message: string; created_at: string }) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3"><span className="text-xs font-medium text-foreground">{log.service}</span></td>
                      <td className="px-4 py-3 max-w-[200px]"><p className="text-xs text-muted-foreground truncate">{log.endpoint}</p></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {log.is_success ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                          <span className={`text-xs font-medium ${log.is_success ? 'text-green-600' : 'text-red-600'}`}>{log.is_success ? 'Sukses' : 'Gagal'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={`text-xs font-mono px-1.5 py-0.5 rounded ${log.status_code < 300 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{log.status_code}</span></td>
                      <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{log.duration_ms}ms</span></td>
                      <td className="px-4 py-3"><span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.created_at)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Webhook Logs */}
        {tab === 'webhook' && (
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>{['Sumber', 'Ref ID', 'Status', 'Diproses', 'Waktu'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => <tr key={i}><td colSpan={5}><div className="skeleton h-4 m-4 rounded" /></td></tr>)
                  ) : webhookLogs.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Belum ada log webhook</td></tr>
                  ) : webhookLogs.map((log: { id: string; source: string; ref_id: string; is_valid: boolean; processed: boolean; created_at: string }) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3"><span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">{log.source}</span></td>
                      <td className="px-4 py-3"><span className="text-xs font-mono text-muted-foreground">{log.ref_id || '—'}</span></td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${log.is_valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{log.is_valid ? 'Valid' : 'Invalid'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${log.processed ? 'text-green-600' : 'text-yellow-600'}`}>{log.processed ? 'Ya' : 'Belum'}</span>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.created_at)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activity Logs */}
        {tab === 'activity' && (
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>{['Aksi', 'Entitas', 'ID Entitas', 'IP', 'Waktu'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => <tr key={i}><td colSpan={5}><div className="skeleton h-4 m-4 rounded" /></td></tr>)
                  ) : activityLogs.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Belum ada log aktivitas</td></tr>
                  ) : activityLogs.map((log: { id: string; action: string; entity_type: string; entity_id: string; ip_address: string; created_at: string }) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3"><span className="text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded">{log.action}</span></td>
                      <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{log.entity_type || '—'}</span></td>
                      <td className="px-4 py-3"><span className="text-xs font-mono text-muted-foreground truncate max-w-[120px] block">{log.entity_id || '—'}</span></td>
                      <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{log.ip_address || '—'}</span></td>
                      <td className="px-4 py-3"><span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.created_at)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" />Sukses / Valid</div>
          <div className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-red-500" />Gagal / Invalid</div>
          <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-yellow-500" />Menunggu</div>
        </div>
      </div>
    </AdminLayout>
  );
}
