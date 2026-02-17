'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const FloatingOrb = ({ color, size, delay, duration, initialPos, moveRange }) => {
  return (
    <motion.div
      initial={{ x: initialPos.x, y: initialPos.y, opacity: 0 }}
      animate={{
        x: [initialPos.x, initialPos.x + moveRange.x, initialPos.x - moveRange.x, initialPos.x],
        y: [initialPos.y, initialPos.y - moveRange.y, initialPos.y + moveRange.y, initialPos.y],
        opacity: [0.2, 0.6, 0.3, 0.2],
        scale: [1, 1.2, 0.9, 1],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut"
      }}
      className="absolute rounded-full blur-3xl"
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: `0 0 80px ${color}`,
      }}
    />
  );
};

const SearchBar = () => (
  <motion.div
    initial={{ y: 50, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.8, duration: 0.8 }}
    className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4"
  >
    <div className="relative">
      <input
        type="text"
        placeholder="Search rooms in Dublin, Cork, Galway..."
        className="w-full px-8 py-5 bg-white/5 backdrop-blur-xl border border-[#FF6B6B]/20 rounded-2xl text-white placeholder:text-[#627D98] focus:outline-none focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 transition-all"
        style={{ fontFamily: 'var(--font-sans)', borderColor: 'rgba(255, 107, 107, 0.2)', color: 'white' }}
      />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#FF6B6B] text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2"
        style={{ fontFamily: 'var(--font-heading)', background: 'var(--color-terracotta-500)' }}
      >
        <span>Find Room</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </motion.button>
    </div>
  </motion.div>
);

const StatCard = ({ icon, value, label, color, delay }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay, type: "spring", stiffness: 260, damping: 20 }}
    className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10"
    style={{ boxShadow: `0 10px 30px -10px ${color}` }}
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
        <span className="text-xl">{icon}</span>
      </div>
      <div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.3 }}
          className="text-2xl font-bold text-white"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {value}
        </motion.div>
        <div className="text-sm text-[#bcccdc]" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-navy-200)' }}>{label}</div>
      </div>
    </div>
  </motion.div>
);

const RoomCard = ({ image, title, price, rating, match, delay, position }) => {
  return (
    <motion.div
      initial={{ x: position.x, y: position.y, opacity: 0, rotate: position.rotate }}
      animate={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
      transition={{
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15,
        mass: 1
      }}
      whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
      className="absolute w-64 bg-[#020617]/80 backdrop-blur-xl rounded-3xl overflow-hidden border border-[#FF6B6B]/20 shadow-2xl"
      style={{
        boxShadow: '0 20px 40px -15px var(--color-terracotta-500)',
        borderColor: 'rgba(255, 107, 107, 0.2)',
        background: 'rgba(2, 6, 23, 0.8)'
      }}
    >
      <div className="relative h-32 overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2 bg-[#FF6B6B] text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1" style={{ background: 'var(--color-terracotta-500)' }}>
          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
          {match}% match
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
        <p className="text-[#4ECDC4] text-sm font-semibold" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-navy-400)' }}>{price}/month</p>
        <div className="flex items-center gap-1 mt-2">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={i < rating ? "text-[#FFE66D]" : "text-[#627D98]"} style={{ color: i < rating ? 'var(--color-yellow-400)' : 'var(--color-navy-600)' }}>★</span>
          ))}
          <span className="text-[#bcccdc] text-xs ml-2" style={{ color: 'var(--color-navy-200)' }}>{rating}.0</span>
        </div>
      </div>
    </motion.div>
  );
};

const AnimatedDot = () => (
  <motion.div
    animate={{
      scale: [1, 1.5, 1],
      opacity: [0.5, 1, 0.5],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className="relative"
  >
    <div className="w-3 h-3 bg-[#FF6B6B] rounded-full" style={{ background: 'var(--color-terracotta-500)' }} />
    <motion.div
      animate={{
        scale: [1, 2, 1],
        opacity: [0.5, 0, 0.5],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute inset-0 w-3 h-3 bg-[#FF6B6B] rounded-full"
      style={{ background: 'var(--color-terracotta-500)' }}
    />
  </motion.div>
);

const FeaturePillar = ({ icon, title, description, color, delay }) => (
  <motion.div
    initial={{ y: 50, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay, duration: 0.6 }}
    className="flex-1 text-center"
  >
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl"
      style={{ background: `${color}20`, color: color }}
    >
      {icon}
    </motion.div>
    <h3 className="text-white font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
    <p className="text-[#bcccdc] text-sm" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-navy-200)' }}>{description}</p>
  </motion.div>
);

export default function RoomFindAnimation() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      setMousePosition({
        x: (clientX - innerWidth / 2) / 50,
        y: (clientY - innerHeight / 2) / 50,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#020617] overflow-hidden">
      {/* Animated gradient orbs */}
      <FloatingOrb
        color="var(--color-terracotta-500)"
        size="300px"
        delay={0}
        duration={20}
        initialPos={{ x: -100, y: -100 }}
        moveRange={{ x: 200, y: 150 }}
      />
      <FloatingOrb
        color="var(--color-navy-500)"
        size="250px"
        delay={2}
        duration={18}
        initialPos={{ x: 1200, y: 400 }}
        moveRange={{ x: -180, y: -120 }}
      />
      <FloatingOrb
        color="var(--color-yellow-400)"
        size="200px"
        delay={4}
        duration={22}
        initialPos={{ x: 600, y: 700 }}
        moveRange={{ x: 150, y: -200 }}
      />

      {/* Parallax grid */}
      <motion.div
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 30 }}
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, ${'var(--color-terracotta-500)'} 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          opacity: 0.15,
        }}
      />

      {/* Main content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4">
        {/* Logo with animated dot */}
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="flex items-center gap-2 mb-8"
        >
          <h1 className="text-6xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            ROOM
          </h1>
          <h1 className="text-6xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            FIND
          </h1>
          <div className="ml-2">
            <AnimatedDot />
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[#bcccdc] text-xl mb-12 flex items-center gap-2"
          style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-navy-200)' }}
        >
          <span>Search over.</span>
          <span className="text-[#FF6B6B] font-semibold" style={{ color: 'var(--color-terracotta-500)' }}>You found it.</span>
          <span className="w-1.5 h-1.5 bg-[#FF6B6B] rounded-full" style={{ background: 'var(--color-terracotta-500)' }} />
        </motion.p>

        {/* Feature pillars */}
        <div className="flex gap-8 max-w-3xl w-full mb-16">
          <FeaturePillar
            icon="🔍"
            title="Smart Search"
            description="AI-powered room matching"
            color="var(--color-terracotta-500)"
            delay={0.4}
          />
          <FeaturePillar
            icon="✓"
            title="Verified"
            description="All listings are verified"
            color="var(--color-navy-500)"
            delay={0.6}
          />
          <FeaturePillar
            icon="⭐"
            title="Top Rated"
            description="Real reviews from tenants"
            color="var(--color-yellow-400)"
            delay={0.8}
          />
        </div>

        {/* Stats cards */}
        <div className="flex gap-4 mb-20">
          <StatCard icon="🏠" value="10k+" label="Active rooms" color="var(--color-terracotta-500)" delay={1} />
          <StatCard icon="👥" value="5k+" label="Happy tenants" color="var(--color-navy-500)" delay={1.2} />
          <StatCard icon="⭐" value="4.8" label="Average rating" color="var(--color-yellow-400)" delay={1.4} />
        </div>

        {/* Room cards */}
        <RoomCard
          image="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=300&q=80"
          title="Modern Studio, Dublin 2"
          price="€1,450"
          rating={5}
          match={98}
          delay={0.5}
          position={{ x: -400, y: -100, rotate: -15 }}
        />
        
        <RoomCard
          image="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=300&q=80"
          title="Cozy Room, Cork City"
          price="€850"
          rating={4}
          match={95}
          delay={0.7}
          position={{ x: 400, y: 100, rotate: 15 }}
        />
        
        <RoomCard
          image="https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=300&q=80"
          title="Shared Apt, Galway"
          price="€650"
          rating={4}
          match={92}
          delay={0.9}
          position={{ x: -350, y: 200, rotate: 10 }}
        />

        {/* Search bar */}
        <SearchBar />

        {/* Floating trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="absolute top-8 right-8 flex gap-2"
        >
          <div className="bg-[#4ECDC4]/10 backdrop-blur-xl rounded-full px-4 py-2 border border-[#4ECDC4]/30" style={{ background: 'rgba(72, 101, 129, 0.1)', borderColor: 'rgba(72, 101, 129, 0.3)' }}>
            <span className="text-[#4ECDC4] text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--color-navy-300)' }}>
              <span>✓</span> Verified by RoomFind
            </span>
          </div>
          <div className="bg-[#FF6B6B]/10 backdrop-blur-xl rounded-full px-4 py-2 border border-[#FF6B6B]/30" style={{ background: 'rgba(255, 107, 107, 0.1)', borderColor: 'rgba(255, 107, 107, 0.3)' }}>
            <span className="text-[#FF6B6B] text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--color-terracotta-500)' }}>
              <span>⚡</span> Instant match
            </span>
          </div>
        </motion.div>

        {/* Decorative elements */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -left-20 w-64 h-64 border border-[#FF6B6B]/20 rounded-full"
          style={{ borderColor: 'rgba(255, 107, 107, 0.2)' }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 -right-32 w-96 h-96 border border-[#4ECDC4]/20 rounded-full"
          style={{ borderColor: 'rgba(72, 101, 129, 0.2)' }}
        />
      </div>
    </div>
  );
}