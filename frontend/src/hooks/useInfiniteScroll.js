import { useCallback, useRef } from 'react';

/** Returns a ref-callback for a sentinel element; fires onHit when it nears the viewport. */
export default function useInfiniteScroll(onHit, enabled = true) {
  const cb = useRef(onHit);
  cb.current = onHit;
  const obs = useRef(null);
  return useCallback((node) => {
    obs.current?.disconnect();
    if (!node || !enabled) return;
    obs.current = new IntersectionObserver(([e]) => e.isIntersecting && cb.current(), { rootMargin: '500px' });
    obs.current.observe(node);
  }, [enabled]);
}
