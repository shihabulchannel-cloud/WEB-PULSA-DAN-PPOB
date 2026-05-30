
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils-app';
import { getBrandAsset, getBrandInitials, getBrandFallbackColor } from '@/lib/brandAssets';

interface Product {
  id: string;
  name: string;
  brand: string;
  sell_price: number;
  image_url: string;
  category_id: string;
  categories?: { name: string; slug: string };
}

function BrandLogo({ brand, imageUrl }: { brand: string; imageUrl?: string }) {
  const [logoError, setLogoError] = useState(false);
  const asset = getBrandAsset(brand);
  const gradient = asset?.gradient || getBrandFallbackColor(brand);

  if (imageUrl && !logoError) {
    return <img src={imageUrl} alt={brand} className="w-full h-full object-cover" onError={() => setLogoError(true)} />;
  }
  if (asset && !logoError) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient}`}>
        <img src={asset.logoUrl} alt={brand} className="w-3/5 h-3/5 object-contain drop-shadow-md" onError={() => setLogoError(true)} />
      </div>
    );
  }
  return (
    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient}`}>
      <span className="text-white font-bold text-3xl drop-shadow">{getBrandInitials(brand)}</span>
    </div>
  );
}

export default function ProductPopular() {
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products-popular'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('is_active', true)
        .order('sort_order')
        .limit(12);
      return data || [];
    },
  });

  return (
    <section className="py-14 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 text-xs font-medium px-3 py-1.5 rounded-full mb-2">
              <Flame className="w-3.5 h-3.5" />
              <span>Paling Banyak Dibeli</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Produk Populer</h2>
          </div>
          <Link to="/category/top-up-game" className="hidden sm:inline-flex items-center gap-2 text-primary text-sm font-medium hover:gap-3 transition-all">
            Lihat Semua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const cat = product.categories as { name: string; slug: string } | undefined;

  return (
    <Link
      to={`/product/${product.id}`}
      className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 shadow-card hover:shadow-brand transition-all duration-300 hover:-translate-y-1"
    >
      {/* Brand Image */}
      <div className="aspect-square relative overflow-hidden">
        <BrandLogo brand={product.brand} imageUrl={product.image_url} />
        {cat && (
          <span className="absolute top-2 left-2 text-[10px] font-medium bg-black/40 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
            {cat.name}
          </span>
        )}
      </div>
      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-muted-foreground mb-0.5">{product.brand}</p>
        <p className="text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">{product.name}</p>
        <div className="mt-1.5">
          <span className="text-sm font-bold text-primary">{formatCurrency(product.sell_price)}</span>
        </div>
        <Button size="sm" className="w-full mt-2 h-8 text-xs gradient-button text-primary-foreground hover:opacity-90 transition-opacity">
          Beli
        </Button>
      </div>
    </Link>
  );
}
