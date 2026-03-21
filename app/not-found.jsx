// app/not-found.jsx
import Link from 'next/link';
import { FiHome, FiAlertCircle } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 px-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full shadow-sm">
            <FiAlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Page Not Found
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          We couldn't find the page you're looking for. It might have been moved, deleted, or the URL might be incorrect.
        </p>
        <div className="pt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
          >
            <FiHome className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
