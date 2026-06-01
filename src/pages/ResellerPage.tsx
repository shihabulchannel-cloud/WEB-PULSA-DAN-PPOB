import { Helmet } from 'react-helmet-async';
import MainLayout from '@/components/layout/MainLayout';
import { Users, CheckCircle, MessageCircle, TrendingUp, Star, ArrowRight, Zap, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetting } from '@/hooks/useSettings';

const benefits = [
  { title: 'Harga Spesial Reseller', desc: 'Akses harga di bawah harga normal untuk semua produk digital.' },
  { title: 'Tanpa Modal Besar', desc: 'Mulai berjualan hanya dengan top up saldo, tidak perlu stok barang fisik.' },
  { title: 'Keuntungan Fleksibel', desc: 'Tentukan sendiri harga jual ke pelanggan dan margin keuntungan Anda.' },
  { title: 'Proses Otomatis 24 Jam', desc: 'Sistem bekerja otomatis — jualan sambil tidur tanpa perlu online terus.' },
  { title: 'Dukungan Penuh', desc: 'Tim kami siap membantu via WhatsApp jika ada kendala transaksi.' },
  { title: 'Laporan Transaksi', desc: 'Pantau semua transaksi reseller melalui dashboard yang lengkap.' },
];

const faqs = [
  { q: 'Bagaimana cara mendaftar menjadi reseller?', a: 'Cukup hubungi kami via WhatsApp. Kami akan memberikan informasi lengkap tentang harga reseller dan cara kerjanya.' },
  { q: 'Berapa minimal deposit untuk reseller?', a: 'Tidak ada minimal deposit. Anda bisa mulai dengan nominal berapa pun sesuai kebutuhan.' },
  { q: 'Apakah bisa jualan via media sosial?', a: 'Tentu! Banyak reseller kami yang sukses berjualan via WhatsApp, Instagram, Facebook, dan marketplace.' },
  { q: 'Apakah ada biaya pendaftaran?', a: 'Pendaftaran reseller sepenuhnya GRATIS. Tidak ada biaya tersembunyi apapun.' },
];

export default function ResellerPage() {
  const waNumber = useSetting('contact_whatsapp', '6281234567890');

  return (
    <>
      <Helmet>
        <title>Program Reseller — SHIELACOM CELL</title>
        <meta name="description" content="Bergabunglah sebagai reseller SHIELACOM CELL. Dapatkan harga spesial dan raih penghasilan tambahan." />
      </Helmet>
      <MainLayout>
        {/* Hero */}
        <div className="relative gradient-primary overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle, hsl(0 0% 100%) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative z-10 container mx-auto px-4 py-20 text-center max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 px-3 py-1.5 rounded-full text-xs text-white mb-5">
              <Users className="w-3.5 h-3.5" />
              <span>Program Reseller</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
              Jadi Reseller <span className="text-accent-light">SHIELACOM CELL</span> <br />dan Raih Penghasilan Tambahan
            </h1>
            <p className="text-white/75 text-base mb-8 leading-relaxed">
              Bergabunglah dengan ratusan reseller aktif kami. Jualan produk digital dengan harga spesial — gratis pendaftaran, mulai kapan saja.
            </p>
            <a href={`https://wa.me/${waNumber}?text=Halo, saya ingin mendaftar sebagai reseller SHIELACOM CELL`} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold gap-2 shadow-glow">
                <MessageCircle className="w-5 h-5" />
                Daftar Sekarang via WhatsApp
              </Button>
            </a>
          </div>
        </div>

        <div className="py-12 bg-background">
          <div className="container mx-auto px-4 max-w-5xl">

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
              {[
                { icon: Users, value: '500+', label: 'Reseller Aktif', color: 'text-primary' },
                { icon: TrendingUp, value: '1JT+', label: 'Transaksi/Bulan', color: 'text-blue-500' },
                { icon: Star, value: '4.9/5', label: 'Rating Kepuasan', color: 'text-yellow-500' },
                { icon: Zap, value: '100%', label: 'Proses Instan', color: 'text-green-500' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="bg-card border border-border rounded-2xl p-5 text-center shadow-card">
                    <Icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                    <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Benefits */}
            <div className="mb-14">
              <h2 className="text-2xl font-extrabold text-foreground text-center mb-2">
                Keuntungan Menjadi <span className="text-gradient">Reseller</span>
              </h2>
              <p className="text-muted-foreground text-sm text-center mb-8">Semua yang Anda butuhkan untuk sukses berjualan produk digital</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {benefits.map((b, i) => (
                  <div key={i} className="bg-card border border-border rounded-2xl p-5 flex gap-3 hover:border-primary/25 hover:shadow-brand transition-all">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground text-sm mb-1">{b.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="mb-14">
              <h2 className="text-xl font-extrabold text-foreground text-center mb-6">Pertanyaan Umum Reseller</h2>
              <div className="space-y-3 max-w-3xl mx-auto">
                {faqs.map((faq, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-5">
                    <p className="font-semibold text-sm text-foreground mb-2 flex items-start gap-2">
                      <Percent className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      {faq.q}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed pl-6">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="relative gradient-primary rounded-3xl p-10 text-center overflow-hidden">
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle, hsl(0 0% 100%) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="relative z-10">
                <h2 className="text-2xl font-extrabold text-white mb-2">Siap Mulai Berjualan?</h2>
                <p className="text-white/75 text-sm mb-6">Hubungi kami sekarang dan dapatkan akses harga reseller eksklusif</p>
                <a href={`https://wa.me/${waNumber}?text=Halo, saya ingin mendaftar sebagai reseller SHIELACOM CELL`} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-white text-primary hover:bg-white/90 font-bold gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Daftar via WhatsApp <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </div>

          </div>
        </div>
      </MainLayout>
    </>
  );
}
