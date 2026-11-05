import { initials } from '../../utils/helpers';

const COLORS = ['bg-brand-500', 'bg-coral-500', 'bg-emerald-500', 'bg-sky-500', 'bg-fuchsia-500', 'bg-amber-500'];

export default function Avatar({ name = '?', size = 'h-7 w-7 text-[11px]' }) {
  const c = COLORS[[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % COLORS.length];
  return <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${c} ${size}`}>{initials(name)}</span>;
}