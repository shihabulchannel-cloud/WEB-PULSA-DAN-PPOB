import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Settings, BarChart3,
  FileText, Bell, MessageSquare, ChevronLeft, ChevronRight,
  Zap, LogOut, Tag, Image, HelpCircle, Star, Code2, Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSetting } from '@/hooks/useSettings';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Transaksi', href: '/admin/transactions', icon: ShoppingCart },
  { label: 'Produk', href: '/admin/products', icon: Package },
  { label: 'Kategori', href: '/admin/categories', icon: Tag },
  { label: 'Markup Harga', href: '/admin/markup', icon: BarChart3 },
  { label: 'Pembayaran', href: '/admin/payment-methods', icon: Code2 },
  { label: 'Banner', href: '/admin/banners', icon: Image },
  { label: 'Testimoni', href: '/admin/testimonials', icon: Star },
  { label: 'Blog', href: '/admin/blog', icon: FileText },
  { label: 'FAQ', href: '/admin/faq', icon: HelpCircle },
  { label: 'Laporan', href: '/admin/reports', icon: BarChart3 },
  { label: 'Notifikasi', href: '/admin/notifications', icon: Bell },
  { label: 'Log API', href: '/admin/api-logs', icon: MessageSquare },
  { label: 'Pengaturan', href: '/admin/settings', icon: Settings },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const siteName = useSetting('site_name', 'SHIELACOM CELL');

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(href);
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex min-h-screen bg-muted/40">

      {/* Mobile Overlay — klik untuk tutup sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={closeMobile}
          aria-label="Tutup menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full z-40 flex flex-col
          bg-sidebar border-r border-sidebar-border
          transition-transform duration-300 ease-in-out
          w-60
          lg:translate-x-0 lg:transition-all lg:duration-300
          ${collapsed ? 'lg:w-16' : 'lg:w-60'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo + Close Button (mobile) */}
        <div className={`flex items-center h-16 px-4 border-b border-sidebar-border ${collapsed ? 'lg:justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div className={`flex-1 min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
            <p className="text-sidebar-primary font-bold text-sm leading-tight truncate">{siteName}</p>
            <p className="text-sidebar-foreground/50 text-[10px] leading-tight">Admin Panel</p>
          </div>
          {/* Close button - hanya di mobile */}
          <button
            onClick={closeMobile}
            className="lg:hidden ml-auto p-1.5 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={closeMobile}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 mx-2 mb-0.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                } ${collapsed ? 'lg:justify-center' : ''}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <div className={collapsed ? 'lg:hidden' : ''}>
            {user && (
              <div className="px-2 py-1.5">
                <p className="text-xs text-sidebar-foreground/50">Login sebagai</p>
                <p className="text-sm text-sidebar-foreground font-medium truncate">{user.email}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className={`w-full text-sidebar-foreground hover:bg-destructive/15 hover:text-destructive ${collapsed ? 'lg:px-2 lg:justify-center justify-start gap-2' : 'justify-start gap-2'}`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className={collapsed ? 'lg:hidden' : ''}>Keluar</span>
          </Button>
          {/* Collapse toggle — hanya desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center p-2 rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-60'}`}>
        {/* Mobile Top Bar */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 h-14 px-4 bg-card border-b border-border shadow-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm text-foreground">{siteName}</span>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
