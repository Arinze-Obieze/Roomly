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
    router.push(`/rooms?location=${encodeURIComponent(location)}`);
  };

  return (
    <div className="relative w-full h-[600px] lg:h-[700px] flex items-center justify-center bg-slate-900 overflow-hidden">
      {/* Background with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=2669&auto=format&fit=crop')" 
        }}
      >
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"></div>
        <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center text-center">
        
        {/* Badge */}
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white uppercase tracking-wider animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          Ireland's #1 Matching Platform
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 px-4">
          Share a home, <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-500">
            not just the rent.
          </span>
        </h1>

        {/* Subhead */}
        <p className="text-base sm:text-lg md:text-xl text-slate-200 mb-8 md:mb-10 max-w-2xl font-medium drop-shadow-md animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 px-4">
           Find compatible flatmates and verified rooms across Ireland. 
           We match you based on lifestyle, habits, and vibes.
        </p>

        {/* Search & Action Block */}
        <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 px-4">
          <form onSubmit={handleSearch} className="relative group mb-4">
             <div className="absolute inset-y-0 left-0 pl-4 md:pl-5 flex items-center pointer-events-none z-10">
               <MdLocationOn className="text-slate-400 group-focus-within:text-cyan-500 transition-colors text-xl md:text-2xl" />
             </div>
             
             <input 
               type="text" 
               value={location}
               onChange={(e) => setLocation(e.target.value)}
               placeholder="Where to? (e.g. Dublin)" 
               className="w-full pl-10 md:pl-14 pr-14 sm:pr-36 py-4 md:py-5 rounded-2xl bg-white shadow-2xl shadow-black/20 text-slate-900 text-base md:text-lg outline-none ring-4 ring-transparent focus:ring-cyan-500/30 transition-all placeholder:text-slate-400 placeholder:font-normal"
             />
             
             <button 
               type="submit"
               className="absolute inset-y-1.5 right-1.5 md:inset-y-2 md:right-2 bg-slate-900 hover:bg-slate-800 text-white w-10 sm:w-auto sm:px-8 rounded-xl font-bold transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
               aria-label="Search"
             >
               <MdSearch size={20} className="md:w-6 md:h-6" />
               <span className="hidden sm:inline">Search</span>
             </button>
          </form>

          {/* Secondary CTA */}
          <Link 
            href="/listings/new"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white font-semibold text-sm transition-colors hover:underline decoration-cyan-400 underline-offset-4"
          >
            <MdAdd className="text-cyan-400" size={18} />
            Have a room to rent? List it for free
          </Link>
        </div>

      </div>
    </div>
  );
}
