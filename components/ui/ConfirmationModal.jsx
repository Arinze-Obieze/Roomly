'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdWarning, MdInfo, MdCheckCircle } from 'react-icons/md';

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // danger, info, success
  isAlert = false,
  onConfirm,
  onCancel,
}) {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <MdWarning className="text-red-500" size={28} />;
      case 'success':
        return <MdCheckCircle className="text-green-500" size={28} />;
      case 'info':
      default:
        return <MdInfo className="text-blue-500" size={28} />;
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 shadow-red-500/20';
      case 'success':
        return 'bg-green-500 hover:bg-green-600 shadow-green-500/20';
      case 'info':
      default:
        return 'bg-navy-900 hover:bg-navy-800 shadow-navy-900/20';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-navy-100"
          >
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  type === 'danger' ? 'bg-red-50' : type === 'success' ? 'bg-green-50' : 'bg-blue-50'
                }`}>
                  {getIcon()}
                </div>
                <div>
                  <h3 className="text-xl font-heading font-bold text-navy-950 leading-tight">
                    {title}
                  </h3>
                </div>
              </div>

              <p className="text-navy-600 font-medium leading-relaxed mb-8">
                {message}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                {!isAlert && (
                  <button
                    onClick={onCancel}
                    className="flex-1 order-2 sm:order-1 px-6 py-3.5 rounded-2xl bg-navy-50 text-navy-600 font-heading font-bold hover:bg-navy-100 transition-all active:scale-95"
                  >
                    {cancelText}
                  </button>
                )}
                <button
                  onClick={onConfirm}
                  className={`flex-1 order-1 sm:order-2 px-6 py-3.5 rounded-2xl text-white font-heading font-bold transition-all active:scale-95 shadow-lg ${getButtonStyles()}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onCancel}
              className="absolute top-6 right-6 p-2 text-navy-300 hover:text-navy-900 hover:bg-navy-50 rounded-full transition-all"
            >
              <MdClose size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
