import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Settings as SettingsIcon, Globe, CreditCard, Mail, MessageCircle, Zap } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/hooks/use-toast';

const sections = [
  {
    id: 'general', label: 'Umum', icon: Globe,
    fields: [
      { key: 'site_name', label: 'Nama Website', placeholder: 'SHIELACOM CELL' },
      { key: 'site_slogan', label: 'Slogan', placeholder: 'Solusi Top Up Termurah...' },
      { key: 'contact_whatsapp', label: 'WhatsApp (tanpa +)', placeholder: '628123456789' },
      { key: 'contact_email', label: 'Email Kontak', placeholder: 'admin@shielacomcell.com' },
      { key: 'contact_instagram', label: 'Instagram', placeholder: '@shielacomcell' },
    ],
  },
  {
    id: 'digiflazz', label: 'Digiflazz', icon: SettingsIcon,
    fields: [
      { key: 'digiflazz_username', label: 'Username Digiflazz', placeholder: 'username' },
      { key: 'digiflazz_api_key', label: 'API Key Digiflazz', placeholder: 'xxxxxxxx', type: 'password' },
      { key: 'digiflazz_webhook_secret', label: 'Webhook Secret', placeholder: 'secret key', type: 'password' },
    ],
    info: {
      color: 'bg-blue-50 border-blue-200 text-blue-700',
      codeClass: 'bg-blue-100',
      title: 'Cara mendapatkan API Key Digiflazz:',
      lines: [
        'Login ke digiflazz.com → Pengaturan → API',
        'Copy Username dan Production API Key',
      ],
      webhookKey: 'digiflazz',
      webhookPath: 'functions/v1/digiflazz-webhook',
    },
  },
  {
    id: 'duitku', label: 'Duitku Payment', icon: CreditCard,
    fields: [
      { key: 'duitku_merchant_code', label: 'Merchant Code', placeholder: 'Dxxxxxx' },
      { key: 'duitku_api_key', label: 'API Key', placeholder: 'API Key dari Duitku', type: 'password' },
      { key: 'duitku_mode', label: 'Mode (sandbox/production)', placeholder: 'sandbox' },
    ],
    info: {
      color: 'bg-green-50 border-green-200 text-green-700',
      codeClass: 'bg-green-100',
      title: 'Cara mendapatkan API Duitku:',
      lines: [
        'Login ke my.duitku.com → Project → Pilih project Anda',
        'Copy Merchant Code dan API Key',
        'Set mode ke "sandbox" untuk testing, "production" untuk live',
      ],
      webhookKey: 'duitku',
      webhookPath: 'functions/v1/duitku-webhook',
    },
  },
  {
    id: 'vip_payment', label: 'VIP Payment', icon: Zap,
    fields: [
      { key: 'vip_merchant_id', label: 'Merchant ID', placeholder: 'Merchant ID VIP Payment' },
      { key: 'vip_secret_key', label: 'Secret Key', placeholder: 'Secret Key VIP Payment', type: 'password' },
      { key: 'vip_mode', label: 'Mode (sandbox/production)', placeholder: 'sandbox' },
    ],
    info: {
      color: 'bg-purple-50 border-purple-200 text-purple-700',
      codeClass: 'bg-purple-100',
      title: 'Cara mendapatkan API VIP Payment:',
      lines: [
        'Login ke vipayment.id → Dashboard → API Settings',
        'Copy Merchant ID dan Secret Key',
      ],
      webhookKey: 'vip',
      webhookPath: 'functions/v1/vip-payment-webhook',
    },
  },
  {
    id: 'smtp', label: 'Email SMTP', icon: Mail,
    fields: [
      { key: 'smtp_host', label: 'SMTP Host', placeholder: 'smtp.gmail.com' },
      { key: 'smtp_port', label: 'SMTP Port', placeholder: '587' },
      { key: 'smtp_user', label: 'SMTP User/Email', placeholder: 'noreply@domain.com' },
      { key: 'smtp_pass', label: 'SMTP Password', placeholder: '••••••••', type: 'password' },
      { key: 'smtp_from', label: 'From Email', placeholder: 'SHIELACOM CELL <noreply@domain.com>' },
    ],
  },
  {
    id: 'fonnte', label: 'WhatsApp (Fonnte)', icon: MessageCircle,
    fields: [
      { key: 'fonnte_api_key', label: 'Fonnte API Key', placeholder: 'API Key dari Fonnte', type: 'password' },
    ],
    info: {
      color: 'bg-teal-50 border-teal-200 text-teal-700',
      codeClass: 'bg-teal-100',
      title: 'Cara mendapatkan Fonnte API Key:',
      lines: [
        'Login ke app.fonnte.com',
        'Tambahkan device WhatsApp → Copy Token/API Key',
      ],
      webhookKey: null,
      webhookPath: null,
    },
  },
];

export default function AdminSettings() {
  const { data: settings = {}, refetch } = useSettings();
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState('general');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setValues(settings);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(values).map(([key, value]) => ({
        key, value, updated_at: new Date().toISOString()
      }));
      for (const update of updates) {
        await supabase.from('settings').upsert(update, { onConflict: 'key' });
      }
      const sensitiveKeys = [
        'digiflazz_api_key', 'digiflazz_webhook_secret',
        'duitku_api_key', 'vip_secret_key',
        'smtp_pass', 'fonnte_api_key',
      ];
      const secrets: Record<string, string> = {};
      sensitiveKeys.forEach(k => { if (values[k]) secrets[k] = values[k]; });
      if (Object.keys(secrets).length > 0) {
        await supabase.functions.invoke('save-settings-secrets', { body: secrets }).catch(() => {});
      }
    },
    onSuccess: () => {
      toast({ title: 'Pengaturan disimpan' });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      refetch();
    },
    onError: () => toast({ title: 'Gagal menyimpan', variant: 'destructive' }),
  });

  const section = sections.find(s => s.id === activeSection);

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pengaturan Website</h1>
            <p className="text-sm text-muted-foreground">Konfigurasi API, kontak, dan layanan</p>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-2 gradient-button text-primary-foreground">
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Semua'}
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-5">
          {/* Sidebar */}
          <div className="w-full lg:w-48 flex-shrink-0">
            <div className="bg-card rounded-xl border border-border p-2 space-y-1 lg:sticky lg:top-4">
              {sections.map(s => {
                const Icon = s.icon;
                return (
                  <button key={s.id} onClick={() => setActiveSection(s.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${activeSection === s.id ? 'gradient-button text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                    <Icon className="w-4 h-4" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <div className="flex-1">
            {section && (
              <div className="bg-card rounded-xl border border-border shadow-card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <section.icon className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">{section.label}</h2>
                </div>
                <div className="space-y-4">
                  {section.fields.map(field => (
                    <div key={field.key}>
                      <Label className="text-sm">{field.label}</Label>
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

                {'info' in section && section.info && (
                  <div className={`mt-5 p-4 border rounded-xl text-sm ${section.info.color}`}>
                    <p className="font-medium mb-2">{section.info.title}</p>
                    {section.info.lines.map((line, i) => (
                      <p key={i}>{i + 1}. {line}</p>
                    ))}
                    {section.info.webhookPath && (
                      <p className="mt-1">
                        {section.info.lines.length + 1}. Set Callback/Webhook URL ke:{' '}
                        <code className={`text-xs px-1.5 py-0.5 rounded ${section.info.codeClass}`}>
                          {`[supabase-url]/${section.info.webhookPath}`}
                        </code>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
