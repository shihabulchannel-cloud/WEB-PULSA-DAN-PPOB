import { Search, CreditCard, CheckCircle2, Zap } from 'lucide-react';

const steps = [
  {
    icon: Search,
    step: '01',
    title: 'Pilih Produk',
    desc: 'Cari dan pilih produk yang ingin dibeli dari ratusan pilihan tersedia',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Zap,
    step: '02',
    title: 'Isi Data',
    desc: 'Masukkan ID/nomor tujuan, nama, dan kontak untuk notifikasi',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: CreditCard,
    step: '03',
    title: 'Pilih & Bayar',
    desc: 'Pilih metode pembayaran favorit: QRIS, Transfer Bank, atau E-Wallet',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
  {
    icon: CheckCircle2,
    step: '04',
    title: 'Produk Diterima',
    desc: 'Produk otomatis masuk ke akun atau nomor tujuan dalam hitungan detik',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
];

export default function HowToBuy() {
  return (
    <section className="py-16 bg-muted/40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Mudah & Cepat</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Cara <span className="text-gradient">Bertransaksi</span>
          </h2>
          <p className="text-muted-foreground mt-2.5 text-sm max-w-md mx-auto">
            Proses pembelian cukup 4 langkah mudah, tanpa perlu daftar akun
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-10 left-[calc(12.5%+1rem)] right-[calc(12.5%+1rem)] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="relative mb-4">
                  <div className={`w-20 h-20 rounded-2xl ${step.bg} flex items-center justify-center group-hover:scale-110 transition-transform shadow-card`}>
                    <Icon className={`w-9 h-9 ${step.color}`} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full gradient-button flex items-center justify-center text-white text-xs font-extrabold shadow-brand">
                    {step.step}
                  </div>
                </div>
                <h3 className="font-bold text-foreground mb-1.5 text-base">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
