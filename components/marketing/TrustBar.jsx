'use client';

export default function TrustBar() {
    const stats = [
      { label: "Active Listings", value: "2,400+" },
      { label: "Matches Made", value: "10,000+" },
      { label: "Verified Hosts", value: "98%" },
    ];
  
    return (
      <div className="bg-white border-b border-slate-100 py-6 md:py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 lg:gap-24 opacity-80">
            
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center md:items-start text-center md:text-left group cursor-default min-w-[100px]">
                  <span className="text-3xl md:text-3xl font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                      {stat.value}
                  </span>
                  <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {stat.label}
                  </span>
              </div>
            ))}
  
            {/* Divider */}
            <div className="hidden md:block w-px h-12 bg-slate-200"></div>
  
            {/* Trust Text */}
            <div className="flex items-center gap-3">
               <span className="text-slate-400 font-medium">Trusted by students & pros from</span>
               <div className="flex gap-4 grayscale opacity-60">
                  {/* Placeholder for simple text logos if no SVG available */}
                  <span className="font-bold text-slate-600">UCD</span>
                  <span className="font-bold text-slate-600">Trinity</span>
                  <span className="font-bold text-slate-600">Google</span>
                  <span className="font-bold text-slate-600">Meta</span>
               </div>
            </div>
  
          </div>
        </div>
      </div>
    );
  }
