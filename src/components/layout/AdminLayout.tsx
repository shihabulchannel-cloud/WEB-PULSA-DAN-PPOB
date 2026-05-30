import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Settings, BarChart3,
  FileText, Bell, MessageSquare, ChevronLeft, ChevronRight,
  Zap, LogOut, Tag, Image, Users, HelpCircle, Star, Code2
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

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} bg-sidebar border-r border-sidebar-border`}>
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-sidebar-border ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sidebar-primary font-bold text-sm leading-tight">{siteName}</p>
              <p className="text-sidebar-foreground/50 text-[10px] leading-tight">Admin Panel</p>
            </div>
          )}
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
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 mx-2 mb-0.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          {!collapsed && user && (
            <div className="px-2 py-1.5">
              <p className="text-xs text-sidebar-foreground/50">Login sebagai</p>
              <p className="text-sm text-sidebar-foreground font-medium truncate">{user.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className={`w-full text-sidebar-foreground hover:bg-destructive/15 hover:text-destructive ${collapsed ? 'px-2 justify-center' : 'justify-start gap-2'}`}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && 'Keluar'}
          </Button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-60'}`}>
        {children}
      </div>
    </div>
  );
}
