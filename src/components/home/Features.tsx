import { Zap, Tag, Clock, ShieldCheck, TrendingDown, Headphones } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Transaksi Instan',
    desc: 'Produk langsung diterima dalam hitungan detik setelah pembayaran dikonfirmasi.',
    color: 'bg-orange-50 text-orange-500',
    border: 'border-orange-100',
  },
  {
    icon: TrendingDown,
    title: 'Harga Termurah',
    desc: 'Harga kompetitif langsung dari supplier resmi. Dijamin lebih murah dari harga normal.',
    color: 'bg-green-50 text-green-600',
    border: 'border-green-100',
  },
  {
    icon: Clock,
    title: 'Layanan 24 Jam',
    desc: 'Sistem berjalan otomatis 24 jam sehari, 7 hari seminggu, termasuk hari libur.',
    color: 'bg-blue-50 text-blue-500',
    border: 'border-blue-100',
  },
  {
    icon: ShieldCheck,
    title: 'Aman & Terpercaya',
    desc: 'Transaksi diproses melalui sistem yang aman dengan enkripsi data tingkat tinggi.',
    color: 'bg-purple-50 text-purple-500',
    border: 'border-purple-100',
  },
  {
    icon: Tag,
    title: 'Banyak Promo',
    desc: 'Dapatkan cashback, diskon, dan promo menarik setiap hari untuk member setia.',
    color: 'bg-pink-50 text-pink-500',
    border: 'border-pink-100',
  },
  {
    icon: Headphones,
    title: 'CS Responsif',
    desc: 'Tim customer service siap membantu via WhatsApp kapan pun Anda butuhkan.',
    color: 'bg-teal-50 text-teal-500',
    border: 'border-teal-100',
  },
];

export default function Features() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Mengapa Memilih Kami</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Keunggulan <span className="text-gradient">SHIELACOM CELL</span>
          </h2>
          <p className="text-muted-foreground mt-2.5 text-sm max-w-lg mx-auto">
            Platform top up digital terpercaya dengan sistem otomatis yang cepat dan aman
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className={`group relative bg-card rounded-2xl p-6 border ${f.border} hover:border-primary/25 shadow-card hover:shadow-brand transition-all duration-300 hover:-translate-y-1`}
              >
                <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-foreground mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
