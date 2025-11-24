import { FaHandshake, FaShieldAlt, FaChartLine } from 'react-icons/fa';

export default function BenefitsSection() {
  return (
    <section className="py-32 bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            From chaos to <span className="text-cyan-600">harmony.</span>
          </h2>
        </div>

        <div className="space-y-24 md:space-y-32">
          
          {/* Feature 1: The Algorithm */}
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
            <div className="w-full md:w-1/2 order-2 md:order-1">
              {/* Abstract User Profile Cards */}
              <div className="relative aspect-square md:aspect-video bg-gradient-to-br from-slate-200 to-slate-100 rounded-3xl border border-white shadow-xl flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40"></div>

                {/* Profile Card 1 (bottom-left) */}
                <div className="absolute top-[22%] left-[18%] w-40 bg-white rounded-2xl shadow-lg p-4 rotate-[-6deg]">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://i.pravatar.cc/100?img=32"
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Emily R.</p>
                      <p className="text-xs text-slate-500">Early bird • Clean</p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-slate-600">
                    Prefers quiet nights, works remote.
                  </div>
                </div>

                {/* Profile Card 2 (overlapping with accent) */}
                <div className="absolute top-[32%] left-[32%] w-40 bg-cyan-500 text-white rounded-2xl shadow-xl p-4 rotate-[10deg] z-20">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://i.pravatar.cc/100?img=12"
                      className="w-12 h-12 rounded-xl object-cover border-2 border-white/40"
                    />
                    <div>
                      <p className="font-semibold text-white text-sm">Jason M.</p>
                      <p className="text-xs text-white/80">Night owl • Chill</p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-white/90">
                    Works late shift, likes gaming.
                  </div>
                </div>

                {/* Compatibility Badge */}
                <div className="absolute z-50 bottom-8 right-8 bg-white/80 backdrop-blur px-4 py-2 rounded-lg font-mono text-xs text-slate-600 border border-white shadow-sm">
                  Compatibility: 94 percent
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="w-full md:w-1/2 order-1 md:order-2">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center text-cyan-600 text-xl mb-6">
                <FaChartLine />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">Data-Driven Matching</h3>
              <p className="text-lg text-slate-600 leading-relaxed">
                We don't just ask if you smoke. We analyze 50+ lifestyle points, from sleep schedules to guest policies, to generate a precise compatibility score.
              </p>
            </div>
          </div>

          {/* Feature 2: Verification (unchanged) */}
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
            <div className="w-full md:w-1/2">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 text-xl mb-6">
                <FaShieldAlt />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">Certified Trust</h3>
              <p className="text-lg text-slate-600 leading-relaxed">
                Ghosting and scams end here. Every user completes mandatory government ID verification and social profiling before they can send a single message.
              </p>
            </div>

            <div className="w-full md:w-1/2">
              <div className="relative aspect-square md:aspect-video bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl flex items-center justify-center overflow-hidden">
                <div className="absolute w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px]"></div>
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <FaShieldAlt className="text-6xl text-emerald-400" />
                  <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold tracking-wider uppercase">
                    Identity Verified
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
