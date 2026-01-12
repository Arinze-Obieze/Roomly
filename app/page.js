import Header from '@/components/marketing/Header';
import HeroSection from '@/components/marketing/HeroSection';
import ProblemsSection from '@/components/marketing/ProblemsSection';
import SolutionsSection from '@/components/marketing/SolutionsSection';
import BenefitsSection from '@/components/marketing/BenefitsSection';
import TestimonialsSection from '@/components/marketing/TestimonialsSection';
import CTASection from '@/components/marketing/CTASection';
import StickyCTA from '@/components/marketing/StickyCTA';
import Footer from '@/components/marketing/Footer';

export default function HomePage() {
  return (
    <div className="font-display bg-gray-50 text-gray-800">
      <Header />
      <HeroSection />
      <main>
        <ProblemsSection />
        <SolutionsSection />
        <BenefitsSection />
        <TestimonialsSection />
        <CTASection />
        <StickyCTA />
      </main>
      <Footer />
    </div>
  );
}
