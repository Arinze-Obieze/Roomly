'use client';

import Link from 'next/link';

export default function CTABanner() {
  return (
    <section className="py-16 md:py-24 bg-slate-900 text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] rounded-full bg-cyan-600 blur-[100px]"></div>
        <div className="absolute bottom-[-50%] right-[-20%] w-[500px] h-[500px] rounded-full bg-blue-600 blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
          Ready to find your <br className="md:hidden" />
          <span className="text-cyan-400">new home?</span>
        </h2>
        
        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto font-light">
          Join thousands of verified renters and hosts sharing better homes across Ireland.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/rooms"
              className="w-auto px-8 py-3 md:py-4 bg-white text-slate-900 rounded-xl font-bold text-base md:text-lg hover:bg-slate-100 transition-all active:scale-95 shadow-lg shadow-white/10"
            >
              Start Searching
            </Link>
            <Link 
              href="/listings/new"
              className="w-auto px-8 py-3 md:py-4 bg-transparent border-2 border-white/20 text-white rounded-xl font-bold text-base md:text-lg hover:bg-white/10 transition-all active:scale-95"
            >
              List Your Room
            </Link>
        </div>
      </div>
    </section>
  );
}
