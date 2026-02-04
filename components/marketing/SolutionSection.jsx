'use client';

import { MdCleaningServices, MdPeople, MdVolumeUp, MdSmokeFree, MdPets, MdSchedule, MdCheckCircle, MdWarning } from 'react-icons/md';
import Link from 'next/link';

export default function SolutionSection() {
  return (
    <section className="py-20 lg:py-32 bg-white overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
        
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-navy-950 mb-6">
                Match on What <span className="text-terracotta-500">Actually</span> Matters
            </h2>
            <p className="text-lg md:text-xl text-slate-600">
                Roomly&apos;s 6-factor compatibility algorithm shows you exactly how well you&apos;ll get along <span className="font-bold">BEFORE</span> you message them.
            </p>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-16 lg:gap-24">
            
            {/* LEFT: VISUAL (Mockup) */}
            <div className="flex-1 w-full relative">
                <div className="absolute inset-0 bg-terracotta-50 rounded-[3rem] transform -rotate-3 scale-[0.95] -z-10"></div>
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden transform rotate-0 hover:rotate-1 transition-transform duration-700">
                    
                    {/* Mock Profile Header */}
                    <div className="bg-navy-950 p-8 text-white">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-bold">Sarah M., 26</h3>
                                <p className="text-slate-300">Room in Dublin 4 • €850/month</p>
                            </div>
                            <div className="w-16 h-16 rounded-full bg-slate-700 border-2 border-white"></div>
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                            <div>
                                <div className="text-xs uppercase tracking-wider font-bold text-terracotta-300 mb-1">Your Compatibility</div>
                                <div className="text-3xl font-bold text-white">87%</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-emerald-400 flex items-center justify-end gap-1">
                                    <MdCheckCircle /> Great match!
                                </div>
                                <div className="text-xs text-slate-400">Based on 6 factors</div>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown List */}
                    <div className="p-8 space-y-6 bg-white">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Lifestyle Breakdown</div>
                        
                        {[
                            { 
                              icon: MdCleaningServices, 
                              colorClass: "bg-emerald-50 text-emerald-600",
                              title: "Cleanliness", 
                              badge: "+30 pts", 
                              badgeClass: "bg-emerald-100 text-emerald-700",
                              desc: "Excellent match. You're both very tidy." 
                            },
                            { 
                              icon: MdPeople, 
                              colorClass: "bg-emerald-50 text-emerald-600",
                              title: "Social Level", 
                              badge: "+18 pts", 
                              badgeClass: "bg-emerald-100 text-emerald-700",
                              desc: "Great match. Both enjoy quiet evenings." 
                            },
                            { 
                              icon: MdVolumeUp, 
                              colorClass: "bg-amber-50 text-amber-600",
                              title: "Noise Tolerance", 
                              badge: "-8 pts", 
                              badgeClass: "bg-amber-100 text-amber-700",
                              desc: "Slight difference. You prefer quiet, Sarah is flexible." 
                            }
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.colorClass}`}>
                                    <item.icon />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-navy-950">{item.title}</span>
                                        <span className={`${item.badgeClass} text-xs font-bold px-2 py-0.5 rounded-full`}>{item.badge}</span>
                                    </div>
                                    <p className="text-sm text-slate-500">{item.desc}</p>
                                </div>
                            </div>
                        ))}

                         <div className="mt-8 pt-6 border-t border-slate-100">
                            <div className="flex gap-4">
                                <button className="flex-1 bg-terracotta-500 text-white py-3 rounded-xl font-bold hover:bg-terracotta-600 transition-colors">
                                    Send Message
                                </button>
                                <button className="px-6 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">
                                    Save
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* RIGHT: 6 FACTORS */}
            <div className="flex-1">
                <div className="mb-10">
                    <h3 className="text-2xl font-bold text-navy-950 mb-2">We match you on 6 key factors:</h3>
                    <div className="h-1 w-20 bg-terracotta-500 rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-8">
                    {[
                        { icon: MdCleaningServices, title: 'Cleanliness', desc: 'Very tidy, moderately clean, or relaxed about mess?' },
                        { icon: MdPeople, title: 'Social Level', desc: 'Homebody, occasionally social, or love hosting?' },
                        { icon: MdVolumeUp, title: 'Noise Tolerance', desc: 'Need complete silence or don\'t mind background noise?' },
                        { icon: MdSmokeFree, title: 'Smoking', desc: 'Non-smoker, smoke outside only, or smoker?' },
                        { icon: MdPets, title: 'Pets', desc: 'No pets, love pets, or allergic?' },
                        { icon: MdSchedule, title: 'Schedule', desc: 'Early bird, regular 9-5, or night owl?' },
                    ].map((f, i) => (
                        <div key={i} className="flex gap-4">
                            <div className="mt-1">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-terracotta-500">
                                    <f.icon size={24} />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-navy-950 mb-2">{f.title}</h4>
                                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 p-8 bg-slate-50 rounded-3xl border border-slate-100">
                    <h4 className="font-bold text-navy-950 mb-4">How we calculate your score:</h4>
                    <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                        Every factor is weighted by importance based on roommate compatibility data. 
                        Our algorithm calculates your total match from 0-100%.
                    </p>
                    
                    <div className="space-y-3">
                        {[
                            { color: "bg-emerald-500", textClass: "text-emerald-600", label: "90%+", desc: "= Excellent match" },
                            { color: "bg-emerald-400", textClass: "text-emerald-500", label: "80-89%", desc: "= Great match" },
                            { color: "bg-yellow-400", textClass: "text-yellow-600", label: "70-79%", desc: "= Good match" },
                            { color: "bg-red-400", textClass: "text-red-500", label: "< 70%", desc: "= Proceed with caution" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm font-bold">
                                <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                                <span className={`w-16 ${item.textClass}`}>{item.label}</span>
                                <span className="text-slate-700">{item.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-10">
                    <Link 
                        href="/signup" 
                        className="inline-flex items-center gap-2 text-lg font-bold text-terracotta-500 hover:text-terracotta-600 hover:gap-3 transition-all"
                    >
                        See Your Matches Now <span className="text-xl">→</span>
                    </Link>
                </div>

            </div>

        </div>
      </div>
    </section>
  );
}
