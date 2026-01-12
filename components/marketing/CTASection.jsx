export default function CTASection() {
  return (
    <section className="relative py-32 overflow-hidden flex items-center justify-center bg-slate-950">
      
      {/* 1. THE AURORA BACKGROUND (The "Soul") */}
      <div className="absolute inset-0 w-full h-full">
        {/* Base dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/50"></div>
        
        {/* Top-left Cyan Glow */}
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse"></div>
        
        {/* Bottom-right Indigo Glow */}
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]"></div>
        
        {/* Noise Texture for that "Film Grain" look (removes digital flatness) */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        
        {/* 2. TYPOGRAPHY WITH DEPTH */}
        <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tighter leading-tight">
          Stop guessing. <br />
          Start <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">living.</span>
        </h2>
        
        <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
          The only platform that prioritizes lifestyle compatibility over luck. Secure your spot in the future of flat-sharing.
        </p>
        
        {/* 3. THE GLASS CAPSULE ACTION AREA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
          {/* Input: Glassmorphism */}
          <input 
            type="email" 
            placeholder="Enter your email" 
            className="w-full px-6 py-4 rounded-full bg-white/5 border border-white/10 text-white placeholder-slate-500 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all shadow-xl"
          />
          
          {/* Button: Glowing Gradient */}
          <button className="w-full sm:w-auto px-10 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-900 font-bold text-lg whitespace-nowrap shadow-[0_0_40px_-10px_rgba(6,182,212,0.5)] hover:shadow-[0_0_60px_-10px_rgba(6,182,212,0.7)] hover:scale-105 transition-all duration-300">
            Join Waitlist
          </button>
        </div>

        <p className="mt-8 text-sm text-slate-500 font-medium tracking-wide uppercase">
          Limited Beta Access • No Spam
        </p>

      </div>
    </section>
  );
}