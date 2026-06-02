import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Wifi, WifiOff, RefreshCw, CheckCircle2, XCircle, Zap, Server, Info } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProviderDef {
  id: string;
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
  canTest: boolean;
  docsUrl?: string;
}

const providers: ProviderDef[] = [
  {
    id: 'digiflazz',
    name: 'Digiflazz',
    desc: 'Provider utama untuk top up game, pulsa, data, e-wallet & PPOB',
    icon: Zap,
    color: 'text-green-600',
    bg: 'bg-green-50',
    canTest: true,
    docsUrl: 'https://developer.digiflazz.com',
    fields: [
      { key: 'digiflazz_username', label: 'Username Digiflazz', placeholder: 'username akun Digiflazz' },
      { key: 'digiflazz_api_key', label: 'API Key (Development/Production)', placeholder: 'API Key dari Digiflazz', type: 'password' },
      { key: 'digiflazz_webhook_secret', label: 'Webhook Secret', placeholder: 'Secret key untuk verifikasi callback', type: 'password' },
    ],
  },
  {
    id: 'vip_reseller',
    name: 'VIP Reseller',
    desc: 'Provider sekunder — digunakan sebagai fallback jika Digiflazz gagal',
    icon: Server,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    canTest: false,
    fields: [
      { key: 'vip_reseller_username', label: 'Username VIP Reseller', placeholder: 'Username akun VIP Reseller' },
      { key: 'vip_reseller_api_key', label: 'API Key VIP Reseller', placeholder: 'API Key dari VIP Reseller', type: 'password' },
      { key: 'vip_reseller_mode', label: 'Mode (sandbox/production)', placeholder: 'sandbox' },
    ],
  },
];

const priorityCategories = [
  { key: 'provider_priority_game', label: 'Top Up Game' },
  { key: 'provider_priority_pulsa', label: 'Pulsa & Data' },
  { key: 'provider_priority_ewallet', label: 'E-Wallet' },
  { key: 'provider_priority_ppob', label: 'PPOB / Tagihan' },
];

export default function AdminProviders() {
  const { data: settings = {}, refetch } = useSettings();
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeProvider, setActiveProvider] = useState('digiflazz');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; debug?: Record<string, unknown> } | null>(null);
  const [testing, setTesting] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => { setValues(settings); }, [settings]);

  const provider = providers.find(p => p.id === activeProvider)!;

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Save only relevant fields for the current provider
      const keys = provider.fields.map(f => f.key);
      // Also save priority settings
      const priorityKeys = priorityCategories.map(p => p.key);
      const allKeys = [...keys, ...priorityKeys];
      for (const key of allKeys) {
        if (values[key] !== undefined) {
          await supabase.from('settings').upsert({ key, value: values[key], updated_at: new Date().toISOString() }, { onConflict: 'key' });
        }
      }
    },
    onSuccess: () => {
      toast({ title: 'Konfigurasi disimpan' });
      qc.invalidateQueries({ queryKey: ['settings'] });
      refetch();
    },
    onError: () => toast({ title: 'Gagal menyimpan', variant: 'destructive' }),
  });

  const handleTest = async () => {
    if (activeProvider !== 'digiflazz') {
      toast({ title: 'Test tidak tersedia', description: 'Test koneksi hanya tersedia untuk Digiflazz' });
      return;
    }
    setTesting(true);
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
    } catch (e) {
      setTestResult({ success: false, message: String(e) });
    } finally {
      setTesting(false);
    }
  };

  const isConfigured = (prov: ProviderDef) => {
    const mainField = prov.fields[0];
    const secondField = prov.fields[1];
    return !!(values[mainField.key]?.trim() && values[secondField?.key]?.trim());
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Manajemen Provider</h1>
          <p className="text-sm text-muted-foreground">Konfigurasi provider transaksi dan prioritas fallback</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-5">
          {/* Sidebar */}
          <div className="w-full lg:w-52 flex-shrink-0 space-y-2">
            {providers.map(p => {
              const Icon = p.icon;
              const configured = isConfigured(p);
              return (
                <button key={p.id} onClick={() => { setActiveProvider(p.id); setTestResult(null); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all border ${activeProvider === p.id ? 'gradient-button text-primary-foreground border-transparent' : 'bg-card border-border text-foreground hover:bg-muted'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${activeProvider === p.id ? 'bg-white/20' : p.bg}`}>
                    <Icon className={`w-4 h-4 ${activeProvider === p.id ? 'text-primary-foreground' : p.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{p.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {configured
                        ? <Wifi className={`w-3 h-3 ${activeProvider === p.id ? 'text-primary-foreground/70' : 'text-green-500'}`} />
                        : <WifiOff className={`w-3 h-3 ${activeProvider === p.id ? 'text-primary-foreground/70' : 'text-muted-foreground/40'}`} />}
                      <span className={`text-[10px] ${activeProvider === p.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {configured ? 'Terkonfigurasi' : 'Belum diatur'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Config Panel */}
          <div className="flex-1 space-y-4">
            <div className="bg-card border border-border rounded-2xl shadow-card p-5">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <provider.icon className={`w-5 h-5 ${provider.color}`} />
                  <h2 className="font-semibold text-foreground">{provider.name}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isConfigured(provider) ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-muted text-muted-foreground border border-border'}`}>
                    {isConfigured(provider) ? 'Terkonfigurasi' : 'Belum Diatur'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {provider.canTest && (
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleTest} disabled={testing}>
                      {testing ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testing...</> : <><Wifi className="w-3.5 h-3.5" /> Test Koneksi</>}
                    </Button>
                  )}
                  <Button size="sm" className="gap-1.5 gradient-button text-primary-foreground text-xs" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                    <Save className="w-3.5 h-3.5" />
                    {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{provider.desc}</p>

              <div className="space-y-4">
                {provider.fields.map(field => (
                  <div key={field.key}>
                    <Label className="text-sm font-medium">{field.label}</Label>
                    <Input
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
                      value={values[field.key] || ''}
                      onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                      className="mt-1.5"
                    />
                  </div>
                ))}
              </div>

              {/* Test Result */}
              {testResult && (
                <div className={`mt-4 p-4 rounded-xl border ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.success ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span className={`text-sm font-semibold ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {testResult.success ? 'Koneksi Berhasil' : 'Koneksi Gagal'}
                    </span>
                  </div>
                  <p className={`text-xs ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>{testResult.message}</p>
                  {testResult.debug && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer">Debug info</summary>
                      <pre className="text-[10px] mt-1 bg-white/50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(testResult.debug, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Signature info for Digiflazz */}
              {activeProvider === 'digiflazz' && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700">
                  <div className="flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold">Format Signature Digiflazz (Resmi):</p>
                      <p>• Cek Saldo: <code className="bg-blue-100 px-1 rounded">MD5(username + apiKey + &quot;depo&quot;)</code></p>
                      <p>• Price List: <code className="bg-blue-100 px-1 rounded">MD5(username + apiKey + &quot;pricelist&quot;)</code></p>
                      <p>• Transaksi: <code className="bg-blue-100 px-1 rounded">MD5(username + apiKey + refId)</code></p>
                      <p className="mt-1 text-blue-600">Pastikan API Key yang digunakan adalah <strong>Production Key</strong> untuk transaksi nyata.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Provider Priority */}
            <div className="bg-card border border-border rounded-2xl shadow-card p-5">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                Prioritas Provider per Kategori
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Provider utama untuk setiap kategori. Jika provider utama gagal, akan mencoba provider berikutnya.</p>
              <div className="space-y-3">
                {priorityCategories.map(cat => (
                  <div key={cat.key} className="flex items-center gap-3">
                    <Label className="text-sm w-32 flex-shrink-0">{cat.label}</Label>
                    <select
                      value={values[cat.key] || 'digiflazz'}
                      onChange={e => setValues(v => ({ ...v, [cat.key]: e.target.value }))}
                      className="flex-1 text-sm border border-border rounded-lg px-3 py-1.5 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="digiflazz">Digiflazz (utama)</option>
                      {isConfigured(providers[1]) && <option value="vip_reseller">VIP Reseller</option>}
                    </select>
                  </div>
                ))}
              </div>
              <Button size="sm" className="mt-4 gap-1.5 gradient-button text-primary-foreground text-xs" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Save className="w-3.5 h-3.5" /> Simpan Prioritas
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
