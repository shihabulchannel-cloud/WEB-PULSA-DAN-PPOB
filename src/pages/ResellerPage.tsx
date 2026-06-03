import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import MainLayout from '@/components/layout/MainLayout';
import { useSetting } from '@/hooks/useSettings';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Users, CheckCircle, MessageCircle, TrendingUp, Star, ArrowRight, Zap, Percent, Send } from 'lucide-react';

const benefits = [
  { title: 'Harga Spesial Reseller', desc: 'Akses harga di bawah harga normal untuk semua produk digital.' },
  { title: 'Tanpa Modal Besar', desc: 'Mulai berjualan hanya dengan top up saldo, tidak perlu stok barang fisik.' },
  { title: 'Keuntungan Fleksibel', desc: 'Tentukan sendiri harga jual ke pelanggan dan margin keuntungan Anda.' },
  { title: 'Proses Otomatis 24 Jam', desc: 'Sistem bekerja otomatis - jualan sambil tidur tanpa perlu online terus.' },
  { title: 'Dukungan Penuh', desc: 'Tim kami siap membantu via WhatsApp jika ada kendala transaksi.' },
  { title: 'Laporan Transaksi', desc: 'Pantau semua transaksi reseller melalui dashboard yang lengkap.' },
];

const steps = [
  { no: '01', title: 'Isi Formulir', desc: 'Lengkapi data diri Anda pada form pendaftaran' },
  { no: '02', title: 'Hubungi Admin', desc: 'Anda akan diarahkan ke WhatsApp admin untuk verifikasi' },
  { no: '03', title: 'Akun Dibuat', desc: 'Admin membuatkan akun reseller eksklusif untuk Anda' },
  { no: '04', title: 'Mulai Berjualan', desc: 'Top up saldo dan mulai jualan produk digital!' },
];

const faqs = [
  { q: 'Berapa minimal deposit untuk reseller?', a: 'Tidak ada minimal deposit. Anda bisa mulai dengan nominal berapa pun sesuai kebutuhan.' },
  { q: 'Apakah bisa jualan via media sosial?', a: 'Tentu! Banyak reseller kami sukses berjualan via WhatsApp, Instagram, Facebook, dan marketplace.' },
  { q: 'Apakah ada biaya pendaftaran?', a: 'Pendaftaran reseller sepenuhnya GRATIS. Tidak ada biaya tersembunyi apapun.' },
  { q: 'Bagaimana cara login ke portal reseller?', a: 'Setelah akun dibuat admin, Anda bisa login di halaman portal reseller menggunakan email dan password yang diberikan.' },
];

const emptyForm = { nama: '', whatsapp: '', email: '', kota: '', nama_toko: '' };

function buildWaMessage(form: typeof emptyForm, siteName: string): string {
  const lines = [
    'Halo Admin ' + siteName,
    'Saya ingin mendaftar sebagai reseller.',
    '',
    'Nama: ' + form.nama,
    'Nomor WhatsApp: ' + form.whatsapp,
    'Email: ' + (form.email || '-'),
    'Kota: ' + (form.kota || '-'),
    'Nama Toko: ' + (form.nama_toko || '-'),
    '',
    'Mohon informasi selanjutnya.',
  ];
  return lines.join('%0A');
}

export default function ResellerPage() {
  const waNumber = useSetting('contact_whatsapp', '6281234567890');
  const siteName = useSetting('site_name', 'SHIELACOM CELL');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama || !form.whatsapp) {
      toast({ title: 'Nama dan WhatsApp wajib diisi', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await supabase.from('reseller_applications').insert({
        nama: form.nama,
        whatsapp: form.whatsapp,
        email: form.email || null,
        kota: form.kota || null,
        nama_toko: form.nama_toko || null,
        status: 'waiting',
      });
      const cleanWa = waNumber.replace(/\D/g, '');
      const msg = buildWaMessage(form, siteName);
      window.open('https://wa.me/' + cleanWa + '?text=' + msg, '_blank');
      toast({ title: 'Pendaftaran terkirim!', description: 'Anda akan diarahkan ke WhatsApp admin' });
      setForm(emptyForm);
      setShowForm(false);
    } catch {
      toast({ title: 'Gagal mengirim', description: 'Coba lagi atau hubungi admin langsung', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Program Reseller</title>
        <meta name="description" content="Bergabunglah sebagai reseller dan raih penghasilan tambahan." />
      </Helmet>
      <MainLayout>
        {/* Hero */}
        <div className="relative gradient-primary overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, hsl(0 0% 100%) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative z-10 container mx-auto px-4 py-20 text-center max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 px-3 py-1.5 rounded-full text-xs text-white mb-5">
              <Users className="w-3.5 h-3.5" /><span>Program Reseller</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
              Jadi Reseller <span className="text-accent-light">{siteName}</span>
              <br />dan Raih Penghasilan Tambahan
            </h1>
            <p className="text-white/75 text-base mb-8 leading-relaxed">
              Bergabunglah dengan ratusan reseller aktif kami. Jualan produk digital dengan harga spesial.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button size="lg" onClick={() => setShowForm(true)} className="bg-white text-primary hover:bg-white/90 font-bold gap-2 shadow-glow">
                <Send className="w-5 h-5" /> Daftar Sekarang
              </Button>
              <Link to="/reseller/login">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 font-semibold gap-2">
                  Login Portal <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="py-12 bg-background">
          <div className="container mx-auto px-4 max-w-5xl space-y-14">

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Users, value: '500+', label: 'Reseller Aktif', color: 'text-primary' },
                { icon: TrendingUp, value: '1JT+', label: 'Transaksi/Bulan', color: 'text-blue-500' },
                { icon: Star, value: '4.9/5', label: 'Rating Kepuasan', color: 'text-yellow-500' },
                { icon: Zap, value: '100%', label: 'Proses Instan', color: 'text-green-500' },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="bg-card border border-border rounded-2xl p-5 text-center shadow-card">
                    <Icon className={`w-6 h-6 ${s.color} mx-auto mb-2`} />
                    <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Steps */}
            <div>
              <h2 className="text-2xl font-extrabold text-foreground text-center mb-2">Cara Kerja Reseller</h2>
              <p className="text-muted-foreground text-sm text-center mb-8">Proses mudah dalam 4 langkah</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {steps.map((s, i) => (
                  <div key={i} className="bg-card border border-border rounded-2xl p-5 text-center hover:border-primary/25 hover:shadow-brand transition-all relative">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center mx-auto mb-3">
                      <span className="text-primary-foreground font-bold text-sm">{s.no}</span>
                    </div>
                    <p className="font-bold text-foreground text-sm mb-1">{s.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                    {i < steps.length - 1 && (
                      <ArrowRight className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div>
              <h2 className="text-2xl font-extrabold text-foreground text-center mb-2">
                Keuntungan Menjadi <span className="text-gradient">Reseller</span>
              </h2>
              <p className="text-muted-foreground text-sm text-center mb-8">Semua yang Anda butuhkan untuk sukses berjualan</p>
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
            <div>
              <h2 className="text-xl font-extrabold text-foreground text-center mb-6">Pertanyaan Umum</h2>
              <div className="space-y-3 max-w-3xl mx-auto">
                {faqs.map((f, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-5">
                    <p className="font-semibold text-sm text-foreground mb-2 flex items-start gap-2">
                      <Percent className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />{f.q}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed pl-6">{f.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="relative gradient-primary rounded-3xl p-10 text-center overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, hsl(0 0% 100%) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="relative z-10">
                <h2 className="text-2xl font-extrabold text-white mb-2">Siap Mulai Berjualan?</h2>
                <p className="text-white/75 text-sm mb-6">Daftar sekarang dan dapatkan akses harga reseller eksklusif</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button onClick={() => setShowForm(true)} className="bg-white text-primary hover:bg-white/90 font-bold gap-2">
                    <Send className="w-4 h-4" /> Daftar Reseller <ArrowRight className="w-4 h-4" />
                  </Button>
                  <a href={'https://wa.me/' + waNumber.replace(/\D/g, '') + '?text=Halo%2C+saya+ingin+info+program+reseller'} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2">
                      <MessageCircle className="w-4 h-4" /> Tanya via WhatsApp
                    </Button>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </MainLayout>

      {/* Registration Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Formulir Pendaftaran Reseller
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nama Lengkap <span className="text-destructive">*</span></Label>
              <Input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                placeholder="Nama lengkap Anda" required className="mt-1.5" />
            </div>
            <div>
              <Label>Nomor WhatsApp <span className="text-destructive">*</span></Label>
              <Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                placeholder="628123456789" required className="mt-1.5" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@anda.com" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kota</Label>
                <Input value={form.kota} onChange={e => setForm(f => ({ ...f, kota: e.target.value }))}
                  placeholder="Kota Anda" className="mt-1.5" />
              </div>
              <div>
                <Label>Nama Toko (opsional)</Label>
                <Input value={form.nama_toko} onChange={e => setForm(f => ({ ...f, nama_toko: e.target.value }))}
                  placeholder="Nama toko/brand" className="mt-1.5" />
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2 text-xs text-muted-foreground">
              <MessageCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>Setelah submit, Anda akan diarahkan ke WhatsApp admin untuk verifikasi akun reseller.</span>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Batal</Button>
              <Button type="submit" disabled={submitting} className="flex-1 gradient-button text-primary-foreground font-semibold gap-2">
                <Send className="w-4 h-4" />
                {submitting ? 'Mengirim...' : 'Daftar dan Hubungi Admin'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
