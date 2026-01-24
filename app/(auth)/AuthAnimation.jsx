'use client';
import { motion } from 'framer-motion';

const FloatingNode = ({ delay, duration, x, y, scale = 1 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0.4, 1, 0.4],
      scale: [scale, scale * 1.2, scale],
      x: x,
      y: y,
    }}
    transition={{
      duration: duration,
      repeat: Infinity,
      delay: delay,
      ease: "easeInOut"
    }}
    className="absolute w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.6)]"
  />
);

const ConnectionLine = ({ x1, y1, x2, y2, delay }) => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
    <motion.line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="url(#gradient-line)"
      strokeWidth="2"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 0.5, 0.5, 0] }}
      transition={{
        duration: 4,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut",
        times: [0, 0.4, 0.6, 1]
      }}
    />
    <defs>
      <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="rgba(34, 211, 238, 0)" />
        <stop offset="50%" stopColor="rgba(34, 211, 238, 0.8)" />
        <stop offset="100%" stopColor="rgba(129, 140, 248, 0)" />
      </linearGradient>
    </defs>
  </svg>
);

const ProfileCard = ({ img, name, role, className, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.8 }}
    className={`absolute p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-4 w-64 ${className}`}
  >
    <div className="relative">
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-400">
        <img src={img} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
    <div>
      <h3 className="text-white font-bold text-sm">{name}</h3>
      <p className="text-cyan-200 text-xs">{role}</p>
    </div>
  </motion.div>
);

export default function AuthAnimation() {
  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden flex items-center justify-center">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900" />
      
      {/* Animated Mesh Grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

      {/* Floating Network Nodes */}
      <div className="absolute inset-0">
        <FloatingNode delay={0} duration={4} x="20%" y="20%" />
        <FloatingNode delay={1} duration={5} x="80%" y="30%" scale={1.5} />
        <FloatingNode delay={2} duration={6} x="50%" y="80%" />
        <FloatingNode delay={0.5} duration={4.5} x="10%" y="60%" scale={0.8} />
        <FloatingNode delay={1.5} duration={5.5} x="90%" y="70%" />
        
        {/* Dynamic Connections */}
        <ConnectionLine x1="20%" y1="20%" x2="80%" y="30%" delay={0} />
        <ConnectionLine x1="80%" y1="30%" x2="50%" y="80%" delay={1} />
        <ConnectionLine x1="50%" y1="80%" x2="10%" y="60%" delay={2} />
        <ConnectionLine x1="20%" y1="20%" x2="50%" y="50%" delay={0.5} />
      </div>

      {/* Central Content */}
      <div className="relative z-10 w-full h-full max-w-lg mx-auto flex flex-col justify-center items-center">
        {/* Main Badge */}
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ duration: 1 }}
           className="relative mb-20"
        >
           <div className="absolute inset-0 bg-cyan-500 blur-[80px] opacity-20 animate-pulse" />
           <div className="relative w-32 h-32 rounded-3xl bg-linear-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 transform rotate-3">
              <span className="text-5xl font-bold text-white">HS</span>
           </div>
           {/* Decor elements */}
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             className="absolute -inset-4 border border-dashed border-white/20 rounded-full" 
           />
        </motion.div>

        {/* Floating Profile Cards */}
        <ProfileCard 
          img="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
          name="Sarah Jenkins"
          role="Looking in Dublin 4"
          className="-translate-x-32 -translate-y-12"
          delay={0.5}
        />
        <ProfileCard 
          img="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80"
          name="Michael Chen"
          role="Has a room in Cork"
          className="translate-x-32 translate-y-8"
          delay={0.8}
        />

        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="text-4xl font-bold text-center mt-12 text-white leading-tight"
        >
          Find your perfect <br/>
          <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-indigo-300">
            living match
          </span>
        </motion.h2>
      </div>
    </div>
  );
}
