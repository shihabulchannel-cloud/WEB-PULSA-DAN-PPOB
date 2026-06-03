import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ResellerLayout from '@/components/layout/ResellerLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency, formatDate } from '@/lib/utils-app';
import { Upload, X, FileImage, Clock, CheckCircle, XCircle, Building2 } from 'lucide-react';

const statusIcon = { pending: Clock, approved: CheckCircle, rejected: XCircle };
const statusColor = { pending: 'text-yellow-500 bg-yellow-50 border-yellow-200', approved: 'text-green-600 bg-green-50 border-green-200', rejected: 'text-red-600 bg-red-50 border-red-200' };
const statusLabel = { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' };

export default function ResellerDeposit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: settings } = useSettings();
  const [form, setForm] = useState({ amount: '', bank_name: '', sender_name: '' });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: reseller } = useQuery({
    queryKey: ['reseller-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('resellers').select('id').eq('user_id', user!.id).maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: deposits = [] } = useQuery({
    queryKey: ['reseller-deposits', reseller?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('reseller_deposits')
        .select('*')
        .eq('reseller_id', reseller!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!reseller?.id,
  });

  const handleFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!reseller?.id) throw new Error('Profil reseller tidak ditemukan');
      if (!form.amount || !form.sender_name || !file)
        throw new Error('Nominal, nama pengirim, dan bukti transfer wajib diisi');

      setUploading(true);
      const ext = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${reseller.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('reseller-deposits')
        .upload(fileName, file, { contentType: file.type });
      setUploading(false);
      if (uploadError) throw new Error('Upload gagal: ' + uploadError.message);

      const { data: urlData } = supabase.storage.from('reseller-deposits').getPublicUrl(fileName);
      const { error: insertError } = await supabase.from('reseller_deposits').insert({
        reseller_id: reseller.id,
        amount: parseFloat(form.amount),
        bank_name: form.bank_name || null,
        sender_name: form.sender_name,
        proof_url: urlData.publicUrl,
        status: 'pending',
      });
      if (insertError) throw new Error(insertError.message);
    },
    onSuccess: () => {
      toast({ title: 'Deposit berhasil dikirim', description: 'Admin akan memverifikasi dalam 1x24 jam' });
      setForm({ amount: '', bank_name: '', sender_name: '' });
      setFile(null); setPreview(null);
      qc.invalidateQueries({ queryKey: ['reseller-deposits'] });
    },
    onError: (err: Error) => toast({ title: 'Gagal', description: err.message, variant: 'destructive' }),
  });

  const bankName = settings?.deposit_bank_name || '';
  const accountNo = settings?.deposit_account_number || '';
  const accountName = settings?.deposit_account_name || '';

  return (
    <ResellerLayout>
      <div className="p-6 max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Top Up Saldo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kirim bukti transfer untuk penambahan saldo</p>
        </div>

        {/* Bank Info */}
        {(bankName || accountNo) && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-primary" /> Rekening Tujuan Transfer
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              {bankName && <div><p className="text-xs text-muted-foreground">Bank</p><p className="font-bold text-foreground">{bankName}</p></div>}
              {accountNo && <div><p className="text-xs text-muted-foreground">Nomor Rekening</p><p className="font-bold text-foreground font-mono">{accountNo}</p></div>}
              {accountName && <div><p className="text-xs text-muted-foreground">Atas Nama</p><p className="font-bold text-foreground">{accountName}</p></div>}
            </div>
            {settings?.deposit_qris_url && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">QRIS</p>
                <img src={settings.deposit_qris_url} alt="QRIS" className="w-40 h-40 object-contain rounded-lg border border-border" />
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-card space-y-4">
          <h3 className="font-semibold text-foreground">Form Pengajuan Deposit</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Nominal Deposit (Rp) <span className="text-destructive">*</span></Label>
              <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="100000" className="mt-1.5" min="10000" />
              {form.amount && <p className="text-xs text-primary mt-1">{formatCurrency(parseFloat(form.amount) || 0)}</p>}
            </div>
            <div>
              <Label>Nama Pengirim <span className="text-destructive">*</span></Label>
              <Input value={form.sender_name} onChange={e => setForm(f => ({ ...f, sender_name: e.target.value }))}
                placeholder="Nama sesuai rekening" className="mt-1.5" />
            </div>
            <div>
              <Label>Bank Pengirim</Label>
              <Input value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))}
                placeholder="BCA, BRI, Mandiri, dll" className="mt-1.5" />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <Label>Bukti Transfer <span className="text-destructive">*</span></Label>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {!file ? (
              <button onClick={() => fileRef.current?.click()}
                className="mt-1.5 w-full border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/40 hover:bg-primary/5 transition-all">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Klik atau drag file bukti transfer</p>
                <p className="text-xs text-muted-foreground/60 mt-1">JPG, JPEG, PNG, PDF</p>
              </button>
            ) : (
              <div className="mt-1.5 relative">
                {preview && file.type.startsWith('image/') ? (
                  <img src={preview} alt="bukti" className="w-full max-h-64 object-contain rounded-xl border border-border" />
                ) : (
                  <div className="w-full rounded-xl border border-border p-4 flex items-center gap-3">
                    <FileImage className="w-8 h-8 text-primary" />
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                  </div>
                )}
                <button onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-destructive/90 text-white rounded-full flex items-center justify-center hover:bg-destructive">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <Button onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || uploading || !file || !form.amount || !form.sender_name}
            className="w-full gradient-button text-primary-foreground font-semibold">
            {uploading ? 'Mengupload...' : submitMutation.isPending ? 'Mengirim...' : 'Kirim Pengajuan Deposit'}
          </Button>
        </div>

        {/* History */}
        {deposits.length > 0 && (
          <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
            <p className="font-semibold text-foreground p-5 border-b border-border">Riwayat Deposit</p>
            <div className="divide-y divide-border">
              {deposits.map((d) => {
                const status = d.status as keyof typeof statusColor;
                const Icon = statusIcon[status] || Clock;
                return (
                  <div key={d.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${statusColor[status]}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(d.amount)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(d.created_at)} · {d.sender_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {d.proof_url && (
                        <a href={d.proof_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline">Bukti</a>
                      )}
                      <span className={`px-2 py-0.5 rounded-full border text-xs ${statusColor[status]}`}>{statusLabel[status]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ResellerLayout>
  );
}
