import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  RefreshCw, Wifi, WifiOff, Package, Settings as SettingsIcon,
  CheckCircle2, XCircle, Clock, Zap, Link as LinkIcon, AlertCircle,
  Database, ArrowRight
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils-app';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';

export default function AdminDigiflazz() {
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; balance?: number } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();
  const qc = useQueryClient();
  const { data: settings = {} } = useSettings();

  const username = settings.digiflazz_username || '';
  const isConfigured = !!username && !!settings.digiflazz_api_key;

  /* ── Product Count ── */
  const { data: productStats } = useQuery({
    queryKey: ['digiflazz-product-stats'],
    queryFn: async () => {
      const [total, active, inactive] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', false),
      ]);
      return { total: total.count || 0, active: active.count || 0, inactive: inactive.count || 0 };
    },
    refetchInterval: 60000,
  });

  /* ── Category Breakdown ── */
  const { data: categoryStats = [] } = useQuery({
    queryKey: ['digiflazz-category-stats'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('categories(name), is_active').eq('is_active', true);
      const grouped: Record<string, number> = {};
      (data || []).forEach((p: { categories?: { name: string }; is_active: boolean }) => {
        const name = p.categories?.name || 'Lainnya';
        grouped[name] = (grouped[name] || 0) + 1;
      });
      return Object.entries(grouped).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    },
  });

  /* ── Recent Sync Logs ── */
  const { data: syncLogs = [] } = useQuery({
    queryKey: ['digiflazz-sync-logs'],
    queryFn: async () => {
      const { data } = await supabase.from('api_logs').select('*').eq('service', 'digiflazz').order('created_at', { ascending: false }).limit(5);
      return data || [];
    },
    refetchInterval: 30000,
  });

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('digiflazz-test-connection', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      setTestResult(data);
      toast({
        title: data.success ? 'Koneksi Berhasil' : 'Koneksi Gagal',
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      });
    } catch {
      setTestResult({ success: false, message: 'Gagal menghubungi server' });
      toast({ title: 'Error', description: 'Gagal menghubungi server Digiflazz', variant: 'destructive' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSync = async () => {
    if (!isConfigured) {
      toast({ title: 'Konfigurasi diperlukan', description: 'Harap isi Username dan API Key Digiflazz di Pengaturan', variant: 'destructive' });
      return;
    }
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('digiflazz-sync', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      toast({
        title: 'Sinkronisasi Berhasil',
        description: `${data?.synced || 0} produk berhasil disinkronkan`,
      });
      qc.invalidateQueries({ queryKey: ['digiflazz-product-stats'] });
      qc.invalidateQueries({ queryKey: ['digiflazz-category-stats'] });
      qc.invalidateQueries({ queryKey: ['digiflazz-sync-logs'] });
    } catch {
      toast({ title: 'Sinkronisasi Gagal', description: 'Periksa konfigurasi API Digiflazz', variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Manajemen Digiflazz</h1>
            <p className="text-sm text-muted-foreground">Sinkronisasi produk dan konfigurasi API Digiflazz</p>
          </div>
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                <Wifi className="w-3.5 h-3.5" />
                <span>API Terkonfigurasi</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Belum Dikonfigurasi</span>
              </div>
            )}
          </div>
        </div>

        {/* Config Warning */}
        {!isConfigured && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-orange-800 text-sm mb-1">API Digiflazz belum dikonfigurasi</p>
              <p className="text-xs text-orange-600 mb-3">Isi Username dan API Key Digiflazz di menu Pengaturan untuk mengaktifkan sinkronisasi produk.</p>
              <Link to="/admin/settings">
                <Button size="sm" className="gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs">
                  <SettingsIcon className="w-3.5 h-3.5" />
                  Buka Pengaturan <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Test Connection */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <Wifi className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Test Koneksi</h3>
            <p className="text-xs text-muted-foreground mb-4">Cek status koneksi dan saldo akun Digiflazz Anda</p>
            {testResult && (
              <div className={`flex items-center gap-2 text-xs mb-3 p-2.5 rounded-lg ${testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}
            <Button onClick={handleTest} disabled={isTesting} size="sm" className="w-full gap-2 gradient-button text-primary-foreground">
              {isTesting ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Memeriksa...</> : <><Wifi className="w-3.5 h-3.5" /> Test Koneksi</>}
            </Button>
          </div>

          {/* Sync Products */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
            <div className="w-11 h-11 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Sinkronisasi Produk</h3>
            <p className="text-xs text-muted-foreground mb-4">Ambil semua produk terbaru dari Digiflazz ke website. Harga otomatis diperbarui.</p>
            <div className="text-xs text-muted-foreground bg-muted rounded-lg p-2.5 mb-4">
              <span className="font-medium text-foreground">Total Produk:</span> {productStats?.total.toLocaleString() || '-'} &nbsp;•&nbsp;
              <span className="text-green-600 font-medium">Aktif: {productStats?.active.toLocaleString() || '-'}</span>
            </div>
            <Button onClick={handleSync} disabled={isSyncing || !isConfigured} size="sm" className="w-full gap-2 gradient-button text-primary-foreground">
              {isSyncing ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Mensinkronkan...</> : <><RefreshCw className="w-3.5 h-3.5" /> Sync Semua Produk</>}
            </Button>
          </div>

          {/* API Info */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Informasi API</h3>
            <p className="text-xs text-muted-foreground mb-4">Detail konfigurasi API Digiflazz yang tersimpan</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Username</span>
                <span className="font-medium text-foreground">{username || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">API Key</span>
                <span className="font-medium text-foreground">{settings.digiflazz_api_key ? '••••••••' : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Webhook</span>
                <span className={`font-medium ${settings.digiflazz_webhook_secret ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {settings.digiflazz_webhook_secret ? 'Tersimpan' : '—'}
                </span>
              </div>
            </div>
            <Link to="/admin/settings">
              <Button variant="outline" size="sm" className="w-full gap-2 mt-4 text-xs">
                <SettingsIcon className="w-3.5 h-3.5" /> Edit Konfigurasi
              </Button>
            </Link>
          </div>
        </div>

        {/* Webhook URL Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <LinkIcon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">Webhook URL Digiflazz</p>
            <p className="text-xs text-blue-600 mb-1.5">Set URL ini di dashboard Digiflazz → Pengaturan → Webhook:</p>
            <code className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-800 break-all">
              {`${window.location.origin.replace(window.location.hostname, '[supabase-url]')}/functions/v1/digiflazz-webhook`}
            </code>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Category Breakdown */}
          <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">Produk per Kategori</h3>
            </div>
            <div className="p-4 space-y-2.5">
              {categoryStats.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada produk tersinkron</p>
              ) : categoryStats.slice(0, 8).map((cat: { name: string; count: number }) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-foreground truncate">{cat.name}</span>
                      <span className="text-xs font-bold text-primary ml-2">{cat.count.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.max(4, (cat.count / (categoryStats[0]?.count || 1)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Sync Logs */}
          <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">Log Sinkronisasi Terakhir</h3>
            </div>
            <div className="divide-y divide-border">
              {syncLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Belum ada log sinkronisasi</p>
              ) : syncLogs.map((log: { id: string; endpoint: string; is_success: boolean; status_code: number; duration_ms: number; created_at: string }) => (
                <div key={log.id} className="px-5 py-3 flex items-center gap-3">
                  {log.is_success ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{log.endpoint}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(log.created_at)} • {log.duration_ms}ms</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${log.is_success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {log.status_code}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
