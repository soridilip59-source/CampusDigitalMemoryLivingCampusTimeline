import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Icon from '../common/Icon';
import StatusBadge from '../common/StatusBadge';
import { typeMeta } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import { useToast } from '../../context/ToastContext';

export default function MemoryDetail({ memory: m, onClose, onLike }) {
  const [idx, setIdx] = useState(0);
  const toast = useToast();
  useEffect(() => setIdx(0), [m?.id]);
  if (!m) return null;
  const t = typeMeta(m.type);

  const share = async () => {
    const url = `${location.origin}/?m=${m.id}`;
    try { await navigator.clipboard.writeText(url); toast.success('Link copied'); } catch { toast.info(url); }
  };

  return (
    <Modal open onClose={onClose} title={m.title} size="lg">
      <div className="bg-gradient-to-br from-brand-200 to-coral-400/60 dark:from-brand-800 dark:to-coral-600/40">
        {m.images?.length ? (
          <img src={m.images[idx]} alt={`${m.title} photo ${idx + 1}`} className="max-h-[55vh] w-full object-cover" />
        ) : (
          <div className="flex h-56 items-center justify-center text-7xl">{t.emoji}</div>
        )}
      </div>
      {m.images?.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto p-3">
          {m.images.map((src, i) => (
            <button key={i} onClick={() => setIdx(i)} aria-label={`Photo ${i + 1}`} className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 ${i === idx ? 'ring-brand-500' : 'ring-transparent opacity-70'}`}>
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="space-y-5 p-5 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <span className="chip !py-1">{t.emoji} {t.label}</span>
          <span className="chip !py-1"><Icon name="calendar" className="h-4 w-4" /> {m.eventDate ? formatDate(m.eventDate) : m.year}</span>
          <span className="chip !py-1">{m.batch}</span>
          {m.status && m.status !== 'approved' && <StatusBadge status={m.status} />}
        </div>
        <h2 className="text-3xl font-extrabold leading-tight">{m.title}</h2>
        <p className="whitespace-pre-line text-base leading-relaxed text-slate-700 dark:text-slate-300">{m.description}</p>

        {m.related && (
          <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm dark:bg-brand-500/10">
            <span className="font-bold">Connected to: </span>{m.related}
          </p>
        )}
        {m.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">{m.tags.map((x) => <span key={x} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">#{x}</span>)}</div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-900/5 pt-4 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <Avatar name={m.contributor?.name} size="h-9 w-9 text-xs" />
            <div className="text-sm"><p className="font-semibold">{m.contributor?.name}</p><p className="text-slate-500">Contributor</p></div>
          </div>
          <div className="flex gap-2">
            <button onClick={share} className="chip"><Icon name="link" className="h-4 w-4" /> Copy link</button>
            {m.status === 'approved' && (
              <button onClick={() => onLike?.(m.id)} className={`chip ${m.liked ? '!text-coral-500 !ring-coral-500' : ''}`} aria-pressed={m.liked}>
                <Icon name="heart" className="h-4 w-4" fill={m.liked} /> {m.likesCount}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}