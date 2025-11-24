'use client';
import { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

const navItems = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'Testimonials', href: '#testimonials' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Main Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            
            {/* Logo */}
            <div className="flex items-center">
              <img src="/logo.jpg" alt="Roomly" className="h-8 w-auto" />
              <span className="ml-2 text-xl font-bold text-primary">Roomly</span>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-text hover:text-primary font-medium transition-colors duration-200"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Desktop CTA Buttons - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="text-text hover:text-primary font-medium transition-colors duration-200">
                Sign In
              </button>
              <button className="bg-primary text-white px-6 py-2 rounded-full font-medium hover:opacity-90 transition-opacity duration-200">
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button - Hidden on desktop */}
            <button
              className="md:hidden text-text p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`
        fixed inset-0 z-40 md:hidden transition-all duration-300 ease-in-out
        ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
      `}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsMenuOpen(false)}
        />
        
        {/* Sidebar Panel */}
        <div className={`
          absolute right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
          ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center">
                <img src="/logo.jpg" alt="Roomly" className="h-8 w-auto" />
                <span className="ml-2 text-xl font-bold text-primary">Roomly</span>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="text-text p-2"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 p-6">
              <div className="space-y-4">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="block py-3 text-lg font-medium text-text hover:text-primary transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </nav>

            {/* Mobile CTA Buttons */}
            <div className="p-6 border-t border-border">
              <div className="space-y-4">
                <button className="w-full bg-primary text-white py-3 rounded-full font-medium hover:opacity-90 transition-opacity duration-200">
                  Get Started
                </button>
                <button className="w-full text-text py-3 rounded-full font-medium border border-border hover:border-primary transition-colors duration-200">
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}