import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: 'Login gagal', description: 'Email atau password salah', variant: 'destructive' });
        return;
      }
      toast({ title: 'Login berhasil', description: 'Selamat datang di panel admin' });
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-dark flex items-center justify-center p-4">
      {/* Decorative */}
      <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-secondary/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow animate-float">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">SHIELACOM CELL</h1>
          <p className="text-primary-foreground/50 text-sm mt-1">Admin Panel</p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-brand">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg text-foreground">Login Admin</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@shielacomcell.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-button text-primary-foreground font-semibold py-5">
              {loading ? 'Masuk...' : 'Masuk ke Panel Admin'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
