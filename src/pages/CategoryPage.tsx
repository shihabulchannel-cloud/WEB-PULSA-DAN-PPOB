
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Gamepad2, Phone, Wifi, Wallet, FileText, Ticket, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils-app';
import { Link } from 'react-router-dom';
import { getBrandAsset, getBrandInitials, getBrandFallbackColor } from '@/lib/brandAssets';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Gamepad2, Phone, Wifi, Wallet, FileText, Ticket,
};

interface Category {
  id: string; name: string; slug: string; description: string; icon: string;
}
interface Product {
  id: string; name: string; brand: string; sell_price: number; image_url: string; is_active: boolean;
}

function BrandLogo({ brand, imageUrl, size = 'md' }: { brand: string; imageUrl?: string; size?: 'sm' | 'md' }) {
  const [logoError, setLogoError] = useState(false);
  const asset = getBrandAsset(brand);
  const gradient = asset?.gradient || getBrandFallbackColor(brand);
  const textSize = size === 'sm' ? 'text-xl' : 'text-2xl';

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
      <span className={`text-white font-bold ${textSize} drop-shadow`}>{getBrandInitials(brand)}</span>
    </div>
  );
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const { data: category } = useQuery<Category>({
    queryKey: ['category', slug],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').eq('slug', slug).maybeSingle();
      return data;
    },
    enabled: !!slug,
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products', slug],
    queryFn: async () => {
      if (!category?.id) return [];
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', category.id)
        .eq('is_active', true)
        .order('sort_order');
      return data || [];
    },
    enabled: !!category?.id,
  });

  const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));
  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchBrand = !selectedBrand || p.brand === selectedBrand;
    return matchSearch && matchBrand;
  });

  const Icon = category ? (iconMap[category.icon] || Gamepad2) : Gamepad2;

  return (
    <>
      <Helmet>
        <title>{category?.name || 'Kategori'} — SHIELACOM CELL</title>
        <meta name="description" content={category?.description || ''} />
      </Helmet>
      <MainLayout>
        {/* Header */}
        <div className="gradient-primary py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
                <Icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary-foreground">{category?.name}</h1>
                <p className="text-primary-foreground/70 text-sm mt-0.5">{category?.description}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-card rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {brands.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedBrand(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${!selectedBrand ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:border-primary/30'}`}
                >
                  Semua
                </button>
                {brands.map(brand => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedBrand === brand ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:border-primary/30'}`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Tidak ada produk ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map(product => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 shadow-card hover:shadow-brand transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="aspect-square relative overflow-hidden">
                    <BrandLogo brand={product.brand} imageUrl={product.image_url} />
                  </div>
                  <div className="p-3">
                    {product.brand && (
                      <p className="text-xs text-muted-foreground mb-0.5">{product.brand}</p>
                    )}
                    <p className="text-sm font-semibold text-foreground mt-0.5 leading-tight line-clamp-2 group-hover:text-primary transition-colors">{product.name}</p>
                    <p className="text-sm font-bold text-primary mt-1.5">{formatCurrency(product.sell_price)}</p>
                    <Button size="sm" className="w-full mt-2 h-8 text-xs gradient-button text-primary-foreground hover:opacity-90">
                      Beli Sekarang
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </MainLayout>
    </>
  );
}
