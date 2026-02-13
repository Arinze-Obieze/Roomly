'use client';
import { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import { BiUser, BiLogIn } from 'react-icons/bi';

// Configuration remains the same
const HEADER_CONFIG = {
  logo: {
    src: '/logo.jpg', 
    alt: 'Roomly',
    text: 'Roomly'
  },
  navItems: [
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'About', href: '/#about' },
    { label: 'Features', href: '/#features' },
    { label: 'Testimonials', href: '/#testimonials' },
  ],
  authButtons: {
    login: {
      text: 'Sign In',
      url: '/login'
    },
    getStarted: {
      text: 'Get Started',
      url: '/signup' 
    }
  }
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* 1. HEADER: Floating Dark Glass Panel */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-slate-900/50 border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            
            {/* Logo: White text for contrast */}
            <div className="flex items-center">
              <img src={HEADER_CONFIG.logo.src} alt={HEADER_CONFIG.logo.alt} className="h-8 w-auto rounded-sm" />
              <span className="ml-2 text-xl font-extrabold text-white tracking-tight">
                {HEADER_CONFIG.logo.text}
              </span>
            </div>

            {/* Desktop Navigation: Light text, Cyan hover */}
            <nav className="hidden md:flex space-x-10">
              {HEADER_CONFIG.navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-slate-300 hover:text-cyan-400 font-medium transition-colors duration-200 text-sm tracking-wide"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Desktop CTA Buttons: Primary Cyan Button */}
            <div className="hidden md:flex items-center space-x-4">
              <a
                href={HEADER_CONFIG.authButtons.login.url}
                className="flex items-center text-slate-300 hover:text-cyan-400 font-medium transition-colors duration-200 text-sm"
              >
                <BiLogIn className="mr-1" size={20} />
                {HEADER_CONFIG.authButtons.login.text}
              </a>
              <a
                href={HEADER_CONFIG.authButtons.getStarted.url}
                // Primary action: Cyan button with strong glow
                className="bg-cyan-500 text-slate-950 px-5 py-2.5 rounded-full font-bold hover:bg-cyan-400 transition-colors duration-200 text-sm shadow-xl shadow-cyan-500/30 transform hover:scale-[1.03]"
              >
                {HEADER_CONFIG.authButtons.getStarted.text}
              </a>
            </div>

            {/* Mobile Menu Button: White icon over dark background */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
      </header>
      
      {/* 2. MOBILE MENU: Solid Dark Slide-Out */}
      <div className={`
        fixed inset-0 z-40 md:hidden transition-all duration-300 ease-in-out
        ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
      `}>
        {/* Darkened backdrop */}
        <div 
          className="absolute inset-0 bg-slate-950/80 transition-opacity duration-300"
          onClick={() => setIsMenuOpen(false)}
        />
        {/* Slide-out Menu Panel (Solid Dark) */}
        <div className={`
          absolute right-0 top-0 h-full w-72 bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out
          ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center">
                <img src={HEADER_CONFIG.logo.src} alt={HEADER_CONFIG.logo.alt} className="h-8 w-auto rounded-md" />
                <span className="ml-2 text-xl font-bold text-white">{HEADER_CONFIG.logo.text}</span>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="text-slate-400 p-2 hover:text-cyan-400"
                aria-label="Close mobile menu"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <nav className="flex-1 p-6">
              <div className="space-y-2">
                {HEADER_CONFIG.navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="block py-3 px-4 text-base font-medium text-slate-200 rounded-lg hover:bg-slate-800 hover:text-cyan-400 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </nav>

            <div className="p-6 border-t border-white/10">
              <div className="space-y-3">
                <a
                  href={HEADER_CONFIG.authButtons.getStarted.url}
                  className="flex items-center justify-center w-full bg-cyan-500 text-slate-950 py-3 rounded-full font-bold hover:bg-cyan-400 transition-colors duration-200 text-base shadow-lg shadow-cyan-500/20"
                  onClick={() => setIsMenuOpen(false)}
                >
                    <BiUser className="mr-2" size={20} />
                  {HEADER_CONFIG.authButtons.getStarted.text}
                </a>
                <a
                  href={HEADER_CONFIG.authButtons.login.url}
                  className="flex items-center justify-center w-full text-slate-200 py-3 rounded-full font-medium border border-slate-700 hover:border-cyan-500 hover:text-cyan-400 transition-colors duration-200 text-base"
                  onClick={() => setIsMenuOpen(false)}
                >
                    <BiLogIn className="mr-2" size={20} />
                  {HEADER_CONFIG.authButtons.login.text}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}