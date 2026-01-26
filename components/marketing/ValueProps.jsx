'use client';

import { MdVerifiedUser, MdPeople, MdChatBubble } from 'react-icons/md';

export default function ValueProps() {
  const features = [
    {
      icon: <MdPeople className="w-8 h-8 text-cyan-500" />,
      title: "Match on Lifestyle",
      description: "We don't just match budgets. Our algorithm pairs you with people who share your habits, interests, and vibe.",
      color: "bg-cyan-50"
    },
    {
      icon: <MdVerifiedUser className="w-8 h-8 text-blue-500" />,
      title: "Verified Profiles",
      description: "Say goodbye to scams. We verify every host and tenant identity so you can book with total confidence.",
      color: "bg-blue-50"
    },
    {
      icon: <MdChatBubble className="w-8 h-8 text-purple-500" />,
      title: "Secure Connections",
      description: "Chat safely, schedule viewings, and get to know your future flatmates before you commit.",
      color: "bg-purple-50"
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                Not just a room. <br />
                <span className="text-slate-500">A better way to live together.</span>
            </h2>
            <p className="text-lg text-slate-600">
                Traditional rental sites are broken. We built Roomly to put the "share" back in house share.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {features.map((feature, i) => (
                <div key={i} className="flex flex-col items-center text-center p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className={`w-20 h-20 rounded-2xl ${feature.color} flex items-center justify-center mb-6 shadow-inner`}>
                        {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-500 leading-relaxed">
                        {feature.description}
                    </p>
                </div>
            ))}
        </div>

      </div>
    </section>
  );
}
