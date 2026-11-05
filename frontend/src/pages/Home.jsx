import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useDebounce from '../hooks/useDebounce';
import useMemories from '../hooks/useMemories';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import * as memoryApi from '../api/memoryApi';
import { realtime, EV } from '../utils/realtime';
import { CURRENT_YEAR, START_YEAR } from '../utils/constants';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Loader, { CardSkeleton, EmptyState, ErrorState } from '../components/common/Loader';
import MemoryFilters from '../components/memory/MemoryFilters';
import MemoryTimeline from '../components/memory/MemoryTimeline';
import MemoryDetail from '../components/memory/MemoryDetail';
import MemoryCard from '../components/memory/MemoryCard';

const EMPTY = { q: '', year: '', batch: '', type: '', sort: 'desc' };

export default function Home() {
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(EMPTY);
  const debouncedQ = useDebounce(filters.q, 350);
  const query = useMemo(() => ({ ...filters, q: debouncedQ.trim() }), [filters, debouncedQ]);

  const { items, total, loading, loadingMore, error, hasMore, loadMore, toggleLike, retry } = useMemories(query);
  const [stats, setStats] = useState(null);
  const [openId, setOpenId] = useState(params.get('m'));
  const [deepLinked, setDeepLinked] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [calendar, setCalendar] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [grid, setGrid] = useState(false);
  const [tour, setTour] = useState(() => !localStorage.getItem('cdm_tour_done'));
  const [tourStep, setTourStep] = useState(0);

  useEffect(() => {
    const load = () => memoryApi.getStats().then(setStats).catch(() => {});
    load();
    return realtime.on(EV.PUBLISHED, load);
  }, []);
  useEffect(() => { memoryApi.listFeatured().then(setFeatured).catch(() => {}); }, []);

  // open a shared link (?m=ID)
  useEffect(() => {
    if (openId && !items.some((m) => m.id === openId))
      memoryApi.getById(openId).then(setDeepLinked).catch(() => { toast.error('That memory is not available'); setOpenId(null); });
  }, [openId]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = openId ? items.find((m) => m.id === openId) || deepLinked : null;
  const open = useCallback((m) => { setOpenId(m.id); setParams({ m: m.id }, { replace: true }); }, [setParams]);
  const close = useCallback(() => { setOpenId(null); setDeepLinked(null); setParams({}, { replace: true }); }, [setParams]);
  const like = useCallback((id) => {
    if (!user) return toast.info('Log in to like memories');
    toggleLike(id);
  }, [user, toggleLike, toast]);
  const react = useCallback(async (id, emoji) => { if (!user) return toast.info('Log in to react'); try { await memoryApi.toggleReaction(id, emoji); retry(); } catch (e) { toast.error(e.message); } }, [user, toast, retry]);

  const sentinel = useInfiniteScroll(loadMore, hasMore && !loading && !loadingMore);
  const years = CURRENT_YEAR - START_YEAR + 1;
  const now = new Date();
  const thisDay = items.filter((m) => m.eventDate && m.eventDate.slice(5) === `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}` && Number(m.year) < CURRENT_YEAR);
  const trending = [...items].map((m) => ({ ...m, weekScore: (m.engagement || []).filter((e) => Date.now() - new Date(e.at).getTime() < 7 * 86400000).length })).filter((m) => m.weekScore).sort((a, b) => b.weekScore - a.weekScore).slice(0, 3);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1); const dayCount = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayItems = selectedDay ? items.filter((m) => m.eventDate?.slice(0, 10) === selectedDay) : [];
  const surprise = async () => { const r = await memoryApi.list({ limit: 100 }); const choices = r.items; if (choices.length) open(choices[Math.floor(Math.random() * choices.length)]); };

  return (
    <>
      {/* hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute -left-24 -top-24 h-96 w-96 animate-drift rounded-full bg-brand-600/50 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 animate-drift rounded-full bg-coral-500/25 blur-3xl [animation-delay:-7s]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold backdrop-blur">
            <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" /></span>
            Live: new memories appear without refreshing
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            {years} years of campus life, kept by the students who lived it.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/70">Browse every batch’s projects, events and wins. Then add the story your batch would hate to see forgotten.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button as={Link} to={user ? '/submit' : '/register'} variant="coral" size="lg">{user ? 'Add a memory' : 'Join and contribute'}</Button>
            <Button as="a" href="#timeline" variant="secondary" size="lg" className="!bg-white/10 !text-white !ring-white/20 hover:!bg-white/20">Explore the timeline</Button>
          </div>
          <dl className="mt-12 flex flex-wrap gap-x-12 gap-y-4">
            {[[stats?.total, 'memories published'], [stats?.contributors, 'contributors'], [years, 'years covered']].map(([n, l]) => (
              <div key={l}><dt className="sr-only">{l}</dt><dd className="font-display text-4xl font-extrabold">{n ?? '–'}<span className="ml-2 text-sm font-medium text-white/60">{l}</span></dd></div>
            ))}
          </dl>
        </div>
      </section>

      <section id="timeline" className="mx-auto max-w-6xl px-4 py-10">
        {featured.length > 0 && <section className="mb-10"><div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-bold">Featured memories</h2><span className="text-sm text-slate-500">Pinned by campus admins</span></div><div className="no-scrollbar flex gap-4 overflow-x-auto pb-3">{featured.map((m) => <div key={m.id} className="w-72 shrink-0"><MemoryCard memory={m} onOpen={open} onLike={like} onReact={react} /></div>)}</div></section>}
        {thisDay.length > 0 && <section className="mb-8 rounded-2xl bg-brand-50 p-4 dark:bg-brand-500/10"><h2 className="font-bold">On this day</h2><div className="mt-2 flex flex-wrap gap-3">{thisDay.map((m) => <button key={m.id} className="text-sm font-semibold text-brand-700 dark:text-brand-300" onClick={() => open(m)}>{m.year}: {m.title}</button>)}</div></section>}
        {trending.length > 0 && <section className="mb-8"><h2 className="mb-3 text-xl font-bold">Trending this week</h2><div className="grid gap-4 sm:grid-cols-3">{trending.map((m) => <MemoryCard key={m.id} memory={m} onOpen={open} onLike={like} onReact={react} />)}</div></section>}
        <div className="sticky z-30 -mx-4 bg-paper/85 px-4 py-3 backdrop-blur-xl dark:bg-night/85" style={{ top: 'var(--header-h)' }}><MemoryFilters filters={filters} onChange={setFilters} stats={stats} /></div>
        <div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={() => setCalendar((v) => !v)}>{calendar ? 'Timeline view' : 'Calendar view'}</Button><Button variant="secondary" size="sm" onClick={() => setGrid((v) => !v)}>{grid ? 'Timeline layout' : 'Grid layout'}</Button><Button variant="secondary" size="sm" onClick={surprise}>Surprise me</Button></div>
        {calendar && <div className="mt-5 grid grid-cols-7 gap-1 rounded-2xl p-2 sm:gap-2">{Array.from({ length: monthStart.getDay() }, (_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: dayCount }, (_, i) => { const day = i + 1; const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; const count = items.filter((m) => m.eventDate?.slice(0, 10) === key).length; return <button key={key} onClick={() => setSelectedDay(key)} className={`rounded-xl border p-2 text-sm ${selectedDay === key ? 'bg-brand-600 text-white' : 'border-slate-200 dark:border-white/10'}`}>{day}{count > 0 && <span className="mx-auto mt-1 block h-1.5 w-1.5 rounded-full bg-coral-500" aria-label={`${count} memories`} />}</button>; })}</div>}
        {calendar && selectedDay && <div className="mt-3 flex flex-wrap gap-2">{dayItems.length ? dayItems.map((m) => <button key={m.id} onClick={() => open(m)} className="chip">{m.title}</button>) : <span className="text-sm text-slate-500">No memories on this date yet.</span>}</div>}

        <div className="mt-10">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}</div>
          ) : error ? (
            <ErrorState message={error} onRetry={retry} />
          ) : items.length === 0 ? (
            <EmptyState emoji="🔎" title="No memories match yet" text="Try removing a filter, or be the first to add this one."
              action={<div className="flex justify-center gap-2"><Button variant="secondary" onClick={() => setFilters(EMPTY)}>Clear filters</Button><Button as={Link} to={user ? '/submit' : '/register'}>Add a memory</Button></div>} />
          ) : (
            <>
              <p className="mb-6 text-sm font-medium text-slate-500">Showing {items.length} of {total} {total === 1 ? 'memory' : 'memories'}</p>
              {grid ? <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">{items.map((m) => <div className="mb-5 break-inside-avoid animate-fade" key={m.id}><MemoryCard memory={m} onOpen={open} onLike={like} onReact={react} /></div>)}</div> : <MemoryTimeline items={items} onOpen={open} onLike={like} onReact={react} />}
              <div ref={sentinel} className="flex h-24 items-center justify-center">
                {loadingMore ? <Loader /> : hasMore ? <Button variant="secondary" onClick={loadMore}>Load more</Button> : <p className="text-sm text-slate-500">You have reached the start of the story. 🎓</p>}
              </div>
            </>
          )}
        </div>
      </section>

      <MemoryDetail memory={current} onClose={close} onLike={like} onReact={react} />
      {tour && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-night/55 p-4" role="dialog" aria-modal="true" aria-label="Campus timeline tour"><div className="card w-full max-w-md p-6"><p className="text-xs font-bold uppercase tracking-widest text-brand-600">Welcome · {tourStep + 1} of 3</p><h2 className="mt-2 text-2xl font-extrabold">{['Explore your campus story', 'Find a memory', 'Save and contribute'][tourStep]}</h2><p className="mt-2 text-slate-600 dark:text-slate-300">{['Browse photos and stories from every batch in the timeline.', 'Filter by year or topic, or open the calendar to revisit a date.', 'Bookmark the stories you love and add your batch’s memories.'][tourStep]}</p><div className="mt-5 flex justify-between"><button className="text-sm text-slate-500" onClick={() => { setTour(false); localStorage.setItem('cdm_tour_done', '1'); }}>Skip tour</button><Button onClick={() => { if (tourStep === 2) { setTour(false); localStorage.setItem('cdm_tour_done', '1'); } else setTourStep((n) => n + 1); }}>{tourStep === 2 ? 'Start exploring' : 'Next'}</Button></div></div></div>}
    </>
  );
}
