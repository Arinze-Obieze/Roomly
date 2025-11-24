import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import ProblemsSection from '@/components/ProblemsSection';
import SolutionsSection from '@/components/SolutionsSection';
import BenefitsSection from '@/components/BenefitsSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import CTASection from '@/components/CTASection';
import StickyCTA from '@/components/StickyCTA';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <div className="font-display bg-background">
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