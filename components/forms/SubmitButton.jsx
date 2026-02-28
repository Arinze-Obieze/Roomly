'use client';

import GlobalSpinner from '@/components/ui/GlobalSpinner';

export default function SubmitButton({ 
  children, 
  disabled = false, 
  loading = false, 
  onClick, 
  className = ''
}) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      onClick={onClick}
      className={`w-full bg-terracotta-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-terracotta-600 focus:outline-none focus:ring-4 focus:ring-terracotta-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-terracotta-500/20 transform active:scale-[0.99] ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <GlobalSpinner size="sm" color="white" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}