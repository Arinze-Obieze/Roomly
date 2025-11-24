export default function CTASection() {
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