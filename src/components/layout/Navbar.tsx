import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Zap, Search, MessageCircle, ChevronDown, Gamepad2, Phone, Wifi, Wallet, FileText, Ticket, Tv, Droplets, Bolt, ShieldPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetting } from '@/hooks/useSettings';

const navLinks = [
  { label: 'Beranda', href: '/' },
  { label: 'Produk', href: '#products', hasDropdown: true },
  { label: 'Cek Transaksi', href: '/transaction' },
  { label: 'Promo', href: '/promo' },
  { label: 'Reseller', href: '/reseller' },
  { label: 'Bantuan', href: '/faq' },
];

const categories = [
  { name: 'Top Up Game', slug: 'top-up-game', icon: Gamepad2, color: 'text-orange-500' },
  { name: 'Pulsa', slug: 'pulsa', icon: Phone, color: 'text-green-500' },
  { name: 'Paket Data', slug: 'paket-data', icon: Wifi, color: 'text-blue-500' },
  { name: 'E-Wallet', slug: 'e-wallet', icon: Wallet, color: 'text-purple-500' },
  { name: 'PPOB', slug: 'ppob', icon: FileText, color: 'text-yellow-600' },
  { name: 'Voucher Digital', slug: 'voucher-digital', icon: Ticket, color: 'text-pink-500' },
  { name: 'Token PLN', slug: 'ppob', icon: Bolt, color: 'text-yellow-500' },
  { name: 'BPJS', slug: 'ppob', icon: ShieldPlus, color: 'text-teal-500' },
  { name: 'PDAM', slug: 'ppob', icon: Droplets, color: 'text-cyan-500' },
  { name: 'TV Kabel', slug: 'voucher-digital', icon: Tv, color: 'text-indigo-500' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const siteName = useSetting('site_name', 'SHIELACOM CELL');
  const waNumber = useSetting('contact_whatsapp', '6281234567890');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setMobileOpen(false);
    }
  };

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href) && href !== '#products';
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-card border-b border-border' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl gradient-button flex items-center justify-center shadow-brand">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="font-extrabold text-base text-gradient leading-tight tracking-tight">{siteName}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Top Up & PPOB Terpercaya</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navLinks.map(link => (
                link.hasDropdown ? (
                  <div key="products" className="relative">
                    <button
                      onMouseEnter={() => setDropdownOpen(true)}
                      onMouseLeave={() => setDropdownOpen(false)}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-foreground/75 hover:text-primary hover:bg-primary/5 transition-all"
                    >
                      Produk <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {dropdownOpen && (
                      <div
                        onMouseEnter={() => setDropdownOpen(true)}
                        onMouseLeave={() => setDropdownOpen(false)}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-64 bg-white rounded-2xl shadow-brand-lg border border-border p-2 grid grid-cols-2 gap-1 animate-fade-in"
                      >
                        {categories.map(cat => {
                          const Icon = cat.icon;
                          return (
                            <Link key={cat.slug + cat.name} to={`/category/${cat.slug}`}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-foreground/80 hover:bg-primary/5 hover:text-primary transition-all"
                            >
                              <Icon className={`w-4 h-4 ${cat.color}`} />
                              <span>{cat.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link key={link.href} to={link.href}
                    className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive(link.href) ? 'text-primary' : 'text-foreground/75 hover:text-primary hover:bg-primary/5'}`}
                  >
                    {link.label}
                    {isActive(link.href) && (
                      <span className="absolute bottom-1 left-3 right-3 h-0.5 bg-primary rounded-full" />
                    )}
                  </Link>
                )
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Search — desktop */}
              <form onSubmit={handleSearch} className="hidden md:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Cari produk..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-2 text-sm bg-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 w-40 focus:w-52 transition-all"
                  />
                </div>
              </form>

              {/* WhatsApp Button */}
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-brand"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>

              {/* Mobile Hamburger */}
              <button
                className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-border shadow-brand-lg animate-slide-up">
            <div className="container mx-auto px-4 py-4 space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Cari produk..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </form>

              {/* Nav Links */}
              <div className="space-y-1">
                {navLinks.filter(l => !l.hasDropdown).map(link => (
                  <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive(link.href) ? 'bg-primary/10 text-primary' : 'text-foreground/80 hover:bg-muted'}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Categories Grid */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Kategori Produk</p>
                <div className="grid grid-cols-2 gap-2">
                  {categories.slice(0, 8).map(cat => {
                    const Icon = cat.icon;
                    return (
                      <Link key={cat.slug + cat.name} to={`/category/${cat.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-foreground/80 hover:text-primary border border-border hover:border-primary/30 bg-muted/50 transition-all"
                      >
                        <Icon className={`w-4 h-4 ${cat.color} flex-shrink-0`} />
                        <span className="truncate">{cat.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* WA Button */}
              <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                Hubungi via WhatsApp
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Spacer — only when not at top (transparent to white transition) */}
      <div className="h-16" />
    </>
  );
}
