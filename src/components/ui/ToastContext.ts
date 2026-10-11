import { createContext, useContext } from 'react';

export type ToastTone = 'success' | 'warning' | 'error';

export interface ToastContextValue {
  notify: (message: string, tone?: ToastTone) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
