'use client';

import { MdVerifiedUser, MdPeople, MdChatBubble } from 'react-icons/md';

export default function ValueProps() {
  const features = [
    {
      icon: <MdPeople className="w-8 h-8 md:w-10 md:h-10 text-white" />,
      title: "Match on Lifestyle",
      description: "We don't just match budgets. Our algorithm pairs you with people who share your habits, interests, and vibe.",
      gradient: "from-cyan-400 to-blue-500",
      shadow: "shadow-cyan-500/30"
    },
    {
      icon: <MdVerifiedUser className="w-8 h-8 md:w-10 md:h-10 text-white" />,
      title: "Verified Profiles",
      description: "Say goodbye to scams. We verify every host and tenant identity so you can book with total confidence.",
      gradient: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/30"
    },
    {
      icon: <MdChatBubble className="w-8 h-8 md:w-10 md:h-10 text-white" />,
      title: "Secure Connections",
      description: "Chat safely, schedule viewings, and get to know your future flatmates before you commit.",
      gradient: "from-indigo-600 to-purple-600",
      shadow: "shadow-indigo-500/30"
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 md:mb-32 relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
                Not just a room. <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">
                    A better way to live.
                </span>
            </h2>
            <p className="text-lg md:text-xl text-slate-500 font-light leading-relaxed">
                Traditional rental sites are broken. We built <span className="font-semibold text-slate-900">Roomly</span> to put the social connection back into house sharing.
            </p>
        </div>

        {/* Narrative Thread Container */}
        <div className="relative max-w-6xl mx-auto">
            
            {/* Desktop Horizontal Line */}
            <div className="hidden md:block absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full opacity-20"></div>
            
            {/* Mobile Vertical Line */}
            <div className="md:hidden absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 via-blue-500 to-purple-600 rounded-full opacity-20"></div>

            <div className="flex flex-col md:flex-row gap-12 md:gap-8">
                {features.map((feature, i) => (
                    <div key={i} className="relative flex flex-col md:items-center text-left md:text-center group flex-1">
                        
                        {/* Mobile: Row Layout | Desktop: Column Layout */}
                        <div className="flex md:block items-start gap-6 md:gap-0 pl-24 md:pl-0">
                            
                            {/* The Node (Icon) */}
                            <div className="absolute left-2 md:left-1/2 md:-top-4 w-12 h-12 md:w-24 md:h-24 md:transform md:-translate-x-1/2 flex items-center justify-center z-10 transition-transform duration-500 group-hover:scale-110">
                                <div className={`w-12 h-12 md:w-20 md:h-20 rounded-full bg-linear-to-br ${feature.gradient} ${feature.shadow} shadow-lg flex items-center justify-center ring-4 ring-white`}>
                                    {feature.icon}
                                </div>
                            </div>
                            
                            {/* Text Content */}
                            <div className="md:mt-24">
                                <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-500 text-lg leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>

                        </div>
                    </div>
                ))}
            </div>

        </div>

      </div>
    </section>
  );
}
