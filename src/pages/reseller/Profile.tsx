import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ResellerLayout from '@/components/layout/ResellerLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Lock } from 'lucide-react';

export default function ResellerProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [changingPw, setChangingPw] = useState(false);

  const { data: reseller } = useQuery({
    queryKey: ['reseller-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('resellers').select('*').eq('user_id', user!.id).maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const changePwMutation = useMutation({
    mutationFn: async () => {
      if (pwForm.new !== pwForm.confirm) throw new Error('Password baru tidak cocok');
      if (pwForm.new.length < 6) throw new Error('Password minimal 6 karakter');
      const { error } = await supabase.auth.updateUser({ password: pwForm.new });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: 'Password berhasil diubah' });
      setPwForm({ current: '', new: '', confirm: '' });
      setChangingPw(false);
    },
    onError: (err: Error) => toast({ title: 'Gagal', description: err.message, variant: 'destructive' }),
  });

  return (
    <ResellerLayout>
      <div className="p-6 max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profil Saya</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Informasi akun reseller Anda</p>
        </div>

        {/* Profile Info */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-card space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Informasi Akun
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Nama', value: reseller?.nama || '-' },
              { label: 'Username', value: reseller?.username || '-' },
              { label: 'Email', value: user?.email || '-' },
              { label: 'WhatsApp', value: reseller?.whatsapp || '-' },
              { label: 'Kota', value: reseller?.kota || '-' },
            ].map(item => (
              <div key={item.label} className="flex justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="pt-1">
            <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-medium ${reseller?.is_active ? 'text-green-600 bg-green-50 border-green-200' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
              {reseller?.is_active ? 'Akun Aktif' : 'Akun Nonaktif'}
            </span>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-card">
          <button onClick={() => setChangingPw(!changingPw)}
            className="flex items-center justify-between w-full">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" /> Ubah Password
            </h3>
            <span className="text-xs text-primary">{changingPw ? 'Tutup' : 'Ubah'}</span>
          </button>

          {changingPw && (
            <div className="mt-4 space-y-3">
              <div>
                <Label>Password Baru</Label>
                <Input type="password" value={pwForm.new} onChange={e => setPwForm(f => ({ ...f, new: e.target.value }))}
                  placeholder="Min. 6 karakter" className="mt-1.5" />
              </div>
              <div>
                <Label>Konfirmasi Password Baru</Label>
                <Input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="Ulangi password baru" className="mt-1.5" />
              </div>
              <Button onClick={() => changePwMutation.mutate()} disabled={changePwMutation.isPending}
                className="w-full gradient-button text-primary-foreground">
                {changePwMutation.isPending ? 'Menyimpan...' : 'Simpan Password'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </ResellerLayout>
  );
}
