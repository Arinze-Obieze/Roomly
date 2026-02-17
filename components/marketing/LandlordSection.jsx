'use client';

import { MdCheckCircle, MdArrowForward } from 'react-icons/md';
import Link from 'next/link';

export default function LandlordSection() {
  return (
    <section id="landlords" className="py-20 lg:py-32 bg-slate-50 border-t border-slate-200">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
        
        <div className="text-center max-w-4xl mx-auto mb-16">
            <span className="bg-navy-950 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 inline-block">
                For Homeowners & Landlords
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-navy-950 mb-6">
                Find Quality Tenants, Not Just Any Tenants
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
                Stop wasting time on bad-fit inquiries. Get messages from seekers who actually match your household.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* LEFT: WHY LOVE RoomFind */}
            <div>
                <h3 className="text-2xl font-bold text-navy-950 mb-8 border-l-4 border-terracotta-500 pl-4">
                    Why Landlords Love RoomFind:
                </h3>

                <div className="space-y-8">
                    {[
                        { title: "PRE-QUALIFIED INQUIRIES", desc: "Only hear from seekers with high compatibility scores. No more 50 random messages." },
                        { title: "BETTER TENANT RETENTION", desc: "Compatible flatmates = fewer conflicts = longer tenancies. High-match tenants stay 2x longer." },
                        { title: "LESS TIME WASTED", desc: "Spend time on high-match candidates, not interviewing people who won't fit." },
                        { title: "100% FREE TO LIST", desc: "No hidden fees. No commissions. No credit card required. Ever." }
                    ].map((item, i) => (
                        <div key={i} className="flex gap-4">
                            <div className="mt-1 shrink-0">
                                <MdCheckCircle className="text-emerald-500 text-2xl" />
                            </div>
                            <div>
                                <h4 className="font-bold text-navy-900 mb-1">{item.title}</h4>
                                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10">
                    <Link 
                        href="/listings/new" 
                        className="inline-flex items-center gap-2 bg-navy-950 text-white px-8 py-4 rounded-xl font-bold hover:bg-navy-800 transition-all shadow-xl"
                    >
                        List Your Room Free <MdArrowForward />
                    </Link>
                </div>
            </div>

            {/* RIGHT: HOW IT WORKS & VISUAL */}
            <div className="relative">
                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-slate-200">
                    <h3 className="font-bold text-slate-400 text-sm uppercase tracking-widest mb-8 text-center">
                        How it works for landlords
                    </h3>
                    
                    <div className="space-y-6 relative z-10">
                        {[
                            { step: "1", title: "Create Your Listing", desc: "Add photos, price, and YOUR lifestyle preferences." },
                            { step: "2", title: "Set Household Vibe", desc: "Answer the same 6 questions seekers answer." },
                            { step: "3", title: "See Match Scores", desc: "When seekers message you, you'll see THEIR score with YOU." },
                            { step: "4", title: "Select The Best", desc: "Focus on 80%+ matches. Ignore the rest." }
                        ].map((s, i) => (
                            <div key={i} className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 group-hover:bg-terracotta-500 group-hover:text-white transition-colors">
                                    {s.step}
                                </div>
                                <div>
                                    <div className="font-bold text-navy-950">{s.title}</div>
                                    <div className="text-xs text-slate-500">{s.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 pt-8 border-t border-slate-100">
                         <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-3">Incoming Messages Preview</div>
                            <div className="space-y-2">
                                {[
                                    { name: "John D.", match: "91% Match 🎯", badgeClass: "bg-emerald-100 text-emerald-700" },
                                    { name: "Sarah M.", match: "85% Match ✅", badgeClass: "bg-emerald-50 text-emerald-600" }
                                ].map((msg, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                        <span className="font-bold text-navy-900 text-sm">{msg.name}</span>
                                        <span className={`${msg.badgeClass} text-xs font-bold px-2 py-1 rounded-full`}>{msg.match}</span>
                                    </div>
                                ))}
                            </div>
                         </div>
                    </div>
                </div>
            </div>

        </div>

      </div>
    </section>
  );
}
