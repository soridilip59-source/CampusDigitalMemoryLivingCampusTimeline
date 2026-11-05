import { useEffect, useRef, useState } from 'react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Icon from '../common/Icon';
import StatusBadge from '../common/StatusBadge';
import { typeMeta } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import { useToast } from '../../context/ToastContext';
import useAuth from '../../hooks/useAuth';
import { getSaved, toggleSaved } from '../../utils/saved';
import Comments from './Comments';
import * as memoryApi from '../../api/memoryApi';
import { Link } from 'react-router-dom';

export default function MemoryDetail({ memory: m, onClose, onLike, onReact }) {
  const [idx, setIdx] = useState(0);
  const { user } = useAuth(); const [saved, setSaved] = useState(false); const [comments, setComments] = useState([]);
  const [reportReason, setReportReason] = useState('wrong info'); const [reportOpen, setReportOpen] = useState(false); const [reportedByMe, setReportedByMe] = useState(false);
  const [collections, setCollections] = useState([]);
  const touchX = useRef(null);
  const toast = useToast();
  useEffect(() => { setIdx(0); setComments(m?.comments || []); setSaved(!!user && !!m && getSaved(user.id).includes(m.id)); setCollections([]); if (m?.id) memoryApi.getCollectionsForMemory(m.id).then(setCollections).catch(() => {}); }, [m?.id, user?.id]);
  if (!m) return null;
  const t = typeMeta(m.type);

  const share = async () => {
    const url = `${location.origin}/?m=${m.id}`;
    try { await navigator.clipboard.writeText(url); toast.success('Link copied'); } catch { toast.info(url); }
  };
  const react = async (emoji) => { if (!user) return toast.info('Log in to react'); try { if (onReact) await onReact(m.id, emoji); else await memoryApi.toggleReaction(m.id, emoji); } catch (e) { toast.error(e.message); } };
  const stepPhoto = (step) => { const count = m.images?.length || 0; if (count > 1) setIdx((current) => (current + step + count) % count); };
  useEffect(() => { if (!m?.images || m.images.length < 2) return undefined; const onKey = (e) => { if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return; if (e.key === 'ArrowLeft') stepPhoto(-1); if (e.key === 'ArrowRight') stepPhoto(1); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [m?.id, m?.images?.length]);

  return (
    <Modal open onClose={onClose} title={m.title} size="lg">
      <div className="relative bg-gradient-to-br from-brand-200 to-coral-400/60 dark:from-brand-800 dark:to-coral-600/40" onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }} onTouchEnd={(e) => { if (touchX.current == null) return; const dx = e.changedTouches[0].clientX - touchX.current; if (Math.abs(dx) > 45) stepPhoto(dx < 0 ? 1 : -1); touchX.current = null; }}>
        {m.images?.length ? (
          <img src={m.images[idx]} alt={`${m.title} photo ${idx + 1}`} className="max-h-[55vh] w-full object-cover" />
        ) : (
          <div className="flex h-56 items-center justify-center text-7xl">{t.emoji}</div>
        )}
        {m.images?.length > 1 && <><button type="button" aria-label="Previous photo" onClick={() => stepPhoto(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur"><Icon name="chevronLeft"/></button><button type="button" aria-label="Next photo" onClick={() => stepPhoto(1)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur"><Icon name="chevronRight"/></button><span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2 py-1 text-xs text-white">{idx + 1} / {m.images.length}</span></>}
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
        {collections.length > 0 && <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm dark:bg-brand-500/10"><b>Part of: </b>{collections.map((c, i) => <span key={c.id}>{i > 0 && ', '}<Link to={`/collections/${c.id}`} onClick={onClose} className="font-semibold text-brand-700 underline dark:text-brand-300">{c.name}</Link></span>)}</p>}
        {m.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">{m.tags.map((x) => <span key={x} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">#{x}</span>)}</div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-900/5 pt-4 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <Avatar name={m.contributor?.name} size="h-9 w-9 text-xs" />
            <div className="text-sm"><Link to={`/u/${m.contributor?.id}`} className="font-semibold text-brand-700 hover:underline dark:text-brand-300">{m.contributor?.name}</Link><p className="text-slate-500">Contributor</p></div>
          </div>
          <div className="flex gap-2">
            <button onClick={share} className="chip"><Icon name="link" className="h-4 w-4" /> Copy link</button>
            <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${m.title} — ${location.origin}/?m=${m.id}`)}`, '_blank', 'noopener,noreferrer')} className="chip">WhatsApp</button>
            {user && <button onClick={() => setSaved(toggleSaved(user.id, m.id).includes(m.id))} aria-pressed={saved} aria-label={saved ? 'Remove saved memory' : 'Save memory'} className="chip">{saved ? '🔖 Saved' : '♧ Save'}</button>}
            {m.status === 'approved' && (
              <button onClick={() => onLike?.(m.id)} className={`chip ${m.liked ? '!text-coral-500 !ring-coral-500' : ''}`} aria-pressed={m.liked}>
                <Icon name="heart" className="h-4 w-4" fill={m.liked} /> {m.likesCount}
              </button>
            )}
          </div>
        </div>
        {m.status === 'approved' && <><div className="flex flex-wrap gap-2">{['❤️', '😂', '😢', '🔥'].map((emoji) => <button key={emoji} onClick={() => react(emoji)} aria-label={`React ${emoji}`} aria-pressed={m.myReaction === emoji} className={`chip ${m.myReaction === emoji ? 'chip-on' : ''}`}>{emoji} {m.reactionCounts?.[emoji] || 0}</button>)}</div><Comments memory={m} initial={m.comments || comments} onChange={setComments}/></>}
        {m.status === 'approved' && user && <div className="border-t border-slate-900/5 pt-3 dark:border-white/10"><button className="text-sm font-semibold text-slate-500 hover:text-rose-600" onClick={() => setReportOpen((v) => !v)}>{reportedByMe ? 'Report submitted' : 'Report this memory'}</button>{reportOpen && <form className="mt-3 flex flex-wrap gap-2" onSubmit={async (e) => { e.preventDefault(); try { await memoryApi.report(m.id, reportReason); setReportedByMe(true); setReportOpen(false); toast.success('Report sent to admins'); } catch (error) { toast.error(error.message); } }}><select className="field w-auto" aria-label="Report reason" value={reportReason} onChange={(e) => setReportReason(e.target.value)}><option value="wrong info">Wrong information</option><option value="duplicate">Duplicate</option><option value="inappropriate">Inappropriate</option></select><button className="chip" type="submit">Submit report</button></form>}</div>}
      </div>
    </Modal>
  );
}
