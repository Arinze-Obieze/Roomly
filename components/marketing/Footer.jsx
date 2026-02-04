'use client';

import React from 'react';
import Link from 'next/link';
import { FaInstagram, FaTwitter, FaLinkedin, FaFacebook } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Column 1: Brand */}
          <div className="space-y-6">
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
          <div>
            <h4 className="font-bold text-navy-950 text-sm uppercase tracking-wider mb-6">Platform</h4>
            <ul className="space-y-4 text-slate-600 font-medium">
              <li><Link href="/" className="hover:text-terracotta-500 transition-colors">Home</Link></li>
              <li><Link href="#how-it-works" className="hover:text-terracotta-500 transition-colors">How It Works</Link></li>
              <li><Link href="/rooms" className="hover:text-terracotta-500 transition-colors">Browse Rooms</Link></li>
              <li><Link href="#features" className="hover:text-terracotta-500 transition-colors">Why Roomly</Link></li>
              <li><Link href="#landlords" className="hover:text-terracotta-500 transition-colors">For Landlords</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h4 className="font-bold text-navy-950 text-sm uppercase tracking-wider mb-6">Legal</h4>
            <ul className="space-y-4 text-slate-600 font-medium">
              <li><Link href="/terms" className="hover:text-terracotta-500 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-terracotta-500 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/cookies" className="hover:text-terracotta-500 transition-colors">Cookie Policy</Link></li>
              <li><Link href="/gdpr" className="hover:text-terracotta-500 transition-colors">GDPR Compliance</Link></li>
            </ul>
          </div>

          {/* Column 4: Support */}
          <div>
            <h4 className="font-bold text-navy-950 text-sm uppercase tracking-wider mb-6">Support</h4>
            <div className="space-y-4 text-slate-600 font-medium">
              <p>Have questions?</p>
              <a href="mailto:hello@roomly.ie" className="inline-block text-terracotta-500 font-bold text-lg hover:underline decoration-2">
                hello@roomly.ie
              </a>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4 text-sm">
                <p className="font-bold text-navy-950 mb-1">Response time:</p>
                <p>Within 24 hours</p>
                <div className="h-px bg-slate-200 my-2"></div>
                <p className="font-bold text-navy-950 mb-1">Hours:</p>
                <p>Mon-Fri, 9am-6pm GMT</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Footer Bar */}
      <div className="bg-navy-950 py-8 px-6 text-center md:text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm font-medium">
                © {currentYear} Roomly Technologies Ltd. Registered in Ireland.
            </p>
            <div className="flex items-center gap-6 text-sm font-bold text-slate-400">
                <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
                <span className="flex items-center gap-1 text-slate-500 font-medium">
                    Made with <span className="text-red-500">❤️</span> in Dublin
                </span>
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