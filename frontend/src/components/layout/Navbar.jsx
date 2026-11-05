import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import Icon from '../common/Icon';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import NotificationBell from './NotificationBell';
import * as memoryApi from '../../api/memoryApi';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [dark, toggleTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false); const [q, setQ] = useState(''); const [results, setResults] = useState([]); const [active, setActive] = useState(0);
  const [accentMenu, setAccentMenu] = useState(false); const [accent, setAccent] = useState(() => localStorage.getItem('cdm_accent') || 'violet');
  const navigate = useNavigate();
  const accents = { violet: [252, 100], blue: [217, 92], teal: [173, 80], green: [142, 68], rose: [343, 82], amber: [36, 90] };
  useEffect(() => { const [hue, saturation] = accents[accent] || accents.violet; const lightness = [97, 94, 87, 78, 69, 62, 55, 47, 38, 29]; const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]; shades.forEach((shade, i) => document.documentElement.style.setProperty(`--brand-${shade}`, `${hue} ${Math.min(saturation, i > 5 ? saturation - (i - 5) * 5 : saturation)}% ${lightness[i]}%`)); localStorage.setItem('cdm_accent', accent); }, [accent]);
  useEffect(() => { const key = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(true); } if (e.key === 'Escape') setPalette(false); }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, []);
  useEffect(() => { let live = true; if (!q.trim()) { setResults([]); return () => { live = false; }; } memoryApi.list({ q, limit: 8 }).then((r) => { if (live) { setResults(r.items); setActive(0); } }).catch(() => live && setResults([])); return () => { live = false; }; }, [q]);

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
          <div className="relative"><button type="button" aria-label="Choose accent color" aria-expanded={accentMenu} onClick={() => setAccentMenu((v) => !v)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10">🎨</button>{accentMenu && <div className="absolute right-0 top-12 z-50 grid w-40 grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-[#171629]">{Object.entries(accents).map(([name, [hue, sat]]) => <button key={name} type="button" aria-label={`${name} accent`} aria-pressed={accent === name} title={name} onClick={() => { setAccent(name); setAccentMenu(false); }} className={`h-8 w-8 rounded-full ring-2 ring-offset-2 dark:ring-offset-[#171629] ${accent === name ? 'ring-ink dark:ring-white' : 'ring-transparent'}`} style={{ backgroundColor: `hsl(${hue} ${sat}% 58%)` }}/>)}</div>}</div>
          {user && <NotificationBell />}
          <button type="button" onClick={() => setPalette(true)} aria-label="Search memories" className="hidden rounded-lg px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200 md:inline-flex">Search <kbd className="ml-2 rounded bg-slate-100 px-1.5 py-0.5">Ctrl K</kbd></button>
          {user ? (
            <div className="hidden items-center gap-2 md:flex">
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
      {palette && <div className="fixed inset-0 z-[100] flex items-start justify-center bg-night/60 p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search memories" onMouseDown={(e) => { if (e.target === e.currentTarget) setPalette(false); }}><div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#171629]"><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search memories…" aria-label="Search memories. Use arrow keys to select, Enter to open, Escape to close." className="w-full border-b border-slate-200 bg-transparent px-5 py-4 outline-none dark:border-white/10" onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(results.length - 1, i + 1)); } if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); } if (e.key === 'Enter' && results[active]) { navigate(`/?m=${results[active].id}`); setPalette(false); setQ(''); } }} />{results.map((m, i) => <button key={m.id} onMouseEnter={() => setActive(i)} onClick={() => { navigate(`/?m=${m.id}`); setPalette(false); setQ(''); }} className={`block w-full px-5 py-3 text-left ${i === active ? 'bg-brand-50 dark:bg-white/10' : ''}`}><b className="block">{m.title}</b><span className="text-sm text-slate-500">{m.year} · {m.contributor.name}</span></button>)}{q && !results.length && <p className="p-5 text-sm text-slate-500">No matching memories</p>}<p className="border-t p-3 text-xs text-slate-500">↑ ↓ move · Enter open · Esc close · Ctrl/⌘ K</p></div></div>}
    </header>
  );
}
