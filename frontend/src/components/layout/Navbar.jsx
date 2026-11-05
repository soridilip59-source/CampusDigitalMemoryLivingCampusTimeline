import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import Icon from '../common/Icon';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import * as memoryApi from '../../api/memoryApi';
import { realtime, EV } from '../../utils/realtime';
import { timeAgo } from '../../utils/formatDate';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [dark, toggleTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [accent, setAccent] = useState(() => localStorage.getItem('cdm_accent') || '#7c5cff');
  const navigate = useNavigate();
  useEffect(() => { if (!user) { setNotifications([]); setUnread(0); return undefined; } const load = () => Promise.all([memoryApi.listNotifications(), memoryApi.unreadCount()]).then(([n, c]) => { setNotifications(n.slice(0, 8)); setUnread(c); }).catch(() => {}); load(); return realtime.on(EV.NOTIFY, load); }, [user]);
  useEffect(() => { const key = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(true); } if (e.key === 'Escape') setPalette(false); }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, []);
  useEffect(() => { if (search.trim()) memoryApi.list({ q: search, limit: 6 }).then((r) => setResults(r.items)).catch(() => setResults([])); else setResults([]); }, [search]);
  useEffect(() => { document.documentElement.style.setProperty('--accent-color', accent); localStorage.setItem('cdm_accent', accent); }, [accent]);

  const links = [
    { to: '/', label: 'Timeline', end: true },
    { to: '/collections', label: 'Collections' },
    ...(user ? [{ to: '/submit', label: 'Add a memory' }, { to: '/my-submissions', label: 'My submissions' }, { to: '/saved', label: 'Saved' }] : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Review queue' }] : []),
  ];
  const cls = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10'}`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-900/5 bg-paper/80 backdrop-blur-xl dark:border-white/10 dark:bg-night/80" style={{ height: 'var(--header-h)' }}>
      <div className="mx-auto flex h-full max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-extrabold">
          <img src="/favicon.svg" alt="" className="h-8 w-8" />
          <span className="hidden sm:inline">Campus Digital Memory</span>
          <span className="sm:hidden">CDM</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {links.map((l) => <NavLink key={l.to} {...l} className={cls}>{l.label}</NavLink>)}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={toggleTheme} className="rounded-lg p-2 text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10" aria-label="Toggle dark mode">
            <Icon name={dark ? 'sun' : 'moon'} />
          </button>
          <label className="relative cursor-pointer rounded-lg p-2 text-slate-600 hover:bg-slate-900/5 dark:text-slate-300" aria-label="Choose accent color" title="Accent color"><span aria-hidden="true">◉</span><input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Choose accent color" /></label>
          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <div className="relative"><button onClick={() => setBellOpen((v) => !v)} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={bellOpen} className="relative rounded-lg p-2 hover:bg-slate-900/5 dark:hover:bg-white/10"><Icon name="bell" />{unread > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-coral-500 px-1 text-[10px] font-bold text-white">{unread}</span>}</button>
                {bellOpen && <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-[#171629]"><div className="flex justify-between px-2 pb-2"><b>Notifications</b><button className="text-xs text-brand-600" onClick={async () => { await memoryApi.markAllRead(); const [n,c] = await Promise.all([memoryApi.listNotifications(), memoryApi.unreadCount()]); setNotifications(n.slice(0,8)); setUnread(c); }}>Mark all as read</button></div>{notifications.length ? notifications.map((n) => <button key={n.id} onClick={async () => { await memoryApi.markNotificationRead(n.id); setBellOpen(false); navigate(`/?m=${n.memoryId}`); }} className="flex w-full gap-2 rounded-xl p-2 text-left hover:bg-slate-100 dark:hover:bg-white/10"><Avatar name={n.actorName} /><span className="min-w-0 text-xs"><b className="block truncate">{n.text}</b><span className="text-slate-500">{timeAgo(n.createdAt)}</span></span></button>) : <p className="p-4 text-center text-sm text-slate-500">You’re all caught up</p>}<Link to="/notifications" onClick={() => setBellOpen(false)} className="block border-t p-2 text-center text-sm font-semibold text-brand-600">View all</Link></div>}</div>
              <Avatar name={user.name} size="h-9 w-9 text-xs" />
              <span className="max-w-[9rem] truncate text-sm font-semibold">{user.name}</span>
              <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/'); }}>Log out</Button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button as={Link} to="/login" variant="ghost" size="sm">Log in</Button>
              <Button as={Link} to="/register" size="sm">Join</Button>
            </div>
          )}
          <button className="rounded-lg p-2 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            <Icon name={open ? 'x' : 'menu'} />
          </button>
        </div>
      </div>

      {open && (
        <div className="animate-fade border-b border-slate-900/5 bg-paper p-4 dark:border-white/10 dark:bg-night md:hidden" onClick={() => setOpen(false)}>
          <nav className="flex flex-col gap-1">
            {links.map((l) => <NavLink key={l.to} {...l} className={cls}>{l.label}</NavLink>)}
            {user ? (
              <button onClick={() => { logout(); navigate('/'); }} className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-600">Log out ({user.name})</button>
            ) : (
              <>
                <NavLink to="/login" className={cls}>Log in</NavLink>
                <NavLink to="/register" className={cls}>Join the archive</NavLink>
              </>
            )}
          </nav>
        </div>
      )}
      {palette && <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[15vh]" role="dialog" aria-modal="true" aria-label="Search memories" onMouseDown={(e) => { if (e.target === e.currentTarget) setPalette(false); }}><div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#171629]"><input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search memories…" aria-label="Search memories" className="w-full border-b border-slate-200 bg-transparent px-5 py-4 outline-none dark:border-white/10" onKeyDown={(e) => { if (e.key === 'ArrowDown') document.querySelector('[data-palette-result]')?.focus(); }} />{results.map((m) => <button data-palette-result key={m.id} onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); e.currentTarget.nextElementSibling?.focus(); } if (e.key === 'ArrowUp') { e.preventDefault(); e.currentTarget.previousElementSibling?.focus(); } if (e.key === 'Enter') { navigate(`/?m=${m.id}`); setPalette(false); } }} onClick={() => { navigate(`/?m=${m.id}`); setPalette(false); }} className="block w-full px-5 py-3 text-left hover:bg-slate-100 focus:bg-slate-100 focus:outline-none dark:hover:bg-white/10 dark:focus:bg-white/10"><b className="block">{m.title}</b><span className="text-sm text-slate-500">{m.year} · {m.contributor.name}</span></button>)}{search && !results.length && <p className="p-5 text-sm text-slate-500">No matching memories</p>}<p className="border-t p-3 text-xs text-slate-500">↑ ↓ to move · Enter to open · Esc to close · Ctrl K</p></div></div>}
    </header>
  );
}
