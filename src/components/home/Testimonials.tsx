import { Star, Quote } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Testimonial {
  id: string;
  name: string;
  avatar_url: string;
  rating: number;
  comment: string;
  product_name: string;
}

export default function Testimonials() {
  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const { data } = await supabase.from('testimonials').select('*').eq('is_active', true).order('created_at', { ascending: false });
      return data || [];
    },
  });

  if (testimonials.length === 0) return null;

  return (
    <section className="py-14 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-600 text-xs font-medium px-3 py-1.5 rounded-full mb-3">
            <Star className="w-3.5 h-3.5 fill-yellow-500" />
            <span>Rating 4.9/5 dari 10,000+ Customer</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Apa Kata Pelanggan Kami</h2>
          <p className="text-muted-foreground mt-2 text-sm">Ribuan customer puas telah bertransaksi bersama kami</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map(t => (
            <div key={t.id} className="bg-card border border-border rounded-2xl p-6 shadow-card hover:shadow-brand transition-all hover:-translate-y-1">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{t.name}</p>
                  {t.product_name && <p className="text-xs text-muted-foreground truncate">{t.product_name}</p>}
                </div>
                <Quote className="w-5 h-5 text-primary/30 flex-shrink-0" />
              </div>
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">"{t.comment}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
