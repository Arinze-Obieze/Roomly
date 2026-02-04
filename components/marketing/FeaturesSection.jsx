'use client';

import { MdVerified, MdChat, MdLock, MdPhoneAndroid, MdContentPasteSearch, MdFactCheck } from 'react-icons/md';

export default function FeaturesSection() {
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
      <div className="container mx-auto px-4 md:px-6">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-navy-950 mb-6">
                Everything You Need. Nothing You Don&apos;t.
            </h2>
            <p className="text-lg md:text-xl text-slate-600">
                Roomly is built for modern renters who value compatibility, safety, and simplicity.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 log:gap-12">
            {features.map((feat, i) => (
                <div key={i} className="text-center p-8 rounded-3xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                    <div className="w-16 h-16 mx-auto bg-terracotta-50 text-terracotta-500 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-500">
                        <feat.icon />
                    </div>
                    <h3 className="font-bold text-lg text-navy-950 mb-3 tracking-wide uppercase">{feat.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
            ))}
        </div>

      </div>
    </section>
  );
}
