import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Icon from '../common/Icon';
import StatusBadge from '../common/StatusBadge';
import { typeMeta } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import { useToast } from '../../context/ToastContext';
import useAuth from '../../hooks/useAuth';
import * as memoryApi from '../../api/memoryApi';

export default function MemoryDetail({ memory: m, onClose, onLike, onReact }) {
  const [idx, setIdx] = useState(0);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  useEffect(() => { setIdx(0); setComments(m?.comments || []); setComment(''); }, [m?.id, m?.comments]);
  if (!m) return null;
  const t = typeMeta(m.type);

  const share = async () => {
    const url = `${location.origin}/?m=${m.id}`;
    try { await navigator.clipboard.writeText(url); toast.success('Link copied'); } catch { toast.info(url); }
  };
  const shareWhatsApp = () => { const url = `${location.origin}/?m=${m.id}`; window.open(`https://wa.me/?text=${encodeURIComponent(`${m.title} — ${url}`)}`, '_blank', 'noopener,noreferrer'); };
  const downloadCard = () => { const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 630; const ctx = canvas.getContext('2d'); const gradient = ctx.createLinearGradient(0, 0, 1200, 630); gradient.addColorStop(0, '#4a2db3'); gradient.addColorStop(1, '#ff6b4a'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1200, 630); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(1080, 75, 250, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '700 28px Arial'; ctx.fillText('CAMPUS DIGITAL MEMORY', 72, 90); ctx.font = '700 64px Arial'; const words = m.title.split(' '); let line = ''; let y = 260; words.forEach((word) => { const next = `${line}${word} `; if (ctx.measureText(next).width > 1040) { ctx.fillText(line, 72, y); y += 76; line = `${word} `; } else line = next; }); ctx.fillText(line, 72, y); ctx.font = '28px Arial'; ctx.fillText(`${m.year} · ${m.batch || ''}`, 72, 510); ctx.font = '22px Arial'; ctx.fillText(`Shared by ${m.contributor?.name || 'Campus community'}`, 72, 560); const a = document.createElement('a'); a.download = 'campus-memory.png'; a.href = canvas.toDataURL('image/png'); a.click(); };

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
            <button onClick={shareWhatsApp} className="chip">WhatsApp</button><button onClick={downloadCard} className="chip">Download card</button>
            {user && m.status === 'approved' && <button onClick={async () => { try { await memoryApi.report(m.id); toast.success('Report sent to campus admins'); } catch (e) { toast.error(e.message); } }} className="chip" aria-label="Report memory">Report</button>}
            {m.status === 'approved' && (
              <button onClick={() => onLike?.(m.id)} className={`chip ${m.liked ? '!text-coral-500 !ring-coral-500' : ''}`} aria-pressed={m.liked}>
                <Icon name="heart" className="h-4 w-4" fill={m.liked} /> {m.likesCount}
              </button>
            )}
          </div>
        </div>
        {m.status === 'approved' && <section className="space-y-3 border-t border-slate-900/5 pt-4 dark:border-white/10" aria-label="Comments">
          <h3 className="font-bold">Conversation <span className="text-sm font-medium text-slate-500">({comments.length})</span></h3>
          <div className="flex flex-wrap gap-1">{['❤️', '😂', '😢', '🔥'].map((emoji) => <button key={emoji} onClick={() => onReact?.(m.id, emoji)} aria-label={`React ${emoji}`} className={`chip !px-2 !py-1 ${m.myReaction === emoji ? 'chip-on' : ''}`}>{emoji} {m.reactionCounts?.[emoji] || 0}</button>)}</div>
          <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (!user) return toast.info('Log in to comment'); if (comment.trim().length < 1 || comment.trim().length > 300) return toast.error('Comment must be 1–300 characters'); try { const r = await memoryApi.addComment(m.id, comment); setComments(r.comments); setComment(''); } catch (err) { toast.error(err.message); } }}>
            <input value={comment} maxLength={300} onChange={(e) => setComment(e.target.value)} placeholder={user ? 'Write a comment…' : 'Log in to join the conversation'} aria-label="Write a comment" className="input min-w-0 flex-1" />
            <button className="btn-primary" type="submit" disabled={!user || !comment.trim()}>Post</button>
          </form>
          <div className="max-h-52 space-y-2 overflow-y-auto">{comments.map((c) => <div key={c.id} className="rounded-xl bg-slate-50 p-3 dark:bg-white/5"><div className="flex justify-between gap-2 text-sm"><b>{c.userName}</b>{(user?.id === c.userId || isAdmin) && <button aria-label="Delete comment" className="text-rose-600" onClick={async () => { try { const r = await memoryApi.deleteComment(m.id, c.id); setComments(r.comments); } catch (e) { toast.error(e.message); } }}>Delete</button>}</div><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{c.text}</p></div>)}</div>
        </section>}
      </div>
    </Modal>
  );
}
