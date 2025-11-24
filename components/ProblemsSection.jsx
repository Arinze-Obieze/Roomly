import { FaRegClock, FaUsers, FaLock } from 'react-icons/fa';

const problems = [
  {
    icon: FaRegClock,
    title: 'The Time Sink',
    description: 'Traditional searching is a part-time job. You scroll through hundreds of profiles, only to find they are fundamentally incompatible.',
    accent: 'text-cyan-400',
    bg: 'bg-cyan-500/10'
  },
  {
    icon: FaUsers,
    title: 'The Personality Clash',
    description: 'Clean freak vs. Messy. Night owl vs. Early bird. These mismatches aren\'t just annoying; they destroy your quality of life.',
    accent: 'text-indigo-400',
    bg: 'bg-indigo-500/10'
  },
  {
    icon: FaLock,
    title: 'The Safety Gap',
    description: 'Facebook groups and Gumtree have zero vetting. You are essentially inviting a stranger into your sanctuary based on a profile picture.',
    accent: 'text-violet-400',
    bg: 'bg-violet-500/10'
  }
];

export default function ProblemsSection() {
  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden">

      {/* Background Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}></div>

      {/* Cool-toned glow (matches the Hecyanction theme) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            The rental market is <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">broken.</span>
          </h2>

          <p className="text-lg text-slate-400">
            Current platforms were built for listing properties, not matching people. This creates three critical failures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <div 
              key={index} 
              className="group relative p-8 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:-translate-y-2"
            >
              {/* Icon Container */}
              <div className={`w-14 h-14 rounded-2xl ${problem.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <problem.icon className={`text-2xl ${problem.accent}`} />
              </div>

              <h3 className="text-xl font-bold text-white mb-3">
                {problem.title}
              </h3>

              <p className="text-slate-400 leading-relaxed">
                {problem.description}
              </p>

              {/* Hover border (dynamic color still works) */}
              <div className={`absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-current transition-colors pointer-events-none`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
