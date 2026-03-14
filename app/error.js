'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App Error caught:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 md:px-0">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-500">
            We apologize for the inconvenience. An unexpected error has occurred.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium"
          >
            Try Again
          </button>
          <Link 
            href="/"
            className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-gray-700"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
