import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSettings } from '@/hooks/useSettings';

interface PageContent {
  title: string;
  description?: string;
  defaultContent: string;
}

const pageConfig: Record<string, PageContent> = {
  about: {
    title: 'Tentang Kami',
    description: 'Tentang SHIELACOM CELL — Platform Top Up Terpercaya',
    defaultContent: `<h2>Tentang SHIELACOM CELL</h2><p>SHIELACOM CELL adalah platform jual beli produk digital terpercaya yang menyediakan layanan top up game, pulsa, paket data, e-wallet, dan pembayaran tagihan (PPOB) secara otomatis dan instan.</p><h3>Mengapa Memilih Kami?</h3><ul><li><strong>Harga Kompetitif</strong> — Kami menawarkan harga terbaik untuk semua produk digital</li><li><strong>Proses Instan</strong> — Transaksi diproses secara otomatis 24 jam sehari, 7 hari seminggu</li><li><strong>Aman & Terpercaya</strong> — Sistem keamanan berlapis untuk melindungi setiap transaksi</li></ul>`,
  },
  'how-to-buy': {
    title: 'Cara Pembelian',
    description: 'Panduan cara membeli produk digital di SHIELACOM CELL',
    defaultContent: `<h2>Cara Membeli Produk</h2><h3>1. Pilih Produk</h3><p>Browse kategori dan klik produk yang ingin dibeli.</p><h3>2. Isi Data</h3><p>Masukkan ID/nomor tujuan dan kontak untuk notifikasi.</p><h3>3. Pilih Pembayaran</h3><p>Pilih metode: QRIS, Transfer Bank, atau E-Wallet.</p><h3>4. Selesaikan Pembayaran</h3><p>Produk otomatis terkirim setelah pembayaran dikonfirmasi.</p>`,
  },
  faq: {
    title: 'FAQ',
    description: 'Pertanyaan yang Sering Ditanyakan tentang SHIELACOM CELL',
    defaultContent: '',
  },
  privacy: {
    title: 'Kebijakan Privasi',
    description: 'Kebijakan Privasi SHIELACOM CELL',
    defaultContent: `<h2>Kebijakan Privasi</h2><p>SHIELACOM CELL berkomitmen untuk melindungi privasi pengguna kami.</p><h3>Informasi yang Kami Kumpulkan</h3><ul><li>Nama, email, dan nomor telepon untuk keperluan transaksi</li><li>Data transaksi (produk yang dibeli, nomor tujuan)</li></ul><h3>Tidak Menjual Data</h3><p>Kami tidak menjual atau membagikan data pribadi Anda kepada pihak ketiga.</p>`,
  },
  terms: {
    title: 'Syarat & Ketentuan',
    description: 'Syarat dan Ketentuan Penggunaan SHIELACOM CELL',
    defaultContent: `<h2>Syarat & Ketentuan</h2><p>Dengan menggunakan layanan SHIELACOM CELL, Anda menyetujui syarat dan ketentuan berikut.</p><h3>Transaksi</h3><ul><li>Pastikan data yang dimasukkan sudah benar sebelum membayar</li><li>Transaksi yang sudah diproses tidak dapat dibatalkan</li></ul>`,
  },
};

const cmsKeyMap: Record<string, string> = {
  about: 'cms_about',
  'how-to-buy': 'cms_how_to_buy',
  privacy: 'cms_privacy',
  terms: 'cms_terms',
};

export default function StaticPage({ page }: { page?: string }) {
  const params = useParams();
  const pageKey = page || params.page || 'about';
  const config = pageConfig[pageKey];
  const { data: settings = {} } = useSettings();

  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs-public'],
    queryFn: async () => {
      const { data } = await supabase.from('faq').select('*').eq('is_active', true).order('sort_order');
      return data || [];
    },
    enabled: pageKey === 'faq',
  });

  if (!config) return null;

  // Read CMS content from DB (set via Admin → CMS), fallback to default
  const cmsKey = cmsKeyMap[pageKey];
  const content = (cmsKey && settings[cmsKey]) ? settings[cmsKey] : config.defaultContent;

  return (
    <>
      <Helmet>
        <title>{config.title} — SHIELACOM CELL</title>
        {config.description && <meta name="description" content={config.description} />}
      </Helmet>
      <MainLayout>
        <div className="gradient-primary py-10">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">{config.title}</h1>
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
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>
      </MainLayout>
    </>
  );
}
