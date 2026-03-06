'use client';

import { useRouter } from 'next/navigation';
import { MdHelpOutline, MdChat } from 'react-icons/md';

export default function SupportWidget() {
  const router = useRouter();

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-navy-100 hover:shadow-md transition-shadow group cursor-pointer">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-navy-50 rounded-xl text-terracotta-500">
          <MdHelpOutline size={20} />
        </div>
        <h3 className="font-heading font-bold text-lg text-navy-950">Need assistance?</h3>
      </div>
      <p className="text-navy-600 text-sm mb-5 font-sans leading-relaxed">
        Our support team is here to help with any questions or issues you might have.
      </p>
      <button
        onClick={() => router.push('/support')}
        className="w-full bg-navy-950 hover:bg-navy-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg active:scale-95 shadow-navy-950/20"
      >
        <MdChat size={18} className="text-terracotta-400" />
        Contact Support
      </button>
    </div>
  );
}
