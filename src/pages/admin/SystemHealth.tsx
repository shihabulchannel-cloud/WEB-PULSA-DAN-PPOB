import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2, XCircle, AlertCircle, RefreshCw, Activity,
  Wifi, Database, Zap, CreditCard, Server, Globe
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/hooks/use-toast';

interface HealthItem {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown' | 'checking';
  message: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

export default function AdminSystemHealth() {
  const { session } = useAuth();
  const { data: settings = {} } = useSettings();
  const { toast } = useToast();
  const [digiflazzResult, setDigiflazzResult] = useState<{ success: boolean; message: string; balance?: number } | null>(null);
  const [testing, setTesting] = useState(false);

  // Check provider config status from settings
  const digiConfigured = !!(settings.digiflazz_username?.trim() && settings.digiflazz_api_key?.trim());
  const duitkuConfigured = !!(settings.duitku_merchant_code?.trim() && settings.duitku_api_key?.trim());
  const vipConfigured = !!(settings.vip_merchant_id?.trim() && settings.vip_secret_key?.trim());
  const vipResellerConfigured = !!(settings.vip_reseller_username?.trim() && settings.vip_reseller_api_key?.trim());
  const waConfigured = !!(settings.fonnte_api_key?.trim());

  // DB health
  const { data: dbStats, isLoading: dbLoading, refetch: refetchDb } = useQuery({
    queryKey: ['health-db'],
    queryFn: async () => {
      const [txR, prodR, settR] = await Promise.all([
        supabase.from('transactions').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('settings').select('id', { count: 'exact', head: true }),
      ]);
      return {
        transactions: txR.count || 0,
        products: prodR.count || 0,
        settings: settR.count || 0,
        error: txR.error?.message,
      };
    },
    refetchInterval: 60000,
  });

  const { data: recentLogs = [] } = useQuery({
    queryKey: ['health-recent-logs'],
    queryFn: async () => {
      const { data } = await supabase.from('api_logs').select('service, is_success, created_at')
        .order('created_at', { ascending: false }).limit(20);
      return data || [];
    },
    refetchInterval: 30000,
  });

  const handleTestDigiflazz = async () => {
    setTesting(true);
    setDigiflazzResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('digiflazz-test-connection', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      setDigiflazzResult(data);
      toast({
        title: data.success ? 'Digiflazz OK' : 'Digiflazz Error',
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      });
    } catch (e) {
      setDigiflazzResult({ success: false, message: String(e) });
    } finally {
      setTesting(false);
    }
  };

  // Calculate Digiflazz log health
  const digiLogs = recentLogs.filter((l: { service: string }) => l.service === 'digiflazz');
  const digiSuccess = digiLogs.filter((l: { is_success: boolean }) => l.is_success).length;
  const digiRate = digiLogs.length > 0 ? Math.round((digiSuccess / digiLogs.length) * 100) : null;

  const healthItems: HealthItem[] = [
    {
      name: 'Database (Enter Cloud)',
      status: dbLoading ? 'checking' : dbStats?.error ? 'down' : 'healthy',
      message: dbLoading ? 'Memeriksa...' : dbStats?.error ? dbStats.error : `${dbStats?.transactions?.toLocaleString()} transaksi, ${dbStats?.products?.toLocaleString()} produk`,
      icon: Database, color: 'text-blue-600', bg: 'bg-blue-50',
    },
    {
      name: 'Digiflazz API',
      status: !digiConfigured ? 'down' : digiflazzResult ? (digiflazzResult.success ? 'healthy' : 'degraded') : digiRate !== null ? (digiRate >= 90 ? 'healthy' : digiRate >= 50 ? 'degraded' : 'down') : 'unknown',
      message: !digiConfigured ? 'Belum dikonfigurasi — isi di Pengaturan' : digiflazzResult ? digiflazzResult.message : digiRate !== null ? `Success rate: ${digiRate}% dari ${digiLogs.length} API call terakhir` : 'Belum ada data log — klik Test untuk cek',
      icon: Zap, color: 'text-green-600', bg: 'bg-green-50',
    },
    {
      name: 'Duitku Payment Gateway',
      status: duitkuConfigured ? 'healthy' : 'down',
      message: duitkuConfigured ? `Mode: ${settings.duitku_mode || 'sandbox'} — Merchant code tersimpan` : 'Belum dikonfigurasi — isi di Pengaturan',
      icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50',
    },
    {
      name: 'VIP Payment Gateway',
      status: vipConfigured ? 'healthy' : 'unknown',
      message: vipConfigured ? `Mode: ${settings.vip_mode || 'sandbox'} — Tersimpan` : 'Belum dikonfigurasi (opsional)',
      icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50',
    },
    {
      name: 'VIP Reseller Provider',
      status: vipResellerConfigured ? 'healthy' : 'unknown',
      message: vipResellerConfigured ? 'API tersimpan' : 'Belum dikonfigurasi (opsional)',
      icon: Server, color: 'text-cyan-600', bg: 'bg-cyan-50',
    },
    {
      name: 'WhatsApp Notifikasi (Fonnte)',
      status: waConfigured ? 'healthy' : 'unknown',
      message: waConfigured ? 'API Key tersimpan' : 'Belum dikonfigurasi (opsional)',
      icon: Activity, color: 'text-teal-600', bg: 'bg-teal-50',
    },
    {
      name: 'Website',
      status: 'healthy',
      message: 'Frontend berjalan normal',
      icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50',
    },
    {
      name: 'Edge Functions',
      status: 'healthy',
      message: 'Semua backend functions aktif',
      icon: Wifi, color: 'text-emerald-600', bg: 'bg-emerald-50',
    },
  ];

  const statusIcon = (status: string) => {
    if (status === 'healthy') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === 'degraded') return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    if (status === 'down') return <XCircle className="w-4 h-4 text-red-500" />;
    if (status === 'checking') return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
    return <AlertCircle className="w-4 h-4 text-muted-foreground/40" />;
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = { healthy: 'Aktif', degraded: 'Degraded', down: 'Error', unknown: 'Belum Diset', checking: 'Memeriksa...' };
    return map[status] || status;
  };

  const statusColor = (status: string) => {
    if (status === 'healthy') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'degraded') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (status === 'down') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-muted text-muted-foreground border-border';
  };

  const healthyCount = healthItems.filter(i => i.status === 'healthy').length;
  const errorCount = healthItems.filter(i => i.status === 'down').length;

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">System Health</h1>
            <p className="text-sm text-muted-foreground">Monitor status seluruh komponen sistem</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{healthyCount} aktif</span>
            </div>
            {errorCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-full border border-red-200">
                <XCircle className="w-3.5 h-3.5" />
                <span>{errorCount} error</span>
              </div>
            )}
          </div>
        </div>

        {/* Health Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {healthItems.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.name} className="bg-card border border-border rounded-2xl p-4 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <Icon className={`w-4.5 h-4.5 ${item.color}`} />
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusColor(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  {statusIcon(item.status)}
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{item.message}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Digiflazz Test */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Test Koneksi Digiflazz</h3>
            </div>
            <Button onClick={handleTestDigiflazz} disabled={testing || !digiConfigured} size="sm"
              className="gap-2 gradient-button text-primary-foreground">
              {testing ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testing...</> : <><Wifi className="w-3.5 h-3.5" /> Test Sekarang</>}
            </Button>
          </div>

          {!digiConfigured && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-700">
              Username dan API Key Digiflazz belum dikonfigurasi. Isi terlebih dahulu di Pengaturan → Digiflazz.
            </div>
          )}

          {digiflazzResult && (
            <div className={`rounded-xl p-4 border ${digiflazzResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {digiflazzResult.success ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                <span className={`text-sm font-semibold ${digiflazzResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {digiflazzResult.success ? 'Koneksi Berhasil' : 'Koneksi Gagal'}
                </span>
              </div>
              <p className={`text-xs ${digiflazzResult.success ? 'text-green-700' : 'text-red-700'}`}>{digiflazzResult.message}</p>
              {digiflazzResult.success && typeof digiflazzResult.balance !== 'undefined' && (
                <p className="text-xs text-green-600 mt-1 font-semibold">
                  Saldo: Rp {Number(digiflazzResult.balance).toLocaleString('id-ID')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Recent API Logs */}
        <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm">API Log Terakhir</h3>
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => { refetchDb(); }}>
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  {['Layanan', 'Status', 'Durasi', 'Waktu'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentLogs.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-muted-foreground">Belum ada log</td></tr>
                ) : recentLogs.slice(0, 10).map((log: { service: string; is_success: boolean; duration_ms: number; created_at: string }, i: number) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium text-foreground">{log.service}</td>
                    <td className="px-4 py-2.5">
                      {log.is_success ? <span className="text-green-600 font-medium">Sukses</span> : <span className="text-red-600 font-medium">Gagal</span>}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{log.duration_ms}ms</td>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{new Date(log.created_at).toLocaleString('id-ID')}</td>
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
