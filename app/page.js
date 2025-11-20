'use client'
import { useState } from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaStar, FaStarHalf, FaBars, FaTimes } from 'react-icons/fa';
import { 
  MdHourglassEmpty, 
  MdGroups, 
  MdGppBad, 
  MdQuiz, 
  MdVerifiedUser, 
  MdChat,
  MdHome,
  MdShield
} from 'react-icons/md';

// Component: Header with Navigation
function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'About', href: '#about' },
  ];

  return (
    <>
      {/* Desktop Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center">
              <img src="/logo.jpg" alt="Roomly" className="h-8 w-auto" />
              <span className="ml-2 text-xl font-bold text-primary">Roomly</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-text hover:text-primary font-medium transition-colors duration-200"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="text-text hover:text-primary font-medium transition-colors duration-200">
                Sign In
              </button>
              <button className="bg-primary text-white px-6 py-2 rounded-full font-medium hover:opacity-90 transition-opacity duration-200">
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-text p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <div className={`
        fixed inset-0 z-40 md:hidden transform transition-transform duration-300 ease-in-out
        ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50"
          onClick={() => setIsMenuOpen(false)}
        />
        
        {/* Sidebar Panel */}
        <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center">
                <img src="/logo.jpg" alt="Roomly" className="h-8 w-auto" />
                <span className="ml-2 text-xl font-bold text-primary">Roomly</span>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="text-text p-2"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6">
              <div className="space-y-4">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="block py-3 text-lg font-medium text-text hover:text-primary transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-border">
              <div className="space-y-4">
                <button className="w-full bg-primary text-white py-3 rounded-full font-medium hover:opacity-90 transition-opacity duration-200">
                  Get Started
                </button>
                <button className="w-full text-text py-3 rounded-full font-medium border border-border hover:border-primary transition-colors duration-200">
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Component: Hero Section
function HeroSection() {
  return (
    <section className="relative bg-gray-900 text-white pt-16">
      <div className="absolute inset-0">
        <img 
          alt="Three happy flatmates sharing a meal and laughing together." 
          className="w-full h-full object-cover opacity-60" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBYluRcg-chp9fmxH5LTxi1UYcYDG7uocOUHOkWRcnqaq4vPszq7I6oVejaeBVDxHzBKS1_fHUu4l940hy9jR8OmLcGF09LTORxFsLtXdXbpNmR65uOk9LC0vl_Al3EgQ_ZswSuIK8RQ47iiB_4kGIUK0QD1QGH1HROjbqKQ1xu4YFLSmlmC4u0ELSvPbc3uYdNxR0gPfYyY7abIPzL5oO6ALqKH9bupCnvtyrvhD1Vl659arITzrIHxmArtpfdLURqnbojzWg88s3"
        />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-48 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Find Your Perfect<br/>Flatmate in Ireland
        </h1>
        <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto">
          Intelligent matching for harmonious homes
        </p>
        <button className="mt-8 inline-block bg-secondary text-text font-bold py-4 px-10 rounded-full text-lg hover:opacity-90 transition-colors duration-300">
          Find My Match
        </button>
      </div>
    </section>
  );
}

// Component: Featured Logos
function FeaturedSection() {
  const featuredLogos = [
    { name: 'The Irish Times', src: '/featured/irish-times.svg' },
    { name: 'RTE', src: '/featured/rte.svg' },
    { name: 'The Journal', src: '/featured/the-journal.svg' },
    { name: 'Silicon Republic', src: '/featured/silicon-republic.svg' },
    { name: 'Daft.ie', src: '/featured/daft.svg' },
    { name: 'MyHome.ie', src: '/featured/myhome.svg' },
  ];

  return (
    <section className="py-6 md:py-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h4 className="text-text-muted text-sm font-bold text-center mb-4 md:mb-6">
          As featured in
        </h4>
        <div className="flex justify-center items-center flex-wrap gap-8 md:gap-12">
          {featuredLogos.map((logo) => (
            <div key={logo.name} className="h-8 md:h-10 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300">
              <div className="w-24 md:w-32 h-full bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                {logo.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Component: Problem Cards
function ProblemsSection() {
  const problems = [
    {
      icon: MdHourglassEmpty,
      title: 'Endless Scrolling',
      description: 'Wasting hours on generic listings with no real insight.'
    },
    {
      icon: MdGroups,
      title: 'Incompatible Lifestyles',
      description: 'The stress of living with someone on a completely different page.'
    },
    {
      icon: MdGppBad,
      title: 'Uncertain Safety',
      description: 'Worrying about who you\'re really sharing your home with.'
    }
  ];

  return (
    <section id="how-it-works" className="py-8 md:py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-[22px] md:text-3xl lg:text-4xl font-bold text-center text-text mb-8 md:mb-12">
          Tired of the Flatmate Gamble?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          {problems.map((problem, index) => (
            <div key={index} className="flex flex-1 gap-4 rounded-lg md:rounded-2xl border border-border bg-card p-4 md:p-8 flex-col items-center text-center">
              <problem.icon className="text-primary text-3xl md:text-4xl mb-2 md:mb-4" />
              <div className="flex flex-col gap-1 md:gap-2">
                <h3 className="text-base md:text-xl font-bold text-text">
                  {problem.title}
                </h3>
                <p className="text-sm md:text-base text-text-muted">
                  {problem.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Component: Solution Cards
function SolutionsSection() {
  const solutions = [
    {
      icon: MdQuiz,
      title: 'Compatibility Quiz',
      description: 'Our in-depth quiz matches you based on lifestyle, habits, and values.'
    },
    {
      icon: MdVerifiedUser,
      title: 'Verified Profiles',
      description: 'We verify identities so you can search with confidence and peace of mind.'
    },
    {
      icon: MdChat,
      title: 'Secure Messaging',
      description: 'Chat with potential flatmates safely without sharing personal contact info.'
    }
  ];

  return (
    <section id="features" className="py-8 md:py-16 lg:py-24 bg-accent-green">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-[22px] md:text-3xl lg:text-4xl font-bold text-center text-text mb-8 md:mb-12">
          Roomly: Smarter, Safer Matching
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          {solutions.map((solution, index) => (
            <div key={index} className="flex flex-1 gap-4 rounded-lg md:rounded-2xl bg-card p-4 md:p-8 flex-col items-center text-center">
              <solution.icon className="text-primary text-3xl md:text-4xl mb-2 md:mb-4" />
              <div className="flex flex-col gap-1 md:gap-2">
                <h3 className="text-base md:text-xl font-bold text-text">
                  {solution.title}
                </h3>
                <p className="text-sm md:text-base text-text-muted">
                  {solution.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Component: Benefits Section
function BenefitsSection() {
  const benefits = [
    {
      icon: MdHome,
      title: 'Live Harmoniously',
      description: 'Our compatibility matching goes beyond simple preferences to find someone you\'ll genuinely enjoy living with. From social habits to cleanliness, we cover it all.'
    },
    {
      icon: MdShield,
      title: 'Search with Confidence',
      description: 'With ID verification and a secure platform, you can focus on finding the right personality fit, knowing we\'ve got the safety checks covered.'
    }
  ];

  return (
    <section className="py-8 md:py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-[22px] md:text-3xl lg:text-4xl font-bold text-center text-text mb-8 md:mb-12">
          How We Make It Easy
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex flex-col gap-3 rounded-lg md:rounded-2xl border border-border bg-card p-6 md:p-8">
              <benefit.icon className="text-primary text-3xl mb-4" />
              <h3 className="text-lg md:text-xl font-bold text-text">
                {benefit.title}
              </h3>
              <p className="text-sm md:text-base text-text-muted">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Component: Testimonials
function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Sarah M.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDu9G2Lwj0ZpSOq0LnQR1sDrLlEp0j0XyhZzcuJGynx8ISTBWNThHftk81LKXz2HDgKGlOAhtQ5finFPHqgv1cA_o_mKq3ICErxBLFjs2gLdEfcNvgjAFNTYkvGM8jLQZv_IR1IrsvzsNHuAMh6_u4J-6_RUVPXUHyQTnLeMI1t4uhavZZivg6SnmONi1pzGjXPkFbT_zNcV_9aHOuNUs-yHIA8Pt2sUXvztti8zWrtI0q-5fam7gmqrVN5WtCMgyUatzM3VkxF1YI',
      rating: 5,
      text: '"I was dreading the flatmate search, but Roomly made it so easy. Found a brilliant flatmate in just over a week!"'
    },
    {
      name: 'David K.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7wLlxvYfw_ldryX0On9qQTFOnZMYUkz1TJg3aZvIir1g-G5T2eEM8qs_1vkd79ybwbBCYO84rGscvUS7yZ00XnK7erSdxVIES82DpT5Y3yyeA3ztik-OmIIOvtgv_TSu-u1vTDhzl31VYzZln2aRiJt1p5kbJrNEmMOlu3yvTPQs5jD8sQgohE73IJ_z5jFSihsrtHrD0r02EOFbEt_I9Az6jh60JqJ-UHhzOQxtnbK6XPGtB52qXNC1wCfahVAThHmno7A59TT0',
      rating: 4.5,
      text: '"The compatibility quiz is a game-changer. My new flatmate and I clicked instantly. Highly recommend this platform."'
    },
    {
      name: 'Chloe B.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjIhCX8WeAI5_4ALKN1gMEkbNZduYZcGga6zkqi7rSm1Ma1N1NBscxN-JTCJPzJQqwcHYZ38emiC7iBLIZdb-anXmxlKug4elfUWaIVSO7ZnMhvZiFJ8lXjNH59Mt7Pc4AbEom5Y5d3JLwMfyAEEg09JNwkfm-VgCXIN5oFmGeCW9wckNXEScZNe66MHKRUkku7QWNaaHvCSg66e3QmzAbjGs1C44D6AFDN0DWc8W4YakIw8tt-W1MAK-6Nsdf7acdPECHWlFMu95S',
      rating: 5,
      text: '"Felt much safer using a platform that verifies users. The secure messaging is a great feature. Finally found a place I can call home."'
    }
  ];

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-[16px] text-secondary" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStarHalf key="half" className="text-[16px] text-secondary" />);
    }

    return stars;
  };

  return (
    <section id="testimonials" className="py-8 md:py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-[22px] md:text-3xl lg:text-4xl font-bold text-center text-text mb-8 md:mb-12">
          What Our Users Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="flex flex-col gap-4 rounded-lg md:rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <img 
                  className="h-12 w-12 rounded-full object-cover" 
                  alt={`Photo of ${testimonial.name}`} 
                  src={testimonial.image} 
                />
                <div>
                  <p className="text-text font-bold">{testimonial.name}</p>
                  <div className="flex">
                    {renderStars(testimonial.rating)}
                  </div>
                </div>
              </div>
              <p className="text-sm text-text-muted">
                {testimonial.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Component: CTA Section
function CTASection() {
  return (
    <section className="py-12 md:py-16 lg:py-24 text-center flex flex-col items-center gap-4 bg-accent-green">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text mb-4">
          Ready to Find Your Home?
        </h2>
        <p className="text-base md:text-lg text-text-muted mb-8 max-w-md mx-auto">
          Join Roomly today and discover a better way to find your next flatmate.
        </p>
        <button className="inline-block bg-secondary text-text font-bold py-4 px-10 rounded-full text-lg hover:opacity-90 transition-colors duration-300">
          Create Your Free Profile
        </button>
      </div>
    </section>
  );
}

// Component: Footer
function Footer() {
  return (
    <footer id="about" className="bg-card py-8 md:py-12 px-4 text-center">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center">
            <img src="/logo.jpg" alt="Roomly" className="h-8 w-auto" />
            <span className="ml-2 text-xl font-bold text-primary">Roomly</span>
          </div>
          <nav className="flex flex-col md:flex-row gap-4 md:gap-8 text-sm md:text-base font-medium text-text-muted">
            <a className="hover:text-primary transition-colors duration-200" href="#how-it-works">How It Works</a>
            <a className="hover:text-primary transition-colors duration-200" href="#features">Features</a>
            <a className="hover:text-primary transition-colors duration-200" href="#testimonials">Testimonials</a>
            <a className="hover:text-primary transition-colors duration-200" href="#about">About</a>
          </nav>
          <div className="flex gap-6">
            <a className="text-text-muted hover:text-primary transition-colors duration-200" href="#">
              <FaFacebook className="h-6 w-6" />
            </a>
            <a className="text-text-muted hover:text-primary transition-colors duration-200" href="#">
              <FaTwitter className="h-6 w-6" />
            </a>
            <a className="text-text-muted hover:text-primary transition-colors duration-200" href="#">
              <FaInstagram className="h-6 w-6" />
            </a>
          </div>
          <p className="text-xs text-text-muted">
            © 2025 Roomly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Component: Sticky Bottom CTA
function StickyCTA() {
  return (
    <div className="sticky bottom-0 z-10 w-full bg-card/80 p-4 backdrop-blur-sm border-t border-border md:hidden">
      <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 bg-primary text-white text-base font-bold hover:opacity-90 transition-opacity duration-200">
        Get Started
      </button>
    </div>
  );
}

// Main Component
export default function HomePage() {
  return (
    <div className="font-display bg-background">
      <Header />
      <HeroSection />
      <main>
        <FeaturedSection />
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