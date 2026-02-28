'use client';

import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { MdClose } from 'react-icons/md';

export default function GlobalToaster() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        className: 'font-sans text-sm font-medium',
        style: {
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          color: '#020617', // navy-950
          padding: '16px 20px',
          boxShadow: '0 20px 25px -5px rgba(2, 6, 23, 0.05), 0 8px 10px -6px rgba(2, 6, 23, 0.05)', // shadow-xl shadow-navy-950/5
          border: '1px solid #E2E8F0', // slate-200
        },
        success: {
          iconTheme: {
            primary: '#4ECDC4', // teal-500
            secondary: '#F0FDFA', // teal-50
          },
        },
        error: {
          iconTheme: {
            primary: '#FF6B6B', // terracotta-500
            secondary: '#FEF2F2', // red-50
          },
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <>
              {icon}
              {message}
              {t.type !== 'loading' && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toast.dismiss(t.id);
                  }}
                  className="ml-2 p-1 hover:bg-black/5 rounded-full transition-colors flex shrink-0"
                >
                  <MdClose size={16} className="opacity-50 hover:opacity-100" />
                </button>
              )}
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
