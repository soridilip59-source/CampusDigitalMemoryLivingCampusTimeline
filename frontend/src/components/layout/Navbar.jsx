import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import Icon from '../common/Icon';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [dark, toggleTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const links = [
    { to: '/', label: 'Timeline', end: true },
    ...(user ? [{ to: '/submit', label: 'Add a memory' }, { to: '/my-submissions', label: 'My submissions' }] : []),
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
    </header>
  );
}