import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Zap, Gamepad2, Phone, Wallet, FileText, ArrowRight, MessageCircle } from 'lucide-react';
import { useSetting } from '@/hooks/useSettings';

interface Banner {
  id: string; title: string; subtitle: string;
  image_url: string; link_url: string; button_text: string;
}

const defaultBanners = [
  {
    id: 'default-1',
    title: 'Top Up Game Murah & Instan',
    subtitle: 'Mobile Legends, Free Fire, PUBG, Genshin Impact dan 100+ game lainnya. Proses otomatis dalam hitungan detik.',
    highlight: 'Top Up Game',
    icon: Gamepad2,
    iconBg: 'bg-orange-400/20',
    iconColor: 'text-orange-300',
    link_url: '/category/top-up-game',
    button_text: 'Top Up Sekarang',
  },
  {
    id: 'default-2',
    title: 'Pulsa & Paket Data Murah',
    subtitle: 'Semua operator tersedia — Telkomsel, XL, Indosat, AXIS, Smartfren. Harga bersaing, proses instan.',
    highlight: 'Pulsa & Data',
    icon: Phone,
    iconBg: 'bg-blue-400/20',
    iconColor: 'text-blue-300',
    link_url: '/category/pulsa',
    button_text: 'Beli Pulsa',
  },
  {
    id: 'default-3',
    title: 'Top Up E-Wallet Langsung',
    subtitle: 'DANA, OVO, GoPay, ShopeePay, LinkAja. Proses cepat, aman, dan terpercaya 24 jam.',
    highlight: 'E-Wallet',
    icon: Wallet,
    iconBg: 'bg-purple-400/20',
    iconColor: 'text-purple-300',
    link_url: '/category/e-wallet',
    button_text: 'Top Up E-Wallet',
  },
  {
    id: 'default-4',
    title: 'PPOB Lengkap & Terjangkau',
    subtitle: 'Token PLN, BPJS Kesehatan, PDAM, TV Kabel. Bayar tagihan mudah tanpa ribet kapan saja.',
    highlight: 'PPOB',
    icon: FileText,
    iconBg: 'bg-yellow-400/20',
    iconColor: 'text-yellow-300',
    link_url: '/category/ppob',
    button_text: 'Bayar Tagihan',
  },
];

const floatingCards = [
  { label: 'Mobile Legends', value: '86 Diamond', color: 'from-blue-500 to-indigo-600', delay: '' },
  { label: 'DANA', value: 'Rp 100.000', color: 'from-blue-400 to-sky-500', delay: 'animation-delay-500' },
  { label: 'Telkomsel', value: '1.5 GB / 7 Hari', color: 'from-red-500 to-red-600', delay: 'animation-delay-1000' },
  { label: 'Token PLN', value: 'Rp 100.000', color: 'from-yellow-400 to-yellow-500', delay: 'animation-delay-1500' },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const waNumber = useSetting('contact_whatsapp', '6281234567890');

  const { data: dbBanners = [] } = useQuery<Banner[]>({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data } = await supabase.from('banners').select('*').eq('is_active', true).order('sort_order');
      return data || [];
    },
  });

  const hasDbBanners = dbBanners.length > 0;
  const totalSlides = hasDbBanners ? dbBanners.length : defaultBanners.length;

  useEffect(() => {
    if (!autoplay) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % totalSlides), 5000);
    return () => clearInterval(t);
  }, [autoplay, totalSlides]);

  const currentDefault = defaultBanners[current % defaultBanners.length];
  const currentDb = hasDbBanners ? dbBanners[current] : null;
  const Icon = currentDefault.icon;

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setAutoplay(false)}
      onMouseLeave={() => setAutoplay(true)}
    >
      {/* Background */}
      <div className="absolute inset-0 gradient-hero" />
      {/* Radial glow */}
      <div className="absolute inset-0 opacity-40"
        style={{ background: 'radial-gradient(ellipse 60% 80% at 75% 50%, hsl(148 75% 45% / 0.4) 0%, transparent 70%)' }} />
      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle, hsl(0 0% 100%) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24 min-h-[520px] md:min-h-[580px] flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">

          {/* Left — Text */}
          <div className="animate-slide-up" key={current}>
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 px-3 py-1.5 rounded-full text-xs text-white mb-5 backdrop-blur-sm">
              <Zap className="w-3.5 h-3.5 text-accent-light" />
              <span>Transaksi Instan & Terpercaya — 24 Jam Nonstop</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              {currentDb ? currentDb.title : (
                <>
                  <span className="text-accent-light">{currentDefault.highlight}</span>
                  {' '}{currentDefault.title.replace(currentDefault.highlight, '')}
                </>
              )}
            </h1>

            <p className="text-base md:text-lg text-white/75 mb-8 leading-relaxed max-w-xl">
              {currentDb ? currentDb.subtitle : currentDefault.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to={currentDb ? (currentDb.link_url || '/category/top-up-game') : currentDefault.link_url}>
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold px-8 shadow-glow text-base gap-2 transition-all hover:scale-105">
                  {currentDb ? (currentDb.button_text || 'Beli Sekarang') : currentDefault.button_text}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-transparent border-2 border-white/50 text-white hover:bg-white/15 hover:border-white font-semibold px-8 text-base gap-2 transition-all">
                  <MessageCircle className="w-4 h-4" />
                  Bantuan WA
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-10">
              {[
                { value: '100K+', label: 'Transaksi' },
                { value: '50+', label: 'Produk' },
                { value: '24/7', label: 'Layanan' },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-xl font-extrabold text-white">{stat.value}</p>
                  <p className="text-xs text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Floating Cards */}
          <div className="hidden lg:block relative h-80">
            {/* Center icon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-3xl bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center animate-float shadow-glow">
              <Icon className="w-14 h-14 text-white/90" />
            </div>

            {/* Floating product cards */}
            {floatingCards.map((card, i) => {
              const positions = [
                'top-4 left-0',
                'top-4 right-0',
                'bottom-4 left-4',
                'bottom-4 right-4',
              ];
              return (
                <div key={i} className={`absolute ${positions[i]} animate-float`}
                  style={{ animationDelay: `${i * 0.4}s`, animationDuration: `${5 + i * 0.5}s` }}>
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-brand-lg border border-white/50 min-w-[130px]">
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${card.color} mb-1.5`} />
                    <p className="text-xs font-semibold text-foreground">{card.label}</p>
                    <p className="text-xs text-muted-foreground">{card.value}</p>
                  </div>
                </div>
              );
            })}

            {/* Ring decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full border border-white/10 animate-float-slow" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-white/5" />
          </div>
        </div>
      </div>

      {/* Slider Controls */}
      {totalSlides > 1 && (
        <>
          <button onClick={() => setCurrent(c => (c - 1 + totalSlides) % totalSlides)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/15 border border-white/30 text-white hover:bg-white/25 transition-all flex items-center justify-center backdrop-blur-sm">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setCurrent(c => (c + 1) % totalSlides)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/15 border border-white/30 text-white hover:bg-white/25 transition-all flex items-center justify-center backdrop-blur-sm">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/70'}`} />
            ))}
          </div>
        </>
      )}

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" fill="hsl(120, 9%, 97%)" />
        </svg>
      </div>
    </section>
  );
}
