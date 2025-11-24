'use client';

import { Toaster } from 'react-hot-toast';

export default function GlobalToaster() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '12px',
          background: '#fff',
          color: '#333',
          padding: '16px 24px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
        },
        success: {
          icon: '✅',
          style: { background: '#ECFDF5', color: '#065F46' },
        },
        error: {
          icon: '⚠️',
          style: { background: '#FEF3F2', color: '#B91C1C' },
        },
      }}
    />
  );
}
