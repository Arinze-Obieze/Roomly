export default function HeroSection() {
  return (
    <section className="relative h-screen bg-gray-900 text-white">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          alt="Three happy flatmates sharing a meal and laughing together in a modern apartment" 
          className="w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBYluRcg-chp9fmxH5LTxi1UYcYDG7uocOUHOkWRcnqaq4vPszq7I6oVejaeBVDxHzBKS1_fHUu4l940hy9jR8OmLcGF09LTORxFsLtXdXbpNmR65uOk9LC0vl_Al3EgQ_ZswSuIK8RQ47iiB_4kGIUK0QD1QGH1HROjbqKQ1xu4YFLSmlmC4u0ELSvPbc3uYdNxR0gPfYyY7abIPzL5oO6ALqKH9bupCnvtyrvhD1Vl659arITzrIHxmArtpfdLURqnbojzWg88s3"
        />
        {/* Dark overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      </div>
      
      {/* Content */}
      <div className="relative h-full flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          {/* Main Heading */}
          <h1 className="text-5xl font-light md:text-7xl lg:text-8xl  tracking-tight leading-tight md:leading-none">
            Find Your Perfect<br className="hidden md:block" />
            <span className="text-accent"> Flatmate</span> in Ireland
          </h1>
          
          {/* Subtitle */}
          <p className="mt-6 text-xl md:text-2xl lg:text-3xl font-light text-gray-200 max-w-3xl mx-auto leading-relaxed">
            Intelligent matching for harmonious homes
          </p>
          
          {/* Description */}
          <p className="mt-4 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Connect with compatible roommates who share your lifestyle and preferences
          </p>
          
          {/* CTA Button */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              className="bg-accent hover:bg-accent/90 text-white font-semibold py-4 px-12 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              aria-label="Find my perfect flatmate match"
            >
              Find My Match
            </button>
            <button 
              className="border-2 border-white hover:bg-white/10 text-white font-semibold py-4 px-12 rounded-full text-lg transition-all duration-300"
              aria-label="Learn more about our matching process"
            >
              Learn More
            </button>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>1,000+ Successful Matches</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>All Major Irish Cities</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Verified Profiles</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  );
}