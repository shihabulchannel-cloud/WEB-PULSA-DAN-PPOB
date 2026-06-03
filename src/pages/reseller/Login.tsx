import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSetting } from '@/hooks/useSettings';
import { Zap, Eye, EyeOff } from 'lucide-react';

export default function ResellerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const siteName = useSetting('site_name', 'SHIELACOM CELL');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error: authError } = await signIn(email, password);
    setLoading(false);
    if (authError) {
      setError('Email atau password salah. Hubungi admin jika belum punya akun.');
    } else {
      navigate('/reseller/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Zap className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{siteName}</h1>
          <p className="text-muted-foreground text-sm mt-1">Portal Login Reseller</p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email@reseller.com" required className="mt-1.5" />
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative mt-1.5">
                <Input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">{error}</div>
            )}
            <Button type="submit" disabled={loading} className="w-full gradient-button text-primary-foreground font-semibold">
              {loading ? 'Masuk...' : 'Masuk ke Portal'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Belum punya akun reseller?{' '}
          <Link to="/reseller" className="text-primary hover:underline font-medium">Daftar di sini</Link>
        </p>
        <p className="text-center text-xs text-muted-foreground mt-2">
          <Link to="/" className="hover:underline">Kembali ke website</Link>
        </p>
      </div>
    </div>
  );
}
