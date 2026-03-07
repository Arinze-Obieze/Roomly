'use client';

import React from 'react';
import { 
  MdHelpOutline, 
  MdSearch, 
  MdSecurity, 
  MdGavel, 
  MdChatBubbleOutline, 
  MdRocketLaunch,
  MdChevronRight,
  MdArrowForward
} from 'react-icons/md';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function HelpPage() {
  const router = useRouter();

  const categories = [
    {
      title: 'Getting Started',
      desc: 'Learn how to create a profile, post a listing, and use AI matching.',
      icon: MdRocketLaunch,
      color: 'blue',
      path: '/support' // Link to support for now or specific start guide
    },
    {
      title: 'Safety & Security',
      desc: 'Best practices for viewings and avoiding scams in Ireland.',
      icon: MdSecurity,
      color: 'teal',
      path: '/safety'
    },
    {
      title: 'Legal & Tax (Ireland)',
      desc: 'Licensee rights, Rent-a-Room relief, and house rules.',
      icon: MdGavel,
      color: 'navy',
      path: '/legal'
    },
    {
      title: 'Support & Feedback',
      desc: 'Contact our team or report an issue with the platform.',
      icon: MdChatBubbleOutline,
      color: 'terracotta',
      path: '/support'
    }
  ];

  const faqs = [
    { q: "What is a 'Licensee' in Ireland?", a: "A licensee lives with their landlord. They have different rights than 'tenants'. Check our Legal section for details." },
    { q: "How much tax-free income can I earn from a room?", a: "In Ireland, the Rent-a-Room Relief allows up to €14,000 per year tax-free." },
    { q: "Is RoomFind free to use?", a: "Basic discovery and matching are free. We focus on connecting compatible flatmates directly." }
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 lg:px-8 py-10">
      <header className="mb-12 text-center relative overflow-hidden p-12 rounded-[3rem] bg-navy-950 text-white shadow-2xl shadow-navy-900/40">
        <div className="absolute top-0 right-0 p-8 opacity-10">
            <MdHelpOutline size={120} />
        </div>
        
        <h1 className="text-4xl font-heading font-extrabold mb-4 relative z-10">Help Center</h1>
        <p className="text-navy-300 mb-8 max-w-lg mx-auto relative z-10">Everything you need to know about room-sharing in Ireland and using RoomFind effectively.</p>
        
        <div className="max-w-xl mx-auto relative z-10">
          <div className="relative group">
            <input 
              type="text"
              placeholder="Search for articles, laws, or tips..."
              className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-terracotta-500 transition-all group-hover:bg-white/[0.15]"
            />
            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={24} />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {categories.map((cat, idx) => (
          <motion.button
            key={cat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => router.push(cat.path)}
            className="flex items-start gap-6 bg-white border border-navy-100 p-8 rounded-[2.5rem] text-left hover:shadow-xl hover:shadow-navy-900/5 hover:-translate-y-1 transition-all group"
          >
            <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center 
                ${cat.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                  cat.color === 'teal' ? 'bg-teal-50 text-teal-600' :
                  cat.color === 'navy' ? 'bg-navy-50 text-navy-900' : 'bg-terracotta-50 text-terracotta-600'}
            `}>
              <cat.icon size={28} />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-navy-950 flex items-center gap-2 mb-2 group-hover:text-terracotta-600 transition-colors">
                {cat.title} <MdChevronRight className="opacity-0 group-hover:opacity-100 transition-all" />
              </h2>
              <p className="text-navy-600 text-sm leading-relaxed">{cat.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <section className="mb-16">
        <h2 className="text-2xl font-heading font-bold text-navy-950 mb-8 border-l-4 border-terracotta-500 pl-4 uppercase tracking-wider text-sm">
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="bg-navy-50/50 border border-navy-100 p-6 rounded-3xl">
              <h3 className="font-bold text-navy-950 mb-2">{faq.q}</h3>
              <p className="text-sm text-navy-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-terracotta-500 to-orange-600 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-heading font-extrabold mb-2">Can't find what you're looking for?</h2>
          <p className="text-white/80 max-w-md">Our support team is active and ready to assist you with any questions or reports.</p>
        </div>
        <button 
          onClick={() => router.push('/support')}
          className="bg-white text-terracotta-600 px-8 py-4 rounded-2xl font-heading font-bold hover:bg-navy-50 transition-colors shadow-lg shadow-terracotta-900/20 flex items-center gap-2 whitespace-nowrap"
        >
          Contact Support <MdArrowForward />
        </button>
      </section>
    </main>
  );
}
