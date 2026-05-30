import { Helmet } from 'react-helmet-async';
import MainLayout from '@/components/layout/MainLayout';
import HeroBanner from '@/components/home/HeroBanner';
import CategoryGrid from '@/components/home/CategoryGrid';
import ProductPopular from '@/components/home/ProductPopular';
import RecentTransactions from '@/components/home/RecentTransactions';
import Testimonials from '@/components/home/Testimonials';
import FAQ from '@/components/home/FAQ';
import { useSetting } from '@/hooks/useSettings';

export default function HomePage() {
  const siteName = useSetting('site_name', 'SHIELACOM CELL');
  const slogan = useSetting('site_slogan', 'Solusi Top Up Game, Pulsa dan PPOB Termurah dan Terpercaya');

  return (
    <>
      <Helmet>
        <title>{siteName} — {slogan}</title>
        <meta name="description" content={`${siteName}: ${slogan}. Top Up Game Mobile Legends, Free Fire, PUBG, Pulsa, Paket Data, E-Wallet, PPOB termurah dan tercepat.`} />
        <meta property="og:title" content={siteName} />
        <meta property="og:description" content={slogan} />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <MainLayout>
        <HeroBanner />
        <RecentTransactions />
        <CategoryGrid />
        <ProductPopular />
        <Testimonials />
        <FAQ />
      </MainLayout>
    </>
  );
}
