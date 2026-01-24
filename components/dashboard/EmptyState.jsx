'use client';

export default function EmptyState({ onReset }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-slate-900">No properties found</h3>
      <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
        Try adjusting your filters or location to see more results.
      </p>
      <button
        onClick={onReset}
        className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium"
      >
        Clear Filters
      </button>
    </div>
  );
}
