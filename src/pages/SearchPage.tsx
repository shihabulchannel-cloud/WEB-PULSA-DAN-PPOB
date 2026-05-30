
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils-app';
import { getBrandAsset, getBrandInitials, getBrandFallbackColor } from '@/lib/brandAssets';

interface Product {
  id: string; name: string; brand: string; sell_price: number; image_url: string;
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
        <img src={asset.logoUrl} alt={brand} className="w-3/5 h-3/5 object-contain" onError={() => setLogoError(true)} />
      </div>
    );
  }
  return (
    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient}`}>
      <span className="text-white font-bold text-2xl">{getBrandInitials(brand)}</span>
    </div>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputVal, setInputVal] = useState(searchParams.get('q') || '');
  const query = searchParams.get('q') || '';

  useEffect(() => { setInputVal(query); }, [query]);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const { data } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
        .order('sort_order')
        .limit(60);
      return data || [];
    },
    enabled: !!query.trim(),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) setSearchParams({ q: inputVal.trim() });
  };

  return (
    <>
      <Helmet>
        <title>{query ? `Hasil Pencarian "${query}"` : 'Cari Produk'} — SHIELACOM CELL</title>
      </Helmet>
      <MainLayout>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {query ? `Hasil untuk "${query}"` : 'Cari Produk'}
            </h1>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  placeholder="Cari produk, e-wallet, game..."
                  className="w-full pl-9 pr-3 py-2.5 bg-card rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
              <Button type="submit" className="gradient-button text-primary-foreground">Cari</Button>
            </form>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}
            </div>
          ) : !query.trim() ? (
            <div className="text-center py-20 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Masukkan kata kunci pencarian</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium mb-1">Produk "{query}" tidak ditemukan</p>
              <p className="text-sm">Coba kata kunci lain seperti nama brand atau jenis produk</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">{products.length} produk ditemukan</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {products.map(product => {
                  const cat = product.categories as { name: string; slug: string } | undefined;
                  return (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 shadow-card hover:shadow-brand transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <BrandLogo brand={product.brand} imageUrl={product.image_url} />
                        {cat && (
                          <span className="absolute top-2 left-2 text-[10px] font-medium bg-black/40 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                            {cat.name}
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-muted-foreground mb-0.5">{product.brand}</p>
                        <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">{product.name}</p>
                        <p className="text-sm font-bold text-primary mt-1.5">{formatCurrency(product.sell_price)}</p>
                        <Button size="sm" className="w-full mt-2 h-8 text-xs gradient-button text-primary-foreground">
                          Beli
                        </Button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </MainLayout>
    </>
  );
}
