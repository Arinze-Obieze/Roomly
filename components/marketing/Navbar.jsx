'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { MdMenu, MdClose } from 'react-icons/md';

export default function Navbar() {
  const { user } = useAuthContext();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Browse Rooms', href: '/rooms' },
    { label: 'Why Roomly', href: '#features' }, // Mapped to Features section
    { label: 'For Landlords', href: '#landlords' },
  ];

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100 py-3' : 'bg-white border-b border-transparent py-5'
    }`}>
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-sans font-extrabold text-2xl text-navy-950 tracking-tighter">Roomly<span className="text-terracotta-500">.</span></span>
        </Link>

        {/* NAVIGATION LINKS (Desktop) */}
        <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
                <Link 
                    key={link.label}
                    href={link.href} 
                    className="text-sm font-medium text-slate-600 hover:text-navy-950 transition-colors"
                >
                    {link.label}
                </Link>
            ))}
        </nav>

        {/* BUTTONS (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          {!user ? (
            <>
              <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-navy-950 px-2">
                Log In
              </Link>
              <Link 
                href="/signup" 
                className="bg-terracotta-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-terracotta-600 transition-all shadow-lg shadow-terracotta-500/20 active:scale-95"
              >
                Sign Up Free
              </Link>
            </>
          ) : (
            <Link 
                href="/dashboard" 
                className="bg-navy-950 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-navy-800 transition-all shadow-lg shadow-navy-900/10"
            >
                Dashboard
            </Link>
          )}
        </div>

        {/* MOBILE HAMBURGER */}
        <button 
          className="md:hidden p-2 text-slate-900"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <MdClose size={26} /> : <MdMenu size={26} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-slate-100 p-4 flex flex-col gap-4 shadow-xl md:hidden animate-in slide-in-from-top-2">
            {navLinks.map((link) => (
                <Link 
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium text-slate-900 py-3 border-b border-slate-50"
                >
                    {link.label}
                </Link>
            ))}
            
            <div className="flex flex-col gap-3 mt-2">
              {!user ? (
                <>
                  <Link href="/login" className="w-full text-center py-3 rounded-xl bg-slate-50 font-bold text-slate-900">Log In</Link>
                  <Link href="/signup" className="w-full text-center py-3 rounded-xl bg-terracotta-500 text-white font-bold shadow-lg shadow-terracotta-500/20">Sign Up Free</Link>
                </>
              ) : (
                 <Link href="/dashboard" className="w-full text-center py-3 rounded-xl bg-navy-950 text-white font-bold">Go to Dashboard</Link>
              )}
            </div>
        </div>
      )}
    </header>
  );
}
