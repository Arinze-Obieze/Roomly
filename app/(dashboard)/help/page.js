'use client';

import { MdHelpOutline } from 'react-icons/md';

export default function HelpPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl border border-navy-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-700 flex items-center justify-center">
            <MdHelpOutline size={22} />
          </div>
          <h1 className="text-2xl font-heading font-bold text-navy-950">Help Center</h1>
        </div>
        <p className="text-sm text-navy-600">
          Need help? In dev, use this page as the central entry point to FAQ, feedback, safety guidance, and support contact.
        </p>
      </div>
    </main>
  );
}
