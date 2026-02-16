import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
    type PropsWithChildren,
} from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export type ToastOptions = {
  type: ToastType;
  message: string;
  title?: string;
  durationMs?: number;
};

type ToastItem = ToastOptions & { id: string };

type ToastContextValue = {
  addToast: (options: ToastOptions) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, number>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    if (timers.current[id]) {
      window.clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const addToast = useCallback(
    (options: ToastOptions) => {
      const id = createId();
      setToasts((prev) => [...prev, { id, ...options }]);
      const duration = options.durationMs ?? 4000;
      timers.current[id] = window.setTimeout(() => removeToast(id), duration);
    },
    [removeToast],
  );

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast--${toast.type}`}
            role="status"
          >
            <div className="toast__content">
              {toast.title ? <strong>{toast.title}</strong> : null}
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              className="toast__close"
              aria-label="Dismiss notification"
              onClick={() => removeToast(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
