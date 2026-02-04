'use client';

import { MdWarning, MdEmail, MdQuestionMark } from 'react-icons/md';

export default function ProblemSection() {
  const problems = [
    {
      icon: MdWarning,
      title: "BAD SURPRISES",
      highlight: "Loves to host parties",
      description: "wasn't in the listing. Now you can't sleep on weeknights.",
      summary: "You matched on price. Not on lifestyle."
    },
    {
      icon: MdEmail,
      title: "MESSAGE OVERLOAD",
      highlight: "Landlords get 50+ random inquiries",
      description: "per listing. You never hear back.",
      summary: "Or you waste time viewing rooms that aren't the right fit."
    },
    {
      icon: MdQuestionMark, // Or Dice icon if available
      title: "GUESSING GAME",
      highlight: "Is this person tidy?",
      description: "Social? A night owl? You won't know until you move in.",
      summary: "Then it's too late."
    }
  ];

  return (
    <section className="py-20 bg-slate-50 border-y border-slate-200">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-navy-950 mb-4">
            Tired of Random Roommate Matching?
          </h2>
          <p className="text-lg text-slate-600">
            Traditional rental sites match you on price and location. 
            That&apos;s it. No wonder 7 out of 10 flatshare arrangements fail.
          </p>
        </div>

        {/* 3-COLUMN PROBLEM LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {problems.map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-red-100 transition-colors">
                    <item.icon className="text-red-500 text-3xl" />
                </div>
                
                <h3 className="text-sm font-bold text-red-500 tracking-wider uppercase mb-4 flex items-center gap-2">
                    {item.title}
                </h3>
                
                <p className="text-navy-950 font-medium text-lg mb-4 leading-relaxed">
                    <span className="bg-red-50 px-1 py-0.5 rounded text-red-700 italic border border-red-100">
                        &quot;{item.highlight}&quot;
                    </span> {item.description}
                </p>
                
                <div className="h-px bg-slate-100 my-4"></div>
                
                <p className="text-slate-500 font-bold">
                    {item.summary}
                </p>
            </div>
          ))}
        </div>

        {/* TRANSITION TEXT */}
        <div className="text-center mt-16 animate-in slide-in-from-bottom-4 duration-700 delay-300">
            <p className="text-xl md:text-2xl font-bold text-navy-950">
                There&apos;s a better way to find flatmates.
            </p>
            <div className="w-16 h-1 bg-terracotta-500 mx-auto mt-6 rounded-full"></div>
        </div>

      </div>
    </section>
  );
}
