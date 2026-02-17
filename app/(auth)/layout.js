'use client';

import AuthAnimation from './AuthAnimation';

export default function AuthLayout({ children, side = 'left' }) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Section (Form) */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center ${side === 'right' ? 'lg:order-last' : ''}`}>
     

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

