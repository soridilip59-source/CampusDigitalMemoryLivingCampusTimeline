import { memo, useState } from 'react';
import Icon from '../common/Icon';
import Avatar from '../common/Avatar';
import { typeMeta } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import useAuth from '../../hooks/useAuth';
import { readSaved, toggleSaved } from '../../utils/saved';
import { Link } from 'react-router-dom';

function MemoryCard({ memory: m, onOpen, onLike, onReact, preview = false }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(() => user ? readSaved(user.id).includes(m.id) : false);
  const t = typeMeta(m.type);
  const cover = m.images?.[0];
  return (
    <article className="card group overflow-hidden p-3 transition duration-300 hover:-translate-y-1 hover:rotate-[.25deg] hover:shadow-xl hover:shadow-brand-600/10 motion-reduce:transform-none">
      <button type="button" onClick={() => onOpen?.(m)} disabled={preview} className="block w-full text-left">
        <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-gradient-to-br from-brand-200 to-coral-400/60 dark:from-brand-800 dark:to-coral-600/40">
          {cover ? (
            <img src={cover} alt={m.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">{t.emoji}</div>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-ink backdrop-blur">{t.emoji} {t.label}</span>
          {m.images?.length > 1 && (
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
              <Icon name="image" className="h-3.5 w-3.5" /> {m.images.length}
            </span>
          )}
        </div>
        <div className="px-1.5 pb-1 pt-4">
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-300">{m.eventDate ? formatDate(m.eventDate) : m.year} · {m.batch}</p>
          <h3 className="mt-1 text-lg font-bold leading-snug">{m.title}</h3>
          <p className="mt-1.5 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{m.description}</p>
        </div>
      </button>
      <div className="mt-3 flex items-center justify-between gap-2 px-1.5 pb-1">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={m.contributor?.name} />
          <Link to={`/u/${m.contributor?.id}`} className="truncate text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300">{m.contributor?.name}</Link>
        </div>
        <button
          type="button" disabled={preview}
          onClick={() => onLike?.(m.id)}
          aria-pressed={m.liked} aria-label={m.liked ? 'Remove like' : 'Like this memory'}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold transition hover:bg-coral-500/10 ${m.liked ? 'text-coral-500' : 'text-slate-500'}`}
        >
          <Icon name="heart" className="h-4 w-4" fill={m.liked} /> {m.likesCount}
        </button>
      </div>
      {!preview && <div className="flex items-center gap-1 px-1.5 pb-1">
        {['❤️', '😂', '😢', '🔥'].map((emoji) => <button key={emoji} onClick={() => onReact?.(m.id, emoji)} aria-label={`React ${emoji}`} className={`rounded-full px-2 py-1 text-xs hover:bg-brand-50 dark:hover:bg-white/10 ${m.myReaction === emoji ? 'bg-brand-100 dark:bg-brand-500/20' : ''}`}>{emoji} {m.reactionCounts?.[emoji] || 0}</button>)}
        <button type="button" onClick={() => onOpen?.(m)} className="ml-auto text-xs text-slate-500">{m.comments?.length || 0} comments</button>
        {user && <button type="button" onClick={() => setSaved(toggleSaved(user.id, m.id).includes(m.id))} aria-label={saved ? 'Remove saved memory' : 'Save memory'} aria-pressed={saved} className="rounded-full px-2 py-1 text-xs">{saved ? '🔖' : '♧'}</button>}
      </div>}
    </article>
  );
}

export default memo(MemoryCard);
