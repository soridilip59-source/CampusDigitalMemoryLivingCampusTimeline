import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

const TONES = {
  success: 'bg-emerald-500', error: 'bg-rose-500', info: 'bg-brand-500', warn: 'bg-amber-500',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const n = useRef(0);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((tone, message) => {
    const id = ++n.current;
    setToasts((t) => [...t.slice(-3), { id, tone, message }]); // max 4 on screen
    setTimeout(() => remove(id), 4500);
  }, [remove]);

  const api = useMemo(() => ({
    success: (m) => push('success', m), error: (m) => push('error', m),
    info: (m) => push('info', m), warn: (m) => push('warn', m),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex w-full max-w-sm animate-slide-in overflow-hidden rounded-xl bg-white text-sm shadow-xl ring-1 ring-slate-900/10 dark:bg-[#1a1830] dark:ring-white/10">
            <span className={`w-1.5 shrink-0 ${TONES[t.tone]}`} />
            <p className="flex-1 px-3 py-3 font-medium">{t.message}</p>
            <button onClick={() => remove(t.id)} className="px-3 text-slate-400 hover:text-slate-700 dark:hover:text-white" aria-label="Dismiss">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
