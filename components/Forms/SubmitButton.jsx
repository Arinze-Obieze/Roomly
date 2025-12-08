'use client';

export default function SubmitButton({ 
  children, 
  disabled = false, 
  loading = false 
}) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={`w-full btn-primary ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
}