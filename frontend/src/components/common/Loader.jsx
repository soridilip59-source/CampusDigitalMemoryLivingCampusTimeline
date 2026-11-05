import Button from './Button';

export default function Loader({ className = 'h-6 w-6' }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-brand-500 border-t-transparent ${className}`} role="status" aria-label="Loading" />;
}

export const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center"><Loader className="h-9 w-9" /></div>
);

export const CardSkeleton = () => (
  <div className="card overflow-hidden p-3">
    <div className="skeleton aspect-[3/2] rounded-xl bg-slate-200 dark:bg-white/10" />
    <div className="skeleton mt-4 h-4 w-3/4 rounded bg-slate-200 dark:bg-white/10" />
    <div className="skeleton mt-2 h-3 w-full rounded bg-slate-200 dark:bg-white/10" />
    <div className="skeleton mt-1.5 h-3 w-2/3 rounded bg-slate-200 dark:bg-white/10" />
  </div>
);

export function EmptyState({ emoji = '🗂️', title, text, action }) {
  return (
    <div className="card mx-auto max-w-md px-6 py-12 text-center">
      <div className="text-4xl">{emoji}</div>
      <h3 className="mt-3 text-lg font-bold">{title}</h3>
      {text && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const ErrorState = ({ message, onRetry }) => (
  <EmptyState emoji="📡" title="Couldn't load memories" text={message} action={onRetry && <Button onClick={onRetry}>Try again</Button>} />
);
