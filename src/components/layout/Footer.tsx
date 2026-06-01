import { Link } from 'react-router-dom';
import { Zap, Phone, Mail, Instagram, Facebook, Twitter, MessageCircle, Shield, Clock, Headphones } from 'lucide-react';
import { useSetting } from '@/hooks/useSettings';

export default function Footer() {
  const siteName = useSetting('site_name', 'SHIELACOM CELL');
  const slogan = useSetting('site_slogan', 'Solusi Top Up Game, Pulsa dan PPOB Termurah dan Terpercaya');
  const whatsapp = useSetting('contact_whatsapp', '');
  const email = useSetting('contact_email', '');
  const instagram = useSetting('contact_instagram', '');

  return (
    <footer className="gradient-dark text-primary-foreground">
      {/* Trust Badges */}
      <div className="border-b border-primary/20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Transaksi Aman', desc: 'Sistem keamanan berlapis untuk setiap transaksi' },
              { icon: Clock, title: 'Proses Instan 24/7', desc: 'Layanan otomatis tanpa henti, kapan saja' },
              { icon: Headphones, title: 'Support Responsif', desc: 'Tim siap membantu via WhatsApp & Email' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-accent-light" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-primary-foreground/60 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center">
                <Zap className="w-5 h-5 text-accent-light" />
              </div>
              <div>
                <p className="font-bold text-base text-accent-light">{siteName}</p>
                <p className="text-[10px] text-primary-foreground/50">Top Up & PPOB</p>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/60 mb-5 leading-relaxed">{slogan}</p>
            <div className="flex gap-3">
              {instagram && (
                <a href={`https://instagram.com/${instagram.replace('@', '')}`} target="_blank" rel="noreferrer"
                  className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Produk */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-primary-glow">Produk</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/60">
              {['Top Up Game', 'Pulsa', 'Paket Data', 'E-Wallet', 'PPOB', 'Voucher Digital'].map(item => (
                <li key={item}>
                  <Link to={`/category/${item.toLowerCase().replace(/ /g, '-')}`}
                    className="hover:text-primary-glow transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informasi */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-primary-glow">Informasi</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/60">
              {[
                { label: 'Tentang Kami', href: '/about' },
                { label: 'Cara Pembelian', href: '/how-to-buy' },
                { label: 'FAQ', href: '/faq' },
                { label: 'Blog', href: '/blog' },
                { label: 'Kebijakan Privasi', href: '/privacy' },
                { label: 'Syarat & Ketentuan', href: '/terms' },
              ].map(item => (
                <li key={item.label}>
                  <Link to={item.href} className="hover:text-primary-glow transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-primary-glow">Hubungi Kami</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/60">
              {whatsapp && (
                <li>
                  <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 hover:text-primary-glow transition-colors">
                    <MessageCircle className="w-4 h-4 text-green-400" />
                    <span>+{whatsapp}</span>
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-primary-glow transition-colors">
                    <Mail className="w-4 h-4 text-primary-glow" />
                    <span>{email}</span>
                  </a>
                </li>
              )}
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-primary-glow mt-0.5 flex-shrink-0" />
                <span>Layanan 24 Jam, 7 Hari Seminggu</span>
              </li>
            </ul>

            {/* Payment Methods */}
            <div className="mt-5">
              <p className="text-xs text-primary-foreground/40 mb-2 font-medium">Metode Pembayaran</p>
              <div className="flex flex-wrap gap-1.5">
                {['QRIS', 'BCA', 'BNI', 'BRI', 'DANA', 'OVO', 'GoPay'].map(pm => (
                  <span key={pm} className="text-xs px-2 py-1 rounded bg-white/10 border border-white/20 text-primary-foreground/70">
                    {pm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-primary/15">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-primary-foreground/40">
            <p>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
            <p>Powered by <span className="text-accent-light">Digiflazz</span> & <span className="text-accent-light">Duitku</span></p>
          </div>
        </div>
      </div>
    </footer>
  );
}
