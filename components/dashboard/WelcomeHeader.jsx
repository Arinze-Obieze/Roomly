'use client';

import { MdRefresh } from "react-icons/md";

export default function WelcomeHeader({ firstName, loading, count, onRefresh }) {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-30 lg:static lg:z-0">
      <div className="px-4 py-4 lg:px-8 lg:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Good morning, {firstName} 👋</h2>
            <p className="text-slate-500 text-sm mt-1">
              {loading && count === 0 
                ? "Loading properties..." 
                : `We found ${count} matches for you.`}
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 lg:px-4 lg:py-2 flex items-center gap-2 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            <MdRefresh className={loading ? "animate-spin" : ""} size={20} />
            <span className="hidden lg:inline text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
