// app/error.jsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { FiRefreshCcw, FiHome, FiAlertTriangle } from 'react-icons/fi';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error for debugging
    console.error('Global Error caught by error boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 px-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full shadow-sm">
            <FiAlertTriangle className="w-12 h-12 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Something went wrong
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          We encountered an unexpected error while processing your request. Please try again or return home.
        </p>
        <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-medium rounded-xl transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
          >
            <FiRefreshCcw className="w-5 h-5" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium rounded-xl transition-all w-full sm:w-auto"
          >
            <FiHome className="w-5 h-5" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
