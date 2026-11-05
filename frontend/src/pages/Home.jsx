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

  useEffect(() => {
    const load = () => memoryApi.getStats().then(setStats).catch(() => {});
    load();
    return realtime.on(EV.PUBLISHED, load);
  }, []);

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

  const sentinel = useInfiniteScroll(loadMore, hasMore && !loading && !loadingMore);
  const years = CURRENT_YEAR - START_YEAR + 1;

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
        <MemoryFilters filters={filters} onChange={setFilters} stats={stats} />

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
              <MemoryTimeline items={items} onOpen={open} onLike={like} />
              <div ref={sentinel} className="flex h-24 items-center justify-center">
                {loadingMore ? <Loader /> : hasMore ? <Button variant="secondary" onClick={loadMore}>Load more</Button> : <p className="text-sm text-slate-500">You have reached the start of the story. 🎓</p>}
              </div>
            </>
          )}
        </div>
      </section>

      <MemoryDetail memory={current} onClose={close} onLike={like} />
    </>
  );
}
