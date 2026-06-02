import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Settings, BarChart3,
  FileText, Bell, ChevronLeft, ChevronRight,
  Zap, LogOut, Tag, Image, HelpCircle, Star, Menu, X,
  Wifi, FileCode, Activity, Database, PenSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSetting } from '@/hooks/useSettings';

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = { group: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    group: 'UTAMA',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Transaksi', href: '/admin/transactions', icon: ShoppingCart },
      { label: 'Produk', href: '/admin/products', icon: Package },
      { label: 'Kategori', href: '/admin/categories', icon: Tag },
      { label: 'Markup Harga', href: '/admin/markup', icon: BarChart3 },
    ],
  },
  {
    group: 'LAYANAN',
    items: [
      { label: 'Digiflazz', href: '/admin/digiflazz', icon: Wifi },
      { label: 'Pembayaran', href: '/admin/payment-methods', icon: Database },
    ],
  },
  {
    group: 'WEBSITE',
    items: [
      { label: 'Banner & Slider', href: '/admin/banners', icon: Image },
      { label: 'Testimoni', href: '/admin/testimonials', icon: Star },
      { label: 'Blog / Artikel', href: '/admin/blog', icon: FileText },
      { label: 'FAQ', href: '/admin/faq', icon: HelpCircle },
      { label: 'Konten CMS', href: '/admin/cms', icon: PenSquare },
    ],
  },
  {
    group: 'LAPORAN & LOG',
    items: [
      { label: 'Laporan', href: '/admin/reports', icon: BarChart3 },
      { label: 'Log Sistem', href: '/admin/logs', icon: Activity },
      { label: 'Notifikasi', href: '/admin/notifications', icon: Bell },
    ],
  },
  {
    group: 'KONFIGURASI',
    items: [
      { label: 'Pengaturan', href: '/admin/settings', icon: Settings },
    ],
  },
];

const allNavItems = navGroups.flatMap(g => g.items);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const siteName = useSetting('site_name', 'SHIELACOM CELL');

  const handleSignOut = async () => { await signOut(); navigate('/admin/login'); };
  const isActive = (href: string) => href === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(href);
  const closeMobile = () => setMobileOpen(false);

  // Find current page name
  const currentItem = allNavItems.find(item => isActive(item.href));

  return (
    <div className="flex min-h-screen bg-muted/40">

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden" onClick={closeMobile} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full z-40 flex flex-col
        bg-sidebar border-r border-sidebar-border
        transition-all duration-300 ease-in-out
        w-60 lg:${collapsed ? 'w-16' : 'w-60'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-sidebar-border flex-shrink-0 ${collapsed ? 'lg:justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className={`flex-1 min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
            <p className="text-sidebar-primary font-bold text-sm leading-tight truncate">{siteName}</p>
            <p className="text-sidebar-foreground/50 text-[10px] leading-tight">Admin Panel</p>
          </div>
          <button onClick={closeMobile} className="lg:hidden ml-auto p-1.5 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.group} className="mb-1">
              {!collapsed && (
                <p className="text-[10px] font-semibold text-sidebar-foreground/30 uppercase tracking-wider px-5 py-2">{group.group}</p>
              )}
              {group.items.map(item => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.href} to={item.href} onClick={closeMobile} title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 mx-2 mb-0.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      active ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    } ${collapsed ? 'lg:justify-center' : ''}`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-sidebar-border p-3 space-y-2 flex-shrink-0">
          <div className={collapsed ? 'lg:hidden' : ''}>
            {user && (
              <div className="px-2 py-1.5 mb-1">
                <p className="text-[10px] text-sidebar-foreground/40">Login sebagai</p>
                <p className="text-xs text-sidebar-foreground font-medium truncate">{user.email}</p>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}
            className={`w-full text-sidebar-foreground/70 hover:bg-destructive/15 hover:text-destructive ${collapsed ? 'lg:px-2 lg:justify-center justify-start gap-2' : 'justify-start gap-2'}`}>
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className={collapsed ? 'lg:hidden' : ''}>Keluar</span>
          </Button>
          <button onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center p-2 rounded-lg text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-60'}`}>
        {/* Mobile Top Bar */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 h-14 px-4 bg-card border-b border-border shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm text-foreground">{currentItem?.label || siteName}</span>
          </div>
          <Link to="/" className="ml-auto p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors" title="Lihat website">
            <FileCode className="w-4 h-4" />
          </Link>
        </header>

        {/* Desktop top breadcrumb */}
        <div className="hidden lg:flex items-center justify-between h-12 px-6 bg-card border-b border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Admin</span>
            {currentItem && <><span>/</span><span className="text-foreground font-medium">{currentItem.label}</span></>}
          </div>
          <Link to="/" target="_blank" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
            <FileCode className="w-3.5 h-3.5" />
            Lihat Website
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}
