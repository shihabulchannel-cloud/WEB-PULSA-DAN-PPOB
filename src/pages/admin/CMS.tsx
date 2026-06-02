import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Eye, EyeOff, FileText, Info } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/hooks/use-toast';

const cmsPages = [
  { key: 'cms_about', label: 'Tentang Kami', icon: FileText, desc: 'Ditampilkan di halaman /about' },
  { key: 'cms_how_to_buy', label: 'Cara Bertransaksi', icon: FileText, desc: 'Ditampilkan di halaman /how-to-buy' },
  { key: 'cms_privacy', label: 'Kebijakan Privasi', icon: FileText, desc: 'Ditampilkan di halaman /privacy' },
  { key: 'cms_terms', label: 'Syarat & Ketentuan', icon: FileText, desc: 'Ditampilkan di halaman /terms' },
];

export default function AdminCMS() {
  const [activeTab, setActiveTab] = useState('cms_about');
  const [values, setValues] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState(false);
  const { data: settings = {}, refetch } = useSettings();
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => {
    if (settings) {
      const init: Record<string, string> = {};
      cmsPages.forEach(p => { init[p.key] = settings[p.key] || ''; });
      setValues(init);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await supabase.from('settings').upsert({ key: activeTab, value: values[activeTab] || '', updated_at: new Date().toISOString() }, { onConflict: 'key' });
    },
    onSuccess: () => {
      toast({ title: 'Konten disimpan' });
      qc.invalidateQueries({ queryKey: ['settings'] });
      refetch();
    },
    onError: () => toast({ title: 'Gagal menyimpan', variant: 'destructive' }),
  });

  const activePage = cmsPages.find(p => p.key === activeTab)!;

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Konten CMS</h1>
          <p className="text-sm text-muted-foreground">Edit konten halaman statis website tanpa coding</p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 text-xs text-blue-700">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>Konten mendukung HTML dasar seperti <code className="bg-blue-100 px-1 rounded">{'<h2>'}</code>, <code className="bg-blue-100 px-1 rounded">{'<p>'}</code>, <code className="bg-blue-100 px-1 rounded">{'<ul>'}</code>, <code className="bg-blue-100 px-1 rounded">{'<li>'}</code>, <code className="bg-blue-100 px-1 rounded">{'<strong>'}</code>.</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-5">
          {/* Sidebar Tabs */}
          <div className="w-full lg:w-52 flex-shrink-0">
            <div className="bg-card rounded-xl border border-border p-2 space-y-1">
              {cmsPages.map(p => {
                const Icon = p.icon;
                return (
                  <button key={p.key} onClick={() => { setActiveTab(p.key); setPreview(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${activeTab === p.key ? 'gradient-button text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                    <Icon className="w-4 h-4" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1">
            <div className="bg-card rounded-xl border border-border shadow-card">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-foreground text-sm">{activePage.label}</h2>
                  <p className="text-xs text-muted-foreground">{activePage.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => setPreview(!preview)}>
                    {preview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {preview ? 'Edit' : 'Preview'}
                  </Button>
                  <Button size="sm" className="gap-1.5 text-xs gradient-button text-primary-foreground h-8" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                    <Save className="w-3.5 h-3.5" />
                    {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </div>
              <div className="p-5">
                {preview ? (
                  <div className="prose max-w-none min-h-[400px] border border-border rounded-lg p-5 bg-muted/30"
                    dangerouslySetInnerHTML={{ __html: values[activeTab] || '<p class="text-muted-foreground">Belum ada konten</p>' }} />
                ) : (
                  <Textarea
                    value={values[activeTab] || ''}
                    onChange={e => setValues(v => ({ ...v, [activeTab]: e.target.value }))}
                    placeholder="Tulis konten HTML di sini..."
                    className="min-h-[420px] font-mono text-sm resize-y"
                  />
                )}
              </div>
              <div className="px-5 pb-4 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{(values[activeTab] || '').length} karakter</span>
                <Button size="sm" className="gap-1.5 text-xs gradient-button text-primary-foreground h-8" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  <Save className="w-3.5 h-3.5" />
                  {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Konten'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
