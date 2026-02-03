import Link from 'next/link';
import { MdArrowForward } from 'react-icons/md';

export default function CTABanner() {
  return (
    <section className="py-16 md:py-40 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
        
        {/* Social Proof Avatars */}
        <div className="flex justify-center -space-x-3 mb-8">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-white overflow-hidden bg-slate-100 shadow-xl">
              <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" className="w-full h-full object-cover" />
            </div>
          ))}
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-white bg-terracotta-500 flex items-center justify-center text-white text-[10px] md:text-xs font-bold shadow-xl">
            +2k
          </div>
        </div>

        <h2 className="text-3xl md:text-7xl font-sans font-extrabold text-navy-950 mb-8 tracking-tighter leading-[1.1]">
          Find your people. <br />
          <span className="text-terracotta-500">Love your home.</span>
        </h2>
        
        <p className="text-xl md:text-2xl text-slate-500 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
          Join 10,000+ verified members sharing better homes across Ireland. 
          Your perfect match is just a search away.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              href="/rooms"
              className="w-full sm:w-auto px-10 py-5 bg-navy-950 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-2"
            >
              Start Searching Rooms
              <MdArrowForward />
            </Link>
            <Link 
              href="/listings/new"
              className="w-full sm:w-auto px-10 py-5 bg-terracotta-50 text-terracotta-600 rounded-2xl font-bold text-lg hover:bg-terracotta-100 transition-all flex items-center justify-center"
            >
              List Your Room
            </Link>
        </div>

        {/* Microcopy for trust */}
        <p className="mt-8 text-sm text-slate-400 font-medium uppercase tracking-[0.2em]">
          Free to browse • Verified listings • Safe connections
        </p>
      </div>
    </section>
  );
}
