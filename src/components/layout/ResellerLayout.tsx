import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CreditCard, History, User, LogOut, Menu, X, Wallet, Zap, Package, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSetting } from '@/hooks/useSettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils-app';

const navItems = [
  { label: 'Dashboard', href: '/reseller/dashboard', icon: LayoutDashboard },
  { label: 'Produk', href: '/reseller/products', icon: Package },
  { label: 'Top Up Saldo', href: '/reseller/deposit', icon: CreditCard },
  { label: 'Mutasi Saldo', href: '/reseller/balance', icon: BarChart2 },
  { label: 'Riwayat Transaksi', href: '/reseller/transactions', icon: History },
  { label: 'Profil', href: '/reseller/profile', icon: User },
];

export default function ResellerLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const siteName = useSetting('site_name', 'SHIELACOM CELL');

  const { data: resellerData } = useQuery({
    queryKey: ['reseller-me', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data: reseller } = await supabase
        .from('resellers')
        .select('*, reseller_balances(balance)')
        .eq('user_id', user.id)
        .maybeSingle();
      return reseller;
    },
    enabled: !!user?.id,
  });

  const balance = (resellerData?.reseller_balances as { balance: number } | null)?.balance || 0;

  const handleSignOut = async () => { await signOut(); navigate('/reseller/login'); };
  const isActive = (href: string) => location.pathname === href;

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 h-16 px-5 border-b border-sidebar-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sidebar-primary font-bold text-sm leading-tight">{siteName}</p>
          <p className="text-sidebar-foreground/50 text-[10px]">Portal Reseller</p>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden ml-auto p-1.5 rounded-lg text-sidebar-foreground/60">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Balance Card */}
      <div className="mx-3 mt-4 mb-2 rounded-xl bg-primary/10 border border-primary/20 p-3">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5" /> Saldo Anda
        </p>
        <p className="text-lg font-bold text-primary mt-0.5">{formatCurrency(balance)}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{resellerData?.nama || user?.user_metadata?.nama || 'Reseller'}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link key={item.href} to={item.href} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 mx-2 mb-0.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border p-3">
        <Button variant="ghost" size="sm" onClick={handleSignOut}
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-destructive/15 hover:text-destructive">
          <LogOut className="w-4 h-4" /> Keluar
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-muted/40">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Desktop Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full z-40 w-60 flex flex-col
        bg-sidebar border-r border-sidebar-border
        transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 h-14 px-4 bg-card border-b border-border">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-muted-foreground hover:bg-muted">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm text-foreground">Portal Reseller</span>
          <div className="ml-auto flex items-center gap-1 bg-primary/10 rounded-full px-3 py-1">
            <Wallet className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">{formatCurrency(balance)}</span>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
