'use client';

import React from 'react';
import { 
  MdOutlinePolicy, 
  MdGavel, 
  MdInfoOutline, 
  MdSecurity, 
  MdPersonSearch,
  MdAttachMoney,
  MdChevronRight
} from 'react-icons/md';
import { motion } from 'framer-motion';

export default function LegalPage() {
  const sections = [
    {
      id: 'laws',
      title: 'Irish Room Sharing Laws',
      icon: MdGavel,
      color: 'blue',
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <h3 className="font-heading font-bold text-blue-900 mb-1 flex items-center gap-2">
              Licensee vs. Tenant
            </h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              In Ireland, if you rent a room in a house where the owner also lives, you are generally a <strong>licensee</strong>, not a tenant. This means you aren't covered by standard residential tenancy laws (RTB). However, you are still entitled to "reasonable notice" before being asked to leave.
            </p>
          </div>
          
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <h3 className="font-heading font-bold text-emerald-900 mb-1 flex items-center gap-2">
              Rent-a-Room Relief
            </h3>
            <p className="text-sm text-emerald-800 leading-relaxed">
              Homeowners in Ireland can earn up to <strong>€14,000 per year tax-free</strong> by renting out a room in their primary residence. This is a great way for hosts to earn extra income while providing much-needed housing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <div className="p-4 rounded-2xl border border-navy-100 bg-white">
              <h4 className="font-bold text-navy-900 text-sm mb-1">Standard Agreements</h4>
              <p className="text-xs text-navy-600">While not legally required for licensees, we highly recommend having a written "License Agreement" covering rent, deposits, and house rules.</p>
            </div>
            <div className="p-4 rounded-2xl border border-navy-100 bg-white">
              <h4 className="font-bold text-navy-900 text-sm mb-1">Notice Periods</h4>
              <p className="text-xs text-navy-600">"Reasonable notice" is usually considered to be one rent period (e.g., 1 month), but it depends on the circumstances of the arrangement.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      icon: MdOutlinePolicy,
      color: 'navy',
      content: (
        <div className="prose prose-sm max-w-none text-navy-700">
          <p>By using RoomFind, you agree to our core values of respect, transparency, and safety.</p>
          <ul className="space-y-2 list-none pl-0">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-terracotta-400 mt-1.5 shrink-0" />
              <span>Users must provide accurate information in their profiles and listings.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-terracotta-400 mt-1.5 shrink-0" />
              <span>We do not tolerate discrimination based on race, religion, or orientation.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-terracotta-400 mt-1.5 shrink-0" />
              <span>RoomFind is a matching platform and is not a party to any rental agreements.</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: MdSecurity,
      color: 'terracotta',
      content: (
        <div className="prose prose-sm max-w-none text-navy-700">
          <p>Your privacy is paramount. We only share data necessary to facilitate matches.</p>
          <ul className="space-y-2 list-none pl-0">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-navy-400 mt-1.5 shrink-0" />
              <span><strong>Visibility:</strong> Private profiles are masked (name/photo) until a 70% match is met.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-navy-400 mt-1.5 shrink-0" />
              <span><strong>Data:</strong> We never sell your personal information to third parties.</span>
            </li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 lg:px-8 py-10">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-navy-950 text-white mb-4 shadow-lg shadow-navy-950/20">
          <MdOutlinePolicy size={32} />
        </div>
        <h1 className="text-3xl font-heading font-extrabold text-navy-950 tracking-tight">Legal & Privacy</h1>
        <p className="text-navy-500 mt-2">Information on your rights, our policies, and the Irish legal landscape.</p>
      </header>

      <div className="space-y-6">
        {sections.map((section, idx) => (
          <motion.section 
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-[40px] border border-navy-100 p-8 shadow-xl shadow-navy-950/5 hover:shadow-2xl hover:shadow-navy-950/10 transition-shadow overflow-hidden relative"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center 
                ${section.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                  section.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                  section.color === 'terracotta' ? 'bg-terracotta-50 text-terracotta-600' : 'bg-navy-50 text-navy-900'}
              `}>
                <section.icon size={24} />
              </div>
              <h2 className="text-xl font-heading font-bold text-navy-950">{section.title}</h2>
            </div>
            {section.content}
          </motion.section>
        ))}
      </div>

      <footer className="mt-12 p-8 rounded-[2.5rem] bg-navy-950 text-white text-center">
        <h3 className="text-lg font-heading font-bold mb-2">Still have questions?</h3>
        <p className="text-navy-200 text-sm mb-6 max-w-md mx-auto">Our support team is knowledgeable about Ireland's room-sharing trends and rules.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="/support" className="bg-terracotta-500 hover:bg-terracotta-600 text-white px-6 py-3 rounded-xl font-heading font-bold transition-colors">
            Contact Support
          </a>
          <a href="https://www.citizensinformation.ie" target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-heading font-bold transition-colors flex items-center gap-2">
            Citizens Information <MdChevronRight />
          </a>
        </div>
      </footer>
    </main>
  );
}
