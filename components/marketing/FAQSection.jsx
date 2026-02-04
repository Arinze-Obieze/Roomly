'use client';

import { useState } from 'react';
import { MdAdd, MdRemove, MdEmail } from 'react-icons/md';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "Is Roomly really free?",
      a: "Yes! 100% free for renters and landlords. You can create a profile, browse all listings, see compatibility scores, send unlimited messages, and list unlimited rooms."
    },
    {
      q: "How does the compatibility algorithm work?",
      a: "We ask you 6 questions about your lifestyle preferences (Cleanliness, Social Level, Noise Tolerance, Smoking, Pets, Schedule). We compare your answers to the other person's and calculate a 0-100% compatibility score based on weighted importance."
    },
    {
      q: "How do you verify users?",
      a: "All users must verify their email and phone number. We also offer optional Government ID verification for a 'Verified' badge and manually review flagged accounts."
    },
    {
      q: "Can I browse rooms without signing up?",
      a: "Yes! You can browse all listings without an account. You'll only need to sign up (free) when you want to message a landlord or see full contact details."
    },
    {
      q: "What if I want to keep my profile private?",
      a: "You can create a 'private' profile that shows initials and age range only. Your full details are revealed only when you and a landlord mutually express interest."
    },
    {
      q: "How is messaging different from other sites?",
      a: "Built-in secure messaging means you don't need to share your phone number publicly. See response rates before messaging and keep all history in one place."
    },
    {
      q: "What cities does Roomly cover?",
      a: "Currently focused on Dublin (all areas). Expanding soon to Cork, Galway, and Limerick."
    },
    {
      q: "What if I don't match well with anyone?",
      a: "If scores are low (<70%), try expanding your budget or area. Remember, a 70% match can still work! Check the breakdown to see specific differences."
    }
  ];

  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-navy-950 mb-6">
                Frequently Asked Questions
            </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
                <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300">
                    <button 
                        onClick={() => setOpenIndex(openIndex === i ? null : i)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
                    >
                        <span className="font-bold text-navy-950 text-lg pr-8">{faq.q}</span>
                        {openIndex === i ? (
                            <MdRemove className="text-terracotta-500 text-2xl shrink-0" />
                        ) : (
                            <MdAdd className="text-slate-400 text-2xl shrink-0" />
                        )}
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-6 pt-0 text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                            {faq.a}
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="text-center mt-12 bg-blue-50 max-w-md mx-auto p-6 rounded-2xl border border-blue-100">
            <p className="font-bold text-navy-950 mb-1">Still have questions?</p>
            <a href="mailto:hello@roomly.ie" className="inline-flex items-center gap-2 text-terracotta-500 font-bold hover:underline">
                <MdEmail /> hello@roomly.ie
            </a>
            <p className="text-xs text-slate-500 mt-2">Response time: Within 24 hours</p>
        </div>

      </div>
    </section>
  );
}
