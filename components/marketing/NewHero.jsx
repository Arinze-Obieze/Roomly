'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MdLocationOn, MdSearch, MdAdd } from 'react-icons/md';
import Link from 'next/link';

export default function NewHero() {
  const router = useRouter();
  const [location, setLocation] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (location.trim()) {
      router.push(`/rooms?location=${encodeURIComponent(location)}`);
    } else {
      router.push('/rooms');
    }
  };

  return (
    <div className="relative w-full h-[650px] lg:h-[750px] flex items-center justify-center bg-terracotta-900 overflow-hidden">
      {/* Background with Professional Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=2071&auto=format&fit=crop')" 
        }}
      >
        <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-linear-to-t from-navy-950/80 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center text-center">
        
        {/* Signal Badge: Trust & Urgency */}
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-[10px] md:text-xs font-bold text-white uppercase tracking-[0.2em] animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terracotta-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-terracotta-500"></span>
          </span>
          Trusted by 10,000+ House Seekers in Ireland
        </div>

        {/* Headline: Benefit-Driven */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-sans font-extrabold text-white mb-6 tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          Stop searching. <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-terracotta-100 via-white to-terracotta-200">
            Start belonging.
          </span>
        </h1>

        {/* Subhead: Clear Value Prop */}
        <p className="text-base sm:text-lg md:text-xl text-slate-200 mb-10 max-w-2xl font-light leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
           Find verified rooms and compatible housemates across Ireland. 
           We match you based on lifestyle, vibes, and verified credentials—so you can share a home, not just the rent.
        </p>

        {/* High-Signal Search Block */}
        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
          <form onSubmit={handleSearch} className="relative group p-2 bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-white/20 shadow-2xl">
             <div className="flex flex-col md:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <MdLocationOn className="text-slate-400 group-focus-within:text-terracotta-400 transition-colors text-2xl" />
                  </div>
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Dublin, Cork, Galway..." 
                    className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white text-slate-900 text-lg outline-none focus:ring-0 transition-all placeholder:text-slate-400"
                  />
                </div>
                
                <button 
                  type="submit"
                  className="w-full md:w-auto px-10 py-5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-xl shadow-terracotta-500/30 flex items-center justify-center gap-2"
                >
                  <MdSearch size={24} />
                  <span>Find a Room</span>
                </button>
             </div>
          </form>

          {/* Secondary CTA: For Landlords */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            <Link 
              href="/listings/new"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium text-sm transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-terracotta-500 transition-colors">
                <MdAdd className="text-white" size={20} />
              </div>
              List your room for free
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
