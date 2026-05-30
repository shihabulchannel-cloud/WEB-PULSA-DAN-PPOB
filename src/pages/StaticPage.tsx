
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PageContent {
  title: string;
  description?: string;
  content: string;
}

const staticContent: Record<string, PageContent> = {
  about: {
    title: 'Tentang Kami',
    description: 'Tentang SHIELACOM CELL — Platform Top Up Terpercaya',
    content: `
      <h2>Tentang SHIELACOM CELL</h2>
      <p>SHIELACOM CELL adalah platform jual beli produk digital terpercaya yang menyediakan layanan top up game, pulsa, paket data, e-wallet, dan pembayaran tagihan (PPOB) secara otomatis dan instan.</p>
      <h3>Mengapa Memilih Kami?</h3>
      <ul>
        <li><strong>Harga Kompetitif</strong> — Kami menawarkan harga terbaik untuk semua produk digital</li>
        <li><strong>Proses Instan</strong> — Transaksi diproses secara otomatis 24 jam sehari, 7 hari seminggu</li>
        <li><strong>Aman & Terpercaya</strong> — Sistem keamanan berlapis untuk melindungi setiap transaksi</li>
        <li><strong>Dukungan Pelanggan</strong> — Tim CS siap membantu via WhatsApp dan Email</li>
      </ul>
      <h3>Produk Kami</h3>
      <p>Kami menyediakan berbagai produk digital termasuk:</p>
      <ul>
        <li>Top Up Game (Mobile Legends, Free Fire, PUBG, dan 100+ game lainnya)</li>
        <li>Pulsa semua operator (Telkomsel, XL, Indosat, AXIS, Smartfren)</li>
        <li>Paket Data Internet</li>
        <li>Top Up E-Wallet (DANA, OVO, GoPay, ShopeePay)</li>
        <li>Pembayaran Tagihan (PLN, BPJS, PDAM)</li>
        <li>Voucher Digital</li>
      </ul>
      <h3>Cara Bertransaksi</h3>
      <p>Proses pembelian sangat mudah — pilih produk, isi data, pilih metode pembayaran, dan transaksi akan diproses otomatis. Tidak perlu membuat akun!</p>
    `,
  },
  'how-to-buy': {
    title: 'Cara Pembelian',
    description: 'Panduan cara membeli produk digital di SHIELACOM CELL',
    content: `
      <h2>Cara Membeli Produk</h2>
      <p>Berikut langkah-langkah mudah untuk melakukan pembelian di SHIELACOM CELL:</p>
      <h3>Langkah 1: Pilih Produk</h3>
      <p>Browse kategori produk yang tersedia (Game, Pulsa, E-Wallet, dll) dan klik produk yang ingin dibeli.</p>
      <h3>Langkah 2: Isi Data</h3>
      <p>Masukkan data yang diperlukan sesuai produk:</p>
      <ul>
        <li>Untuk Game: User ID dan Server ID</li>
        <li>Untuk Pulsa/Data: Nomor HP tujuan</li>
        <li>Untuk E-Wallet: Nomor HP yang terdaftar</li>
        <li>Nama (opsional), Email/WhatsApp untuk notifikasi</li>
      </ul>
      <h3>Langkah 3: Pilih Metode Pembayaran</h3>
      <p>Pilih metode pembayaran yang Anda inginkan: QRIS, Transfer Bank, atau E-Wallet.</p>
      <h3>Langkah 4: Selesaikan Pembayaran</h3>
      <p>Selesaikan pembayaran sesuai instruksi. Transaksi akan diproses otomatis setelah pembayaran dikonfirmasi.</p>
      <h3>Langkah 5: Terima Produk</h3>
      <p>Produk akan otomatis masuk ke akun game/nomor tujuan Anda dalam hitungan detik.</p>
      <h3>Cek Status Transaksi</h3>
      <p>Gunakan halaman <a href="/transaction">Cek Transaksi</a> dengan nomor invoice yang diterima.</p>
    `,
  },
  faq: {
    title: 'FAQ',
    description: 'Pertanyaan yang Sering Ditanyakan tentang SHIELACOM CELL',
    content: '',
  },
  privacy: {
    title: 'Kebijakan Privasi',
    description: 'Kebijakan Privasi SHIELACOM CELL',
    content: `
      <h2>Kebijakan Privasi</h2>
      <p><em>Terakhir diperbarui: Januari 2026</em></p>
      <p>SHIELACOM CELL berkomitmen untuk melindungi privasi pengguna kami. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda.</p>
      <h3>Informasi yang Kami Kumpulkan</h3>
      <ul>
        <li>Nama, email, dan nomor telepon untuk keperluan transaksi</li>
        <li>Data transaksi (produk yang dibeli, nomor tujuan)</li>
        <li>Data teknis (alamat IP, browser) untuk keamanan sistem</li>
      </ul>
      <h3>Penggunaan Informasi</h3>
      <ul>
        <li>Memproses transaksi yang Anda lakukan</li>
        <li>Mengirimkan notifikasi status transaksi</li>
        <li>Meningkatkan layanan kami</li>
        <li>Mencegah penipuan dan penyalahgunaan</li>
      </ul>
      <h3>Keamanan Data</h3>
      <p>Kami menggunakan enkripsi SSL/TLS untuk semua transaksi dan menyimpan data dengan aman menggunakan standar keamanan industri.</p>
      <h3>Tidak Menjual Data</h3>
      <p>Kami tidak menjual atau membagikan data pribadi Anda kepada pihak ketiga tanpa persetujuan Anda, kecuali yang diperlukan untuk memproses transaksi.</p>
      <h3>Kontak</h3>
      <p>Jika ada pertanyaan tentang kebijakan privasi, hubungi kami melalui WhatsApp atau email.</p>
    `,
  },
  terms: {
    title: 'Syarat & Ketentuan',
    description: 'Syarat dan Ketentuan Penggunaan SHIELACOM CELL',
    content: `
      <h2>Syarat & Ketentuan</h2>
      <p><em>Terakhir diperbarui: Januari 2026</em></p>
      <p>Dengan menggunakan layanan SHIELACOM CELL, Anda menyetujui syarat dan ketentuan berikut:</p>
      <h3>1. Layanan</h3>
      <p>SHIELACOM CELL menyediakan layanan jual beli produk digital. Semua produk yang tersedia adalah legal dan resmi dari penyedia layanan terkait.</p>
      <h3>2. Transaksi</h3>
      <ul>
        <li>Pastikan data yang dimasukkan sudah benar sebelum melakukan pembayaran</li>
        <li>Transaksi yang sudah diproses tidak dapat dibatalkan</li>
        <li>Jika terjadi kesalahan pengisian data, segera hubungi CS</li>
      </ul>
      <h3>3. Refund</h3>
      <p>Refund hanya dapat dilakukan jika produk gagal terkirim akibat kesalahan sistem kami. Kesalahan data yang diisi pengguna bukan tanggung jawab kami.</p>
      <h3>4. Pembayaran</h3>
      <p>Pembayaran harus diselesaikan dalam batas waktu yang ditentukan. Transaksi yang kadaluarsa akan otomatis dibatalkan.</p>
      <h3>5. Larangan</h3>
      <ul>
        <li>Dilarang melakukan transaksi palsu atau penipuan</li>
        <li>Dilarang menggunakan layanan untuk tujuan ilegal</li>
        <li>Dilarang melakukan chargeback tanpa alasan yang valid</li>
      </ul>
      <h3>6. Perubahan Ketentuan</h3>
      <p>Kami berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diberitahukan melalui website.</p>
    `,
  },
};

export default function StaticPage({ page }: { page?: string }) {
  const params = useParams();
  const pageKey = page || params.page || 'about';
  const content = staticContent[pageKey];

  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs-public'],
    queryFn: async () => {
      const { data } = await supabase.from('faq').select('*').eq('is_active', true).order('sort_order');
      return data || [];
    },
    enabled: pageKey === 'faq',
  });

  if (!content) return null;

  return (
    <>
      <Helmet>
        <title>{content.title} — SHIELACOM CELL</title>
        {content.description && <meta name="description" content={content.description} />}
      </Helmet>
      <MainLayout>
        {/* Header */}
        <div className="gradient-primary py-10">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">{content.title}</h1>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10 max-w-3xl">
          {pageKey === 'faq' ? (
            <div className="space-y-3">
              {faqs.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">Belum ada FAQ tersedia</p>
              ) : (
                faqs.map((faq: { id: string; question: string; answer: string }) => (
                  <details key={faq.id} className="group bg-card border border-border rounded-xl p-5 open:shadow-card transition-all">
                    <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-semibold text-foreground">
                      {faq.question}
                      <span className="ml-4 text-primary group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </details>
                ))
              )}
            </div>
          ) : (
            <div
              className="prose prose-sm max-w-none prose-headings:text-foreground prose-headings:font-bold prose-h2:text-xl prose-h3:text-base prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-a:text-primary prose-strong:text-foreground"
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
          )}
        </div>
      </MainLayout>
    </>
  );
}
