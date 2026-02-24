'use client';

import { MdOutlineSecurity } from 'react-icons/md';

export default function SafetyPage() {
  const tips = [
    'Never pay before viewing and verifying the listing.',
    'Meet in public first if you are sharing with a new person.',
    'Keep communication in app where possible.',
    'Report suspicious listings or messages immediately.',
  ];

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl border border-navy-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <MdOutlineSecurity size={22} />
          </div>
          <h1 className="text-2xl font-heading font-bold text-navy-950">Safety Tips</h1>
        </div>
        <ul className="space-y-2 text-sm text-navy-700">
          {tips.map((tip) => (
            <li key={tip} className="bg-navy-50 border border-navy-200 rounded-xl px-3 py-2">
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
