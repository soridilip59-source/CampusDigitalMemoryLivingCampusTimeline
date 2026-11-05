import { useCallback, useEffect, useState } from 'react';
import * as memoryApi from '../api/memoryApi';
import { realtime, EV } from '../utils/realtime';
import { STATUS, YEARS, typeMeta } from '../utils/constants';
import { timeAgo } from '../utils/formatDate';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Icon from '../components/common/Icon';
import Avatar from '../components/common/Avatar';
import StatusBadge from '../components/common/StatusBadge';
import { EmptyState, ErrorState, PageLoader } from '../components/common/Loader';
import MemoryDetail from '../components/memory/MemoryDetail';

const TABS = [STATUS.PENDING, STATUS.APPROVED, STATUS.REJECTED, 'reported'];

export default function Admin() {
  const toast = useToast();
  const [tab, setTab] = useState(STATUS.PENDING);
  const [data, setData] = useState({ items: [], total: 0, hasMore: false, counts: {} });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [reject, setReject] = useState(null);
  const [reason, setReason] = useState('');
  const [edit, setEdit] = useState(null);
  const [view, setView] = useState(null);

  const load = useCallback(async (p = 1, append = false) => {
    if (!append) setLoading(true);
    try {
      const r = tab === 'reported' ? { items: await memoryApi.listReported(), hasMore: false, total: 0, counts: data.counts } : await memoryApi.adminList({ status: tab, page: p });
      setData((d) => ({ ...r, items: append ? [...d.items, ...r.items] : r.items }));
      setPage(p); setError('');
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(1); }, [load]);
  useEffect(() => {
    let t;
    const soon = () => { clearTimeout(t); t = setTimeout(() => load(1), 400); };
    const offs = [realtime.on(EV.NEW, soon), realtime.on(EV.REVIEWED, soon)];
    return () => { clearTimeout(t); offs.forEach((o) => o()); };
  }, [load]);

  const act = async (id, fn, okMsg) => {
    setBusyId(id);
    try { await fn(); toast.success(okMsg); await load(1); } catch (e) { toast.error(e.message); }
    setBusyId(null);
  };

  const approve = (m) => act(m.id, () => memoryApi.review(m.id, { status: STATUS.APPROVED }), 'Published to the timeline');
  const doReject = () => { const m = reject; setReject(null); act(m.id, () => memoryApi.review(m.id, { status: STATUS.REJECTED, reason: reason.trim() }), 'Memory rejected'); setReason(''); };
  const doEdit = () => { const m = edit; setEdit(null); act(m.id, () => memoryApi.update(m.id, { year: m.year, eventDate: m.eventDate || null }), 'Updated. Connected users see it instantly'); };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Review queue</h1>
      <p className="mt-1 text-slate-500">Approve memories to publish them. Changing a date or year of a published memory updates everyone’s timeline live.</p>

      <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto">
      {TABS.map((s) => (
          <button key={s} onClick={() => setTab(s)} className={`chip capitalize ${tab === s ? 'chip-on' : ''}`}>{s} <span className="text-xs opacity-60">{data.counts?.[s] ?? 0}</span></button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={() => load(1)} /> : data.items.length === 0 ? (
          <EmptyState emoji={tab === STATUS.PENDING ? '🎉' : '📭'} title={tab === STATUS.PENDING ? 'Review queue is empty' : `No ${tab} memories`} text="New submissions show up here in real time." />
        ) : data.items.map((m) => (
          <article key={m.id} className="card p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row">
              <button onClick={() => setView(m)} className="h-36 w-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-brand-200 to-coral-400/60 dark:from-brand-800 sm:w-48" aria-label={`Preview ${m.title}`}>
                {m.images?.[0] ? <img src={m.images[0]} alt="" loading="lazy" className="h-full w-full object-cover" /> : <span className="text-4xl">{typeMeta(m.type).emoji}</span>}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><StatusBadge status={m.status} /><span className="text-xs text-slate-500">{m.year} · {m.batch} · {timeAgo(m.createdAt)}</span></div>
                <h3 className="mt-1.5 text-lg font-bold">{m.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{m.description}</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-500"><Avatar name={m.contributor.name} /> {m.contributor.name}</div>
                {m.duplicateTitle && (
                  <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
                    <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" /> Possible duplicate of “{m.duplicateTitle}”{m.duplicateScore ? ` (${Math.round(m.duplicateScore * 100)}% match)` : ''}
                  </p>
                )}
                {m.rejectReason && <p className="mt-2 text-sm text-rose-600">Reason: {m.rejectReason}</p>}
                {tab === 'reported' && <div className="mt-3 rounded-xl bg-rose-50 p-3 text-sm dark:bg-rose-500/10"><b>Reported</b>{m.reports?.map((r) => <p key={r.id}>{r.reason} · {r.userName} · {timeAgo(r.createdAt)}</p>)}</div>}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-900/5 pt-4 dark:border-white/10">
              {tab === 'reported' ? <><Button variant="secondary" size="sm" loading={busyId === m.id} onClick={() => act(m.id, () => memoryApi.dismissReport(m.id), 'Report dismissed')}>Dismiss report</Button><Button variant="danger" size="sm" loading={busyId === m.id} onClick={() => { if (window.confirm(`Delete “${m.title}”?`)) act(m.id, () => memoryApi.deleteReported(m.id), 'Reported memory deleted'); }}>Delete memory</Button></> : <><Button variant="ghost" size="sm" onClick={() => setEdit({ ...m })}>Edit date or year</Button>
              {m.status === STATUS.APPROVED && <Button variant="ghost" size="sm" onClick={() => act(m.id, () => memoryApi.setFeatured(m.id, !m.featured), m.featured ? 'Unpinned from home' : 'Pinned to home')}>{m.featured ? 'Unpin feature' : 'Pin feature'}</Button>}
              {m.status !== STATUS.REJECTED && <Button variant="secondary" size="sm" disabled={busyId === m.id} onClick={() => { setReject(m); setReason(''); }}>Reject</Button>}
              {m.status !== STATUS.APPROVED && <Button variant="success" size="sm" loading={busyId === m.id} onClick={() => approve(m)}><Icon name="check" className="h-4 w-4" /> Approve and publish</Button>}</>}
            </div>
          </article>
        ))}
        {data.hasMore && <div className="text-center"><Button variant="secondary" onClick={() => load(page + 1, true)}>Load more</Button></div>}
      </div>

      <Modal open={!!reject} onClose={() => setReject(null)} title="Reject memory">
        <div className="space-y-4 p-6 pt-12">
          <h2 className="text-xl font-bold">Reject “{reject?.title}”?</h2>
          <Input as="textarea" rows={3} label="Reason (shown to the student)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Already covered by the 2019 hackathon entry" />
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setReject(null)}>Cancel</Button><Button variant="danger" onClick={doReject}>Reject memory</Button></div>
        </div>
      </Modal>

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit date or year">
        <div className="space-y-4 p-6 pt-12">
          <h2 className="text-xl font-bold">Edit “{edit?.title}”</h2>
          <Input as="select" label="Year" value={edit?.year} onChange={(e) => setEdit({ ...edit, year: Number(e.target.value) })}>{YEARS.map((y) => <option key={y}>{y}</option>)}</Input>
          <Input type="date" label="Exact date" value={edit?.eventDate || ''} onChange={(e) => setEdit({ ...edit, eventDate: e.target.value })} />
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={doEdit}>Save changes</Button></div>
        </div>
      </Modal>

      <MemoryDetail memory={view} onClose={() => setView(null)} />
    </div>
  );
}
