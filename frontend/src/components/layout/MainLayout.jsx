import { Outlet, useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import useRealtimeToasts from '../../hooks/useRealtimeToasts';

export default function MainLayout() {
  useRealtimeToasts();
  const location = useLocation();
  useEffect(() => { const name = location.pathname.split('/').filter(Boolean)[0]; const titles = { submit: 'Add a memory', 'my-submissions': 'My submissions', notifications: 'Notifications', saved: 'Saved memories', admin: 'Review queue', collections: 'Collections', login: 'Log in', register: 'Join the archive' }; document.title = `${titles[name] || 'Campus Timeline'} · Campus Digital Memory`; }, [location.pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0"><Outlet /></main>
      <nav aria-label="Mobile shortcuts" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-paper/90 px-2 py-2 pb-[max(.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl dark:border-white/10 dark:bg-night/90 md:hidden"><Link to="/" className="py-2 text-center text-xs font-semibold">⌂<span className="block">Home</span></Link><Link to="/submit" className="py-2 text-center text-xs font-semibold">＋<span className="block">Submit</span></Link><Link to="/saved" className="py-2 text-center text-xs font-semibold">🔖<span className="block">Saved</span></Link><Link to="/my-submissions" className="py-2 text-center text-xs font-semibold">◉<span className="block">Profile</span></Link></nav>
      <Footer />
    </div>
  );
}
