'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MdSearch, MdLocationOn } from 'react-icons/md';

export default function SearchHero({ onSearch }) {
  const router = useRouter();
  const [location, setLocation] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
        onSearch(location);
    }
  };

  return (
    <div className="relative w-full h-[500px] md:h-[600px] bg-slate-900 overflow-hidden flex items-center justify-center">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2670&auto=format&fit=crop')` 
        }}
      >
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl px-4 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-lg">
          Find your place <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-500">
            to call home.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-200 mb-10 max-w-2xl mx-auto font-medium drop-shadow-md">
           Discover thousands of rooms, apartments, and shared homes across Ireland. Verified hosts, secure payments.
        </p>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto group">
           <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
             <MdLocationOn className="text-slate-400 group-focus-within:text-cyan-500 transition-colors text-2xl" />
           </div>
           
           <input 
             type="text" 
             value={location}
             onChange={(e) => setLocation(e.target.value)}
             placeholder="Where do you want to live? (e.g. Dublin, Cork)" 
             className="w-full pl-14 pr-36 py-5 rounded-2xl bg-white shadow-2xl shadow-black/20 text-slate-900 text-lg outline-none ring-4 ring-transparent focus:ring-cyan-500/30 transition-all placeholder:text-slate-400"
           />
           
           <button 
             type="submit"
             className="absolute inset-y-2 right-2 bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-xl font-bold transition-all active:scale-95 shadow-lg flex items-center gap-2"
           >
             <MdSearch size={24} />
             <span className="hidden sm:inline">Search</span>
           </button>
        </form>
        
        {/* Popular Tags */}
        <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm font-medium text-white/80">
            <span>Popular:</span>
            {['Dublin City', 'Galway', 'Cork', 'Student Housing'].map(tag => (
                <button 
                  key={tag}
                  onClick={() => setLocation(tag)} // Simple set for now
                  className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm transition-colors border border-white/10"
                >
                    {tag}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
}
