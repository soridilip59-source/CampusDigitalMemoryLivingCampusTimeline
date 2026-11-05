import { useCallback, useEffect, useRef, useState } from 'react';
import * as memoryApi from '../api/memoryApi';
import { realtime, EV } from '../utils/realtime';
import { PAGE_SIZE } from '../utils/constants';

/**
 * Paginated + filtered timeline data.
 * Built for many concurrent users:
 *  - server-side pagination (never loads everything)
 *  - stale responses are ignored (fast typing / filter switching)
 *  - live events are debounced into ONE silent refresh instead of a request per event
 */
export default function useMemories(filters) {
  const [s, setS] = useState({ items: [], total: 0, page: 1, hasMore: false, loading: true, loadingMore: false, error: null });
  const itemsRef = useRef([]);
  itemsRef.current = s.items;
  const reqId = useRef(0);
  const key = JSON.stringify(filters);

  const load = useCallback(async (page, { append = false, silent = false, limit } = {}) => {
    const id = ++reqId.current;
    if (!silent) setS((p) => ({ ...p, loading: !append, loadingMore: append, error: null }));
    try {
      const r = await memoryApi.list({ ...JSON.parse(key), page, limit });
      if (id !== reqId.current) return;
      setS((p) => ({
        items: append ? [...p.items, ...r.items.filter((n) => !p.items.some((o) => o.id === n.id))] : r.items,
        total: r.total,
        page: limit ? Math.ceil(r.items.length / PAGE_SIZE) : page,
        hasMore: r.hasMore, loading: false, loadingMore: false, error: null,
      }));
    } catch (e) {
      if (id === reqId.current) setS((p) => ({ ...p, loading: false, loadingMore: false, error: e.message }));
    }
  }, [key]);

  useEffect(() => { load(1); }, [load]);

  const refresh = useCallback(() => {
    const n = Math.ceil((itemsRef.current.length + 1) / PAGE_SIZE) * PAGE_SIZE;
    load(1, { silent: true, limit: n });
  }, [load]);

  // live updates (Socket.IO later)
  useEffect(() => {
    let t;
    const soon = () => { clearTimeout(t); t = setTimeout(refresh, 500); };
    const offs = [realtime.on(EV.PUBLISHED, soon), realtime.on(EV.UPDATED, soon)];
    return () => { clearTimeout(t); offs.forEach((o) => o()); };
  }, [refresh]);

  const loadMore = useCallback(() => {
    setS((p) => {
      if (p.hasMore && !p.loading && !p.loadingMore) load(p.page + 1, { append: true });
      return p;
    });
  }, [load]);

  const toggleLike = useCallback(async (id) => {
    const flip = (m) => (m.id === id ? { ...m, liked: !m.liked, likesCount: m.likesCount + (m.liked ? -1 : 1) } : m);
    setS((p) => ({ ...p, items: p.items.map(flip) })); // optimistic
    try {
      const r = await memoryApi.toggleLike(id);
      setS((p) => ({ ...p, items: p.items.map((m) => (m.id === id ? { ...m, ...r } : m)) }));
    } catch { refresh(); }
  }, [refresh]);

  return { ...s, loadMore, refresh, toggleLike, retry: () => load(1) };
}
