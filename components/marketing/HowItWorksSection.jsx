'use client';

import { MdPersonAdd, MdGridView, MdChat } from 'react-icons/md';
import Link from 'next/link';

export default function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "CREATE YOUR PROFILE",
      icon: MdPersonAdd,
      highlight: "Takes just 2 minutes",
      features: [
        "Answer 6 lifestyle questions",
        "Set budget & location",
        "No essays, just quick choices"
      ]
    },
    {
      num: "02",
      title: "BROWSE & MATCH",
      icon: MdGridView,
      highlight: "See compatibility scores instantly",
      features: [
        "Browse verified rooms",
        "Filter by 80%+ match",
        "See landlord vibes upfront"
      ]
    },
    {
      num: "03",
      title: "CONNECT & MOVE IN",
      icon: MdChat,
      highlight: "Chat safely on our platform",
      features: [
        "Schedule viewings",
        "Apply for rooms",
        "Avg. time to find: 2 weeks"
      ]
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-slate-50 border-y border-slate-200">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-navy-950 mb-6">How Roomly Works</h2>
          <p className="text-lg text-slate-600">From signup to move-in in 3 simple steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
                <div key={i} className="relative bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
                    <div className="absolute -top-4 -right-4 text-9xl font-extrabold text-slate-100/50 select-none z-0">
                        {step.num}
                    </div>
                    
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-navy-950 text-white rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg shadow-navy-900/20">
                            <step.icon />
                        </div>
                        
                        <h3 className="text-xl font-extrabold text-navy-950 tracking-wide mb-2">{step.title}</h3>
                        <p className="text-terracotta-500 font-bold text-sm mb-6 uppercase tracking-wider">{step.highlight}</p>
                        
                        <ul className="space-y-3">
                            {step.features.map((feat, j) => (
                                <li key={j} className="flex items-start gap-3 text-slate-600 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-navy-900 mt-2 shrink-0"></span>
                                    {feat}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ))}
        </div>

        <div className="text-center mt-16">
            <Link 
                href="/signup" 
                className="inline-flex items-center justify-center px-8 py-4 bg-terracotta-500 text-white font-bold rounded-xl hover:bg-terracotta-600 transition-all shadow-xl shadow-terracotta-500/20 hover:-translate-y-1"
            >
                Get Started Free - No Credit Card Required →
            </Link>
            <p className="mt-4 text-sm text-slate-500 font-medium">Set up your profile in under 2 minutes</p>
        </div>

      </div>
    </section>
  );
}
