import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Zap, Phone, Wifi, Wallet, FileText, Ticket, Gamepad2, Search, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetting } from '@/hooks/useSettings';

const navCategories = [
  { name: 'Top Up Game', slug: 'top-up-game', icon: Gamepad2 },
  { name: 'Pulsa', slug: 'pulsa', icon: Phone },
  { name: 'Paket Data', slug: 'paket-data', icon: Wifi },
  { name: 'E-Wallet', slug: 'e-wallet', icon: Wallet },
  { name: 'PPOB', slug: 'ppob', icon: FileText },
  { name: 'Voucher', slug: 'voucher-digital', icon: Ticket },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const siteName = useSetting('site_name', 'SHIELACOM CELL');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-card' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-brand">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-base text-gradient leading-tight">{siteName}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Top Up & PPOB</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navCategories.map(cat => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  to={`/category/${cat.slug}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-foreground/70 hover:text-primary hover:bg-primary/5 transition-all"
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 w-40 focus:w-52 transition-all"
                />
              </div>
            </form>
            <Link to="/admin/login">
              <Button variant="outline" size="sm" className="hidden md:flex items-center gap-1.5 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground">
                <LogIn className="w-4 h-4" />
                Admin
              </Button>
            </Link>
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-muted"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden glass border-t border-border animate-slide-up">
          <div className="container mx-auto px-4 py-4">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </form>
            <div className="grid grid-cols-2 gap-2">
              {navCategories.map(cat => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.slug}
                    to={`/category/${cat.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/70 hover:text-primary hover:bg-primary/5 transition-all border border-border"
                  >
                    <Icon className="w-4 h-4 text-primary" />
                    <span>{cat.name}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <Link to="/admin/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full gap-2 border-primary/30 text-primary">
                  <LogIn className="w-4 h-4" />
                  Login Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
