const V = {
  primary: 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700',
  coral: 'bg-coral-500 text-white shadow-lg shadow-coral-500/25 hover:bg-coral-600',
  secondary: 'bg-white text-ink ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:hover:bg-white/10',
  ghost: 'text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10',
  danger: 'bg-rose-600 text-white hover:bg-rose-500',
  success: 'bg-emerald-600 text-white hover:bg-emerald-500',
};
const S = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };

export default function Button({ as: Tag = 'button', variant = 'primary', size = 'md', loading = false, className = '', children, ...rest }) {
  const disabled = rest.disabled || loading;
  return (
    <Tag
      {...rest}
      disabled={Tag === 'button' ? disabled : undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 ${V[variant]} ${S[size]} ${className}`}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </Tag>
  );
}
