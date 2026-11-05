import { forwardRef, useId } from 'react';

const Input = forwardRef(function Input({ label, error, hint, as: Tag = 'input', className = '', ...rest }, ref) {
  const id = useId();
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">{label}</label>}
      <Tag id={id} ref={ref} aria-invalid={!!error} className={`field ${error ? '!ring-rose-500' : ''}`} {...rest} />
      {error ? <p className="mt-1 text-xs font-medium text-rose-500">{error}</p>
        : hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
});
export default Input;