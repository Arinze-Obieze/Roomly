'use client';

import { MdOutlinePolicy } from 'react-icons/md';

export default function LegalPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl border border-navy-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-700 flex items-center justify-center">
            <MdOutlinePolicy size={22} />
          </div>
          <h1 className="text-2xl font-heading font-bold text-navy-950">Terms & Privacy</h1>
        </div>
        <p className="text-sm text-navy-600 mb-3">
          This dev page is the legal hub. Link production Terms of Service and Privacy Policy here.
        </p>
        <div className="space-y-2 text-sm">
          <a href="/terms" className="block text-terracotta-600 hover:text-terracotta-700 font-medium">Terms of Service</a>
          <a href="/privacy" className="block text-terracotta-600 hover:text-terracotta-700 font-medium">Privacy Policy</a>
        </div>
      </div>
    </main>
  );
}
