export default function HeroSection() {
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