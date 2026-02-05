'use client';

import React from 'react';
import Link from 'next/link';
import { FaInstagram, FaTwitter, FaLinkedin, FaFacebook } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerData = {
    platform: [
      { label: "Home", href: "/" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Browse Rooms", href: "/rooms" },
      { label: "Why Roomly", href: "#features" },
      { label: "For Landlords", href: "#landlords" },
    ],
    legal: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "GDPR Compliance", href: "/gdpr" },
    ],
    support: {
        email: "hello@roomfind.ie",
        response: "Within 24 hours",
        hours: "Mon-Fri, 9am-6pm GMT"
    }
  };

  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="w-full max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Column 1: Brand */}
          <div className="col-span-2 md:col-span-1 space-y-6">
            <Link href="/" className="inline-block group">
              <span className="font-sans font-extrabold text-2xl text-navy-950 tracking-tighter">Roomly<span className="text-terracotta-500">.</span></span>
            </Link>
            <p className="text-slate-600 leading-relaxed font-medium">
              Intelligent roommate matching for harmonious homes in Ireland.
            </p>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
               <span>Built in Dublin</span>
               <span className="text-xl">🇮🇪</span>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <SocialLink href="#" icon={<FaInstagram size={20} />} />
              <SocialLink href="#" icon={<FaTwitter size={20} />} />
              <SocialLink href="#" icon={<FaLinkedin size={20} />} />
            </div>
          </div>

          {/* Column 2: Platform */}
          <div className="col-span-1">
            <h4 className="font-bold text-navy-950 text-sm uppercase tracking-wider mb-6">Platform</h4>
            <ul className="space-y-4 text-slate-600 font-medium">
              {footerData.platform.map((link, i) => (
                <li key={i}>
                    <Link href={link.href} className="hover:text-terracotta-500 transition-colors">
                        {link.label}
                    </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="col-span-1">
            <h4 className="font-bold text-navy-950 text-sm uppercase tracking-wider mb-6">Legal</h4>
            <ul className="space-y-4 text-slate-600 font-medium">
              {footerData.legal.map((link, i) => (
                <li key={i}>
                    <Link href={link.href} className="hover:text-terracotta-500 transition-colors">
                        {link.label}
                    </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Support */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-bold text-navy-950 text-sm uppercase tracking-wider mb-6">Support</h4>
            <div className="space-y-4 text-slate-600 font-medium">
              <p>Have questions?</p>
              <a href={`mailto:${footerData.support.email}`} className="inline-block text-terracotta-500 font-bold text-lg hover:underline decoration-2">
                {footerData.support.email}
              </a>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4 text-sm">
                <p className="font-bold text-navy-950 mb-1">Response time:</p>
                <p>{footerData.support.response}</p>
                <div className="h-px bg-slate-200 my-2"></div>
                <p className="font-bold text-navy-950 mb-1">Hours:</p>
                <p>{footerData.support.hours}</p>
              </div>
            </div>
          </div>

        </div>
      </div>

     
    </footer>
  );
}

function SocialLink({ href, icon }) {
  return (
    <a 
      href={href} 
      className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-terracotta-500 hover:text-white transition-all duration-300"
    >
      {icon}
    </a>
  );
}