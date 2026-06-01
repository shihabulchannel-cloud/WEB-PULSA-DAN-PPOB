import { Link } from 'react-router-dom';
import { Users, TrendingUp, Percent, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const benefits = [
  'Harga lebih murah dari harga normal',
  'Tidak perlu stok produk apapun',
  'Margin keuntungan bebas ditentukan sendiri',
  'Sistem otomatis — jualan sambil tidur',
  'Dukungan penuh dari tim SHIELACOM',
];

export default function ResellerBanner() {
  return (
    <section className="py-16 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="relative rounded-3xl gradient-primary overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute top-8 right-32 w-20 h-20 rounded-full bg-white/8" />

          {/* Dot pattern */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle, hsl(0 0% 100%) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          <div className="relative z-10 p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 px-3 py-1.5 rounded-full text-xs text-white mb-5">
                <Users className="w-3.5 h-3.5" />
                <span>Program Reseller</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3 leading-tight">
                Bergabung Jadi Reseller <br className="hidden sm:block" />
                <span className="text-accent-light">SHIELACOM CELL</span>
              </h2>
              <p className="text-white/75 text-sm mb-6 leading-relaxed">
                Raih penghasilan tambahan tanpa modal besar. Jual produk digital dengan harga reseller eksklusif dan tentukan margin keuntungan sendiri.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/reseller">
                  <Button className="bg-white text-primary hover:bg-white/90 font-bold gap-2 transition-all hover:scale-105">
                    Daftar Reseller <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/reseller#pricelist">
                  <Button className="bg-transparent border-2 border-white/50 text-white hover:bg-white/15 hover:border-white font-semibold gap-2 transition-all">
                    <Percent className="w-4 h-4" />
                    Lihat Harga Reseller
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right — Benefits */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-accent-light" />
                <span className="text-white font-semibold text-sm">Keuntungan Menjadi Reseller</span>
              </div>
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5">
                  <CheckCircle className="w-4 h-4 text-accent-light flex-shrink-0" />
                  <span className="text-sm text-white/90">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
