'use client';

export default function ErrorState({ error, onRetry }) {
  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
      <div className="text-red-600">⚠️</div>
      <div className="flex-1">
        <p className="text-red-900 font-medium text-sm">Unable to load properties</p>
        <p className="text-red-700 text-xs">{error}</p>
      </div>
      <button onClick={onRetry} className="text-sm font-medium text-red-700 underline">Retry</button>
    </div>
  );
}
