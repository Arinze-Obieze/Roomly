'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

const ConfirmationContext = createContext(null);

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};

export const ConfirmationProvider = ({ children }) => {
  const [modalConfig, setModalConfig] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((config) => {
    // If config is just a string, treat it as the message
    const finalConfig = typeof config === 'string' ? { message: config } : config;
    
    setModalConfig({
      title: 'Are you sure?',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      type: 'danger', // danger, info, success
      ...finalConfig,
      isOpen: true,
    });

    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const alert = useCallback((config) => {
    const finalConfig = typeof config === 'string' ? { message: config } : config;
    
    setModalConfig({
      title: 'Notification',
      confirmText: 'OK',
      type: 'info',
      isAlert: true,
      ...finalConfig,
      isOpen: true,
    });

    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setModalConfig((prev) => prev ? { ...prev, isOpen: false } : null);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setModalConfig((prev) => prev ? { ...prev, isOpen: false } : null);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  return (
    <ConfirmationContext.Provider value={{ confirm, alert }}>
      {children}
      {modalConfig && (
        <ConfirmationModal
          {...modalConfig}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmationContext.Provider>
  );
};
