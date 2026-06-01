import { Helmet } from 'react-helmet-async';
import MainLayout from '@/components/layout/MainLayout';
import { Percent, Tag, Clock, Gift, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const promos = [
  {
    badge: 'Flash Sale',
    badgeColor: 'bg-red-500',
    title: 'Diskon 10% Top Up Game',
    desc: 'Dapatkan diskon 10% untuk semua produk top up game setiap hari Jumat-Minggu. Berlaku untuk semua metode pembayaran.',
    icon: Zap,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    validity: 'Setiap Jum\'at – Minggu',
    href: '/category/top-up-game',
    cta: 'Top Up Sekarang',
  },
  {
    badge: 'Promo E-Wallet',
    badgeColor: 'bg-blue-500',
    title: 'Cashback Rp 5.000',
    desc: 'Top up E-Wallet (DANA, OVO, GoPay, ShopeePay) senilai min. Rp 50.000 dan dapatkan cashback Rp 5.000 langsung ke akun.',
    icon: Percent,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    validity: 'Berlaku setiap hari',
    href: '/category/e-wallet',
    cta: 'Top Up E-Wallet',
  },
  {
    badge: 'Member Baru',
    badgeColor: 'bg-purple-500',
    title: 'Bonus Kuota untuk Member Baru',
    desc: 'Pelanggan baru yang pertama kali beli paket data mendapatkan bonus kuota ekstra 500MB untuk pembelian pertama.',
    icon: Gift,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
    validity: 'Hanya untuk pembelian pertama',
    href: '/category/paket-data',
    cta: 'Beli Paket Data',
  },
  {
    badge: 'Harian',
    badgeColor: 'bg-green-500',
    title: 'Token PLN Tanpa Biaya Admin',
    desc: 'Pembelian Token PLN di SHIELACOM CELL tanpa biaya admin tambahan. Bayar sesuai nominal token, tidak ada biaya tersembunyi.',
    icon: Tag,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    validity: 'Berlaku setiap saat',
    href: '/category/ppob',
    cta: 'Beli Token PLN',
  },
  {
    badge: 'Spesial',
    badgeColor: 'bg-yellow-500',
    title: 'Pulsa Murah Semua Operator',
    desc: 'Pulsa untuk semua operator (Telkomsel, XL, Indosat, AXIS, Smartfren) dengan harga di bawah pasaran. Proses instan.',
    icon: Clock,
    iconBg: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    validity: 'Berlaku terus menerus',
    href: '/category/pulsa',
    cta: 'Beli Pulsa',
  },
];

export default function PromoPage() {
  return (
    <>
      <Helmet>
        <title>Promo & Diskon — SHIELACOM CELL</title>
        <meta name="description" content="Dapatkan promo, diskon, dan cashback menarik setiap hari dari SHIELACOM CELL." />
      </Helmet>
      <MainLayout>
        {/* Header */}
        <div className="relative gradient-primary overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle, hsl(0 0% 100%) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative z-10 container mx-auto px-4 py-16 text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 px-3 py-1.5 rounded-full text-xs text-white mb-4">
              <Tag className="w-3.5 h-3.5" />
              <span>Promo Terbaru</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">Promo & Diskon</h1>
            <p className="text-white/75 text-sm max-w-lg mx-auto">Nikmati berbagai penawaran spesial dan dapatkan harga terbaik setiap hari</p>
          </div>
        </div>

        <div className="py-12 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {promos.map((promo, i) => {
                const Icon = promo.icon;
                return (
                  <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden shadow-card hover:shadow-brand transition-all hover:-translate-y-1">
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-2xl ${promo.iconBg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-6 h-6 ${promo.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`inline-block text-xs font-bold text-white px-2.5 py-0.5 rounded-full ${promo.badgeColor} mb-1.5`}>
                            {promo.badge}
                          </span>
                          <h3 className="font-bold text-foreground text-base leading-tight">{promo.title}</h3>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{promo.desc}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{promo.validity}</span>
                        </div>
                        <Link to={promo.href}>
                          <Button size="sm" className="gap-1.5 gradient-button text-primary-foreground text-xs">
                            {promo.cta} <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note */}
            <div className="mt-8 p-4 bg-primary/5 border border-primary/15 rounded-2xl text-center">
              <p className="text-sm text-muted-foreground">
                Promo dapat berubah sewaktu-waktu. Hubungi kami via{' '}
                <a href="https://wa.me/" className="text-primary font-medium hover:underline">WhatsApp</a>{' '}
                untuk informasi promo terbaru.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}
