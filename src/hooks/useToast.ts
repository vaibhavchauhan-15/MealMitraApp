import { useState, useRef, useCallback } from 'react';
import { ToastType } from '../components/Toast';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  title?: string;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ visible: true, message, type, title });
      timerRef.current = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3500);
    },
    []
  );

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return { toast, showToast, hideToast };
}
