import { SiGoogle, SiMeta, SiAmazon, SiSpotify, SiUniversityofdublin } from 'react-icons/si';
import { MdVerified } from 'react-icons/md';

export default function TrustBar() {
    const stats = [
      { label: "Active Listings", value: "2.4k+" },
      { label: "Matches Made", value: "10k+" },
      { label: "Safety Score", value: "99.9%", icon: <MdVerified className="text-terracotta-500" /> },
    ];
  
    return (
      <div className="bg-white border-b border-slate-100 py-10 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            
            {/* Stats Block */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 md:gap-16">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col items-center md:items-start text-center md:text-left group cursor-default">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl md:text-4xl font-extrabold text-navy-950 transition-colors">
                          {stat.value}
                      </span>
                      {stat.icon && stat.icon}
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {stat.label}
                    </span>
                </div>
              ))}
            </div>
  
            {/* Brands Block: The "Signal" */}
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
               <span className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] whitespace-nowrap">
                 Our users work & study at
               </span>
               <div className="flex flex-wrap items-center justify-center gap-8 text-2xl text-slate-300 grayscale opacity-70">
                  <SiGoogle className="hover:text-slate-900 transition-colors cursor-help" title="Google" />
                  <SiMeta className="hover:text-slate-900 transition-colors cursor-help" title="Meta" />
                  <SiAmazon className="hover:text-slate-900 transition-colors cursor-help" title="Amazon" />
                  <SiSpotify className="hover:text-slate-900 transition-colors cursor-help" title="Spotify" />
                  <div className="flex items-center gap-1 font-bold text-lg select-none">
                    <span>UCD</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-lg select-none">
                    <span>TCD</span>
                  </div>
               </div>
            </div>
  
          </div>
        </div>
      </div>
    );
  }
