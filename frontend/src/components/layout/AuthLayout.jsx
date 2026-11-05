import { Link, Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-20 top-1/4 h-80 w-80 animate-drift rounded-full bg-brand-600/50 blur-3xl" />
        <div className="absolute -right-10 bottom-10 h-72 w-72 animate-drift rounded-full bg-coral-500/30 blur-3xl [animation-delay:-6s]" />
        <Link to="/" className="relative flex items-center gap-2.5 font-display text-xl font-extrabold">
          <img src="/favicon.svg" alt="" className="h-9 w-9" /> Campus Digital Memory
        </Link>
        <div className="relative">
          <p className="year-outline select-none font-display text-[9rem] font-extrabold leading-none text-white/70">2018</p>
          <h2 className="mt-4 max-w-md text-3xl font-bold leading-tight">Every batch left something behind. Add yours.</h2>
          <p className="mt-3 max-w-md text-white/70">Photos, projects, events and wins from every year, in one place.</p>
        </div>
        <p className="relative text-sm text-white/50">Eight years of campus life and counting.</p>
      </aside>
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md"><Outlet /></div>
      </section>
    </div>
  );
}
