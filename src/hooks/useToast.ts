import { useState, useCallback } from 'react';
import type { ToastMessage } from '../types';
import { generateId } from '../utils/idGenerator';

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess: (msg: string) => addToast('success', msg),
    showError: (msg: string) => addToast('error', msg),
    showWarning: (msg: string) => addToast('warning', msg),
    showInfo: (msg: string) => addToast('info', msg),
  };
};
