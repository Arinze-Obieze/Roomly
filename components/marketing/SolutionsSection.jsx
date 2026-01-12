import { MdVerifiedUser, MdQuiz, MdChat, MdLock } from 'react-icons/md';

export default function SolutionsSection() {
  return (
    <section className="py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-20 max-w-2xl">
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-6">
            Engineered for <span className="text-cyan-600">Harmony.</span>
          </h2>
          <p className="text-xl text-slate-600">
            We replaced the "random luck" of renting with a four-step verification and matching protocol.
          </p>
        </div>

        {/* THE BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-6 h-auto md:h-[600px]">
          
          {/* Card 1: Large Vertical Feature (Span 1 col, 2 rows) */}
          <div className="group relative md:row-span-2 rounded-3xl bg-white p-8 shadow-xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <MdQuiz className="text-9xl text-cyan-600" />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 flex items-center justify-center text-cyan-600 mb-6">
                <MdQuiz size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Deep Compatibility</h3>
                <p className="text-slate-500">Our 50-point quiz analyzes sleep schedules, cleanliness, and social habits to ensure your home is a sanctuary, not a battlefield.</p>
              </div>
              {/* Decorative visual at bottom */}
              <div className="mt-8 w-full h-32 bg-slate-50 rounded-xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-4 left-4 right-4 h-2 bg-cyan-200 rounded-full"></div>
                <div className="absolute top-10 left-4 w-2/3 h-2 bg-slate-200 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Card 2: Wide Horizontal (Span 2 cols, 1 row) */}
          <div className="group md:col-span-2 rounded-3xl bg-slate-900 p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
            {/* Abstract Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-[80px]" />
            
            <div className="flex-1 relative z-10">
              <h3 className="text-2xl font-bold text-white mb-2">Bank-Grade ID Verification</h3>
              <p className="text-slate-400">We partner with Stripe Identity to ensure every user is exactly who they say they are. No bots. No scams.</p>
            </div>
            <div className="relative z-10 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-full md:w-auto min-w-[200px]">
               <div className="flex items-center gap-3 text-white mb-2">
                 <MdVerifiedUser className="text-green-400" />
                 <span className="font-mono text-sm">Identity: Verified</span>
               </div>
               <div className="flex items-center gap-3 text-white">
                 <MdLock className="text-green-400" />
                 <span className="font-mono text-sm">Background: Clear</span>
               </div>
            </div>
          </div>

          {/* Card 3: Standard Box */}
          <div className="group rounded-3xl bg-white p-8 shadow-xl border border-slate-100 hover:border-cyan-200 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <MdChat size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Safe Messaging</h3>
            <p className="text-slate-500 text-sm">Chat without revealing your phone number until you are ready.</p>
          </div>

          {/* Card 4: Standard Box with Image Emphasis */}
          <div className="group relative rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 p-8 shadow-xl text-white overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Student Status</h3>
              <p className="text-cyan-100 text-sm">Direct connection to University verification.</p>
            </div>
            <MdVerifiedUser className="absolute -bottom-4 -right-4 text-8xl text-white/20 transform rotate-12 group-hover:scale-110 transition-transform" />
          </div>

        </div>
      </div>
    </section>
  );
}