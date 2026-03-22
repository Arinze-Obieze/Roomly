'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if the user has already consented
    const consent = localStorage.getItem('roomfind_cookie_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleConsent = (type) => {
    localStorage.setItem('roomfind_cookie_consent', type);
    setShowBanner(false);
    
    // In the future, if type === 'all', you can initialize 
    // analytics scripts (like Google Analytics, Meta Pixel) here.
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none flex justify-center">
      <div className="bg-navy-950 text-white p-5 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pointer-events-auto border border-navy-800">
        
        <div className="flex-1 pr-4">
          <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
            🍪 We care about your privacy
          </h3>
          <p className="text-navy-200 text-sm leading-relaxed">
            We use essential cookies to keep you logged in and functional cookies to improve your experience. See our <Link href="/cookies" className="text-terracotta-400 hover:text-terracotta-300 underline underline-offset-2">Cookie Policy</Link> for details.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <button 
            onClick={() => handleConsent('essential')}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-navy-700 hover:bg-navy-800 text-sm font-bold text-white transition-colors text-center"
          >
            Essential Only
          </button>
          <button 
            onClick={() => handleConsent('all')}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-sm font-bold text-white transition-colors text-center shadow-lg shadow-terracotta-500/20"
          >
            Accept All
          </button>
        </div>

      </div>
    </div>
  );
}
