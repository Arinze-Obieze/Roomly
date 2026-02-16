'use client';

import { MdSearchOff, MdNotificationsActive, MdMap } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function EmptyState({ onReset, location }) {
  const handleSaveSearch = () => {
    toast.success("We'll notify you when new rooms appear!", {
        icon: '🔔',
        style: {
            borderRadius: '12px',
            background: '#333',
            color: '#fff',
        },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4 animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 bg-navy-50 rounded-full flex items-center justify-center mb-6 relative">
        <MdSearchOff className="text-4xl text-navy-200" />
        <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-md animate-bounce delay-700">
            <span className="text-xl">🤔</span>
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-navy-950 mb-2 font-heading">
        {location ? `No homes found in ${location}` : 'No matches found'}
      </h3>
      
      <p className="text-slate-500 text-base mb-8 max-w-sm mx-auto leading-relaxed">
        We couldn't find a perfect match yet, but don't give up! 
        <br />New rooms are added daily.
      </p>

      <div className="grid gap-3 w-full max-w-xs">
        <button
            onClick={onReset}
            className="w-full py-3.5 px-6 bg-navy-950 text-white rounded-xl font-bold shadow-lg shadow-navy-900/20 hover:bg-navy-900 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
            <MdMap className="text-xl" />
            <span>Clear Filters & Browse All</span>
        </button>
        
        <button
            onClick={handleSaveSearch}
            className="w-full py-3.5 px-6 bg-white text-navy-900 border border-navy-100 rounded-xl font-bold hover:bg-navy-50 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
            <MdNotificationsActive className="text-terracotta-500 text-xl" />
            <span>Notify me when added</span>
        </button>
      </div>
    </div>
  );
}
