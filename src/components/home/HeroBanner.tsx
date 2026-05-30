import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  button_text: string;
}

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  const { data: banners = [] } = useQuery<Banner[]>({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data } = await supabase.from('banners').select('*').eq('is_active', true).order('sort_order');
      return data || [];
    },
  });

  useEffect(() => {
    if (!autoplay || banners.length === 0) return;
    const timer = setInterval(() => setCurrent(c => (c + 1) % banners.length), 4000);
    return () => clearInterval(timer);
  }, [autoplay, banners.length]);

  if (banners.length === 0) {
    return (
      <div className="relative overflow-hidden gradient-hero min-h-[420px] md:min-h-[520px] flex items-center">
        <HeroContent title="Top Up Game, Pulsa & PPOB" subtitle="Solusi Top Up Termurah dan Terpercaya — Proses Instan 24 Jam" />
      </div>
    );
  }

  const currentBanner = banners[current];

  return (
    <div
      className="relative overflow-hidden min-h-[400px] md:min-h-[500px]"
      onMouseEnter={() => setAutoplay(false)}
      onMouseLeave={() => setAutoplay(true)}
    >
      {/* Background */}
      <div className="absolute inset-0 gradient-hero" />
      {currentBanner?.image_url && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${currentBanner.image_url})` }}
        />
      )}

      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 left-20 w-80 h-80 rounded-full bg-secondary/10 blur-3xl" />
      <div className="absolute top-1/2 right-1/4 w-40 h-40 rounded-full bg-accent/10 blur-2xl" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24 flex flex-col justify-center min-h-[400px] md:min-h-[500px]">
        <div className="max-w-2xl animate-slide-up" key={currentBanner.id}>
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 px-3 py-1.5 rounded-full text-xs text-primary-foreground mb-5">
            <Zap className="w-3 h-3" />
            <span>Promo Terbatas — Harga Terbaik Hari Ini</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground leading-tight mb-4">
            {currentBanner.title}
          </h1>
          <p className="text-base md:text-lg text-primary-foreground/75 mb-8 leading-relaxed">
            {currentBanner.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to={currentBanner.link_url || '/category/top-up-game'}>
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold px-8 shadow-glow">
                {currentBanner.button_text || 'Mulai Sekarang'}
              </Button>
            </Link>
            <Link to="/transaction">
              <Button size="lg" className="bg-transparent border-2 border-primary-foreground/60 text-primary-foreground hover:bg-primary-foreground/15 hover:border-primary-foreground font-medium px-8 transition-all">
                Cek Transaksi
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => setCurrent(c => (c - 1 + banners.length) % banners.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass flex items-center justify-center text-foreground hover:bg-white/30 transition-all z-20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrent(c => (c + 1) % banners.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass flex items-center justify-center text-foreground hover:bg-white/30 transition-all z-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${i === current ? 'w-8 h-2 bg-primary-foreground' : 'w-2 h-2 bg-primary-foreground/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function HeroContent({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="relative z-10 container mx-auto px-4 flex flex-col justify-center">
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 left-20 w-80 h-80 rounded-full bg-secondary/10 blur-3xl" />
      <div className="relative max-w-2xl py-16 md:py-24">
        <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 px-3 py-1.5 rounded-full text-xs text-primary-foreground mb-5">
          <Zap className="w-3 h-3" />
          <span>Proses Instan — Harga Terjamin</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground leading-tight mb-4">{title}</h1>
        <p className="text-base md:text-lg text-primary-foreground/75 mb-8">{subtitle}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/category/top-up-game">
            <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold px-8">
              Mulai Top Up
            </Button>
          </Link>
          <Link to="/transaction">
            <Button size="lg" className="bg-transparent border-2 border-primary-foreground/60 text-primary-foreground hover:bg-primary-foreground/15 hover:border-primary-foreground font-medium px-8 transition-all">
              Cek Transaksi
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
