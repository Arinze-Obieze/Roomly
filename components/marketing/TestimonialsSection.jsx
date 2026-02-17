'use client';

import { MdStar } from 'react-icons/md';
import { useState, useRef, useEffect } from 'react';
import CarouselProgress from './CarouselProgress';

export default function TestimonialsSection() {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const itemWidth = scrollRef.current.children[0].offsetWidth;
        const index = Math.round(scrollRef.current.scrollLeft / itemWidth);
        setActiveSlide(index);
      }
    };
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', handleScroll);
    return () => el && el.removeEventListener('scroll', handleScroll);
  }, []);

  const testimonials = [
    {
      quote: "I found my perfect flatmate in just 3 days. Our 89% match score was spot on—we both love quiet evenings and early mornings. Best rental experience I've ever had.",
      author: "Emma L., Dublin 2",
      role: "Renter"
    },
    {
      quote: "As a landlord, I used to get 60+ messages per listing. Now I only get inquiries from high-match seekers. My last tenant had a 92% match and has been amazing.",
      author: "David K., Dublin 4",
      role: "Landlord"
    },
    {
      quote: "The compatibility breakdown showed me exactly why we'd get along. No surprises after moving in. This should be the standard for all rental sites.",
      author: "Aoife M., Dublin 8",
      role: "Renter"
    }
  ];

  return (
    <section className="py-20 lg:py-32 bg-white border-b border-slate-100">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
        
        <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-navy-950 mb-6">
                What RoomFind Users Are Saying
            </h2>
        </div>

        <div ref={scrollRef} className="flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory gap-4 md:gap-8 pb-8 md:pb-0 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
            {testimonials.map((t, i) => (
                <div key={i} className="min-w-[85vw] md:min-w-0 snap-center bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col h-full hover:shadow-lg transition-shadow">
                    <div className="flex gap-1 text-yellow-400 text-xl mb-6">
                        {[...Array(5)].map((_, j) => (
                            <MdStar key={j} />
                        ))}
                    </div>
                    
                    <blockquote className="text-slate-700 font-medium leading-relaxed mb-6 flex-1 italic">
                        &quot;{t.quote}&quot;
                    </blockquote>
                    
                    <div className="mt-auto pt-6 border-t border-slate-200">
                        <div className="font-bold text-navy-950">{t.author}</div>
                        <div className="text-sm text-slate-500">{t.role}</div>
                    </div>
                </div>
            ))}
        </div>
        
        <CarouselProgress total={testimonials.length} current={activeSlide} />

      </div>
    </section>
  );
}
