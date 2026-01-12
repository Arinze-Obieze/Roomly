import React from 'react';

const testimonials = [
  {
    text: "I was skeptical about an algorithm finding me a flatmate, but the match was 98% accurate. We're both night owls and neat freaks. It just works.",
    author: "Sarah J.",
    role: "Tech Worker in Dublin 2",
    bg: "bg-white",
    textColor: "text-slate-800"
  },
  {
    text: "The ID verification gave me peace of mind that I just couldn't get from Facebook groups.",
    author: "Michael R.",
    role: "Student, UCD",
    bg: "bg-slate-900",
    textColor: "text-white"
  },
  {
    text: "Finally, a platform that treats renting like a professional transaction, not a blind date.",
    author: "Ciara M.",
    role: "Landlord, Galway",
    bg: "bg-cyan-50",
    textColor: "text-slate-900"
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Header takes up the first column */}
          <div className="lg:sticky lg:top-32">
            <h2 className="text-5xl font-bold text-slate-900 mb-6 tracking-tighter">
              Real stories from <span className="underline decoration-cyan-500 decoration-4 underline-offset-4">verified</span> renters.
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Join thousands of people who found their home harmony through Roomly.
            </p>
            <button className="text-cyan-600 font-bold flex items-center gap-2 hover:gap-4 transition-all">
              Read all reviews <span>&rarr;</span>
            </button>
          </div>

          {/* Reviews Staggered Column 1 */}
          <div className="space-y-8 pt-0 lg:pt-20">
             <ReviewCard data={testimonials[0]} />
             <ReviewCard
               data={{
                 text: "I matched with someone who shares my exact lifestyle preferences. No more gambling on random roommates. This is how renting should be in 2025.",
                 author: "Emma L.",
                 role: "Nurse, Cork City",
                 bg: "bg-slate-50",
                 textColor: "text-slate-900"
               }}
             />
          </div>

          {/* Reviews Staggered Column 2 */}
          <div className="space-y-8">
             <ReviewCard data={testimonials[1]} />
             <ReviewCard data={testimonials[2]} />
          </div>

        </div>
      </div>
    </section>
  );
}

function ReviewCard({ data }) {
  return (
    <div className={`p-8 rounded-4xl ${data.bg} shadow-2xl shadow-slate-200/50 transition-transform hover:-translate-y-1 duration-300`}>
      {/* A large stylized quote mark */}
      <div className={`text-6xl font-serif leading-none opacity-20 mb-4 ${data.textColor === 'text-white' ? 'text-cyan-400' : 'text-slate-900'}`}>
        &ldquo;
      </div>
      <p className={`text-lg font-medium leading-relaxed mb-6 ${data.textColor}`}>
        {data.text}
      </p>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${data.textColor === 'text-white' ? 'bg-white/20 text-white' : 'bg-slate-900 text-white'}`}>
          {data.author[0]}
        </div>
        <div>
          <p className={`text-sm font-bold ${data.textColor}`}>{data.author}</p>
          <p className={`text-xs opacity-70 ${data.textColor}`}>{data.role}</p>
        </div>
      </div>
    </div>
  );
}
