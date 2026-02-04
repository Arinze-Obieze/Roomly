import { MdVerifiedUser, MdPeople, MdChatBubble, MdArrowForward } from 'react-icons/md';
import Link from 'next/link';

export default function ValueProps() {
  const features = [
    {
      icon: <MdPeople className="w-10 h-10 text-white" />,
      title: "Live with people who actually get you",
      description: "Traditional search is broken. We match you based on lifestyle, social habits, and vibes so you don't just find a room—you find a home.",
      cta: "Explore Matches",
      link: "/rooms",
      image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2670&auto=format&fit=crop"
    },
    {
      icon: <MdVerifiedUser className="w-10 h-10 text-white" />,
      title: "Rent with peace of mind",
      description: "Say goodbye to scams. We verify every host, every tenant, and every listing with a multi-step security check.",
      cta: "Our Verification Process",
      link: "/verification",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2673&auto=format&fit=crop",
      reverse: true
    },
    {
      icon: <MdChatBubble className="w-10 h-10 text-white" />,
      title: "Connect safely, move in faster",
      description: "Chat securely through our platform. No need to share personal details until you're ready to meet.",
      cta: "How it Works",
      link: "/how-it-works",
      image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=2574&auto=format&fit=crop"
    }
  ];

  return (
    <section className="py-16 md:py-40 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Section Header: Pure Signal */}
        <div className="max-w-3xl mx-auto md:mx-0 text-center md:text-left mb-16 md:mb-32">
            <h2 className="text-3xl md:text-6xl font-sans font-extrabold text-navy-950 mb-6 tracking-tight">
                Built for the <br />
                <span className="text-terracotta-500">Modern Irish Renter.</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-500 font-light leading-relaxed">
                We’re moving beyond the transactional. Roomly is about building communities, one shared home at a time.
            </p>
        </div>

        {/* Zig-Zag Narrative */}
        <div className="space-y-24 md:space-y-40">
            {features.map((feature, i) => (
                <div key={i} className={`flex flex-col ${feature.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-24`}>
                    
                    {/* Visual Side */}
                    <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-10 duration-700">
                        <div className="relative group">
                            <div className="absolute -inset-2 md:-inset-4 bg-terracotta-50 rounded-3xl -rotate-2 group-hover:rotate-0 transition-transform duration-500"></div>
                            <img 
                                src={feature.image} 
                                alt={feature.title} 
                                className="relative rounded-2xl shadow-2xl object-cover h-[300px] md:h-[450px] w-full"
                            />
                            <div className="absolute -top-6 -right-6 md:-right-8 w-16 h-16 md:w-20 md:h-20 bg-terracotta-500 rounded-2xl shadow-xl flex items-center justify-center">
                                {feature.icon}
                            </div>
                        </div>
                    </div>

                    {/* Text Side */}
                    <div className="flex-1 space-y-6">
                        <h3 className="text-3xl md:text-5xl font-extrabold text-navy-950 leading-tight">
                            {feature.title}
                        </h3>
                        <p className="text-lg md:text-xl text-slate-500 font-light leading-relaxed">
                            {feature.description}
                        </p>
                        <Link 
                            href={feature.link}
                            className="inline-flex items-center gap-2 text-terracotta-500 font-bold text-lg hover:translate-x-2 transition-transform group"
                        >
                            {feature.cta}
                            <MdArrowForward className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                </div>
            ))}
        </div>

      </div>
    </section>
  );
}
