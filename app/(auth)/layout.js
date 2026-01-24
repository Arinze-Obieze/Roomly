'use client';

import AuthAnimation from './AuthAnimation';

export default function AuthLayout({ children, side = 'left' }) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Section (Form) */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center ${side === 'right' ? 'lg:order-last' : ''}`}>
        {/* Mobile Header (Visible only on small screens) */}
        <div className="lg:hidden absolute top-0 left-0 right-0 p-6 flex justify-center">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-tr from-cyan-500 to-indigo-500 text-white font-bold text-lg shadow-lg">
                HS
             </div>
        </div>

        <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl px-6 py-12 lg:px-8 xl:px-12">
          {children}
        </div>
      </div>

      {/* Right Section (Animation) */}
      {side === 'left' && (
        <div className="hidden lg:flex w-1/2 bg-gray-900 relative overflow-hidden">
          <AuthAnimation />
        </div>
      )}
    </div>
  );
}

