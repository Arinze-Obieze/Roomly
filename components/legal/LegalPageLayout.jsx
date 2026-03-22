'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LegalPageLayout({ children, title, lastUpdated, icon }) {
  const pathname = usePathname();

  const links = [
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'GDPR Compliance', href: '/gdpr' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-12 md:py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 items-start">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 p-6 sticky top-24 bg-white rounded-3xl shadow-xl shadow-navy-950/5 border border-navy-100 hidden md:block z-10">
          <h2 className="text-xl font-heading font-bold text-navy-950 mb-6">Legal Focus</h2>
          <nav className="flex flex-col gap-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-sans font-medium hover:bg-slate-50 ${
                    isActive ? 'bg-terracotta-50 text-terracotta-600' : 'text-navy-700'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="active-dot-desktop" 
                      className="absolute left-1 w-1.5 h-1.5 bg-terracotta-500 rounded-full" 
                    />
                  )}
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation Dropdown/Tabs */}
        <div className="w-full md:hidden bg-white p-4 rounded-2xl shadow-sm border border-navy-100 overflow-x-auto z-10">
          <nav className="flex items-center gap-2 min-w-max">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`relative px-4 py-2.5 rounded-xl transition-colors font-sans font-medium whitespace-nowrap ${
                    isActive ? 'bg-terracotta-50 text-terracotta-600' : 'text-navy-700 hover:bg-slate-50'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="active-dot-mobile" 
                      className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-terracotta-500 rounded-full" 
                    />
                  )}
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full bg-white rounded-[40px] shadow-xl shadow-navy-950/5 border border-navy-100 p-8 md:p-12 lg:p-16 relative overflow-hidden">
          {/* subtle decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <div className="relative flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-10 pb-10 border-b border-navy-100 z-10">
            {icon && (
              <div className="w-16 h-16 bg-terracotta-50 text-terracotta-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-terracotta-100">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-navy-950 tracking-tight">{title}</h1>
              {lastUpdated && (
                <p className="text-navy-500 font-sans font-medium mt-2">Last Updated: {lastUpdated}</p>
              )}
            </div>
          </div>
          
          <div className="relative prose prose-slate max-w-none text-navy-700 
            prose-headings:font-heading prose-headings:font-bold prose-headings:text-navy-950 
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:leading-relaxed prose-p:mb-6
            prose-a:text-terracotta-600 hover:prose-a:text-terracotta-500 prose-a:font-medium prose-a:underline-offset-4
            prose-li:text-navy-700 prose-li:my-2
            prose-strong:text-navy-900 prose-strong:font-bold z-10">
            {children}
          </div>
        </div>
        
      </div>
    </div>
  );
}
