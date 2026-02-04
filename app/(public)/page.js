import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import HeroSection from '@/components/marketing/HeroSection';
import ProblemSection from '@/components/marketing/ProblemSection';
import SolutionSection from '@/components/marketing/SolutionSection';
import HowItWorksSection from '@/components/marketing/HowItWorksSection';
import FeaturesSection from '@/components/marketing/FeaturesSection';
import LandlordSection from '@/components/marketing/LandlordSection';
import TestimonialsSection from '@/components/marketing/TestimonialsSection';
import ComparisonSection from '@/components/marketing/ComparisonSection';
import FAQSection from '@/components/marketing/FAQSection';
import CTASection from '@/components/marketing/CTASection';

export default function HomePage() {
  return (
    <div className="font-sans bg-white text-slate-900 min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <FeaturesSection />
        <LandlordSection />
        <TestimonialsSection />
        <ComparisonSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
