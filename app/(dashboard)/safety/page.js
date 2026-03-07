'use client';

import React from 'react';
import { 
  MdOutlineSecurity, 
  MdWarning, 
  MdVerifiedUser, 
  MdVisibility, 
  MdShield,
  MdPublic,
  MdPsychology,
  MdArrowForward
} from 'react-icons/md';
import { motion } from 'framer-motion';

export default function SafetyPage() {
  const safetyCategories = [
    {
      title: 'Common Scams to Avoid',
      icon: MdWarning,
      color: 'rose',
      items: [
        {
          title: 'Never Pay Before Viewing',
          desc: 'Avoid landlords who ask for a deposit or "booking fee" before you have physically visited the property and met them.'
        },
        {
          title: 'Untraceable Payments',
          desc: 'Never send money via Western Union, MoneyGram, or cryptocurrency. Use bank transfers so there is a digital trail.'
        },
        {
          title: 'The "Out of Country" Host',
          desc: 'Be wary of hosts who claim they are abroad and will mail you the keys after you pay. This is a common scam.'
        }
      ]
    },
    {
      title: 'Smart Meeting Habits',
      icon: MdPublic,
      color: 'blue',
      items: [
        {
          title: 'Meet in Public First',
          desc: 'For buddy-ups or viewings, meet at a local cafe first. It’s safer and gives you a chance to chat in a neutral space.'
        },
        {
          title: 'Tell a Friend',
          desc: 'Always tell someone where you are going for a viewing and when you expect to be back. Share your live location if possible.'
        },
        {
          title: 'Bring a Plus-One',
          desc: 'If you’re nervous about a viewing, bring a friend. Good landlords won’t mind a second pair of eyes.'
        }
      ]
    },
    {
      title: 'Trust Metrics',
      icon: MdVerifiedUser,
      color: 'emerald',
      items: [
        {
          title: 'Verify Profiles',
          desc: 'Look for the "Verified" badge on RoomFind. It means we’ve verified their email and phone.'
        },
        {
          title: 'Check Socials',
          desc: 'If you’re moving in with someone, it’s okay to ask for a LinkedIn or social media link to confirm they are who they say they are.'
        }
      ]
    }
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 lg:px-8 py-10">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-teal-500 text-white mb-4 shadow-lg shadow-teal-500/20">
          <MdOutlineSecurity size={32} />
        </div>
        <h1 className="text-3xl font-heading font-extrabold text-navy-950 tracking-tight">Stay Safe on RoomFind</h1>
        <p className="text-navy-500 mt-2 max-w-xl mx-auto">Your safety is our priority. Follow these guidelines to ensure a secure and positive room-sharing experience.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <div className="lg:col-span-2 space-y-8">
          {safetyCategories.map((cat, idx) => (
            <motion.section 
              key={cat.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[2.5rem] border border-navy-100 p-8 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center 
                  ${cat.color === 'rose' ? 'bg-rose-50 text-rose-600' : 
                    cat.color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}
                `}>
                  <cat.icon size={24} />
                </div>
                <h2 className="text-xl font-heading font-bold text-navy-950">{cat.title}</h2>
              </div>
              
              <div className="space-y-6">
                {cat.items.map((item) => (
                  <div key={item.title} className="group">
                    <h3 className="font-bold text-navy-900 mb-1 group-hover:text-terracotta-600 transition-colors">{item.title}</h3>
                    <p className="text-sm text-navy-600 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        <aside className="space-y-6">
          <div className="bg-navy-950 text-white rounded-[2.5rem] p-8 sticky top-24">
            <MdPsychology size={40} className="text-terracotta-400 mb-4" />
            <h2 className="text-xl font-heading font-bold mb-4">The Golden Rule</h2>
            <p className="text-navy-200 text-sm leading-relaxed mb-6">
              "If it seems too good to be true, it probably is." 
              <br /><br />
              The Irish rental market is competitive, but don't let urgency cloud your judgment. <strong>Trust your gut.</strong>
            </p>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                <MdVisibility size={16} /> Reporting
              </h3>
              <p className="text-xs text-navy-300">
                Found something fishy? Use the "Report" button on any listing or message.
              </p>
            </div>
            <a 
              href="/support"
              className="mt-8 w-full bg-white text-navy-950 py-3 rounded-xl font-heading font-bold flex items-center justify-center gap-2 hover:bg-navy-50 transition-colors"
            >
              Get Help Now <MdArrowForward />
            </a>
          </div>
        </aside>
      </div>

      <section className="bg-teal-50 border border-teal-100 rounded-[2.5rem] p-8 text-center">
        <div className="flex justify-center mb-4">
          <MdShield size={48} className="text-teal-600" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-teal-900 mb-2">Our Commitment</h2>
        <p className="text-teal-800 text-sm max-w-2xl mx-auto leading-relaxed">
          While we provide the tools for discovery, we also work around the clock to remove fraudulent listings and bad actors. RoomFind uses AI to flag suspicious patterns, but your reports are our best defense.
        </p>
      </section>
    </main>
  );
}
