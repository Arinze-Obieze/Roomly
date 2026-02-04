'use client';

import Link from 'next/link';
import { MdFlashOn, MdCheckCircle, MdThumbUp } from 'react-icons/md';

export default function CTASection() {
  return (
    <section className="py-20 lg:py-24 bg-linear-to-br from-terracotta-500 to-terracotta-600">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 text-center">
        
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Ready to Find Your Perfect Flatmate?
        </h2>
        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-12 font-medium">
            Join hundreds of Dublin renters who&apos;ve found better matches with Roomly&apos;s compatibility-first approach.
        </p>

        <div className="grid grid-cols-3 gap-2 md:gap-8 max-w-4xl mx-auto mb-12">
            <div className="text-white flex flex-col items-center">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl mb-2 md:mb-4 backdrop-blur-sm">
                    <MdFlashOn />
                </div>
                <div className="text-sm md:text-3xl font-bold mb-0.5 md:mb-1">2 MINS</div>
                <div className="text-[10px] md:text-base text-white/80 font-medium leading-tight">create profile</div>
            </div>
            <div className="text-white flex flex-col items-center">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl mb-2 md:mb-4 backdrop-blur-sm">
                    <MdThumbUp />
                </div>
                <div className="text-sm md:text-3xl font-bold mb-0.5 md:mb-1">87% AVG</div>
                <div className="text-[10px] md:text-base text-white/80 font-medium leading-tight">match score</div>
            </div>
            <div className="text-white flex flex-col items-center">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl mb-2 md:mb-4 backdrop-blur-sm">
                    <MdCheckCircle />
                </div>
                <div className="text-sm md:text-3xl font-bold mb-0.5 md:mb-1">100% FREE</div>
                <div className="text-[10px] md:text-base text-white/80 font-medium leading-tight">forever</div>
            </div>
        </div>

        <div className="flex flex-col items-center gap-6">
            <Link 
                href="/signup" 
                className="bg-white text-terracotta-600 px-10 py-4 rounded-xl text-xl font-bold hover:bg-slate-50 hover:scale-105 transition-all shadow-2xl shadow-terracotta-800/20"
            >
                Get Started Now →
            </Link>
            
            <p className="text-white/70 text-sm font-medium">
                No credit card • No hidden fees • Unsubscribe anytime
            </p>
            <p className="text-white/60 text-sm">
                Questions? Email us at <a href="mailto:hello@roomly.ie" className="underline hover:text-white">hello@roomly.ie</a>
            </p>
        </div>

      </div>
    </section>
  );
}