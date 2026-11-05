import { useEffect } from 'react';
import Icon from './Icon';

const W = { md: 'max-w-lg', lg: 'max-w-3xl', xl: 'max-w-5xl' };

export default function Modal({ open, onClose, title, size = 'md', children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade bg-night/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative max-h-[92vh] w-full ${W[size]} animate-pop overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-[#15132a] sm:rounded-3xl`}>
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/60">
          <Icon name="x" className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}
