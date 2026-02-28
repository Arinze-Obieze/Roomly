'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MdCheckCircle } from 'react-icons/md';

export default function HeroSection() {
  return (
    <section className="relative w-full pt-16 pb-20 lg:pt-24 lg:pb-32 bg-white overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                
                {/* LEFT CONTENT */}
                <div className="flex-1 max-w-2xl lg:max-w-none text-center lg:text-left">
                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-navy-950 tracking-tight leading-[1.1] mb-6">
                        Find Flatmates You&apos;ll <span className="text-terracotta-500">Actually</span> Get Along With
                    </h1>
                    
                    <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                        See your compatibility score with every roommate <span className="font-bold text-navy-900">BEFORE</span> you message them. 
                        Match on lifestyle, not just location. Find your perfect home in Dublin.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
                        <Link 
                            href="/signup" 
                            className="w-full sm:w-auto px-8 py-4 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-bold text-lg transition-all shadow-xl shadow-terracotta-500/20 hover:-translate-y-1"
                        >
                            Find Your Perfect Room →
                        </Link>
                        <Link 
                            href="/rooms" 
                            className="text-terracotta-500 font-bold hover:text-terracotta-600 underline underline-offset-4 decoration-2"
                        >
                            or browse rooms without signing up
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-2 gap-y-3 gap-x-6 text-sm font-medium text-slate-500 max-w-md mx-auto lg:mx-0 text-left">
                        <div className="flex items-center gap-2">
                            <MdCheckCircle className="text-emerald-500 text-lg shrink-0" />
                            100% free to use
                        </div>
                        <div className="flex items-center gap-2">
                            <MdCheckCircle className="text-emerald-500 text-lg shrink-0" />
                            Verified profiles only
                        </div>
                        <div className="flex items-center gap-2">
                            <MdCheckCircle className="text-emerald-500 text-lg shrink-0" />
                            87% avg. compatibility match
                        </div>
                        <div className="flex items-center gap-2">
                            <MdCheckCircle className="text-emerald-500 text-lg shrink-0" />
                            Secure messaging built-in
                        </div>
                    </div>
                </div>

                {/* RIGHT VISUAL (Mockup) */}
                <div className="flex-1 w-full max-w-lg lg:max-w-none relative animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    <div className="relative z-10 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
                        {/* Fake Listing Header */}
                        <div className="h-48 bg-slate-200 relative mb-4 overflow-hidden">
                            <img 
                                src="/images/rooms/room.jpeg" 
                                alt="Room in Dublin 2" 
                                className="w-full h-full object-cover absolute inset-0"
                            />
                            <div className="absolute bottom-4 left-4">
                                <span className="bg-navy-950 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
                                    private room
                                </span>
                            </div>
                        </div>

                        <div className="p-6 pt-2">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-navy-950">Room in Dublin 2</h3>
                                    <p className="text-slate-500 font-medium">€750/month</p>
                                </div>
                                <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold border border-emerald-100 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    92% Match
                                </div>
                            </div>
                            
                            <hr className="border-slate-100 mb-4" />
                            
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Cleanliness</span>
                                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                                        <MdCheckCircle /> Perfect match
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Social Level</span>
                                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                                        <MdCheckCircle /> Great match
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Schedule</span>
                                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                                        <MdCheckCircle /> Excellent match
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Pets</span>
                                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                                        <MdCheckCircle /> No pets (both)
                                    </span>
                                </div>
                            </div>

                            <button className="w-full py-3 bg-navy-50 text-navy-900 font-bold rounded-xl hover:bg-navy-100 transition-colors">
                                View Full Profile →
                            </button>
                        </div>
                    </div>

                    {/* Decorative Blob */}
                    <div className="absolute -top-10 -right-10 w-72 h-72 bg-terracotta-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 -z-10 animate-pulse"></div>
                    <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 -z-10 animate-pulse delay-700"></div>
                </div>
            </div>
        </div>

        {/* QUICK STATS BAR */}
        <div className="mt-12 md:mt-20 border-t border-slate-100 bg-slate-50/50">
            <div className="w-full max-w-7xl mx-auto px-2 md:px-12 py-6 md:py-8">
                <div className="grid grid-cols-3 divide-x divide-slate-200 text-center">
                    <div className="px-1 md:px-4">
                        <div className="text-lg md:text-3xl font-bold text-navy-950 mb-0.5 md:mb-1">Live Now</div>
                        <div className="text-[9px] md:text-sm font-medium text-slate-500 uppercase tracking-wide md:tracking-widest leading-tight">Active Rooms in Dublin</div>
                    </div>
                    <div className="px-1 md:px-4">
                        <div className="text-lg md:text-3xl font-bold text-terracotta-500 mb-0.5 md:mb-1">87%</div>
                        <div className="text-[9px] md:text-sm font-medium text-slate-500 uppercase tracking-wide md:tracking-widest leading-tight">Avg. Match Score</div>
                    </div>
                    <div className="px-1 md:px-4">
                        <div className="text-lg md:text-3xl font-bold text-navy-950 mb-0.5 md:mb-1">Under 2h</div>
                        <div className="text-[9px] md:text-sm font-medium text-slate-500 uppercase tracking-wide md:tracking-widest leading-tight">Avg. Response Time</div>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
}
