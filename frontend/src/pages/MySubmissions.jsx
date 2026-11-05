import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import * as memoryApi from '../api/memoryApi';
import { realtime, EV } from '../utils/realtime';
import { STATUS, typeMeta } from '../utils/constants';
import { timeAgo } from '../utils/formatDate';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import { EmptyState, ErrorState, PageLoader } from '../components/common/Loader';
import MemoryDetail from '../components/memory/MemoryDetail';

const TABS = [['all', 'All'], [STATUS.PENDING, 'Pending'], [STATUS.APPROVED, 'Approved'], [STATUS.REJECTED, 'Rejected']];

export default function MySubmissions() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [open, setOpen] = useState(null);

  const load = useCallback(() => memoryApi.mine().then(setItems).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); return realtime.on(EV.REVIEWED, load); }, [load]);

  const counts = useMemo(() => (items || []).reduce((a, m) => ({ ...a, [m.status]: (a[m.status] || 0) + 1 }), { all: items?.length || 0 }), [items]);
  if (error) return <div className="px-4 py-16"><ErrorState message={error} onRetry={() => { setError(''); load(); }} /></div>;
  if (!items) return <PageLoader />;
  const shown = tab === 'all' ? items : items.filter((m) => m.status === tab);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">My submissions</h1>
          <p className="mt-1 text-slate-500">Track every memory you have sent. Statuses update live.</p>
        </div>
        <Button as={Link} to="/submit">Add a memory</Button>
      </div>

      <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`chip ${tab === k ? 'chip-on' : ''}`}>{label} <span className="text-xs opacity-60">{counts[k] || 0}</span></button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {shown.length === 0 ? (
          <EmptyState emoji="📝" title={items.length ? 'Nothing in this tab' : 'You have not added a memory yet'} text="Your batch’s story is missing without you."
            action={<Button as={Link} to="/submit">Add your first memory</Button>} />
        ) : shown.map((m) => (
          <article key={m.id} className="card flex gap-4 p-3 sm:p-4">
            <button onClick={() => setOpen(m)} className="h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-brand-200 to-coral-400/60 dark:from-brand-800 sm:h-28 sm:w-36" aria-label={`Open ${m.title}`}>
              {m.images?.[0] ? <img src={m.images[0]} alt="" loading="lazy" className="h-full w-full object-cover" /> : <span className="text-3xl">{typeMeta(m.type).emoji}</span>}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><StatusBadge status={m.status} /><span className="text-xs text-slate-500">{m.year} · sent {timeAgo(m.createdAt)}</span></div>
              <h3 className="mt-1.5 truncate text-lg font-bold">{m.title}</h3>
              <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{m.description}</p>
              {m.status === STATUS.REJECTED && m.rejectReason && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-1.5 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"><b>Admin note:</b> {m.rejectReason}</p>}
              {m.status === STATUS.PENDING && m.duplicateOf && <p className="mt-2 text-xs font-medium text-amber-600">Flagged as a possible duplicate. An admin will compare it with the earlier entry.</p>}
            </div>
          </article>
        ))}
      </div>
      <MemoryDetail memory={open} onClose={() => setOpen(null)} />
    </div>
  );
}