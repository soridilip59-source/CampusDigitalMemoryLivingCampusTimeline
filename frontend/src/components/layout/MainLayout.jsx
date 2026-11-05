import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import useRealtimeToasts from '../../hooks/useRealtimeToasts';
import useAuth from '../../hooks/useAuth';

export default function MainLayout() {
  useRealtimeToasts();
  const location = useLocation(); const { user } = useAuth();
  useEffect(() => { const [root] = location.pathname.split('/').filter(Boolean); const titles = { submit: 'Submit a memory', 'my-submissions': 'My submissions', saved: 'Saved memories', admin: 'Admin review', collections: 'Collections', u: 'Contributor profile', login: 'Log in', register: 'Register' }; document.title = `${titles[root] || 'Campus Timeline'} · Campus Digital Memory`; }, [location.pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0"><Outlet /></main>
      <nav aria-label="Mobile tabs" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-900/10 bg-paper/95 px-2 pt-2 pb-[max(.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl dark:border-white/10 dark:bg-night/95 md:hidden"><Link to="/" className="py-1 text-center text-xs font-semibold">⌂<span className="block">Home</span></Link><Link to={user ? '/submit' : '/login'} className="py-1 text-center text-xs font-semibold">＋<span className="block">Submit</span></Link><Link to={user ? '/saved' : '/login'} className="py-1 text-center text-xs font-semibold">🔖<span className="block">Saved</span></Link><Link to={user ? '/my-submissions' : '/login'} className="py-1 text-center text-xs font-semibold">◉<span className="block">Profile</span></Link></nav>
      <Footer />
    </div>
  );
}
