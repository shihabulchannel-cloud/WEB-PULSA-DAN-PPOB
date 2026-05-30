import { Link } from 'react-router-dom';
import { Gamepad2, Phone, Wifi, Wallet, FileText, Ticket, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Gamepad2, Phone, Wifi, Wallet, FileText, Ticket,
};

const colorMap: Record<string, string> = {
  'top-up-game': 'from-blue-500 to-indigo-600',
  'pulsa': 'from-green-500 to-emerald-600',
  'paket-data': 'from-cyan-500 to-blue-500',
  'e-wallet': 'from-purple-500 to-violet-600',
  'ppob': 'from-orange-500 to-red-500',
  'voucher-digital': 'from-pink-500 to-rose-600',
};

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

export default function CategoryGrid() {
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order');
      return data || [];
    },
  });

  return (
    <section className="py-14 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-3">
            <span>Pilih Layanan</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Kategori Produk</h2>
          <p className="text-muted-foreground mt-2 text-sm">Temukan produk digital terlengkap dengan harga terbaik</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(cat => {
              const Icon = iconMap[cat.icon] || Gamepad2;
              const gradient = colorMap[cat.slug] || 'from-primary to-secondary';
              return (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/30 shadow-card hover:shadow-brand transition-all duration-300 hover:-translate-y-1 p-5 flex flex-col items-center text-center"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-brand`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{cat.name}</span>
                  <span className="text-xs text-muted-foreground mt-1 hidden sm:block">{cat.description?.slice(0, 30)}</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                </Link>
              );
            })}
          </div>
        )}

        <div className="text-center mt-8">
          <Link to="/category/top-up-game" className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:gap-3 transition-all">
            Lihat Semua Produk <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
