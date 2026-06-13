import { create } from 'zustand';
import type { ToastMessage } from '../types';
import { generateId } from '../utils/idGenerator';

interface ToastState {
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], message: string) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (type, message) => {
    const id = generateId();
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

export const useToast = () => {
  const { toasts, addToast, removeToast } = useToastStore();

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
