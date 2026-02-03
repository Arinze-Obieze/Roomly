import PublicHeader from '@/components/public/PublicHeader';
import Footer from '@/components/marketing/Footer';
import NewHero from '@/components/marketing/NewHero';
import TrustBar from '@/components/marketing/TrustBar';
import FeaturedProperties from '@/components/marketing/FeaturedProperties';
import LocationBento from '@/components/marketing/LocationBento';
import ValueProps from '@/components/marketing/ValueProps';
import HowItWorks from '@/components/marketing/HowItWorks';
import CTABanner from '@/components/marketing/CTABanner';

export default function HomePage() {
  return (
    <div className="font-sans bg-white text-slate-900 min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <NewHero />
        <TrustBar />
        <FeaturedProperties />
        <LocationBento />
        <ValueProps />
        <HowItWorks />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}
