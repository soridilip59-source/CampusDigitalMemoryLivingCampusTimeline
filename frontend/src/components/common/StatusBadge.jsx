const M = {
  pending: ['Waiting for review', 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300'],
  approved: ['Published', 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300'],
  rejected: ['Not published', 'bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-300'],
};

export default function StatusBadge({ status }) {
  const [label, cls] = M[status] || M.pending;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{label}</span>;
}
