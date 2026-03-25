import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import HeroSection from '@/components/marketing/HeroSection';
import dynamic from 'next/dynamic';

const ProblemSection = dynamic(() => import('@/components/marketing/ProblemSection'));
const SolutionSection = dynamic(() => import('@/components/marketing/SolutionSection'));
const HowItWorksSection = dynamic(() => import('@/components/marketing/HowItWorksSection'));
const FeaturesSection = dynamic(() => import('@/components/marketing/FeaturesSection'));
const LandlordSection = dynamic(() => import('@/components/marketing/LandlordSection'));
// const TestimonialsSection = dynamic(() => import('@/components/marketing/TestimonialsSection'));
const ComparisonSection = dynamic(() => import('@/components/marketing/ComparisonSection'));
const FAQSection = dynamic(() => import('@/components/marketing/FAQSection'));
const CTASection = dynamic(() => import('@/components/marketing/CTASection'));

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
        {/* <TestimonialsSection /> */}
        <ComparisonSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
