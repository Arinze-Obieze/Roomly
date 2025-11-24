'use client';

import { FaBolt, FaCheck, FaStar } from 'react-icons/fa';

const signupPanelData = {
  badge: { icon: FaBolt, text: "#1 Roommate Finder in Ireland" },
  heading: "Find a place you'll love to live.",
  gradientWords: "love to live",
  features: [
    "AI-powered compatibility matching",
    "Verified profiles & secure messaging",
    "Video tours and virtual meetups",
  ],
  testimonial: {
    stars: 5,
    quote: "I was dreading the flatmate hunt, but Roomly made it incredibly easy. I found two amazing housemates in just 48 hours!",
    user: {
      name: "Sarah Jenkins",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      info: "Moved to Dublin, Oct 2023",
    },
  },
  backgroundImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
};

export default function AuthLayout({ children, side = 'left' }) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Section (Form) */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center ${side === 'right' ? 'lg:order-last' : ''}`}>
        <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl px-6 py-12 lg:px-8 xl:px-12">
          {children}
        </div>
      </div>

      {/* Right Section */}
      {side === 'left' && (
        <div className="hidden lg:flex w-1/2 bg-gray-900 relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0">
            <img
              src={signupPanelData.backgroundImage}
              alt="Roommates hanging out"
              className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 to-black/80" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between w-full p-16 xl:p-24 text-white">
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-emerald-300 text-sm font-medium">
                <signupPanelData.badge.icon size={16} />
                <span>{signupPanelData.badge.text}</span>
              </div>

              {/* Heading */}
              <h2 className="text-5xl font-bold leading-tight">
                {signupPanelData.heading.split(signupPanelData.gradientWords)[0]}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                  {signupPanelData.gradientWords}
                </span>
                {signupPanelData.heading.split(signupPanelData.gradientWords)[1]}
              </h2>

              {/* Features */}
              <ul className="space-y-5 text-lg text-gray-200">
                {signupPanelData.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <FaCheck size={14} className="text-emerald-400" />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Testimonial */}
            <div className="mt-8 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl">
              <div className="flex gap-1 mb-4 text-yellow-400">
                {Array.from({ length: signupPanelData.testimonial.stars }).map((_, i) => (
                  <FaStar key={i} size={18} />
                ))}
              </div>
              <p className="text-lg leading-relaxed font-medium mb-6">{signupPanelData.testimonial.quote}</p>
              <div className="flex items-center gap-4">
                <img
                  src={signupPanelData.testimonial.user.avatar}
                  alt={signupPanelData.testimonial.user.name}
                  className="w-12 h-12 rounded-full border-2 border-emerald-400 object-cover"
                />
                <div>
                  <p className="font-bold text-white">{signupPanelData.testimonial.user.name}</p>
                  <p className="text-emerald-200 text-sm">{signupPanelData.testimonial.user.info}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

