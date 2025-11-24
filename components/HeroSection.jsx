import React from 'react';

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden pt-20">
      
      {/* 1. Dynamic Background - The "Alive" Feel */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Section */}
        <div className="flex flex-col items-start text-left space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-900/30 border border-cyan-500/30 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-medium text-cyan-300 tracking-wide uppercase">Now Live in Ireland</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight">
            Don't just rent. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-400">
              Match perfectly.
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
            The first algorithm-driven flatmate finder in Ireland. We verify identity and compatibility before you ever say hello.
          </p>

          <div className="w-full max-w-md p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center shadow-2xl ring-1 ring-white/5 focus-within:ring-cyan-500/50 transition-all duration-300">
            <input 
              type="email" 
              placeholder="email@address.com" 
              className="flex-1 bg-transparent border-none text-white placeholder-slate-500 px-4 focus:ring-0 focus:outline-none"
            />
            <button className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105">
              Join
            </button>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
            <div className="flex -space-x-2">
              {[
                "https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?auto=format&fit=crop&w=200&q=80",
                "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=200&q=80",
                "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80"
              ].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  className="w-8 h-8 rounded-full border-2 border-slate-950 ring-2 ring-white/5 object-cover"
                />
              ))}
            </div>
            <p>2,000+ people waiting</p>
          </div>
        </div>

        {/* Right: Floating Profiles */}
        <div className="hidden lg:block relative h-[600px] w-full">
          
          {/* Main Profile Card (Front) */}
          <div className="absolute top-10 right-10 w-80 h-96 bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl shadow-cyan-500/10 rotate-3 hover:rotate-0 transition-transform duration-700 ease-out z-20">

            <img
              src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=300&q=80"
              className="w-16 h-16 rounded-full mb-4 object-cover"
            />

            <p className="text-white font-semibold text-lg mb-1">Daniel Murphy</p>

            <p className="text-slate-400 text-sm mb-6">Lives in Dublin, UX Designer</p>

            <div className="flex gap-2">
              <div className="h-8 w-20 bg-cyan-500/20 text-cyan-300 text-xs flex items-center justify-center rounded-lg">
                Early Riser
              </div>
              <div className="h-8 w-24 bg-indigo-500/20 text-indigo-300 text-xs flex items-center justify-center rounded-lg">
                Non-Smoker
              </div>
            </div>

            <div className="absolute -right-6 top-10 bg-white text-slate-900 font-bold px-4 py-2 rounded-lg shadow-xl rotate-12">
              98% Match
            </div>
          </div>
          
          {/* Back Card — Now a REAL profile */}
          <div className="absolute top-20 right-28 w-80 h-96 bg-slate-800/50 border border-white/5 rounded-3xl -rotate-6 z-10 backdrop-blur-sm p-6">

            <img
              src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=300&q=80"
              className="w-14 h-14 rounded-full mb-4 object-cover opacity-90"
            />

            <p className="text-white font-semibold text-lg mb-1 opacity-90">Aoife Byrne</p>

            <p className="text-slate-300 text-sm mb-6 opacity-80">
              From Cork — Software Engineer
            </p>

            <div className="flex gap-2 opacity-80">
              <div className="h-8 w-24 bg-cyan-500/10 text-cyan-300 text-xs flex items-center justify-center rounded-lg">
                Loves Pets
              </div>
              <div className="h-8 w-20 bg-indigo-500/10 text-indigo-300 text-xs flex items-center justify-center rounded-lg">
                Quiet
              </div>
            </div>

            <div className="absolute -right-4 top-8 bg-white/80 text-slate-900 font-bold px-3 py-1.5 rounded-lg shadow-lg rotate-6 text-sm">
              92% Match
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
