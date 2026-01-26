'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { MdAdd, MdMenu, MdClose } from 'react-icons/md';

export default function PublicHeader() {
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

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 py-3' : 'bg-white border-b border-transparent py-5'
    }`}>
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            R
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">Roomly</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
           <Link href="/rooms" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Find a Room</Link>
           <Link href="/how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">How it Works</Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {!user ? (
            <>
              <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
                Log In
              </Link>
              <Link 
                href="/signup" 
                className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-md active:scale-95"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <Link 
                href="/dashboard" 
                className="bg-slate-100 text-slate-900 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-200 transition-all"
            >
                Go to Dashboard
            </Link>
          )}

          <div className="h-6 w-px bg-slate-200 mx-1"></div>

          <button 
            onClick={() => router.push(user ? '/listings/new' : '/login')}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-cyan-600 transition-colors"
          >
            <MdAdd size={20} />
            List Your Room
          </button>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-slate-600"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-4 flex flex-col gap-4 shadow-xl md:hidden animate-in slide-in-from-top-2">
            <Link href="/rooms" className="text-base font-medium text-slate-700 py-2 border-b border-slate-50">Find a Room</Link>
            <Link href="/how-it-works" className="text-base font-medium text-slate-700 py-2 border-b border-slate-50">How it Works</Link>
            
            <div className="flex flex-col gap-3 mt-2">
              {!user ? (
                <>
                  <Link href="/login" className="w-full text-center py-3 rounded-xl bg-slate-100 font-semibold text-slate-900">Log In</Link>
                  <Link href="/signup" className="w-full text-center py-3 rounded-xl bg-cyan-600 text-white font-bold shadow-lg shadow-cyan-200">Sign Up</Link>
                </>
              ) : (
                 <Link href="/dashboard" className="w-full text-center py-3 rounded-xl bg-slate-900 text-white font-bold">Go to Dashboard</Link>
              )}
              <button 
                onClick={() => router.push(user ? '/listings/new' : '/login')}
                 className="w-full text-center py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold mt-2"
              >
                List Your Room
              </button>
            </div>
        </div>
      )}
    </header>
  );
}
