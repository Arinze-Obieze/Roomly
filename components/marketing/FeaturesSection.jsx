'use client';

import { MdVerified, MdChat, MdLock, MdPhoneAndroid, MdContentPasteSearch, MdFactCheck } from 'react-icons/md';
import { useState, useRef, useEffect } from 'react';
import CarouselProgress from './CarouselProgress';

export default function FeaturesSection() {
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

  const features = [
    {
      icon: MdContentPasteSearch,
      title: "COMPATIBILITY MATCHING",
      desc: "See your match % with every listing based on 6 lifestyle factors—not just budget and location."
    },
    {
      icon: MdVerified,
      title: "VERIFIED PROFILES",
      desc: "Every user verifies email and phone. Optional ID verification earns a \"Verified\" badge."
    },
    {
      icon: MdChat,
      title: "SECURE MESSAGING",
      desc: "Chat safely through our platform. No need to share personal contact info until you're ready."
    },
    {
      icon: MdLock,
      title: "PRIVACY CONTROL",
      desc: "Choose public or private profile. Control who sees your details with mutual interest matching."
    },
    {
      icon: MdFactCheck,
      title: "REAL LISTINGS ONLY",
      desc: "No fake rooms. No scams. We manually review flagged content and verify suspicious accounts."
    },
    {
      icon: MdPhoneAndroid,
      title: "MOBILE-FIRST DESIGN",
      desc: "Search on your phone, on the go. Fast. Clean. Simple. Works beautifully on any device."
    }
  ];

  return (
    <section id="features" className="py-20 lg:py-32 bg-white">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-navy-950 mb-6">
                Everything You Need. Nothing You Don&apos;t.
            </h2>
            <p className="text-lg md:text-xl text-slate-600">
                Roomly is built for modern renters who value compatibility, safety, and simplicity.
            </p>
        </div>

        <div ref={scrollRef} className="flex md:grid md:grid-cols-2 lg:grid-cols-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory gap-4 md:gap-8 lg:gap-12 pb-8 md:pb-0 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
            {features.map((feat, i) => (
                <div key={i} className="min-w-[70vw] md:min-w-0 snap-center text-center p-8 rounded-3xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                    <div className="w-16 h-16 mx-auto bg-terracotta-50 text-terracotta-500 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-500">
                        <feat.icon />
                    </div>
                    <h3 className="font-bold text-lg text-navy-950 mb-3 tracking-wide uppercase">{feat.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
            ))}
        </div>

        <CarouselProgress total={features.length} current={activeSlide} className="mt-8" />

      </div>
    </section>
  );
}
